import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import api from '../../services/api';
import { formatImageUrl } from '../../utils/imageUtils';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  
  const statusOptions = [
    { value: 'pending', label: 'Chờ xác nhận', class: 'bg-warning' },
    { value: 'confirmed', label: 'Đã xác nhận', class: 'bg-info' },
    { value: 'shipping', label: 'Đang giao hàng', class: 'bg-primary' },
    { value: 'delivered', label: 'Đã giao hàng', class: 'bg-success' },
    { value: 'cancelled', label: 'Đã hủy', class: 'bg-danger' }
  ];
  
  useEffect(() => {
    fetchOrderDetails();
  }, [id]);
  
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/orders/${id}`);
      setOrder(response);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Không thể tải thông tin đơn hàng');
      setLoading(false);
    }
  };
  
  // Mở modal xác nhận
  const openConfirmModal = (status) => {
    setPendingStatus(status);
    setShowModal(true);
  };
  
  // Đóng modal
  const closeModal = () => {
    setShowModal(false);
    setPendingStatus(null);
  };
  
  // Xử lý cập nhật trạng thái
  const handleStatusUpdate = async () => {
    if (!pendingStatus) return;
    
    try {
      await api.put(`/admin/orders/${id}/status`, { status: pendingStatus });
      closeModal();
      // Sau khi cập nhật thành công, tải lại thông tin đơn hàng
      await fetchOrderDetails();
    } catch (error) {
      setError(error.response?.data?.error || 'Không thể cập nhật trạng thái đơn hàng');
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  
  const getStatusBadge = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return (
      <span className={`badge ${statusObj?.class || 'bg-secondary'}`}>
        {statusObj?.label || 'Không xác định'}
      </span>
    );
  };
  
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'cod':
        return 'Thanh toán khi nhận hàng (COD)';
      case 'vnpay':
        return 'VNPay';
      default:
        return method || 'Không xác định';
    }
  };
  
  const getPaymentStatusBadge = (status) => {
    let badgeClass = 'bg-secondary';
    let statusText = 'Không xác định';
    
    switch (status) {
      case 'pending':
        badgeClass = 'bg-warning';
        statusText = 'Chờ thanh toán';
        break;
      case 'paid':
        badgeClass = 'bg-success';
        statusText = 'Đã thanh toán';
        break;
      case 'failed':
        badgeClass = 'bg-danger';
        statusText = 'Thanh toán thất bại';
        break;
    }
    
    return (
      <span className={`badge ${badgeClass}`}>
        {statusText}
      </span>
    );
  };
  
  if (loading && !order) {
    return <div className="text-center p-5"><div className="spinner-border"></div></div>;
  }
  
  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/admin/orders')}
        >
          Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning" role="alert">
          Không tìm thấy đơn hàng
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/admin/orders')}
        >
          Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }
  
  return (
    <>
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Chi tiết đơn hàng #{order.id}</h1>
          <div>
            <button
              className="btn btn-outline-secondary me-2"
              onClick={() => navigate('/admin/orders')}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Quay lại
            </button>
            
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-primary dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Cập nhật trạng thái
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {order.status === 'pending' && (
                    <>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => openConfirmModal('confirmed')}
                        >
                          Xác nhận đơn hàng
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          onClick={() => openConfirmModal('cancelled')}
                        >
                          Hủy đơn hàng
                        </button>
                      </li>
                    </>
                  )}
                  
                  {order.status === 'confirmed' && (
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => openConfirmModal('shipping')}
                      >
                        Chuyển sang đang giao hàng
                      </button>
                    </li>
                  )}
                  
                  {order.status === 'shipping' && (
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => openConfirmModal('delivered')}
                      >
                        Xác nhận đã giao hàng
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-header">
                <h5>Thông tin đơn hàng</h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Mã đơn hàng:</strong> #{order.id}</p>
                    <p className="mb-1"><strong>Ngày đặt:</strong> {formatDate(order.created_at)}</p>
                    <p className="mb-1">
                      <strong>Trạng thái:</strong> {getStatusBadge(order.status)}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Tổng tiền:</strong> {formatCurrency(order.total_amount)}</p>
                    {order.updated_at && (
                      <p className="mb-1"><strong>Cập nhật lần cuối:</strong> {formatDate(order.updated_at)}</p>
                    )}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Phương thức thanh toán:</strong> {getPaymentMethodText(order.payment_method)}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Trạng thái thanh toán:</strong> {getPaymentStatusBadge(order.payment_status)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card mb-4">
              <div className="card-header">
                <h5>Sản phẩm trong đơn hàng</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th className="text-end">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items && order.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={formatImageUrl(item.product?.image_url) || '/placeholder.png'}
                                alt={item.product?.name}
                                width="50"
                                height="50"
                                className="img-thumbnail me-2"
                              />
                              <div>
                                <div>{item.product?.name}</div>
                                <small className="text-muted">ID: {item.product_id}</small>
                              </div>
                            </div>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td className="text-end">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Tổng cộng:</strong></td>
                        <td className="text-end"><strong>{formatCurrency(order.total_amount)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-header">
                <h5>Thông tin khách hàng</h5>
              </div>
              <div className="card-body">
                <p className="mb-1"><strong>Họ tên:</strong> {order.customer_name}</p>
                <p className="mb-1"><strong>Email:</strong> {order.customer_email}</p>
                <p className="mb-1"><strong>Số điện thoại:</strong> {order.customer_phone}</p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h5>Địa chỉ giao hàng</h5>
              </div>
              <div className="card-body">
                <p className="mb-1">{order.shipping_address}</p>
                <p className="mb-1">{order.shipping_city}</p>
                {order.shipping_note && (
                  <div className="mt-3">
                    <strong>Ghi chú:</strong>
                    <p className="mb-0">{order.shipping_note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal xác nhận cập nhật trạng thái */}
      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận thay đổi trạng thái</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng thành "{pendingStatus && statusOptions.find(s => s.value === pendingStatus)?.label}"?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Hủy
          </Button>
          <Button variant={pendingStatus === 'cancelled' ? 'danger' : 'primary'} onClick={handleStatusUpdate}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrderDetail;