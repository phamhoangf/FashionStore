import React from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import ProductCard from './ProductCard';

const ProductList = ({ products, loading, error }) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-4" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        Lỗi: {error}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
        <p className="text-muted">Không tìm thấy sản phẩm nào.</p>
      </div>
    );
  }

  return (
    <Row className="g-4 product-grid">
      {products.map((product) => (
        <Col key={product.id} xs={12} sm={6} md={6} lg={4} xl={4}>
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  );
};

export default ProductList;
