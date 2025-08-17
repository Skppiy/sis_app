// frontend/src/components/admin/student/StudentFormModal.jsx
// Student creation and editing modal

import React, { useState, useEffect } from 'react';
import { StudentService, SpecialNeedsService } from '../../../services/studentService';
import { useAuth } from '../../../AuthContext';

export default function StudentFormModal({ student, onSave, onCancel }) {
  const { active_school } = useAuth();
  const isEditing = !!student;
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    student_id: '',
    grade_level: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_notes: '',
    special_needs_tags: []
  });

  const [specialNeedsTags, setSpecialNeedsTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load form data and special needs tags
  useEffect(() => {
    if (student) {
      setFormData({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        student_id: student.student_id || '',
        grade_level: student.grade_level || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        phone: student.phone || '',
        email: student.email || '',
        address: student.address || '',
        emergency_contact_name: student.emergency_contact_name || '',
        emergency_contact_phone: student.emergency_contact_phone || '',
        medical_notes: student.medical_notes || '',
        special_needs_tags: student.special_needs?.map(sn => sn.tag_id) || []
      });
    }

    loadSpecialNeedsTags();
  }, [student]);

  const loadSpecialNeedsTags = async () => {
    try {
      const tags = await SpecialNeedsService.getTagLibrary(active_school);
      setSpecialNeedsTags(tags);
    } catch (err) {
      console.error('Failed to load special needs tags:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecialNeedsChange = (tagId, checked) => {
    setFormData(prev => ({
      ...prev,
      special_needs_tags: checked
        ? [...prev.special_needs_tags, tagId]
        : prev.special_needs_tags.filter(id => id !== tagId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        grade_level: parseInt(formData.grade_level),
        school_id: active_school
      };

      if (isEditing) {
        await StudentService.updateStudent(student.id, submitData);
      } else {
        await StudentService.createStudent(submitData);
      }

      onSave();
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} student: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const grades = Array.from({ length: 13 }, (_, i) => i); // K-12

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
          {/* Basic Information */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>Basic Information</h3>
            
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
                    borderRadius: '6px'
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
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
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
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Grade Level *
                </label>
                <select
                  required
                  value={formData.grade_level}
                  onChange={(e) => handleInputChange('grade_level', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                >
                  <option value="">Select Grade</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>
                      {grade === 0 ? 'Kindergarten' : `Grade ${grade}`}
                    </option>
                  ))}
                </select>
              </div>
              
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
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>Contact Information</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>Emergency Contact</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Special Needs */}
          {specialNeedsTags.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#2d3748' }}>Special Needs</h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '8px'
              }}>
                {specialNeedsTags.map(tag => (
                  <label 
                    key={tag.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.special_needs_tags.includes(tag.id)}
                      onChange={(e) => handleSpecialNeedsChange(tag.id, e.target.checked)}
                    />
                    <span style={{ fontSize: '0.875rem' }}>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Medical Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Medical Notes
            </label>
            <textarea
              value={formData.medical_notes}
              onChange={(e) => handleInputChange('medical_notes', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                resize: 'vertical'
              }}
              placeholder="Any important medical information, allergies, or special considerations..."
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
                cursor: 'pointer'
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