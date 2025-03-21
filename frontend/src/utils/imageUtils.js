/**
 * Hàm xử lý URL ảnh sản phẩm
 * - Nếu URL bắt đầu bằng http hoặc https, sử dụng URL đó
 * - Nếu URL bắt đầu bằng /, coi đó là đường dẫn tương đối và thêm URL API
 * - Nếu URL là null, undefined, rỗng hoặc không hợp lệ, sử dụng ảnh mặc định
 * 
 * @param {string} imageUrl - URL ảnh cần xử lý
 * @param {string} fallbackUrl - URL ảnh mặc định khi không có ảnh
 * @returns {string} - URL ảnh đã được xử lý
 */
export const formatImageUrl = (imageUrl, fallbackUrl = 'https://via.placeholder.com/300x400?text=No+Image') => {
  // Kiểm tra URL ảnh
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return fallbackUrl;
  }

  // Loại bỏ khoảng trắng
  const trimmedUrl = imageUrl.trim();
  
  // Nếu URL đã là http hoặc https, sử dụng trực tiếp
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // Cấu hình API URL
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Xử lý các trường hợp khác nhau của URL
  let finalUrl;
  
  if (trimmedUrl.startsWith('/')) {
    // Nếu URL bắt đầu bằng /, coi đó là đường dẫn tương đối
    finalUrl = `${apiUrl}${trimmedUrl}`;
  } else if (trimmedUrl.startsWith('uploads/')) {
    // Nếu URL bắt đầu bằng uploads/, thêm / vào trước
    finalUrl = `${apiUrl}/${trimmedUrl}`;
  } else {
    // Trường hợp khác, coi như là tên file trong thư mục uploads
    finalUrl = `${apiUrl}/uploads/${trimmedUrl}`;
  }
  
  // Thêm timestamp để tránh cache
  const timestamp = new Date().getTime();
  return `${finalUrl}?t=${timestamp}`;
};

/**
 * Kiểm tra xem URL ảnh có tồn tại không
 * @param {string} url - URL ảnh cần kiểm tra
 * @returns {Promise<boolean>} - Promise trả về true nếu ảnh tồn tại, false nếu không
 */
export const checkImageExists = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(true);
    };
    img.onerror = () => {
      resolve(false);
    };
    img.src = url;
  });
}; 