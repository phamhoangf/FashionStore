import React from 'react';
import { Row, Col, Container } from 'react-bootstrap';
import ProductCard from './ProductCard';

const ProductList = ({ products, loading, error }) => {
  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading products...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="alert alert-danger my-4" role="alert">
          Error: {error}
        </div>
      </Container>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Container>
        <div className="text-center py-5">
          <p>No products found.</p>
        </div>
      </Container>
    );
  }

  return (
    <Row className="g-4">
      {products.map((product) => (
        <Col key={product.id} xs={12} sm={6} md={4} lg={3}>
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  );
};

export default ProductList;
