import React, { useState, useEffect, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { checkAdminStatus, logout } from '../../services/authService';
import { AuthContext } from '../../context/AuthContext';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Kiểm tra xem đã có thông tin user từ context chưa
        if (isAuthenticated && user && user.is_admin) {
          console.log('User is already authenticated as admin in context');
          setAdminUser(user);
          setAdminVerified(true);
          setLoading(false);
          return;
        }
        
        // Nếu không có user hoặc user không phải admin, kiểm tra qua API
        console.log('Verifying admin status...');
        const adminData = await checkAdminStatus();
        console.log('Admin verification successful:', adminData);
        setAdminUser(adminData);
        setAdminVerified(true);
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        
        // Xử lý lỗi cụ thể
        let errorMessage = 'Bạn không có quyền truy cập trang quản trị';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        }
        
        setError(errorMessage);
        setLoading(false);
        
        // Chỉ chuyển hướng nếu lỗi liên quan đến quyền truy cập
        if (errorMessage.includes('không có quyền') || 
            errorMessage.includes('cần đăng nhập') ||
            errorMessage.includes('không hợp lệ')) {
          // Chuyển hướng về trang đăng nhập sau 2 giây
          setTimeout(() => {
            navigate('/login?redirect=/admin');
          }, 2000);
        }
      }
    };

    verifyAdmin();
  }, [navigate, user, isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/login');
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span>Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Lỗi truy cập!</h4>
            <p>{error}</p>
          </div>
          <p>Đang chuyển hướng đến trang đăng nhập...</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/login?redirect=/admin')}
          >
            Đến trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // Nếu chưa xác thực admin thành công, hiển thị thông báo
  if (!adminVerified) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="alert alert-warning" role="alert">
            <h4 className="alert-heading">Đang xác thực quyền admin...</h4>
            <p>Vui lòng đợi trong giây lát.</p>
          </div>
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    );
  }

  // Sử dụng thông tin người dùng từ adminUser hoặc user từ context
  const currentUser = adminUser || user;

  return (
    <div className="d-flex vh-100">
      {/* Sidebar */}
      <div className={`bg-dark text-white ${sidebarCollapsed ? 'collapsed' : ''}`} style={{ 
        width: sidebarCollapsed ? '80px' : '250px',
        transition: 'width 0.3s ease',
        overflow: 'hidden'
      }}>
        <div className="d-flex flex-column h-100">
          <div className="p-3 border-bottom border-secondary">
            <div className="d-flex align-items-center justify-content-between">
              {!sidebarCollapsed && <h5 className="mb-0">Admin Panel</h5>}
              <button 
                className="btn btn-sm btn-outline-light" 
                onClick={toggleSidebar}
              >
                <i className={`bi bi-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
              </button>
            </div>
          </div>
          
          <div className="p-3 border-bottom border-secondary">
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-primary d-flex justify-content-center align-items-center me-2" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-person-fill text-white"></i>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <div className="fw-bold">{currentUser?.name || 'Admin'}</div>
                  <small className="text-muted">{currentUser?.email || 'admin@example.com'}</small>
                </div>
              )}
            </div>
          </div>
          
          <nav className="py-3">
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link 
                  to="/admin" 
                  className={`nav-link text-white ${location.pathname === '/admin' ? 'active bg-primary' : ''}`}
                >
                  <i className="bi bi-speedometer2 me-2"></i>
                  {!sidebarCollapsed && 'Dashboard'}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/admin/products" 
                  className={`nav-link text-white ${location.pathname.includes('/admin/products') ? 'active bg-primary' : ''}`}
                >
                  <i className="bi bi-box-seam me-2"></i>
                  {!sidebarCollapsed && 'Sản phẩm'}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/admin/categories" 
                  className={`nav-link text-white ${location.pathname.includes('/admin/categories') ? 'active bg-primary' : ''}`}
                >
                  <i className="bi bi-list-nested me-2"></i>
                  {!sidebarCollapsed && 'Danh mục'}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/admin/orders" 
                  className={`nav-link text-white ${location.pathname.includes('/admin/orders') ? 'active bg-primary' : ''}`}
                >
                  <i className="bi bi-cart-check me-2"></i>
                  {!sidebarCollapsed && 'Đơn hàng'}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/admin/users" 
                  className={`nav-link text-white ${location.pathname.includes('/admin/users') ? 'active bg-primary' : ''}`}
                >
                  <i className="bi bi-people me-2"></i>
                  {!sidebarCollapsed && 'Người dùng'}
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="mt-auto p-3 border-top border-secondary">
            <button 
              className="btn btn-outline-light w-100" 
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              {!sidebarCollapsed && 'Đăng xuất'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-grow-1 bg-light overflow-auto">
        <header className="bg-white shadow-sm p-3">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              {location.pathname === '/admin' && 'Dashboard'}
              {location.pathname.includes('/admin/products') && 'Quản lý sản phẩm'}
              {location.pathname.includes('/admin/categories') && 'Quản lý danh mục'}
              {location.pathname.includes('/admin/orders') && 'Quản lý đơn hàng'}
              {location.pathname.includes('/admin/users') && 'Quản lý người dùng'}
            </h4>
            <div>
              <Link to="/" className="btn btn-outline-primary me-2">
                <i className="bi bi-house-door me-1"></i>
                Về trang chủ
              </Link>
            </div>
          </div>
        </header>
        
        <main>
          <Outlet />
        </main>
        
        <footer className="bg-white p-3 text-center border-top">
          <p className="mb-0 text-muted">&copy; {new Date().getFullYear()} - Hệ thống quản lý cửa hàng</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout; 