from flask import Blueprint, request, jsonify, current_app, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.order import Order
from app.services.payment_service import PaymentService
from app import db

bp = Blueprint('payment', __name__, url_prefix='/api/payment')

@bp.route('/vnpay-return', methods=['GET'])
def vnpay_return():
    # Lấy tất cả các tham số từ URL
    vnp_params = {}
    for key, value in request.args.items():
        vnp_params[key] = value
    
    # Ghi log thông tin nhận được từ VNPay
    current_app.logger.info(f"Received return from VNPAY with params: {vnp_params}")
    
    # Kiểm tra tham số cần thiết
    if not vnp_params.get('vnp_TxnRef'):
        current_app.logger.error("Missing order ID (vnp_TxnRef) in VNPay return params")
        return redirect(f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/error?message=missing_order_id")
    
    order_id = vnp_params.get('vnp_TxnRef')
    
    # Kiểm tra chữ ký
    is_valid = PaymentService.validate_payment_response(vnp_params)
    if not is_valid:
        # Ghi log lỗi xác thực
        current_app.logger.error(f"Invalid signature in VNPay return for order {order_id}")
        # Trả về trang lỗi - Chuyển về trang PaymentResultPage với thông báo lỗi
        return redirect(f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/error?order_id={order_id}&message=invalid_signature")
    
    try:
        # Lấy thông tin giao dịch
        order_id = int(vnp_params.get('vnp_TxnRef'))
        response_code = vnp_params.get('vnp_ResponseCode')
        transaction_id = vnp_params.get('vnp_TransactionNo')
        
        # Xử lý kết quả thanh toán
        is_success = response_code == '00'
        
        # Ghi log kết quả thanh toán
        current_app.logger.info(f"Processing payment result for order {order_id}, success: {is_success}, transaction ID: {transaction_id}")
        
        # Cập nhật kết quả vào database
        PaymentService.process_payment_result(order_id, is_success, transaction_id)
        
        # Chuyển hướng về trang kết quả thanh toán - sử dụng trang PaymentResultPage
        if is_success:
            redirect_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/success?order_id={order_id}&vnp_ResponseCode={response_code}"
        else:
            redirect_url = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/error?order_id={order_id}&vnp_ResponseCode={response_code}"
        
        current_app.logger.info(f"Redirecting to: {redirect_url}")
        return redirect(redirect_url)
        
    except Exception as e:
        # Ghi log lỗi chi tiết
        current_app.logger.error(f"Error processing VNPay return for order {order_id}: {str(e)}", exc_info=True)
        return redirect(f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/error?order_id={order_id}&message=processing_error")

@bp.route('/create/<int:order_id>', methods=['GET'])
@jwt_required()
def create_payment(order_id):
    user_id = get_jwt_identity()
    
    try:
        # Kiểm tra quyền truy cập đơn hàng
        order = Order.query.get_or_404(order_id)
        if str(order.user_id) != str(user_id):
            return jsonify({"error": "Không có quyền truy cập đơn hàng này"}), 403
        
        # Nếu đơn hàng đã thanh toán
        if order.payment_status == 'paid':
            return jsonify({"error": "Đơn hàng này đã được thanh toán"}), 400
            
        # Tạo URL thanh toán
        payment_url = PaymentService.create_payment_url(order_id)
        
        if not payment_url:
            return jsonify({"error": "Không thể tạo URL thanh toán"}), 500
            
        return jsonify({"payment_url": payment_url}), 200
    except Exception as e:
        current_app.logger.error(f"Error creating payment for order {order_id}: {str(e)}")
        return jsonify({"error": f"Lỗi khi tạo thanh toán: {str(e)}"}), 500

@bp.route('/check/<int:order_id>', methods=['GET'])
@jwt_required()
def check_payment_status(order_id):
    user_id = get_jwt_identity()
    
    # Kiểm tra quyền truy cập đơn hàng
    order = Order.query.get_or_404(order_id)
    if str(order.user_id) != str(user_id):
        return jsonify({"error": "Không có quyền truy cập đơn hàng này"}), 403
    
    return jsonify({
        "order_id": order.id,
        "payment_status": order.payment_status,
        "transaction_id": order.transaction_id
    }), 200

@bp.route('/ipn', methods=['POST', 'GET'])
def payment_ipn():
    """
    IPN (Instant Payment Notification) endpoint for VNPAY
    This endpoint will be called by VNPAY server to notify payment status changes
    
    Các bước thực hiện:
    * Kiểm tra checksum 
    * Tìm giao dịch trong database
    * Kiểm tra số tiền giữa hai hệ thống
    * Kiểm tra tình trạng của giao dịch trước khi cập nhật
    * Cập nhật kết quả vào Database
    * Trả kết quả ghi nhận lại cho VNPAY
    """
    # Get all parameters from request
    current_app.logger.info("Received IPN callback from VNPAY")
    
    try:
        # Lấy tất cả các tham số từ request
        if request.method == 'GET':
            vnp_params = request.args.to_dict()
        elif request.is_json:
            vnp_params = request.json
        else:
            # For form data
            vnp_params = request.form.to_dict()
            
        current_app.logger.info(f"IPN params: {vnp_params}")
        
        # Validate the signature
        is_valid = PaymentService.validate_payment_response(vnp_params)
        if not is_valid:
            current_app.logger.error("Invalid signature in IPN callback")
            return jsonify({"RspCode": "97", "Message": "Invalid signature"}), 400
        
        # Get transaction info
        order_id = int(vnp_params.get('vnp_TxnRef'))
        response_code = vnp_params.get('vnp_ResponseCode')
        transaction_status = vnp_params.get('vnp_TransactionStatus')
        transaction_id = vnp_params.get('vnp_TransactionNo')
        vnp_amount = int(vnp_params.get('vnp_Amount', 0)) / 100  # Chuyển đổi về đơn vị tiền tệ
        vnp_bank_code = vnp_params.get('vnp_BankCode')
        
        # Tìm đơn hàng trong database
        from app.models.order import Order
        order = Order.query.get(order_id)
        
        if not order:
            current_app.logger.error(f"Order {order_id} not found")
            return jsonify({"RspCode": "01", "Message": "Order not found"}), 200
            
        # Kiểm tra số tiền giữa hai hệ thống
        if abs(float(order.total_amount) - float(vnp_amount)) > 0.01:  # Sử dụng sai số nhỏ cho so sánh số thực
            current_app.logger.error(f"Amount mismatch: Order amount={order.total_amount}, VNPay amount={vnp_amount}")
            return jsonify({"RspCode": "04", "Message": "Invalid amount"}), 200
            
        # Kiểm tra tình trạng của giao dịch trước khi cập nhật (tránh xử lý trùng lặp)
        if order.payment_status != 'pending':
            current_app.logger.info(f"Order {order_id} already processed, status: {order.payment_status}")
            return jsonify({"RspCode": "02", "Message": "Order already confirmed"}), 200
            
        # Xử lý kết quả thanh toán
        is_success = response_code == '00' or transaction_status == '00'
        
        # Cập nhật kết quả vào Database
        PaymentService.process_payment_result(order_id, is_success, transaction_id)
        
        # Lưu thêm thông tin về ngân hàng (nếu cần)
        order.payment_method = f"VNPAY - {vnp_bank_code}"
        db.session.commit()
        
        # Trả kết quả ghi nhận lại cho VNPAY
        current_app.logger.info(f"IPN processed successfully for order {order_id}, status: {is_success}")
        return jsonify({"RspCode": "00", "Message": "Confirmed Success"}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error processing IPN: {str(e)}")
        return jsonify({"RspCode": "99", "Message": f"Unknown error: {str(e)}"}), 200

@bp.route('/verify-payment/<int:order_id>', methods=['GET'])
@jwt_required()
def verify_payment(order_id):
    """
    Xác minh tình trạng thanh toán của một đơn hàng
    Frontend gọi API này sau khi redirect từ VNPay để xác định liệu có nên xóa items khỏi giỏ hàng không
    """
    user_id = get_jwt_identity()
    current_app.logger.info(f"Verifying payment status for order {order_id}")
    
    try:
        # Kiểm tra quyền truy cập đơn hàng
        order = Order.query.get_or_404(order_id)
        if str(order.user_id) != str(user_id):
            return jsonify({"error": "Không có quyền truy cập đơn hàng này"}), 403
        
        # Trả về chi tiết trạng thái thanh toán
        payment_verified = order.payment_status == 'paid'
        
        # Ghi log kết quả việc xác minh thanh toán
        current_app.logger.info(f"Payment verification for order {order_id}: Status={order.payment_status}, Verified={payment_verified}")
        
        # Trả về đầy đủ thông tin đơn hàng để hiển thị trên trang kết quả
        return jsonify({
            "order_id": order.id,
            "payment_status": order.payment_status,
            "transaction_id": order.transaction_id,
            "payment_verified": payment_verified,
            "should_clear_cart": payment_verified,  # Chỉ xóa giỏ hàng nếu thanh toán đã được xác nhận
            "status": order.status,
            "total_amount": order.total_amount,
            "order_date": order.created_at.isoformat() if order.created_at else None,
            "payment_method": order.payment_method,
            "shipping_address": order.shipping_address,
            "shipping_city": order.shipping_city,
            "shipping_phone": order.shipping_phone
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error verifying payment for order {order_id}: {str(e)}")
        return jsonify({"error": f"Lỗi khi xác minh thanh toán: {str(e)}"}), 500