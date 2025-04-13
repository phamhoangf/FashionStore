from app import create_app, db
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.utils.security import generate_password_hash
import random

app = create_app()

def seed_users():
    """Thêm dữ liệu mẫu cho người dùng"""
    print("Thêm dữ liệu người dùng...")
    
    # Thêm admin
    admin = User(
        name="Admin",
        email="admin@example.com",
        password_hash=generate_password_hash("admin123"),
        phone="0987654321",
        address="123 Admin Street",
        city="Hanoi",
        is_admin=True
    )
    
    # Thêm người dùng thường
    user = User(
        name="Người dùng",
        email="user@example.com",
        password_hash=generate_password_hash("user123"),
        phone="0123456789",
        address="456 User Street",
        city="Ho Chi Minh City"
    )
    
    db.session.add(admin)
    db.session.add(user)
    db.session.commit()
    
    print(f"Đã thêm {User.query.count()} người dùng")

def seed_categories():
    """Thêm dữ liệu mẫu cho danh mục"""
    print("Thêm dữ liệu danh mục...")
    
    # Danh mục cha
    categories = [
        Category(name="Nam", description="Thời trang nam"),
        Category(name="Nữ", description="Thời trang nữ"),
        Category(name="Trẻ em", description="Thời trang trẻ em"),
        Category(name="Phụ kiện", description="Phụ kiện thời trang")
    ]
    
    for category in categories:
        db.session.add(category)
    
    db.session.commit()
    
    # Danh mục con
    nam_id = Category.query.filter_by(name="Nam").first().id
    nu_id = Category.query.filter_by(name="Nữ").first().id
    tre_em_id = Category.query.filter_by(name="Trẻ em").first().id
    phu_kien_id = Category.query.filter_by(name="Phụ kiện").first().id
    
    sub_categories = [
        Category(name="Áo", description="Áo nam các loại", parent_id=nam_id),
        Category(name="Quần", description="Quần nam các loại", parent_id=nam_id),
        Category(name="Giày", description="Giày nam các loại", parent_id=nam_id),
        Category(name="Áo", description="Áo nữ các loại", parent_id=nu_id),
        Category(name="Quần", description="Quần nữ các loại", parent_id=nu_id),
        Category(name="Váy", description="Váy & Đầm", parent_id=nu_id),
        Category(name="Áo", description="Áo trẻ em các loại", parent_id=tre_em_id),
        Category(name="Quần", description="Quần trẻ em các loại", parent_id=tre_em_id),
        Category(name="Mũ", description="Mũ & Nón", parent_id=phu_kien_id),
        Category(name="Túi xách", description="Túi xách các loại", parent_id=phu_kien_id),
        Category(name="Thắt lưng", description="Thắt lưng các loại", parent_id=phu_kien_id)
    ]
    
    for category in sub_categories:
        db.session.add(category)
    
    db.session.commit()
    
    print(f"Đã thêm {Category.query.count()} danh mục")

def seed_products():
    """Thêm dữ liệu mẫu cho sản phẩm"""
    print("Thêm dữ liệu sản phẩm...")
    
    # Lấy ID các danh mục
    ao_nam_id = Category.query.filter_by(name="Áo", parent_id=Category.query.filter_by(name="Nam").first().id).first().id
    quan_nam_id = Category.query.filter_by(name="Quần", parent_id=Category.query.filter_by(name="Nam").first().id).first().id
    giay_nam_id = Category.query.filter_by(name="Giày", parent_id=Category.query.filter_by(name="Nam").first().id).first().id
    
    ao_nu_id = Category.query.filter_by(name="Áo", parent_id=Category.query.filter_by(name="Nữ").first().id).first().id
    quan_nu_id = Category.query.filter_by(name="Quần", parent_id=Category.query.filter_by(name="Nữ").first().id).first().id
    vay_id = Category.query.filter_by(name="Váy", parent_id=Category.query.filter_by(name="Nữ").first().id).first().id
    
    ao_tre_em_id = Category.query.filter_by(name="Áo", parent_id=Category.query.filter_by(name="Trẻ em").first().id).first().id
    quan_tre_em_id = Category.query.filter_by(name="Quần", parent_id=Category.query.filter_by(name="Trẻ em").first().id).first().id
    
    mu_id = Category.query.filter_by(name="Mũ").first().id
    tui_xach_id = Category.query.filter_by(name="Túi xách").first().id
    that_lung_id = Category.query.filter_by(name="Thắt lưng").first().id
    
    # Sản phẩm áo nam
    products = [
        Product(
            name="Áo sơ mi nam dài tay",
            description="Áo sơ mi nam dài tay, chất liệu cotton cao cấp, form regular fit",
            price=450000,
            discount_price=399000,
            stock=100,
            category_id=ao_nam_id,
            featured=True
        ),
        Product(
            name="Áo polo nam",
            description="Áo polo nam ngắn tay, chất liệu cotton co giãn, form slim fit",
            price=350000,
            discount_price=299000,
            stock=150,
            category_id=ao_nam_id,
            featured=True
        ),
        Product(
            name="Áo thun nam basic",
            description="Áo thun nam cổ tròn, chất liệu cotton 100%, form regular fit",
            price=250000,
            discount_price=199000,
            stock=200,
            category_id=ao_nam_id
        ),
        
        # Sản phẩm quần nam
        Product(
            name="Quần jeans nam slim fit",
            description="Quần jeans nam slim fit, chất liệu denim co giãn, màu xanh đậm",
            price=550000,
            discount_price=499000,
            stock=80,
            category_id=quan_nam_id,
            featured=True
        ),
        Product(
            name="Quần kaki nam",
            description="Quần kaki nam dáng suông, chất liệu cotton khaki cao cấp",
            price=450000,
            discount_price=399000,
            stock=100,
            category_id=quan_nam_id
        ),
        Product(
            name="Quần short nam",
            description="Quần short nam chất liệu kaki, phù hợp mùa hè",
            price=350000,
            discount_price=299000,
            stock=120,
            category_id=quan_nam_id
        ),
        
        # Sản phẩm giày nam
        Product(
            name="Giày sneaker nam",
            description="Giày sneaker nam thiết kế hiện đại, đế cao su chống trượt",
            price=850000,
            discount_price=799000,
            stock=50,
            category_id=giay_nam_id,
            featured=True
        ),
        Product(
            name="Giày tây nam",
            description="Giày tây nam da bò thật, thiết kế lịch lãm, phù hợp đi làm",
            price=1250000,
            discount_price=1199000,
            stock=30,
            category_id=giay_nam_id
        ),
        
        # Sản phẩm áo nữ
        Product(
            name="Áo sơ mi nữ",
            description="Áo sơ mi nữ dài tay, chất liệu lụa mềm mại, form rộng",
            price=450000,
            discount_price=399000,
            stock=100,
            category_id=ao_nu_id,
            featured=True
        ),
        Product(
            name="Áo thun nữ crop top",
            description="Áo thun nữ crop top, chất liệu cotton co giãn, form ôm",
            price=250000,
            discount_price=199000,
            stock=150,
            category_id=ao_nu_id
        ),
        Product(
            name="Áo kiểu nữ",
            description="Áo kiểu nữ tay bồng, chất liệu voan nhẹ nhàng",
            price=350000,
            discount_price=299000,
            stock=80,
            category_id=ao_nu_id
        ),
        
        # Sản phẩm quần nữ
        Product(
            name="Quần jeans nữ skinny",
            description="Quần jeans nữ skinny, chất liệu denim co giãn cao, ôm dáng",
            price=550000,
            discount_price=499000,
            stock=80,
            category_id=quan_nu_id,
            featured=True
        ),
        Product(
            name="Quần culottes nữ",
            description="Quần culottes nữ ống rộng, chất liệu vải mềm mại",
            price=450000,
            discount_price=399000,
            stock=70,
            category_id=quan_nu_id
        ),
        
        # Sản phẩm váy
        Product(
            name="Váy liền thân",
            description="Váy liền thân dáng xòe, chất liệu cotton linen",
            price=650000,
            discount_price=599000,
            stock=60,
            category_id=vay_id,
            featured=True
        ),
        Product(
            name="Chân váy midi",
            description="Chân váy midi dáng chữ A, chất liệu vải cao cấp",
            price=450000,
            discount_price=399000,
            stock=70,
            category_id=vay_id
        ),
        
        # Sản phẩm áo trẻ em
        Product(
            name="Áo thun trẻ em",
            description="Áo thun trẻ em cổ tròn, chất liệu cotton mềm mại, an toàn cho bé",
            price=150000,
            discount_price=129000,
            stock=200,
            category_id=ao_tre_em_id,
            featured=True
        ),
        Product(
            name="Áo khoác trẻ em",
            description="Áo khoác trẻ em chống nắng, chất liệu nhẹ, thoáng khí",
            price=250000,
            discount_price=229000,
            stock=100,
            category_id=ao_tre_em_id
        ),
        
        # Sản phẩm quần trẻ em
        Product(
            name="Quần jeans trẻ em",
            description="Quần jeans trẻ em, chất liệu denim mềm, co giãn tốt",
            price=250000,
            discount_price=229000,
            stock=100,
            category_id=quan_tre_em_id
        ),
        
        # Sản phẩm mũ
        Product(
            name="Mũ bucket",
            description="Mũ bucket thời trang, chất liệu cotton cao cấp",
            price=150000,
            discount_price=129000,
            stock=150,
            category_id=mu_id,
            featured=True
        ),
        
        # Sản phẩm túi xách
        Product(
            name="Túi xách nữ",
            description="Túi xách nữ thiết kế hiện đại, chất liệu da PU cao cấp",
            price=550000,
            discount_price=499000,
            stock=50,
            category_id=tui_xach_id,
            featured=True
        ),
        
        # Sản phẩm thắt lưng
        Product(
            name="Thắt lưng nam",
            description="Thắt lưng nam da bò thật, khóa kim loại cao cấp",
            price=350000,
            discount_price=299000,
            stock=80,
            category_id=that_lung_id
        )
    ]
    
    for product in products:
        db.session.add(product)
    
    db.session.commit()
    
    print(f"Đã thêm {Product.query.count()} sản phẩm")

if __name__ == "__main__":
    with app.app_context():
        # Xóa dữ liệu cũ
        print("Xóa dữ liệu cũ...")
        Product.query.delete()
        Category.query.delete()
        User.query.delete()
        db.session.commit()
        
        # Thêm dữ liệu mẫu
        seed_users()
        # seed_categories()
        # seed_products()
        
        print("Hoàn thành thêm dữ liệu mẫu!") 