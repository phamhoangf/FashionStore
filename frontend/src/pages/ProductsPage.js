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
    parentCategory: searchParams.get('parentCategory') || '',
    subcategory: searchParams.get('subcategory') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1
  });
  const [searchInput, setSearchInput] = useState(filters.search);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Theo dõi thay đổi trong URL để cập nhật bộ lọc
  useEffect(() => {
    // Reset tất cả bộ lọc khi có tham số từ URL mới
    const newFilters = {
      category: searchParams.get('category') || '',
      parentCategory: searchParams.get('parentCategory') || '',
      subcategory: searchParams.get('subcategory') || '',
      search: searchParams.get('search') || '',
      sort: searchParams.get('sort') || 'newest',
      page: parseInt(searchParams.get('page')) || 1
    };
    
    // Debug log - kiểm tra những tham số được truyền qua URL
    console.log('URL Search Params:', Object.fromEntries([...searchParams]));
    console.log('New filters from URL:', newFilters);
    
    // Kiểm tra xem URL có timestamp không (từ click trên header)
    const hasTimestamp = searchParams.get('timestamp');
    
    // So sánh timestamp hiện tại với timestamp trước đó
    const currentTimestamp = hasTimestamp ? parseInt(hasTimestamp) : 0;
    const prevTimestamp = filters.timestamp ? parseInt(filters.timestamp) : 0;
    
    // Nếu URL có timestamp mới hoặc không có timestamp trước đó
    if (currentTimestamp > prevTimestamp) {
      // Reset toàn bộ bộ lọc và chỉ áp dụng các bộ lọc từ URL mới
      console.log('New navigation detected, resetting all filters');
      
      // Cập nhật timestamp vào state filters để theo dõi
      setFilters({
        ...newFilters,
        timestamp: hasTimestamp
      });
      
      setSearchInput(newFilters.search);
      return;
    }
    
    // Cập nhật bộ lọc nếu có thay đổi
    if (
      newFilters.category !== filters.category ||
      newFilters.parentCategory !== filters.parentCategory ||
      newFilters.subcategory !== filters.subcategory ||
      newFilters.search !== filters.search ||
      newFilters.sort !== filters.sort ||
      newFilters.page !== filters.page
    ) {
      console.log('URL params changed, updating filters:', newFilters);
      
      // Giữ lại timestamp cũ
      setFilters(prev => ({
        ...newFilters,
        timestamp: prev.timestamp
      }));
      
      setSearchInput(newFilters.search);
    }
  }, [searchParams, location.search]); // Thêm location.search để bắt cả timestamp

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Loại bỏ timestamp và các tham số không cần thiết khỏi tham số gửi đến API
      const { timestamp, parentCategory, subcategory, ...apiParams } = filters;
      
      // Đảm bảo tham số search không bị undefined hoặc null
      const params = {
        ...apiParams,
        search: apiParams.search || '',
        limit: 12
      };
      
      // Luôn sử dụng category ID để filter (có thể là parent hoặc subcategory)
      // category sẽ luôn có giá trị hợp lệ từ việc thay đổi bộ lọc
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
        console.log('Categories data from API:', data);
        
        // Tạo danh sách đầy đủ các danh mục
        const allCategories = data;
        
        // Lọc danh mục gốc (không có parent_id)
        const rootCategories = data.filter(cat => !cat.parent_id);
        
        // Gán subcategories cho mỗi danh mục gốc
        rootCategories.forEach(rootCat => {
          rootCat.subcategories = data.filter(cat => cat.parent_id === rootCat.id);
        });
        
        console.log('Organized categories with subcategories:', rootCategories);
        
        // Lưu cả danh sách đầy đủ và danh sách phân cấp
        setCategories(rootCategories);
        
        // Tìm parent category nếu đang chọn subcategory
        if (filters.category && !filters.parentCategory) {
          // Kiểm tra xem category hiện tại có phải là subcategory không
          const selectedCategory = allCategories.find(cat => cat.id.toString() === filters.category.toString());
          if (selectedCategory && selectedCategory.parent_id) {
            // Nếu là subcategory, cập nhật cả parent category và subcategory
            setFilters(prev => ({
              ...prev,
              parentCategory: selectedCategory.parent_id.toString(),
              subcategory: selectedCategory.id.toString()
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [filters.category, filters.parentCategory]);

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
      parentCategory: '',
      subcategory: '',
      search: '',
      sort: 'newest',
      page: 1,
      timestamp: Date.now() // Tạo timestamp mới để đánh dấu việc reset
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
      
      {/* Hiển thị filter theo category hoặc subcategory */}
      {(filters.parentCategory || filters.subcategory) && (
        <Alert variant="info" className="d-flex justify-content-between align-items-center">
          <div>
            {filters.parentCategory && (
              <span>
                Danh mục: <strong>
                  {categories.find(c => c.id.toString() === filters.parentCategory)?.name || 'Danh mục đã chọn'}
                </strong>
              </span>
            )}
            {filters.subcategory && (
              <span className="ms-2">
                | Danh mục con: <strong>
                  {(() => {
                    // Tìm parent category
                    const parentCat = categories.find(c => c.id.toString() === filters.parentCategory);
                    if (!parentCat) return filters.subcategory;
                    
                    // Tìm subcategory trong parent category
                    const subCat = parentCat.subcategories.find(
                      sc => sc.id.toString() === filters.subcategory
                    );
                    
                    return subCat ? subCat.name : filters.subcategory;
                  })()}
                </strong>
              </span>
            )}
            {total > 0 ? <span className="search-result-count ms-2">({total} sản phẩm)</span> : ''}
          </div>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                category: '',
                parentCategory: '',
                subcategory: '',
                page: 1
              }));
            }}
          >
            Xóa bộ lọc danh mục
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
                <h5 className="filter-section-title">Danh mục chính</h5>
                <Form.Select
                  value={filters.parentCategory || ''}
                  onChange={(e) => {
                    const parentCatId = e.target.value;
                    handleFilterChange('parentCategory', parentCatId);
                    // Reset subcategory khi thay đổi parent category
                    handleFilterChange('subcategory', '');
                    // Nếu chọn danh mục chính, category sẽ là parent category
                    handleFilterChange('category', parentCatId);
                  }}
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
              
              {/* Hiển thị danh mục con nếu đã chọn danh mục chính */}
              {filters.parentCategory && (
                <div className="filter-section mt-3">
                  <h5 className="filter-section-title">Danh mục con</h5>
                  <Form.Select
                    value={filters.subcategory || ''}
                    onChange={(e) => {
                      const subCatId = e.target.value;
                      handleFilterChange('subcategory', subCatId);
                      // Nếu chọn subcategory, category sẽ là subcategory để filter
                      handleFilterChange('category', subCatId || filters.parentCategory);
                    }}
                    className="mb-3"
                  >
                    <option value="">Tất cả {categories.find(c => c.id.toString() === filters.parentCategory)?.name || ''}</option>
                    {categories
                      .find(cat => cat.id.toString() === filters.parentCategory)
                      ?.subcategories.map(subcat => (
                        <option key={subcat.id} value={subcat.id}>
                          {subcat.name}
                        </option>
                      ))}
                  </Form.Select>
                </div>
              )}
              
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
              {(filters.category || filters.subcategory || filters.search || filters.sort !== 'newest') && (
                <>
                  <div className="filter-divider"></div>
                  <div className="filter-section">
                    <h5 className="filter-section-title">Bộ lọc đang áp dụng</h5>
                    <div className="applied-filters">
                      {filters.parentCategory && (
                        <Badge 
                          bg="primary" 
                          className="filter-badge"
                          onClick={() => {
                            handleFilterChange('parentCategory', '');
                            handleFilterChange('subcategory', '');
                            handleFilterChange('category', '');
                          }}
                        >
                          Danh mục: {categories.find(c => c.id.toString() === filters.parentCategory)?.name || 'Đã chọn'}
                          <i className="bi bi-x-circle-fill ms-1"></i>
                        </Badge>
                      )}
                      
                      {filters.subcategory && (
                        <Badge 
                          bg="info" 
                          className="filter-badge"
                          onClick={() => {
                            handleFilterChange('subcategory', '');
                            // Đặt category về parent category khi xóa subcategory
                            handleFilterChange('category', filters.parentCategory);
                          }}
                        >
                          Danh mục con: {(() => {
                            // Tìm parent category
                            const parentCat = categories.find(c => c.id.toString() === filters.parentCategory);
                            if (!parentCat) return filters.subcategory;
                            
                            // Tìm subcategory trong parent category
                            const subCat = parentCat.subcategories.find(
                              sc => sc.id.toString() === filters.subcategory
                            );
                            
                            return subCat ? subCat.name : filters.subcategory;
                          })()}
                          <i className="bi bi-x-circle-fill ms-1"></i>
                        </Badge>
                      )}
                      
                      {filters.search && (
                        <Badge 
                          bg="success" 
                          className="filter-badge"
                          onClick={() => clearSearch()}
                        >
                          Tìm kiếm: {filters.search}
                          <i className="bi bi-x-circle-fill ms-1"></i>
                        </Badge>
                      )}
                      
                      {filters.sort !== 'newest' && (
                        <Badge 
                          bg="secondary" 
                          className="filter-badge"
                          onClick={() => handleFilterChange('sort', 'newest')}
                        >
                          Sắp xếp: {
                            filters.sort === 'price_asc' ? 'Giá tăng dần' :
                            filters.sort === 'price_desc' ? 'Giá giảm dần' :
                            filters.sort === 'name_asc' ? 'Tên A-Z' :
                            filters.sort === 'name_desc' ? 'Tên Z-A' : ''
                          }
                          <i className="bi bi-x-circle-fill ms-1"></i>
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={clearAllFilters}
                        className="w-100"
                      >
                        <i className="bi bi-trash me-1"></i>
                        Xóa tất cả bộ lọc
                      </Button>
                    </div>
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