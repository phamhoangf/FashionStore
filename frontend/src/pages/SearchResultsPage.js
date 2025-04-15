import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { getProducts } from '../services/productService';
import ProductList from '../components/product/ProductList';
import './ProductsPage.css'; // Using the same styles

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  
  // Get search query from URL
  const query = searchParams.get('q') || '';
  
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setProducts([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const params = {
          search: query,
          limit: 12
        };
        
        console.log('Searching for products with query:', query);
        const data = await getProducts(params);
        
        if (data && Array.isArray(data.items)) {
          setProducts(data.items);
          setTotal(data.total);
          console.log(`Found ${data.total} products for search query: "${query}"`);
        } else {
          console.error('Invalid response format:', data);
          setProducts([]);
          setTotal(0);
          setError('Không thể tải dữ liệu kết quả tìm kiếm. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Error searching products:', error);
        setProducts([]);
        setTotal(0);
        setError('Đã xảy ra lỗi khi tìm kiếm sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSearchResults();
  }, [query]);
  
  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1>Kết quả tìm kiếm</h1>
        {query && <p className="text-muted">Tìm thấy {total} sản phẩm cho từ khóa: "{query}"</p>}
        <Button 
          variant="outline-secondary" 
          className="mt-2"
          onClick={() => navigate('/products')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Quay lại trang sản phẩm
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}
      
      <Row>
        <Col>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Đang tìm kiếm...</span>
              </Spinner>
            </div>
          ) : (
            <>
              {products.length > 0 ? (
                <ProductList products={products} />
              ) : (
                <Card className="text-center p-5 shadow-sm">
                  <div className="mb-4">
                    <i className="bi bi-search" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                  </div>
                  <h3 className="mb-3">Không tìm thấy sản phẩm</h3>
                  <p className="mb-4">
                    {query 
                      ? `Không tìm thấy sản phẩm phù hợp với từ khóa "${query}"`
                      : 'Vui lòng nhập từ khóa để tìm kiếm sản phẩm'}
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/products')}
                  >
                    Xem tất cả sản phẩm
                  </Button>
                </Card>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SearchResultsPage; 