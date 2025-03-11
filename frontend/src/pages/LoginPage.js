import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
  const [error, setError] = useState('');
  const { login, user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy redirect từ query params hoặc sử dụng trang chủ làm mặc định
  const params = new URLSearchParams(location.search);
  const redirectPath = params.get('redirect') || '/';
  
  // Nếu đã đăng nhập, chuyển hướng đến trang được yêu cầu
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User already authenticated, redirecting to:', redirectPath);
      
      // Nếu người dùng là admin và đang cố gắng truy cập trang admin
      if (user.is_admin && redirectPath.includes('/admin')) {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, redirectPath]);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Email không hợp lệ')
      .required('Vui lòng nhập email'),
    password: Yup.string()
      .required('Vui lòng nhập mật khẩu')
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      console.log('Attempting login with:', values);
      setError(''); // Xóa lỗi cũ nếu có
      
      const response = await login(values);
      console.log('Login successful, response:', response);
      
      // Kiểm tra response
      if (!response) {
        console.error('Login succeeded but no response');
        setError('Đăng nhập không thành công: Không nhận được phản hồi');
        return;
      }
      
      // Kiểm tra quyền admin
      const isAdminUser = 
        (response.user && response.user.is_admin === true) || 
        (response.is_admin === true);
      
      // Đợi một chút để đảm bảo token được lưu và context được cập nhật
      setTimeout(() => {
        if (isAdminUser && redirectPath.includes('/admin')) {
          console.log('Admin user detected, navigating to admin dashboard');
          navigate('/admin', { replace: true });
        } else {
          console.log('Regular user, navigating to:', redirectPath);
          navigate(redirectPath, { replace: true });
        }
      }, 300);
    } catch (err) {
      console.error('Login error in LoginPage:', err);
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      if (err && typeof err === 'object') {
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body p-4">
              <h1 className="text-center mb-4">Đăng nhập</h1>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email</label>
                      <Field
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        placeholder="Nhập email của bạn"
                      />
                      <ErrorMessage name="email" component="div" className="text-danger mt-1" />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="password" className="form-label">Mật khẩu</label>
                      <Field
                        type="password"
                        id="password"
                        name="password"
                        className="form-control"
                        placeholder="Nhập mật khẩu của bạn"
                      />
                      <ErrorMessage name="password" component="div" className="text-danger mt-1" />
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      ) : null}
                      Đăng nhập
                    </button>
                  </Form>
                )}
              </Formik>
              
              <div className="text-center mt-4">
                <p>
                  Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;