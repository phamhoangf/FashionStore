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
        # Tìm đơn hàng
        order = Order.query.get_or_404(order_id)
        
        # Tạo URL thanh toán
        payment_url = create_vnpay_payment(
            order_id=order.id,
            amount=order.total_amount,
            order_desc=f"Thanh toán đơn hàng #{order.id}",
            bank_code=None
        )
        
        return payment_url

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