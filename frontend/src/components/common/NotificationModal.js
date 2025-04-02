import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const NotificationModal = ({ show, onHide, title, message, product, showViewCart = true }) => {
  const [countdown, setCountdown] = useState(3);
  
  // Auto hide after countdown
  useEffect(() => {
    let timer;
    if (show && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      onHide();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, countdown, onHide]);
  
  // Reset countdown when modal is shown
  useEffect(() => {
    if (show) {
      setCountdown(3);
    }
  }, [show]);

  // Handle the "View Cart" button click when Link cannot be used
  const handleViewCartClick = () => {
    onHide();
    window.location.href = '/cart';
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      animation={true}
      size="sm"
    >
      <Modal.Header closeButton>
        <Modal.Title>{title || 'Thông báo'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {product && product.image_url && (
          <div className="text-center mb-3">
            <img 
              src={product.image_url} 
              alt={product.name} 
              style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        )}
        <p className="mb-0">{message}</p>
        {product && (
          <p className="mt-2 fw-bold">{product.name}</p>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <small className="text-muted">Tự đóng sau: {countdown}s</small>
        <div>
          <Button variant="secondary" size="sm" onClick={onHide} className="me-2">
            Tiếp tục mua sắm
          </Button>
          {showViewCart && (
            <Button variant="primary" size="sm" onClick={handleViewCartClick}>
              Xem giỏ hàng
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default NotificationModal; 