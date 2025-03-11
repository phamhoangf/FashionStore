import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Dashboard.css';

// Dữ liệu mẫu để sử dụng khi API gặp lỗi
const MOCK_DATA = {
  total_products: 120,
  total_categories: 8,
  total_orders: 45,
  total_users: 78,
  orders_by_status: {
    pending: 12,
    processing: 8,
    shipped: 5,
    delivered: 15,
    cancelled: 5
  },
  revenue: 15000000,
  recent_orders: [
    {
      id: 1,
      user_name: 'Nguyễn Văn A',
      created_at: '2025-03-10T08:30:00',
      status: 'pending',
      total_amount: 1250000
    },
    {
      id: 2,
      user_name: 'Trần Thị B',
      created_at: '2025-03-09T14:20:00',
      status: 'processing',
      total_amount: 850000
    },
    {
      id: 3,
      user_name: 'Lê Văn C',
      created_at: '2025-03-08T10:15:00',
      status: 'shipped',
      total_amount: 2100000
    },
    {
      id: 4,
      user_name: 'Phạm Thị D',
      created_at: '2025-03-07T16:45:00',
      status: 'delivered',
      total_amount: 1800000
    },
    {
      id: 5,
      user_name: 'Hoàng Văn E',
      created_at: '2025-03-06T09:30:00',
      status: 'cancelled',
      total_amount: 950000
    }
  ]
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    ordersByStatus: {},
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Kiểm tra token
        const token = localStorage.getItem('token');
        const adminLoggedIn = localStorage.getItem('adminLoggedIn');
        
        // Nếu không có token nhưng có adminLoggedIn, sử dụng dữ liệu mẫu
        if (!token && adminLoggedIn === 'true') {
          console.log('No token but admin is logged in, using mock data');
          setUseMockData(true);
          setStats({
            totalOrders: MOCK_DATA.total_orders,
            totalProducts: MOCK_DATA.total_products,
            totalUsers: MOCK_DATA.total_users,
            totalRevenue: MOCK_DATA.revenue,
            ordersByStatus: MOCK_DATA.orders_by_status,
            recentOrders: MOCK_DATA.recent_orders
          });
          setLoading(false);
          return;
        }
        
        // Gọi API thực tế
        console.log('Fetching dashboard data from API...');
        const response = await api.get('/admin/dashboard');
        
        if (response) {
          console.log('Dashboard data received:', response);
          setStats({
            totalOrders: response.total_orders || 0,
            totalProducts: response.total_products || 0,
            totalUsers: response.total_users || 0,
            totalRevenue: response.revenue || 0,
            ordersByStatus: response.orders_by_status || {},
            recentOrders: response.recent_orders || []
          });
          setUseMockData(false);
        } else {
          throw new Error('Không nhận được dữ liệu từ API');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Hiển thị thông báo lỗi
        setError(`Không thể tải dữ liệu từ API: ${error.error || error.message || 'Lỗi không xác định'}`);
        
        // Sử dụng dữ liệu mẫu khi gặp lỗi
        console.log('Using mock data due to API error');
        setUseMockData(true);
        setStats({
          totalOrders: MOCK_DATA.total_orders,
          totalProducts: MOCK_DATA.total_products,
          totalUsers: MOCK_DATA.total_users,
          totalRevenue: MOCK_DATA.revenue,
          ordersByStatus: MOCK_DATA.orders_by_status,
          recentOrders: MOCK_DATA.recent_orders
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Hàm định dạng số tiền VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(amount)
      .replace('₫', 'VNĐ');
  };

  // Hàm xác định class cho badge trạng thái
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning';
      case 'confirmed':
      case 'processing':
        return 'bg-info';
      case 'shipping':
      case 'shipped':
        return 'bg-primary';
      case 'delivered':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  // Hàm xác định text cho trạng thái
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
      case 'processing':
        return 'Đã xác nhận';
      case 'shipping':
      case 'shipped':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Đã giao hàng';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span>Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="mb-4">Bảng điều khiển</h1>
      
      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>Lưu ý:</strong> {error}
          <p className="mb-0 mt-2">Đang hiển thị dữ liệu mẫu.</p>
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}
      
      {useMockData && !error && (
        <div className="alert alert-info alert-dismissible fade show" role="alert">
          <strong>Lưu ý:</strong> Đang hiển thị dữ liệu mẫu do không có kết nối với API.
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-3 mb-4">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Tổng đơn hàng</h5>
              <h2 className="display-4">{stats.totalOrders}</h2>
            </div>
            <div className="card-footer d-flex align-items-center justify-content-between">
              <Link to="/admin/orders" className="text-white text-decoration-none">Xem chi tiết</Link>
              <div className="small text-white"><i className="bi bi-chevron-right"></i></div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Tổng doanh thu</h5>
              <h2 className="display-4">{(stats.totalRevenue || 0).toLocaleString('vi-VN')} VNĐ</h2>
            </div>
            <div className="card-footer d-flex align-items-center justify-content-between">
              <Link to="/admin/orders" className="text-white text-decoration-none">Xem chi tiết</Link>
              <div className="small text-white"><i className="bi bi-chevron-right"></i></div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card bg-warning text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Tổng sản phẩm</h5>
              <h2 className="display-4">{stats.totalProducts}</h2>
            </div>
            <div className="card-footer d-flex align-items-center justify-content-between">
              <Link to="/admin/products" className="text-white text-decoration-none">Xem chi tiết</Link>
              <div className="small text-white"><i className="bi bi-chevron-right"></i></div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card bg-danger text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Tổng người dùng</h5>
              <h2 className="display-4">{stats.totalUsers}</h2>
            </div>
            <div className="card-footer d-flex align-items-center justify-content-between">
              <Link to="/admin/users" className="text-white text-decoration-none">Xem chi tiết</Link>
              <div className="small text-white"><i className="bi bi-chevron-right"></i></div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="card mb-4">
            <div className="card-header">
              <i className="bi bi-table me-1"></i>
              Đơn hàng gần đây
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Mã đơn hàng</th>
                      <th>Khách hàng</th>
                      <th>Ngày đặt</th>
                      <th>Trạng thái</th>
                      <th>Tổng tiền</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders && stats.recentOrders.length > 0 ? (
                      stats.recentOrders.map(order => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{order.user_name || order.customer_name || 'Không có tên'}</td>
                          <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </td>
                          <td>{(order.total_amount || 0).toLocaleString('vi-VN')} VNĐ</td>
                          <td>
                            <Link to={`/admin/orders/${order.id}`} className="btn btn-sm btn-primary me-2">
                              <i className="bi bi-eye"></i>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">Không có đơn hàng nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer small text-muted">
              <Link to="/admin/orders" className="btn btn-outline-primary btn-sm">
                Xem tất cả đơn hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 