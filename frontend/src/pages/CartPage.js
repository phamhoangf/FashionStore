import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import CartItem from '../components/cart/CartItem';

const CartPage = () => {
  const { cart, loading } = useContext(CartContext);

  if (loading) {
    return <div className="text-center p-5"><div className="spinner-border"></div></div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h1 className="mb-4">Giỏ hàng</h1>
        <div className="card p-5">
          <p>Giỏ hàng của bạn đang trống.</p>
          <Link to="/products" className="btn btn-primary">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="mb-4">Giỏ hàng</h1>
      
      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-body">
              {cart.items.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-4">Tổng giỏ hàng</h5>
              
              <div className="d-flex justify-content-between mb-3">
                <span>Tạm tính:</span>
                <span>{cart.total.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              
              <div className="d-flex justify-content-between mb-3">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-4">
                <strong>Tổng cộng:</strong>
                <strong>{cart.total.toLocaleString('vi-VN')} VNĐ</strong>
              </div>
              
              <Link to="/checkout" className="btn btn-primary w-100">
                Tiến hành thanh toán
              </Link>
              
              <Link to="/products" className="btn btn-outline-secondary w-100 mt-3">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;