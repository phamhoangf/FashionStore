import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart } from '../services/cartService';
import { getProductById } from '../services/productService';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0, total_items: 0 });
  const [loading, setLoading] = useState(true);
  const [tempCart, setTempCart] = useState(null); // Giỏ hàng tạm thời cho người dùng chưa đăng nhập
  const { isAuthenticated, user } = useContext(AuthContext);

  // Khởi tạo giỏ hàng từ localStorage hoặc API
  useEffect(() => {
    const initCart = async () => {
      try {
        setLoading(true);
        
        // Nếu đã đăng nhập, lấy giỏ hàng từ API
        if (isAuthenticated) {
          try {
            const cartData = await getCart();
            setCart(cartData);
            
            // Nếu có giỏ hàng tạm thời, đồng bộ với giỏ hàng từ API
            const localCart = localStorage.getItem('tempCart');
            if (localCart) {
              const parsedLocalCart = JSON.parse(localCart);
              // Đồng bộ giỏ hàng tạm thời vào giỏ hàng chính
              // (Chức năng này sẽ được thực hiện sau khi đăng nhập thành công)
              localStorage.removeItem('tempCart');
            }
          } catch (error) {
            console.error('Failed to load cart from API:', error);
            // Nếu API lỗi, sử dụng giỏ hàng từ localStorage
            const localCart = localStorage.getItem('cart');
            if (localCart) {
              setCart(JSON.parse(localCart));
            }
          }
        } else {
          // Nếu chưa đăng nhập, lấy giỏ hàng tạm thời từ localStorage
          const localCart = localStorage.getItem('tempCart');
          if (localCart) {
            setTempCart(JSON.parse(localCart));
          }
        }
      } catch (error) {
        console.error('Failed to initialize cart:', error);
      } finally {
        setLoading(false);
      }
    };

    initCart();
  }, [isAuthenticated]);

  // Lưu giỏ hàng vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(cart));
    } else if (tempCart) {
      localStorage.setItem('tempCart', JSON.stringify(tempCart));
    }
  }, [cart, tempCart, isAuthenticated]);

  // Đồng bộ giỏ hàng tạm thời vào giỏ hàng chính khi đăng nhập thành công
  useEffect(() => {
    const syncTempCart = async () => {
      if (isAuthenticated && tempCart && tempCart.items && tempCart.items.length > 0) {
        try {
          // Thêm từng sản phẩm trong giỏ hàng tạm thời vào giỏ hàng chính
          for (const item of tempCart.items) {
            await addToCart(item.product_id, item.quantity);
          }
          
          // Xóa giỏ hàng tạm thời
          setTempCart(null);
          localStorage.removeItem('tempCart');
        } catch (error) {
          console.error('Failed to sync temp cart:', error);
        }
      }
    };
    
    if (isAuthenticated && tempCart) {
      syncTempCart();
    }
  }, [isAuthenticated, tempCart]);

  const addItem = async (productId, quantity) => {
    try {
      // Nếu đã đăng nhập, thêm vào giỏ hàng qua API
      if (isAuthenticated) {
        try {
          const updatedCart = await addToCart(productId, quantity);
          setCart(updatedCart);
          return updatedCart;
        } catch (error) {
          console.error('Failed to add item to cart via API:', error);
          // Nếu API lỗi, thêm vào giỏ hàng local
          await addItemToLocalCart(productId, quantity);
          return cart;
        }
      } else {
        // Nếu chưa đăng nhập, lưu vào giỏ hàng tạm thời
        await addItemToTempCart(productId, quantity);
        return tempCart;
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      return false;
    }
  };

  // Hàm thêm sản phẩm vào giỏ hàng tạm thời
  const addItemToTempCart = async (productId, quantity) => {
    try {
      // Lấy thông tin sản phẩm từ API
      const product = await getProductById(productId);
      
      setTempCart(prevCart => {
        // Nếu chưa có giỏ hàng tạm thời, tạo mới
        if (!prevCart) {
          prevCart = { items: [], total: 0, total_items: 0 };
        }
        
        // Tìm sản phẩm trong giỏ hàng
        const existingItemIndex = prevCart.items.findIndex(item => item.product_id === productId);
        
        if (existingItemIndex >= 0) {
          // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
          const updatedItems = [...prevCart.items];
          updatedItems[existingItemIndex].quantity += quantity;
          
          // Tính lại tổng tiền
          const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            ...prevCart,
            items: updatedItems,
            total,
            total_items: totalItems
          };
        } else {
          // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
          const newItem = {
            id: Date.now(), // ID tạm thời
            product_id: productId,
            quantity,
            product
          };
          
          const updatedItems = [...prevCart.items, newItem];
          const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            ...prevCart,
            items: updatedItems,
            total,
            total_items: totalItems
          };
        }
      });
    } catch (error) {
      console.error('Failed to get product details:', error);
      // Nếu không lấy được thông tin sản phẩm, vẫn thêm vào giỏ hàng với thông tin tối thiểu
      setTempCart(prevCart => {
        // Nếu chưa có giỏ hàng tạm thời, tạo mới
        if (!prevCart) {
          prevCart = { items: [], total: 0, total_items: 0 };
        }
        
        const existingItemIndex = prevCart.items.findIndex(item => item.product_id === productId);
        
        if (existingItemIndex >= 0) {
          const updatedItems = [...prevCart.items];
          updatedItems[existingItemIndex].quantity += quantity;
          
          const total = updatedItems.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            ...prevCart,
            items: updatedItems,
            total,
            total_items: totalItems
          };
        } else {
          const newItem = {
            id: Date.now(),
            product_id: productId,
            quantity,
            product: {
              id: productId,
              name: `Sản phẩm #${productId}`,
              price: 0,
              image_url: ''
            }
          };
          
          const updatedItems = [...prevCart.items, newItem];
          const total = updatedItems.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            ...prevCart,
            items: updatedItems,
            total,
            total_items: totalItems
          };
        }
      });
    }
  };

  // Hàm thêm sản phẩm vào giỏ hàng local
  const addItemToLocalCart = async (productId, quantity) => {
    try {
      // Lấy thông tin sản phẩm từ API
      const product = await getProductById(productId);
      
      setCart(prevCart => {
        // Tìm sản phẩm trong giỏ hàng
        const existingItemIndex = prevCart.items.findIndex(item => item.product_id === productId);
        
        if (existingItemIndex >= 0) {
          // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
          const updatedItems = [...prevCart.items];
          updatedItems[existingItemIndex].quantity += quantity;
          
          // Tính lại tổng tiền
          const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            ...prevCart,
            items: updatedItems,
            total,
            total_items: totalItems
          };
        } else {
          // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
          const newItem = {
            id: Date.now(), // ID tạm thời
            product_id: productId,
            quantity,
            product
          };
          
          const updatedItems = [...prevCart.items, newItem];
          const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            ...prevCart,
            items: updatedItems,
            total,
            total_items: totalItems
          };
        }
      });
    } catch (error) {
      console.error('Failed to get product details:', error);
      // Nếu không lấy được thông tin sản phẩm, vẫn thêm vào giỏ hàng với thông tin tối thiểu
      setCart(prevCart => {
        const existingItemIndex = prevCart.items.findIndex(item => item.product_id === productId);
        
        if (existingItemIndex >= 0) {
          const updatedItems = [...prevCart.items];
          updatedItems[existingItemIndex].quantity += quantity;
          
          const total = updatedItems.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            ...prevCart,
            items: updatedItems,
            total,
            total_items: totalItems
          };
        } else {
          const newItem = {
            id: Date.now(),
            product_id: productId,
            quantity,
            product: {
              id: productId,
              name: `Sản phẩm #${productId}`,
              price: 0,
              image_url: ''
            }
          };
          
          const updatedItems = [...prevCart.items, newItem];
          const total = updatedItems.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            ...prevCart,
            items: updatedItems,
            total,
            total_items: totalItems
          };
        }
      });
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      // Nếu đã đăng nhập, cập nhật giỏ hàng qua API
      if (isAuthenticated) {
        try {
          const updatedCart = await updateCartItem(itemId, quantity);
          setCart(updatedCart);
          return updatedCart;
        } catch (error) {
          console.error('Failed to update cart item via API:', error);
          // Nếu API lỗi, cập nhật giỏ hàng local
          updateLocalCartItem(itemId, quantity);
          return cart;
        }
      } else {
        // Nếu chưa đăng nhập, cập nhật giỏ hàng tạm thời
        updateTempCartItem(itemId, quantity);
        return tempCart;
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      return false;
    }
  };

  // Hàm cập nhật sản phẩm trong giỏ hàng tạm thời
  const updateTempCartItem = (itemId, quantity) => {
    setTempCart(prevCart => {
      if (!prevCart) return prevCart;
      
      // Tìm sản phẩm trong giỏ hàng
      const existingItemIndex = prevCart.items.findIndex(item => item.id === itemId);
      
      if (existingItemIndex >= 0) {
        // Cập nhật số lượng
        const updatedItems = [...prevCart.items];
        updatedItems[existingItemIndex].quantity = quantity;
        
        // Tính lại tổng tiền
        const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        
        return {
          ...prevCart,
          items: updatedItems,
          total,
          total_items: totalItems
        };
      }
      
      return prevCart;
    });
  };

  // Hàm cập nhật sản phẩm trong giỏ hàng local
  const updateLocalCartItem = (itemId, quantity) => {
    setCart(prevCart => {
      // Tìm sản phẩm trong giỏ hàng
      const existingItemIndex = prevCart.items.findIndex(item => item.id === itemId);
      
      if (existingItemIndex >= 0) {
        // Cập nhật số lượng
        const updatedItems = [...prevCart.items];
        updatedItems[existingItemIndex].quantity = quantity;
        
        // Tính lại tổng tiền
        const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        
        return {
          ...prevCart,
          items: updatedItems,
          total,
          total_items: totalItems
        };
      }
      
      return prevCart;
    });
  };

  const removeItem = async (itemId) => {
    try {
      // Nếu đã đăng nhập, xóa sản phẩm khỏi giỏ hàng qua API
      if (isAuthenticated) {
        try {
          const updatedCart = await removeFromCart(itemId);
          setCart(updatedCart);
          return updatedCart;
        } catch (error) {
          console.error('Failed to remove item from cart via API:', error);
          // Nếu API lỗi, xóa sản phẩm khỏi giỏ hàng local
          removeLocalCartItem(itemId);
          return cart;
        }
      } else {
        // Nếu chưa đăng nhập, xóa sản phẩm khỏi giỏ hàng tạm thời
        removeTempCartItem(itemId);
        return tempCart;
      }
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      return false;
    }
  };

  // Hàm xóa sản phẩm khỏi giỏ hàng tạm thời
  const removeTempCartItem = (itemId) => {
    setTempCart(prevCart => {
      if (!prevCart) return prevCart;
      
      // Lọc bỏ sản phẩm cần xóa
      const updatedItems = prevCart.items.filter(item => item.id !== itemId);
      
      // Tính lại tổng tiền
      const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...prevCart,
        items: updatedItems,
        total,
        total_items: totalItems
      };
    });
  };

  // Hàm xóa sản phẩm khỏi giỏ hàng local
  const removeLocalCartItem = (itemId) => {
    setCart(prevCart => {
      // Lọc bỏ sản phẩm cần xóa
      const updatedItems = prevCart.items.filter(item => item.id !== itemId);
      
      // Tính lại tổng tiền
      const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...prevCart,
        items: updatedItems,
        total,
        total_items: totalItems
      };
    });
  };

  return (
    <CartContext.Provider
      value={{
        cart: isAuthenticated ? cart : tempCart || { items: [], total: 0, total_items: 0 },
        loading,
        addItem,
        updateItem,
        removeItem,
        itemCount: isAuthenticated ? (cart.total_items || 0) : (tempCart?.total_items || 0),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};