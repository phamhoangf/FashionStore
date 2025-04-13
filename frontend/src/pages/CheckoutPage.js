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
  const { cart, totalAmount, removeSelectedItems, calculateSelectedTotal } = useContext(CartContext);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingFee, setShippingFee] = useState(30000); // Phí vận chuyển mặc định
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedItemsData, setSelectedItemsData] = useState([]);
  const [selectedTotal, setSelectedTotal] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    paymentMethod: 'cod' // Mặc định là thanh toán khi nhận hàng
  });

  // Biến kiểm soát đã hoàn thành kiểm tra chưa để tránh redirect loop
  const [checkoutInitialized, setCheckoutInitialized] = useState(false);

  // Lấy thông tin người dùng khi component được tải và đọc selected items từ localStorage
  useEffect(() => {
    console.log('CheckoutPage mounted - checking auth and selected items');
    let mounted = true;
    
    const initializeCheckout = async () => {
      // Đặt cờ để theo dõi trạng thái
      let redirectNeeded = false;
      let redirectCause = '';
      
      if (user) {
        if (mounted) {
          setFormData(prevState => ({
            ...prevState,
            name: user.name || '',
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || ''
          }));
        }
      } else {
        console.log('User not authenticated in checkout page');
        redirectNeeded = true;
        redirectCause = 'not authenticated';
      }
      
      // Load selected items from localStorage
      const selectedFromStorage = localStorage.getItem('selectedCartItems');
      if (selectedFromStorage) {
        try {
          const parsedSelected = JSON.parse(selectedFromStorage);
          console.log('Loaded selected items from localStorage:', parsedSelected);
          
          if (parsedSelected && parsedSelected.length > 0) {
            if (mounted) {
              setSelectedItems(parsedSelected);
            }
          } else {
            console.log('Empty selected items array in localStorage');
            redirectNeeded = true;
            redirectCause = 'empty selected items';
          }
        } catch (err) {
          console.error('Error parsing selected items:', err);
          redirectNeeded = true;
          redirectCause = 'parse error';
        }
      } else {
        console.log('No selected items found in localStorage');
        redirectNeeded = true;
        redirectCause = 'no selected items';
      }
      
      // Thực hiện chuyển hướng sau khi kiểm tra tất cả điều kiện
      if (mounted) {
        if (redirectNeeded) {
          console.log(`Redirecting to cart page. Cause: ${redirectCause}`);
          // Đặt timeout để tránh race condition
          setTimeout(() => {
            if (mounted) navigate('/cart');
          }, 100);
        } else {
          // Đánh dấu đã hoàn thành việc khởi tạo
          setCheckoutInitialized(true);
        }
      }
    };
    
    initializeCheckout();
    
    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [user, navigate]);

  // Update selected items data whenever selectedItems or cart changes
  useEffect(() => {
    if (selectedItems.length > 0 && cart.length > 0) {
      console.log('Selected items from localStorage:', selectedItems);
      console.log('Cart items from context:', cart);
      
      // Convert all IDs to strings to ensure consistent comparison
      const stringSelectedItems = selectedItems.map(id => String(id));
      
      // Log each item in cart for debugging
      cart.forEach(item => {
        console.log(`Cart item: ID=${item.id}, Type=${typeof item.id}, Selected=${stringSelectedItems.includes(String(item.id))}`);
      });
      
      // Ensure consistent comparison by converting to string
      const selected = cart.filter(item => stringSelectedItems.includes(String(item.id)));
      console.log('Selected items after filtering:', selected);
      
      if (selected.length > 0) {
        setSelectedItemsData(selected);
        const total = calculateSelectedTotal(selectedItems);
        setSelectedTotal(total);
      } else {
        console.log('No matching items found in cart based on selectedItems IDs');
        setSelectedItemsData([]);
        setSelectedTotal(0);
      }
    } else {
      console.log('Either selectedItems or cart is empty', { 
        selectedItemsLength: selectedItems.length, 
        cartLength: cart.length 
      });
      setSelectedItemsData([]);
      setSelectedTotal(0);
    }
  }, [selectedItems, cart, calculateSelectedTotal]);

  // Kiểm tra giỏ hàng trống hoặc không có item được chọn
  useEffect(() => {
    // Đặt một delay ngắn để đảm bảo dữ liệu đã được xử lý trước khi kiểm tra
    const timer = setTimeout(() => {
      // Chỉ thực hiện kiểm tra khi đã hoàn thành việc khởi tạo và đã tải dữ liệu xong
      if (checkoutInitialized && !loading && cart.length > 0 && selectedItems.length > 0) {
        console.log('Checking for empty selected items data after initialization');
        
        if (selectedItemsData.length === 0) {
          console.log('Selected items not found in cart after loading, returning to cart');
          // Lưu trạng thái lỗi vào localStorage để hiển thị thông báo ở trang giỏ hàng
          localStorage.setItem('checkout_error', 'Không tìm thấy sản phẩm đã chọn trong giỏ hàng');
          navigate('/cart');
        } else {
          console.log('Selected items found in cart, checkout can proceed');
          // Đảm bảo xóa lỗi nếu có
          localStorage.removeItem('checkout_error');
        }
      }
    }, 500); // Chờ 500ms để đảm bảo các dữ liệu đã được cập nhật
    
    return () => clearTimeout(timer);
  }, [cart, selectedItems, selectedItemsData, navigate, loading, checkoutInitialized]);

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
      // Chuẩn bị dữ liệu đơn hàng chỉ với các mặt hàng đã chọn
      const orderData = {
        shippingInfo: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          notes: formData.notes
        },
        paymentMethod: formData.paymentMethod,
        items: selectedItemsData.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          size: item.size
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
            // Xóa các sản phẩm đã chọn khỏi giỏ hàng
            await removeSelectedItems(selectedItems, true);
            
            // Clear selectedItems from localStorage
            localStorage.removeItem('selectedCartItems');
            
            // Force immediate visual update of the cart badge
            try {
              const cartBadges = document.querySelectorAll('.position-absolute.badge');
              cartBadges.forEach(badge => {
                if (badge.parentElement?.textContent.includes('Giỏ hàng')) {
                  const newCount = Math.max(0, parseInt(badge.textContent || '0') - selectedItemsData.length);
                  badge.textContent = newCount > 0 ? newCount.toString() : '';
                  if (newCount === 0) {
                    badge.style.display = 'none';
                  }
                }
              });
            } catch (domError) {
              console.error('DOM update failed:', domError);
            }
            
            console.log('Selected items removed from cart before VNPay redirect');
            
            // Add a small delay before redirecting to VNPay page
            setTimeout(() => {
              window.location.href = paymentResponse.payment_url;
            }, 300); // 300ms delay should be enough
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
        // Nếu thanh toán khi nhận hàng (COD), xóa sản phẩm đã chọn khỏi giỏ hàng và chuyển hướng đến trang thành công
        console.log('Processing COD payment for order:', order.id);
        
        try {
          // Xóa các sản phẩm đã chọn khỏi giỏ hàng
          await removeSelectedItems(selectedItems, true);
          
          // Clear selectedItems from localStorage
          localStorage.removeItem('selectedCartItems');
          
          // Force immediate visual update of the cart badge
          const cartBadges = document.querySelectorAll('.position-absolute.badge');
          cartBadges.forEach(badge => {
            if (badge.parentElement?.textContent.includes('Giỏ hàng')) {
              const newCount = Math.max(0, parseInt(badge.textContent || '0') - selectedItemsData.length);
              badge.textContent = newCount > 0 ? newCount.toString() : '';
              if (newCount === 0) {
                badge.style.display = 'none';
              }
            }
          });
          
          console.log('Selected items removed from cart before redirecting to success page');
          
          // Add a small delay before navigation to ensure everything is processed
          setTimeout(() => {
            navigate(`/order-success/${order.id}`);
          }, 300); // 300ms delay should be enough
          
        } catch (clearError) {
          console.error('Error removing selected items from cart:', clearError);
          // Still navigate even if there was an error clearing the cart
          navigate(`/order-success/${order.id}`);
        }
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
              <h5 className="mb-0">Đơn hàng của bạn ({selectedItemsData.length} sản phẩm)</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                {selectedItemsData.map(item => (
                  <div key={item.id} className="d-flex justify-content-between mb-2">
                    <div>
                      <span className="fw-bold">{item.quantity} x </span>
                      {item.product.name}
                      <br />
                      <small className="text-muted">Size: {item.size}</small>
                    </div>
                    <div>{formatCurrency(item.product.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-2">
                <div>Tạm tính:</div>
                <div>{formatCurrency(selectedTotal)}</div>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <div>Phí vận chuyển:</div>
                <div>{formatCurrency(shippingFee)}</div>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-2 fw-bold">
                <div>Tổng cộng:</div>
                <div>{formatCurrency(selectedTotal + shippingFee)}</div>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Body>
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={() => {
                  localStorage.removeItem('selectedCartItems');
                  navigate('/cart');
                }}
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