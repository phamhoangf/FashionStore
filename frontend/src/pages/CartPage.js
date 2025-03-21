import React, { useContext } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import CartItem from '../components/cart/CartItem';
import { formatCurrency } from '../utils/formatUtils';

const CartPage = () => {
  const { cart, totalAmount, loading } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập với redirect về checkout
      navigate('/login?redirect=/checkout');
    } else {
      // Nếu đã đăng nhập, chuyển hướng đến trang thanh toán
      navigate('/checkout');
    }
  };

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
      
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              {cart.map(item => (
                <CartItem key={item.id} item={item} />
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
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-4">
                <strong>Tổng cộng:</strong>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleCheckout}
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