import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, getProducts } from '../services/productService';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { formatImageUrl } from '../utils/imageUtils';
import ProductCard from '../components/product/ProductCard';
import { toast } from 'react-toastify';
import { Container, Row, Col, Spinner, Alert, Modal, Button } from 'react-bootstrap';
import './ProductDetailPage.css';

// Ảnh mặc định khi không có ảnh
const DEFAULT_IMAGE = 'https://via.placeholder.com/600x800?text=No+Image';

// Danh sách sizes mặc định nếu sản phẩm không có sizes
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [error, setError] = useState('');
  const [sizeError, setSizeError] = useState('');
  const { addItem } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [similarProducts, setSimilarProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setImageLoaded(false);
        setImageError(false);
        
        const data = await getProductById(id);
        setProduct(data);
        
        // Xử lý dữ liệu sizes (sử dụng sizes từ API hoặc sizes mặc định)
        const availableSizes = data.sizes && data.sizes.length > 0 
          ? data.sizes 
          : DEFAULT_SIZES;
          
        // Chọn size đầu tiên trong danh sách
        if (availableSizes.length > 0) {
          setSelectedSize(availableSizes[0]);
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

  // Thêm useEffect mới để lấy sản phẩm tương tự
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!product) return;
      
      try {
        // Chỉ lấy sản phẩm cùng danh mục
        const response = await getProducts({
          category: product.category_id,
          limit: 8 // Lấy nhiều hơn để sau khi lọc vẫn còn đủ sản phẩm
        });
        
        console.log('Similar products response:', response);
        
        if (response && response.items) {
          // Lọc ra sản phẩm hiện tại từ danh sách
          const filtered = response.items.filter(item => item.id !== product.id);
          
          // Giới hạn số lượng sản phẩm hiển thị (chọn 4 sản phẩm đầu tiên)
          setSimilarProducts(filtered.slice(0, 8));
        }
      } catch (error) {
        console.error('Error fetching similar products:', error);
      }
    };

    if (product) {
      fetchSimilarProducts();
    }
  }, [product]);

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

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setSizeError(''); // Xóa thông báo lỗi nếu có
  };

  const openAddModal = () => {
    if (!selectedSize && product && product.sizes && product.sizes.length > 0) {
      setSizeError('Vui lòng chọn kích thước trước khi thêm vào giỏ hàng');
      return;
    }
    setSizeError('');
    setShowAddModal(true);
  };
  
  const closeAddModal = () => {
    setShowAddModal(false);
  };
  
  const handleAddToCart = useCallback(() => {
    if (!isAuthenticated) {
      // Chuyển hướng đến trang đăng nhập
      navigate('/login?redirect=/products/' + id);
      return;
    }
    
    if (!selectedSize && product && product.sizes && product.sizes.length > 0) {
      setSizeError('Vui lòng chọn kích thước trước khi thêm vào giỏ hàng');
      return;
    }
    
    if (product) {
      // Close modal first for immediate UI response
      closeAddModal();
      
      // Add item to cart without blocking UI
      addItem(product.id, quantity, selectedSize)
        .then(() => {
          setQuantity(1);
          setError('');
          toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
        })
        .catch(error => {
          // Hiển thị thông báo lỗi nếu có
          toast.error(error.message || 'Không thể thêm sản phẩm vào giỏ hàng');
        });
    }
  }, [addItem, isAuthenticated, product, quantity, selectedSize, id, navigate, closeAddModal]);

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
  
  // Lấy danh sách sizes (từ API hoặc mặc định)
  const availableSizes = product.sizes && product.sizes.length > 0 
    ? product.sizes 
    : DEFAULT_SIZES;

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
            {product.discount_price && (
              <del className="text-muted ms-2">{product.discount_price.toLocaleString('vi-VN')} VNĐ</del>
            )}
          </div>

          <div className="mb-4">
            <p>{product.description}</p>
          </div>

          <div className="mb-4">
            <h5>Kích thước:</h5>
            <div className="size-selector">
              {availableSizes.map(size => (
                <button
                  key={size}
                  type="button"
                  className={`btn size-btn ${selectedSize === size ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleSizeSelect(size)}
                >
                  {size}
                </button>
              ))}
            </div>
            {sizeError && (
              <div className="text-danger mt-2">
                <small>{sizeError}</small>
              </div>
            )}
          </div>

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
            <button className="btn btn-primary" onClick={openAddModal}>
              Thêm vào giỏ hàng
            </button>
            <Link to="/cart" className="btn btn-outline-primary">
              Xem giỏ hàng
            </Link>
          </div>
        </div>
      </div>

      {/* Hiển thị sản phẩm tương tự */}
      {similarProducts.length > 0 && (
        <div className="similar-products mt-5">
          <h3 className="mb-4">Sản phẩm tương tự</h3>
          <div className="row">
            {similarProducts.map(product => (
              <div key={product.id} className="col-md-3 mb-4">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal xác nhận thêm vào giỏ hàng */}
      <Modal show={showAddModal} onHide={closeAddModal}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận thêm vào giỏ hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có muốn thêm sản phẩm "{product?.name}" {selectedSize && `(Size ${selectedSize})`} với số lượng {quantity} vào giỏ hàng không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAddModal}>
            Hủy bỏ
          </Button>
          <Button variant="primary" onClick={handleAddToCart}>
            Thêm vào giỏ hàng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductDetailPage;