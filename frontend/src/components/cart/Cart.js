import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, ListGroup, Button, Card } from 'react-bootstrap';
import { CartContext } from '../../context/CartContext';
import CartItem from './CartItem';

const Cart = () => {
  const { cartItems, getTotalPrice, clearCart } = useContext(CartContext);

  const renderEmptyCart = () => (
    <Container className="py-5 text-center">
      <div className="mb-4">
        <i className="bi bi-cart-x" style={{ fontSize: '3rem' }}></i>
      </div>
      <h3>Your cart is empty</h3>
      <p className="text-muted">Looks like you haven't added any products to your cart yet.</p>
      <Link to="/products">
        <Button variant="primary">Continue Shopping</Button>
      </Link>
    </Container>
  );

  const renderCartItems = () => (
    <Container className="py-5">
      <h2 className="mb-4">Your Shopping Cart</h2>
      <Row>
        <Col md={8}>
          <ListGroup variant="flush">
            {cartItems.map(item => (
              <ListGroup.Item key={item.id} className="py-3">
                <CartItem item={item} />
              </ListGroup.Item>
            ))}
          </ListGroup>
          <div className="d-flex justify-content-between mt-3">
            <Button 
              variant="outline-secondary" 
              as={Link} 
              to="/products"
            >
              Continue Shopping
            </Button>
            <Button 
              variant="outline-danger" 
              onClick={clearCart}
              disabled={cartItems.length === 0}
            >
              Clear Cart
            </Button>
          </div>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Order Summary</Card.Title>
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3 fw-bold">
                <span>Total:</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
              <Button 
                variant="primary" 
                className="w-100"
                as={Link}
                to="/checkout"
                disabled={cartItems.length === 0}
              >
                Proceed to Checkout
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );

  return cartItems.length === 0 ? renderEmptyCart() : renderCartItems();
};

export default Cart; 