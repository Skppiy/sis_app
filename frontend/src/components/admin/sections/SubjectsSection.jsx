// frontend/src/components/admin/sections/SubjectsSection.jsx
// Focused subjects management - 90 lines

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

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>Subjects ({subjects.length})</h3>
        <button
          onClick={() => setShowForm(true)}
          disabled={loading}
          style={{ padding: '6px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          + Add Subject
        </button>
      </div>

      <ErrorBanner error={error} onClear={() => setError("")} />

      {subjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#718096', fontStyle: 'italic', background: '#f7fafc', borderRadius: 4, border: '2px dashed #e2e8f0' }}>
          No subjects created yet. Add subjects like Math, Reading, Art, etc.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {subjects.map(subject => (
            <div key={subject.id} style={{ padding: '8px', background: subject.is_homeroom_default ? '#e6fffa' : '#f7fafc', borderRadius: 4, border: '1px solid #e2e8f0', position: 'relative' }}>
              <div style={{ paddingRight: 80 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: '0.9rem' }}>{subject.name}</strong>
                  <span style={{ background: '#718096', color: 'white', padding: '1px 4px', borderRadius: 2, fontSize: '0.7rem' }}>{subject.code}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                  {subject.subject_type} • {subject.applies_to_elementary && subject.applies_to_middle ? 'K-8' : subject.applies_to_elementary ? 'K-5' : subject.applies_to_middle ? '6-8' : 'None'}
                  {subject.is_homeroom_default && (
                    <span style={{ background: '#38b2ac', color: 'white', padding: '1px 4px', borderRadius: 2, fontSize: '0.65rem', marginLeft: 8 }}>AUTO</span>
                  )}
                </div>
              </div>
              
              <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                <button onClick={() => setEditingSubject(subject)} disabled={loading} style={{ padding: '2px 6px', background: '#ed8936', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: '0.7rem' }}>Edit</button>
                <button onClick={() => handleDelete(subject)} disabled={loading} style={{ padding: '2px 6px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: '0.7rem' }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90%', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Create Subject</h3>
            <SubjectForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {editingSubject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90%', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Edit Subject</h3>
            <SubjectForm initialData={editingSubject} onSubmit={handleEdit} onCancel={() => setEditingSubject(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
