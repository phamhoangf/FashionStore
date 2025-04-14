from flask import current_app
from app.models.order import Order, PaymentStatus
from app.utils.security import create_vnpay_payment, validate_vnpay_response
from app import db

class PaymentService:
    @staticmethod
    def create_payment_url(order_id, return_url=None):
        """
        Tạo URL thanh toán VNPAY
        
        Args:
            order_id (int): ID đơn hàng
            return_url (str, optional): URL callback sau khi thanh toán
        
        Returns:
            str: URL thanh toán
        """
        try:
            # Tìm đơn hàng
            order = Order.query.get_or_404(order_id)
            
            # Kiểm tra trạng thái đơn hàng
            if order.payment_status == 'paid':
                raise ValueError("Đơn hàng này đã được thanh toán")
            
            # Kiểm tra cấu hình VNPay
            if not current_app.config.get('VNPAY_TMN_CODE'):
                current_app.logger.error("VNPay TMN Code is not configured")
                raise ValueError("Thiếu cấu hình VNPAY_TMN_CODE")
                
            if not current_app.config.get('VNPAY_HASH_SECRET_KEY'):
                current_app.logger.error("VNPay Hash Secret Key is not configured")
                raise ValueError("Thiếu cấu hình VNPAY_HASH_SECRET_KEY")
                
            if not current_app.config.get('VNPAY_PAYMENT_URL'):
                current_app.logger.error("VNPay Payment URL is not configured")
                raise ValueError("Thiếu cấu hình VNPAY_PAYMENT_URL")
                
            if not current_app.config.get('VNPAY_RETURN_URL'):
                current_app.logger.error("VNPay Return URL is not configured")
                raise ValueError("Thiếu cấu hình VNPAY_RETURN_URL")
                
            # Tạo URL thanh toán
            payment_url = create_vnpay_payment(
                order_id=order.id,
                amount=order.total_amount,
                order_desc=f"Thanh toán đơn hàng #{order.id}",
                bank_code=None
            )
            
            if not payment_url or not isinstance(payment_url, str):
                raise ValueError("Lỗi khi tạo URL thanh toán")
                
            # Log thành công
            current_app.logger.info(f"Successfully created VNPay payment URL for order {order_id}")
                
            return payment_url
        except Exception as e:
            current_app.logger.error(f"Error creating payment URL for order {order_id}: {str(e)}")
            raise e

    @staticmethod
    def process_payment_result(order_id, is_success, transaction_id=None):
        """
        Xử lý kết quả thanh toán
        
        Args:
            order_id (int): ID đơn hàng
            is_success (bool): Thanh toán thành công hay không
            transaction_id (str, optional): Mã giao dịch
        
        Returns:
            Order: Đơn hàng đã cập nhật
        """
        try:
            # Ghi log bắt đầu xử lý
            current_app.logger.info(f"Processing payment result for order {order_id}, success={is_success}, transaction_id={transaction_id}")
            
            # Tìm đơn hàng
            order = Order.query.get(order_id)
            
            if not order:
                current_app.logger.error(f"Order {order_id} not found when processing payment result")
                raise ValueError(f"Không tìm thấy đơn hàng với ID {order_id}")
            
            # Cập nhật trạng thái thanh toán
            if is_success:
                order.payment_status = PaymentStatus.PAID.value
                order.transaction_id = transaction_id
                current_app.logger.info(f"Order {order_id} payment status updated to PAID")
            else:
                # Thanh toán thất bại, cập nhật trạng thái thanh toán thành FAILED
                order.payment_status = PaymentStatus.FAILED.value
                
                # Chỉ cập nhật trạng thái đơn hàng thành CANCELLED nếu phương thức là VNPay
                if order.payment_method == 'vnpay':
                    from app.models.order import OrderStatus
                    order.status = OrderStatus.CANCELLED.value
                    current_app.logger.info(f"Order {order_id} has been cancelled due to failed payment")
                
                current_app.logger.info(f"Order {order_id} payment status updated to FAILED")
            
            db.session.commit()
            current_app.logger.info(f"Successfully processed payment result for order {order_id}")
            
            return order
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error processing payment result for order {order_id}: {str(e)}", exc_info=True)
            raise e
    
    @staticmethod
    def validate_payment_response(vnp_params):
        """Xác thực response từ VNPAY"""
        return validate_vnpay_response(vnp_params)