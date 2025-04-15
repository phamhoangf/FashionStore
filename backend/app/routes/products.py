from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.product import Product
from app.models.category import Category
import os
from werkzeug.utils import secure_filename
import uuid
from sqlalchemy import or_

bp = Blueprint('products', __name__, url_prefix='/api/products')

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('', methods=['GET'])
def get_products():
    # Xử lý tham số filter
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    category_id = request.args.get('category', type=int)
    subcategory_id = request.args.get('subcategory_id', type=int)
    featured = request.args.get('featured', type=bool)
    search = request.args.get('search', '')
    sort = request.args.get('sort', 'newest')
    
    # Log các tham số tìm kiếm để debug
    current_app.logger.info(f"Search params: page={page}, per_page={per_page}, category_id={category_id}, subcategory_id={subcategory_id}, featured={featured}, search='{search}', sort={sort}")
    
    # Base query
    query = Product.query
    
    # Apply filters
    if subcategory_id:
        # Nếu có subcategory_id, ưu tiên lọc theo subcategory_id
        query = query.filter_by(category_id=subcategory_id)
        current_app.logger.info(f"Filtering by subcategory_id: {subcategory_id}")
    elif category_id:
        # Lấy danh mục theo ID
        category = Category.query.get(category_id)
        if category:
            # Nếu danh mục có danh mục con
            if category.children:
                # Lấy tất cả ID của danh mục con (bao gồm cả danh mục hiện tại)
                category_ids = [category.id]
                for child in category.children:
                    category_ids.append(child.id)
                # Lọc sản phẩm theo danh sách ID danh mục
                query = query.filter(Product.category_id.in_(category_ids))
            else:
                # Nếu không có danh mục con, chỉ lọc theo danh mục hiện tại
                query = query.filter_by(category_id=category_id)
        
    if featured is not None:
        query = query.filter_by(featured=featured)
        
    if search:
        # Đơn giản hóa logic tìm kiếm
        search_terms = search.strip().lower().split()
        if search_terms:
            # Tạo điều kiện tìm kiếm cho mỗi từ khóa (tìm kiếm AND)
            search_filter = Product.name.ilike(f'%{search}%')
            # Nếu có nhiều từ khóa, thêm điều kiện OR cho mỗi từ
            if len(search_terms) > 1:
                for term in search_terms:
                    if len(term) > 2:  # Bỏ qua các từ quá ngắn
                        search_filter = or_(search_filter, Product.name.ilike(f'%{term}%'))
            # Áp dụng bộ lọc
            query = query.filter(search_filter)
            current_app.logger.info(f"Searching for terms: {search_terms}")
    
    # Apply sorting
    if sort == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Product.price.desc())
    elif sort == 'name_asc':
        query = query.order_by(Product.name.asc())
    elif sort == 'name_desc':
        query = query.order_by(Product.name.desc())
    else:  # newest by default
        query = query.order_by(Product.created_at.desc())
    
    # Pagination
    products = query.paginate(page=page, per_page=per_page)
    
    # Log số lượng kết quả tìm được
    current_app.logger.info(f"Found {products.total} products matching the criteria")
    
    return jsonify({
        'items': [p.to_dict() for p in products.items],
        'total': products.total,
        'pages': products.pages,
        'page': page
    }), 200

@bp.route('/<int:id>', methods=['GET'])
def get_product(id):
    product = Product.query.get_or_404(id)
    return jsonify(product.to_dict()), 200

@bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    # Kiểm tra quyền admin
    claims = get_jwt()
    if not claims.get('is_admin', False):
        return jsonify({'error': 'Unauthorized access'}), 403
    
    data = request.json
    
    # Kiểm tra dữ liệu đầu vào
    required_fields = ['name', 'price', 'category_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Field {field} is required'}), 400
    
    # Tạo sản phẩm mới
    product = Product(
        name=data['name'],
        description=data.get('description', ''),
        price=data['price'],
        discount_price=data.get('discount_price'),
        stock=data.get('stock', 0),
        category_id=data['category_id'],
        image_url=data.get('image_url', ''),
        featured=data.get('featured', False),
        sizes=data.get('sizes', '')  # Xử lý sizes
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify(product.to_dict()), 201

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_product(id):
    # Kiểm tra quyền admin
    claims = get_jwt()
    if not claims.get('is_admin', False):
        return jsonify({'error': 'Unauthorized access'}), 403
    
    product = Product.query.get_or_404(id)
    data = request.json
    
    # Cập nhật thông tin sản phẩm
    if 'name' in data:
        product.name = data['name']
    if 'description' in data:
        product.description = data['description']
    if 'price' in data:
        product.price = data['price']
    if 'discount_price' in data:
        product.discount_price = data['discount_price']
    if 'stock' in data:
        product.stock = data['stock']
    if 'category_id' in data:
        product.category_id = data['category_id']
    if 'image_url' in data:
        product.image_url = data['image_url']
    if 'featured' in data:
        product.featured = data['featured']
    if 'sizes' in data:  # Xử lý sizes
        product.sizes = data['sizes']
    
    db.session.commit()
    
    return jsonify(product.to_dict())