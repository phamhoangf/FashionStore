import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { getOrderDetails } from '../services/orderService';
import api from '../services/api';

/**
 * Trang kết quả thanh toán VNPay - xử lý cả thành công và lỗi
 */
const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { removeSelectedItems } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [processingCart, setProcessingCart] = useState(false);
  const [verifyAttempted, setVerifyAttempted] = useState(false);
  
  // Lấy order_id từ query params và trạng thái (success hoặc error)
  const orderId = searchParams.get('order_id');
  const isSuccess = window.location.pathname.includes('/payment/success');
  
  // Xác minh thanh toán với backend
  const verifyPaymentWithBackend = async (orderId) => {
    try {
      setProcessingCart(true);
      
      // Lấy thông tin về các mặt hàng đang chờ từ localStorage
      const pendingItemsJson = localStorage.getItem('vnpay_pending_items');
      
      // Lấy các tham số khác từ URL nếu có
      const vnpResponseCode = searchParams.get('vnp_ResponseCode');
      const transactionId = searchParams.get('vnp_TransactionNo');
      
      // Gọi API xác minh thanh toán - không cần xác thực JWT
      console.log('Verifying payment with backend for order:', orderId);
      
      // Tạo public endpoint không cần JWT cho việc xác minh
      const response = await api.get(`/orders/${orderId}/payment-status`);
      console.log('Payment verification response:', response);
      
      // Nếu backend xác nhận thanh toán thành công và cần xóa giỏ hàng
      if (response && response.payment_status === 'paid') {
        if (pendingItemsJson) {
          const pendingItems = JSON.parse(pendingItemsJson);
          
          // Xóa items khỏi giỏ hàng
          if (pendingItems && pendingItems.length > 0) {
            console.log('Removing items from cart after payment verification');
            await removeSelectedItems(pendingItems, true);
            
            // Cập nhật UI badge giỏ hàng
            try {
              const cartBadges = document.querySelectorAll('.position-absolute.badge');
              cartBadges.forEach(badge => {
                if (badge.parentElement?.textContent.includes('Giỏ hàng')) {
                  const newCount = Math.max(0, parseInt(badge.textContent || '0') - pendingItems.length);
                  badge.textContent = newCount > 0 ? newCount.toString() : '';
                  if (newCount === 0) {
                    badge.style.display = 'none';
                  }
                }
              });
            } catch (domError) {
              console.error('DOM update failed:', domError);
            }
          }
          
          // Xóa dữ liệu thanh toán từ localStorage
          localStorage.removeItem('selectedCartItems');
          localStorage.removeItem('vnpay_pending_order');
          localStorage.removeItem('vnpay_pending_items');
          localStorage.removeItem('vnpay_payment_timestamp');
        }
      } else {
        console.log('Payment not verified as paid or no need to clear cart');
        // Khi thanh toán thất bại, giữ nguyên sản phẩm trong giỏ hàng
      }
      
      // Đánh dấu đã xác minh
      setVerifyAttempted(true);
      
    } catch (err) {
      console.error('Error verifying payment with backend:', err);
    } finally {
      setProcessingCart(false);
    }
  };
  
  useEffect(() => {
    // Lưu trạng thái thanh toán và orderId
    if (isSuccess) {
      console.log('Payment successful, order ID:', orderId);
    } else {
      console.log('Payment failed, order ID:', orderId);
    }
    
    if (!orderId) {
      setLoading(false);
      setError('Không tìm thấy mã đơn hàng');
      return;
    }
    
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderDetails(orderId);
        setOrder(orderData);
        
        // Nếu đang ở trang thành công và chưa thử xác minh thanh toán
        if (isSuccess && !verifyAttempted) {
          await verifyPaymentWithBackend(orderId);
        } else if (!isSuccess) {
          // Thanh toán thất bại, giữ nguyên giỏ hàng
          console.log('Payment failed, items remain in cart');
          
          // Nếu ở trang lỗi, xóa thông tin về việc thanh toán đang diễn ra
          // nhưng vẫn giữ các sản phẩm trong giỏ hàng
          localStorage.removeItem('vnpay_pending_order');
          localStorage.removeItem('vnpay_payment_timestamp');
          // GIỮ NGUYÊN 'vnpay_pending_items' để người dùng có thể thử thanh toán lại
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, isSuccess, removeSelectedItems, verifyAttempted]);
  
  if (loading || processingCart) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </Spinner>
        <p className="mt-3">{processingCart ? 'Đang xử lý giỏ hàng...' : 'Đang xử lý kết quả thanh toán...'}</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Đã xảy ra lỗi</Alert.Heading>
          <p>{error}</p>
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="primary" as={Link} to="/">
            Về trang chủ
          </Button>
          <Button variant="outline-primary" as={Link} to="/orders">
            Xem đơn hàng của tôi
          </Button>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="border-0 shadow">
            <Card.Body className="p-5">
              {isSuccess ? (
                <>
                  <div className="text-center mb-4">
                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                    <h2 className="mt-3">Thanh toán thành công!</h2>
                    <p className="text-muted">
                      Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được thanh toán thành công và đang được xử lý.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '4rem' }}></i>
                    <h2 className="mt-3">Thanh toán không thành công</h2>
                    <p className="text-muted">
                      Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
                    </p>
                  </div>
                </>
              )}
              
              {order && (
                <div className="border rounded p-3 bg-light mb-4">
                  <h5 className="mb-3">Thông tin đơn hàng</h5>
                  <Row>
                    <Col xs={6}>
                      <p className="mb-1"><strong>Mã đơn hàng:</strong> #{order.id}</p>
                      <p className="mb-1"><strong>Ngày đặt hàng:</strong> {new Date(order.order_date).toLocaleDateString('vi-VN')}</p>
                      <p className="mb-1"><strong>Trạng thái:</strong> {order.status}</p>
                    </Col>
                    <Col xs={6}>
                      <p className="mb-1"><strong>Tổng tiền:</strong> {order.total_amount.toLocaleString('vi-VN')}đ</p>
                      <p className="mb-1"><strong>Trạng thái thanh toán:</strong> {order.payment_status}</p>
                      {order.transaction_id && (
                        <p className="mb-1"><strong>Mã giao dịch:</strong> {order.transaction_id}</p>
                      )}
                    </Col>
                  </Row>
                </div>
              )}
              
              <div className="d-flex justify-content-center gap-3">
                <Button variant="primary" as={Link} to={`/orders/${orderId}`}>
                  Xem chi tiết đơn hàng
                </Button>
                <Button variant="outline-primary" as={Link} to="/">
                  Tiếp tục mua sắm
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentResultPage;