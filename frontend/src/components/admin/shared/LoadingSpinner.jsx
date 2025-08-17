// frontend/src/components/admin/shared/LoadingSpinner.jsx
// Reusable loading indicator

import React from 'react';

export default function LoadingSpinner({ size = 'medium', message = 'Loading...' }) {
  const sizes = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  const spinnerStyle = {
    width: sizes[size],
    height: sizes[size],
    border: '2px solid #e2e8f0',
    borderTop: '2px solid #3182ce',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: message ? '8px' : '0'
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: '#718096'
    }}>
      <div style={spinnerStyle}></div>
      {message && <span>{message}</span>}
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}