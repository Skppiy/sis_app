// frontend/src/components/admin/tabs/StudentsTab.jsx
// Student management placeholder

export function StudentsTab({ data }) {
  return (
    <div className="card">
      <h2 className="section-title">Student Management</h2>
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        color: '#718096',
        background: '#f7fafc',
        borderRadius: 8,
        border: '2px dashed #e2e8f0'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>🎓</div>
        <h3 style={{ margin: '0 0 8px 0' }}>Student Management Coming Soon</h3>
        <p style={{ margin: '0 0 16px 0' }}>
          Student enrollment and management features will be available in Phase A.4
        </p>
      </div>
    </div>
  );
}

// Export both as default for easy importing
export default function UsersTab(props) {
  return <UsersTab {...props} />;
}

export { StudentsTab };