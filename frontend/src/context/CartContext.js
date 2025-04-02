import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart as clearCartAPI } from '../services/cartService';
import { getProductById } from '../services/productService';
import { AuthContext } from './AuthContext';
import NotificationModal from '../components/common/NotificationModal';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0, total_items: 0 });
  const [loading, setLoading] = useState(true);
  const [tempCart, setTempCart] = useState(null); // Giỏ hàng tạm thời cho người dùng chưa đăng nhập
  const { isAuthenticated, user } = useContext(AuthContext);
  
  // State for notification modal
  const [notification, setNotification] = useState({
    show: false,
    title: '',
    message: '',
    product: null
  });

  // Tính tổng tiền giỏ hàng
  const totalAmount = cart.total || 
    (cart.items ? cart.items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0) : 0);

  // Tính tổng số lượng sản phẩm trong giỏ hàng
  const itemCount = cart.total_items || 
    (cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0);

  // Ensure itemCount is a valid number
  const safeItemCount = isNaN(itemCount) ? 0 : itemCount;

  // Show notification
  const showNotification = (title, message, product) => {
    setNotification({
      show: true,
      title,
      message,
      product
    });
  };

  // Hide notification
  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      show: false
    }));
  };

  // Khởi tạo giỏ hàng từ localStorage hoặc API
  useEffect(() => {
    const initCart = async () => {
      try {
        setLoading(true);
        
        // Nếu đã đăng nhập, lấy giỏ hàng từ API
        if (isAuthenticated) {
          try {
            const cartData = await getCart();
            console.log('Cart data from API:', cartData);
            
            // Kiểm tra và xử lý dữ liệu sản phẩm trong giỏ hàng
            if (cartData && cartData.items) {
              // Đảm bảo mỗi item có dữ liệu sản phẩm đầy đủ
              cartData.items.forEach(item => {
                if (item.product) {
                  console.log(`Product in cart: ${item.product.id} - ${item.product.name} - Image: ${item.product.image_url}`);
                } else {
                  console.error(`Missing product data for cart item: ${item.id}`);
                }
              });
            }
            
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
      let product = null;
      
      // Get product details first
      try {
        product = await getProductById(productId);
      } catch (error) {
        console.error('Failed to get product details:', error);
      }
      
      // Nếu đã đăng nhập, thêm vào giỏ hàng qua API
      if (isAuthenticated) {
        try {
          const updatedCart = await addToCart(productId, quantity);
          setCart(updatedCart);
          
          // Show notification
          if (product) {
            showNotification(
              'Thêm vào giỏ hàng thành công',
              `Đã thêm ${quantity} sản phẩm vào giỏ hàng.`,
              product
            );
          }
          
          return updatedCart;
        } catch (error) {
          console.error('Failed to add item to cart via API:', error);
          // Nếu API lỗi, thêm vào giỏ hàng local
          await addItemToLocalCart(productId, quantity);
          
          // Still show notification even if API fails
          if (product) {
            showNotification(
              'Thêm vào giỏ hàng thành công',
              `Đã thêm ${quantity} sản phẩm vào giỏ hàng.`,
              product
            );
          }
          
          return cart;
        }
      } else {
        // Nếu chưa đăng nhập, lưu vào giỏ hàng tạm thời
        await addItemToTempCart(productId, quantity);
        
        // Show notification
        if (product) {
          showNotification(
            'Thêm vào giỏ hàng thành công',
            `Đã thêm ${quantity} sản phẩm vào giỏ hàng.`,
            product
          );
        }
        
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

  // Hàm xóa toàn bộ giỏ hàng
  const clearCart = async (forceReload = false) => {
    try {
      console.log('Clearing cart, before clear - itemCount:', itemCount);
      
      if (isAuthenticated) {
        // Nếu đã đăng nhập, xóa giỏ hàng qua API
        await clearCartAPI();
      }
      
      // Xóa giỏ hàng trong state - đảm bảo cập nhật đúng cấu trúc
      setCart({ 
        items: [], 
        total: 0, 
        total_items: 0 
      });
      
      // Force immediate state update for cart count in header
      // This is a direct DOM update as a fallback to ensure UI consistency
      try {
        const cartBadges = document.querySelectorAll('.position-absolute.badge');
        cartBadges.forEach(badge => {
          if (badge.parentElement?.textContent.includes('Giỏ hàng')) {
            badge.style.display = 'none';
          }
        });
      } catch (domError) {
        console.error('DOM update failed:', domError);
      }
      
      // Cập nhật giỏ hàng tạm thời nếu có
      if (tempCart) {
        setTempCart(null);
      }
      
      // Xóa giỏ hàng trong localStorage
      localStorage.removeItem('cart');
      localStorage.removeItem('tempCart');
      
      // Nếu cần tải lại trang để đồng bộ trạng thái
      if (forceReload) {
        console.log('Force reload requested for cart clear');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
      
      console.log('Cart has been cleared completely, new itemCount should be 0');
      return true;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart: cart.items || [],
        totalAmount,
        itemCount: safeItemCount,
        loading,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        showNotification,
        hideNotification
      }}
    >
      {children}
      
      {/* Render notification modal */}
      <NotificationModal
        show={notification.show}
        onHide={hideNotification}
        title={notification.title}
        message={notification.message}
        product={notification.product}
      />
    </CartContext.Provider>
  );
};