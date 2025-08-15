// frontend/src/components/admin/shared/FormField.jsx
// Reusable form field component with consistent styling

export default function FormField({ 
    label, 
    children, 
    required = false, 
    error = null,
    help = null,
    style = {} 
  }) {
    const fieldStyle = {
      marginBottom: 16,
      ...style
    };
  
    const labelStyle = {
      display: 'block',
      marginBottom: 4,
      fontWeight: 'bold',
      color: '#2d3748'
    };
  
    const errorStyle = {
      color: '#e53e3e',
      fontSize: '0.875rem',
      marginTop: 4
    };
  
    const helpStyle = {
      color: '#718096',
      fontSize: '0.875rem',
      marginTop: 4
    };
  
    return (
      <div style={fieldStyle}>
        {label && (
          <label style={labelStyle}>
            {label}
            {required && <span style={{ color: '#e53e3e', marginLeft: 4 }}>*</span>}
          </label>
        )}
        
        {children}
        
        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}
        
        {help && !error && (
          <div style={helpStyle}>
            {help}
          </div>
        )}
      </div>
    );
  }