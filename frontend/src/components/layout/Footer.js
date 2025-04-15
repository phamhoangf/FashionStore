import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4">
      <div className="container">
        <div className="row">
          {/* Thông tin hỗ trợ */}
          <div className="col-md-3 mb-4">
            <h5 className="mb-3">Hỗ trợ khách hàng</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/contact" className="text-light text-decoration-none">
                  <i className="bi bi-envelope me-2"></i>Liên hệ
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/faq" className="text-light text-decoration-none">
                  <i className="bi bi-question-circle me-2"></i>FAQ
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/shipping" className="text-light text-decoration-none">
                  <i className="bi bi-truck me-2"></i>Chính sách vận chuyển
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/returns" className="text-light text-decoration-none">
                  <i className="bi bi-arrow-return-left me-2"></i>Chính sách đổi trả
                </Link>
              </li>
            </ul>
          </div>

          {/* Về chúng tôi */}
          <div className="col-md-3 mb-4">
            <h5 className="mb-3">Về Shopu</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/about" className="text-light text-decoration-none">
                  <i className="bi bi-building me-2"></i>Giới thiệu
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/privacy" className="text-light text-decoration-none">
                  <i className="bi bi-shield-check me-2"></i>Chính sách bảo mật
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/terms" className="text-light text-decoration-none">
                  <i className="bi bi-file-text me-2"></i>Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>

          {/* Thông tin liên hệ */}
          <div className="col-md-3 mb-4">
            <h5 className="mb-3">Thông tin liên hệ</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <i className="bi bi-geo-alt me-2"></i>
                123 Nguyễn Văn Linh, Quận 7, TP.HCM
              </li>
              <li className="mb-2">
                <i className="bi bi-telephone me-2"></i>
                1900 xxxx
              </li>
              <li className="mb-2">
                <i className="bi bi-envelope me-2"></i>
                support@shopu.com
              </li>
            </ul>
          </div>

          {/* Kết nối với chúng tôi */}
          <div className="col-md-3 mb-4">
            <h5 className="mb-3">Kết nối với chúng tôi</h5>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-light me-3">
                <i className="bi bi-facebook fs-4"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-light me-3">
                <i className="bi bi-instagram fs-4"></i>
              </a>
            </div>
            
          </div>
        </div>

        <hr className="border-light" />

        {/* Copyright */}
        <div className="text-center">
          <p className="mb-0">© 2025 Shopu. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;