import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI') or 'mysql://username:password@localhost/ecommerce'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    CORS_HEADERS = 'Content-Type'
    
    # Cấu hình thư mục uploads
    BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    
    # Tạo thư mục uploads trong thư mục static
    STATIC_FOLDER = os.path.join(BASE_DIR, 'static')
    UPLOAD_FOLDER = os.path.join(STATIC_FOLDER, 'uploads')
    
    # Đảm bảo thư mục tồn tại
    os.makedirs(STATIC_FOLDER, exist_ok=True)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Giới hạn kích thước upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    # VNPAY Configuration
    VNPAY_TMN_CODE = os.environ.get('VNPAY_TMN_CODE') or 'your-tmn-code'
    VNPAY_HASH_SECRET_KEY = os.environ.get('VNPAY_HASH_SECRET_KEY') or 'your-hash-secret'
    VNPAY_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
    VNPAY_RETURN_URL = os.environ.get('VNPAY_RETURN_URL') or 'http://localhost:5000/api/payment/vnpay-return'
    VNPAY_API_URL = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'