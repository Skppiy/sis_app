// frontend/src/components/admin/tabs/OverviewTab.jsx
// Simple system overview - just shows data, no complex logic

export default function OverviewTab({ data }) {
  const { users, academicYears, subjects, rooms, classrooms } = data;
  const activeYear = academicYears.find(y => y.is_active);

  return (
    <div className="card">
      <h2 className="section-title">System Overview</h2>
      
      {/* Simple Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>
            Active Academic Year
          </div>
          <div style={{ 
            fontSize: 18, 
            fontWeight: 700, 
            color: activeYear ? '#667eea' : '#e53e3e' 
          }}>
            {activeYear ? activeYear.name : 'None Set'}
          </div>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>Total Users</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#667eea' }}>{users.length}</div>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>Subjects</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#48bb78' }}>{subjects.length}</div>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>Rooms</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ed8936' }}>{rooms.length}</div>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>Classrooms</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#9f7aea' }}>{classrooms.length}</div>
        </div>
      </div>

      {/* Simple Health Check */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>System Health</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          
          <div className="card">
            <h4 style={{ margin: '0 0 8px 0', color: '#4a5568' }}>Academic Setup</h4>
            <div style={{ fontSize: '0.875rem' }}>
              {activeYear ? (
                <span style={{ color: '#48bb78' }}>✅ Academic year active</span>
              ) : (
                <span style={{ color: '#e53e3e' }}>❌ No active academic year</span>
              )}
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              {subjects.length > 0 ? (
                <span style={{ color: '#48bb78' }}>✅ {subjects.length} subjects configured</span>
              ) : (
                <span style={{ color: '#e53e3e' }}>❌ No subjects created</span>
              )}
            </div>
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 8px 0', color: '#4a5568' }}>Facilities</h4>
            <div style={{ fontSize: '0.875rem' }}>
              {rooms.length > 0 ? (
                <span style={{ color: '#48bb78' }}>✅ {rooms.length} rooms configured</span>
              ) : (
                <span style={{ color: '#e53e3e' }}>❌ No rooms created</span>
              )}
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              {classrooms.length > 0 ? (
                <span style={{ color: '#48bb78' }}>✅ {classrooms.length} classrooms active</span>
              ) : (
                <span style={{ color: '#f56565' }}>⚠️ No classrooms created</span>
              )}
            </div>
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 8px 0', color: '#4a5568' }}>Quick Actions</h4>
            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {!activeYear && (
                <span style={{ color: '#e53e3e' }}>• Create academic year first</span>
              )}
              {subjects.length === 0 && (
                <span style={{ color: '#e53e3e' }}>• Run core subjects script</span>
              )}
              {rooms.length === 0 && (
                <span style={{ color: '#e53e3e' }}>• Add school rooms</span>
              )}
              {activeYear && subjects.length > 0 && rooms.length > 0 && classrooms.length === 0 && (
                <span style={{ color: '#f56565' }}>• Ready to create classrooms!</span>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}