from app.models.user import User
from app import db
from flask_jwt_extended import create_access_token, create_refresh_token
from app.utils.security import generate_password_hash, check_password_hash

class AuthService:
    @staticmethod
    def register_user(name, email, password, phone=None, address=None, city=None):
        """
        Đăng ký người dùng mới
        
        Args:
            name (str): Tên người dùng
            email (str): Email
            password (str): Mật khẩu
            phone (str, optional): Số điện thoại
            address (str, optional): Địa chỉ
            city (str, optional): Thành phố
        
        Returns:
            tuple: (user, access_token, refresh_token)
        
        Raises:
            ValueError: Nếu email đã tồn tại
        """
        # Kiểm tra email đã tồn tại chưa
        if User.query.filter_by(email=email).first():
            raise ValueError('Email đã được sử dụng')
        
        # Tạo user mới
        user = User(
            name=name,
            email=email,
            password=generate_password_hash(password),
            phone=phone,
            address=address,
            city=city
        )
        
        # Lưu vào database
        db.session.add(user)
        db.session.commit()
        
        # Tạo token
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return user, access_token, refresh_token
    
    @staticmethod
    def authenticate_user(email, password):
        """
        Xác thực người dùng
        
        Args:
            email (str): Email
            password (str): Mật khẩu
        
        Returns:
            tuple: (user, access_token, refresh_token) nếu xác thực thành công, None nếu thất bại
        """
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password, password):
            return None
        
        # Tạo token
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return user, access_token, refresh_token