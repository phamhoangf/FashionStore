import React from 'react';
import { Link } from 'react-router-dom';
import './Categories.css';

const Categories = () => {
  const categories = [
    {
      id: 1,
      name: 'Nam',
      image: '/images/categories/men.jpg',
      description: 'Thời trang nam thanh lịch và phong cách'
    },
    {
      id: 2,
      name: 'Nữ', 
      image: '/images/categories/women.jpg',
      description: 'Thời trang nữ hiện đại và quyến rũ'
    },
    {
      id: 3,
      name: 'Trẻ em',
      image: '/images/categories/kids.jpg', 
      description: 'Thời trang cho bé năng động và dễ thương'
    },
    {
      id: 4,
      name: 'Phụ kiện',
      image: '/images/categories/accessories.jpg',
      description: 'Phụ kiện thời trang đa dạng'
    }
  ];

  return (
    <section className="categories-section py-5">
      <div className="container">
        <h2 className="text-center mb-5">DANH MỤC SẢN PHẨM</h2>
        <div className="row g-4">
          {categories.map(category => (
            <div key={category.id} className="col-md-6 col-lg-3">
              <Link 
                to={`/products?parentCategory=${category.id}&category=${category.id}&timestamp=${Date.now()}`}
                className="category-card text-decoration-none"
              >
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-img-container">
                    <img 
                      src={category.image} 
                      className="card-img-top" 
                      alt={category.name}
                    />
                  </div>
                  <div className="card-body text-center">
                    <h3 className="card-title h5 mb-2">{category.name}</h3>
                    <p className="card-text text-muted small">{category.description}</p>
                    <button className="btn btn-outline-dark mt-2">
                      Xem sản phẩm
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