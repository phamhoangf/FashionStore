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
        # Tìm đơn hàng
        order = Order.query.get_or_404(order_id)
        
        # Cập nhật trạng thái thanh toán
        if is_success:
            order.payment_status = PaymentStatus.PAID.value
            order.transaction_id = transaction_id
        else:
            order.payment_status = PaymentStatus.FAILED.value
        
        db.session.commit()
        
        return order
    
    @staticmethod
    def validate_payment_response(vnp_params):
        """Xác thực response từ VNPAY"""
        return validate_vnpay_response(vnp_params)