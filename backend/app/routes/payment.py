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
    
    # Kiểm tra chữ ký
    is_valid = PaymentService.validate_payment_response(vnp_params)
    if not is_valid:
        # Trả về trang lỗi
        return redirect(f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/error")
    
    # Lấy thông tin giao dịch
    order_id = int(vnp_params.get('vnp_TxnRef'))
    response_code = vnp_params.get('vnp_ResponseCode')
    transaction_id = vnp_params.get('vnp_TransactionNo')
    
    # Xử lý kết quả thanh toán
    is_success = response_code == '00'
    PaymentService.process_payment_result(order_id, is_success, transaction_id)
    
    # Chuyển hướng về trang kết quả thanh toán
    if is_success:
        return redirect(f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/success?order_id={order_id}")
    else:
        return redirect(f"{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/payment/error?order_id={order_id}")

@bp.route('/create/<int:order_id>', methods=['GET'])
@jwt_required()
def create_payment(order_id):
    user_id = get_jwt_identity()
    
    # Kiểm tra quyền truy cập đơn hàng
    order = Order.query.get_or_404(order_id)
    if order.user_id != user_id:
        return jsonify({"error": "Không có quyền truy cập đơn hàng này"}), 403
    
    # Tạo URL thanh toán
    payment_url = PaymentService.create_payment_url(order_id)
    
    return jsonify({"payment_url": payment_url}), 200

@bp.route('/check/<int:order_id>', methods=['GET'])
@jwt_required()
def check_payment_status(order_id):
    user_id = get_jwt_identity()
    
    # Kiểm tra quyền truy cập đơn hàng
    order = Order.query.get_or_404(order_id)
    if order.user_id != user_id:
        return jsonify({"error": "Không có quyền truy cập đơn hàng này"}), 403
    
    return jsonify({
        "order_id": order.id,
        "payment_status": order.payment_status,
        "transaction_id": order.transaction_id
    }), 200