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

  // Thêm state mới cho pageTitle
  const [pageTitle, setPageTitle] = useState('Tất cả sản phẩm');

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
        
        // Tìm danh mục Quần và Áo
        const mainCategories = data.filter(cat => cat.name === 'Quần' || cat.name === 'Áo');
        
        // Nếu có kết quả, thêm subcategories
        if (mainCategories.length > 0) {
          mainCategories.forEach(mainCat => {
            // Thêm "nam" vào tên danh mục
            mainCat.name = `${mainCat.name} nam`;
            
            // Tìm các danh mục con
            mainCat.subcategories = data.filter(cat => cat.parent_id === mainCat.id);
          });
          
          console.log('Main categories (Quần nam, Áo nam):', mainCategories);
          setCategories(mainCategories);
          
          // Xử lý subcategory trong trường hợp đã có category filter
          if (filters.category && !filters.parentCategory) {
            // Tìm xem category đã chọn có phải là subcategory không
            let parentFound = false;
            
            // Tìm qua tất cả danh mục chính
            for (const mainCat of mainCategories) {
              // Tìm qua các danh mục con
              const subcat = mainCat.subcategories.find(
                sub => sub.id.toString() === filters.category.toString()
              );
              
              if (subcat) {
                console.log(`Found that category ${filters.category} is a subcategory of ${mainCat.id}`);
                // Cập nhật cả parentCategory và subcategory
                setFilters(prev => ({
                  ...prev,
                  parentCategory: mainCat.id.toString(),
                  subcategory: subcat.id.toString()
                }));
                parentFound = true;
                break;
              }
            }
            
            // Nếu không tìm thấy trong subcategory, kiểm tra xem có phải là mainCategory không
            if (!parentFound) {
              const mainCat = mainCategories.find(cat => cat.id.toString() === filters.category.toString());
              if (mainCat) {
                console.log(`Found that category ${filters.category} is a main category`);
                setFilters(prev => ({
                  ...prev,
                  parentCategory: mainCat.id.toString(),
                  subcategory: ''
                }));
              }
            }
          }
        } else {
          console.log('Main categories not found, using fallback');
          // Fallback nếu không tìm thấy danh mục chính
          const fallbackCategories = [
            { 
              id: 2, 
              name: 'Quần nam', 
              description: 'Quần nam các loại',
              subcategories: [
                { id: 5, name: 'Quần short', description: 'Quần short nam' },
                { id: 6, name: 'Quần jeans', description: 'Quần jeans nam' },
                { id: 7, name: 'Quần âu', description: 'Quần âu nam' },
                { id: 8, name: 'Quần kaki', description: 'Quần kaki nam dài' }
              ]
            },
            { 
              id: 3, 
              name: 'Áo nam', 
              description: 'Áo nam các loại',
              subcategories: [
                { id: 9, name: 'Áo thun', description: 'Áo thun nam' },
                { id: 10, name: 'Áo polo', description: 'Áo polo nam' },
                { id: 11, name: 'Áo sơ mi', description: 'Áo sơ mi nam' },
                { id: 12, name: 'Áo khoác', description: 'Áo khoác nam' },
                { id: 13, name: 'Áo len', description: 'Áo len nam' }
              ]
            }
          ];
          setCategories(fallbackCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback khi có lỗi
        const fallbackCategories = [
          { 
            id: 2, 
            name: 'Quần nam', 
            description: 'Quần nam các loại',
            subcategories: [
              { id: 5, name: 'Quần short', description: 'Quần short nam' },
              { id: 6, name: 'Quần jeans', description: 'Quần jeans nam' },
              { id: 7, name: 'Quần âu', description: 'Quần âu nam' },
              { id: 8, name: 'Quần kaki', description: 'Quần kaki nam dài' }
            ]
          },
          { 
            id: 3, 
            name: 'Áo nam', 
            description: 'Áo nam các loại',
            subcategories: [
              { id: 9, name: 'Áo thun', description: 'Áo thun nam' },
              { id: 10, name: 'Áo polo', description: 'Áo polo nam' },
              { id: 11, name: 'Áo sơ mi', description: 'Áo sơ mi nam' },
              { id: 12, name: 'Áo khoác', description: 'Áo khoác nam' },
              { id: 13, name: 'Áo len', description: 'Áo len nam' }
            ]
          }
        ];
        setCategories(fallbackCategories);
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

  // Cập nhật phần hiển thị thông tin lọc trên đầu trang
  const renderFilterInfo = () => {
    const selectedParentCategory = filters.parentCategory ? 
      categories.find(c => c.id.toString() === filters.parentCategory) : null;
    
    let selectedSubcategory = null;
    if (filters.subcategory && selectedParentCategory) {
      selectedSubcategory = selectedParentCategory.subcategories.find(
        sc => sc.id.toString() === filters.subcategory
      );
    }
    
    if (selectedParentCategory || filters.search) {
      return (
        <Alert variant="info" className="d-flex justify-content-between align-items-center">
          <div>
            {selectedParentCategory && (
              <span>
                <strong>Danh mục:</strong> {selectedParentCategory.name}
                {selectedSubcategory && ` > ${selectedSubcategory.name}`}
              </span>
            )}
            {filters.search && (
              <span>
                {selectedParentCategory && ' | '}
                <strong>Tìm kiếm:</strong> {filters.search}
              </span>
            )}
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                search: '',
                category: '',
                parentCategory: '',
                subcategory: '',
                page: 1,
                timestamp: Date.now().toString()
              }));
            }}
          >
            Xóa bộ lọc
          </Button>
        </Alert>
      );
    }
    return null;
  }

  // Thêm hàm handleSortChange
  const handleSortChange = (sortValue) => {
    handleFilterChange('sort', sortValue);
  };

  // Cập nhật page title dựa trên bộ lọc hiện tại
  useEffect(() => {
    let title = 'Tất cả sản phẩm';
    
    if (filters.parentCategory) {
      const parentCategory = categories.find(c => c.id.toString() === filters.parentCategory);
      if (parentCategory) {
        title = parentCategory.name;
        
        if (filters.subcategory) {
          const subcategory = parentCategory.subcategories.find(
            sc => sc.id.toString() === filters.subcategory
          );
          if (subcategory) {
            title = subcategory.name;
          }
        }
      }
    }
    
    if (filters.search) {
      title = `Kết quả tìm kiếm: "${filters.search}"`;
    }
    
    setPageTitle(title);
  }, [filters.parentCategory, filters.subcategory, filters.search, categories]);

  return (
    <Container className="py-4">
      <h1 className="mb-4 shop-title">
        <i className="bi bi-shop me-2"></i> 
        MenStyle - Thời trang nam
      </h1>
      
      {renderFilterInfo()}
      
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
        
        <Col md={9} className="products-container">
          {/* Hiển thị tiêu đề trang */}
          <div className="products-header d-flex justify-content-between align-items-center mb-4">
            <h2>{pageTitle}</h2>
            <div>
              <Form.Select
                value={filters.sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="form-select-sm"
                style={{ width: 'auto' }}
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
                <option value="name_asc">Tên A-Z</option>
                <option value="name_desc">Tên Z-A</option>
              </Form.Select>
            </div>
          </div>
          
          {/* Hiển thị active filters */}
          {(filters.parentCategory || filters.subcategory) && (
            <div className="active-filters mb-3">
              <p className="mb-2">Bộ lọc đang áp dụng:</p>
              <div className="d-flex flex-wrap gap-2">
                {/* ... existing code ... */}
              </div>
            </div>
          )}
          
          {/* Hiển thị thông báo lỗi nếu có */}
          {error && (
            <Alert variant="danger" className="my-3">
              <Alert.Heading>Không thể tải danh sách sản phẩm</Alert.Heading>
              <p>Đã xảy ra lỗi khi tải danh sách sản phẩm. Vui lòng thử lại sau.</p>
              <div className="d-flex justify-content-end">
                <Button 
                  variant="outline-danger" 
                  onClick={() => {
                    setError(null);
                    fetchProducts();
                  }}
                >
                  Thử lại
                </Button>
              </div>
            </Alert>
          )}
          
          {/* Hiển thị danh sách sản phẩm */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </Spinner>
            </div>
          ) : (
            <>
              {products.length > 0 ? (
                <ProductList products={products} />
              ) : (
                <p className="text-center py-5">Không tìm thấy sản phẩm phù hợp với bộ lọc của bạn.</p>
              )}
            </>
          )}
          
          {/* Phân trang */}
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
        </Col>
      </Row>
    </Container>
  );
};

export default ProductsPage;