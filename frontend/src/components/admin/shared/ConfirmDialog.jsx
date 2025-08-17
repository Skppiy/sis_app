// frontend/src/components/admin/shared/ConfirmDialog.jsx
// Reusable confirmation dialog

import React from 'react';

export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  type = 'warning' // 'warning' | 'danger' | 'info'
}) {
  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      color: '#d69e2e',
      buttonColor: '#d69e2e'
    },
    danger: {
      color: '#c53030',
      buttonColor: '#c53030'
    },
    info: {
      color: '#3182ce',
      buttonColor: '#3182ce'
    }
  };

  const style = typeStyles[type];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '2rem', 
          marginBottom: '16px',
          color: style.color
        }}>
          {type === 'danger' ? '⚠️' : type === 'warning' ? '❓' : 'ℹ️'}
        </div>
        
        <h3 style={{ 
          margin: '0 0 12px 0',
          color: '#2d3748'
        }}>
          {title}
        </h3>
        
        <p style={{ 
          margin: '0 0 24px 0',
          color: '#4a5568',
          lineHeight: '1.5'
        }}>
          {message}
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              background: 'white',
              color: '#4a5568',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: style.buttonColor,
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Export all shared components
export { ErrorBanner, LoadingSpinner, ConfirmDialog };