// frontend/src/components/admin/sections/SubjectsSection.jsx
// Enhanced subjects management with full CRUD operations

import { useState } from "react";
import { apiPost, apiPut, apiDelete } from "../../../requestHelper";
import SubjectForm from "../forms/SubjectForm";
import ErrorBanner from "../shared/ErrorBanner";

export default function SubjectsSection({ subjects, onDataChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      setError("");
      const newSubject = await apiPost("/subjects", formData);
      onDataChange(); // Refresh data in parent
      setShowForm(false);
      console.log("✅ Subject created:", newSubject);
    } catch (err) {
      setError(`Failed to create subject: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    try {
      setLoading(true);
      setError("");
      const updatedSubject = await apiPut(`/subjects/${editingSubject.id}`, formData);
      onDataChange(); // Refresh data in parent
      setEditingSubject(null);
      console.log("✅ Subject updated:", updatedSubject);
    } catch (err) {
      setError(`Failed to update subject: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subject) => {
    if (!confirm(`Delete subject "${subject.name}"? This cannot be undone.`)) return;
    
    try {
      setLoading(true);
      setError("");
      await apiDelete(`/subjects/${subject.id}`);
      onDataChange(); // Refresh data in parent
      console.log("✅ Subject deleted:", subject.name);
    } catch (err) {
      setError(`Failed to delete subject: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Group subjects by type for better organization
  const subjectsByType = subjects.reduce((acc, subject) => {
    const type = subject.subject_type || 'ENRICHMENT';
    if (!acc[type]) acc[type] = [];
    acc[type].push(subject);
    return acc;
  }, {});

  const typeLabels = {
    'CORE': 'Core Subjects',
    'ENRICHMENT': 'Enrichment',
    'SPECIAL': 'Special Services'
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>Subjects ({subjects.length})</h3>
        <button
          onClick={() => setShowForm(true)}
          disabled={loading}
          style={{
            padding: '6px 12px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          + Add Subject
        </button>
      </div>

      <ErrorBanner error={error} onClear={() => setError("")} />

      {/* Subjects by Type */}
      {Object.entries(subjectsByType).map(([type, typeSubjects]) => (
        <div key={type} style={{ marginBottom: 20 }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            color: '#4a5568',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: 4
          }}>
            {typeLabels[type] || type} ({typeSubjects.length})
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {typeSubjects.map(subject => (
              <div 
                key={subject.id} 
                style={{ 
                  padding: '12px',
                  background: subject.is_homeroom_default ? '#e6fffa' : '#f7fafc',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  position: 'relative'
                }}
              >
                <div style={{ paddingRight: 60 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.95rem' }}>{subject.name}</strong>
                    <span style={{ 
                      background: '#718096', 
                      color: 'white', 
                      padding: '1px 4px', 
                      borderRadius: 2, 
                      fontSize: '0.7rem'
                    }}>
                      {subject.code}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                    {subject.applies_to_elementary && subject.applies_to_middle ? 'K-8' :
                     subject.applies_to_elementary ? 'K-5' :
                     subject.applies_to_middle ? '6-8' : 'None'}
                    
                    {subject.is_homeroom_default && (
                      <span style={{ 
                        background: '#38b2ac', 
                        color: 'white', 
                        padding: '1px 4px', 
                        borderRadius: 2, 
                        fontSize: '0.65rem', 
                        marginLeft: 8
                      }}>
                        AUTO
                      </span>
                    )}
                    
                    {subject.requires_specialist && (
                      <span style={{ 
                        background: '#9f7aea', 
                        color: 'white', 
                        padding: '1px 4px', 
                        borderRadius: 2, 
                        fontSize: '0.65rem', 
                        marginLeft: 4
                      }}>
                        SPEC
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  display: 'flex', 
                  gap: 4 
                }}>
                  <button
                    onClick={() => setEditingSubject(subject)}
                    disabled={loading}
                    style={{
                      padding: '2px 6px',
                      background: '#ed8936',
                      color: 'white',
                      border: 'none',
                      borderRadius: 3,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(subject)}
                    disabled={loading}
                    style={{
                      padding: '2px 6px',
                      background: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: 3,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {subjects.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#718096',
          fontStyle: 'italic',
          background: '#f7fafc',
          borderRadius: 4,
          border: '2px dashed #e2e8f0'
        }}>
          No subjects created yet. Add subjects like Math, Reading, Art, etc.
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
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
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90%',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>Create Subject</h3>
            <SubjectForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingSubject && (
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
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90%',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>Edit Subject</h3>
            <SubjectForm
              initialData={editingSubject}
              onSubmit={handleEdit}
              onCancel={() => setEditingSubject(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
