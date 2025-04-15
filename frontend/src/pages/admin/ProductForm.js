import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatImageUrl } from '../../utils/imageUtils';

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
    image: null,
    originalImageUrl: ''
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
        console.log('Categories from API:', response);
        
        if (response && Array.isArray(response)) {
          // Tìm danh mục Quần và Áo
          const mainCategories = response.filter(cat => cat.name === 'Quần' || cat.name === 'Áo');
          
          // Nếu có kết quả, thêm subcategories
          if (mainCategories.length > 0) {
            mainCategories.forEach(mainCat => {
              // Thêm "nam" vào tên danh mục
              mainCat.name = `${mainCat.name} nam`;
              
              // Tìm các danh mục con
              mainCat.subcategories = response.filter(cat => cat.parent_id === mainCat.id);
            });
            
            console.log('Main categories (Quần nam, Áo nam):', mainCategories);
            
            // Tạo danh sách phẳng gồm cả danh mục chính và phụ
            const flatCategories = [...mainCategories];
            
            // Thêm các danh mục con vào danh sách
            mainCategories.forEach(mainCat => {
              if (mainCat.subcategories && mainCat.subcategories.length > 0) {
                flatCategories.push(...mainCat.subcategories);
              }
            });
            
            console.log('Flattened categories for select:', flatCategories);
            setCategories(flatCategories);
          } else {
            console.log('Main categories not found, using fallback');
            // Fallback nếu không tìm thấy danh mục chính
            const quanNam = { 
              id: 2, 
              name: 'Quần nam', 
              description: 'Quần nam các loại',
            };
            
            const aoNam = { 
              id: 3, 
              name: 'Áo nam', 
              description: 'Áo nam các loại',
            };
            
            const subcategories = [
              { id: 5, name: 'Quần short', description: 'Quần short nam', parent_id: 2 },
              { id: 6, name: 'Quần jeans', description: 'Quần jeans nam', parent_id: 2 },
              { id: 7, name: 'Quần âu', description: 'Quần âu nam', parent_id: 2 },
              { id: 8, name: 'Quần kaki', description: 'Quần kaki nam dài', parent_id: 2 },
              { id: 9, name: 'Áo thun', description: 'Áo thun nam', parent_id: 3 },
              { id: 10, name: 'Áo polo', description: 'Áo polo nam', parent_id: 3 },
              { id: 11, name: 'Áo sơ mi', description: 'Áo sơ mi nam', parent_id: 3 },
              { id: 12, name: 'Áo khoác', description: 'Áo khoác nam', parent_id: 3 },
              { id: 13, name: 'Áo len', description: 'Áo len nam', parent_id: 3 }
            ];
            
            const fallbackCategories = [quanNam, aoNam, ...subcategories];
            setCategories(fallbackCategories);
          }
        } else {
          console.error('Invalid response format from categories API:', response);
          setError('Không thể tải danh mục sản phẩm: Định dạng dữ liệu không hợp lệ');
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Không thể tải danh mục sản phẩm');
        
        // Fallback khi có lỗi
        const quanNam = { 
          id: 2, 
          name: 'Quần nam', 
          description: 'Quần nam các loại',
        };
        
        const aoNam = { 
          id: 3, 
          name: 'Áo nam', 
          description: 'Áo nam các loại',
        };
        
        const subcategories = [
          { id: 5, name: 'Quần short', description: 'Quần short nam', parent_id: 2 },
          { id: 6, name: 'Quần jeans', description: 'Quần jeans nam', parent_id: 2 },
          { id: 7, name: 'Quần âu', description: 'Quần âu nam', parent_id: 2 },
          { id: 8, name: 'Quần kaki', description: 'Quần kaki nam dài', parent_id: 2 },
          { id: 9, name: 'Áo thun', description: 'Áo thun nam', parent_id: 3 },
          { id: 10, name: 'Áo polo', description: 'Áo polo nam', parent_id: 3 },
          { id: 11, name: 'Áo sơ mi', description: 'Áo sơ mi nam', parent_id: 3 },
          { id: 12, name: 'Áo khoác', description: 'Áo khoác nam', parent_id: 3 },
          { id: 13, name: 'Áo len', description: 'Áo len nam', parent_id: 3 }
        ];
        
        const fallbackCategories = [quanNam, aoNam, ...subcategories];
        setCategories(fallbackCategories);
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
        image: null,
        originalImageUrl: product.image_url
      });
      
      // Nếu sản phẩm có ảnh, hiển thị preview
      if (product.image_url) {
        console.log('Original image URL:', product.image_url);
        
        // Hiển thị thông tin debug
        console.log('Product image details:');
        console.log('- Image URL:', product.image_url);
        console.log('- API URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000');
        
        // Sử dụng hàm formatImageUrl để đảm bảo URL đầy đủ
        const imageUrl = formatImageUrl(product.image_url);
        console.log('Formatted image URL:', imageUrl);
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
      
      if (file) {
        // Kiểm tra loại file
        const fileType = file.type;
        if (!fileType.match(/^image\/(jpeg|jpg|png|gif)$/)) {
          setError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)');
          return;
        }
        
        // Kiểm tra kích thước file (giới hạn 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError('Kích thước file không được vượt quá 5MB');
          return;
        }
        
        setFormData({ ...formData, image: file });
        setError(''); // Xóa thông báo lỗi nếu có
        
        // Tạo preview cho ảnh
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.onerror = () => {
          setError('Không thể đọc file ảnh');
        };
        reader.readAsDataURL(file);
      } else {
        // Nếu không chọn file, giữ nguyên preview hiện tại nếu đang ở chế độ chỉnh sửa
        if (!isEditMode) {
          setPreview('');
        }
        setFormData({ ...formData, image: null });
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
        if (key === 'image') {
          if (formData[key]) {
            console.log('Adding image to FormData:', formData[key].name);
            data.append('image', formData[key]);
          }
        } else if (key !== 'originalImageUrl') { // Không gửi originalImageUrl
          data.append(key, formData[key]);
        }
      });
      
      // Log FormData để debug
      console.log('FormData entries:');
      for (let pair of data.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'image' ? 'File object' : pair[1]));
      }
      
      let response;
      
      if (isEditMode) {
        console.log(`Sending PUT request to /admin/products/${id}`);
        response = await api.put(`/admin/products/${id}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Product updated successfully:', response);
        setSuccess('Sản phẩm đã được cập nhật thành công!');
        
        // Cập nhật lại thông tin sản phẩm sau khi cập nhật thành công
        fetchProductDetails();
      } else {
        console.log('Sending POST request to /admin/products');
        response = await api.post('/admin/products', data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Product created successfully:', response);
        setSuccess('Sản phẩm đã được tạo thành công!');
        
        // Nếu là tạo mới, reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          discount_price: '',
          stock: '',
          category_id: '',
          featured: false,
          image: null,
          originalImageUrl: ''
        });
        setPreview('');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error submitting product:', error);
      
      // Log chi tiết lỗi
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError(error.response.data.error || 'Có lỗi xảy ra khi lưu sản phẩm');
      } else if (error.request) {
        console.error('Error request:', error.request);
        setError('Không thể kết nối đến máy chủ');
      } else {
        console.error('Error message:', error.message);
        setError(error.message || 'Có lỗi xảy ra khi lưu sản phẩm');
      }
      
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
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '200px', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '0.25rem'
                      }}
                    >
                      <img
                        src={preview}
                        alt="Preview"
                        style={{ 
                          maxHeight: '100%', 
                          maxWidth: '100%',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          console.error('Error loading image preview:', preview);
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150';
                        }}
                      />
                    </div>
                    <div className="mt-2 text-muted small">
                      {preview.startsWith('data:') 
                        ? 'Ảnh mới đã chọn' 
                        : 'Ảnh hiện tại của sản phẩm'}
                    </div>
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