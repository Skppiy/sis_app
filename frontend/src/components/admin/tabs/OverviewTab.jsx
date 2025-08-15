// frontend/src/components/admin/tabs/OverviewTab.jsx
// System overview dashboard with key metrics

export default function OverviewTab({ data }) {
    const { users, academicYears, subjects, rooms, classrooms } = data;
    const activeYear = academicYears.find(y => y.is_active);
  
    const metrics = [
      {
        label: 'Active Academic Year',
        value: activeYear ? activeYear.name : 'None Set',
        color: activeYear ? '#667eea' : '#e53e3e',
        size: 'large'
      },
      {
        label: 'Total Users',
        value: users.length,
        color: '#667eea'
      },
      {
        label: 'Subjects',
        value: subjects.length,
        color: '#48bb78'
      },
      {
        label: 'Rooms',
        value: rooms.length,
        color: '#ed8936'
      },
      {
        label: 'Classrooms',
        value: classrooms.length,
        color: '#9f7aea'
      }
    ];
  
    return (
      <div className="card">
        <h2 className="section-title">System Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {metrics.map((metric, index) => (
            <div key={index} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>
                {metric.label}
              </div>
              <div style={{ 
                fontSize: metric.size === 'large' ? 18 : 24, 
                fontWeight: 700, 
                color: metric.color 
              }}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
  
        {/* System Health Indicators */}
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