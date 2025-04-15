import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { getCurrentUser, updateUserProfile, changePassword } from '../services/userService';

const ProfilePage = () => {
  const { user, setUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  useEffect(() => {
    // Nếu đã có thông tin user trong context, sử dụng luôn
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
    
    // Vẫn gọi API để lấy thông tin mới nhất
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(''); // Xóa lỗi cũ nếu có
        
        const userData = await getCurrentUser();
        
        if (userData) {
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || ''
          });
          
          // Cập nhật thông tin user trong context
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Chỉ hiển thị lỗi nếu không có dữ liệu người dùng từ context
        if (!user) {
          setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, setUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setError('');
    setSuccess('');
  };

  const toggleChangePasswordMode = () => {
    setChangePasswordMode(!changePasswordMode);
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const updatedUser = await updateUserProfile(formData);
      
      if (updatedUser) {
        setUser(updatedUser);
        setSuccess('Thông tin cá nhân đã được cập nhật thành công!');
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Hiển thị thông báo lỗi cụ thể nếu có
      if (error.message) {
        setError(error.message);
      } else {
        setError('Không thể cập nhật thông tin. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    // Kiểm tra độ dài mật khẩu
    if (passwordData.new_password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setSuccess('Mật khẩu đã được thay đổi thành công!');
      setChangePasswordMode(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      // Hiển thị thông báo lỗi cụ thể từ server nếu có
      if (error.response && error.response.status === 400) {
        setError('Mật khẩu hiện tại không chính xác.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Không thể thay đổi mật khẩu. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Vui lòng đăng nhập để xem thông tin cá nhân
        </Alert>
      </Container>
    );
  }

  if (loading && !editMode && !changePasswordMode) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thông tin...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Thông tin cá nhân</h1>
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Row>
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Thông tin cơ bản</h5>
                <Button 
                  variant={editMode ? "secondary" : "primary"} 
                  onClick={toggleEditMode}
                  disabled={changePasswordMode}
                >
                  {editMode ? "Hủy" : "Chỉnh sửa"}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {editMode ? (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Họ tên</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled
                    />
                    <Form.Text className="text-muted">
                      Email không thể thay đổi
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Số điện thoại</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Địa chỉ</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
                    <Button variant="secondary" className="me-2" onClick={toggleEditMode}>
                      Hủy
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                          <span className="ms-2">Đang lưu...</span>
                        </>
                      ) : (
                        "Lưu thay đổi"
                      )}
                    </Button>
                  </div>
                </Form>
              ) : (
                <div>
                  <p><strong>Họ tên:</strong> {formData.name}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Số điện thoại:</strong> {formData.phone || 'Chưa cập nhật'}</p>
                  <p><strong>Địa chỉ:</strong> {formData.address || 'Chưa cập nhật'}</p>
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Bảo mật</h5>
                <Button 
                  variant={changePasswordMode ? "secondary" : "primary"} 
                  onClick={toggleChangePasswordMode}
                  disabled={editMode}
                >
                  {changePasswordMode ? "Hủy" : "Đổi mật khẩu"}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {changePasswordMode ? (
                <Form onSubmit={handlePasswordSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu hiện tại</Form.Label>
                    <Form.Control
                      type="password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu mới</Form.Label>
                    <Form.Control
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                    />
                    <Form.Text className="text-muted">
                      Mật khẩu phải có ít nhất 6 ký tự
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
                    <Button variant="secondary" className="me-2" onClick={toggleChangePasswordMode}>
                      Hủy
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                          <span className="ms-2">Đang lưu...</span>
                        </>
                      ) : (
                        "Đổi mật khẩu"
                      )}
                    </Button>
                  </div>
                </Form>
              ) : (
                <p>Bạn có thể thay đổi mật khẩu để bảo vệ tài khoản.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Liên kết nhanh</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" href="/orders">
                  Lịch sử đơn hàng
                </Button>
                <Button variant="outline-primary" href="/cart">
                  Giỏ hàng của tôi
                </Button>
                <Button variant="outline-primary" href="/products">
                  Tiếp tục mua sắm
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage; 