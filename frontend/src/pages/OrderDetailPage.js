import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { formatImageUrl } from '../utils/imageUtils';
import { getOrderDetails, cancelOrder } from '../services/orderService';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user) {
        console.log('No authenticated user, showing unauthorized state');
        setLoading(false);
        setUnauthorized(true);
        return;
      }

      try {
        setLoading(true);
        setError(''); // Reset error state
        
        console.log(`Fetching order details for ID: ${id}, current user ID: ${user.id}`);
        const response = await getOrderDetails(id);
        
        // Kiểm tra response từ API
        if (response) {
          console.log('Order details received:', response);
          setOrder(response);
          setUnauthorized(false); // Đảm bảo unauthorized được thiết lập là false
        } else {
          console.error('Empty response from API');
          setError('Không tìm thấy thông tin đơn hàng');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        
        // Kiểm tra lỗi 403 - Không có quyền truy cập
        if (error.response && error.response.status === 403) {
          console.warn('User is unauthorized to view this order (403)');
          setUnauthorized(true);
        } else {
          // Lấy thông báo lỗi từ response hoặc sử dụng thông báo mặc định
          const errorMessage = 
            error.response?.data?.error || 
            error.message || 
            'Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.';
          
          console.error('Setting error message:', errorMessage);
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, user]);

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

  // Mở modal xác nhận hủy đơn hàng
  const openCancelModal = () => {
    setShowCancelModal(true);
  };

  // Đóng modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
  };

  // Hàm hủy đơn hàng
  const handleCancelOrder = async () => {
    try {
      setLoading(true);
      const response = await cancelOrder(id);
      
      if (response) {
        setOrder(response);
        setShowCancelModal(false);
        alert('Đơn hàng đã được hủy thành công');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Không thể hủy đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || unauthorized) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          {!user 
            ? 'Vui lòng đăng nhập để xem chi tiết đơn hàng' 
            : 'Bạn không có quyền xem đơn hàng này'}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng của bạn
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thông tin đơn hàng...</p>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || 'Không tìm thấy thông tin đơn hàng'}
        </Alert>
        <Button variant="primary" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Chi tiết đơn hàng #{order.id}</h1>
          <Button variant="outline-primary" onClick={() => navigate('/orders')}>
            Quay lại danh sách
          </Button>
        </div>

        <Row>
          <Col lg={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Thông tin đơn hàng</h5>
                  <Badge bg={getStatusBadgeVariant(order.status)} className="fs-6">
                    {getStatusText(order.status)}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <p className="mb-1"><strong>Mã đơn hàng:</strong> #{order.id}</p>
                    <p className="mb-1"><strong>Ngày đặt:</strong> {formatDate(order.created_at)}</p>
                    <p className="mb-1">
                      <strong>Phương thức thanh toán:</strong> {' '}
                      {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 
                      order.payment_method === 'vnpay' ? 'VNPay' : 
                      order.payment_method}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-1"><strong>Tổng tiền hàng:</strong> {formatCurrency(order.subtotal || 0)}</p>
                    <p className="mb-1"><strong>Phí vận chuyển:</strong> {formatCurrency(order.shipping_fee || 0)}</p>
                    <p className="mb-1"><strong>Tổng thanh toán:</strong> {formatCurrency(order.total_amount || 0)}</p>
                  </Col>
                </Row>

                {order.status === 'pending' && (
                  <div className="mt-3">
                    <Button variant="danger" onClick={openCancelModal}>
                      Hủy đơn hàng
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Sản phẩm đã đặt</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}></th>
                        <th>Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items && order.items.map(item => (
                        <tr key={item.id}>
                          <td>
                            <img 
                              src={formatImageUrl(item.product?.image_url)} 
                              alt={item.product?.name} 
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                          </td>
                          <td>
                            <Link to={`/products/${item.product_id}`} className="text-decoration-none">
                              {item.product?.name || `Sản phẩm #${item.product_id}`}
                            </Link>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Thông tin giao hàng</h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-1"><strong>Người nhận:</strong> {order.shipping_name}</p>
                <p className="mb-1"><strong>Số điện thoại:</strong> {order.shipping_phone}</p>
                <p className="mb-1"><strong>Địa chỉ:</strong> {order.shipping_address}</p>
                <p className="mb-1"><strong>Ghi chú:</strong> {order.notes || 'Không có'}</p>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Lịch sử đơn hàng</h5>
              </Card.Header>
              <Card.Body>
                {order.status_history && order.status_history.length > 0 ? (
                  <ul className="list-unstyled">
                    {order.status_history.map((history, index) => (
                      <li key={index} className="mb-3">
                        <div className="d-flex">
                          <div className="me-3">
                            <Badge bg={getStatusBadgeVariant(history.status)}>
                              {getStatusText(history.status)}
                            </Badge>
                          </div>
                          <div>
                            <p className="mb-0">{formatDate(history.timestamp)}</p>
                            <p className="text-muted mb-0">{history.note || ''}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Chưa có lịch sử trạng thái</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal xác nhận hủy đơn hàng */}
      <Modal show={showCancelModal} onHide={closeCancelModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận hủy đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeCancelModal}>
            Không, tôi đã nghĩ lại
          </Button>
          <Button variant="danger" onClick={handleCancelOrder}>
            Có, hủy đơn hàng
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrderDetailPage; 