from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
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
        # Chuẩn hóa chuỗi tìm kiếm
        search = search.strip().lower()
        # Tìm kiếm trong cả tên và mô tả sản phẩm
        query = query.filter(
            or_(
                Product.name.ilike(f'%{search}%'),
                Product.description.ilike(f'%{search}%')
            )
        )
        current_app.logger.info(f"Searching for: '{search}'")
    
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
    user_id = get_jwt_identity()
    
    # Xử lý form data
    name = request.form.get('name')
    description = request.form.get('description')
    price = request.form.get('price', type=float)
    discount_price = request.form.get('discount_price', type=float)
    stock = request.form.get('stock', type=int)
    category_id = request.form.get('category_id', type=int)
    featured = request.form.get('featured', '').lower() == 'true'
    
    if not name or not price or not category_id:
        return jsonify({'error': 'Thông tin không đầy đủ'}), 400
    
    # Xử lý hình ảnh
    image_url = None
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            # Sử dụng đường dẫn tương đối cho image_url
            image_url = f"uploads/{filename}"
            current_app.logger.info(f"Saved image to: {filepath}")
            current_app.logger.info(f"Image URL: {image_url}")
    
    # Tạo sản phẩm mới
    product = Product(
        name=name,
        description=description,
        price=price,
        discount_price=discount_price,
        stock=stock,
        category_id=category_id,
        image_url=image_url,
        featured=featured
    )
    
    db.session.add(product)
    db.session.commit()
    
    return jsonify(product.to_dict()), 201