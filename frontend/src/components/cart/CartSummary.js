import React, { useContext, useState } from 'react';
import { Button, Card, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';

const CartSummary = () => {
  const { cart, clearCart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login?redirect=/checkout');
    }
  };

  const openClearCartModal = () => setShowClearCartModal(true);
  const closeClearCartModal = () => setShowClearCartModal(false);

  const handleClearCart = () => {
    clearCart();
    setShowClearCartModal(false);
  };

  const totalQuantity = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const subTotal = cart?.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  const shippingFee = subTotal > 0 ? 30000 : 0; // Phí vận chuyển cố định
  const total = subTotal + shippingFee;

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">Tổng giỏ hàng</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between mb-2">
            <span>Số lượng sản phẩm:</span>
            <span className="fw-bold">{totalQuantity}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Tạm tính:</span>
            <span className="fw-bold">{subTotal.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Phí vận chuyển:</span>
            <span className="fw-bold">{shippingFee.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          <hr />
          <div className="d-flex justify-content-between mb-3">
            <span className="fs-5">Tổng cộng:</span>
            <span className="fs-5 fw-bold">{total.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleCheckout}
              disabled={totalQuantity === 0}
            >
              Tiến hành đặt hàng
            </Button>
            <Button 
              variant="outline-danger" 
              onClick={openClearCartModal}
              disabled={totalQuantity === 0}
            >
              Xóa giỏ hàng
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Clear Cart Confirmation Modal */}
      <Modal show={showClearCartModal} onHide={closeClearCartModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa giỏ hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeClearCartModal}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleClearCart}>
            Xóa tất cả
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CartSummary; 