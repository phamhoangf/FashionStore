import React, { useState, useCallback, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatImageUrl } from '../../utils/imageUtils';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Modal, Button, Form } from 'react-bootstrap';
import './ProductCard.css';

// Ảnh mặc định khi không có ảnh
const DEFAULT_IMAGE = 'https://via.placeholder.com/300x400?text=No+Image';
// Sizes mặc định nếu sản phẩm không có sizes cụ thể
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const ProductCard = React.memo(({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const { addItem } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State cho modal chọn size và số lượng
  const [showModal, setShowModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // Xác định nguồn ảnh khi component được tạo
  useEffect(() => {
    // Kiểm tra xem sản phẩm có ảnh không
    if (!product.image_url || product.image_url.trim() === '') {
      setImageSrc(DEFAULT_IMAGE);
      setImageLoaded(true);
    } else {
      const formattedUrl = formatImageUrl(product.image_url, DEFAULT_IMAGE);
      setImageSrc(formattedUrl);
    }
  }, [product.image_url]);
  
  // Xử lý sự kiện khi ảnh tải xong
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  // Xử lý sự kiện khi ảnh lỗi
  const handleImageError = useCallback(() => {
    // Nếu ảnh lỗi, sử dụng ảnh mặc định
    setImageSrc(DEFAULT_IMAGE);
    setImageLoaded(true);
  }, []);
  
  // Mở modal chọn size và số lượng
  const handleOpenModal = useCallback(() => {
    if (!isAuthenticated) {
      // Chuyển hướng đến trang đăng nhập
      navigate(`/login?redirect=/products/${product.id}`);
      return;
    }
    
    // Lấy danh sách sizes có sẵn
    const availableSizes = Array.isArray(product.sizes) && product.sizes.length > 0 
      ? product.sizes 
      : DEFAULT_SIZES;
    
    // Đặt size mặc định là size đầu tiên
    setSelectedSize(availableSizes[0]);
    setQuantity(1);  // Đặt số lượng mặc định là 1
    setShowModal(true);  // Mở modal
  }, [isAuthenticated, navigate, product]);
  
  // Đóng modal
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);
  
  // Xử lý thêm vào giỏ hàng sau khi chọn size và số lượng
  const handleAddToCart = useCallback(() => {
    // Thêm sản phẩm vào giỏ hàng với size và số lượng đã chọn
    addItem(product.id, quantity, selectedSize)
      .then(() => {
        toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
        setShowModal(false);  // Đóng modal sau khi thêm thành công
      })
      .catch(error => {
        toast.error(error.message || 'Không thể thêm sản phẩm vào giỏ hàng');
      });
  }, [addItem, product, quantity, selectedSize]);

  // Xác định danh sách sizes hiển thị trong modal
  const availableSizes = Array.isArray(product.sizes) && product.sizes.length > 0 
    ? product.sizes 
    : DEFAULT_SIZES;

  return (
    <>
      <div className="card h-100 product-card">
        <div className="card-img-container">
          {!imageLoaded && (
            <div className="image-placeholder">
              <div className="spinner-border text-secondary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          <img 
            src={imageSrc}
            className={`card-img-top ${imageLoaded ? 'visible' : 'hidden'}`}
            alt={product.name}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{product.name}</h5>
          <div className="mb-3">
            <div className="price-display">
              <span className="current-price">{product.price.toLocaleString('vi-VN')} VNĐ</span>
              {product.discount_price && (
                <del className="text-muted ms-2 original-price">
                  {product.discount_price.toLocaleString('vi-VN')} VNĐ
                </del>
              )}
            </div>
          </div>
          <div className="mt-auto">
            <div className="d-flex gap-2">
              <Link to={`/products/${product.id}`} className="btn btn-primary flex-grow-1">
                Xem chi tiết
              </Link>
              <button onClick={handleOpenModal} className="btn btn-outline-primary">
                <i className="bi bi-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal chọn size và số lượng */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thêm vào giỏ hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-center mb-3">
            <img 
              src={imageSrc} 
              alt={product.name} 
              className="me-3" 
              style={{ width: '80px', height: '80px', objectFit: 'cover' }} 
            />
            <div>
              <h5>{product.name}</h5>
              <div className="price-display">
                <span className="current-price">{product.price.toLocaleString('vi-VN')} VNĐ</span>
                {product.discount_price && (
                  <del className="text-muted ms-2 original-price">
                    {product.discount_price.toLocaleString('vi-VN')} VNĐ
                  </del>
                )}
              </div>
            </div>
          </div>
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Kích thước</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <Button 
                    key={size} 
                    variant={selectedSize === size ? "primary" : "outline-secondary"}
                    onClick={() => setSelectedSize(size)}
                    className="size-button"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Số lượng</Form.Label>
              <div className="quantity-selector d-flex align-items-center">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="quantity-button"
                >
                  <i className="bi bi-dash"></i>
                </Button>
                <Form.Control 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center mx-2"
                  style={{ width: '60px' }}
                />
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="quantity-button"
                >
                  <i className="bi bi-plus"></i>
                </Button>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleAddToCart}>
            Thêm vào giỏ
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
});

export default ProductCard;