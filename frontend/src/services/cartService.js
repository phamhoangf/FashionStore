import api from './api';

export const getCart = async () => {
  try {
    const response = await api.get('/cart');
    console.log('Cart response:', response);
    return response;
  } catch (error) {
    console.error('Get cart error:', error);
    return { items: [], total: 0, total_items: 0 };
  }
};

export const addToCart = async (productId, quantity) => {
  try {
    const response = await api.post('/cart/items', { product_id: productId, quantity });
    console.log('Add to cart response:', response);
    return response;
  } catch (error) {
    console.error('Add to cart error:', error);
    throw error;
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