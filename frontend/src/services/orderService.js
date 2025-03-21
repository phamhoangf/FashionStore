import api from './api';

/**
 * Lấy danh sách đơn hàng của người dùng hiện tại
 * @returns {Promise<Array>} Danh sách đơn hàng
 */
export const getUserOrders = async () => {
  try {
    const response = await api.get('/orders');
    return response;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết một đơn hàng
 * @param {string|number} orderId - ID của đơn hàng
 * @returns {Promise<Object>} Thông tin chi tiết đơn hàng
 */
export const getOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching order details for order ${orderId}:`, error);
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
    const response = await api.post(`/orders/${orderId}/pay`);
    return response;
  } catch (error) {
    console.error(`Error initiating payment for order ${orderId}:`, error);
    throw error;
  }
};

export default {
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  createOrder,
  payWithVNPay
}; 