from app import db
from datetime import datetime
from app.models.category import Category

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    discount_price = db.Column(db.Float)
    stock = db.Column(db.Integer, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    image_url = db.Column(db.String(255))
    featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    order_items = db.relationship('OrderItem', backref='product', lazy=True)
    cart_items = db.relationship('CartItem', backref='product', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'discount_price': self.discount_price,
            'stock': self.stock,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'image_url': self.image_url,
            'featured': self.featured,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }