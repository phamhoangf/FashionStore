import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

const AdminLayout = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Use useCallback to memoize the checkAdminStatus function
  const checkAdminStatus = useCallback(async () => {
    try {
      // Kiểm tra token
      const token = localStorage.getItem('token');
      const adminLoggedIn = localStorage.getItem('adminLoggedIn');
      
      // Nếu có token, thử gọi API kiểm tra admin
      if (token) {
        try {
          const response = await api.get('/admin/check');
          
          if (response && response.is_admin) {
            setIsLoggedIn(true);
            setUser(response.user || { name: 'Admin', is_admin: true });
            
            // Cập nhật thông tin admin trong localStorage
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUser', JSON.stringify(response.user || { name: 'Admin', is_admin: true }));
          } else {
            throw new Error('Không có quyền admin');
          }
        } catch (error) {
          // Nếu có lỗi với token, xóa token
          if (error.error === 'Invalid token' || error.error === 'Token has expired') {
            localStorage.removeItem('token');
          }
          
          // Kiểm tra xem có adminLoggedIn không
          if (adminLoggedIn === 'true') {
            const adminUser = localStorage.getItem('adminUser');
            if (adminUser) {
              try {
                const userData = JSON.parse(adminUser);
                setIsLoggedIn(true);
                setUser(userData);
              } catch (e) {
                redirectToLogin();
              }
            } else {
              redirectToLogin();
            }
          } else {
            redirectToLogin();
          }
        }
      } else if (adminLoggedIn === 'true') {
        // Nếu không có token nhưng có adminLoggedIn, sử dụng thông tin từ localStorage
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
          try {
            const userData = JSON.parse(adminUser);
            setIsLoggedIn(true);
            setUser(userData);
          } catch (e) {
            redirectToLogin();
          }
        } else {
          redirectToLogin();
        }
      } else {
        redirectToLogin();
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Memoize the redirectToLogin function
  const redirectToLogin = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUser');
    
    // Chỉ chuyển hướng nếu không phải đang ở trang đăng nhập
    if (!location.pathname.includes('/admin/login')) {
      navigate('/admin/login');
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminUser');
      navigate('/admin/login');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  if (!isLoggedIn) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <div className="alert alert-danger" role="alert">
          Bạn cần đăng nhập để truy cập trang quản trị
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/admin/login')}
        >
          Đăng nhập
        </button>
      </div>
    </div>;
  }

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className={`bg-dark text-white ${sidebarOpen ? 'col-md-2' : 'col-md-1'} min-vh-100 d-flex flex-column`} style={{ transition: 'all 0.3s' }}>
        <div className="p-3 d-flex justify-content-between align-items-center">
          {sidebarOpen && <h5 className="m-0">Admin Panel</h5>}
          <button 
            className="btn btn-sm btn-outline-light" 
            onClick={toggleSidebar}
          >
            <i className={`bi bi-chevron-${sidebarOpen ? 'left' : 'right'}`}></i>
          </button>
        </div>
        <hr className="my-0" />
        <ul className="nav flex-column p-2">
          <li className="nav-item">
            <Link 
              to="/admin" 
              className={`nav-link text-white ${location.pathname === '/admin' ? 'active bg-primary rounded' : ''}`}
            >
              <i className="bi bi-speedometer2 me-2"></i>
              {sidebarOpen && 'Dashboard'}
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/admin/products" 
              className={`nav-link text-white ${location.pathname.includes('/admin/products') ? 'active bg-primary rounded' : ''}`}
            >
              <i className="bi bi-box me-2"></i>
              {sidebarOpen && 'Sản phẩm'}
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/admin/categories" 
              className={`nav-link text-white ${location.pathname.includes('/admin/categories') ? 'active bg-primary rounded' : ''}`}
            >
              <i className="bi bi-tags me-2"></i>
              {sidebarOpen && 'Danh mục'}
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/admin/orders" 
              className={`nav-link text-white ${location.pathname.includes('/admin/orders') ? 'active bg-primary rounded' : ''}`}
            >
              <i className="bi bi-cart me-2"></i>
              {sidebarOpen && 'Đơn hàng'}
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/admin/users" 
              className={`nav-link text-white ${location.pathname.includes('/admin/users') ? 'active bg-primary rounded' : ''}`}
            >
              <i className="bi bi-people me-2"></i>
              {sidebarOpen && 'Người dùng'}
            </Link>
          </li>
        </ul>
        <div className="mt-auto p-3">
          <button 
            className="btn btn-sm btn-outline-danger w-100" 
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            {sidebarOpen && 'Đăng xuất'}
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className={`${sidebarOpen ? 'col-md-10' : 'col-md-11'}`} style={{ transition: 'all 0.3s' }}>
        {/* Header */}
        <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
          <div className="container-fluid">
            <span className="navbar-brand">
              {location.pathname === '/admin' && 'Dashboard'}
              {location.pathname.includes('/admin/products') && 'Quản lý sản phẩm'}
              {location.pathname.includes('/admin/categories') && 'Quản lý danh mục'}
              {location.pathname.includes('/admin/orders') && 'Quản lý đơn hàng'}
              {location.pathname.includes('/admin/users') && 'Quản lý người dùng'}
            </span>
            <div className="d-flex align-items-center">
              <div className="dropdown">
                <button className="btn btn-outline-secondary dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.name || 'Admin'}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  <li><Link className="dropdown-item" to="/">Về trang chủ</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={handleLogout}>Đăng xuất</button></li>
                </ul>
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="p-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 