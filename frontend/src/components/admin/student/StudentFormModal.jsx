// frontend/src/components/admin/student/StudentFormModal.jsx
// Student creation and editing modal

import React, { useState, useEffect } from 'react';
import { StudentService } from '../../../services/studentService';

export default function StudentFormModal({ student, onSave, onCancel, existingStudents = [] }) {
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
    const yearSuffix = currentYear.toString().slice(-2); // Get last 2 digits of year
    
    // Find existing student IDs that match the pattern (e.g., SPR1001, SPR1002)
    const existingIds = existingStudents
      .map(s => s.student_id)
      .filter(id => id && id.startsWith('SPR'))
      .map(id => {
        const match = id.match(/SPR(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);

    // Find the next available number
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 1000;
    const nextId = maxId + 1;
    
    return `SPR${nextId}`;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.first_name.trim()) {
        throw new Error('First name is required');
      }
      if (!formData.last_name.trim()) {
        throw new Error('Last name is required');
      }
      if (!formData.entry_grade_level) {
        throw new Error('Entry grade is required');
      }

      // Prepare data for API
      const submitData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        student_id: formData.student_id.trim() || null,
        entry_grade_level: formData.entry_grade_level,
        date_of_birth: formData.date_of_birth || null,
        email: formData.email.trim() || null,
        entry_date: formData.entry_date || null
      };

      console.log('Submitting student data:', submitData);

      if (isEditing) {
        await StudentService.updateStudent(student.id, submitData);
      } else {
        await StudentService.createStudent(submitData);
      }
      onSave();
    } catch (err) {
      console.error('Student creation error:', err);
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} student`);
    } finally {
      setLoading(false);
    }
  };

  const grades = [
    { value: 'K', label: 'Kindergarten' },
    { value: '1', label: 'Grade 1' },
    { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' },
    { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' },
    { value: '6', label: 'Grade 6' },
    { value: '7', label: 'Grade 7' },
    { value: '8', label: 'Grade 8' }
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
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Student ID and Grade */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Student ID
              </label>
              <input
                type="text"
                value={formData.student_id}
                onChange={(e) => handleInputChange('student_id', e.target.value)}
                placeholder="Auto-generated"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  background: formData.student_id && !isEditing ? '#f7fafc' : 'white'
                }}
              />
              <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '2px' }}>
                {!isEditing && 'Auto-generated based on sequence'}
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Entry Grade *
              </label>
              <select
                required
                value={formData.entry_grade_level}
                onChange={(e) => handleInputChange('entry_grade_level', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              >
                <option value="">Select Grade</option>
                {grades.map(grade => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date of Birth and Entry Date */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Entry Date
              </label>
              <input
                type="date"
                value={formData.entry_date}
                onChange={(e) => handleInputChange('entry_date', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="student@school.edu"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Form Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: 'white',
                color: '#4a5568',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: loading ? '#a0aec0' : '#3182ce',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                minWidth: '100px'
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