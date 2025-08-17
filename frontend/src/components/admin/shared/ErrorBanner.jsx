// frontend/src/components/admin/shared/ErrorBanner.jsx
// Simple error component

import React from 'react';

export default function ErrorBanner({ message, onClose, type = 'error' }) {
  if (!message) return null;

  return (
    <div style={{
      padding: '12px 16px',
      background: '#fed7d7',
      color: '#c53030',
      border: '1px solid #feb2b2',
      borderRadius: '6px',
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}