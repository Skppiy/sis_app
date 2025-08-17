// frontend/src/components/admin/sections/SubjectsSection.jsx
// Fixed with tabs for Core, Enrichment, and Special subjects

import { useState } from "react";
import { apiPost, apiPut, apiDelete } from "../../../requestHelper";
import SubjectForm from "../forms/SubjectForm";
import ErrorBanner from "../shared/ErrorBanner";

export default function SubjectsSection({ subjects, onDataChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("CORE");

  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      setError("");
      await apiPost("/subjects", formData);
      if (onDataChange) await onDataChange();
      setShowForm(false);
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
      await apiPut(`/subjects/${editingSubject.id}`, formData);
      if (onDataChange) await onDataChange();
      setEditingSubject(null);
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
      if (onDataChange) await onDataChange();
    } catch (err) {
      setError(`Failed to delete subject: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Group subjects by type
  const subjectsByType = subjects.reduce((acc, subject) => {
    const type = subject.subject_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(subject);
    return acc;
  }, {});

  const tabs = [
    { 
      key: 'CORE', 
      label: '📚 Core', 
      description: 'Math, English, Science, Social Studies',
      subjects: subjectsByType['CORE'] || []
    },
    { 
      key: 'ENRICHMENT', 
      label: '🎨 Enrichment', 
      description: 'Art, Music, PE, Library',
      subjects: subjectsByType['ENRICHMENT'] || []
    },
    { 
      key: 'SPECIAL', 
      label: '🔧 Special Services', 
      description: 'Speech, Reading Support, Therapy',
      subjects: subjectsByType['SPECIAL'] || []
    }
  ];

  const renderSubjectCard = (subject) => (
    <div 
      key={subject.id} 
      style={{ 
        padding: '12px', 
        background: subject.is_homeroom_default ? '#edf7ed' : '#fafafa', 
        border: '1px solid #e2e8f0', 
        borderRadius: 4, 
        marginBottom: 8,
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Subject Name */}
          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 4 }}>
            {subject.name}
          </div>
          
          {/* Subject Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.8rem', color: '#4a5568' }}>
            <div><strong>Code:</strong> {subject.code}</div>
            <div><strong>Grades:</strong> {
              subject.applies_to_elementary && subject.applies_to_middle ? 'K-8' : 
              subject.applies_to_elementary ? 'K-5' : 
              subject.applies_to_middle ? '6-8' : 'None'
            }</div>
            
            <div><strong>Specialist:</strong> {subject.requires_specialist ? 'Yes' : 'No'}</div>
            <div><strong>Cross-Grade:</strong> {subject.allows_cross_grade ? 'Yes' : 'No'}</div>
          </div>

          {/* Special Indicators */}
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {subject.is_homeroom_default && (
              <span style={{ 
                background: '#38b2ac', 
                color: 'white', 
                padding: '1px 4px', 
                borderRadius: 2, 
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                🏫 AUTO-ASSIGN
              </span>
            )}
            
            {subject.requires_specialist && (
              <span style={{ 
                background: '#ed8936', 
                color: 'white', 
                padding: '1px 4px', 
                borderRadius: 2, 
                fontSize: '0.7rem'
              }}>
                👨‍🏫 SPECIALIST
              </span>
            )}

            {subject.is_system_core && (
              <span style={{ 
                background: '#9f7aea', 
                color: 'white', 
                padding: '1px 4px', 
                borderRadius: 2, 
                fontSize: '0.7rem'
              }}>
                🔒 SYSTEM
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          <button 
            onClick={() => setEditingSubject(subject)} 
            disabled={loading}
            style={{ 
              padding: '3px 6px', 
              background: '#ed8936', 
              color: 'white', 
              border: 'none', 
              borderRadius: 2, 
              cursor: 'pointer', 
              fontSize: '0.7rem'
            }}
          >
            Edit
          </button>
          <button 
            onClick={() => handleDelete(subject)} 
            disabled={loading || subject.is_system_core}
            style={{ 
              padding: '3px 6px', 
              background: subject.is_system_core ? '#a0aec0' : '#e53e3e', 
              color: 'white', 
              border: 'none', 
              borderRadius: 2, 
              cursor: subject.is_system_core ? 'not-allowed' : 'pointer', 
              fontSize: '0.7rem'
            }}
          >
            {subject.is_system_core ? 'Protected' : 'Del'}
          </button>
        </div>
      </div>
    </div>
  );

  const activeTabData = tabs.find(tab => tab.key === activeTab);

  return (
    <div className="card">
      {/* Header */}
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

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '2px solid #e2e8f0', 
        marginBottom: 16,
        gap: 4
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #667eea' : '2px solid transparent',
              background: activeTab === tab.key ? '#f7fafc' : 'transparent',
              color: activeTab === tab.key ? '#2d3748' : '#718096',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              borderRadius: '4px 4px 0 0'
            }}
          >
            {tab.label} ({tab.subjects.length})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {subjects.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px', 
          color: '#718096', 
          fontStyle: 'italic', 
          background: '#f7fafc', 
          borderRadius: 4, 
          border: '2px dashed #e2e8f0' 
        }}>
          No subjects created yet. Add subjects like Math, Reading, Art, etc.
        </div>
      ) : (
        <div>
          {/* Active Tab Description */}
          <div style={{ 
            background: '#f7fafc', 
            padding: '8px 12px', 
            borderRadius: 4, 
            marginBottom: 12,
            fontSize: '0.85rem',
            color: '#4a5568',
            border: '1px solid #e2e8f0'
          }}>
            <strong>{activeTabData?.label}:</strong> {activeTabData?.description}
          </div>

          {/* Subject Cards */}
          {activeTabData?.subjects.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '24px', 
              color: '#718096', 
              fontStyle: 'italic',
              background: '#f9f9f9',
              borderRadius: 4,
              border: '1px dashed #e2e8f0'
            }}>
              No {activeTabData?.label.toLowerCase()} subjects yet. Create one using the "+ Add Subject" button above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeTabData?.subjects.map(renderSubjectCard)}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <SubjectForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {/* Edit Modal */}
      {editingSubject && (
        <SubjectForm subject={editingSubject} onSubmit={handleEdit} onCancel={() => setEditingSubject(null)} />
      )}
    </div>
  );
}