import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';

const Header = () => {
  const { user, isAuthenticated, logout, isAdmin } = useContext(AuthContext);
  const { itemCount } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm.trim());
      
      // Kiểm tra xem đã ở trang sản phẩm chưa
      const isProductsPage = location.pathname === '/products';
      
      // Nếu đã ở trang sản phẩm, cập nhật URL với tham số tìm kiếm mới
      // và thêm timestamp để đảm bảo React Router nhận biết sự thay đổi
      if (isProductsPage) {
        navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}&timestamp=${Date.now()}`);
      } else {
        // Nếu chưa ở trang sản phẩm, chuyển hướng đến trang sản phẩm với tham số tìm kiếm
        navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      }
      
      // Xóa trường tìm kiếm sau khi đã tìm
      setSearchTerm('');
    }
  };

  return (
    <header className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">Fashion Store</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Trang chủ</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/products">Sản phẩm</Link>
            </li>
          </ul>
          
          <form className="d-flex mx-auto" onSubmit={handleSearch}>
            <div className="input-group">
              <input 
                type="search" 
                className="form-control" 
                placeholder="Tìm kiếm sản phẩm..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search"
              />
              <button className="btn btn-outline-primary" type="submit">
                <i className="bi bi-search"></i>
              </button>
            </div>
          </form>
          
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link position-relative" to="/cart">
                Giỏ hàng
                {itemCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {itemCount}
                  </span>
                )}
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    {user?.name || 'Tài khoản'}
                  </a>
                  <ul className="dropdown-menu">
                    <li><Link className="dropdown-item" to="/profile">Hồ sơ</Link></li>
                    <li><Link className="dropdown-item" to="/orders">Đơn hàng</Link></li>
                    {isAdmin() && (
                      <li><Link className="dropdown-item" to="/admin">Quản trị</Link></li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item" onClick={handleLogout}>Đăng xuất</button></li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Đăng nhập</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Đăng ký</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;