from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from .config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Đảm bảo thư mục upload tồn tại
    upload_folder = app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    app.logger.info(f"Upload folder path: {upload_folder}")
    app.logger.info(f"Upload folder exists: {os.path.exists(upload_folder)}")

    # Kiểm tra quyền truy cập thư mục uploads
    try:
        test_file_path = os.path.join(upload_folder, 'test_write_access.txt')
        with open(test_file_path, 'w') as f:
            f.write('Test write access')
        os.remove(test_file_path)
        app.logger.info(f"Upload folder is writable")
    except Exception as e:
        app.logger.error(f"Upload folder is not writable: {str(e)}")

    # Hiển thị danh sách file trong thư mục uploads
    try:
        files = os.listdir(upload_folder)
        app.logger.info(f"Files in upload folder: {files}")
    except Exception as e:
        app.logger.error(f"Cannot list files in upload folder: {str(e)}")
    
    # Khởi tạo extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Cấu hình JWT
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    # Đảm bảo subject luôn là string
    app.config['JWT_DECODE_AUDIENCE'] = None  # Đặt audience là None để tránh lỗi
    app.config['JWT_DECODE_LEEWAY'] = 10  # Thêm 10 giây leeway cho token expiration
    app.config['JWT_ALGORITHM'] = 'HS256'  # Chỉ định thuật toán mã hóa
    app.config['JWT_IDENTITY_CLAIM'] = 'user_id'  # Chỉ định claim chứa identity
    jwt.init_app(app)
    
    # Xử lý lỗi JWT
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        app.logger.error(f"Invalid token: {error}")
        try:
            # Log thêm thông tin về request
            app.logger.error(f"Request path: {request.path}")
            app.logger.error(f"Request headers: {dict(request.headers)}")
        except Exception as e:
            app.logger.error(f"Error logging request details: {e}")
        return jsonify({
            'error': 'Invalid token',
            'message': f"Token không hợp lệ: {str(error)}"
        }), 401
    
    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        app.logger.error(f"Missing Authorization header: {error}")
        try:
            # Log thêm thông tin về request
            app.logger.error(f"Request path: {request.path}")
            app.logger.error(f"Request headers: {dict(request.headers)}")
        except Exception as e:
            app.logger.error(f"Error logging request details: {e}")
        return jsonify({
            'error': 'Missing Authorization header',
            'message': f"Thiếu header Authorization: {str(error)}"
        }), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        app.logger.error(f"Token has expired")
        try:
            app.logger.error(f"JWT header: {jwt_header}")
            app.logger.error(f"JWT payload: {jwt_payload}")
            # Log thêm thông tin về request
            app.logger.error(f"Request path: {request.path}")
        except Exception as e:
            app.logger.error(f"Error logging request details: {e}")
        return jsonify({
            'error': 'Token has expired',
            'message': 'Token đã hết hạn, vui lòng đăng nhập lại'
        }), 401
    
    # Cấu hình CORS - cho phép Frontend truy cập API
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    
    # Import và đăng ký blueprint
    from app.routes import auth, products, categories, cart, orders, payment, admin, debug
    
    app.register_blueprint(auth.bp)
    app.register_blueprint(products.bp)
    app.register_blueprint(categories.bp)
    app.register_blueprint(cart.bp)
    app.register_blueprint(orders.bp)
    app.register_blueprint(payment.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(debug.bp)
    
    # Route đơn giản để phục vụ file ảnh từ thư mục uploads
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        app.logger.info(f"Serving file: {filename}")
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    # Route API để phục vụ file ảnh từ thư mục uploads
    @app.route('/api/uploads/<path:filename>')
    def serve_upload_api(filename):
        app.logger.info(f"Serving file via API: {filename}")
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    # Phục vụ file tĩnh từ thư mục static
    @app.route('/static/<path:filename>')
    def serve_static(filename):
        app.logger.info(f"Serving static file: {filename}")
        return send_from_directory(app.static_folder, filename)
    
    # Tạo bảng database khi khởi chạy
    with app.app_context():
        db.create_all()
        
        # Log thông tin về thư mục uploads
        app.logger.info(f"Upload folder path: {app.config['UPLOAD_FOLDER']}")
        app.logger.info(f"Upload folder exists: {os.path.exists(app.config['UPLOAD_FOLDER'])}")
    
    return app