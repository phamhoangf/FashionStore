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
  // Kiểm tra kỹ lưỡng xem có URL ảnh hợp lệ không
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    console.log('formatImageUrl - Không có ảnh, sử dụng ảnh mặc định:', fallbackUrl);
    return fallbackUrl;
  }

  // Loại bỏ khoảng trắng
  const trimmedUrl = imageUrl.trim();
  
  // Nếu URL đã là http hoặc https, sử dụng trực tiếp
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    console.log('formatImageUrl - URL đã đầy đủ:', trimmedUrl);
    return trimmedUrl;
  }

  // Cấu hình API URL
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Nếu URL bắt đầu bằng /, coi đó là đường dẫn tương đối
  if (trimmedUrl.startsWith('/')) {
    const fullUrl = `${apiUrl}${trimmedUrl}`;
    console.log('formatImageUrl - URL tương đối:', fullUrl);
    return fullUrl;
  }

  // Xử lý các trường hợp khác
  let fullUrl;
  
  // Nếu URL đã chứa 'api/' hoặc 'uploads/'
  if (trimmedUrl.includes('api/') || trimmedUrl.includes('uploads/')) {
    // Tránh trùng lặp đường dẫn
    if (trimmedUrl.startsWith('api/')) {
      fullUrl = `${apiUrl}/${trimmedUrl}`;
    } else if (trimmedUrl.startsWith('uploads/')) {
      fullUrl = `${apiUrl}/api/${trimmedUrl}`;
    } else {
      fullUrl = `${apiUrl}/api/${trimmedUrl}`;
    }
  } else {
    // Trường hợp còn lại, giả định là tên file trong thư mục uploads
    fullUrl = `${apiUrl}/api/uploads/${trimmedUrl}`;
  }
  
  console.log('formatImageUrl - URL đã xử lý:', fullUrl);
  return fullUrl;
}; 