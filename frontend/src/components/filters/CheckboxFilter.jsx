import React from 'react';
import { Form, Card } from 'react-bootstrap';

const CheckboxFilter = ({ 
  title, 
  options, 
  selectedValues = [], 
  onChange,
  showCounts = true
}) => {
  const handleChange = (value) => {
    const isSelected = selectedValues.includes(value);
    let newValues;
    
    if (isSelected) {
      // Remove value if it's already selected
      newValues = selectedValues.filter(item => item !== value);
    } else {
      // Add value if it's not selected
      newValues = [...selectedValues, value];
    }
    
    onChange(newValues);
  };

  return (
    <Card.Body className="py-2">
      {title && <h6 className="filter-section-title">{title}</h6>}
      <div className="checkbox-list">
        {options.map((option) => (
          <div key={option.value} className="checkbox-item">
            <Form.Check
              type="checkbox"
              id={`checkbox-${option.value}`}
              label={option.label}
              checked={selectedValues.includes(option.value)}
              onChange={() => handleChange(option.value)}
              className="checkbox-filter"
            />
            {showCounts && option.count !== undefined && (
              <span className="checkbox-count">{option.count}</span>
            )}
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-muted small">Không có lựa chọn</p>
        )}
      </div>
    </Card.Body>
  );
};

export default CheckboxFilter; 