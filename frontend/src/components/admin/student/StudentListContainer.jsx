// frontend/src/components/admin/student/StudentListContainer.jsx
// Updated to include student creation form

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { StudentService } from '../../../services/studentService';
import StudentFormModal from './StudentFormModal';

export default function StudentListContainer() {
  const { active_school } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    loadStudents();
  }, [active_school]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await StudentService.getStudents(active_school);
      setStudents(data || []);
      
    } catch (err) {
      console.error('Students API error:', err);
      
      if (err.status === 500 || err.status === 404) {
        setError('Students API not yet implemented. This is normal during Phase A.2 development.');
        setStudents([]);
      } else {
        setError(`Failed to load students: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setShowStudentForm(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowStudentForm(true);
  };

  const handleStudentSaved = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
    loadStudents(); // Refresh the list
  };

  const handleFormCancel = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
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
      
      {/* Action Buttons */}
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
            marginRight: '12px',
            fontSize: '0.875rem',
            fontWeight: '500'
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
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          🔄 Refresh
        </button>
      </div>
      
      {/* Student List */}
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
          <h3 style={{ margin: '0 0 8px 0' }}>
            {error ? 'Student Management Ready!' : 'No Students Yet'}
          </h3>
          <p style={{ margin: '0 0 16px 0' }}>
            {error 
              ? 'Frontend components are working. Ready for backend integration.'
              : 'Get started by adding your first student.'
            }
          </p>
          <button
            onClick={handleAddStudent}
            style={{
              padding: '8px 16px',
              background: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ➕ Add First Student
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {students.map((student, index) => (
            <div 
              key={student.id || index}
              style={{
                padding: '16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {student.first_name} {student.last_name}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                  {student.entry_grade_level && `Grade ${student.entry_grade_level}`}
                  {student.student_id && ` • ID: ${student.student_id}`}
                  {student.date_of_birth && ` • Born: ${student.date_of_birth}`}
                </div>
              </div>
              
              <button
                onClick={() => handleEditStudent(student)}
                style={{
                  padding: '6px 12px',
                  background: '#e2e8f0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Student Form Modal */}
      {showStudentForm && (
        <StudentFormModal
          student={editingStudent}
          existingStudents={students}
          onSave={handleStudentSaved}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}