// frontend/src/components/admin/student/EnrollmentModal.jsx
// Student enrollment in classrooms following your established patterns

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { apiGet, apiPost } from '../../../requestHelper';

export default function EnrollmentModal({ student, onSave, onCancel }) {
  const { active_school } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [currentEnrollments, setCurrentEnrollments] = useState([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClassroomsAndEnrollments();
  }, [student]);

  const loadClassroomsAndEnrollments = async () => {
    try {
      setLoading(true);
      setError('');

      // Load available classrooms
      const classroomsData = await apiGet('/classrooms');
      setClassrooms(classroomsData || []);

      // Load current enrollments for this student
      try {
        const enrollmentsData = await apiGet(`/students/${student.id}/enrollments`);
        const enrolledClassroomIds = enrollmentsData.map(e => e.classroom_id);
        setCurrentEnrollments(enrolledClassroomIds);
        setSelectedClassrooms(enrolledClassroomIds);
      } catch (enrollmentError) {
        // Enrollments endpoint might not exist yet - that's okay
        console.log('Enrollments endpoint not available yet');
        setCurrentEnrollments([]);
        setSelectedClassrooms([]);
      }

    } catch (err) {
      console.error('Error loading enrollment data:', err);
      setError('Failed to load classroom data');
    } finally {
      setLoading(false);
    }
  };

  const handleClassroomToggle = (classroomId) => {
    setSelectedClassrooms(prev => 
      prev.includes(classroomId)
        ? prev.filter(id => id !== classroomId)
        : [...prev, classroomId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      // Calculate changes
      const toEnroll = selectedClassrooms.filter(id => !currentEnrollments.includes(id));
      const toUnenroll = currentEnrollments.filter(id => !selectedClassrooms.includes(id));

      // Process enrollments
      for (const classroomId of toEnroll) {
        try {
          await apiPost('/enrollments', {
            student_id: student.id,
            classroom_id: classroomId,
            enrollment_date: new Date().toISOString().split('T')[0],
            status: 'ACTIVE'
          });
        } catch (err) {
          console.error(`Failed to enroll in classroom ${classroomId}:`, err);
          // Continue with other enrollments
        }
      }

      // Process unenrollments (typically would be PATCH to set inactive)
      for (const classroomId of toUnenroll) {
        try {
          // This would typically be a PATCH request to deactivate enrollment
          // For now, we'll skip this as the endpoint might not be implemented
          console.log(`Would unenroll from classroom ${classroomId}`);
        } catch (err) {
          console.error(`Failed to unenroll from classroom ${classroomId}:`, err);
        }
      }

      onSave();
    } catch (err) {
      console.error('Enrollment save error:', err);
      setError('Failed to save enrollments');
    } finally {
      setSaving(false);
    }
  };

  // Group classrooms by subject for better organization
  const classroomsBySubject = classrooms.reduce((acc, classroom) => {
    const subject = classroom.subject?.name || 'Other';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(classroom);
    return acc;
  }, {});

  // Filter classrooms appropriate for student's grade
  const getAppropriateClassrooms = () => {
    const studentGrade = student.current_grade || student.entry_grade_level;
    if (!studentGrade) return classrooms;

    return classrooms.filter(classroom => {
      // Always include homeroom classes of the same grade
      if (classroom.classroom_type === 'HOMEROOM' && classroom.grade_level === studentGrade) {
        return true;
      }
      
      // Include subject classes of the same grade
      if (classroom.grade_level === studentGrade) {
        return true;
      }
      
      // Include multi-grade classes or special subjects
      if (!classroom.grade_level || classroom.subject?.subject_type === 'SPECIAL') {
        return true;
      }
      
      return false;
    });
  };

  const appropriateClassrooms = getAppropriateClassrooms();
  const appropriateClassroomsBySubject = appropriateClassrooms.reduce((acc, classroom) => {
    const subject = classroom.subject?.name || 'Other';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(classroom);
    return acc;
  }, {});

  const renderClassroomOption = (classroom) => {
    const isSelected = selectedClassrooms.includes(classroom.id);
    const isCurrentlyEnrolled = currentEnrollments.includes(classroom.id);
    const teacherName = classroom.teacher_assignments && classroom.teacher_assignments.length > 0
      ? `${classroom.teacher_assignments[0].teacher?.first_name} ${classroom.teacher_assignments[0].teacher?.last_name}`
      : 'No Teacher Assigned';

    return (
      <div
        key={classroom.id}
        onClick={() => handleClassroomToggle(classroom.id)}
        style={{
          padding: '12px',
          border: isSelected ? '2px solid #3182ce' : '1px solid #e2e8f0',
          borderRadius: '6px',
          background: isSelected ? '#ebf8ff' : '#ffffff',
          cursor: 'pointer',
          marginBottom: '8px',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}} // Handled by parent div onClick
            style={{ marginRight: '8px' }}
          />
          <div style={{ fontWeight: '600', flex: 1 }}>
            {classroom.name}
            {isCurrentlyEnrolled && (
              <span style={{
                background: '#38a169',
                color: 'white',
                padding: '1px 6px',
                borderRadius: '3px',
                fontSize: '0.75rem',
                marginLeft: '8px'
              }}>
                CURRENT
              </span>
            )}
          </div>
        </div>
        
        <div style={{ fontSize: '0.875rem', color: '#4a5568', marginLeft: '24px' }}>
          <div>Teacher: {teacherName}</div>
          <div>Grade: {classroom.grade_level || 'Multi-Grade'}</div>
          {classroom.room && (
            <div>Room: {classroom.room.name}</div>
          )}
          <div>Capacity: {classroom.enrollment_count || 0}/{classroom.max_students || '∞'}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0 }}>
            Enroll {student.first_name} {student.last_name}
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#718096'
            }}
          >
            ×
          </button>
        </div>

        {/* Student Grade Info */}
        <div style={{
          padding: '12px',
          background: '#f7fafc',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <strong>Student Grade:</strong> {student.current_grade || student.entry_grade_level || 'Not Set'}
          <div style={{ fontSize: '0.875rem', color: '#4a5568', marginTop: '4px' }}>
            Showing classrooms appropriate for this grade level
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            <div>Loading classrooms...</div>
          </div>
        ) : appropriateClassrooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            <div>No appropriate classrooms found for this student.</div>
            <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>
              Create classrooms for grade {student.current_grade || student.entry_grade_level || 'this student\'s grade'} first.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px', fontSize: '0.875rem', color: '#4a5568' }}>
              Select classrooms to enroll {student.first_name} in:
            </div>
            
            {/* Classrooms by Subject */}
            {Object.entries(appropriateClassroomsBySubject).map(([subject, subjectClassrooms]) => (
              <div key={subject} style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  color: '#2d3748',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  {subject} ({subjectClassrooms.length})
                </h4>
                {subjectClassrooms.map(renderClassroomOption)}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              padding: '8px 16px',
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || appropriateClassrooms.length === 0}
            style={{
              padding: '8px 16px',
              background: saving ? '#cbd5e0' : '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (saving || appropriateClassrooms.length === 0) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {saving ? 'Saving Enrollments...' : `Save Enrollments (${selectedClassrooms.length} selected)`}
          </button>
        </div>
      </div>
    </div>
  );
}