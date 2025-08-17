// frontend/src/components/admin/sections/ClassroomsSection.jsx
// Focused classrooms management - 90 lines

import { useState } from "react";
import { apiPost, apiPut, apiDelete } from "../../../requestHelper";
import ClassroomForm from "../forms/ClassroomForm";
import ErrorBanner from "../shared/ErrorBanner";

export default function ClassroomsSection({ classrooms, subjects, onDataChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      setError("");
      await apiPost("/classrooms", formData);
      if (onDataChange) await onDataChange();
      setShowForm(false);
    } catch (err) {
      setError(`Failed to create classroom: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    try {
      setLoading(true);
      setError("");
      await apiPut(`/classrooms/${editingClassroom.id}`, formData);
      if (onDataChange) await onDataChange();
      setEditingClassroom(null);
    } catch (err) {
      setError(`Failed to update classroom: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classroom) => {
    if (!confirm(`Delete classroom "${classroom.name}"? This cannot be undone.`)) return;
    try {
      setLoading(true);
      setError("");
      await apiDelete(`/classrooms/${classroom.id}`);
      if (onDataChange) await onDataChange();
    } catch (err) {
      setError(`Failed to delete classroom: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>Classrooms ({classrooms.length})</h3>
        <button
          onClick={() => setShowForm(true)}
          disabled={loading || subjects.length === 0}
          style={{ padding: '6px 12px', background: subjects.length === 0 ? '#a0aec0' : '#9f7aea', color: 'white', border: 'none', borderRadius: 4, cursor: (loading || subjects.length === 0) ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          title={subjects.length === 0 ? "Create subjects first" : "Create classroom"}
        >
          + Add Classroom
        </button>
      </div>

      <ErrorBanner error={error} onClear={() => setError("")} />

      {subjects.length === 0 && (
        <div style={{ background: '#fed7d7', color: '#c53030', padding: 12, borderRadius: 4, marginBottom: 12, fontSize: '0.875rem' }}>
          ⚠️ Create subjects before adding classrooms
        </div>
      )}

      {classrooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#718096', fontStyle: 'italic', background: '#f7fafc', borderRadius: 4, border: '2px dashed #e2e8f0' }}>
          No classrooms created yet. {subjects.length > 0 ? 'Create classrooms by combining subjects with grade levels!' : ''}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {classrooms.map(classroom => (
            <div key={classroom.id} style={{ padding: '8px', background: '#f7fafc', borderRadius: 4, border: '1px solid #e2e8f0', position: 'relative' }}>
              <div style={{ paddingRight: 80 }}>
                <strong style={{ fontSize: '0.9rem' }}>{classroom.name}</strong>
                <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: 2 }}>
                  Grade: {classroom.grade_level} • Subject: {classroom.subject?.name || 'N/A'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>
                  Type: {classroom.classroom_type || 'CORE'} • Max: {classroom.max_students || 25}
                </div>
              </div>
              
              <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                <button onClick={() => setEditingClassroom(classroom)} disabled={loading} style={{ padding: '2px 6px', background: '#ed8936', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: '0.7rem' }}>Edit</button>
                <button onClick={() => handleDelete(classroom)} disabled={loading} style={{ padding: '2px 6px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: '0.7rem' }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90%', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Create Classroom</h3>
            <ClassroomForm subjects={subjects} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {editingClassroom && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90%', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Edit Classroom</h3>
            <ClassroomForm subjects={subjects} initialData={editingClassroom} onSubmit={handleEdit} onCancel={() => setEditingClassroom(null)} />
          </div>
        </div>
      )}
    </div>
  );
}