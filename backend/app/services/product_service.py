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
        if image_file and image_file.filename:
            from flask import current_app
            
            # Kiểm tra loại file
            if not ProductService.allowed_file(image_file.filename):
                raise Exception(f"Loại file không hợp lệ: {image_file.filename}")
            
            # Lưu file ảnh
            filename = ProductService.save_image(image_file)
            if filename:
                image_url = f"uploads/{filename}"
        
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
    def save_image(image_file):
        """
        Lưu file ảnh vào thư mục uploads
        
        Args:
            image_file (FileStorage): File ảnh cần lưu
            
        Returns:
            str: Tên file đã lưu
        """
        from flask import current_app
        import os
        from werkzeug.utils import secure_filename
        import uuid
        
        try:
            # Tạo tên file an toàn
            filename = secure_filename(image_file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            
            # Đường dẫn đầy đủ đến file
            upload_folder = current_app.config['UPLOAD_FOLDER']
            file_path = os.path.join(upload_folder, unique_filename)
            
            # Lưu file
            image_file.save(file_path)
            
            # Kiểm tra file đã được lưu thành công
            if os.path.exists(file_path):
                return unique_filename
            else:
                current_app.logger.error(f"Failed to save image: {file_path}")
                return None
        except Exception as e:
            current_app.logger.error(f"Error saving image: {str(e)}")
            return None
    
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
        if image_file and image_file.filename:
            from flask import current_app
            
            # Kiểm tra loại file
            if not ProductService.allowed_file(image_file.filename):
                raise Exception(f"Loại file không hợp lệ: {image_file.filename}")
            
            # Xóa ảnh cũ nếu có
            if product.image_url:
                ProductService.delete_image(product.image_url)
            
            # Lưu ảnh mới
            filename = ProductService.save_image(image_file)
            if filename:
                product.image_url = f"uploads/{filename}"
        
        db.session.commit()
        return product
    
    @staticmethod
    def delete_image(image_url):
        """
        Xóa file ảnh
        
        Args:
            image_url (str): URL ảnh cần xóa
        """
        from flask import current_app
        import os
        
        if not image_url:
            return
        
        try:
            # Lấy tên file từ URL
            if image_url.startswith('uploads/'):
                filename = image_url.replace('uploads/', '')
            else:
                filename = os.path.basename(image_url)
            
            # Đường dẫn đầy đủ đến file
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            
            # Xóa file nếu tồn tại
            if os.path.exists(file_path):
                os.remove(file_path)
                current_app.logger.info(f"Deleted image: {file_path}")
        except Exception as e:
            current_app.logger.error(f"Error deleting image: {str(e)}")
    
    @staticmethod
    def delete_product(product_id):
        """Xóa sản phẩm"""
        product = Product.query.get_or_404(product_id)
        
        # Xóa ảnh nếu có
        if product.image_url:
            ProductService.delete_image(product.image_url)
        
        db.session.delete(product)
        db.session.commit()
        return True