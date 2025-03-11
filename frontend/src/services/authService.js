import api from './api';

export const login = async (credentials) => {
  try {
    // Xóa token cũ nếu có
    localStorage.removeItem('token');
    
    console.log('Login request with credentials:', JSON.stringify(credentials));
    const response = await api.post('/auth/login', credentials);
    console.log('Login response:', JSON.stringify(response));
    
    if (response && response.access_token) {
      // Đảm bảo token không có khoảng trắng ở đầu hoặc cuối
      console.log('Raw token:', response.access_token);
      console.log('Token length:', response.access_token.length);
      const cleanToken = response.access_token.trim();
      console.log('Cleaned token length:', cleanToken.length);
      
      // Lưu token mới
      localStorage.setItem('token', cleanToken);
      console.log('Token saved:', cleanToken.substring(0, 15) + '...');
      
      // Kiểm tra token đã lưu
      const savedToken = localStorage.getItem('token');
      console.log('Retrieved token from localStorage:', savedToken ? savedToken.substring(0, 15) + '...' : 'null');
      console.log('Retrieved token length:', savedToken ? savedToken.length : 0);
      
      // Nếu response có user, trả về ngay
      if (response.user) {
        console.log('User info in login response:', response.user);
        return response;
      }
      
      // Nếu không có user, thử lấy thông tin user
      try {
        console.log('Getting user info after login...');
        const userInfo = await checkAuthStatus();
        console.log('User info from checkAuthStatus:', userInfo);
        return {
          ...response,
          user: userInfo
        };
      } catch (userError) {
        console.error('Error getting user info:', userError);
        // Vẫn trả về response để không làm gián đoạn luồng đăng nhập
        return response;
      }
    } else {
      console.error('No access_token in response:', response);
      throw new Error('Đăng nhập không thành công: Không nhận được token');
    }
  } catch (error) {
    console.error('Login error:', error);
    // Đảm bảo error là một object có thuộc tính message
    if (typeof error === 'string') {
      throw new Error(error);
    } else if (error.error) {
      throw new Error(error.error);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Đăng nhập không thành công. Vui lòng thử lại.');
    }
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    console.log('Register response:', response);
    
    if (response && response.access_token) {
      localStorage.setItem('token', response.access_token);
      console.log('Token saved:', response.access_token);
      
      // Lấy thông tin người dùng sau khi đăng ký
      const userInfo = await checkAuthStatus();
      return {
        ...response,
        user: userInfo
      };
    } else {
      console.error('No access_token in response:', response);
      throw new Error('Đăng ký không thành công: Không nhận được token');
    }
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // Xóa token trước khi gọi API logout
    localStorage.removeItem('token');
    const response = await api.post('/auth/logout');
    console.log('Logout response:', response);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Không ném lỗi khi logout thất bại, vẫn xóa token
    return { success: true, message: 'Đã đăng xuất' };
  }
};

export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for auth check');
      throw new Error('Không tìm thấy token');
    }
    
    // Đảm bảo token không có khoảng trắng ở đầu hoặc cuối
    const cleanToken = token.trim();
    if (cleanToken !== token) {
      console.log('Token had whitespace, saving cleaned token');
      localStorage.setItem('token', cleanToken);
    }
    
    console.log('Checking auth status with token:', cleanToken.substring(0, 10) + '...');
    const response = await api.get('/auth/status');
    console.log('Auth status response:', response);
    
    if (!response || !response.user) {
      console.error('No user data in auth status response');
      throw new Error('Không nhận được thông tin người dùng');
    }
    
    return response.user;
  } catch (error) {
    console.error('Auth status error:', error);
    // Xóa token nếu kiểm tra thất bại do token không hợp lệ
    if (error.error === 'Invalid token' || 
        error.error === 'Token has expired' || 
        error.message === 'Không tìm thấy token') {
      console.log('Removing invalid token');
      localStorage.removeItem('token');
    }
    throw error;
  }
};

export const checkAdminStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for admin check');
      throw new Error('Bạn cần đăng nhập để truy cập trang quản trị');
    }
    
    // Đảm bảo token không có khoảng trắng ở đầu hoặc cuối
    const cleanToken = token.trim();
    if (cleanToken !== token) {
      console.log('Token had whitespace, saving cleaned token');
      localStorage.setItem('token', cleanToken);
    }
    
    console.log('Checking admin status with token:', cleanToken.substring(0, 10) + '...');
    const response = await api.get('/admin/check');
    console.log('Admin check response:', response);
    
    // Kiểm tra cấu trúc response
    if (!response) {
      console.error('Empty response from admin check');
      throw new Error('Không nhận được phản hồi từ máy chủ');
    }
    
    // Kiểm tra is_admin trước
    if (response.is_admin === true) {
      console.log('Admin status confirmed via is_admin flag');
      // Nếu có user trong response, trả về user
      if (response.user) {
        return response.user;
      }
      // Nếu không có user nhưng có is_admin, tạo một đối tượng user tạm thời
      return { is_admin: true };
    }
    
    // Kiểm tra user.is_admin
    if (response.user && response.user.is_admin) {
      console.log('Admin status confirmed via user object');
      return response.user;
    }
    
    console.error('User is not an admin');
    throw new Error('Bạn không có quyền truy cập trang quản trị');
  } catch (error) {
    console.error('Admin check error:', error);
    // Đảm bảo error là một object có thuộc tính message
    if (typeof error === 'string') {
      throw new Error(error);
    } else if (error.error) {
      throw new Error(error.error);
    } else if (!error.message) {
      throw new Error('Không thể xác thực quyền admin');
    } else {
      throw error;
    }
  }
};