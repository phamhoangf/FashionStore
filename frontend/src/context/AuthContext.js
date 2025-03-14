import React, { createContext, useState, useEffect } from 'react';
import { login, register, logout, checkAuthStatus } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Kiểm tra xem có token trong localStorage không
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await checkAuthStatus();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Nếu token không hợp lệ, xóa khỏi localStorage
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginUser = async (credentials) => {
    try {
      const response = await login(credentials);
      console.log('Login response in context:', response);
      
      // Đảm bảo response có user trước khi cập nhật state
      if (response && response.user) {
        console.log('User info from login response:', response.user);
        setUser(response.user);
        return response;
      } else if (response && response.access_token) {
        // Nếu có access_token nhưng không có user, thử lấy thông tin user
        try {
          console.log('Getting user info after login...');
          const userData = await checkAuthStatus();
          console.log('User info from checkAuthStatus:', userData);
          setUser(userData);
          return { ...response, user: userData };
        } catch (statusError) {
          console.error('Error getting user status after login:', statusError);
          // Vẫn trả về response để không làm gián đoạn luồng đăng nhập
          return response;
        }
      } else {
        console.error('Invalid login response:', response);
        throw new Error('Đăng nhập không thành công: Phản hồi không hợp lệ');
      }
    } catch (error) {
      console.error('Login failed in context:', error);
      // Đảm bảo error là một object có thuộc tính message
      if (typeof error === 'string') {
        throw { message: error };
      } else if (error.error) {
        throw { message: error.error };
      } else if (!error.message) {
        throw { message: 'Đăng nhập không thành công. Vui lòng thử lại.' };
      } else {
        throw error;
      }
    }
  };

  const registerUser = async (userData) => {
    try {
      const response = await register(userData);
      console.log('Register response in context:', response);
      if (response && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Register failed in context:', error);
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed in context:', error);
      setUser(null);
    }
  };

  const isAdmin = () => {
    return user && user.is_admin === true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: loginUser,
        register: registerUser,
        logout: logoutUser,
        isAuthenticated: !!user,
        isAdmin: isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};