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

@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        
        data = request.get_json()
        
        # Cập nhật thông tin
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'address' in data:
            user.address = data['address']
        
        db.session.commit()
        
        return jsonify({'user': user.to_dict(), 'message': 'Cập nhật thông tin thành công'}), 200
    except Exception as e:
        print(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Lỗi cập nhật thông tin, vui lòng thử lại sau'}), 500

@bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'}), 400
        
        # Kiểm tra mật khẩu hiện tại
        if not user.verify_password(current_password):
            return jsonify({'error': 'Mật khẩu hiện tại không đúng'}), 400
        
        # Cập nhật mật khẩu mới
        user.password = new_password
        db.session.commit()
        
        return jsonify({'message': 'Thay đổi mật khẩu thành công'}), 200
    except Exception as e:
        print(f"Change password error: {str(e)}")
        return jsonify({'error': 'Lỗi thay đổi mật khẩu, vui lòng thử lại sau'}), 500

@bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Người dùng không tồn tại'}), 404
        
        if 'avatar' not in request.files:
            return jsonify({'error': 'Không tìm thấy file ảnh đại diện'}), 400
        
        avatar_file = request.files['avatar']
        
        if avatar_file.filename == '':
            return jsonify({'error': 'Không có file nào được chọn'}), 400
        
        # Xử lý lưu file ảnh đại diện
        # TODO: Implement file upload logic
        
        # Cập nhật đường dẫn ảnh đại diện cho user
        # user.avatar_url = avatar_path
        # db.session.commit()
        
        return jsonify({'user': user.to_dict(), 'message': 'Cập nhật ảnh đại diện thành công'}), 200
    except Exception as e:
        print(f"Upload avatar error: {str(e)}")
        return jsonify({'error': 'Lỗi tải lên ảnh đại diện, vui lòng thử lại sau'}), 500