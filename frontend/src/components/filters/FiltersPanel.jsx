import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaTrash, FaFilter } from 'react-icons/fa';
import PriceRangeFilter from './PriceRangeFilter';
import CheckboxFilter from './CheckboxFilter';

const FiltersPanel = ({
  categories,
  brands,
  priceRange,
  selectedCategories,
  selectedBrands,
  selectedPriceMin,
  selectedPriceMax,
  onCategoryChange,
  onBrandChange,
  onPriceChange,
  onClearFilters,
  totalActiveFilters
}) => {
  const MIN_PRICE = 0;
  const MAX_PRICE = 10000000; // 10 million VND
  
  return (
    <Card className="filter-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <FaFilter className="me-2" />
          <span>Bộ lọc</span>
          {totalActiveFilters > 0 && (
            <span className="ms-2 badge bg-primary">{totalActiveFilters}</span>
          )}
        </div>
        
        {totalActiveFilters > 0 && (
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={onClearFilters}
            className="d-flex align-items-center"
          >
            <FaTrash size={12} className="me-1" />
            <span>Xóa lọc</span>
          </Button>
        )}
      </Card.Header>
      
      <Card.Header className="bg-white border-bottom">
        <h6 className="mb-0">Giá</h6>
      </Card.Header>
      <PriceRangeFilter
        minPrice={MIN_PRICE}
        maxPrice={MAX_PRICE}
        initialMin={selectedPriceMin}
        initialMax={selectedPriceMax}
        onPriceChange={onPriceChange}
      />
      
      <Card.Header className="bg-white border-bottom">
        <h6 className="mb-0">Danh mục</h6>
      </Card.Header>
      <CheckboxFilter
        options={categories.map(cat => ({
          value: cat.id, 
          label: cat.name,
          count: cat.productCount
        }))}
        selectedValues={selectedCategories}
        onChange={onCategoryChange}
      />
      
      <Card.Header className="bg-white border-bottom">
        <h6 className="mb-0">Thương hiệu</h6>
      </Card.Header>
      <CheckboxFilter
        options={brands.map(brand => ({
          value: brand.id,
          label: brand.name,
          count: brand.productCount
        }))}
        selectedValues={selectedBrands}
        onChange={onBrandChange}
      />
    </Card>
  );
};

export default FiltersPanel; 