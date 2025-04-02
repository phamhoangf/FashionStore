import api from './api';

export const getProducts = async (params = {}) => {
  try {
    console.log('Fetching products with params:', params);
    const response = await api.get('/products', { params });
    console.log('Products API response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching products:', error);
    // Trả về dữ liệu mẫu hoặc rỗng khi có lỗi
    return { items: [], total: 0, pages: 1 };
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response;
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    console.log('API response for categories:', response);
    
    // Kiểm tra xem response có phải là mảng không
    if (Array.isArray(response)) {
      // Nếu là mảng, trả về trực tiếp
      return response;
    } else if (response && Array.isArray(response.items)) {
      // Nếu là object có thuộc tính items là mảng, trả về response.items
      return response.items;
    } else {
      // Trường hợp khác, trả về mảng rỗng
      console.error('Unexpected categories response format:', response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getBrands = async () => {
  try {
    const response = await api.get('/brands');
    console.log('API response for brands:', response);
    
    // Kiểm tra xem response có phải là mảng không
    if (Array.isArray(response)) {
      // Nếu là mảng, trả về trực tiếp
      return response;
    } else if (response && Array.isArray(response.items)) {
      // Nếu là object có thuộc tính items là mảng, trả về response.items
      return response.items;
    } else {
      // Trường hợp khác, trả về mảng rỗng
      console.error('Unexpected brands response format:', response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching brands:', error);
    // Return dummy data until the API is implemented
    return [
      { id: 1, name: 'Nike', productCount: 12 },
      { id: 2, name: 'Adidas', productCount: 8 },
      { id: 3, name: 'Puma', productCount: 5 },
      { id: 4, name: 'Reebok', productCount: 3 }
    ];
  }
};