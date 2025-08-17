// frontend/src/components/admin/student/StudentQuickActions.jsx
// Action buttons for student cards

import React, { useState } from 'react';

export default function StudentQuickActions({ 
  student, 
  onEdit, 
  onEnroll, 
  onView, 
  compact = false 
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const buttonStyle = {
    padding: compact ? '4px 8px' : '6px 12px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    color: '#4a5568',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: '#3182ce',
    color: 'white',
    border: '1px solid #3182ce'
  };

  if (compact) {
    return (
      <div style={{ position: 'relative' }}>
        <button 
          style={buttonStyle}
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
        >
          ⋯
        </button>
        
        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 100,
            minWidth: '120px',
            marginTop: '4px'
          }}>
            {onView && (
              <button
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: 'none', 
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onView(student);
                  setShowDropdown(false);
                }}
              >
                👁 View
              </button>
            )}
            {onEdit && (
              <button
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: 'none', 
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(student);
                  setShowDropdown(false);
                }}
              >
                ✏️ Edit
              </button>
            )}
            {onEnroll && (
              <button
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: 'none', 
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEnroll(student);
                  setShowDropdown(false);
                }}
              >
                📚 Enroll
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {onView && (
        <button 
          style={buttonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onView(student);
          }}
        >
          👁 View
        </button>
      )}
      {onEdit && (
        <button 
          style={primaryButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(student);
          }}
        >
          ✏️ Edit
        </button>
      )}
      {onEnroll && (
        <button 
          style={buttonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onEnroll(student);
          }}
        >
          📚 Enroll
        </button>
      )}
    </div>
  );
}

// frontend/src/components/admin/student/StudentSearch.jsx
// Search and filter component

import React, { useState, useEffect } from 'react';

export default function StudentSearch({ 
  onSearch, 
  onFilterChange, 
  initialFilters = {},
  availableGrades = [],
  showSpecialNeedsFilter = true 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    grade_level: '',
    has_special_needs: '',
    ...initialFilters
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, onSearch]);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? null : value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      grade_level: '',
      has_special_needs: ''
    });
  };

  return (
    <div style={{ 
      padding: '16px', 
      background: '#f7fafc', 
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'auto 1fr auto',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Search Input */}
        <div style={{ minWidth: '300px' }}>
          <input
            type="text"
            placeholder="Search students by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* Grade Filter */}
          <select
            value={filters.grade_level || ''}
            onChange={(e) => handleFilterChange('grade_level', e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Grades</option>
            {availableGrades.map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>

          {/* Special Needs Filter */}
          {showSpecialNeedsFilter && (
            <select
              value={filters.has_special_needs || ''}
              onChange={(e) => handleFilterChange('has_special_needs', e.target.value)}
              style={{
                padding: '6px 8px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              <option value="">All Students</option>
              <option value="true">Special Needs Only</option>
              <option value="false">No Special Needs</option>
            </select>
          )}
        </div>

        {/* Clear Filters */}
        <button
          onClick={clearFilters}
          style={{
            padding: '6px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            background: 'white',
            color: '#4a5568',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}