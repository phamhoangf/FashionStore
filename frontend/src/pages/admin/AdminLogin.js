import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminLogin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Gọi API đăng nhập thực tế
      const response = await api.post('/auth/login', credentials);
      
      if (response && response.access_token) {
        // Lưu token vào localStorage
        localStorage.setItem('token', response.access_token.trim());
        
        // Kiểm tra quyền admin
        try {
          const adminCheck = await api.get('/admin/check');
          
          if (adminCheck && adminCheck.is_admin) {
            // Lưu thông tin admin
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUser', JSON.stringify(adminCheck.user || {
              id: response.user?.id,
              name: response.user?.name,
              email: response.user?.email,
              is_admin: true
            }));
            
            // Chuyển hướng đến trang dashboard
            navigate('/admin');
          } else {
            setError('Tài khoản của bạn không có quyền truy cập trang quản trị');
            localStorage.removeItem('token');
          }
        } catch (adminError) {
          console.error('Admin check error:', adminError);
          
          // Nếu không có quyền admin, hiển thị thông báo lỗi
          if (adminError.error === 'Admin privileges required') {
            setError('Tài khoản của bạn không có quyền truy cập trang quản trị');
          } else {
            setError('Không thể xác thực quyền admin: ' + (adminError.message || adminError.error || 'Lỗi không xác định'));
          }
          localStorage.removeItem('token');
        }
      } else {
        setError('Đăng nhập không thành công: Không nhận được token');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.error || error.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Thêm chức năng đăng nhập với tài khoản mẫu khi gặp lỗi
  const handleDemoLogin = () => {
    // Lưu thông tin admin mẫu
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('adminUser', JSON.stringify({
      id: 1,
      name: 'Admin Demo',
      email: 'admin@example.com',
      is_admin: true
    }));
    
    // Chuyển hướng đến trang dashboard
    navigate('/admin');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Đăng nhập Admin</h2>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                  <div className="mt-2">
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      onClick={handleDemoLogin}
                    >
                      Đăng nhập với tài khoản demo
                    </button>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang đăng nhập...
                      </>
                    ) : 'Đăng nhập'}
                  </button>
                </div>
                
                <div className="mt-3 text-center">
                  <p className="text-muted">
                    Hoặc <button 
                      type="button" 
                      className="btn btn-link p-0" 
                      onClick={handleDemoLogin}
                    >
                      đăng nhập với tài khoản demo
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 