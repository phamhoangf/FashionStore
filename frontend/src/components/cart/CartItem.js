import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { formatImageUrl } from '../../utils/imageUtils';

const CartItem = ({ item }) => {
  const { updateItem, removeItem } = useContext(CartContext);

  const handleQuantityChange = async (e) => {
    const quantity = parseInt(e.target.value);
    if (quantity > 0 && quantity <= 10) {
      await updateItem(item.id, quantity);
    }
  };

  const handleRemove = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      await removeItem(item.id);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-2 col-4">
            <img 
              src={formatImageUrl(item.product.image_url, 'https://via.placeholder.com/100x100')} 
              alt={item.product.name}
              className="img-fluid rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/100x100';
              }}
            />
          </div>
          <div className="col-md-4 col-8">
            <h5 className="card-title mb-1">
              <Link to={`/products/${item.product.id}`} className="text-decoration-none">
                {item.product.name}
              </Link>
            </h5>
            {item.size && <p className="text-muted mb-0">Kích thước: {item.size}</p>}
          </div>
          <div className="col-md-2 col-4 mt-3 mt-md-0">
            <div className="input-group input-group-sm">
              <input
                type="number"
                className="form-control text-center"
                value={item.quantity}
                onChange={handleQuantityChange}
                min="1"
                max="10"
              />
            </div>
          </div>
          <div className="col-md-2 col-4 mt-3 mt-md-0 text-end text-md-center">
            <span>{item.product.price.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          <div className="col-md-2 col-4 mt-3 mt-md-0 text-end">
            <button className="btn btn-sm btn-outline-danger" onClick={handleRemove}>
              <i className="bi bi-trash"></i> Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;