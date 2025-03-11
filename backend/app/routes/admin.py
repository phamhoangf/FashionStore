from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order, OrderStatus
from app.utils.security import admin_required
from app.services.product_service import ProductService
from app.services.category_service import CategoryService
from app.services.order_service import OrderService
import os
from werkzeug.utils import secure_filename
import uuid

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Kiểm tra quyền admin
@bp.route('/check', methods=['GET'])
@jwt_required()
def check_admin():
    try:
        user_id = get_jwt_identity()
        current_app.logger.info(f"Admin check request from user ID: {user_id}")
        
        # Kiểm tra token và header
        auth_header = request.headers.get('Authorization', '')
        current_app.logger.info(f"Authorization header: {auth_header[:20]}...")
        
        user = User.query.get(user_id)
        
        if not user:
            current_app.logger.error(f"User not found: {user_id}")
            return jsonify({
                "error": "User not found", 
                "message": "Không tìm thấy người dùng",
                "is_admin": False
            }), 404
        
        current_app.logger.info(f"User found: {user.email}, is_admin: {user.is_admin}")
        
        if not user.is_admin:
            current_app.logger.info(f"User {user.email} is not an admin")
            return jsonify({
                "is_admin": False,
                "message": "Bạn không có quyền truy cập trang quản trị"
            }), 403
        
        current_app.logger.info(f"Admin check successful for user {user.email}")
        return jsonify({
            "is_admin": True,
            "user": user.to_dict(),
            "message": "Xác thực quyền admin thành công"
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error in admin check: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            "error": str(e), 
            "message": "Lỗi xác thực quyền admin",
            "is_admin": False
        }), 500

# Quản lý sản phẩm
@bp.route('/products', methods=['GET'])
@jwt_required()
@admin_required
def get_all_products():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)
    search_term = request.args.get('search', '')
    category_id = request.args.get('category', '')
    
    # Start with base query
    query = Product.query
    
    # Apply filters if provided
    if search_term:
        query = query.filter(Product.name.ilike(f'%{search_term}%'))
    
    if category_id and category_id.isdigit():
        category_id = int(category_id)
        # Get the category and all its children
        category = Category.query.get(category_id)
        if category:
            # If the category has children, include products from all child categories
            if category.children:
                # Get all child category IDs
                child_ids = [child.id for child in category.get_all_children()]
                # Include the parent category ID
                all_category_ids = [category_id] + child_ids
                # Filter products by any of these category IDs
                query = query.filter(Product.category_id.in_(all_category_ids))
            else:
                # If no children, just filter by the selected category
                query = query.filter(Product.category_id == category_id)
    
    # Order and paginate
    products = query.order_by(Product.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [p.to_dict() for p in products.items],
        'total': products.total,
        'pages': products.pages,
        'page': page
    }), 200

@bp.route('/products', methods=['POST'])
@jwt_required()
@admin_required
def create_product():
    # Lấy dữ liệu từ form
    name = request.form.get('name')
    description = request.form.get('description')
    price = request.form.get('price', type=float)
    discount_price = request.form.get('discount_price', type=float)
    stock = request.form.get('stock', type=int)
    category_id = request.form.get('category_id', type=int)
    featured = request.form.get('featured', '').lower() == 'true'
    
    # Kiểm tra dữ liệu
    if not name or not price or not category_id:
        return jsonify({'error': 'Thông tin không đầy đủ'}), 400
    
    # Xử lý file ảnh
    image_file = None
    if 'image' in request.files:
        image_file = request.files['image']
    
    # Tạo sản phẩm mới
    try:
        product = ProductService.create_product(
            name=name,
            description=description,
            price=price,
            category_id=category_id,
            discount_price=discount_price,
            stock=stock,
            featured=featured,
            image_file=image_file
        )
        return jsonify(product.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/products/<int:id>', methods=['GET'])
@jwt_required()
@admin_required
def get_product(id):
    try:
        product = ProductService.get_product_by_id(id)
        return jsonify(product.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@bp.route('/products/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_product(id):
    # Lấy dữ liệu từ form
    data = {}
    
    if 'name' in request.form:
        data['name'] = request.form.get('name')
    if 'description' in request.form:
        data['description'] = request.form.get('description')
    if 'price' in request.form:
        data['price'] = float(request.form.get('price'))
    if 'discount_price' in request.form:
        data['discount_price'] = float(request.form.get('discount_price')) if request.form.get('discount_price') else None
    if 'stock' in request.form:
        data['stock'] = int(request.form.get('stock'))
    if 'category_id' in request.form:
        data['category_id'] = int(request.form.get('category_id'))
    if 'featured' in request.form:
        data['featured'] = request.form.get('featured', '').lower() == 'true'
    
    # Xử lý file ảnh
    image_file = None
    if 'image' in request.files:
        image_file = request.files['image']
        if image_file.filename == '':
            image_file = None
    
    # Cập nhật sản phẩm
    try:
        product = ProductService.update_product(id, data, image_file)
        return jsonify(product.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@bp.route('/products/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_product(id):
    try:
        success = ProductService.delete_product(id)
        if success:
            return jsonify({'message': 'Sản phẩm đã được xóa thành công'}), 200
        else:
            return jsonify({'error': 'Không thể xóa sản phẩm'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Quản lý danh mục
@bp.route('/categories', methods=['GET'])
@jwt_required()
@admin_required
def get_all_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories]), 200

@bp.route('/categories/tree', methods=['GET'])
@jwt_required()
@admin_required
def get_category_tree():
    tree = CategoryService.get_category_tree()
    return jsonify(tree), 200

@bp.route('/categories', methods=['POST'])
@jwt_required()
@admin_required
def create_category():
    data = request.get_json()
    
    category, error = CategoryService.create_category(data)
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify(category.to_dict()), 201

@bp.route('/categories/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_category(id):
    data = request.get_json()
    
    category, error = CategoryService.update_category(id, data)
    if error:
        return jsonify({"error": error}), 400
    
    return jsonify(category.to_dict()), 200

@bp.route('/categories/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_category(id):
    success, error = CategoryService.delete_category(id)
    if not success:
        return jsonify({"error": error}), 400
    
    return jsonify({"message": "Danh mục đã được xóa thành công"}), 200

# Quản lý đơn hàng
@bp.route('/orders', methods=['GET'])
@jwt_required()
@admin_required
def get_all_orders():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base query
    query = Order.query
    
    # Filter by status if provided
    if status:
        query = query.filter_by(status=status)
    
    # Filter by date range if provided
    if start_date:
        try:
            from datetime import datetime
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Order.created_at >= start_datetime)
        except Exception as e:
            current_app.logger.error(f"Error parsing start_date: {e}")
    
    if end_date:
        try:
            from datetime import datetime
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Order.created_at <= end_datetime)
        except Exception as e:
            current_app.logger.error(f"Error parsing end_date: {e}")
    
    # Paginate
    orders = query.order_by(Order.created_at.desc()).paginate(page=page, per_page=per_page)
    
    try:
        order_items = [order.to_dict(include_items=False) for order in orders.items]
    except Exception as e:
        current_app.logger.error(f"Error converting orders to dict: {e}")
        order_items = []
    
    return jsonify({
        'items': order_items,
        'total': orders.total,
        'pages': orders.pages,
        'page': page
    }), 200

@bp.route('/orders/<int:id>', methods=['GET'])
@jwt_required()
@admin_required
def get_order(id):
    try:
        order = OrderService.get_order_by_id(id)
        return jsonify(order.to_dict(include_items=True)), 200
    except Exception as e:
        current_app.logger.error(f"Error getting order {id}: {e}")
        return jsonify({"error": str(e)}), 404

@bp.route('/orders/<int:id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def update_order_status(id):
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({"error": "Trạng thái đơn hàng là bắt buộc"}), 400
    
    try:
        order = OrderService.update_order_status(id, data['status'])
        return jsonify(order.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Thống kê
@bp.route('/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def get_dashboard_stats():
    try:
        # Log thông tin người dùng để debug
        user_id = get_jwt_identity()
        current_app.logger.info(f"Dashboard request from user ID: {user_id}")
        
        # Kiểm tra token và header
        auth_header = request.headers.get('Authorization', '')
        current_app.logger.info(f"Authorization header: {auth_header[:20]}...")
        
        # Kiểm tra người dùng
        user = User.query.get(user_id)
        if not user:
            current_app.logger.error(f"User not found: {user_id}")
            return jsonify({
                'error': 'Người dùng không tồn tại',
                'message': 'User not found'
            }), 404
            
        if not user.is_admin:
            current_app.logger.error(f"User {user_id} is not admin")
            return jsonify({
                'error': 'Không có quyền admin',
                'message': 'Admin privileges required'
            }), 403
        
        current_app.logger.info(f"User {user_id} ({user.email}) is admin, proceeding with dashboard data")
        
        # Tổng số sản phẩm
        total_products = Product.query.count()
        current_app.logger.debug(f"Total products: {total_products}")
        
        # Tổng số danh mục
        total_categories = Category.query.count()
        current_app.logger.debug(f"Total categories: {total_categories}")
        
        # Tổng số đơn hàng
        total_orders = Order.query.count()
        current_app.logger.debug(f"Total orders: {total_orders}")
        
        # Tổng số người dùng
        total_users = User.query.count()
        current_app.logger.debug(f"Total users: {total_users}")
        
        # Đơn hàng theo trạng thái
        try:
            pending_orders = Order.query.filter_by(status="pending").count()
            processing_orders = Order.query.filter_by(status="processing").count()
            shipped_orders = Order.query.filter_by(status="shipped").count()
            delivered_orders = Order.query.filter_by(status="delivered").count()
            cancelled_orders = Order.query.filter_by(status="cancelled").count()
        except Exception as e:
            current_app.logger.error(f"Error getting orders by status: {e}")
            pending_orders = processing_orders = shipped_orders = delivered_orders = cancelled_orders = 0
        
        # Tổng doanh thu (từ các đơn hàng đã giao)
        try:
            revenue = db.session.query(db.func.sum(Order.total_amount))\
                .filter(Order.status == "delivered")\
                .scalar() or 0
            current_app.logger.debug(f"Total revenue: {revenue}")
        except Exception as e:
            current_app.logger.error(f"Error calculating revenue: {e}")
            revenue = 0
        
        # Đơn hàng gần đây (10 đơn hàng mới nhất)
        try:
            recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
            recent_orders_data = []
            for order in recent_orders:
                try:
                    order_dict = {
                        'id': order.id,
                        'user_id': order.user_id,
                        'status': order.status,
                        'total_amount': order.total_amount,
                        'created_at': order.created_at.isoformat() if order.created_at else None
                    }
                    recent_orders_data.append(order_dict)
                except Exception as e:
                    current_app.logger.error(f"Error converting order to dict: {e}")
        except Exception as e:
            current_app.logger.error(f"Error getting recent orders: {e}")
            recent_orders_data = []
        
        current_app.logger.info(f"Dashboard data successfully retrieved for user {user_id}")
        
        response_data = {
            'total_products': total_products,
            'total_categories': total_categories,
            'total_orders': total_orders,
            'total_users': total_users,
            'orders_by_status': {
                'pending': pending_orders,
                'processing': processing_orders,
                'shipped': shipped_orders,
                'delivered': delivered_orders,
                'cancelled': cancelled_orders
            },
            'revenue': revenue,
            'recent_orders': recent_orders_data
        }
        
        current_app.logger.debug(f"Returning dashboard data: {response_data}")
        return jsonify(response_data), 200
    except Exception as e:
        current_app.logger.error(f"Error in dashboard: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        
        return jsonify({
            'error': 'Không thể tải dữ liệu bảng điều khiển',
            'message': str(e),
            'total_products': 0,
            'total_categories': 0,
            'total_orders': 0,
            'total_users': 0,
            'orders_by_status': {},
            'revenue': 0,
            'recent_orders': []
        }), 500

# Quản lý người dùng
@bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    search_term = request.args.get('search', '')
    
    # Start with base query
    query = User.query
    
    # Apply search filter if provided
    if search_term:
        query = query.filter(
            (User.email.ilike(f'%{search_term}%')) | 
            (User.first_name.ilike(f'%{search_term}%')) | 
            (User.last_name.ilike(f'%{search_term}%'))
        )
    
    # Order and paginate
    users = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [u.to_dict() for u in users.items],
        'total': users.total,
        'pages': users.pages,
        'page': page
    }), 200

@bp.route('/users/<int:id>/admin-status', methods=['PUT'])
@jwt_required()
@admin_required
def update_user_admin_status(id):
    data = request.get_json()
    is_admin = data.get('is_admin', False)
    
    user = User.query.get_or_404(id)
    
    # Prevent self-demotion
    current_user_id = get_jwt_identity()
    if int(current_user_id) == id and not is_admin:
        return jsonify({
            'error': 'Cannot remove admin status from yourself'
        }), 400
    
    user.is_admin = is_admin
    db.session.commit()
    
    return jsonify({
        'message': f"User {user.email} admin status updated to {is_admin}",
        'user': user.to_dict()
    }), 200 