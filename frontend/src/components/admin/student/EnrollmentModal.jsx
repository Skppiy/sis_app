// frontend/src/components/admin/student/EnrollmentModal.jsx
// Student enrollment in classrooms

import React, { useState, useEffect } from 'react';
import { EnrollmentService } from '../../../services/studentService';
import { apiGet } from '../../../requestHelper';
import { useAuth } from '../../../AuthContext';

export default function EnrollmentModal({ student, onComplete, onCancel }) {
  const { active_school } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [currentEnrollments, setCurrentEnrollments] = useState([]);
  const [selectedClassrooms, setSelectedClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [student.id, active_school]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classroomsData, enrollmentsData] = await Promise.all([
        apiGet(`/classrooms?school_id=${active_school}`),
        EnrollmentService.getStudentEnrollments(student.id)
      ]);
      
      setClassrooms(classroomsData);
      setCurrentEnrollments(enrollmentsData);
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (selectedClassrooms.length === 0) return;

    try {
      setSubmitting(true);
      setError('');

      for (const classroomId of selectedClassrooms) {
        await EnrollmentService.enrollStudent(student.id, classroomId);
      }

      onComplete();
    } catch (err) {
      setError(`Failed to enroll student: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isEnrolled = (classroomId) => {
    return currentEnrollments.some(e => e.classroom_id === classroomId);
  };

  const toggleClassroom = (classroomId) => {
    setSelectedClassrooms(prev => 
      prev.includes(classroomId)
        ? prev.filter(id => id !== classroomId)
        : [...prev, classroomId]
    );
  };

  // Group classrooms by subject for better organization
  const classroomsBySubject = classrooms.reduce((acc, classroom) => {
    const subject = classroom.subject?.name || 'Other';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(classroom);
    return acc;
  }, {});

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
        maxWidth: '600px',
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
            Loading classrooms...
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#4a5568', marginBottom: '12px' }}>
                Grade {student.grade_level} • Currently enrolled in {currentEnrollments.length} classrooms
              </p>
              <p style={{ color: '#718096', fontSize: '0.875rem' }}>
                Select classrooms to enroll this student in:
              </p>
            </div>

            <div style={{ marginBottom: '24px', maxHeight: '400px', overflow: 'auto' }}>
              {Object.entries(classroomsBySubject).map(([subject, subjectClassrooms]) => (
                <div key={subject} style={{ marginBottom: '20px' }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#2d3748',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {subject}
                  </h4>
                  
                  <div style={{ 
                    display: 'grid', 
                    gap: '8px',
                    paddingLeft: '16px'
                  }}>
                    {subjectClassrooms.map(classroom => {
                      const enrolled = isEnrolled(classroom.id);
                      const selected = selectedClassrooms.includes(classroom.id);
                      
                      return (
                        <label
                          key={classroom.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            border: `1px solid ${enrolled ? '#68d391' : selected ? '#3182ce' : '#e2e8f0'}`,
                            borderRadius: '6px',
                            background: enrolled ? '#f0fff4' : selected ? '#ebf8ff' : 'white',
                            cursor: enrolled ? 'not-allowed' : 'pointer',
                            opacity: enrolled ? 0.7 : 1
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={enrolled}
                            onChange={() => !enrolled && toggleClassroom(classroom.id)}
                          />
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '500',
                              color: enrolled ? '#38a169' : '#2d3748'
                            }}>
                              {classroom.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              color: '#718096' 
                            }}>
                              {classroom.teacher?.first_name} {classroom.teacher?.last_name} • 
                              Grade {classroom.grade_level} • 
                              Room {classroom.room?.name || 'TBD'}
                            </div>
                          </div>
                          
                          {enrolled && (
                            <span style={{
                              padding: '2px 8px',
                              background: '#38a169',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              ✓ Enrolled
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {selectedClassrooms.length > 0 && (
              <div style={{
                padding: '12px',
                background: '#ebf8ff',
                border: '1px solid #bee3f8',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <div style={{ color: '#2b6cb0', fontWeight: '500', marginBottom: '4px' }}>
                  Selected for Enrollment:
                </div>
                <div style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                  {selectedClassrooms.length} classroom{selectedClassrooms.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button
                onClick={onCancel}
                disabled={submitting}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#4a5568',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleEnroll}
                disabled={submitting || selectedClassrooms.length === 0}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: (submitting || selectedClassrooms.length === 0) ? '#a0aec0' : '#3182ce',
                  color: 'white',
                  cursor: (submitting || selectedClassrooms.length === 0) ? 'not-allowed' : 'pointer',
                  minWidth: '120px'
                }}
              >
                {submitting ? 'Enrolling...' : `Enroll in ${selectedClassrooms.length} Classrooms`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}