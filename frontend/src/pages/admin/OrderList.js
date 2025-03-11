import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao hàng' },
    { value: 'delivered', label: 'Đã giao hàng' },
    { value: 'cancelled', label: 'Đã hủy' }
  ];

  useEffect(() => {
    fetchOrders();
  }, [currentPage, selectedStatus, dateRange]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `/admin/orders?page=${currentPage}&limit=10`;
      
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }
      
      if (dateRange.startDate) {
        url += `&start_date=${dateRange.startDate}`;
      }
      
      if (dateRange.endDate) {
        url += `&end_date=${dateRange.endDate}`;
      }
      
      const response = await api.get(url);
      setOrders(response.items || []);
      setTotalPages(response.pages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Không thể tải danh sách đơn hàng');
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi bộ lọc
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset về trang 1 khi thay đổi bộ lọc
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (window.confirm(`Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng thành "${statusOptions.find(s => s.value === newStatus)?.label}"?`)) {
      try {
        await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
        // Cập nhật lại danh sách đơn hàng
        fetchOrders();
      } catch (error) {
        console.error('Error updating order status:', error);
        alert('Không thể cập nhật trạng thái đơn hàng');
      }
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => setCurrentPage(i)}>
            {i}
          </button>
        </li>
      );
    }
    return (
      <nav>
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
          </li>
          {pages}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning';
      case 'confirmed':
        return 'bg-info';
      case 'shipping':
        return 'bg-primary';
      case 'delivered':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const getStatusText = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.label : 'Không xác định';
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

  if (loading && orders.length === 0) {
    return <div className="text-center p-5"><div className="spinner-border"></div></div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Quản lý đơn hàng</h1>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="status" className="form-label">Trạng thái</label>
              <select
                className="form-select"
                id="status"
                value={selectedStatus}
                onChange={handleStatusChange}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="startDate" className="form-label">Từ ngày</label>
              <input
                type="date"
                className="form-control"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="endDate" className="form-label">Đến ngày</label>
              <input
                type="date"
                className="form-control"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSelectedStatus('');
                  setDateRange({ startDate: '', endDate: '' });
                  setCurrentPage(1);
                }}
              >
                Đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <i className="bi bi-cart-check me-1"></i>
          Danh sách đơn hàng
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>
                        <div>{order.customer_name}</div>
                        <small className="text-muted">{order.customer_phone}</small>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>{formatCurrency(order.total_amount)}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="btn btn-sm btn-info"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-secondary dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              disabled={order.status === 'delivered' || order.status === 'cancelled'}
                            >
                              Cập nhật
                            </button>
                            <ul className="dropdown-menu">
                              {order.status === 'pending' && (
                                <>
                                  <li>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                                    >
                                      Xác nhận đơn hàng
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item text-danger"
                                      onClick={() => handleStatusUpdate(order.id, 'cancelled')}
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
                                    onClick={() => handleStatusUpdate(order.id, 'shipping')}
                                  >
                                    Chuyển sang đang giao hàng
                                  </button>
                                </li>
                              )}
                              
                              {order.status === 'shipping' && (
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                  >
                                    Xác nhận đã giao hàng
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      Không có đơn hàng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              {renderPagination()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList; 