from app.models.product import Product
from app.models.category import Category
from app import db
import os
from werkzeug.utils import secure_filename
import uuid
from flask import current_app

class ProductService:
    @staticmethod
    def get_products_with_filters(page=1, per_page=10, category_id=None, featured=None, 
                                search=None, sort='newest'):
        """
        Lấy danh sách sản phẩm với bộ lọc
        
        Args:
            page (int): Trang hiện tại
            per_page (int): Số sản phẩm mỗi trang
            category_id (int, optional): ID danh mục
            featured (bool, optional): Sản phẩm nổi bật
            search (str, optional): Từ khóa tìm kiếm
            sort (str, optional): Cách sắp xếp (newest, price_asc, price_desc, name_asc, name_desc)
        
        Returns:
            tuple: (items, total, pages, page)
        """
        # Base query
        query = Product.query
        
        # Apply filters
        if category_id:
            query = query.filter_by(category_id=category_id)
            
        if featured is not None:
            query = query.filter_by(featured=featured)
            
        if search:
            search_term = f"%{search}%"
            query = query.filter(Product.name.ilike(search_term) | 
                                Product.description.ilike(search_term))
        
        # Apply sorting
        if sort == 'newest':
            query = query.order_by(Product.created_at.desc())
        elif sort == 'price_asc':
            query = query.order_by(Product.price.asc())
        elif sort == 'price_desc':
            query = query.order_by(Product.price.desc())
        elif sort == 'name_asc':
            query = query.order_by(Product.name.asc())
        elif sort == 'name_desc':
            query = query.order_by(Product.name.desc())
        
        # Paginate
        paginated = query.paginate(page=page, per_page=per_page)
        
        return paginated.items, paginated.total, paginated.pages, paginated.page
    
    @staticmethod
    def create_product(name, price, category_id, description=None, discount_price=None,
                    stock=0, featured=False, image_file=None):
        """
        Tạo sản phẩm mới
        
        Args:
            name (str): Tên sản phẩm
            price (float): Giá
            category_id (int): ID danh mục
            description (str, optional): Mô tả
            discount_price (float, optional): Giá khuyến mãi
            stock (int, optional): Số lượng tồn kho
            featured (bool, optional): Sản phẩm nổi bật
            image_file (FileStorage, optional): File ảnh
            
        Returns:
            Product: Sản phẩm đã tạo
        """
        # Xử lý ảnh nếu có
        image_url = None
        if image_file and ProductService.allowed_file(image_file.filename):
            filename = secure_filename(image_file.filename)
            # Thêm UUID để tránh trùng tên file
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            
            # Lưu file
            image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
            image_file.save(image_path)
            
            # URL tương đối để lưu vào database
            image_url = f"uploads/{unique_filename}"
        
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
        
        return product
    
    @staticmethod
    def allowed_file(filename):
        """Kiểm tra file có phải là ảnh hợp lệ không"""
        ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    @staticmethod
    def get_product_by_id(product_id):
        """Lấy sản phẩm theo ID"""
        return Product.query.get_or_404(product_id)
    
    @staticmethod
    def update_product(product_id, data, image_file=None):
        """Cập nhật thông tin sản phẩm"""
        product = Product.query.get_or_404(product_id)
        
        # Cập nhật các trường
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
        if 'featured' in data:
            product.featured = data['featured']
        
        # Xử lý ảnh nếu có
        if image_file and ProductService.allowed_file(image_file.filename):
            # Xóa ảnh cũ nếu có
            if product.image_url:
                old_image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 
                                            product.image_url.replace('uploads/', ''))
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            
            # Lưu ảnh mới
            filename = secure_filename(image_file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
            image_file.save(image_path)
            product.image_url = f"uploads/{unique_filename}"
        
        db.session.commit()
        return product
    
    @staticmethod
    def delete_product(product_id):
        """Xóa sản phẩm"""
        product = Product.query.get_or_404(product_id)
        
        # Xóa ảnh nếu có
        if product.image_url:
            image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 
                                    product.image_url.replace('uploads/', ''))
            if os.path.exists(image_path):
                os.remove(image_path)
        
        db.session.delete(product)
        db.session.commit()
        return True