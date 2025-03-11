import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import './HomePage.css';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts({ featured: true, limit: 8 }),
          getCategories()
        ]);
        
        console.log('HomePage - Products data from API:', productsData);
        console.log('HomePage - Categories data from API:', categoriesData);
        
        // Đảm bảo mỗi sản phẩm có đường dẫn ảnh đúng
        const productsWithImages = productsData.items.map(product => {
          console.log('HomePage - Product image URL:', product.image_url);
          return product;
        });
        
        // Loại bỏ các danh mục trùng lặp dựa trên ID
        const uniqueCategories = removeDuplicateCategories(categoriesData);
        
        // Sắp xếp danh mục theo tên
        const sortedCategories = sortCategories(uniqueCategories);
        console.log('HomePage - Sorted unique categories:', sortedCategories);
        
        setFeaturedProducts(productsWithImages);
        setCategories(sortedCategories);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hàm loại bỏ các danh mục trùng lặp
  const removeDuplicateCategories = (categories) => {
    // Kiểm tra xem categories có phải là mảng không
    if (!Array.isArray(categories)) {
      console.error('Categories is not an array:', categories);
      return [];
    }
    
    // Sử dụng Map để lưu trữ các danh mục duy nhất dựa trên ID
    const uniqueCategoriesMap = new Map();
    
    categories.forEach(category => {
      // Kiểm tra xem category có ID không
      if (category && category.id) {
        // Chỉ thêm vào Map nếu chưa có danh mục với ID này
        if (!uniqueCategoriesMap.has(category.id)) {
          uniqueCategoriesMap.set(category.id, category);
        }
      }
    });
    
    // Chuyển đổi Map thành mảng
    return Array.from(uniqueCategoriesMap.values());
  };
  
  // Hàm sắp xếp danh mục theo tên
  const sortCategories = (categories) => {
    return [...categories].sort((a, b) => {
      if (a.name && b.name) {
        return a.name.localeCompare(b.name, 'vi-VN');
      }
      return 0;
    });
  };

  // Hàm tạo màu ngẫu nhiên cho danh mục
  const getCategoryColor = (id) => {
    const colors = [
      'primary', 'secondary', 'success', 'danger', 
      'warning', 'info', 'dark'
    ];
    
    // Sử dụng ID để chọn màu, đảm bảo cùng một ID luôn có cùng một màu
    const colorIndex = id % colors.length;
    return colors[colorIndex];
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <section className="mb-5">
        <div className="jumbotron bg-light p-5 rounded">
          <h1>Thời trang cho mọi người</h1>
          <p className="lead">Khám phá bộ sưu tập mới với nhiều mẫu mã đa dạng và phong cách</p>
          <Link to="/products" className="btn btn-primary">Mua sắm ngay</Link>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-4">Danh mục sản phẩm</h2>
        <div className="row">
          {categories.length > 0 ? (
            categories.map(category => {
              const colorClass = getCategoryColor(category.id);
              return (
                <div key={category.id} className="col-md-4 mb-4">
                  <div className={`card h-100 category-card border-${colorClass}`}>
                    <div className="card-body text-center">
                      <h5 className="card-title">{category.name}</h5>
                      <p className="text-muted small">
                        {category.description || 'Khám phá các sản phẩm trong danh mục này'}
                      </p>
                      <Link 
                        to={`/products?category=${category.id}`} 
                        className={`btn btn-outline-${colorClass}`}
                      >
                        Xem sản phẩm
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-12 text-center">
              <p>Không có danh mục sản phẩm nào.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4">Sản phẩm nổi bật</h2>
        <div className="row">
          {featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
              <div key={product.id} className="col-md-3 mb-4">
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            <div className="col-12 text-center">
              <p>Không có sản phẩm nổi bật nào.</p>
            </div>
          )}
        </div>
        <div className="text-center mt-4">
          <Link to="/products" className="btn btn-outline-primary">Xem tất cả sản phẩm</Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;