import React from 'react';
import { Link } from 'react-router-dom';
import './Categories.css';

const Categories = () => {
  const categories = [
    {
      id: 1,
      name: 'Áo polo',
      image: '/images/categories/ao-polo.webp',
      description: 'Áo polo nam thanh lịch, đa dạng màu sắc',
      parentCategory: 3, // ID danh mục Áo nam
      subcategory: 10    // ID danh mục Áo polo
    },
    {
      id: 2,
      name: 'Áo thun', 
      image: '/images/categories/ao-thun.webp',
      description: 'Áo thun nam thoải mái, phong cách trẻ trung',
      parentCategory: 3, // ID danh mục Áo nam
      subcategory: 9     // ID danh mục Áo thun
    },
    {
      id: 3,
      name: 'Quần jeans',
      image: '/images/categories/quan-jeans.webp', 
      description: 'Quần jeans nam phong cách hiện đại',
      parentCategory: 2, // ID danh mục Quần nam
      subcategory: 6     // ID danh mục Quần jeans
    },
    {
      id: 4,
      name: 'Quần âu',
      image: '/images/categories/quan-au.webp',
      description: 'Quần âu nam lịch sự, phù hợp công sở',
      parentCategory: 2, // ID danh mục Quần nam
      subcategory: 7     // ID danh mục Quần âu
    }
  ];

  return (
    <section className="categories-section py-5">
      <div className="container">
        <h2 className="text-center mb-5 fw-bold position-relative">
          <span className="position-relative pb-2">
            DANH MỤC NỔI BẬT
            <span className="position-absolute start-0 bottom-0 w-100" 
              style={{ 
                height: '3px', 
                background: 'linear-gradient(to right, transparent, var(--bs-primary), transparent)', 
                borderRadius: '2px' 
              }}>
            </span>
          </span>
        </h2>
        <div className="row g-4">
          {categories.map(category => (
            <div key={category.id} className="col-md-6 col-lg-3">
              <Link 
                to={`/products?parentCategory=${category.parentCategory}&subcategory=${category.subcategory}&category=${category.subcategory}&timestamp=${Date.now()}`}
                className="category-card text-decoration-none"
              >
                <div className="card h-100 border-0 shadow-sm category-card-hover">
                  <div className="card-img-container overflow-hidden">
                    <img 
                      src={category.image} 
                      className="card-img-top category-img" 
                      alt={category.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="card-body text-center">
                    <h3 className="card-title h5 mb-2 fw-bold">{category.name}</h3>
                    <p className="card-text text-muted small">{category.description}</p>
                    <button className="btn btn-outline-primary mt-2 rounded-pill px-4">
                      <i className="bi bi-arrow-right-circle me-2"></i>
                      Xem ngay
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories; 