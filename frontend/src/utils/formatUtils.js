/**
 * Định dạng số tiền thành chuỗi tiền tệ VND
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} Chuỗi tiền tệ đã định dạng
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 VNĐ';
  
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(amount).replace('₫', 'VNĐ');
};

/**
 * Định dạng ngày giờ thành chuỗi ngày tháng năm giờ phút
 * @param {string|Date} dateString - Chuỗi ngày hoặc đối tượng Date
 * @returns {string} Chuỗi ngày tháng đã định dạng
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(dateString).toLocaleDateString('vi-VN', options);
};

/**
 * Định dạng ngày thành chuỗi ngày tháng năm
 * @param {string|Date} dateString - Chuỗi ngày hoặc đối tượng Date
 * @returns {string} Chuỗi ngày tháng đã định dạng
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return '';
  
  const options = { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric'
  };
  
  return new Date(dateString).toLocaleDateString('vi-VN', options);
};

/**
 * Lấy text hiển thị cho trạng thái đơn hàng
 * @param {string} status - Trạng thái đơn hàng
 * @returns {string} Text hiển thị
 */
export const getOrderStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Chờ xác nhận';
    case 'confirmed':
    case 'processing':
      return 'Đã xác nhận';
    case 'shipping':
    case 'shipped':
      return 'Đang giao hàng';
    case 'delivered':
      return 'Đã giao hàng';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

/**
 * Lấy màu badge dựa trên trạng thái đơn hàng
 * @param {string} status - Trạng thái đơn hàng
 * @returns {string} Màu badge
 */
export const getOrderStatusBadgeVariant = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
    case 'processing':
      return 'info';
    case 'shipping':
    case 'shipped':
      return 'primary';
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
};

/**
 * Lấy text hiển thị cho trạng thái thanh toán
 * @param {string} status - Trạng thái thanh toán
 * @returns {string} Text hiển thị
 */
export const getPaymentStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Chưa thanh toán';
    case 'paid':
      return 'Đã thanh toán';
    case 'failed':
      return 'Thanh toán thất bại';
    default:
      return 'Không xác định';
  }
};

/**
 * Lấy màu badge dựa trên trạng thái thanh toán
 * @param {string} status - Trạng thái thanh toán
 * @returns {string} Màu badge
 */
export const getPaymentStatusBadgeVariant = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'paid':
      return 'success';
    case 'failed':
      return 'danger';
    default:
      return 'secondary';
  }
};

/**
 * Lấy text hiển thị cho phương thức thanh toán
 * @param {string} method - Phương thức thanh toán
 * @returns {string} Text hiển thị
 */
export const getPaymentMethodText = (method) => {
  switch (method) {
    case 'cod':
      return 'Thanh toán khi nhận hàng';
    case 'vnpay':
      return 'VNPay';
    default:
      return method || 'Không xác định';
  }
}; 