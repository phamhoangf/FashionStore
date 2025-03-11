import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../services/productService';
import ProductList from '../components/product/ProductList';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        limit: 12
      };
      
      const data = await getProducts(params);
      setProducts(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    
    // Update URL params
    const newSearchParams = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        newSearchParams[key] = value;
      }
    }
    setSearchParams(newSearchParams);
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: name === 'page' ? value : 1
    }));
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="container py-5">
      <h1 className="mb-4">Sản phẩm</h1>
      
      <div className="row">
        <div className="col-md-3">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Tìm kiếm</h5>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <h5 className="card-title">Danh mục</h5>
              <div className="mb-3">
                <select
                  className="form-select"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <h5 className="card-title">Sắp xếp</h5>
              <div className="mb-3">
                <select
                  className="form-select"
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="name_asc">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-9">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border"></div>
            </div>
          ) : (
            <>
              <ProductList products={products} />
              
              {totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handleFilterChange('page', filters.page - 1)}
                      >
                        Trước
                      </button>
                    </li>
                    
                    {[...Array(totalPages).keys()].map(page => (
                      <li
                        key={page + 1}
                        className={`page-item ${filters.page === page + 1 ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handleFilterChange('page', page + 1)}
                        >
                          {page + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${filters.page === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handleFilterChange('page', filters.page + 1)}
                      >
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;