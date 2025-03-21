import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { formatImageUrl } from '../../utils/imageUtils';

const CartItem = ({ item }) => {
  const { updateItem, removeItem } = useContext(CartContext);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState('https://via.placeholder.com/100x100');

  // Debug: Log item data
  useEffect(() => {
    console.log('Cart item data:', item);
    console.log('Product data:', item?.product);
    console.log('Image URL from product:', item?.product?.image_url);
  }, [item]);

  // Xử lý URL ảnh khi component được tạo hoặc khi item thay đổi
  useEffect(() => {
    if (item && item.product && item.product.image_url) {
      // Sử dụng trực tiếp URL từ backend
      const url = formatImageUrl(item.product.image_url, 'https://via.placeholder.com/100x100');
      console.log('Formatted image URL:', url);
      setImageUrl(url);
    } else {
      setImageUrl('https://via.placeholder.com/100x100');
      console.log('Using default image for cart item');
    }
  }, [item]);

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

  // Tạo URL ảnh dự phòng
  const fallbackImageUrl = 'https://via.placeholder.com/100x100?text=No+Image';

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-2 col-4">
            <div 
              style={{ 
                width: '100%', 
                height: '100px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {!imageLoaded && !imageError && (
                <div 
                  style={{ 
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <span>Đang tải...</span>
                </div>
              )}
              <img 
                src={imageUrl}
                alt={item.product?.name || 'Sản phẩm'}
                className="img-fluid rounded"
                style={{ 
                  maxHeight: '100%', 
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: imageLoaded || imageError ? 'block' : 'none'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  console.error('Error loading cart item image:', imageUrl);
                  setImageError(true);
                  setImageLoaded(true);
                  setImageUrl(fallbackImageUrl);
                }}
              />
            </div>
          </div>
          <div className="col-md-4 col-8">
            <h5 className="card-title mb-1">
              <Link to={`/products/${item.product?.id}`} className="text-decoration-none">
                {item.product?.name || 'Sản phẩm không xác định'}
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
            <span>{(item.product?.price || 0).toLocaleString('vi-VN')} VNĐ</span>
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