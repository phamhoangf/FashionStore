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
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Xử lý lỗi khi không có response
    if (!error.response) {
      return Promise.reject({ 
        error: 'Network error',
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.' 
      });
    }
    
    // Xử lý lỗi 401 Unauthorized
    if (error.response.status === 401) {
      // Kiểm tra xem lỗi có phải do token không hợp lệ không
      const errorData = error.response.data;
      const errorMessage = errorData?.error || errorData?.message || '';
      
      if (errorMessage.includes('Invalid token') || 
          errorMessage.includes('Token has expired') || 
          errorMessage.includes('Missing Authorization header')) {
        localStorage.removeItem('token');
        
        // Chỉ chuyển hướng nếu chưa có chuyển hướng nào đang xảy ra
        // Và nếu đã qua ít nhất 2 giây kể từ lần chuyển hướng cuối cùng
        const currentTime = Date.now();
        if (!redirectInProgress && (currentTime - lastRedirectTime > 2000)) {
          // Chỉ chuyển hướng nếu không phải đang ở trang đăng nhập, đăng ký
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && 
              !currentPath.includes('/register')) {
            
            redirectInProgress = true;
            lastRedirectTime = currentTime;
            
            // Nếu đang ở trang admin, chuyển hướng đến trang đăng nhập với redirect
            if (currentPath.includes('/admin')) {
              setTimeout(() => {
                window.location.href = '/admin/login';
                redirectInProgress = false;
              }, 500);
            } else {
              setTimeout(() => {
                window.location.href = '/login?redirect=' + currentPath;
                redirectInProgress = false;
              }, 500);
            }
          }
        }
      }
    }
    
    // Đảm bảo trả về một object có cấu trúc chuẩn
    const errorData = error.response?.data;
    if (typeof errorData === 'string') {
      return Promise.reject({ error: errorData, message: errorData });
    } else if (errorData && typeof errorData === 'object') {
      return Promise.reject({
        ...errorData,
        message: errorData.message || errorData.error || 'Đã xảy ra lỗi'
      });
    } else {
      return Promise.reject({ 
        error: 'API error',
        message: error.message || 'Đã xảy ra lỗi khi gọi API' 
      });
    }
  }
);

export default api;