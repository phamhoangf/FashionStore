from app import db
from datetime import datetime
import enum

class OrderStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"

class PaymentMethod(enum.Enum):
    COD = "cod"
    VNPAY = "vnpay"

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(50), default=OrderStatus.PENDING.value)
    total_amount = db.Column(db.Float, nullable=False)
    shipping_address = db.Column(db.String(255), nullable=False)
    shipping_city = db.Column(db.String(100), nullable=False)
    shipping_phone = db.Column(db.String(20), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    payment_status = db.Column(db.String(50), default=PaymentStatus.PENDING.value)
    transaction_id = db.Column(db.String(100))  # For VNPAY
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_items=True):
        order_dict = {
            'id': self.id,
            'user_id': self.user_id,
            'status': self.status,
            'total_amount': self.total_amount,
            'shipping_address': self.shipping_address,
            'shipping_city': self.shipping_city,
            'shipping_phone': self.shipping_phone,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'transaction_id': self.transaction_id,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Add customer information
        if hasattr(self, 'user') and self.user:
            order_dict['customer_name'] = self.user.name
            order_dict['customer_email'] = self.user.email
            order_dict['customer_phone'] = self.user.phone
        
        # Only include items if requested
        if include_items:
            try:
                order_dict['items'] = [item.to_dict() for item in self.items]
            except Exception as e:
                order_dict['items'] = []
                order_dict['items_error'] = str(e)
                
        return order_dict

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    price = db.Column(db.Float, nullable=False)  # Price at the time of purchase
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        product_data = None
        if self.product:
            try:
                product_data = {
                    'id': self.product.id,
                    'name': self.product.name,
                    'image_url': self.product.image_url
                }
            except Exception as e:
                product_data = {'id': self.product_id, 'error': str(e)}
                
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product': product_data,
            'quantity': self.quantity,
            'price': self.price,
            'total': self.price * self.quantity,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }