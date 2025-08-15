// frontend/src/components/admin/tabs/AcademicsTab.jsx
// Simple academic management - displays data clearly

export default function AcademicsTab({ data }) {
  const { academicYears, subjects, classrooms } = data;
  const activeYear = academicYears.find(y => y.is_active);

  return (
    <div className="card">
      <h2 className="section-title">Academic Management</h2>
      
      {/* Simple Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Academic Years - Simple Display */}
        <div className="card">
          <h3>Academic Years</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {academicYears.map(year => (
              <div key={year.id} style={{ 
                padding: '8px 12px',
                background: year.is_active ? '#c6f6d5' : '#f7fafc',
                borderRadius: 4,
                border: year.is_active ? '2px solid #48bb78' : '1px solid #e2e8f0'
              }}>
                <strong>{year.name}</strong>
                {year.is_active && (
                  <span style={{ 
                    background: '#48bb78', 
                    color: 'white', 
                    padding: '2px 6px', 
                    borderRadius: 4, 
                    fontSize: '0.75rem', 
                    marginLeft: 8 
                  }}>
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Subjects - Simple Display */}
        <div className="card">
          <h3>Subjects ({subjects.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            {subjects.map(subject => (
              <div key={subject.id} style={{ 
                padding: '4px 8px',
                background: subject.is_homeroom_default ? '#e6fffa' : '#f7fafc',
                borderRadius: 4,
                fontSize: '0.875rem'
              }}>
                <strong>{subject.name}</strong> ({subject.code})
                {subject.is_homeroom_default && (
                  <span style={{ 
                    background: '#38b2ac', 
                    color: 'white', 
                    padding: '1px 4px', 
                    borderRadius: 2, 
                    fontSize: '0.7rem', 
                    marginLeft: 4 
                  }}>
                    AUTO
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        
      </div>

      {/* Classrooms - Simple Display */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Classrooms ({classrooms.length})</h3>
        {classrooms.length === 0 ? (
          <p style={{ color: '#718096', fontStyle: 'italic' }}>
            No classrooms created yet. Ready to create classrooms with your subjects and rooms!
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {classrooms.map(classroom => (
              <div key={classroom.id} className="card" style={{ margin: 0 }}>
                <h4 style={{ margin: '0 0 8px 0' }}>{classroom.name}</h4>
                <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                  Grade: {classroom.grade_level} • Subject: {classroom.subject?.name || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}