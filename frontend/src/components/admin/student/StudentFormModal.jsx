// frontend/src/components/admin/student/StudentFormModal.jsx
// Complete student form following your established modal patterns

import React, { useState, useEffect } from 'react';
import { StudentService } from '../../../services/studentService';
import { useAuth } from '../../../AuthContext';

export default function StudentFormModal({ student, onSave, onCancel, existingStudents = [] }) {
  const { active_school } = useAuth();
  const isEditing = !!student;
  
  const [formData, setFormData] = useState({
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    student_id: student?.student_id || '',
    entry_grade_level: student?.entry_grade_level || '',
    date_of_birth: student?.date_of_birth || '',
    email: student?.email || '',
    entry_date: student?.entry_date || new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate student ID when not editing
  useEffect(() => {
    if (!isEditing && !formData.student_id) {
      const suggestedId = generateNextStudentId();
      setFormData(prev => ({
        ...prev,
        student_id: suggestedId
      }));
    }
  }, [isEditing, existingStudents]);

  const generateNextStudentId = () => {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    
    // Find existing student IDs that match the pattern
    const existingIds = existingStudents
      .map(s => s.student_id)
      .filter(id => id && id.match(/^\d+$/))
      .map(id => parseInt(id))
      .filter(num => !isNaN(num));

    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 1000;
    return (maxId + 1).toString();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return false;
    }
    
    // Check for duplicate student ID
    if (formData.student_id) {
      const duplicate = existingStudents.find(s => 
        s.student_id === formData.student_id && s.id !== student?.id
      );
      if (duplicate) {
        setError('Student ID already exists');
        return false;
      }
    }

    // Check for duplicate email
    if (formData.email) {
      const duplicate = existingStudents.find(s => 
        s.email === formData.email && s.id !== student?.id
      );
      if (duplicate) {
        setError('Email already exists');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        await StudentService.updateStudent(student.id, formData);
      } else {
        await StudentService.createStudent(formData);
      }
      
      onSave();
    } catch (err) {
      console.error('Student save error:', err);
      setError(err.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  const gradeOptions = [
    'PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8'
  ];

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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0 }}>
            {isEditing ? 'Edit Student' : 'Add New Student'}
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

        <form onSubmit={handleSubmit}>
          {/* Name Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
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
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Student ID */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Student ID
            </label>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Grade and Date of Birth */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Entry Grade Level
              </label>
              <select
                name="entry_grade_level"
                value={formData.entry_grade_level}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Grade</option>
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Email (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Entry Date */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Entry Date
            </label>
            <input
              type="date"
              name="entry_date"
              value={formData.entry_date}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: loading ? '#cbd5e0' : '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Student' : 'Create Student')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}