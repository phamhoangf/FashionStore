import jwt
from flask import current_app, request, jsonify
from datetime import datetime, timedelta
import uuid
import hmac
import hashlib
import urllib.parse
import bcrypt
from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

def generate_password_hash(password):
    """Generate a password hash using bcrypt"""
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

def check_password_hash(password_hash, password):
    """Check if password matches the hash"""
    if isinstance(password_hash, str):
        password_hash = password_hash.encode('utf-8')
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.checkpw(password, password_hash)

def admin_required(fn):
    """Decorator to require admin role for a route"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            # Chuyển đổi user_id thành int nếu nó là string
            if isinstance(user_id, str) and user_id.isdigit():
                user_id = int(user_id)
            
            # Import here to avoid circular imports
            from app.models.user import User
            
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
                
            if not user.is_admin:
                return jsonify({"error": "Admin privileges required"}), 403
                
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": f"Authentication error: {str(e)}"}), 401
    return wrapper

def generate_token(user_id, expires_delta=None):
    """Generate JWT token for user authentication"""
    payload = {'user_id': user_id, 'exp': datetime.utcnow() + (expires_delta or timedelta(days=1))}
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def decode_token(token):
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# VNPAY utility functions
def hmacsha512(key, data):
    byteKey = key.encode('utf-8')
    byteData = data.encode('utf-8')
    return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()

def create_vnpay_payment(order_id, amount, order_desc, bank_code=None):
    """Create a VNPAY payment URL"""
    try:
        vnp = {}
        vnp['vnp_Version'] = '2.1.0'
        vnp['vnp_Command'] = 'pay'
        vnp['vnp_TmnCode'] = current_app.config['VNPAY_TMN_CODE']
        vnp['vnp_Amount'] = int(amount * 100)  # Convert to smallest currency unit (e.g., cents)
        vnp['vnp_CurrCode'] = 'VND'
        if bank_code:
            vnp['vnp_BankCode'] = bank_code
        vnp['vnp_TxnRef'] = str(order_id)
        vnp['vnp_OrderInfo'] = order_desc
        vnp['vnp_OrderType'] = 'fashion'
        vnp['vnp_Locale'] = 'vn'
        vnp['vnp_ReturnUrl'] = current_app.config['VNPAY_RETURN_URL']
        vnp['vnp_IpAddr'] = request.remote_addr or '127.0.0.1'  # Get client IP if available
        vnp['vnp_CreateDate'] = datetime.now().strftime('%Y%m%d%H%M%S')
        
        # Sort parameters by key before creating signature
        input_data = sorted(vnp.items())
        query = ''
        for key, val in input_data:
            if query != '':
                query += '&' + key + '=' + urllib.parse.quote_plus(str(val))
            else:
                query = key + '=' + urllib.parse.quote_plus(str(val))
        
        # Create signature
        vnp['vnp_SecureHash'] = hmacsha512(current_app.config['VNPAY_HASH_SECRET_KEY'], query)
        
        # Return the full VNPAY URL
        payment_url = current_app.config['VNPAY_PAYMENT_URL'] + '?' + query + '&vnp_SecureHash=' + vnp['vnp_SecureHash']
            
        # Log the generated URL
        current_app.logger.info(f"Generated VNPay URL for order {order_id}: {payment_url[:100]}...")
            
        return payment_url
    except Exception as e:
        current_app.logger.error(f"Error generating VNPay URL for order {order_id}: {str(e)}")
        raise ValueError(f"Không thể tạo URL thanh toán: {str(e)}")

def validate_vnpay_response(vnp_params):
    """Validate response from VNPAY after payment"""
    # Remove vnp_SecureHash from the parameters
    secure_hash = vnp_params.pop('vnp_SecureHash', '')
    
    # Sort remaining parameters and create data string for verification
    input_data = sorted(vnp_params.items())
    query = ''
    for key, val in input_data:
        if query != '':
            query += '&' + key + '=' + urllib.parse.quote_plus(str(val))
        else:
            query = key + '=' + urllib.parse.quote_plus(str(val))
    
    # Compare the calculated hash with the hash from VNPAY
    calculated_hash = hmacsha512(current_app.config['VNPAY_HASH_SECRET_KEY'], query)
    
    return secure_hash == calculated_hash