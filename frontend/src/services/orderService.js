import api from './api';

/**
 * Lấy danh sách đơn hàng của người dùng hiện tại
 * @returns {Promise<Array>} Danh sách đơn hàng
 */
export const getUserOrders = async () => {
  try {
    const response = await api.get('/orders');
    console.log('Raw orders response:', response);
    
    // Check if response has expected structure
    if (response && response.items) {
      return response; // Return the structured response with items, total, pages, etc
    } else if (Array.isArray(response)) {
      return response; // Return the array directly
    } else {
      console.warn('Unexpected orders response format:', response);
      return { items: [], total: 0, pages: 1, page: 1 }; // Return empty structured response
    }
  } catch (error) {
    console.error('Error fetching user orders:', error);
    // Return empty result instead of throwing to prevent UI errors
    return { items: [], total: 0, pages: 1, page: 1 };
  }
};

/**
 * Lấy chi tiết đơn hàng theo ID
 * @param {number|string} id ID của đơn hàng
 * @returns {Promise<Object>} Thông tin đơn hàng
 */
export const getOrderDetails = async (id) => {
  try {
    if (!id) {
      throw new Error('ID đơn hàng không hợp lệ');
    }
    
    console.log(`Requesting order details for ID: ${id}`);
        const response = await api.get(`/orders/${id}`);
    
    // Kiểm tra response
    if (!response || typeof response !== 'object') {
      console.error('Invalid order response format:', response);
      throw new Error('Định dạng phản hồi từ máy chủ không hợp lệ');
    }

    console.log(`Order details successfully retrieved for ID ${id}:`, response);
    return response;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    // Ghi log thêm thông tin về lỗi
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      
      // Xử lý lỗi 401/403 (Unauthorized/Forbidden)
      if (error.response.status === 401 || error.response.status === 403) {
        // Thử refresh token hoặc đưa ra thông báo cụ thể
        console.error('Authentication error when fetching order details');
        throw new Error('Vui lòng đăng nhập lại để xem thông tin đơn hàng');
      }
    }
    throw error;
  }
};

/**
 * Hủy đơn hàng
 * @param {string|number} orderId - ID của đơn hàng cần hủy
 * @returns {Promise<Object>} Thông tin đơn hàng sau khi hủy
 */
export const cancelOrder = async (orderId) => {
  try {
    const response = await api.put(`/orders/${orderId}/cancel`);
    return response;
  } catch (error) {
    console.error(`Error cancelling order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Tạo đơn hàng mới
 * @param {Object} orderData - Dữ liệu đơn hàng
 * @returns {Promise<Object>} Thông tin đơn hàng đã tạo
 */
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/orders', orderData);
    return response;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Thanh toán đơn hàng qua VNPay
 * @param {string|number} orderId - ID của đơn hàng
 * @returns {Promise<Object>} Thông tin URL thanh toán
 */
export const payWithVNPay = async (orderId) => {
  try {
    console.log(`Initiating payment for order ID: ${orderId}`);
    const response = await api.get(`/payment/create/${orderId}`);
    console.log('VNPay payment response:', response);
    
    // Kiểm tra cấu trúc response
    if (!response || typeof response !== 'object') {
      throw new Error('Định dạng phản hồi không hợp lệ từ máy chủ thanh toán');
    }
    
    if (!response.payment_url) {
      throw new Error('Không tìm thấy URL thanh toán trong phản hồi');
    }
    
    return response;
  } catch (error) {
    console.error(`Error initiating payment for order ${orderId}:`, error);
    // Trích xuất thông báo lỗi chi tiết từ phản hồi
    const errorMessage = 
      error.response?.data?.error || 
      error.message || 
      'Lỗi khi khởi tạo thanh toán. Vui lòng thử lại sau.';
    
    throw new Error(errorMessage);
  }
};

export default {
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  createOrder,
  payWithVNPay
};