import React, { useContext, useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { formatImageUrl } from '../../utils/imageUtils';
import './ProductCard.css';

// Ảnh mặc định khi không có ảnh
const DEFAULT_IMAGE = 'https://via.placeholder.com/300x400?text=No+Image';

const ProductCard = React.memo(({ product }) => {
  const { addItem } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  
  // Xác định nguồn ảnh khi component được tạo
  useEffect(() => {
    console.log('ProductCard - Original image URL:', product.image_url);
    
    // Kiểm tra xem sản phẩm có ảnh không
    if (!product.image_url || product.image_url.trim() === '') {
      console.log('ProductCard - No image, using default:', DEFAULT_IMAGE);
      setImageSrc(DEFAULT_IMAGE);
      setImageLoaded(true);
    } else {
      const formattedUrl = formatImageUrl(product.image_url, DEFAULT_IMAGE);
      console.log('ProductCard - Formatted image URL:', formattedUrl);
      setImageSrc(formattedUrl);
    }
  }, [product.image_url]);
  
  // Xử lý sự kiện thêm vào giỏ hàng
  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Thêm sản phẩm vào giỏ hàng với thông tin đầy đủ
    addItem(product.id, 1);
    
    // Hiển thị thông báo thành công
    alert('Đã thêm sản phẩm vào giỏ hàng!');
  }, [addItem, isAuthenticated, navigate, product.id]);
  
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

  return (
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
        <p className="card-text text-muted">{product.price.toLocaleString('vi-VN')} VNĐ</p>
        <div className="mt-auto">
          <Link to={`/products/${product.id}`} className="btn btn-outline-primary btn-sm me-2">
            Chi tiết
          </Link>
          <button className="btn btn-primary btn-sm" onClick={handleAddToCart}>
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;