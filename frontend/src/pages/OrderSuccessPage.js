import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getOrderDetails } from '../services/orderService';
import { formatCurrency } from '../utils/formatUtils';

const OrderSuccessPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Kiểm tra xem có phải từ VNPay chuyển về không
  const isFromVNPay = location.search.includes('vnp_ResponseCode');
  const vnpResponseCode = new URLSearchParams(location.search).get('vnp_ResponseCode');
  const paymentSuccess = vnpResponseCode === '00';

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const orderData = await getOrderDetails(id);
        
        if (orderData) {
          setOrder(orderData);
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
  }, [id]);

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
        <Button variant="primary" onClick={() => navigate('/')}>
          Quay lại trang chủ
        </Button>
      </Container>
    );
  }

  // Nếu từ VNPay chuyển về và thanh toán thất bại
  if (isFromVNPay && !paymentSuccess) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5 shadow-sm">
          <div className="mb-4">
            <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '4rem' }}></i>
          </div>
          <h1 className="mb-4">Thanh toán thất bại!</h1>
          <p className="mb-3">Mã đơn hàng của bạn là: <strong>#{order.id}</strong></p>
          <p className="mb-4">Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="primary" onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </Button>
            <Button variant="outline-primary" onClick={() => navigate('/orders')}>
              Xem đơn hàng
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="text-center p-5 shadow-sm">
        <div className="mb-4">
          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
        </div>
        <h1 className="mb-4">Đặt hàng thành công!</h1>
        <p className="mb-3">Mã đơn hàng của bạn là: <strong>#{order.id}</strong></p>
        <p className="mb-3">Tổng giá trị đơn hàng: <strong>{formatCurrency(order.total_amount)}</strong></p>
        <p className="mb-4">Cảm ơn bạn đã mua hàng tại cửa hàng của chúng tôi.</p>
        
        {order.payment_method === 'vnpay' && (
          <div className="mb-4">
            <Alert variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
              {order.payment_status === 'paid' 
                ? 'Thanh toán đã được xác nhận thành công!' 
                : 'Đơn hàng đang chờ xác nhận thanh toán.'}
            </Alert>
          </div>
        )}
        
        <div className="d-flex justify-content-center gap-3">
          <Button variant="primary" onClick={() => navigate('/')}>
            Tiếp tục mua sắm
          </Button>
          <Button variant="outline-primary" onClick={() => navigate('/orders')}>
            Xem đơn hàng
          </Button>
        </div>
      </Card>
    </Container>
  );
};

export default OrderSuccessPage; 