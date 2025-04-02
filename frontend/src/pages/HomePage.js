import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import Categories from '../components/home/Categories';
import './HomePage.css';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch products now, no need for categories
        const productsData = await getProducts({ featured: true, limit: 8 });
        
        console.log('HomePage - Products data from API:', productsData);
        
        // Đảm bảo mỗi sản phẩm có đường dẫn ảnh đúng
        const productsWithImages = productsData.items.map(product => {
          console.log('HomePage - Product image URL:', product.image_url);
          return product;
        });
        
        setFeaturedProducts(productsWithImages);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <div className="jumbotron bg-light p-5 rounded position-relative overflow-hidden">
          <div className="position-absolute w-100 h-100 top-0 start-0">
            <img 
              src="/background.jpg" 
              alt="Ảnh nền" 
              className="w-100 h-100 object-fit-cover"
              style={{ objectPosition: 'center' }}
            />
            <div className="position-absolute w-100 h-100 top-0 start-0 bg-dark opacity-50"></div>
          </div>
          
          <div className="row position-relative z-1">
            <div className="col-md-6">
              <div className="text-white p-3 rounded">
                <h1>Thời trang cho mọi người</h1>
                <p className="lead">Khám phá bộ sưu tập mới với nhiều mẫu mã đa dạng và phong cách</p>
                <Link to="/products" className="btn btn-primary">Mua sắm ngay</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Categories />

      <section className="mt-5">
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