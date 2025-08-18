// frontend/src/components/admin/student/StudentListContainer.jsx
// Complete student management following your established patterns

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { StudentService } from '../../../services/studentService';
import StudentFormModal from './StudentFormModal';
import EnrollmentModal from './EnrollmentModal';

export default function StudentListContainer() {
  const { active_school } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollingStudent, setEnrollingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

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
      setError(`Failed to load students: ${err.message}`);
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

  const handleEnrollStudent = (student) => {
    setEnrollingStudent(student);
    setShowEnrollmentModal(true);
  };

  const handleStudentSaved = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
    loadStudents();
  };

  const handleFormCancel = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
  };

  const handleEnrollmentCancel = () => {
    setShowEnrollmentModal(false);
    setEnrollingStudent(null);
  };

  const handleDeleteStudent = async (student) => {
    if (!confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}?`)) {
      return;
    }

    try {
      await StudentService.deleteStudent(student.id);
      loadStudents();
    } catch (err) {
      console.error('Delete student error:', err);
      setError(`Failed to delete student: ${err.message}`);
    }
  };

  // Filter students based on search term and grade
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.student_id && student.student_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGrade = !gradeFilter || student.current_grade === gradeFilter || student.entry_grade_level === gradeFilter;
    
    return matchesSearch && matchesGrade;
  });

  // Get unique grades for filter
  const availableGrades = [...new Set(students.map(s => s.current_grade || s.entry_grade_level).filter(Boolean))].sort();

  const renderStudentCard = (student) => (
    <div 
      key={student.id}
      style={{
        padding: '16px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        background: '#ffffff',
        marginBottom: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Student Name */}
          <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '8px' }}>
            {student.first_name} {student.last_name}
            {!student.is_active && (
              <span style={{ 
                background: '#fed7d7', 
                color: '#c53030', 
                padding: '2px 6px', 
                borderRadius: '3px', 
                fontSize: '0.75rem',
                marginLeft: '8px'
              }}>
                INACTIVE
              </span>
            )}
          </div>
          
          {/* Student Details Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: viewMode === 'grid' ? '1fr 1fr' : '1fr 1fr 1fr', 
            gap: '4px 16px', 
            fontSize: '0.875rem', 
            color: '#4a5568',
            marginBottom: '8px'
          }}>
            <div><strong>ID:</strong> {student.student_id || 'Not Assigned'}</div>
            <div><strong>Grade:</strong> {student.current_grade || student.entry_grade_level || 'Not Set'}</div>
            {student.date_of_birth && (
              <div><strong>DOB:</strong> {new Date(student.date_of_birth).toLocaleDateString()}</div>
            )}
            {student.email && (
              <div><strong>Email:</strong> {student.email}</div>
            )}
            {student.entry_date && (
              <div><strong>Entry:</strong> {new Date(student.entry_date).toLocaleDateString()}</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
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
            ✏️ Edit
          </button>
          <button
            onClick={() => handleEnrollStudent(student)}
            style={{
              padding: '6px 12px',
              background: '#bee3f8',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📚 Enroll
          </button>
          <button
            onClick={() => handleDeleteStudent(student)}
            style={{
              padding: '6px 12px',
              background: '#fed7d7',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="section-title">Student Management</h2>
          <p style={{ color: '#718096', margin: 0 }}>
            {filteredStudents.length} of {students.length} students
            {searchTerm && ` matching "${searchTerm}"`}
            {gradeFilter && ` in grade ${gradeFilter}`}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            style={{
              padding: '8px 12px',
              background: '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {viewMode === 'list' ? '⊞ Grid' : '☰ List'}
          </button>
          <button
            onClick={handleAddStudent}
            style={{
              padding: '8px 16px',
              background: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            ➕ Add Student
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          background: '#fed7d7',
          color: '#c53030',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search students by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        <div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">All Grades</option>
            {availableGrades.map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
        </div>
        <button
          onClick={loadStudents}
          style={{
            padding: '8px 12px',
            background: '#38a169',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Student List */}
      {filteredStudents.length === 0 ? (
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
            {students.length === 0 ? 'No Students Yet' : 'No Matching Students'}
          </h3>
          <p style={{ margin: '0 0 16px 0' }}>
            {students.length === 0 
              ? 'Get started by adding your first student.'
              : 'Try adjusting your search criteria.'
            }
          </p>
          {students.length === 0 && (
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
          )}
        </div>
      ) : (
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'block',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(400px, 1fr))' : 'none',
          gap: viewMode === 'grid' ? '16px' : '0'
        }}>
          {filteredStudents.map(renderStudentCard)}
        </div>
      )}

      {/* Modals */}
      {showStudentForm && (
        <StudentFormModal
          student={editingStudent}
          existingStudents={students}
          onSave={handleStudentSaved}
          onCancel={handleFormCancel}
        />
      )}

      {showEnrollmentModal && enrollingStudent && (
        <EnrollmentModal
          student={enrollingStudent}
          onSave={() => {
            setShowEnrollmentModal(false);
            setEnrollingStudent(null);
          }}
          onCancel={handleEnrollmentCancel}
        />
      )}
    </div>
  );
}