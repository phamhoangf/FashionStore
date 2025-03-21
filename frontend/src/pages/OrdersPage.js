import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUserOrders } from '../services/orderService';

const OrdersPage = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getUserOrders();
        
        if (response) {
          setOrders(response);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Hàm định dạng ngày giờ
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Hàm định dạng số tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount).replace('₫', 'VNĐ');
  };

  // Hàm lấy màu badge dựa trên trạng thái đơn hàng
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
      case 'processing':
        return 'info';
      case 'shipping':
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Hàm lấy text hiển thị cho trạng thái đơn hàng
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

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Vui lòng đăng nhập để xem lịch sử đơn hàng
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải danh sách đơn hàng...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Lịch sử đơn hàng</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {orders.length === 0 ? (
        <Alert variant="info">
          Bạn chưa có đơn hàng nào. <Link to="/products">Mua sắm ngay</Link>
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Mã đơn hàng</th>
                    <th>Ngày đặt</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thanh toán</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>{formatCurrency(order.total_amount)}</td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </td>
                      <td>
                        {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 
                         order.payment_method === 'vnpay' ? 'VNPay' : 
                         order.payment_method}
                      </td>
                      <td>
                        <Link to={`/orders/${order.id}`} className="btn btn-sm btn-outline-primary">
                          Xem chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default OrdersPage; 