// frontend/src/components/admin/tabs/UsersTab.jsx
// User management placeholder

import React from "react";

export default function UsersTab({ data }) {
  const { users } = data;

  return (
    <div className="card">
      <h2 className="section-title">User Management</h2>
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        color: '#718096',
        background: '#f7fafc',
        borderRadius: 8,
        border: '2px dashed #e2e8f0'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>👥</div>
        <h3 style={{ margin: '0 0 8px 0' }}>User Management Coming Soon</h3>
        <p style={{ margin: '0 0 16px 0' }}>
          Advanced user management features will be available in Phase A.3
        </p>
        <div style={{ fontSize: '0.875rem', color: '#4a5568' }}>
          Current users in system: {users.length}
        </div>
      </div>
    </div>
  );
}