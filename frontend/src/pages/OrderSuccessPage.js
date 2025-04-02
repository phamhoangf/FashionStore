import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getOrderDetails } from '../services/orderService';
import { formatCurrency } from '../utils/formatUtils';
import { CartContext } from '../context/CartContext';

const OrderSuccessPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { clearCart } = useContext(CartContext);

  // Kiểm tra xem có phải từ VNPay chuyển về không
  const isFromVNPay = location.search.includes('vnp_ResponseCode');
  const vnpResponseCode = new URLSearchParams(location.search).get('vnp_ResponseCode');
  const paymentSuccess = vnpResponseCode === '00';

  // Đảm bảo giỏ hàng được xóa khi đến trang này, nhất là khi từ VNPay chuyển về
  useEffect(() => {
    const ensureCartCleared = async () => {
      try {
        // Đảm bảo giỏ hàng được xóa, đặc biệt khi từ VNPay redirect về
        await clearCart(true);
        
        // Force immediate visual update of the cart badge
        try {
          const cartBadges = document.querySelectorAll('.position-absolute.badge');
          cartBadges.forEach(badge => {
            if (badge.parentElement?.textContent.includes('Giỏ hàng')) {
              badge.style.display = 'none';
            }
          });
        } catch (domError) {
          console.error('DOM update failed:', domError);
        }
        
        console.log('Cart cleared on OrderSuccessPage load');
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    };

    ensureCartCleared();
  }, [clearCart]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) {
        setError('Mã đơn hàng không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(''); // Clear any previous errors
        
        console.log(`Attempting to fetch order ${id} details`);
        const orderData = await getOrderDetails(id);
        
        if (orderData) {
          console.log(`Order ${id} data loaded successfully:`, orderData);
          setOrder(orderData);
        } else {
          console.error(`Order ${id} data is empty or invalid`);
          setError('Không tìm thấy thông tin đơn hàng');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        
        // Handle error message coming as string or object
        let errorMessage;
        
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = 'Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.';
        }
        
        // Handle specific error cases
        if (errorMessage.includes('quyền truy cập')) {
          errorMessage = 'Bạn không có quyền truy cập đơn hàng này';
        } else if (errorMessage.includes('không tìm thấy')) {
          errorMessage = 'Không tìm thấy thông tin đơn hàng với mã này';
        } else if (errorMessage.includes('role') || errorMessage.includes('attribute')) {
          errorMessage = 'Lỗi hệ thống khi xác thực quyền truy cập';
        }
        
        setError(errorMessage);
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
        
        {order.payment_method === 'cod' && (
          <div className="mb-4">
            <Alert variant="info">
              <strong>Thanh toán khi nhận hàng (COD)</strong>
              <p className="mb-0 mt-2">Bạn sẽ thanh toán khi nhận được hàng. Vui lòng chuẩn bị số tiền {formatCurrency(order.total_amount)} khi nhận hàng.</p>
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