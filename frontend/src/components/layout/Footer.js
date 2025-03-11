import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-light py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4 mb-md-0">
            <h5>Fashion Store</h5>
            <p className="text-muted">Thời trang cho mọi người với nhiều mẫu mã đa dạng và phong cách.</p>
          </div>
          <div className="col-md-2 mb-4 mb-md-0">
            <h5>Danh mục</h5>
            <ul className="list-unstyled">
              <li><a href="/products?category=men" className="text-decoration-none text-muted">Nam</a></li>
              <li><a href="/products?category=women" className="text-decoration-none text-muted">Nữ</a></li>
              <li><a href="/products?category=kids" className="text-decoration-none text-muted">Trẻ em</a></li>
              <li><a href="/products?category=accessories" className="text-decoration-none text-muted">Phụ kiện</a></li>
            </ul>
          </div>
          <div className="col-md-2 mb-4 mb-md-0">
            <h5>Hỗ trợ</h5>
            <ul className="list-unstyled">
              <li><a href="/contact" className="text-decoration-none text-muted">Liên hệ</a></li>
              <li><a href="/faq" className="text-decoration-none text-muted">FAQ</a></li>
              <li><a href="/shipping" className="text-decoration-none text-muted">Vận chuyển</a></li>
              <li><a href="/returns" className="text-decoration-none text-muted">Đổi trả</a></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>Đăng ký nhận tin</h5>
            <p className="text-muted">Nhận thông tin về sản phẩm mới và khuyến mãi</p>
            <div className="input-group">
              <input type="email" className="form-control" placeholder="Email của bạn" />
              <button className="btn btn-primary" type="button">Đăng ký</button>
            </div>
          </div>
        </div>
        <div className="border-top pt-3 mt-3 text-center text-muted">
          <small>&copy; {new Date().getFullYear()} Fashion Store. Tất cả quyền được bảo lưu.</small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;