import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import Checkout from '../components/cart/Checkout';
import api from '../services/api';

const CheckoutPage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { cart, loading } = useContext(CartContext);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-center p-5"><div className="spinner-border"></div></div>;
  }

  if (cart.items.length === 0 && !orderSuccess) {
    navigate('/cart');
    return null;
  }

  const handleCheckout = async (shippingInfo) => {
    try {
      const response = await api.post('/orders', {
        shipping_address: `${shippingInfo.address}, ${shippingInfo.ward}, ${shippingInfo.district}`,
        shipping_city: shippingInfo.city,
        shipping_phone: shippingInfo.phone,
        payment_method: shippingInfo.paymentMethod,
        notes: shippingInfo.notes || '',
        email: shippingInfo.email || (user ? user.email : '')
      });

      setOrderSuccess(true);
      setOrderId(response.id);
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.message || 'Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    }
  };

  if (orderSuccess) {
    return (
      <div className="container py-5">
        <div className="card p-5 text-center">
          <div className="mb-4">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
          </div>
          <h1 className="mb-4">Đặt hàng thành công!</h1>
          <p className="mb-3">Mã đơn hàng của bạn là: <strong>{orderId}</strong></p>
          <p className="mb-4">Cảm ơn bạn đã mua hàng tại cửa hàng của chúng tôi.</p>
          <div className="d-flex justify-content-center gap-3">
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </button>
            <button className="btn btn-outline-primary" onClick={() => navigate('/orders')}>
              Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="mb-4">Thanh toán</h1>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      <Checkout onSubmit={handleCheckout} />
    </div>
  );
};

export default CheckoutPage;