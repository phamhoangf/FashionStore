import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { createOrder, payWithVNPay } from '../services/orderService';
import { formatCurrency } from '../utils/formatUtils';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { cart, totalAmount, clearCart } = useContext(CartContext);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingFee, setShippingFee] = useState(30000); // Phí vận chuyển mặc định
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    paymentMethod: 'cod' // Mặc định là thanh toán khi nhận hàng
  });

  // Lấy thông tin người dùng khi component được tải
  useEffect(() => {
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || ''
      }));
    }
  }, [user]);

  // Kiểm tra giỏ hàng trống
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Kiểm tra thông tin
    if (!formData.name || !formData.phone || !formData.address || !formData.city) {
      setError('Vui lòng điền đầy đủ thông tin giao hàng');
      setLoading(false);
      return;
    }

    try {
      // Chuẩn bị dữ liệu đơn hàng
      const orderData = {
        shippingInfo: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          notes: formData.notes
        },
        paymentMethod: formData.paymentMethod,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      console.log('Sending order data:', orderData);

      // Tạo đơn hàng
      const order = await createOrder(orderData);
      console.log('Order created:', order);
      
      // Xử lý thanh toán
      if (formData.paymentMethod === 'vnpay') {
        try {
          // Nếu thanh toán qua VNPay, chuyển hướng đến trang thanh toán
          const paymentResponse = await payWithVNPay(order.id);
          console.log('Payment response:', paymentResponse);
          if (paymentResponse && paymentResponse.payment_url) {
            // Xóa giỏ hàng trước khi chuyển hướng
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
            
            console.log('Cart cleared before VNPay redirect');
            // Chuyển hướng đến trang thanh toán VNPay
            window.location.href = paymentResponse.payment_url;
          } else {
            throw new Error('Không thể tạo URL thanh toán');
          }
        } catch (paymentError) {
          console.error('VNPay payment error:', paymentError);
          setError(paymentError.message || 'Lỗi khi tạo thanh toán VNPay');
          setLoading(false);
          return;
        }
      } else {
        // Nếu thanh toán khi nhận hàng (COD), xóa giỏ hàng và chuyển hướng đến trang thành công
        console.log('Processing COD payment for order:', order.id);
        
        // Xóa giỏ hàng trước khi chuyển hướng
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
        
        console.log('Cart cleared before redirecting to success page');
        navigate(`/order-success/${order.id}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        setError(error.response?.data?.error || error.message || 'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại sau.');
      } else {
        setError(error.message || 'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại sau.');
      }
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Vui lòng <Alert.Link href="/login?redirect=/checkout">đăng nhập</Alert.Link> để tiếp tục thanh toán.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Thanh toán</h1>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Row>
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Thông tin giao hàng</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Họ tên người nhận <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Tỉnh/Thành phố <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                  />
                </Form.Group>
                
                <Card className="mb-4">
                  <Card.Header className="bg-white">
                    <h5 className="mb-0">Phương thức thanh toán</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group>
                      <Form.Check
                        type="radio"
                        id="cod"
                        name="paymentMethod"
                        value="cod"
                        label="Thanh toán khi nhận hàng (COD)"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleChange}
                        className="mb-2"
                      />
                      <Form.Check
                        type="radio"
                        id="vnpay"
                        name="paymentMethod"
                        value="vnpay"
                        label="Thanh toán qua VNPay (Thẻ ATM, Visa, MasterCard, JCB, QR Code)"
                        checked={formData.paymentMethod === 'vnpay'}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
                
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg" 
                    disabled={loading}
                  >
                    {loading ? (
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
                      'Đặt hàng'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Đơn hàng của bạn</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                {cart.map(item => (
                  <div key={item.id} className="d-flex justify-content-between mb-2">
                    <div>
                      <span className="fw-bold">{item.quantity} x </span>
                      {item.product.name}
                    </div>
                    <div>{formatCurrency(item.product.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-2">
                <div>Tạm tính:</div>
                <div>{formatCurrency(totalAmount)}</div>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <div>Phí vận chuyển:</div>
                <div>{formatCurrency(shippingFee)}</div>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-2 fw-bold">
                <div>Tổng cộng:</div>
                <div>{formatCurrency(totalAmount + shippingFee)}</div>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Body>
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={() => navigate('/cart')}
              >
                Quay lại giỏ hàng
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;