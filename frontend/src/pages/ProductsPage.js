import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { getProducts, getCategories } from '../services/productService';
import ProductList from '../components/product/ProductList';
import './ProductsPage.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1
  });
  const [searchInput, setSearchInput] = useState(filters.search);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Theo dõi thay đổi trong URL để cập nhật bộ lọc
  useEffect(() => {
    const newFilters = {
      category: searchParams.get('category') || '',
      search: searchParams.get('search') || '',
      sort: searchParams.get('sort') || 'newest',
      page: parseInt(searchParams.get('page')) || 1
    };
    
    // Cập nhật bộ lọc nếu có thay đổi
    if (
      newFilters.category !== filters.category ||
      newFilters.search !== filters.search ||
      newFilters.sort !== filters.sort ||
      newFilters.page !== filters.page
    ) {
      console.log('URL params changed, updating filters:', newFilters);
      setFilters(newFilters);
      setSearchInput(newFilters.search);
    }
  }, [searchParams, location.search]); // Thêm location.search để bắt cả timestamp

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Loại bỏ timestamp khỏi tham số gửi đến API
      const { timestamp, ...apiParams } = filters;
      
      // Đảm bảo tham số search không bị undefined hoặc null
      const params = {
        ...apiParams,
        search: apiParams.search || '',
        limit: 12
      };
      
      console.log('Fetching products with params:', params);
      const data = await getProducts(params);
      
      if (data && Array.isArray(data.items)) {
        setProducts(data.items);
        setTotal(data.total);
        console.log(`Found ${data.total} products for search: "${params.search}"`);
      } else {
        console.error('Invalid response format:', data);
        setProducts([]);
        setTotal(0);
        setError('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotal(0);
      setError('Đã xảy ra lỗi khi tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    
    // Update URL params
    const newSearchParams = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        newSearchParams[key] = value;
      }
    }
    setSearchParams(newSearchParams);
  }, [filters]);

  const handleFilterChange = (name, value) => {
    console.log(`Changing filter: ${name} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: name === 'page' ? value : 1
    }));
  };

  // Xử lý tìm kiếm với debounce
  const handleSearchInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Clear timeout trước đó nếu có
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Đặt timeout mới để debounce
    const timeout = setTimeout(() => {
      handleFilterChange('search', value);
    }, 500); // Đợi 500ms sau khi người dùng ngừng gõ
    
    setSearchTimeout(timeout);
  }, [searchTimeout]);

  // Xử lý khi submit form tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Search submitted with value:', searchInput);
    handleFilterChange('search', searchInput);
  };

  // Xóa bộ lọc tìm kiếm
  const clearSearch = () => {
    setSearchInput('');
    handleFilterChange('search', '');
  };

  // Xóa tất cả bộ lọc
  const clearAllFilters = () => {
    setSearchInput('');
    setFilters({
      category: '',
      search: '',
      sort: 'newest',
      page: 1
    });
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <Container className="py-5">
      <h1 className="mb-4">Sản phẩm</h1>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}
      
      {/* Hiển thị kết quả tìm kiếm nếu có */}
      {filters.search && (
        <Alert variant="info" className="d-flex justify-content-between align-items-center">
          <div>
            Kết quả tìm kiếm cho: <strong>"{filters.search}"</strong> 
            {total > 0 ? <span className="search-result-count"> ({total} sản phẩm)</span> : ''}
          </div>
          <Button variant="outline-secondary" size="sm" onClick={clearSearch}>
            Xóa tìm kiếm
          </Button>
        </Alert>
      )}
      
      <Row>
        <Col md={3}>
          <Card className="mb-4 shadow-sm filter-card">
            <Card.Body>
              <div className="filter-section">
                <h5 className="filter-section-title">Tìm kiếm</h5>
                <Form onSubmit={handleSearchSubmit}>
                  <Form.Group className="mb-3">
                    <div className="input-group">
                      <Form.Control
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchInput}
                        onChange={handleSearchInputChange}
                      />
                      <Button variant="primary" type="submit">
                        <i className="bi bi-search"></i>
                      </Button>
                    </div>
                  </Form.Group>
                </Form>
              </div>
              
              <div className="filter-divider"></div>
              
              <div className="filter-section">
                <h5 className="filter-section-title">Danh mục</h5>
                <Form.Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="mb-3"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </div>
              
              <div className="filter-divider"></div>
              
              <div className="filter-section">
                <h5 className="filter-section-title">Sắp xếp</h5>
                <Form.Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="mb-3"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="name_asc">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                </Form.Select>
              </div>
              
              {/* Hiển thị các bộ lọc đang áp dụng */}
              {(filters.category || filters.search || filters.sort !== 'newest') && (
                <>
                  <div className="filter-divider"></div>
                  <div className="filter-section">
                    <h5 className="filter-section-title">Bộ lọc đang áp dụng</h5>
                    <div className="d-flex flex-wrap">
                      {filters.category && (
                        <Badge bg="primary" className="filter-badge">
                          Danh mục: {categories.find(c => c.id.toString() === filters.category)?.name || filters.category}
                          <span 
                            className="close-btn"
                            onClick={() => handleFilterChange('category', '')}
                          >
                            &times;
                          </span>
                        </Badge>
                      )}
                      {filters.sort !== 'newest' && (
                        <Badge bg="primary" className="filter-badge">
                          Sắp xếp: {
                            filters.sort === 'price_asc' ? 'Giá tăng dần' :
                            filters.sort === 'price_desc' ? 'Giá giảm dần' :
                            filters.sort === 'name_asc' ? 'Tên A-Z' :
                            filters.sort === 'name_desc' ? 'Tên Z-A' : filters.sort
                          }
                          <span 
                            className="close-btn"
                            onClick={() => handleFilterChange('sort', 'newest')}
                          >
                            &times;
                          </span>
                        </Badge>
                      )}
                    </div>
                    {(filters.category || filters.search || filters.sort !== 'newest') && (
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="mt-2"
                        onClick={clearAllFilters}
                      >
                        Xóa tất cả bộ lọc
                      </Button>
                    )}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={9}>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Đang tải sản phẩm...</p>
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <i className="bi bi-search"></i>
                  </div>
                  <p className="empty-state-text">
                    Không tìm thấy sản phẩm nào phù hợp với tiêu chí tìm kiếm.
                  </p>
                  <Button variant="primary" onClick={clearAllFilters}>
                    Xóa bộ lọc
                  </Button>
                </div>
              ) : (
                <div className="search-result-item">
                  <ProductList products={products} />
                </div>
              )}
              
              {totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handleFilterChange('page', filters.page - 1)}
                      >
                        Trước
                      </button>
                    </li>
                    
                    {[...Array(totalPages).keys()].map(page => (
                      <li
                        key={page + 1}
                        className={`page-item ${filters.page === page + 1 ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handleFilterChange('page', page + 1)}
                        >
                          {page + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${filters.page === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handleFilterChange('page', filters.page + 1)}
                      >
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductsPage;