import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { getCategories } from '../../services/productService';
import './Header.css';

const Header = () => {
  const { user, isAuthenticated, logout, isAdmin } = useContext(AuthContext);
  const { itemCount } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState(0);
  const prevCountRef = useRef(itemCount);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        console.log('Categories from API:', data);
        
        if (!data || data.length === 0) {
          // Sử dụng danh mục mặc định nếu API không trả về dữ liệu
          const fallbackCategories = [
            { 
              id: 2, 
              name: 'Quần nam', 
              description: 'Quần nam các loại',
              subcategories: [
                { id: 5, name: 'Quần short', description: 'Quần short nam' },
                { id: 6, name: 'Quần jeans', description: 'Quần jeans nam' },
                { id: 7, name: 'Quần âu', description: 'Quần âu nam' },
                { id: 8, name: 'Quần kaki', description: 'Quần kaki nam dài' }
              ]
            },
            { 
              id: 3, 
              name: 'Áo nam', 
              description: 'Áo nam các loại',
              subcategories: [
                { id: 9, name: 'Áo thun', description: 'Áo thun nam' },
                { id: 10, name: 'Áo polo', description: 'Áo polo nam' },
                { id: 11, name: 'Áo sơ mi', description: 'Áo sơ mi nam' },
                { id: 12, name: 'Áo khoác', description: 'Áo khoác nam' },
                { id: 13, name: 'Áo len', description: 'Áo len nam' }
              ]
            }
          ];
          setCategories(fallbackCategories);
          setLoading(false);
          return;
        }
        
        // Tìm danh mục Quần và Áo
        const mainCategories = data.filter(cat => cat.name === 'Quần' || cat.name === 'Áo');
        
        // Nếu có kết quả, thêm subcategories
        if (mainCategories.length > 0) {
          mainCategories.forEach(mainCat => {
            // Thêm "nam" vào tên danh mục
            mainCat.name = `${mainCat.name} nam`;
            
            // Tìm các danh mục con
            mainCat.subcategories = data.filter(cat => cat.parent_id === mainCat.id);
          });
          
          setCategories(mainCategories);
        } else {
          // Sử dụng danh mục mặc định nếu không tìm thấy
          const fallbackCategories = [
            { 
              id: 2, 
              name: 'Quần nam', 
              description: 'Quần nam các loại',
              subcategories: [
                { id: 5, name: 'Quần short', description: 'Quần short nam' },
                { id: 6, name: 'Quần jeans', description: 'Quần jeans nam' },
                { id: 7, name: 'Quần âu', description: 'Quần âu nam' },
                { id: 8, name: 'Quần kaki', description: 'Quần kaki nam dài' }
              ]
            },
            { 
              id: 3, 
              name: 'Áo nam', 
              description: 'Áo nam các loại',
              subcategories: [
                { id: 9, name: 'Áo thun', description: 'Áo thun nam' },
                { id: 10, name: 'Áo polo', description: 'Áo polo nam' },
                { id: 11, name: 'Áo sơ mi', description: 'Áo sơ mi nam' },
                { id: 12, name: 'Áo khoác', description: 'Áo khoác nam' },
                { id: 13, name: 'Áo len', description: 'Áo len nam' }
              ]
            }
          ];
          setCategories(fallbackCategories);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback categories
        const fallbackCategories = [
          { 
            id: 2, 
            name: 'Quần nam', 
            description: 'Quần nam các loại',
            subcategories: [
              { id: 5, name: 'Quần short', description: 'Quần short nam' },
              { id: 6, name: 'Quần jeans', description: 'Quần jeans nam' },
              { id: 7, name: 'Quần âu', description: 'Quần âu nam' },
              { id: 8, name: 'Quần kaki', description: 'Quần kaki nam dài' }
            ]
          },
          { 
            id: 3, 
            name: 'Áo nam', 
            description: 'Áo nam các loại',
            subcategories: [
              { id: 9, name: 'Áo thun', description: 'Áo thun nam' },
              { id: 10, name: 'Áo polo', description: 'Áo polo nam' },
              { id: 11, name: 'Áo sơ mi', description: 'Áo sơ mi nam' },
              { id: 12, name: 'Áo khoác', description: 'Áo khoác nam' },
              { id: 13, name: 'Áo len', description: 'Áo len nam' }
            ]
          }
        ];
        setCategories(fallbackCategories);
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Monitor changes to itemCount and update displayCount
  useEffect(() => {
    // Only update if the count has changed
    if (prevCountRef.current !== itemCount) {
      setDisplayCount(itemCount);
      prevCountRef.current = itemCount;
      console.log('Cart count updated in header:', itemCount);
    }
  }, [itemCount]);

  // Add separate effect for cart-updated event
  useEffect(() => {
    const handleCartUpdate = (e) => {
      console.log('Cart update event received in header with count:', e.detail.count);
      setDisplayCount(e.detail.count);
      prevCountRef.current = e.detail.count;
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []);

  // Force header to refresh when route changes
  useEffect(() => {
    // This ensures the cart count is refreshed when navigating between pages
    setDisplayCount(itemCount);
    console.log('Cart count refreshed after navigation:', itemCount);
  }, [location.pathname, itemCount]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm.trim());
      
      // Redirect to search results page
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      
      // Clear search input after submission
      setSearchTerm('');
    }
  };

  const navigateToCategory = (categoryId, subcategory) => {
    // Nếu subcategory là một object có id, sử dụng id
    const subcategoryParam = subcategory.id ? subcategory.id : subcategory;
    console.log('Navigating to category:', categoryId, 'subcategory:', subcategoryParam);
    
    // Thêm timestamp vào URL để đảm bảo reset tất cả các bộ lọc
    if (subcategoryParam) {
      // Nếu có subcategory, truyền cả parentCategory và subcategory
      navigate(`/products?parentCategory=${categoryId}&subcategory=${encodeURIComponent(subcategoryParam)}&category=${encodeURIComponent(subcategoryParam)}&timestamp=${Date.now()}`);
    } else {
      // Nếu chỉ có category, truyền category là parentCategory
      navigate(`/products?parentCategory=${categoryId}&category=${categoryId}&timestamp=${Date.now()}`);
    }
  };

  return (
    <header className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          {/* <img 
            src="/logo.png" 
            alt="MenStyle Logo" 
            height="75" 
            className="me-2"
          /> */}
          <span className="fw-bold text-primary fs-4">MenStyle</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link d-inline-flex align-items-center" style={{ gap: '3px' }} to="/">
                <i className="bi bi-house-door"></i>
                Trang chủ
              </Link>
            </li>
            
            {/* Main Categories as horizontal links */}
            {!loading && categories.map(category => (
              <li key={category.id} className="nav-item dropdown category-dropdown">
                <Link 
                  className="nav-link dropdown-toggle d-inline-flex align-items-center" 
                  style={{ gap: '3px' }}
                  to={`/products?parentCategory=${category.id}&category=${category.id}&timestamp=${Date.now()}`}
                  id={`navbarDropdown-${category.id}`}
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-collection"></i>
                  {category.name}
                </Link>
                {category.subcategories && category.subcategories.length > 0 && (
                  <ul className="dropdown-menu" aria-labelledby={`navbarDropdown-${category.id}`}>
                    {/* View all link */}
                    <li>
                      <Link 
                        className="dropdown-item view-all" 
                        to={`/products?parentCategory=${category.id}&category=${category.id}&timestamp=${Date.now()}`}
                      >
                        Xem tất cả {category.name}
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    {/* Subcategories */}
                    {category.subcategories.map(subcategory => (
                      <li key={subcategory.id}>
                        <button 
                          className="dropdown-item" 
                          onClick={() => navigateToCategory(category.id, subcategory)}
                        >
                          {subcategory.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          
          <form className="d-flex mx-auto" onSubmit={handleSearch}>
            <div className="input-group">
              <input 
                type="search" 
                className="form-control" 
                placeholder="Tìm kiếm sản phẩm..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search"
              />
              <button className="btn btn-outline-primary" type="submit">
                <i className="bi bi-search"></i>
              </button>
            </div>
          </form>
          
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link position-relative d-inline-flex align-items-center" style={{ gap: '3px' }} to="/cart">
                <i className="bi bi-cart3"></i>
                Giỏ hàng
                {displayCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ marginLeft: '-0.5rem', marginTop: '0.5rem' }}>

                    {displayCount}
                  </span>
                )}
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle d-inline-flex align-items-center" style={{ gap: '0px' }} href="#" role="button" data-bs-toggle="dropdown">
                    <i className="bi bi-person-circle"></i>
                    {user?.name || 'Tài khoản'}
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to="/profile" style={{ display: 'flex', alignItems: 'center', columnGap: '12px', justifyContent: 'flex-start' }}>
                        <i className="bi bi-person"></i>
                        Hồ sơ
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/orders" style={{ display: 'flex', alignItems: 'center', columnGap: '12px', justifyContent: 'flex-start' }}>
                        <i className="bi bi-bag"></i>
                        Đơn hàng
                      </Link>
                    </li>
                    {isAdmin() && (
                      <li>
                        <Link className="dropdown-item" to="/admin" style={{ display: 'flex', alignItems: 'center', columnGap: '12px', justifyContent: 'flex-start' }}>
                          <i className="bi bi-gear"></i>
                          Quản trị
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', columnGap: '12px', justifyContent: 'flex-start' }} onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right"></i>
                        Đăng xuất
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Đăng nhập
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    <i className="bi bi-person-plus me-1"></i>
                    Đăng ký
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;