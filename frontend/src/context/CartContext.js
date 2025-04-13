import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart as clearCartAPI, updateCartItemSize } from '../services/cartService';
import { getProductById } from '../services/productService';
import { AuthContext } from './AuthContext';
import NotificationModal from '../components/common/NotificationModal';
import { toast } from 'react-toastify';

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

  // Tính tổng tiền cho các mặt hàng đã chọn
  const calculateSelectedTotal = useCallback((selectedItems) => {
    if (!cart.items || !selectedItems || selectedItems.length === 0) return 0;
    
    return cart.items
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  }, [cart.items]);

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

  // Lắng nghe sự kiện user-logout để xóa giỏ hàng
  useEffect(() => {
    const handleLogout = () => {
      console.log('Logout detected, clearing cart data');
      setCart({ items: [], total: 0, total_items: 0 });
      localStorage.removeItem('cart');
      localStorage.removeItem('tempCart');
    };

    window.addEventListener('user-logout', handleLogout);
    
    return () => {
      window.removeEventListener('user-logout', handleLogout);
    };
  }, []);

  const addItem = useCallback(async (productId, quantity, size = '') => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return Promise.reject(new Error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng'));
    }

    try {
      // Start with optimistic UI update
      const existingItemIndex = cart.items.findIndex(
        item => item.product_id === parseInt(productId) && item.size === size
      );
      
      // Only set loading for new items, not for updating quantity
      if (existingItemIndex === -1) {
        // For new items, we'll show loading state
        setLoading(true);
      }
      
      console.log(`Thêm sản phẩm: productId=${productId}, quantity=${quantity}, size=${size}`);
      
      // Kiểm tra tham số đầu vào
      if (!productId) {
        const error = new Error('Mã sản phẩm không hợp lệ');
        toast.error('Không thể thêm sản phẩm: Mã sản phẩm không hợp lệ');
        if (existingItemIndex === -1) setLoading(false);
        return Promise.reject(error);
      }
      
      if (isNaN(quantity) || quantity < 1) {
        const error = new Error('Số lượng sản phẩm không hợp lệ');
        toast.error('Không thể thêm sản phẩm: Số lượng không hợp lệ');
        if (existingItemIndex === -1) setLoading(false);
        return Promise.reject(error);
      }
      
      if (!size) {
        const error = new Error('Vui lòng chọn kích thước');
        toast.error('Vui lòng chọn kích thước');
        if (existingItemIndex === -1) setLoading(false);
        return Promise.reject(error);
      }

      // Apply optimistic update for better UX
      if (existingItemIndex !== -1) {
        // Update immediately in UI for existing items
        const existingItem = cart.items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        
        // Create optimistic update
        const optimisticItems = [...cart.items];
        optimisticItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity
        };
        
        // Update UI immediately
        setCart(prevCart => ({
          ...prevCart,
          items: optimisticItems,
          total: optimisticItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
          total_items: optimisticItems.reduce((sum, item) => sum + item.quantity, 0)
        }));
        
        // Then make API call in background
        updateCartItem(existingItem.id, newQuantity)
          .then(response => {
            // If API response is different from our optimistic update, correct it
            if (response && response.items) {
              setCart(prevCart => ({
                ...prevCart,
                items: response.items,
                total: response.total || 0,
                total_items: response.total_items || 0
              }));
            }
          })
          .catch(err => {
            console.error('Error updating cart item:', err);
            toast.error('Không thể cập nhật sản phẩm, vui lòng thử lại');
            
            // Revert to original state on error
            setCart(prevCart => ({
              ...prevCart,
              items: cart.items, // Original items before optimistic update
              total: cart.total,
              total_items: cart.total_items
            }));
          });
        
        return Promise.resolve({ success: true });
      } else {
        // For new items, make API call first since we need the new item ID
        const response = await addToCart(productId, quantity, size);
        
        console.log('Add to cart response:', response);
        
        // Cập nhật giỏ hàng
        if (response && response.items) {
          console.log('Updating cart with new items:', response.items);
          
          setCart(prevCart => ({
            ...prevCart,
            items: response.items,
            total: response.total || 0,
            total_items: response.total_items || 0
          }));
          
          return Promise.resolve({ success: true });
        } else {
          console.error('Invalid response format:', response);
          toast.error('Không thể cập nhật giỏ hàng. Vui lòng thử lại sau');
          return Promise.reject(new Error('Invalid response format'));
        }
      }
    } catch (err) {
      console.error('Error adding item to cart:', err);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Không thể thêm sản phẩm vào giỏ hàng';
      
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      return Promise.reject(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, cart, updateCartItem]);

  const updateItem = useCallback(async (itemId, quantity) => {
    if (!isAuthenticated || quantity < 1) return;

    try {
      // Apply optimistic update first for immediate UI feedback
      const itemIndex = cart.items.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        // Create a copy of the current items
        const optimisticItems = [...cart.items];
        const currentItem = optimisticItems[itemIndex];
        
        // Update the item quantity in our copy
        optimisticItems[itemIndex] = {
          ...currentItem,
          quantity: quantity
        };
        
        // Immediately update the UI with optimistic data
        setCart(prevCart => ({
          ...prevCart,
          items: optimisticItems,
          total: optimisticItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
          total_items: optimisticItems.reduce((sum, item) => sum + item.quantity, 0)
        }));
        
        // Then perform API call in background without blocking UI
        updateCartItem(itemId, quantity)
          .then(response => {
            // If API response is different from our optimistic update, correct the state
            if (response && response.items) {
              setCart(prevCart => ({
                ...prevCart,
                items: response.items,
                total: response.total || 0,
                total_items: response.total_items || 0
              }));
            }
          })
          .catch(err => {
            console.error('Error updating cart item:', err);
            toast.error('Không thể cập nhật sản phẩm');
            
            // Revert optimistic update on error
            setCart(prevCart => ({
              ...prevCart,
              items: cart.items, // Original items before optimistic update
              total: cart.total,
              total_items: cart.total_items
            }));
          });
      } else {
        // Item not found in local cart, force API call and wait for response
        setLoading(true);
        const response = await updateCartItem(itemId, quantity);
        
        if (response && response.items) {
          setCart(prevCart => ({
            ...prevCart,
            items: response.items,
            total: response.total || 0,
            total_items: response.total_items || 0
          }));
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Error updating cart item:', err);
      toast.error('Không thể cập nhật sản phẩm');
    }
  }, [isAuthenticated, cart]);

  // Cập nhật kích thước của sản phẩm trong giỏ hàng
  const updateItemSize = useCallback(async (itemId, newSize) => {
    if (!isAuthenticated) return;

    try {
      // Apply optimistic update first
      const itemIndex = cart.items.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        // Create a copy of the current items
        const optimisticItems = [...cart.items];
        const currentItem = optimisticItems[itemIndex];
        
        // Update the item size in our copy
        optimisticItems[itemIndex] = {
          ...currentItem,
          size: newSize
        };
        
        // Immediately update the UI with optimistic data
        setCart(prevCart => ({
          ...prevCart,
          items: optimisticItems
        }));
        
        // Call API to update the size
        const response = await updateCartItemSize(itemId, newSize);
        
        if (response && response.items) {
          // Update cart with the response from API
          setCart(prevCart => ({
            ...prevCart,
            items: response.items,
            total: response.total || 0,
            total_items: response.total_items || 0
          }));
          
          toast.success('Đã cập nhật kích thước sản phẩm');
        }
      } else {
        toast.error('Không tìm thấy sản phẩm để cập nhật');
      }
    } catch (err) {
      console.error('Error updating item size:', err);
      toast.error('Không thể cập nhật kích thước sản phẩm');
      
      // Reload cart to reset to server state
      try {
        const cartData = await getCart();
        if (cartData && cartData.items) {
          setCart(cartData);
        }
      } catch (reloadErr) {
        console.error('Error reloading cart after update failure:', reloadErr);
      }
    }
  }, [isAuthenticated, cart]);

  const removeItem = useCallback(async (itemId) => {
    if (!isAuthenticated) return;

    try {
      // Apply optimistic update for immediate UI feedback
      const itemToRemove = cart.items.find(item => item.id === itemId);
      
      if (itemToRemove) {
        // Store original cart state for potential rollback
        const originalItems = [...cart.items];
        
        // Update UI immediately with the item removed
        const updatedItems = cart.items.filter(item => item.id !== itemId);
        setCart(prevCart => ({
          ...prevCart,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
          total_items: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        }));
        
        // Show immediate feedback
        toast.info('Đang xóa sản phẩm khỏi giỏ hàng...');
        
        // Then perform API call in background
        removeFromCart(itemId)
          .then(response => {
            // If API response is different from our optimistic update, correct it
            if (response && response.items) {
              setCart(prevCart => ({
                ...prevCart,
                items: response.items,
                total: response.total || 0,
                total_items: response.total_items || 0
              }));
            }
            
            // Show success message after API call completes
            toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
          })
          .catch(err => {
            console.error('Error removing item from cart:', err);
            toast.error('Không thể xóa sản phẩm, vui lòng thử lại');
            
            // Revert optimistic update on error
            setCart(prevCart => ({
              ...prevCart,
              items: originalItems,
              total: originalItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
              total_items: originalItems.reduce((sum, item) => sum + item.quantity, 0)
            }));
          });
      } else {
        // Item not found in local cart, show error
        toast.error('Không tìm thấy sản phẩm để xóa');
      }
    } catch (err) {
      console.error('Error removing item from cart:', err);
      toast.error('Không thể xóa sản phẩm');
    }
  }, [isAuthenticated, cart.items]);

  // Xóa những sản phẩm đã chọn khỏi giỏ hàng (sau khi thanh toán)
  const removeSelectedItems = useCallback(async (itemIds, silent = false) => {
    if (!isAuthenticated || !itemIds || itemIds.length === 0) return;

    try {
      // Chuyển đổi tất cả IDs sang chuỗi để so sánh nhất quán
      const stringItemIds = itemIds.map(id => String(id));
      
      // Lưu lại danh sách các sản phẩm trước khi xóa để có thể khôi phục nếu có lỗi
      const originalItems = [...cart.items];
      
      // Tách riêng các sản phẩm cần xóa và các sản phẩm cần giữ lại
      const itemsToRemove = cart.items.filter(item => stringItemIds.includes(String(item.id)));
      const itemsToKeep = cart.items.filter(item => !stringItemIds.includes(String(item.id)));
      
      // Ghi log để debug
      console.log(`Removing ${itemsToRemove.length} items, keeping ${itemsToKeep.length} items`);
      
      // Đếm chính xác số lượng sản phẩm còn lại
      const newTotalItems = itemsToKeep.reduce((sum, item) => sum + item.quantity, 0);
      console.log(`New total items count: ${newTotalItems}`);
      
      // Gọi API để xóa từng sản phẩm đã chọn
      const removePromises = itemsToRemove.map(item => 
        removeFromCart(item.id).catch(error => {
          console.error(`Lỗi khi xóa sản phẩm ${item.id}:`, error);
          return null;
        })
      );
      
      // Chờ tất cả các API call hoàn thành
      await Promise.all(removePromises);
      
      // Sau khi xóa trên server, cập nhật state với thông tin chính xác
      setCart({
        items: itemsToKeep,
        total: itemsToKeep.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
        total_items: newTotalItems
      });
      
      // Lưu vào localStorage để đồng bộ
      localStorage.setItem('cart', JSON.stringify({
        items: itemsToKeep,
        total: itemsToKeep.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
        total_items: newTotalItems
      }));
      
      // Phát một event để cập nhật badge số lượng giỏ hàng
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { count: newTotalItems } 
      }));
      
      // Thông báo thành công nếu không ở chế độ im lặng
      if (!silent) {
        toast.success('Đã xóa sản phẩm đã mua khỏi giỏ hàng');
      }
      
    } catch (err) {
      console.error('Error removing selected items from cart:', err);
      
      // Chỉ hiển thị thông báo lỗi nếu không ở chế độ im lặng
      if (!silent) {
        toast.error('Không thể xóa sản phẩm đã chọn, vui lòng thử lại');
      }
      
      // Tải lại giỏ hàng để đồng bộ với server
      try {
        const cartData = await getCart();
        if (cartData && cartData.items) {
          setCart(cartData);
          
          // Cập nhật badge giỏ hàng
          const newCount = cartData.total_items || 0;
          window.dispatchEvent(new CustomEvent('cart-updated', { 
            detail: { count: newCount } 
          }));
        }
      } catch (reloadErr) {
        console.error('Error reloading cart after removal failure:', reloadErr);
      }
    }
  }, [isAuthenticated, cart, removeFromCart, getCart]);

  const clearCartItems = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      await clearCartAPI();
      
      // Reset state
      setCart({ items: [], total: 0, total_items: 0 });
      
      // Only show notification if not in silent mode
      if (!silent) {
        toast.info('Đã xóa toàn bộ giỏ hàng');
      }
      
    } catch (err) {
      console.error('Error clearing cart:', err);
      // Only show error notification if not silent
      if (!silent) {
        toast.error('Không thể xóa giỏ hàng');
      }
      
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <CartContext.Provider
      value={{
        cart: cart.items || [],
        totalAmount,
        itemCount: safeItemCount,
        loading,
        addItem,
        updateItem,
        updateItemSize,
        removeItem,
        removeSelectedItems,
        clearCart: clearCartItems,
        calculateSelectedTotal,
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