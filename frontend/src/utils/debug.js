import api from '../services/api';

/**
 * Kiểm tra cấu hình backend
 * @returns {Promise<Object>} - Thông tin cấu hình
 */
export const checkBackendConfig = async () => {
  try {
    // Gọi API để lấy thông tin cấu hình
    const response = await api.get('/api/debug/config');
    console.log('Backend config:', response);
    return response;
  } catch (error) {
    console.error('Error checking backend config:', error);
    return { error: error.message || 'Unknown error' };
  }
};

/**
 * Kiểm tra đường dẫn ảnh
 * @param {string} imageUrl - Đường dẫn ảnh cần kiểm tra
 * @returns {Promise<Object>} - Kết quả kiểm tra
 */
export const checkImagePath = async (imageUrl) => {
  try {
    // Gọi API để kiểm tra đường dẫn ảnh
    const response = await api.get(`/api/debug/image?url=${encodeURIComponent(imageUrl)}`);
    console.log('Image path check:', response);
    return response;
  } catch (error) {
    console.error('Error checking image path:', error);
    return { error: error.message || 'Unknown error' };
  }
};

/**
 * Kiểm tra thư mục uploads
 * @returns {Promise<Object>} - Danh sách file trong thư mục uploads
 */
export const checkUploadsDirectory = async () => {
  try {
    // Gọi API để lấy danh sách file trong thư mục uploads
    const response = await api.get('/api/debug/uploads');
    console.log('Uploads directory:', response);
    return response;
  } catch (error) {
    console.error('Error checking uploads directory:', error);
    return { error: error.message || 'Unknown error' };
  }
};

/**
 * Kiểm tra trực tiếp URL ảnh
 * @param {string} url - URL ảnh cần kiểm tra
 * @returns {Promise<boolean>} - true nếu ảnh tồn tại, false nếu không
 */
export const checkImageUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      console.log('Image exists:', url);
      resolve(true);
    };
    img.onerror = () => {
      console.error('Image does not exist:', url);
      resolve(false);
    };
    img.src = url;
    
    // Timeout sau 5 giây
    setTimeout(() => {
      if (!img.complete) {
        console.error('Image load timeout:', url);
        resolve(false);
      }
    }, 5000);
  });
}; 