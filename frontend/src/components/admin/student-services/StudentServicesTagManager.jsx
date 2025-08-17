// frontend/src/components/admin/student-services/StudentServicesTagManager.jsx
// Admin interface for managing student services tag library

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../requestHelper';

export default function StudentServicesTagManager() {
  const { active_school } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const [formData, setFormData] = useState({
    tag_name: '',
    category: 'ACADEMIC',
    description: '',
    requires_documentation: true,
    is_confidential: false,
    display_color: '#e53e3e'
  });

  useEffect(() => {
    loadTags();
  }, [active_school]);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiGet(`/student-services/tags${active_school ? `?school_id=${active_school}` : ''}`);
      setTags(data || []);
    } catch (err) {
      console.error('Error loading student services tags:', err);
      setError('Student Services API not yet implemented. This is normal during development.');
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = () => {
    setEditingTag(null);
    setFormData({
      tag_name: '',
      category: 'ACADEMIC',
      description: '',
      requires_documentation: true,
      is_confidential: false,
      display_color: '#e53e3e'
    });
    setShowForm(true);
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);
    setFormData({
      tag_name: tag.tag_name || '',
      category: tag.category || 'ACADEMIC',
      description: tag.description || '',
      requires_documentation: tag.requires_documentation ?? true,
      is_confidential: tag.is_confidential ?? false,
      display_color: tag.display_color || '#e53e3e'
    });
    setShowForm(true);
  };

  const handleSaveTag = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        school_id: active_school
      };

      if (editingTag) {
        await apiPut(`/student-services/tags/${editingTag.id}`, submitData);
      } else {
        await apiPost('/student-services/tags', submitData);
      }

      setShowForm(false);
      setEditingTag(null);
      await loadTags();
    } catch (err) {
      setError(`Failed to ${editingTag ? 'update' : 'create'} tag: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tag) => {
    if (!confirm(`Delete "${tag.tag_name}"? This will remove it from all students.`)) return;

    try {
      setLoading(true);
      await apiDelete(`/student-services/tags/${tag.id}`);
      await loadTags();
    } catch (err) {
      setError(`Failed to delete tag: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'ACADEMIC', label: 'Academic Support', icon: '📚' },
    { value: 'BEHAVIORAL', label: 'Behavioral Support', icon: '🎯' },
    { value: 'HEALTH', label: 'Health & Medical', icon: '🏥' },
    { value: 'ACCESSIBILITY', label: 'Accessibility Support', icon: '♿' },
    { value: 'LANGUAGE', label: 'Language Support', icon: '💬' },
    { value: 'ENRICHMENT', label: 'Enrichment Programs', icon: '🌟' },
    { value: 'OTHER', label: 'Other Services', icon: '📋' }
  ];

  const predefinedTags = [
    { name: 'IEP', category: 'ACADEMIC', color: '#e53e3e', description: 'Individualized Education Program' },
    { name: '504 Plan', category: 'ACCESSIBILITY', color: '#d69e2e', description: 'Section 504 Accommodation Plan' },
    { name: 'ELL', category: 'LANGUAGE', color: '#38a169', description: 'English Language Learner Support' },
    { name: 'Gifted Program', category: 'ENRICHMENT', color: '#805ad5', description: 'Gifted and Talented Program' },
    { name: 'ADHD Support', category: 'BEHAVIORAL', color: '#3182ce', description: 'ADHD Accommodations' },
    { name: 'Autism Support', category: 'BEHAVIORAL', color: '#00b4d8', description: 'Autism Spectrum Support Services' },
    { name: 'Speech Therapy', category: 'LANGUAGE', color: '#f56500', description: 'Speech and Language Therapy' },
    { name: 'Reading Support', category: 'ACADEMIC', color: '#c53030', description: 'Reading Intervention Services' }
  ];

  if (loading && tags.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🎓</div>
          <div>Loading student services...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 className="section-title">Student Services Library</h2>
          <p style={{ color: '#718096', margin: 0 }}>
            Manage support services and accommodation categories for students
          </p>
        </div>
        
        <button
          onClick={handleCreateTag}
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
          ➕ Add Service Tag
        </button>
      </div>

      {error && (
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
      )}

      {/* Quick Setup */}
      {tags.length === 0 && !error && (
        <div style={{
          padding: '16px',
          background: '#ebf8ff',
          border: '1px solid #bee3f8',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#2b6cb0' }}>Quick Setup</h3>
          <p style={{ margin: '0 0 12px 0', color: '#4a5568', fontSize: '0.875rem' }}>
            Get started with common student support services:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {predefinedTags.map(tag => (
              <button
                key={tag.name}
                onClick={() => {
                  setFormData({
                    tag_name: tag.name,
                    category: tag.category,
                    description: tag.description,
                    requires_documentation: true,
                    is_confidential: true,
                    display_color: tag.color
                  });
                  setShowForm(true);
                }}
                style={{
                  padding: '4px 8px',
                  background: tag.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                + {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for API Error */}
      {tags.length === 0 && error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#718096',
          background: '#f7fafc',
          borderRadius: 8,
          border: '2px dashed #e2e8f0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎓</div>
          <h3 style={{ margin: '0 0 8px 0' }}>Student Services Ready!</h3>
          <p style={{ margin: '0 0 16px 0' }}>
            Frontend components are working. Ready for backend API integration.
          </p>
          <div style={{ fontSize: '0.875rem', color: '#4a5568' }}>
            <strong>Next Steps:</strong>
            <ul style={{ textAlign: 'left', marginTop: '8px' }}>
              <li>✅ Frontend components loaded</li>
              <li>🔄 Backend student-services API (Phase A.2)</li>
              <li>⏳ Student service assignment</li>
              <li>⏳ Teacher workflow integration</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tags by Category */}
      {categories.map(category => {
        const categoryTags = tags.filter(tag => tag.category === category.value);
        if (categoryTags.length === 0) return null;

        return (
          <div key={category.value} style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              color: '#2d3748',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{category.icon}</span>
              {category.label} ({categoryTags.length})
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '12px' 
            }}>
              {categoryTags.map(tag => (
                <div 
                  key={tag.id}
                  style={{
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'white'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px' 
                    }}>
                      <span 
                        style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: tag.display_color || '#e2e8f0'
                        }}
                      />
                      <span style={{ fontWeight: '600' }}>{tag.tag_name}</span>
                      {tag.is_confidential && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          background: '#fed7d7', 
                          color: '#c53030',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          Confidential
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleEditTag(tag)}
                        style={{
                          padding: '4px 8px',
                          background: '#e2e8f0',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        style={{
                          padding: '4px 8px',
                          background: '#fed7d7',
                          color: '#c53030',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {tag.description && (
                    <p style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '0.875rem', 
                      color: '#4a5568' 
                    }}>
                      {tag.description}
                    </p>
                  )}
                  
                  <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                    {tag.requires_documentation && '📋 Requires Documentation • '}
                    Used by {tag.student_count || 0} students
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty State for No Tags */}
      {tags.length === 0 && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#718096',
          background: '#f7fafc',
          borderRadius: 8,
          border: '2px dashed #e2e8f0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎓</div>
          <h3 style={{ margin: '0 0 8px 0' }}>No Service Tags Yet</h3>
          <p style={{ margin: '0 0 16px 0' }}>
            Create tags like IEP, 504 Plan, ELL to track student support services.
          </p>
        </div>
      )}

      {/* Tag Form Modal */}
      {showForm && (
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
            maxWidth: '500px'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>
              {editingTag ? 'Edit Student Service Tag' : 'Create Student Service Tag'}
            </h3>

            <form onSubmit={handleSaveTag}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Tag Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tag_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, tag_name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Display Color
                </label>
                <input
                  type="color"
                  value={formData.display_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_color: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '40px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.requires_documentation}
                    onChange={(e) => setFormData(prev => ({ ...prev, requires_documentation: e.target.checked }))}
                  />
                  Requires Documentation
                </label>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_confidential}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_confidential: e.target.checked }))}
                  />
                  Confidential (Limited Access)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: 'white',
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
                    background: loading ? '#a0aec0' : '#3182ce',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Saving...' : (editingTag ? 'Update Tag' : 'Create Tag')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}