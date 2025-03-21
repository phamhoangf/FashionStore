import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatImageUrl } from '../../utils/imageUtils';
import './ProductList.css';

// Dữ liệu mẫu để sử dụng khi API gặp lỗi
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Áo thun nam basic',
    price: 250000,
    discount_price: 199000,
    stock: 50,
    category_id: 1,
    category_name: 'Áo nam',
    image_url: 'https://via.placeholder.com/150',
    featured: true,
    created_at: '2025-03-01T10:30:00'
  },
  {
    id: 2,
    name: 'Quần jean nữ ống rộng',
    price: 450000,
    discount_price: 399000,
    stock: 30,
    category_id: 2,
    category_name: 'Quần nữ',
    image_url: 'https://via.placeholder.com/150',
    featured: true,
    created_at: '2025-03-02T11:20:00'
  },
  {
    id: 3,
    name: 'Áo khoác denim unisex',
    price: 650000,
    discount_price: null,
    stock: 20,
    category_id: 3,
    category_name: 'Áo khoác',
    image_url: 'https://via.placeholder.com/150',
    featured: false,
    created_at: '2025-03-03T09:15:00'
  },
  {
    id: 4,
    name: 'Váy liền thân công sở',
    price: 550000,
    discount_price: 499000,
    stock: 15,
    category_id: 4,
    category_name: 'Váy đầm',
    image_url: 'https://via.placeholder.com/150',
    featured: true,
    created_at: '2025-03-04T14:45:00'
  },
  {
    id: 5,
    name: 'Giày thể thao nam',
    price: 850000,
    discount_price: 799000,
    stock: 25,
    category_id: 5,
    category_name: 'Giày dép',
    image_url: 'https://via.placeholder.com/150',
    featured: false,
    created_at: '2025-03-05T16:30:00'
  }
];

// Danh mục mẫu
const MOCK_CATEGORIES = [
  { id: 1, name: 'Áo nam' },
  { id: 2, name: 'Quần nữ' },
  { id: 3, name: 'Áo khoác' },
  { id: 4, name: 'Váy đầm' },
  { id: 5, name: 'Giày dép' }
];

// Component hiển thị ảnh sản phẩm với xử lý tải ảnh
const ProductImage = React.memo(({ product }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const fallbackImage = 'https://via.placeholder.com/60x60?text=No+Image';

  // Xác định nguồn ảnh khi component được tạo
  useEffect(() => {
    if (!product.image_url || product.image_url.trim() === '') {
      console.log('ProductImage - No image URL, using fallback');
      setImageSrc(fallbackImage);
      setImageLoaded(true);
    } else {
      console.log('ProductImage - Original image URL:', product.image_url);
      const formattedUrl = formatImageUrl(product.image_url, fallbackImage);
      console.log('ProductImage - Formatted image URL:', formattedUrl);
      setImageSrc(formattedUrl);
    }
  }, [product.image_url]);

  // Xử lý sự kiện khi ảnh tải xong
  const handleImageLoad = useCallback(() => {
    console.log('ProductImage - Image loaded successfully:', imageSrc);
    setImageLoaded(true);
  }, [imageSrc]);

  // Xử lý sự kiện khi ảnh lỗi
  const handleImageError = useCallback(() => {
    console.error('ProductImage - Error loading image:', imageSrc);
    setImageError(true);
    setImageSrc(fallbackImage);
    setImageLoaded(true);
  }, [imageSrc]);

  return (
    <div className="product-image-container">
      {!imageLoaded && !imageError && (
        <div className="image-placeholder">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <img
        src={imageSrc}
        className={`product-image ${imageLoaded ? 'visible' : 'hidden'}`}
        alt={product.name}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
});

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [useMockData, setUseMockData] = useState(false);

  // Tải danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Kiểm tra token
        const token = localStorage.getItem('token');
        const adminLoggedIn = localStorage.getItem('adminLoggedIn');
        
        // Nếu không có token nhưng có adminLoggedIn, sử dụng dữ liệu mẫu
        if (!token && adminLoggedIn === 'true') {
          console.log('No token but admin is logged in, using mock categories');
          setCategories(MOCK_CATEGORIES);
          return;
        }
        
        // Gọi API thực tế
        const response = await api.get('/admin/categories');
        if (response && Array.isArray(response)) {
          setCategories(response);
        } else {
          throw new Error('Không nhận được dữ liệu danh mục từ API');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Sử dụng danh mục mẫu khi gặp lỗi
        setCategories(MOCK_CATEGORIES);
      }
    };

    fetchCategories();
  }, []);

  // Tải sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Kiểm tra token
        const token = localStorage.getItem('token');
        const adminLoggedIn = localStorage.getItem('adminLoggedIn');
        
        // Nếu không có token nhưng có adminLoggedIn, sử dụng dữ liệu mẫu
        if (!token && adminLoggedIn === 'true') {
          console.log('No token but admin is logged in, using mock products');
          setUseMockData(true);
          
          // Lọc sản phẩm theo tìm kiếm và danh mục
          let filteredProducts = [...MOCK_PRODUCTS];
          
          if (searchTerm) {
            filteredProducts = filteredProducts.filter(product => 
              product.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          if (selectedCategory) {
            filteredProducts = filteredProducts.filter(product => 
              product.category_id.toString() === selectedCategory
            );
          }
          
          setProducts(filteredProducts);
          setTotalPages(Math.ceil(filteredProducts.length / 10));
          setLoading(false);
          return;
        }
        
        // Gọi API thực tế
        let url = `/admin/products?page=${currentPage}&limit=10`;
        
        if (searchTerm) {
          url += `&search=${searchTerm}`;
        }
        
        if (selectedCategory) {
          url += `&category=${selectedCategory}`;
        }
        
        console.log('Fetching products from API:', url);
        const response = await api.get(url);
        
        if (response) {
          console.log('Products data received:', response);
          setProducts(response.items || []);
          setTotalPages(response.pages || 1);
          setUseMockData(false);
        } else {
          throw new Error('Không nhận được dữ liệu sản phẩm từ API');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        
        // Hiển thị thông báo lỗi
        setError(`Không thể tải danh sách sản phẩm từ API: ${error.error || error.message || 'Lỗi không xác định'}`);
        
        // Sử dụng dữ liệu mẫu khi gặp lỗi
        console.log('Using mock products due to API error');
        setUseMockData(true);
        
        // Lọc sản phẩm theo tìm kiếm và danh mục
        let filteredProducts = [...MOCK_PRODUCTS];
        
        if (searchTerm) {
          filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        if (selectedCategory) {
          filteredProducts = filteredProducts.filter(product => 
            product.category_id.toString() === selectedCategory
          );
        }
        
        setProducts(filteredProducts);
        setTotalPages(Math.ceil(filteredProducts.length / 10));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, searchTerm, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        // Kiểm tra token
        const token = localStorage.getItem('token');
        const adminLoggedIn = localStorage.getItem('adminLoggedIn');
        
        // Nếu không có token nhưng có adminLoggedIn, xử lý xóa với dữ liệu mẫu
        if (!token && adminLoggedIn === 'true') {
          console.log('No token but admin is logged in, simulating product deletion');
          setProducts(products.filter(product => product.id !== id));
          return;
        }
        
        // Gọi API thực tế
        await api.delete(`/admin/products/${id}`);
        // Cập nhật lại danh sách sản phẩm
        setProducts(products.filter(product => product.id !== id));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(`Không thể xóa sản phẩm: ${error.error || error.message || 'Lỗi không xác định'}`);
        
        // Nếu đang sử dụng dữ liệu mẫu, vẫn xóa sản phẩm khỏi state
        if (useMockData) {
          setProducts(products.filter(product => product.id !== id));
        }
      }
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Quản lý sản phẩm</h1>
        <Link to="/admin/products/add" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          Thêm sản phẩm mới
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>Lưu ý:</strong> {error}
          <p className="mb-0 mt-2">Đang hiển thị dữ liệu mẫu.</p>
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}
      
      {useMockData && !error && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <strong>Lưu ý:</strong> Đang hiển thị dữ liệu mẫu do không có kết nối với API.
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" type="submit">
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </form>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={handleReset}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hình ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Giá khuyến mãi</th>
                  <th>Tồn kho</th>
                  <th>Nổi bật</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map(product => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>
                        <ProductImage product={product} />
                      </td>
                      <td>{product.name}</td>
                      <td>{product.category_name}</td>
                      <td>{product.price.toLocaleString('vi-VN')} VNĐ</td>
                      <td>
                        {product.discount_price 
                          ? `${product.discount_price.toLocaleString('vi-VN')} VNĐ` 
                          : '-'}
                      </td>
                      <td>{product.stock}</td>
                      <td>
                        {product.featured 
                          ? <span className="badge bg-success">Có</span> 
                          : <span className="badge bg-secondary">Không</span>}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <Link 
                            to={`/admin/products/edit/${product.id}`} 
                            className="btn btn-sm btn-primary"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            className="btn btn-sm btn-danger" 
                            onClick={() => handleDelete(product.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">Không có sản phẩm nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <nav aria-label="Page navigation">
              <ul className="pagination justify-content-center mt-4">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </button>
                </li>
                
                {[...Array(totalPages)].map((_, index) => (
                  <li 
                    key={index} 
                    className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList; 