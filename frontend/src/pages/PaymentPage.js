import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getOrderDetails, payWithVNPay } from '../services/orderService';
import { formatCurrency } from '../utils/formatUtils';

const PaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const orderData = await getOrderDetails(id);
        
        if (orderData) {
          setOrder(orderData);
          
          // Nếu thanh toán là COD, chuyển hướng đến trang thành công
          if (orderData.payment_method === 'cod') {
            navigate(`/order-success/${id}`);
            return;
          }
          
          // Nếu là VNPay và đơn hàng đã thanh toán, chuyển hướng đến trang xác nhận thanh toán
          if (orderData.payment_method === 'vnpay' && orderData.payment_status === 'paid') {
            // Redirect đến trang kết quả thanh toán thành công
            navigate(`/payment/success?order_id=${id}`);
            return;
          }
        } else {
          setError('Không tìm thấy thông tin đơn hàng');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, navigate]);

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      setError(''); // Clear any previous errors
      
      console.log('Starting payment process for order:', id);
      const paymentResponse = await payWithVNPay(id);
      
      if (paymentResponse && paymentResponse.payment_url) {
        console.log('Redirecting to payment URL:', paymentResponse.payment_url);
        
        // Lưu danh sách các sản phẩm đã chọn vào localStorage để xử lý sau khi thanh toán thành công
        // (Nếu chưa được lưu từ CheckoutPage)
        if (!localStorage.getItem('vnpay_pending_order')) {
          localStorage.setItem('vnpay_pending_order', id);
          localStorage.setItem('vnpay_payment_timestamp', new Date().getTime().toString());
        }
        
        // Use timeout to ensure the UI updates before redirecting
        setTimeout(() => {
          window.location.href = paymentResponse.payment_url;
        }, 100);
      } else {
        throw new Error('Không thể tạo URL thanh toán');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(typeof error === 'string' ? error : (error.message || 'Không thể khởi tạo thanh toán. Vui lòng thử lại sau.'));
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thông tin đơn hàng...</p>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Không tìm thấy thông tin đơn hàng'}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Thanh toán đơn hàng</h1>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Thông tin đơn hàng #{order.id}</h5>
        </Card.Header>
        <Card.Body>
          <p><strong>Tổng tiền:</strong> {formatCurrency(order.total_amount)}</p>
          <p><strong>Trạng thái đơn hàng:</strong> {order.status === 'pending' ? 'Chờ xác nhận' : order.status}</p>
          <p><strong>Trạng thái thanh toán:</strong> {order.payment_status === 'pending' ? 'Chưa thanh toán' : order.payment_status}</p>
          <p><strong>Phương thức thanh toán:</strong> {order.payment_method === 'vnpay' ? 'VNPay' : order.payment_method}</p>
          
          {order.payment_method === 'vnpay' && order.payment_status === 'pending' && (
            <div className="mt-4">
              <Alert variant="info">
                Vui lòng nhấn nút bên dưới để tiếp tục thanh toán qua VNPay.
              </Alert>
              <Button 
                variant="primary" 
                size="lg" 
                className="mt-3"
                onClick={handlePayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-2">Đang xử lý...</span>
                  </>
                ) : (
                  'Thanh toán qua VNPay'
                )}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
      
      <div className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
        
        <Button variant="outline-primary" onClick={() => navigate('/')}>
          Tiếp tục mua sắm
        </Button>
      </div>
    </Container>
  );
};

export default PaymentPage;