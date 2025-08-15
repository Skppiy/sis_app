// frontend/src/components/admin/shared/Modal.jsx
// Reusable modal component for forms and dialogs

export default function Modal({ children, onClose, title, size = 'medium' }) {
    const sizeClasses = {
      small: { maxWidth: 400 },
      medium: { maxWidth: 500 },
      large: { maxWidth: 700 },
      xlarge: { maxWidth: 900 }
    };
  
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0,0,0,0.5)', 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 20
      }}>
        <div style={{ 
          background: 'white', 
          borderRadius: 8, 
          width: '90%', 
          ...sizeClasses[size],
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
          {/* Modal Header */}
          {title && (
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                {title}
              </h3>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#718096',
                  padding: 4,
                  borderRadius: 4
                }}
                onMouseOver={(e) => e.target.style.background = '#f7fafc'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
          )}
  
          {/* Modal Content */}
          <div style={{ padding: 24 }}>
            {children}
          </div>
        </div>
      </div>
    );
  }