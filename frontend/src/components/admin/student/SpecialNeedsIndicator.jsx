// frontend/src/components/admin/student/SpecialNeedsIndicator.jsx
// Special needs display component

import React, { useState } from 'react';

export default function SpecialNeedsIndicator({ specialNeeds = [], compact = false }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!specialNeeds || specialNeeds.length === 0) {
    return null;
  }

  const indicatorStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    background: '#fed7d7',
    color: '#c53030',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500',
    position: 'relative',
    cursor: 'help'
  };

  const tooltipStyle = {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#2d3748',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    marginTop: '4px'
  };

  return (
    <span 
      style={indicatorStyle}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      🏥 {specialNeeds.length}
      
      {showTooltip && (
        <div style={tooltipStyle}>
          {specialNeeds.map(sn => sn.tag?.name || sn.name).join(', ')}
        </div>
      )}
    </span>
  );
}