import React, { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Card } from 'react-bootstrap';
import { formatCurrency } from '../../utils/format';

const PriceRangeFilter = ({ minPrice, maxPrice, initialMin, initialMax, onPriceChange }) => {
  const [range, setRange] = useState([initialMin || minPrice, initialMax || maxPrice]);

  useEffect(() => {
    // Update range when initialMin or initialMax changes from URL params
    if (initialMin !== undefined || initialMax !== undefined) {
      setRange([
        initialMin !== undefined ? initialMin : minPrice,
        initialMax !== undefined ? initialMax : maxPrice
      ]);
    }
  }, [initialMin, initialMax, minPrice, maxPrice]);

  const handleChange = (newRange) => {
    setRange(newRange);
  };

  const handleAfterChange = (newRange) => {
    onPriceChange(newRange[0], newRange[1]);
  };

  return (
    <Card.Body className="py-2">
      <div className="price-range-container">
        <div className="price-range-values">
          <span>{formatCurrency(range[0])}</span>
          <span>{formatCurrency(range[1])}</span>
        </div>
        <Slider
          range
          min={minPrice}
          max={maxPrice}
          value={range}
          onChange={handleChange}
          onAfterChange={handleAfterChange}
          step={10000}
        />
      </div>
    </Card.Body>
  );
};

export default PriceRangeFilter; 