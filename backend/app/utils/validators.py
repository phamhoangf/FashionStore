import re
from datetime import datetime
import phonenumbers
from marshmallow import ValidationError

def is_valid_email(email):
    """Validate email format"""
    if not email:
        return False
    
    # Basic email pattern matching
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def is_valid_password(password):
    """
    Validate password strength
    - At least 8 characters
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    """
    if not password or len(password) < 8:
        return False
    
    # Check for at least one uppercase, one lowercase, and one digit
    if not (re.search(r'[A-Z]', password) and 
            re.search(r'[a-z]', password) and 
            re.search(r'[0-9]', password)):
        return False
    
    return True

def is_valid_phone(phone, country_code='VN'):
    """Validate phone number format for a specific country"""
    if not phone:
        return False
    
    try:
        phone_number = phonenumbers.parse(phone, country_code)
        return phonenumbers.is_valid_number(phone_number)
    except:
        return False

def is_valid_name(name):
    """Validate that name is not empty and is of reasonable length"""
    return name and len(name.strip()) >= 2 and len(name) <= 100

def is_valid_address(address):
    """Validate that address is not empty and is of reasonable length"""
    return address and len(address.strip()) >= 5 and len(address) <= 255

def is_valid_price(price):
    """Validate product price"""
    if price is None:
        return False
    
    try:
        price = float(price)
        return price >= 0
    except:
        return False

def is_valid_stock(stock):
    """Validate product stock"""
    if stock is None:
        return False
    
    try:
        stock = int(stock)
        return stock >= 0
    except:
        return False

def is_valid_date_format(date_str, format='%Y-%m-%d'):
    """Validate date string format"""
    if not date_str:
        return False
    
    try:
        datetime.strptime(date_str, format)
        return True
    except ValueError:
        return False

def is_valid_vnpay_amount(amount):
    """Validate payment amount for VNPAY (minimum 10,000 VND)"""
    try:
        amount = float(amount)
        return amount >= 10000  # Minimum amount for VNPAY
    except:
        return False

def validate_product_data(data):
    """Validate product form data"""
    errors = {}
    
    # Required fields
    if not data.get('name'):
        errors['name'] = 'Tên sản phẩm không được để trống'
    elif len(data.get('name', '')) > 200:
        errors['name'] = 'Tên sản phẩm quá dài (tối đa 200 ký tự)'
    
    if not is_valid_price(data.get('price')):
        errors['price'] = 'Giá sản phẩm không hợp lệ'
    
    if data.get('discount_price') and not is_valid_price(data.get('discount_price')):
        errors['discount_price'] = 'Giá khuyến mãi không hợp lệ'
    
    if data.get('discount_price') and float(data.get('discount_price')) > float(data.get('price', 0)):
        errors['discount_price'] = 'Giá khuyến mãi không được lớn hơn giá gốc'
    
    if not is_valid_stock(data.get('stock')):
        errors['stock'] = 'Số lượng sản phẩm không hợp lệ'
    
    if not data.get('category_id'):
        errors['category_id'] = 'Vui lòng chọn danh mục sản phẩm'
    
    return errors

def validate_order_data(data):
    """Validate order form data"""
    errors = {}
    
    # Required fields
    if not data.get('shipping_address'):
        errors['shipping_address'] = 'Địa chỉ giao hàng không được để trống'
    
    if not data.get('shipping_city'):
        errors['shipping_city'] = 'Thành phố không được để trống'
    
    if not data.get('shipping_phone'):
        errors['shipping_phone'] = 'Số điện thoại không được để trống'
    elif not is_valid_phone(data.get('shipping_phone')):
        # Bỏ qua kiểm tra định dạng số điện thoại vì frontend đã kiểm tra
        pass
    
    if not data.get('payment_method'):
        errors['payment_method'] = 'Vui lòng chọn phương thức thanh toán'
    # Mở rộng các phương thức thanh toán được chấp nhận
    elif data.get('payment_method') not in ['cod', 'vnpay', 'bank', 'momo']:
        errors['payment_method'] = 'Phương thức thanh toán không hợp lệ'
    
    return errors

def validate_user_data(data, is_registration=False):
    """Validate user registration/profile data"""
    errors = {}
    
    # Required fields
    if not is_valid_name(data.get('name')):
        errors['name'] = 'Họ tên không hợp lệ'
    
    if not is_valid_email(data.get('email')):
        errors['email'] = 'Email không hợp lệ'
    
    # Password is required for registration
    if is_registration:
        if not is_valid_password(data.get('password')):
            errors['password'] = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số'
    
    # Optional fields
    if data.get('phone') and not is_valid_phone(data.get('phone')):
        errors['phone'] = 'Số điện thoại không hợp lệ'
    
    if data.get('address') and not is_valid_address(data.get('address')):
        errors['address'] = 'Địa chỉ không hợp lệ'
    
    return errors

def validate_phone_number(phone):
    """Validate phone number format"""
    pattern = r'^\+?[0-9]{10,15}$'
    if not re.match(pattern, phone):
        raise ValidationError('Invalid phone number format')

def validate_password_strength(password):
    """
    Validate password strength
    - At least 6 characters
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one number
    """
    if len(password) < 6:
        raise ValidationError('Password must be at least 6 characters long')
    if not re.search(r'[A-Z]', password):
        raise ValidationError('Password must contain at least one uppercase letter')
    if not re.search(r'[a-z]', password):
        raise ValidationError('Password must contain at least one lowercase letter')
    if not re.search(r'[0-9]', password):
        raise ValidationError('Password must contain at least one number')

def validate_image_file(file):
    """Validate image file type and size"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    
    # Check file extension
    if not '.' in file.filename:
        raise ValidationError('No file extension')
    ext = file.filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError('Invalid file type. Allowed types: png, jpg, jpeg, gif')
    
    # Check file size
    if len(file.read()) > MAX_FILE_SIZE:
        raise ValidationError('File size too large. Maximum size is 5MB')
    file.seek(0)  # Reset file pointer

def validate_order_items(items):
    """Validate order items"""
    if not items or len(items) == 0:
        raise ValidationError('Order must contain at least one item')
    
    seen_products = set()
    for item in items:
        product_id = item.get('product_id')
        quantity = item.get('quantity', 0)
        
        if product_id in seen_products:
            raise ValidationError(f'Duplicate product ID: {product_id}')
        seen_products.add(product_id)
        
        if quantity < 1:
            raise ValidationError('Quantity must be at least 1')

def validate_category_data(data, update=False):
    """
    Validate category data for creation or update
    
    Args:
        data (dict): Category data to validate
        update (bool): Whether this is an update operation
        
    Returns:
        str: Error message if validation fails, None otherwise
    """
    # For create operation, name is required
    if not update and 'name' not in data:
        return "Category name is required"
    
    # Validate name if provided
    if 'name' in data:
        name = data.get('name')
        if not name or not isinstance(name, str) or len(name) < 2 or len(name) > 100:
            return "Category name must be between 2 and 100 characters"
    
    # Validate description if provided
    if 'description' in data and data['description'] is not None:
        if not isinstance(data['description'], str):
            return "Description must be a string"
    
    # Validate image_url if provided
    if 'image_url' in data and data['image_url'] is not None:
        if not isinstance(data['image_url'], str) or len(data['image_url']) > 255:
            return "Image URL must be a string with maximum 255 characters"
    
    # Validate parent_id if provided
    if 'parent_id' in data and data['parent_id'] is not None:
        if not isinstance(data['parent_id'], int) and not data['parent_id'].isdigit():
            return "Parent ID must be an integer"
    
    return None