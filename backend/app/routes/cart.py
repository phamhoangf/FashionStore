from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request, JWTManager
from app import db
from app.models.cart import Cart, CartItem
from app.models.product import Product
from flask_jwt_extended.exceptions import NoAuthorizationError, InvalidHeaderError, JWTDecodeError

bp = Blueprint('cart', __name__, url_prefix='/api/cart')

@bp.route('', methods=['GET'])
def get_cart():
    try:
        # Xác thực JWT thủ công
        verify_jwt_in_request()
        
        # Lấy user_id từ token
        user_id = get_jwt_identity()
        current_app.logger.info(f"User ID from JWT: {user_id}")
        
        # Tìm hoặc tạo giỏ hàng cho user
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()
        
        # Lấy các sản phẩm trong giỏ hàng
        cart_items = CartItem.query.filter_by(user_id=user_id, cart_id=cart.id).all()
        
        # Đảm bảo mỗi item có dữ liệu sản phẩm đầy đủ
        items_data = []
        for item in cart_items:
            item_dict = item.to_dict()
            # Kiểm tra xem sản phẩm có tồn tại không
            if item.product:
                # Log thông tin sản phẩm để debug
                current_app.logger.info(f"Product in cart: {item.product.id} - {item.product.name} - Image: {item.product.image_url}")
            else:
                current_app.logger.error(f"Missing product data for cart item: {item.id}")
            
            items_data.append(item_dict)
        
        total = sum(item.product.price * item.quantity for item in cart_items if item.product)
        
        return jsonify({
            'items': items_data,
            'total': total,
            'total_items': sum(item.quantity for item in cart_items)
        }), 200
    except NoAuthorizationError:
        current_app.logger.error("No Authorization header found")
        return jsonify({'error': 'No Authorization header found'}), 401
    except InvalidHeaderError:
        current_app.logger.error("Invalid Authorization header")
        return jsonify({'error': 'Invalid Authorization header'}), 401
    except JWTDecodeError:
        current_app.logger.error("Invalid JWT token")
        return jsonify({'error': 'Invalid JWT token'}), 401
    except Exception as e:
        current_app.logger.error(f"Error in get_cart: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/items', methods=['POST'])
def add_to_cart():
    try:
        # Xác thực JWT thủ công
        verify_jwt_in_request()
        
        # Lấy user_id từ token
        user_id = get_jwt_identity()
        current_app.logger.info(f"User ID from JWT: {user_id}")
        
        data = request.get_json()
        current_app.logger.info(f"Request data: {data}")
        
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        # Kiểm tra sản phẩm
        if not product_id:
            return jsonify({'error': 'Product ID is required'}), 400
        
        product = Product.query.get_or_404(product_id)
        
        # Kiểm tra số lượng
        if quantity <= 0:
            return jsonify({'error': 'Quantity must be greater than 0'}), 400
        
        # Kiểm tra tồn kho
        if product.stock < quantity:
            return jsonify({'error': 'Not enough stock'}), 400
        
        # Tìm hoặc tạo giỏ hàng cho user
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()  # Commit ngay để có cart.id
        
        # Kiểm tra sản phẩm đã có trong giỏ hàng chưa
        cart_item = CartItem.query.filter_by(user_id=user_id, product_id=product_id, cart_id=cart.id).first()
        
        if cart_item:
            # Cập nhật số lượng
            cart_item.quantity += quantity
        else:
            # Thêm sản phẩm mới vào giỏ hàng
            cart_item = CartItem(
                user_id=user_id,
                product_id=product_id,
                cart_id=cart.id,
                quantity=quantity
            )
            db.session.add(cart_item)
        
        db.session.commit()
        
        # Lấy các sản phẩm trong giỏ hàng
        cart_items = CartItem.query.filter_by(user_id=user_id, cart_id=cart.id).all()
        total = sum(item.product.price * item.quantity for item in cart_items if item.product)
        
        return jsonify({
            'items': [item.to_dict() for item in cart_items],
            'total': total,
            'total_items': sum(item.quantity for item in cart_items)
        }), 201
    except NoAuthorizationError:
        current_app.logger.error("No Authorization header found")
        return jsonify({'error': 'No Authorization header found'}), 401
    except InvalidHeaderError:
        current_app.logger.error("Invalid Authorization header")
        return jsonify({'error': 'Invalid Authorization header'}), 401
    except JWTDecodeError:
        current_app.logger.error("Invalid JWT token")
        return jsonify({'error': 'Invalid JWT token'}), 401
    except Exception as e:
        current_app.logger.error(f"Error in add_to_cart: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/items/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    quantity = data.get('quantity')
    
    # Kiểm tra số lượng
    if not quantity or quantity <= 0:
        return jsonify({'error': 'Quantity must be greater than 0'}), 400
    
    # Tìm sản phẩm trong giỏ hàng
    cart_item = CartItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()
    
    # Kiểm tra tồn kho
    if cart_item.product.stock < quantity:
        return jsonify({'error': 'Not enough stock'}), 400
    
    # Cập nhật số lượng
    cart_item.quantity = quantity
    db.session.commit()
    
    # Lấy các sản phẩm trong giỏ hàng
    cart = Cart.query.filter_by(user_id=user_id).first()
    cart_items = CartItem.query.filter_by(user_id=user_id, cart_id=cart.id).all()
    total = sum(item.product.price * item.quantity for item in cart_items if item.product)
    
    return jsonify({
        'items': [item.to_dict() for item in cart_items],
        'total': total,
        'total_items': sum(item.quantity for item in cart_items)
    }), 200

@bp.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    user_id = get_jwt_identity()
    
    # Tìm sản phẩm trong giỏ hàng
    cart_item = CartItem.query.filter_by(id=item_id, user_id=user_id).first_or_404()
    
    # Xóa sản phẩm khỏi giỏ hàng
    db.session.delete(cart_item)
    db.session.commit()
    
    # Lấy các sản phẩm trong giỏ hàng
    cart = Cart.query.filter_by(user_id=user_id).first()
    cart_items = CartItem.query.filter_by(user_id=user_id, cart_id=cart.id).all() if cart else []
    total = sum(item.product.price * item.quantity for item in cart_items if item.product)
    
    return jsonify({
        'items': [item.to_dict() for item in cart_items],
        'total': total,
        'total_items': sum(item.quantity for item in cart_items)
    }), 200