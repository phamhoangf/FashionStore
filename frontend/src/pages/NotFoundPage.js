import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';

const NotFoundPage = () => {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="not-found-container">
            <h1 className="display-1 fw-bold text-danger">404</h1>
            <h2 className="mb-4">Trang không tồn tại</h2>
            <p className="mb-4 text-muted">
              Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Button 
                as={Link} 
                to="/" 
                variant="primary"
              >
                Trở về trang chủ
              </Button>
              <Button 
                as={Link} 
                to="/products" 
                variant="outline-secondary"
              >
                Xem sản phẩm
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage; 