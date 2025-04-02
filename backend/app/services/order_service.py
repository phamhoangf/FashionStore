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
        try:
            # Kiểm tra phương thức thanh toán hợp lệ
            valid_payment_methods = ['cod', 'vnpay']
            if payment_method not in valid_payment_methods:
                raise ValueError(f"Phương thức thanh toán không hợp lệ. Chỉ hỗ trợ: {', '.join(valid_payment_methods)}")
                
            # Tính tổng tiền
            total_amount = sum(item.product.price * item.quantity for item in cart_items if item.product)
            
            if total_amount <= 0:
                raise ValueError("Tổng giá trị đơn hàng phải lớn hơn 0")
            
            # Xác định trạng thái thanh toán ban đầu
            payment_status = "pending"
            
            # Với COD, không cần phải thanh toán trước
            if payment_method == 'cod':
                payment_status = "pending"  # Vẫn giữ trạng thái chờ thanh toán cho COD
            
            # Tạo đơn hàng
            order = Order(
                user_id=user_id,
                status=OrderStatus.PENDING.value,
                total_amount=total_amount,
                shipping_address=shipping_address,
                shipping_city=shipping_city,
                shipping_phone=shipping_phone,
                payment_method=payment_method,
                payment_status=payment_status,
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
            
        except Exception as e:
            db.session.rollback()
            raise e
    
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
        """
        Lấy đơn hàng theo ID
        
        Args:
            order_id (int): ID của đơn hàng
            
        Returns:
            Order: Đơn hàng
            
        Raises:
            ValueError: Nếu không tìm thấy đơn hàng
        """
        try:
            if not order_id:
                raise ValueError("ID đơn hàng không hợp lệ")
                
            order = Order.query.get(order_id)
            if not order:
                raise ValueError(f"Không tìm thấy đơn hàng với ID {order_id}")
                
            return order
        except Exception as e:
            db.session.rollback()
            raise ValueError(f"Lỗi khi tìm đơn hàng: {str(e)}")
    
    @staticmethod
    def get_user_orders(user_id):
        """Lấy danh sách đơn hàng của người dùng"""
        return Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()