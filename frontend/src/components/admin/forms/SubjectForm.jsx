// frontend/src/components/admin/forms/SubjectForm.jsx
// Reusable subject form component

import { useState, useEffect } from "react";

export default function SubjectForm({ subject, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    subject_type: 'CORE',
    is_homeroom_default: false,
    requires_specialist: false
  });

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || '',
        code: subject.code || '',
        subject_type: subject.subject_type || 'CORE',
        is_homeroom_default: subject.is_homeroom_default || false,
        requires_specialist: subject.requires_specialist || false
      });
    }
  }, [subject]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ margin: 16, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <h2 className="section-title">{subject ? 'Edit Subject' : 'Add Subject'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 16 }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Subject Name <span style={{ color: 'red' }}>*</span>:
              </label>
              <input
                type="text"
                placeholder="Mathematics"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  borderRadius: 4, 
                  border: !formData.name ? '2px solid #e53e3e' : '1px solid #ddd'
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                Subject Code <span style={{ color: 'red' }}>*</span>:
              </label>
              <input
                type="text"
                placeholder="MATH"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  borderRadius: 4, 
                  border: !formData.code ? '2px solid #e53e3e' : '1px solid #ddd'
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Subject Type:</label>
              <select
                value={formData.subject_type}
                onChange={(e) => setFormData({...formData, subject_type: e.target.value})}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
              >
                <option value="CORE">Core Subject</option>
                <option value="ENRICHMENT">Enrichment</option>
                <option value="SPECIAL">Special Education</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Homeroom Intelligence:</label>
              <div style={{ display: 'grid', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.is_homeroom_default}
                    onChange={(e) => setFormData({...formData, is_homeroom_default: e.target.checked})}
                  />
                  <span>🏫 Auto-assign to elementary homeroom teachers</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.requires_specialist}
                    onChange={(e) => setFormData({...formData, requires_specialist: e.target.checked})}
                  />
                  <span>👨‍🏫 Requires specialist teacher</span>
                </label>
              </div>
              <div style={{ 
                marginTop: 8, 
                padding: 8, 
                background: '#f0f9ff', 
                borderRadius: 4, 
                fontSize: '0.75rem',
                color: '#0c4a6e'
              }}>
                💡 <strong>Tip:</strong> Core subjects like Math, English, Science, and Social Studies should be marked as "homeroom default" for elementary auto-assignment.
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                onClick={onCancel}
                style={{ 
                  background: '#e2e8f0', 
                  color: '#4a5568', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name || !formData.code}
                style={{ 
                  background: (formData.name && formData.code) ? '#667eea' : '#a0aec0', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: 4,
                  cursor: (formData.name && formData.code) ? 'pointer' : 'not-allowed'
                }}
              >
                {subject ? 'Update Subject' : 'Create Subject'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}