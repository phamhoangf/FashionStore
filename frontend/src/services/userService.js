import api from './api';

/**
 * Lấy thông tin người dùng hiện tại
 * @returns {Promise<Object>} Thông tin người dùng
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/status');
    if (!response || !response.user) {
      throw new Error('Không nhận được thông tin người dùng từ server');
    }
    return response.user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    // Chuyển đổi lỗi để dễ xử lý hơn
    if (error.message) {
      throw error;
    } else if (error.error) {
      throw new Error(error.error);
    } else {
      throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau.');
    }
  }
};

/**
 * Cập nhật thông tin người dùng
 * @param {Object} userData - Dữ liệu người dùng cần cập nhật
 * @returns {Promise<Object>} Thông tin người dùng sau khi cập nhật
 */
export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/api/auth/profile', userData);
    if (!response || !response.user) {
      throw new Error('Không nhận được thông tin người dùng từ server');
    }
    return response.user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Chuyển đổi lỗi để dễ xử lý hơn
    if (error.message) {
      throw error;
    } else if (error.error) {
      throw new Error(error.error);
    } else {
      throw new Error('Không thể cập nhật thông tin. Vui lòng thử lại sau.');
    }
  }
};

/**
 * Thay đổi mật khẩu người dùng
 * @param {Object} passwordData - Dữ liệu mật khẩu cũ và mới
 * @returns {Promise<Object>} Kết quả thay đổi mật khẩu
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await api.put('/api/auth/password', passwordData);
    return response;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Tải lên ảnh đại diện
 * @param {File} imageFile - File ảnh đại diện
 * @returns {Promise<Object>} Thông tin người dùng sau khi cập nhật ảnh đại diện
 */
export const uploadAvatar = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    
    const response = await api.post('/api/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.user;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

export default {
  getCurrentUser,
  updateUserProfile,
  changePassword,
  uploadAvatar
}; 