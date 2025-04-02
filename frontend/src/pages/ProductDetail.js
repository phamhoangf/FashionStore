import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, getProducts } from '../services/productService';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productData = await getProduct(id);
        setProduct(productData);

        // Fetch products from the same category
        if (productData.category_id) {
          const response = await getProducts({
            category: productData.category_id,
            limit: 20 // Lấy nhiều sản phẩm để random
          });
          
          // Lọc bỏ sản phẩm hiện tại và random 6 sản phẩm
          const otherProducts = response.items.filter(p => p.id !== parseInt(id));
          const randomProducts = otherProducts
            .sort(() => 0.5 - Math.random()) // Shuffle array
            .slice(0, 6); // Lấy 6 sản phẩm đầu tiên
          
          setSimilarProducts(randomProducts);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Không thể tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success('Đã thêm vào giỏ hàng');
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Không tìm thấy sản phẩm</div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Trang chủ</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/products?parentCategory=${product.parent_category_id}&category=${product.parent_category_id}`}>
              {product.parent_category_name}
            </Link>
          </li>
          {product.category_name && (
            <li className="breadcrumb-item">
              <Link to={`/products?parentCategory=${product.parent_category_id}&category=${product.category_id}`}>
                {product.category_name}
              </Link>
            </li>
          )}
          <li className="breadcrumb-item active">{product.name}</li>
        </ol>
      </nav>

      <div className="row">
        {/* Product Image */}
        <div className="col-md-6 mb-4">
          <div className="card border-0">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="card-img-top"
              style={{ objectFit: 'cover', height: '500px' }}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="col-md-6">
          <h1 className="h2 mb-3">{product.name}</h1>
          
          {/* Category */}
          <div className="mb-3">
            <span className="text-muted">Danh mục: </span>
            <Link 
              to={`/products?parentCategory=${product.parent_category_id}&category=${product.category_id}`}
              className="text-decoration-none"
            >
              {product.parent_category_name} / {product.category_name}
            </Link>
          </div>
          
          <p className="h3 text-primary mb-4">{product.price.toLocaleString('vi-VN')} VND</p>
          
          <p className="mb-4">{product.description}</p>

          {/* Quantity Selector */}
          <div className="mb-4">
            <label className="form-label">Số lượng:</label>
            <div className="input-group" style={{ width: '150px' }}>
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={() => handleQuantityChange(-1)}
              >
                -
              </button>
              <input 
                type="text" 
                className="form-control text-center" 
                value={quantity}
                readOnly
              />
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={() => handleQuantityChange(1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button 
            className="btn btn-primary btn-lg mb-4"
            onClick={handleAddToCart}
          >
            Thêm vào giỏ hàng
          </button>

          {/* Product Features */}
          <div className="mt-4">
            <div className="d-flex align-items-center mb-3">
              <i className="bi bi-truck me-2"></i>
              <span>Miễn phí vận chuyển cho đơn hàng trên 500.000 VND</span>
            </div>
            <div className="d-flex align-items-center mb-3">
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

      {/* Similar Products */}
      <section className="mt-5">
        <h2 className="mb-4">Sản phẩm tương tự</h2>
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
          {similarProducts.map(product => (
            <div key={product.id} className="col">
              <div className="card h-100 border-0 shadow-sm">
                <Link to={`/product/${product.id}`}>
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="card-img-top"
                    style={{ height: '280px', objectFit: 'cover' }}
                  />
                </Link>
                <div className="card-body text-center">
                  <h5 className="card-title" style={{ fontSize: '1rem', minHeight: '3rem' }}>
                    <Link to={`/product/${product.id}`} className="text-decoration-none text-dark">
                      {product.name}
                    </Link>
                  </h5>
                  <p className="card-text text-primary fw-bold">
                    {product.price.toLocaleString('vi-VN')} VND
                  </p>
                  <Link 
                    to={`/product/${product.id}`} 
                    className="btn btn-outline-primary"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProductDetail; 