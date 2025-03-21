import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Thêm interceptor để tự động gửi token JWT trong header
api.interceptors.request.use(
  (config) => {
    // Log request để debug
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.params || {});
    
    // Nếu là FormData, không đặt Content-Type để axios tự động đặt với boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      // Đảm bảo token không có khoảng trắng ở đầu hoặc cuối
      const cleanToken = token.trim();
      
      // Kiểm tra xem token có thay đổi sau khi trim không
      if (cleanToken !== token) {
        // Cập nhật lại token trong localStorage
        localStorage.setItem('token', cleanToken);
      }
      
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Biến để theo dõi xem đã có chuyển hướng nào đang xảy ra chưa
let redirectInProgress = false;
// Biến để theo dõi thời gian cuối cùng chuyển hướng
let lastRedirectTime = 0;

api.interceptors.response.use(
  (response) => {
    // Log response để debug
    console.log(`API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.status);
    return response.data;
  },
  (error) => {
    // Xử lý lỗi response
    if (error.response) {
      // Lỗi từ server với status code
      console.error('API Error Response:', error.response.status, error.response.data);
      
      // Xử lý lỗi 401 Unauthorized
      if (error.response.status === 401) {
        // Kiểm tra xem đã có chuyển hướng nào đang xảy ra chưa
        const currentTime = Date.now();
        if (!redirectInProgress && currentTime - lastRedirectTime > 2000) {
          redirectInProgress = true;
          lastRedirectTime = currentTime;
          
          // Xóa token và chuyển hướng đến trang đăng nhập
          localStorage.removeItem('token');
          
          // Thông báo cho người dùng
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          
          // Chuyển hướng đến trang đăng nhập
          window.location.href = '/login';
          
          // Reset biến theo dõi sau khi chuyển hướng
          setTimeout(() => {
            redirectInProgress = false;
          }, 2000);
        }
      }
    } else if (error.request) {
      // Lỗi không nhận được response
      console.error('API Request Error (No Response):', error.request);
    } else {
      // Lỗi khác
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;