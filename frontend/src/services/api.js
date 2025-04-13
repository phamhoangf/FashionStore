import axios from 'axios';

// Tạo instance của axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor cho request
api.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    
    // Thêm token vào header nếu có
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor cho response
api.interceptors.response.use(
  (response) => {
    // Trích xuất dữ liệu từ response
    console.log(`API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.status, response.data || '');
    return response.data;
  },
  (error) => {
    // Ghi log lỗi chi tiết
    console.error('API Response Error:', error);
    
    if (error.response) {
      // Lỗi server trả về (status 4xx, 5xx)
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
      
      // Xử lý lỗi cụ thể
      if (error.response.status === 401) {
        // Lỗi xác thực - xóa token và chuyển hướng đến trang đăng nhập
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      // Tạo thông báo lỗi với chi tiết từ server
      error.message = error.response.data?.error || error.response.data?.message || 'Đã xảy ra lỗi từ server';
    } else if (error.request) {
      // Lỗi không nhận được response
      console.error('Error Request:', error.request);
      error.message = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet của bạn.';
    } else {
      // Lỗi khác
      console.error('Error Message:', error.message);
      error.message = 'Đã xảy ra lỗi khi gửi yêu cầu.';
    }
    
    console.error('Final Error Message:', error.message);
    
    return Promise.reject(error);
  }
);

export default api;