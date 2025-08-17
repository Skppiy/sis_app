// frontend/src/components/admin/student/StudentListContainer.jsx
// Minimal test version with better error handling

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { apiGet } from '../../../requestHelper';

export default function StudentListContainer() {
  const { active_school } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, [active_school]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to load students from API, handle if endpoint doesn't exist
      const data = await apiGet('/students' + (active_school ? `?school_id=${active_school}` : ''));
      setStudents(data || []);
      
    } catch (err) {
      console.error('Students API error:', err);
      
      // Check if it's a 500/404 error (API not implemented yet)
      if (err.status === 500 || err.status === 404) {
        setError('Students API not yet implemented. This is normal during Phase A.2 development.');
        setStudents([]); // Use empty array for now
      } else {
        setError(`Failed to load students: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    alert('Student creation form will be implemented in the next step!');
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📚</div>
          <div>Loading students...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title">Student Management</h2>
      
      {error ? (
        <div>
          <div style={{
            padding: '12px',
            background: '#fef5e7',
            color: '#d69e2e',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #fbd38d'
          }}>
            ⚠️ {error}
          </div>
          <p style={{ color: '#718096', marginBottom: '20px' }}>
            Frontend components are ready! Next step: implement backend students API.
          </p>
        </div>
      ) : (
        <p style={{ color: '#718096', marginBottom: '20px' }}>
          Found {students.length} students in the system.
        </p>
      )}
      
      {/* Always show the UI components for testing */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={handleAddStudent}
          style={{
            padding: '8px 16px',
            background: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '12px'
          }}
        >
          ➕ Add Student
        </button>
        
        <button
          onClick={loadStudents}
          style={{
            padding: '8px 16px',
            background: '#38a169',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>
      
      {students.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#718096',
          background: '#f7fafc',
          borderRadius: 8,
          border: '2px dashed #e2e8f0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎓</div>
          <h3 style={{ margin: '0 0 8px 0' }}>Student Management Ready!</h3>
          <p style={{ margin: '0 0 16px 0' }}>
            Frontend components are working. Ready for backend integration.
          </p>
          <div style={{ fontSize: '0.875rem', color: '#4a5568' }}>
            <strong>Next Steps:</strong>
            <ul style={{ textAlign: 'left', marginTop: '8px' }}>
              <li>✅ Frontend components loaded</li>
              <li>🔄 Backend students API (in progress)</li>
              <li>⏳ Student creation forms</li>
              <li>⏳ Enrollment management</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {students.map((student, index) => (
              <div 
                key={student.id || index}
                style={{
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#ffffff'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {student.first_name} {student.last_name}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                  Grade {student.grade_level} • ID: {student.student_id || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}