import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatImageUrl } from '../../utils/imageUtils';
import './ProductCard.css';

// Ảnh mặc định khi không có ảnh
const DEFAULT_IMAGE = 'https://via.placeholder.com/300x400?text=No+Image';

const ProductCard = React.memo(({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  
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
          <Link to={`/products/${product.id}`} className="btn btn-primary w-100">
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;