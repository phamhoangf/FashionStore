from app.models.order import Order, OrderItem, OrderStatus
from app.models.cart import CartItem
from app import db
from datetime import datetime
from flask import current_app

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
        valid_statuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled']
        if status not in valid_statuses:
            error_msg = f'Trạng thái không hợp lệ. Chỉ hỗ trợ: {", ".join(valid_statuses)}'
            current_app.logger.error(f"Invalid status for order {order_id}: {status}")
            raise ValueError(error_msg)
        
        try:
            # Tìm đơn hàng
            order = Order.query.get(order_id)
            if not order:
                error_msg = f'Không tìm thấy đơn hàng với ID {order_id}'
                current_app.logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Kiểm tra logic chuyển trạng thái
            if order.status == status:
                # Không cần cập nhật nếu trạng thái không thay đổi
                current_app.logger.info(f"Order {order_id} status unchanged: {status}")
                return order
            
            if order.status == 'delivered' or order.status == 'cancelled':
                error_msg = 'Không thể thay đổi trạng thái của đơn hàng đã giao hoặc đã hủy'
                current_app.logger.error(f"Cannot change status for order {order_id}: {order.status} -> {status}")
                raise ValueError(error_msg)
            
            # Ghi log thay đổi trạng thái
            current_app.logger.info(f"Updating order {order_id} status: {order.status} -> {status}")
            
            # Cập nhật trạng thái
            order.status = status
            order.updated_at = datetime.utcnow()
            
            db.session.commit()
            current_app.logger.info(f"Successfully updated order {order_id} status to {status}")
            return order
        except ValueError as e:
            # Truyền tiếp ngoại lệ ValueError
            raise e
        except Exception as e:
            # Ghi log và đóng gói ngoại lệ
            import traceback
            current_app.logger.error(f"Error updating order {order_id} status: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            db.session.rollback()
            raise ValueError(f'Lỗi khi cập nhật trạng thái đơn hàng: {str(e)}')
    
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
            
            # Chuyển đổi order_id sang integer nếu là string
            if isinstance(order_id, str) and order_id.isdigit():
                order_id = int(order_id)
            
            order = Order.query.get(order_id)
            if not order:
                raise ValueError(f"Không tìm thấy đơn hàng với ID {order_id}")
            
            return order
        except ValueError as e:
            # Truyền tiếp ngoại lệ ValueError
            raise e
        except Exception as e:
            # Ghi log và đóng gói ngoại lệ
            current_app.logger.error(f"Error getting order {order_id}: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            db.session.rollback()
            raise ValueError(f"Lỗi khi tìm đơn hàng: {str(e)}")
    
    @staticmethod
    def get_user_orders(user_id):
        """Lấy danh sách đơn hàng của người dùng"""
        return Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()