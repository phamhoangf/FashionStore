import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { formatImageUrl } from '../utils/imageUtils';
import './ProductDetailPage.css';

// Ảnh mặc định khi không có ảnh
const DEFAULT_IMAGE = 'https://via.placeholder.com/600x800?text=No+Image';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [error, setError] = useState('');
  const { addItem } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setImageLoaded(false);
        setImageError(false);
        
        const data = await getProductById(id);
        setProduct(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        
        // Xác định nguồn ảnh
        if (!data.image_url || data.image_url.trim() === '') {
          setImageSrc(DEFAULT_IMAGE);
          setImageLoaded(true);
        } else {
          const formattedUrl = formatImageUrl(data.image_url, DEFAULT_IMAGE);
          setImageSrc(formattedUrl);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Không thể tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleQuantityChange = useCallback((e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.stock || 10)) {
      setQuantity(value);
    }
  }, [product]);

  const incrementQuantity = () => {
    if (quantity < 10) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = useCallback(() => {
    if (!isAuthenticated) {
      // Chuyển hướng đến trang đăng nhập
      window.location.href = '/login';
      return;
    }
    
    if (product) {
      addItem(product.id, quantity);
      alert('Đã thêm sản phẩm vào giỏ hàng!');
    }
  }, [addItem, isAuthenticated, product, quantity]);

  // Xử lý sự kiện khi ảnh tải xong
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  // Xử lý sự kiện khi ảnh lỗi
  const handleImageError = useCallback(() => {
    setImageSrc(DEFAULT_IMAGE);
    setImageLoaded(true);
    setImageError(true);
  }, []);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error || 'Không tìm thấy sản phẩm'}
        </div>
        <Link to="/products" className="btn btn-primary">Quay lại danh sách sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
          <li className="breadcrumb-item"><Link to="/products">Sản phẩm</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-6">
          <div className="product-detail-image-container">
            {!imageLoaded && (
              <div className="image-placeholder">
                <div className="spinner-border text-secondary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            <img 
              src={imageSrc}
              className={`product-detail-image ${imageLoaded ? 'visible' : 'hidden'}`}
              alt={product.name}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ 
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
        <div className="col-md-6">
          <h1 className="mb-3">{product.name}</h1>
          
          <div className="mb-3">
            <h4 className="text-primary">{product.price.toLocaleString('vi-VN')} VNĐ</h4>
            {product.oldPrice && (
              <del className="text-muted ms-2">{product.oldPrice.toLocaleString('vi-VN')} VNĐ</del>
            )}
          </div>

          <div className="mb-4">
            <p>{product.description}</p>
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-4">
              <h5>Kích thước:</h5>
              <div className="btn-group" role="group">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`btn ${selectedSize === size ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h5>Số lượng:</h5>
            <div className="input-group" style={{ width: '150px' }}>
              <button className="btn btn-outline-secondary" type="button" onClick={decrementQuantity}>-</button>
              <input
                type="number"
                className="form-control text-center"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                max={product.stock}
              />
              <button className="btn btn-outline-secondary" type="button" onClick={incrementQuantity}>+</button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="d-grid gap-2">
            <button className="btn btn-primary" onClick={handleAddToCart}>
              Thêm vào giỏ hàng
            </button>
            <Link to="/cart" className="btn btn-outline-primary">
              Đi đến giỏ hàng
            </Link>
          </div>

          <div className="mt-4">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-truck me-2"></i>
              <span>Miễn phí vận chuyển cho đơn hàng trên 500.000 VNĐ</span>
            </div>
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-arrow-return-left me-2"></i>
              <span>Đổi trả trong vòng 30 ngày</span>
            </div>
            <div className="d-flex align-items-center">
              <i className="bi bi-shield-check me-2"></i>
              <span>Bảo hành 12 tháng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;