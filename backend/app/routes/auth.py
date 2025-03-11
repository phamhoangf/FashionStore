from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Kiểm tra email đã tồn tại chưa
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'error': 'Email đã được sử dụng'}), 400
    
    # Tạo user mới
    user = User(
        name=data.get('name'),
        email=data.get('email'),
        phone=data.get('phone', ''),
        address=data.get('address', ''),
        city=data.get('city', '')
    )
    user.password = data.get('password')  # Sẽ tự động mã hóa qua setter
    
    db.session.add(user)
    db.session.commit()
    
    # Tạo token
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201

@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Không có dữ liệu được gửi lên'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email và mật khẩu là bắt buộc'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.verify_password(password):
            return jsonify({'error': 'Email hoặc mật khẩu không đúng'}), 401
        
        # Tạo token
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Lỗi đăng nhập, vui lòng thử lại sau'}), 500

@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    # Đảm bảo identity là string
    if not isinstance(identity, str):
        identity = str(identity)
    access_token = create_access_token(identity=identity)
    
    return jsonify({'access_token': access_token}), 200

@bp.route('/status', methods=['GET'])
@jwt_required()
def status():
    try:
        user_id = get_jwt_identity()
        print(f"User ID from token: {user_id}, type: {type(user_id)}")
        
        # Chuyển đổi user_id thành int nếu nó là string
        if isinstance(user_id, str) and user_id.isdigit():
            user_id = int(user_id)
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    except Exception as e:
        print(f"Status check error: {str(e)}")
        return jsonify({'error': f'Lỗi kiểm tra trạng thái: {str(e)}'}), 500

@bp.route('/logout', methods=['POST'])
def logout():
    # Phía client cần xóa token
    return jsonify({'message': 'Đăng xuất thành công'}), 200