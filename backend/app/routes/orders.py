from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.cart import CartItem
from app.models.user import User
from app.services.order_service import OrderService
from app.utils.security import admin_required
from app.utils.validators import validate_order_data

bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@bp.route('', methods=['GET'])
@jwt_required()
def get_orders():
    user_id = get_jwt_identity()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    
    # Lấy danh sách đơn hàng của user
    orders = Order.query.filter_by(user_id=user_id)\
                .order_by(Order.created_at.desc())\
                .paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [order.to_dict() for order in orders.items],
        'total': orders.total,
        'pages': orders.pages,
        'page': page
    }), 200

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_order(id):
    user_id = get_jwt_identity()
    
    # Lấy thông tin đơn hàng
    order = OrderService.get_order_by_id(id)
    
    # Kiểm tra quyền truy cập
    if order.user_id != user_id:
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({"error": "Không có quyền truy cập đơn hàng này"}), 403
    
    return jsonify(order.to_dict()), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Chuyển đổi dữ liệu từ frontend sang định dạng backend mong đợi
        if 'shippingInfo' in data:
            shipping_info = data['shippingInfo']
            order_data = {
                'shipping_address': f"{shipping_info.get('address')}, {shipping_info.get('ward')}, {shipping_info.get('district')}",
                'shipping_city': shipping_info.get('city'),
                'shipping_phone': shipping_info.get('phone'),
                'payment_method': data.get('paymentMethod') or shipping_info.get('paymentMethod'),
                'notes': shipping_info.get('notes', '')
            }
        else:
            # Nếu dữ liệu đã đúng định dạng backend
            order_data = {
                'shipping_address': data.get('shipping_address'),
                'shipping_city': data.get('shipping_city'),
                'shipping_phone': data.get('shipping_phone'),
                'payment_method': data.get('payment_method'),
                'notes': data.get('notes', '')
            }
        
        # Validate dữ liệu đơn hàng
        errors = validate_order_data(order_data)
        if errors:
            return jsonify({"error": str(errors)}), 400
        
        # Lấy thông tin giỏ hàng
        if 'items' in data:
            # Tạo đơn hàng từ danh sách sản phẩm được gửi lên
            cart_items = []
            for item_data in data['items']:
                product_id = item_data.get('productId') or item_data.get('product_id')
                cart_item = CartItem.query.filter_by(
                    user_id=user_id, 
                    product_id=product_id
                ).first()
                
                if cart_item:
                    cart_items.append(cart_item)
        else:
            # Tạo đơn hàng từ toàn bộ giỏ hàng
            cart_items = CartItem.query.filter_by(user_id=user_id).all()
        
        if not cart_items:
            return jsonify({"error": "Giỏ hàng trống"}), 400
        
        # Tạo đơn hàng
        order = OrderService.create_order_from_cart(
            user_id=user_id,
            cart_items=cart_items,
            shipping_address=order_data['shipping_address'],
            shipping_city=order_data['shipping_city'],
            shipping_phone=order_data['shipping_phone'],
            payment_method=order_data['payment_method'],
            notes=order_data['notes']
        )
        
        # Trả về thông tin đơn hàng
        return jsonify(order.to_dict()), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/<int:id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(id):
    user_id = get_jwt_identity()
    
    # Lấy thông tin đơn hàng
    order = OrderService.get_order_by_id(id)
    
    # Kiểm tra quyền truy cập
    if order.user_id != user_id:
        return jsonify({"error": "Không có quyền hủy đơn hàng này"}), 403
    
    # Kiểm tra trạng thái đơn hàng
    if order.status != OrderStatus.PENDING.value:
        return jsonify({"error": "Chỉ có thể hủy đơn hàng đang chờ xử lý"}), 400
    
    try:
        # Cập nhật trạng thái đơn hàng
        order = OrderService.update_order_status(id, OrderStatus.CANCELLED.value)
        return jsonify(order.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/admin', methods=['GET'])
@jwt_required()
@admin_required
def admin_get_orders():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    status = request.args.get('status')
    
    # Base query
    query = Order.query
    
    # Filter by status if provided
    if status:
        query = query.filter_by(status=status)
    
    # Paginate
    orders = query.order_by(Order.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [order.to_dict() for order in orders.items],
        'total': orders.total,
        'pages': orders.pages,
        'page': page
    }), 200

@bp.route('/admin/<int:id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def admin_update_order_status(id):
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({"error": "Trạng thái đơn hàng là bắt buộc"}), 400
    
    try:
        # Cập nhật trạng thái đơn hàng
        order = OrderService.update_order_status(id, data['status'])
        return jsonify(order.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400