import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock: '',
    category_id: '',
    featured: false,
    image: null
  });
  
  const [preview, setPreview] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/admin/categories');
        setCategories(response || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Không thể tải danh mục sản phẩm');
      }
    };
    
    fetchCategories();
    
    if (isEditMode) {
      fetchProductDetails();
    }
  }, [id, isEditMode]);
  
  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching product details for ID:', id);
      const product = await api.get(`/admin/products/${id}`);
      console.log('Product details received:', product);
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        discount_price: product.discount_price || '',
        stock: product.stock || '',
        category_id: product.category_id || '',
        featured: product.featured || false,
        image: null
      });
      
      // Nếu sản phẩm có ảnh, hiển thị preview
      if (product.image_url) {
        // Đảm bảo URL đầy đủ
        const imageUrl = product.image_url.startsWith('http') 
          ? product.image_url 
          : `http://localhost:5000/api/${product.image_url}`;
        console.log('Setting preview image URL:', imageUrl);
        setPreview(imageUrl);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Không thể tải thông tin sản phẩm: ' + (error.message || 'Lỗi không xác định'));
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      
      // Tạo preview cho ảnh
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview('');
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const data = new FormData();
      
      // Thêm các trường dữ liệu vào FormData
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key]) {
          data.append('image', formData[key]);
        } else if (key !== 'image') {
          data.append(key, formData[key]);
        }
      });
      
      console.log('Submitting form data:', Object.fromEntries(data.entries()));
      
      let response;
      
      if (isEditMode) {
        response = await api.put(`/admin/products/${id}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await api.post('/admin/products', data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setSuccess(isEditMode ? 'Sản phẩm đã được cập nhật thành công!' : 'Sản phẩm đã được tạo thành công!');
      
      // Nếu là tạo mới, reset form
      if (!isEditMode) {
        setFormData({
          name: '',
          description: '',
          price: '',
          discount_price: '',
          stock: '',
          category_id: '',
          featured: false,
          image: null
        });
        setPreview('');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error submitting product:', error);
      setError(error.message || 'Có lỗi xảy ra khi lưu sản phẩm');
      setLoading(false);
    }
  };
  
  if (loading && isEditMode) {
    return <div className="text-center p-5"><div className="spinner-border"></div></div>;
  }
  
  return (
    <div className="container-fluid py-4">
      <div className="card">
        <div className="card-header">
          <h2>{isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-8">
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Tên sản phẩm *</label>
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
                
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Mô tả</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="5"
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="price" className="form-label">Giá (VNĐ) *</label>
                    <input
                      type="number"
                      className="form-control"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="discount_price" className="form-label">Giá khuyến mãi (VNĐ)</label>
                    <input
                      type="number"
                      className="form-control"
                      id="discount_price"
                      name="discount_price"
                      value={formData.discount_price}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="stock" className="form-label">Số lượng tồn kho *</label>
                    <input
                      type="number"
                      className="form-control"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="category_id" className="form-label">Danh mục *</label>
                    <select
                      className="form-select"
                      id="category_id"
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="featured">
                    Sản phẩm nổi bật
                  </label>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">Hình ảnh sản phẩm</label>
                  <input
                    type="file"
                    className="form-control"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                  />
                  <div className="form-text">
                    {isEditMode ? 'Để trống nếu không muốn thay đổi ảnh' : ''}
                  </div>
                </div>
                
                {preview && (
                  <div className="mt-3 text-center">
                    <p>Xem trước:</p>
                    <img
                      src={preview}
                      alt="Preview"
                      className="img-thumbnail"
                      style={{ maxHeight: '200px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/admin/products')}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Đang lưu...
                  </>
                ) : (
                  isEditMode ? 'Cập nhật' : 'Thêm mới'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm; 