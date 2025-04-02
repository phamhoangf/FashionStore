import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { formatCurrency } from '../../utils/format';

const ActiveFilters = ({
  selectedCategories = [],
  selectedBrands = [],
  selectedPriceMin,
  selectedPriceMax,
  categories = [],
  brands = [],
  onRemoveCategory,
  onRemoveBrand,
  onRemovePrice,
  onClearFilters
}) => {
  const hasActiveFilters = selectedCategories.length > 0 || 
    selectedBrands.length > 0 || 
    selectedPriceMin !== undefined || 
    selectedPriceMax !== undefined;
  
  if (!hasActiveFilters) return null;
  
  // Helper to find category name by id
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Danh mục không xác định';
  };
  
  // Helper to find brand name by id
  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.name : 'Thương hiệu không xác định';
  };
  
  return (
    <div className="mb-3">
      <div className="d-flex align-items-center mb-2">
        <h6 className="mb-0 me-2">Bộ lọc đang áp dụng:</h6>
        <button 
          className="btn btn-sm btn-link p-0 text-decoration-none" 
          onClick={onClearFilters}
        >
          Xóa tất cả
        </button>
      </div>
      
      <div>
        {/* Category Filters */}
        {selectedCategories.map(categoryId => (
          <span key={`cat-${categoryId}`} className="filter-badge bg-light text-dark">
            Danh mục: {getCategoryName(categoryId)}
            <span className="close-btn" onClick={() => onRemoveCategory(categoryId)}>
              <FaTimes />
            </span>
          </span>
        ))}
        
        {/* Brand Filters */}
        {selectedBrands.map(brandId => (
          <span key={`brand-${brandId}`} className="filter-badge bg-light text-dark">
            Thương hiệu: {getBrandName(brandId)}
            <span className="close-btn" onClick={() => onRemoveBrand(brandId)}>
              <FaTimes />
            </span>
          </span>
        ))}
        
        {/* Price Range Filter */}
        {(selectedPriceMin !== undefined || selectedPriceMax !== undefined) && (
          <span className="filter-badge bg-light text-dark">
            Giá: {selectedPriceMin !== undefined ? formatCurrency(selectedPriceMin) : '0đ'} 
            {' - '} 
            {selectedPriceMax !== undefined ? formatCurrency(selectedPriceMax) : 'Không giới hạn'}
            <span className="close-btn" onClick={onRemovePrice}>
              <FaTimes />
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters; 