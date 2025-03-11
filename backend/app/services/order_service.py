from app.models.order import Order, OrderItem, OrderStatus
from app.models.cart import CartItem
from app import db

class OrderService:
    @staticmethod
    def create_order_from_cart(user_id, cart_items, shipping_address, shipping_city, 
                            shipping_phone, payment_method, notes=''):
        """
        Tạo đơn hàng từ giỏ hàng
        
        Args:
            user_id (int): ID người dùng
            cart_items (list): Danh sách sản phẩm trong giỏ hàng
            shipping_address (str): Địa chỉ giao hàng
            shipping_city (str): Thành phố giao hàng
            shipping_phone (str): Số điện thoại giao hàng
            payment_method (str): Phương thức thanh toán (cod, vnpay)
            notes (str, optional): Ghi chú
        
        Returns:
            Order: Đơn hàng mới tạo
        """
        # Tính tổng tiền
        total_amount = sum(item.product.price * item.quantity for item in cart_items if item.product)
        
        # Tạo đơn hàng
        order = Order(
            user_id=user_id,
            status=OrderStatus.PENDING.value,
            total_amount=total_amount,
            shipping_address=shipping_address,
            shipping_city=shipping_city,
            shipping_phone=shipping_phone,
            payment_method=payment_method,
            notes=notes
        )
        
        db.session.add(order)
        db.session.flush()  # Để lấy ID của order
        
        # Thêm các sản phẩm vào đơn hàng
        for cart_item in cart_items:
            if not cart_item.product:
                continue
                
            order_item = OrderItem(
                order_id=order.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                price=cart_item.product.price
            )
            db.session.add(order_item)
        
        # Xóa giỏ hàng
        for cart_item in cart_items:
            db.session.delete(cart_item)
        
        db.session.commit()
        
        return order
    
    @staticmethod
    def update_order_status(order_id, status):
        """
        Cập nhật trạng thái đơn hàng
        
        Args:
            order_id (int): ID đơn hàng
            status (str): Trạng thái mới
        
        Returns:
            Order: Đơn hàng đã cập nhật
        
        Raises:
            ValueError: Nếu trạng thái không hợp lệ
        """
        # Kiểm tra status hợp lệ
        try:
            status_enum = OrderStatus(status)
        except ValueError:
            raise ValueError('Trạng thái không hợp lệ')
        
        # Tìm đơn hàng
        order = Order.query.get_or_404(order_id)
        
        # Cập nhật trạng thái
        order.status = status_enum.value
        db.session.commit()
        
        return order
    
    @staticmethod
    def get_order_by_id(order_id):
        """Lấy đơn hàng theo ID"""
        return Order.query.get_or_404(order_id)
    
    @staticmethod
    def get_user_orders(user_id):
        """Lấy danh sách đơn hàng của người dùng"""
        return Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()