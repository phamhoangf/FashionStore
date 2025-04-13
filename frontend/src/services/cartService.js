import api from './api';

export const getCart = async () => {
  try {
    const response = await api.get('/cart');
    console.log('Raw cart response:', response);
    
    // Kiểm tra và xử lý dữ liệu
    if (!response) {
      console.error('Empty response from cart API');
      return { items: [], total: 0, total_items: 0 };
    }
    
    if (!response.items || !Array.isArray(response.items)) {
      console.error('Invalid cart items format:', response);
      return { items: [], total: 0, total_items: 0 };
    }
    
    // Đảm bảo mỗi item có dữ liệu sản phẩm đầy đủ
    response.items = response.items.map(item => {
      if (!item.product) {
        console.error(`Missing product data for cart item: ${item.id}`);
        // Đặt giá trị mặc định cho product nếu bị thiếu
        item.product = {
          id: item.product_id,
          name: `Sản phẩm #${item.product_id}`,
          price: item.price || 0,
          image_url: null
        };
      }
      
      // Đảm bảo image_url có giá trị
      if (item.product && !item.product.image_url) {
        console.log(`No image URL for product: ${item.product.id} - ${item.product.name}`);
      }
      
      return item;
    });
    
    return response;
  } catch (error) {
    console.error('Get cart error:', error);
    // Trả về giỏ hàng trống và hiển thị thông báo lỗi
    return { items: [], total: 0, total_items: 0 };
  }
};

export const addToCart = async (productId, quantity = 1, size = '') => {
  try {
    if (!productId) {
      throw new Error('Mã sản phẩm không hợp lệ');
    }
    
    if (isNaN(quantity) || quantity < 1) {
      throw new Error('Số lượng sản phẩm không hợp lệ');
    }
    
    if (!size) {
      throw new Error('Vui lòng chọn kích thước sản phẩm');
    }
    
    console.log('Sending request to add product to cart:', { 
      product_id: productId, 
      quantity,
      size
    });
    
    const response = await api.post('/cart/items', { 
      product_id: productId, 
      quantity,
      size
    });
    
    console.log('Add to cart response:', response);
    
    if (!response || !response.item) {
      throw new Error('Không nhận được phản hồi hợp lệ từ máy chủ');
    }
    
    return response;
  } catch (error) {
    console.error('Add to cart error:', error);
    
    // Chi tiết lỗi từ backend
    if (error.response) {
      console.error('Server response error:', error.response);
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      if (error.response.status === 500) {
        throw new Error('Lỗi hệ thống khi thêm sản phẩm vào giỏ hàng. Vui lòng thử lại sau.');
      }
    }
    
    // Tạo thông báo lỗi chi tiết hơn dựa vào loại lỗi
    const errorMessage = error.response?.data?.error || error.message || 'Không thể thêm sản phẩm vào giỏ hàng';
    throw new Error(errorMessage);
  }
};

export const updateCartItem = async (itemId, quantity) => {
  try {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    console.log('Update cart item response:', response);
    return response;
  } catch (error) {
    console.error('Update cart item error:', error);
    throw error;
  }
};

export const updateCartItemSize = async (itemId, size) => {
  try {
    const response = await api.put(`/cart/items/${itemId}/size`, { size });
    
    console.log('Update cart item size response:', response);
    return response;
  } catch (error) {
    console.error('Update cart item size error:', error);
    throw error;
  }
};

export const removeFromCart = async (itemId) => {
  try {
    const response = await api.delete(`/cart/items/${itemId}`);
    console.log('Remove from cart response:', response);
    return response;
  } catch (error) {
    console.error('Remove from cart error:', error);
    throw error;
  }
};

export const clearCart = async () => {
  try {
    const response = await api.delete('/cart');
    console.log('Clear cart response:', response);
    return response;
  } catch (error) {
    console.error('Clear cart error:', error);
    throw error;
  }
};