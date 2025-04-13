from app import create_app, db
from app.models.category import Category
from app.models.product import Product

app = create_app()

def update_categories():
    """Cập nhật dữ liệu danh mục cho cửa hàng quần áo nam"""
    with app.app_context():
        print("Bắt đầu cập nhật cơ sở dữ liệu...")
        
        # Xóa tất cả các danh mục hiện có và sản phẩm
        try:
            print("Xóa các sản phẩm hiện có...")
            Product.query.delete()
            db.session.commit()
            
            print("Xóa các danh mục hiện có...")
            Category.query.delete()
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Lỗi khi xóa dữ liệu: {str(e)}")
            return
        
        # Tạo danh mục gốc: Nam
        print("Tạo danh mục Nam...")
        nam = Category(name="Nam", description="Thời trang nam")
        db.session.add(nam)
        db.session.commit()
        
        # Tạo 2 danh mục chính: Quần và Áo
        print("Tạo danh mục chính (Quần, Áo)...")
        quan = Category(name="Quần", description="Quần nam các loại", parent_id=nam.id)
        ao = Category(name="Áo", description="Áo nam các loại", parent_id=nam.id)
        
        db.session.add_all([quan, ao])
        db.session.commit()
        
        # Tạo danh mục con cho Quần
        print("Tạo danh mục con cho Quần...")
        quan_subcategories = [
            Category(name="Quần short", description="Quần short nam", parent_id=quan.id),
            Category(name="Quần jeans", description="Quần jeans nam", parent_id=quan.id),
            Category(name="Quần âu", description="Quần âu nam", parent_id=quan.id),
            Category(name="Quần kaki", description="Quần kaki nam dài", parent_id=quan.id)
        ]
        
        # Tạo danh mục con cho Áo
        print("Tạo danh mục con cho Áo...")
        ao_subcategories = [
            Category(name="Áo thun", description="Áo thun nam", parent_id=ao.id),
            Category(name="Áo polo", description="Áo polo nam", parent_id=ao.id),
            Category(name="Áo sơ mi", description="Áo sơ mi nam", parent_id=ao.id),
            Category(name="Áo khoác", description="Áo khoác nam", parent_id=ao.id),
            Category(name="Áo len", description="Áo len nam", parent_id=ao.id)
        ]
        
        # Thêm tất cả danh mục con vào database
        db.session.add_all(quan_subcategories)
        db.session.add_all(ao_subcategories)
        db.session.commit()
        
        # Tạo một số sản phẩm mẫu
        print("Tạo các sản phẩm mẫu...")
        
        # Lấy ID của các danh mục con
        quan_short_id = Category.query.filter_by(name="Quần short").first().id
        quan_jeans_id = Category.query.filter_by(name="Quần jeans").first().id
        quan_au_id = Category.query.filter_by(name="Quần âu").first().id
        quan_kaki_id = Category.query.filter_by(name="Quần kaki").first().id
        
        ao_thun_id = Category.query.filter_by(name="Áo thun").first().id
        ao_polo_id = Category.query.filter_by(name="Áo polo").first().id
        ao_somi_id = Category.query.filter_by(name="Áo sơ mi").first().id
        ao_khoac_id = Category.query.filter_by(name="Áo khoác").first().id
        ao_len_id = Category.query.filter_by(name="Áo len").first().id
        
        # Tạo các sản phẩm
        products = [
            # Quần short
            Product(
                name="Quần short kaki nam",
                description="Quần short kaki nam chất liệu cao cấp, thoáng mát",
                price=350000,
                discount_price=299000,
                stock=100,
                category_id=quan_short_id,
                featured=True
            ),
            Product(
                name="Quần short jeans nam",
                description="Quần short jeans nam form regular, màu xanh đậm",
                price=380000,
                discount_price=329000,
                stock=80,
                category_id=quan_short_id
            ),
            
            # Quần jeans
            Product(
                name="Quần jeans nam slim fit",
                description="Quần jeans nam slim fit, co giãn thoải mái",
                price=550000,
                discount_price=499000,
                stock=120,
                category_id=quan_jeans_id,
                featured=True
            ),
            Product(
                name="Quần jeans nam rách gối",
                description="Quần jeans nam rách gối, phong cách trẻ trung",
                price=520000,
                discount_price=459000,
                stock=70,
                category_id=quan_jeans_id
            ),
            
            # Quần âu
            Product(
                name="Quần âu nam công sở",
                description="Quần âu nam công sở, chất liệu cao cấp, form slim fit",
                price=450000,
                discount_price=399000,
                stock=150,
                category_id=quan_au_id,
                featured=True
            ),
            Product(
                name="Quần âu nam kẻ caro",
                description="Quần âu nam kẻ caro, thiết kế hiện đại",
                price=480000,
                discount_price=429000,
                stock=60,
                category_id=quan_au_id
            ),
            
            # Quần kaki
            Product(
                name="Quần kaki nam dài",
                description="Quần kaki nam dài, chất liệu mềm mại, thoáng khí",
                price=420000,
                discount_price=379000,
                stock=100,
                category_id=quan_kaki_id,
                featured=True
            ),
            Product(
                name="Quần kaki nam ống đứng",
                description="Quần kaki nam ống đứng, phù hợp mọi dáng người",
                price=400000,
                discount_price=349000,
                stock=85,
                category_id=quan_kaki_id
            ),
            
            # Áo thun
            Product(
                name="Áo thun nam cổ tròn",
                description="Áo thun nam cổ tròn basic, chất liệu cotton 100%",
                price=250000,
                discount_price=199000,
                stock=200,
                category_id=ao_thun_id,
                featured=True
            ),
            Product(
                name="Áo thun nam in họa tiết",
                description="Áo thun nam in họa tiết, phong cách trẻ trung",
                price=280000,
                discount_price=239000,
                stock=150,
                category_id=ao_thun_id
            ),
            
            # Áo polo
            Product(
                name="Áo polo nam basic",
                description="Áo polo nam basic, chất liệu cotton cao cấp",
                price=350000,
                discount_price=299000,
                stock=180,
                category_id=ao_polo_id,
                featured=True
            ),
            Product(
                name="Áo polo nam kẻ sọc",
                description="Áo polo nam kẻ sọc, thiết kế thanh lịch",
                price=380000,
                discount_price=329000,
                stock=120,
                category_id=ao_polo_id
            ),
            
            # Áo sơ mi
            Product(
                name="Áo sơ mi nam dài tay",
                description="Áo sơ mi nam dài tay, chất liệu linen thoáng mát",
                price=450000,
                discount_price=399000,
                stock=150,
                category_id=ao_somi_id,
                featured=True
            ),
            Product(
                name="Áo sơ mi nam ngắn tay",
                description="Áo sơ mi nam ngắn tay, họa tiết hoa văn",
                price=420000,
                discount_price=369000,
                stock=100,
                category_id=ao_somi_id
            ),
            
            # Áo khoác
            Product(
                name="Áo khoác dù nam",
                description="Áo khoác dù nam chống nước, có mũ",
                price=650000,
                discount_price=599000,
                stock=80,
                category_id=ao_khoac_id,
                featured=True
            ),
            Product(
                name="Áo khoác jean nam",
                description="Áo khoác jean nam form rộng, màu xanh nhạt",
                price=580000,
                discount_price=499000,
                stock=70,
                category_id=ao_khoac_id
            ),
            
            # Áo len
            Product(
                name="Áo len nam cổ tròn",
                description="Áo len nam cổ tròn, chất liệu len mềm mại, ấm áp",
                price=450000,
                discount_price=399000,
                stock=120,
                category_id=ao_len_id,
                featured=True
            ),
            Product(
                name="Áo len nam cardigan",
                description="Áo len nam cardigan, thiết kế hiện đại, trẻ trung",
                price=520000,
                discount_price=459000,
                stock=90,
                category_id=ao_len_id
            )
        ]
        
        # Thêm các sản phẩm vào database
        db.session.add_all(products)
        db.session.commit()
        
        print(f"Đã tạo thành công {Category.query.count()} danh mục và {Product.query.count()} sản phẩm!")
        print("Hệ thống đã được cập nhật thành cửa hàng quần áo nam!")

if __name__ == "__main__":
    update_categories() 