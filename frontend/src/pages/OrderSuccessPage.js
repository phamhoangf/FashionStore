import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderDetails } from '../services/orderService';
import { formatCurrency } from '../utils/formatUtils';
import { CartContext } from '../context/CartContext';

/**
 * Trang hiển thị đơn hàng thành công cho các đơn hàng COD
 */
const OrderSuccessPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { removeSelectedItems } = useContext(CartContext);

  // Xóa sản phẩm đã đặt khỏi giỏ hàng
  useEffect(() => {
    const removeOrderedItems = async () => {
      try {
        // Chỉ xử lý đơn hàng COD
        if (order && order.payment_method === 'vnpay') {
          console.log('VNPay orders should be handled by PaymentResultPage, redirecting...');
          navigate(`/payment/${order.id}`);
          return;
        }
        
        // Xóa sản phẩm khỏi giỏ hàng nếu là đơn hàng COD
        const selectedItemsStr = localStorage.getItem('selectedCartItems');
        
        if (selectedItemsStr) {
          try {
            const selectedItems = JSON.parse(selectedItemsStr);
            console.log('Removing ordered items from cart:', selectedItems);
            
            // Xóa sản phẩm đã chọn
            if (selectedItems && selectedItems.length > 0) {
              await removeSelectedItems(selectedItems, true);
              
              // Xóa dữ liệu từ localStorage
              localStorage.removeItem('selectedCartItems');
              
              // Cập nhật số lượng sản phẩm trong giỏ hàng trên UI
              try {
                const cartBadges = document.querySelectorAll('.position-absolute.badge');
                cartBadges.forEach(badge => {
                  if (badge.parentElement?.textContent.includes('Giỏ hàng')) {
                    const remainingCount = document.querySelectorAll('.cart-item').length;
                    badge.textContent = remainingCount > 0 ? remainingCount.toString() : '';
                    
                    if (remainingCount === 0) {
                      badge.style.display = 'none';
                    }
                  }
                });
              } catch (domError) {
                console.error('DOM update failed:', domError);
              }
            }
          } catch (parseError) {
            console.error('Error parsing selectedItems from localStorage:', parseError);
          }
        }
      } catch (error) {
        console.error('Error processing COD order:', error);
      }
    };

    if (order) {
      removeOrderedItems();
    }
  }, [order, removeSelectedItems, navigate]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) {
        setError('Mã đơn hàng không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const orderData = await getOrderDetails(id);
        
        if (orderData) {
          setOrder(orderData);
          
          // Nếu là đơn hàng VNPay, chuyển hướng đến trang thanh toán
          if (orderData.payment_method === 'vnpay') {
            navigate(`/payment/${orderData.id}`);
            return;
          }
        } else {
          setError('Không tìm thấy thông tin đơn hàng');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        
        let errorMessage = 'Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.';
        
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, navigate]);

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
        
        <div className="mb-4">
          <Alert variant="info">
            <strong>Thanh toán khi nhận hàng (COD)</strong>
            <p className="mb-0 mt-2">Bạn sẽ thanh toán khi nhận được hàng. Vui lòng chuẩn bị số tiền {formatCurrency(order.total_amount)} khi nhận hàng.</p>
          </Alert>
        </div>
        
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