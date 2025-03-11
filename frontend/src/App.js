import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Lazy load components
const Layout = React.lazy(() => import('./components/layout/Layout'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const UserList = React.lazy(() => import('./pages/admin/UserList'));
const ProductList = React.lazy(() => import('./pages/admin/ProductList'));
const ProductForm = React.lazy(() => import('./pages/admin/ProductForm'));
const CategoryList = React.lazy(() => import('./pages/admin/CategoryList'));
const OrderList = React.lazy(() => import('./pages/admin/OrderList'));

// Memoized loading component
const LoadingSpinner = React.memo(() => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
));

const App = () => {
  // Memoize the routes configuration
  const routes = useMemo(() => (
    <Routes>
      {/* Client Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/users" replace />} />
        <Route path="users" element={<UserList />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/add" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="orders" element={<OrderList />} />
      </Route>
    </Routes>
  ), []);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <React.Suspense fallback={<LoadingSpinner />}>
            {routes}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </React.Suspense>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default React.memo(App);