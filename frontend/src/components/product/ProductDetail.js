import React from 'react';
import { Link } from 'react-router-dom';

const ProductDetail = ({ product }) => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <h3 className="card-title">{product.name}</h3>
        <div className="mb-3">
          <span className="h4 text-primary">{product.price.toLocaleString('vi-VN')} VNĐ</span>
          {product.oldPrice && (
            <del className="text-muted ms-2">{product.oldPrice.toLocaleString('vi-VN')} VNĐ</del>
          )}
        </div>
        <p className="card-text">{product.description}</p>
        
        <div className="d-flex mb-3">
          <div className="me-3">
            <strong>Thương hiệu:</strong> {product.brand}
          </div>
          <div>
            <strong>Mã sản phẩm:</strong> {product.sku}
          </div>
        </div>
        
        <div className="mb-3">
          <strong>Kích thước có sẵn:</strong>
          <div className="mt-2">
            {product.sizes.map(size => (
              <span key={size} className="badge bg-secondary me-2">{size}</span>
            ))}
          </div>
        </div>
        
        <Link to={`/products/${product.id}`} className="btn btn-primary">
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
};

export default ProductDetail;