// frontend/src/components/admin/shared/ErrorBanner.jsx
// Reusable error banner component

export default function ErrorBanner({ error, onClear }) {
    if (!error) return null;
  
    return (
      <div style={{ 
        background: '#fed7d7', 
        color: '#c53030', 
        padding: '12px 16px', 
        borderRadius: '4px', 
        marginBottom: '20px',
        border: '1px solid #feb2b2',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <span>{error}</span>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            style={{
              background: 'none',
              border: 'none',
              color: '#c53030',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: 4,
              borderRadius: 2
            }}
            onMouseOver={(e) => e.target.style.background = '#feb2b2'}
            onMouseOut={(e) => e.target.style.background = 'none'}
          >
            ×
          </button>
        )}
      </div>
    );
  }