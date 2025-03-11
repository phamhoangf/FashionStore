import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: '',
    parent_id: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/categories');
      setCategories(response || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Không thể tải danh mục sản phẩm');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        await api.put(`/admin/categories/${formData.id}`, {
          name: formData.name,
          description: formData.description,
          parent_id: formData.parent_id || null
        });
      } else {
        await api.post('/admin/categories', {
          name: formData.name,
          description: formData.description,
          parent_id: formData.parent_id || null
        });
      }
      
      // Reset form và tải lại danh sách
      resetForm();
      fetchCategories();
      
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Có lỗi xảy ra khi lưu danh mục');
    }
  };

  const handleEdit = (category) => {
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || ''
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        await api.delete(`/admin/categories/${id}`);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        setError('Không thể xóa danh mục. Có thể danh mục này đang chứa sản phẩm hoặc danh mục con.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      description: '',
      parent_id: ''
    });
    setIsEditing(false);
    setShowForm(false);
  };

  const renderCategoryTree = (categories, parentId = null, level = 0) => {
    const filteredCategories = categories.filter(cat => cat.parent_id === parentId);
    
    if (filteredCategories.length === 0) {
      return null;
    }
    
    return filteredCategories.map(category => (
      <React.Fragment key={category.id}>
        <tr>
          <td>{category.id}</td>
          <td>
            <span style={{ marginLeft: `${level * 20}px` }}>
              {level > 0 && <i className="bi bi-arrow-return-right me-2"></i>}
              {category.name}
            </span>
          </td>
          <td>{category.description}</td>
          <td>
            <div className="btn-group" role="group">
              <button
                className="btn btn-sm btn-primary me-1"
                onClick={() => handleEdit(category)}
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(category.id)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
        {renderCategoryTree(categories, category.id, level + 1)}
      </React.Fragment>
    ));
  };

  if (loading && categories.length === 0) {
    return <div className="text-center p-5"><div className="spinner-border"></div></div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Quản lý danh mục</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? (
            <><i className="bi bi-x-circle me-2"></i>Đóng</>
          ) : (
            <><i className="bi bi-plus-circle me-2"></i>Thêm danh mục mới</>
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>{isEditing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">Tên danh mục *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="parent_id" className="form-label">Danh mục cha</label>
                  <select
                    className="form-select"
                    id="parent_id"
                    name="parent_id"
                    value={formData.parent_id}
                    onChange={handleChange}
                  >
                    <option value="">Không có</option>
                    {categories.map(category => (
                      // Không hiển thị danh mục đang chỉnh sửa trong danh sách danh mục cha
                      category.id !== formData.id && (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      )
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Mô tả</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <i className="bi bi-list-nested me-1"></i>
          Danh sách danh mục
        </div>
        <div className="card-body">
          {categories.length === 0 ? (
            <p className="text-center">Chưa có danh mục nào</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên danh mục</th>
                    <th>Mô tả</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {renderCategoryTree(categories)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryList; 