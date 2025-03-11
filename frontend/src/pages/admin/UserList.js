import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import './UserList.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Memoize fetchUsers to prevent unnecessary re-creation
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/admin/users?page=${currentPage}&limit=10`;
      
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      
      const response = await api.get(url);
      setUsers(response.items || []);
      setTotalPages(response.pages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  // Use useEffect with memoized fetchUsers
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
  }, []);

  const handleAdminToggle = useCallback(async (userId, isAdmin) => {
    try {
      await api.put(`/admin/users/${userId}/admin-status`, { is_admin: isAdmin });
      // Cập nhật lại danh sách người dùng
      fetchUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Không thể cập nhật trạng thái quản trị viên');
    }
  }, [fetchUsers]);

  const handleViewDetails = useCallback((user) => {
    console.log('Viewing user details:', user);
    setSelectedUser({...user}); // Create a copy of the user object
    setShowModal(true);
    
    // Add body class to prevent scrolling
    document.body.classList.add('modal-open');
  }, []);
  
  // Function to close the modal
  const closeModal = useCallback(() => {
    setShowModal(false);
    
    // Remove body class after animation completes
    setTimeout(() => {
      setSelectedUser(null);
      document.body.classList.remove('modal-open');
    }, 300);
  }, []);

  // Memoize pagination rendering to prevent re-renders
  const renderPagination = useMemo(() => {
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
  }, [currentPage, totalPages]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }, []);

  // Memoize the user table to prevent unnecessary re-renders
  const userTable = useMemo(() => {
    if (loading) {
      return <div className="text-center py-4"><div className="spinner-border" role="status"></div></div>;
    }

    if (error) {
      return <div className="alert alert-danger">{error}</div>;
    }

    if (users.length === 0) {
      return <div className="alert alert-info">Không tìm thấy người dùng nào</div>;
    }

    return (
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Ngày đăng ký</th>
              <th>Quản trị viên</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={user.is_admin}
                      onChange={() => handleAdminToggle(user.id, !user.is_admin)}
                      id={`admin-toggle-${user.id}`}
                    />
                    <label className="form-check-label" htmlFor={`admin-toggle-${user.id}`}>
                      {user.is_admin ? 'Có' : 'Không'}
                    </label>
                  </div>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-info me-2"
                    onClick={() => handleViewDetails(user)}
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [users, loading, error, formatDate, handleAdminToggle, handleViewDetails]);

  // Memoize the user modal to prevent unnecessary re-renders
  const userModal = useMemo(() => {
    if (!selectedUser) return null;
    
    return (
      <>
        <div className={`modal-backdrop fade ${showModal ? 'show' : ''}`} onClick={closeModal}></div>
        <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" aria-labelledby="userModalLabel" aria-hidden={!showModal}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="userModalLabel">Chi tiết người dùng</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <p><strong>ID:</strong> {selectedUser.id}</p>
                <p><strong>Tên:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Ngày đăng ký:</strong> {formatDate(selectedUser.created_at)}</p>
                <p><strong>Quản trị viên:</strong> {selectedUser.is_admin ? 'Có' : 'Không'}</p>
                {selectedUser.address && <p><strong>Địa chỉ:</strong> {selectedUser.address}</p>}
                {selectedUser.phone && <p><strong>Số điện thoại:</strong> {selectedUser.phone}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }, [selectedUser, showModal, closeModal, formatDate]);

  return (
    <div className="container mt-4">
      <h2>Quản lý người dùng</h2>
      
      <form onSubmit={handleSearch} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Tìm kiếm</button>
        </div>
      </form>
      
      {userTable}
      {totalPages > 1 && <div className="d-flex justify-content-center mt-3">{renderPagination}</div>}
      {userModal}
    </div>
  );
};

export default React.memo(UserList); 