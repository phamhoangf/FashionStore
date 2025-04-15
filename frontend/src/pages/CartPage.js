import React, { useContext, useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import CartItem from '../components/cart/CartItem';
import { formatCurrency } from '../utils/formatUtils';

const CartPage = () => {
  const { cart, totalAmount, loading, calculateSelectedTotal } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedTotal, setSelectedTotal] = useState(0);
  // State để hiển thị thông báo lỗi
  const [checkoutError, setCheckoutError] = useState('');
  
  // Kiểm tra xem có lỗi từ trang checkout được lưu trong localStorage không
  useEffect(() => {
    const error = localStorage.getItem('checkout_error');
    if (error) {
      setCheckoutError(error);
      // Xóa thông báo lỗi sau khi đã đọc
      localStorage.removeItem('checkout_error');
    }
  }, []);
  
  // Reset selected items when cart changes
  useEffect(() => {
    if (cart && cart.length > 0) {
      // By default, select all items
      setSelectedItems(cart.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  }, [cart]);
  
  // Calculate total for selected items
  useEffect(() => {
    const total = calculateSelectedTotal(selectedItems);
    setSelectedTotal(total);
  }, [selectedItems, calculateSelectedTotal]);

  // Hàm để tiến hành thanh toán và chuyển trang
  const proceedToCheckout = () => {
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
      return;
    }
    
    console.log('Proceeding to checkout with selected items:', selectedItems);
    
    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập với redirect về checkout
      console.log('User not authenticated, navigating to login page');
      navigate('/login?redirect=/checkout');
    } else {
      try {
        // Lưu danh sách sản phẩm đã chọn vào localStorage
        localStorage.removeItem('selectedCartItems'); // Xóa dữ liệu cũ trước
        localStorage.setItem('selectedCartItems', JSON.stringify(selectedItems));
        console.log('Selected items saved to localStorage:', selectedItems);
        
        // Sử dụng navigate trực tiếp thay vì window.location.href
        navigate('/checkout');
      } catch (error) {
        console.error('Error during checkout process:', error);
        alert('Có lỗi xảy ra khi chuyển hướng đến trang thanh toán. Vui lòng thử lại.');
      }
    }
  };
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(cart.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };
  
  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };
  
  const allSelected = cart.length > 0 && selectedItems.length === cart.length;

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải giỏ hàng...</p>
      </Container>
    );
  }

  if (cart.length === 0) {
    return (
      <Container className="py-5">
        <h1 className="mb-4">Giỏ hàng</h1>
        <Card className="p-5 text-center">
          <Card.Body>
            <p>Giỏ hàng của bạn đang trống.</p>
            <Button as={Link} to="/products" variant="primary">
              Tiếp tục mua sắm
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Giỏ hàng</h1>
      
      {checkoutError && (
        <Alert variant="warning" dismissible onClose={() => setCheckoutError('')}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {checkoutError}
        </Alert>
      )}
      
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white d-flex align-items-center">
              <Form.Check 
                type="checkbox" 
                id="select-all-items"
                label="Chọn tất cả"
                checked={allSelected}
                onChange={handleSelectAll}
                className="mb-0 me-auto"
              />
              <div className="ms-2 text-muted">
                <small>Đã chọn {selectedItems.length}/{cart.length} sản phẩm</small>
              </div>
            </Card.Header>
            <Card.Body>
              {cart.map(item => (
                <CartItem 
                  key={item.id} 
                  item={item} 
                  onSelectItem={handleSelectItem} 
                  isSelected={selectedItems.includes(item.id)}
                />
              ))}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Tổng giỏ hàng</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-3">
                <span>Tạm tính:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-3">
                <span>Số lượng đã chọn:</span>
                <span>{selectedItems.length} sản phẩm</span>
              </div>
              
              <div className="d-flex justify-content-between mb-3">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-4">
                <strong>Tổng cộng:</strong>
                <strong>{formatCurrency(selectedTotal)}</strong>
              </div>
              
              <div className="d-grid gap-2">
                
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={proceedToCheckout}
                  disabled={selectedItems.length === 0}
                >
                  Tiến hành thanh toán
                </Button>
                
                <Button 
                  as={Link} 
                  to="/products" 
                  variant="outline-secondary"
                >
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

export default CartPage;