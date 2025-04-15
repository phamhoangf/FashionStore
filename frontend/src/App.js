import React, { useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import chatbot components
import ChatbotButton from './components/chatbot/ChatbotButton';
import ChatbotModal from './components/chatbot/ChatbotModal';
import ScrollToTop from './components/common/ScrollToTop';

// Lazy load components
const Layout = React.lazy(() => import('./components/layout/Layout'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage'));
const SearchResultsPage = React.lazy(() => import('./pages/SearchResultsPage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));
const PaymentResultPage = React.lazy(() => import('./pages/PaymentResultPage'));
const OrderSuccessPage = React.lazy(() => import('./pages/OrderSuccessPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = React.lazy(() => import('./pages/OrderDetailPage'));
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const UserList = React.lazy(() => import('./pages/admin/UserList'));
const ProductList = React.lazy(() => import('./pages/admin/ProductList'));
const ProductForm = React.lazy(() => import('./pages/admin/ProductForm'));
const CategoryList = React.lazy(() => import('./pages/admin/CategoryList'));
const OrderList = React.lazy(() => import('./pages/admin/OrderList'));
const OrderDetail = React.lazy(() => import('./pages/admin/OrderDetail'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Memoized loading component
const LoadingSpinner = React.memo(() => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
));

const App = () => {
  // State for chatbot modal
  const [showChatbot, setShowChatbot] = useState(false);
  
  // Memoize the routes configuration
  const routes = useMemo(() => (
    <Routes>
      {/* Client Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="search" element={<SearchResultsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        {/* Payment routes - specific routes should come before dynamic routes */}
        <Route path="payment/success" element={<PaymentResultPage />} />
        <Route path="payment/error" element={<PaymentResultPage />} />
        <Route path="payment/:id" element={<PaymentPage />} />
        <Route path="order-success/:id" element={<OrderSuccessPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        {/* Fallback route - use NotFoundPage instead of redirect */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserList />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/add" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        {/* Add NotFoundPage for admin routes as well */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  ), []);

  const handleOpenChatbot = () => {
    setShowChatbot(true);
  };

  const handleCloseChatbot = () => {
    setShowChatbot(false);
  };

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <React.Suspense fallback={<LoadingSpinner />}>
            <ScrollToTop />
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
            
            {/* Chatbot components */}
            {!showChatbot && <ChatbotButton onClick={handleOpenChatbot} />}
            <ChatbotModal show={showChatbot} onHide={handleCloseChatbot} />
          </React.Suspense>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default React.memo(App);