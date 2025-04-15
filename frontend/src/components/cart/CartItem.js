import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';
import { CartContext } from '../../context/CartContext';
import { formatImageUrl } from '../../utils/imageUtils';

const CartItem = ({ item, onSelectItem, isSelected, showCheckbox = true }) => {
  const { updateItem, removeItem, updateItemSize } = useContext(CartContext);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState('https://via.placeholder.com/100x100');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState(item.size);
  
  // Default sizes if product doesn't have specific sizes
  const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
  const sizes = item.product?.sizes?.length > 0 ? item.product.sizes : DEFAULT_SIZES;

  // Debug: Log item data
  useEffect(() => {
    console.log('Cart item data:', item);
    console.log('Product data:', item?.product);
    console.log('Image URL from product:', item?.product?.image_url);
  }, [item]);

  // Xử lý URL ảnh khi component được tạo hoặc khi item thay đổi
  useEffect(() => {
    if (item && item.product && item.product.image_url) {
      // Sử dụng trực tiếp URL từ backend
      const url = formatImageUrl(item.product.image_url, 'https://via.placeholder.com/100x100');
      console.log('Formatted image URL:', url);
      setImageUrl(url);
    } else {
      setImageUrl('https://via.placeholder.com/100x100');
      console.log('Using default image for cart item');
    }
  }, [item]);

  const handleQuantityChange = async (e) => {
    const quantity = parseInt(e.target.value);
    if (quantity > 0 && quantity <= 10) {
      await updateItem(item.id, quantity);
    }
  };

  const handleRemoveItem = async () => {
    await removeItem(item.id);
    setShowRemoveModal(false);
  };

  const openRemoveModal = () => setShowRemoveModal(true);
  const closeRemoveModal = () => setShowRemoveModal(false);
  
  const openSizeModal = () => setShowSizeModal(true);
  const closeSizeModal = () => setShowSizeModal(false);
  
  const handleSizeChange = async () => {
    if (selectedSize !== item.size) {
      await updateItemSize(item.id, selectedSize);
      closeSizeModal();
    } else {
      closeSizeModal();
    }
  };

  // Tạo URL ảnh dự phòng
  const fallbackImageUrl = 'https://via.placeholder.com/100x100?text=No+Image';

  return (
    <div className={`card mb-3 ${isSelected ? 'border-primary' : ''}`}>
      <div className="card-body">
        <div className="row align-items-center">
          {showCheckbox && (
            <div className="col-md-1 col-2">
              <Form.Check
                type="checkbox"
                id={`item-${item.id}`}
                checked={isSelected}
                onChange={() => onSelectItem(item.id)}
                aria-label={`Select ${item.product?.name || 'item'}`}
              />
            </div>
          )}
          
          <div className={`${showCheckbox ? 'col-md-2 col-4' : 'col-md-2 col-4'}`}>
            <div 
              style={{ 
                width: '100%', 
                height: '100px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px'
              }}
            >
              {!imageLoaded && !imageError && (
                <div 
                  style={{ 
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <span>Đang tải...</span>
                </div>
              )}
              <img 
                src={imageUrl}
                alt={item.product?.name || 'Sản phẩm'}
                className="img-fluid rounded"
                style={{ 
                  maxHeight: '100%', 
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: imageLoaded || imageError ? 'block' : 'none'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  console.error('Error loading cart item image:', imageUrl);
                  setImageError(true);
                  setImageLoaded(true);
                  setImageUrl(fallbackImageUrl);
                }}
              />
              {imageError && (
                <div className="position-absolute bottom-0 start-0 w-100 text-center p-1 bg-light bg-opacity-75">
                  <small className="text-muted">Không thể tải ảnh</small>
                </div>
              )}
            </div>
          </div>
          
          <div className={`${showCheckbox ? 'col-md-3 col-6' : 'col-md-4 col-8'}`}>
            <h5 className="card-title mb-1">
              {item.product?.id ? (
                <Link to={`/products/${item.product.id}`} className="text-decoration-none">
                  {item.product.name || 'Sản phẩm không xác định'}
                </Link>
              ) : (
                <span>Sản phẩm #{item.product_id || 'không xác định'}</span>
              )}
            </h5>
            <div className="d-flex align-items-center">
              <p className="text-muted mb-0">Kích thước: {item.size}</p>
              <button 
                className="btn btn-sm btn-link text-primary p-0 ms-2" 
                onClick={openSizeModal}
                style={{ textDecoration: 'none' }}
              >
                <small>Thay đổi</small>
              </button>
            </div>
            <p className="text-muted mb-0 small">{item.product_id && !item.product && 'Không thể tải thông tin sản phẩm'}</p>
          </div>
          
          <div className="col-md-2 col-4 mt-3 mt-md-0">
            <div className="input-group input-group-sm">
              <input
                type="number"
                className="form-control text-center"
                value={item.quantity}
                onChange={handleQuantityChange}
                min="1"
                max="10"
              />
            </div>
          </div>
          
          <div className="col-md-2 col-4 mt-3 mt-md-0 text-end text-md-center">
            <span>{(item.price || item.product?.price || 0).toLocaleString('vi-VN')} VNĐ</span>
          </div>
          
          <div className="col-md-2 col-4 mt-3 mt-md-0 text-end">
            <button className="btn btn-sm btn-outline-danger" onClick={openRemoveModal}>
              <i className="bi bi-trash"></i> Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showRemoveModal} onHide={closeRemoveModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa {item.product?.name || 'sản phẩm này'} khỏi giỏ hàng?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeRemoveModal}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleRemoveItem}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Size Change Modal */}
      <Modal show={showSizeModal} onHide={closeSizeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thay đổi kích thước</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Chọn kích thước mới cho {item.product?.name || 'sản phẩm'}:</p>
          <div className="d-flex flex-wrap gap-2 my-3">
            {sizes.map(size => (
              <Button
                key={size}
                variant={selectedSize === size ? "primary" : "outline-primary"}
                onClick={() => setSelectedSize(size)}
                className="btn-size"
              >
                {size}
              </Button>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeSizeModal}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSizeChange}
            disabled={selectedSize === item.size}
          >
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CartItem;