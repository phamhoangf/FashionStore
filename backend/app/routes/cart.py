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
        size = data.get('size', '')
        
        # Ghi log thông tin chi tiết
        current_app.logger.info(f"Adding to cart: product_id={product_id}, quantity={quantity}, size={size}")
        
        # Kiểm tra sản phẩm
        if not product_id:
            current_app.logger.error("Product ID is required")
            return jsonify({'error': 'Product ID is required'}), 400
        
        product = Product.query.get(product_id)
        if not product:
            current_app.logger.error(f"Product with ID {product_id} not found")
            return jsonify({'error': f'Product with ID {product_id} not found'}), 404
            
        # Ghi log thông tin sản phẩm tìm được
        current_app.logger.info(f"Found product: {product.id} - {product.name} - Sizes: {product.sizes}")
        
        # Kiểm tra size - cải thiện các kiểm tra để đảm bảo không có ngoại lệ
        if product.sizes:
            # Nếu product.sizes là một chuỗi, chuyển đổi thành list
            sizes_list = []
            if isinstance(product.sizes, str):
                try:
                    # Nếu lưu dưới dạng chuỗi JSON
                    import json
                    sizes_list = json.loads(product.sizes)
                except:
                    # Nếu không phải chuỗi JSON, có thể là dạng phân tách bằng dấu phẩy
                    sizes_list = [s.strip() for s in product.sizes.split(',') if s.strip()]
            elif isinstance(product.sizes, list):
                sizes_list = product.sizes
                
            current_app.logger.info(f"Product sizes parsed: {sizes_list}")
            
            if sizes_list and not size:
                current_app.logger.error("Size is required for this product")
                return jsonify({'error': 'Vui lòng chọn kích thước'}), 400
            
            if sizes_list and size and size not in sizes_list:
                current_app.logger.error(f"Invalid size: {size}. Available sizes: {sizes_list}")
                return jsonify({'error': f'Kích thước không hợp lệ. Các kích thước có sẵn: {", ".join(sizes_list)}'}), 400
            
        # Kiểm tra số lượng
        if quantity <= 0:
            current_app.logger.error("Quantity must be greater than 0")
            return jsonify({'error': 'Quantity must be greater than 0'}), 400
        
        # Kiểm tra tồn kho
        if product.stock is not None and product.stock < quantity:
            current_app.logger.error(f"Not enough stock. Requested: {quantity}, Available: {product.stock}")
            return jsonify({'error': 'Not enough stock'}), 400
        
        # Tìm hoặc tạo giỏ hàng cho user
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            current_app.logger.info(f"Creating new cart for user {user_id}")
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()  # Commit ngay để có cart.id
        
        # Kiểm tra sản phẩm đã có trong giỏ hàng chưa, theo cả sản phẩm và size
        cart_item = CartItem.query.filter_by(
            user_id=user_id, 
            product_id=product_id, 
            cart_id=cart.id,
            size=size
        ).first()
        
        if cart_item:
            # Cập nhật số lượng
            current_app.logger.info(f"Updating existing cart item: {cart_item.id}, old quantity: {cart_item.quantity}, new quantity: {cart_item.quantity + quantity}")
            cart_item.quantity += quantity
        else:
            # Thêm sản phẩm mới vào giỏ hàng
            current_app.logger.info(f"Adding new item to cart: product_id={product_id}, quantity={quantity}, size={size}")
            cart_item = CartItem(
                user_id=user_id,
                product_id=product_id,
                cart_id=cart.id,
                quantity=quantity,
                size=size
            )
            db.session.add(cart_item)
        
        db.session.commit()
        
        # Lấy các sản phẩm trong giỏ hàng
        cart_items = CartItem.query.filter_by(user_id=user_id, cart_id=cart.id).all()
        total = sum(item.product.price * item.quantity for item in cart_items if item.product)
        
        return jsonify({
            'item': cart_item.to_dict(),
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
        # Log additional debugging info
        import traceback
        current_app.logger.error(f"Exception traceback: {traceback.format_exc()}")
        db.session.rollback()  # Rollback any failed transaction
        return jsonify({'error': f'Lỗi hệ thống: {str(e)}'}), 500

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

@bp.route('/items/<int:item_id>/size', methods=['PUT'])
@jwt_required()
def update_cart_item_size(item_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        new_size = data.get('size')
        
        # Validate size
        if not new_size:
            return jsonify({'error': 'Size is required'}), 400
        
        # Find cart item
        cart_item = CartItem.query.filter_by(id=item_id, user_id=user_id).first()
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404
        
        # Check if product exists and has sizes
        if not cart_item.product:
            return jsonify({'error': 'Product not found'}), 404
            
        # Validate that size is valid for this product (if product has defined sizes)
        if cart_item.product.sizes and new_size not in cart_item.product.sizes:
            return jsonify({'error': f'Invalid size. Available sizes: {", ".join(cart_item.product.sizes)}'}), 400
        
        # Check if an item with same product and size already exists
        existing_item = CartItem.query.filter_by(
            user_id=user_id,
            product_id=cart_item.product_id,
            cart_id=cart_item.cart_id,
            size=new_size
        ).first()
        
        if existing_item and existing_item.id != item_id:
            # Merge quantities if item with new size already exists
            existing_item.quantity += cart_item.quantity
            db.session.delete(cart_item)
        else:
            # Update size
            cart_item.size = new_size
        
        db.session.commit()
        
        # Get all cart items
        cart = Cart.query.filter_by(user_id=user_id).first()
        cart_items = CartItem.query.filter_by(user_id=user_id, cart_id=cart.id).all()
        total = sum(item.product.price * item.quantity for item in cart_items if item.product)
        
        return jsonify({
            'items': [item.to_dict() for item in cart_items],
            'total': total,
            'total_items': sum(item.quantity for item in cart_items)
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in update_cart_item_size: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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

@bp.route('', methods=['DELETE'])
@jwt_required()
def clear_cart():
    try:
        user_id = get_jwt_identity()
        
        # Tìm giỏ hàng của người dùng
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            return jsonify({'message': 'Giỏ hàng trống'}), 200
        
        # Xóa tất cả các CartItem của người dùng
        CartItem.query.filter_by(user_id=user_id, cart_id=cart.id).delete()
        db.session.commit()
        
        current_app.logger.info(f"Cleared all items from cart for user: {user_id}")
        
        return jsonify({
            'message': 'Giỏ hàng đã được xóa thành công',
            'items': [],
            'total': 0,
            'total_items': 0
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in clear_cart: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500