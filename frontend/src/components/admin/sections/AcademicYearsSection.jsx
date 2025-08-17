// frontend/src/components/admin/sections/AcademicYearsSection.jsx
// Focused academic years management - 80 lines

import { useState } from "react";
import { apiPost, apiPut, apiDelete } from "../../../requestHelper";
import AcademicYearForm from "../forms/AcademicYearForm";
import ErrorBanner from "../shared/ErrorBanner";

export default function AcademicYearsSection({ academicYears, onDataChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      setError("");
      await apiPost("/academic-years", formData);
      if (onDataChange) await onDataChange();
      setShowForm(false);
    } catch (err) {
      setError(`Failed to create academic year: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    try {
      setLoading(true);
      setError("");
      await apiPut(`/academic-years/${editingYear.id}`, formData);
      if (onDataChange) await onDataChange();
      setEditingYear(null);
    } catch (err) {
      setError(`Failed to update academic year: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (year) => {
    if (!confirm(`Delete academic year "${year.name}"? This cannot be undone.`)) return;
    try {
      setLoading(true);
      setError("");
      await apiDelete(`/academic-years/${year.id}`);
      if (onDataChange) await onDataChange();
    } catch (err) {
      setError(`Failed to delete academic year: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (year) => {
    try {
      setLoading(true);
      setError("");
      await apiPut(`/academic-years/${year.id}`, { ...year, is_active: true });
      if (onDataChange) await onDataChange();
    } catch (err) {
      setError(`Failed to activate academic year: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>Academic Years ({academicYears.length})</h3>
        <button
          onClick={() => setShowForm(true)}
          disabled={loading}
          style={{
            padding: '6px 12px',
            background: '#48bb78',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          + Add Year
        </button>
      </div>

      <ErrorBanner error={error} onClear={() => setError("")} />

      {academicYears.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#718096', fontStyle: 'italic', background: '#f7fafc', borderRadius: 4, border: '2px dashed #e2e8f0' }}>
          No academic years created yet. Create your first academic year to get started!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {academicYears.map(year => (
            <div key={year.id} style={{ 
              padding: '12px', background: year.is_active ? '#c6f6d5' : '#f7fafc', borderRadius: 6,
              border: year.is_active ? '2px solid #48bb78' : '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{year.name}</strong>
                  {year.is_active && (
                    <span style={{ background: '#48bb78', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>Active</span>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: 4 }}>
                  {year.start_date} to {year.end_date}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                {!year.is_active && (
                  <button onClick={() => handleActivate(year)} disabled={loading} style={{ padding: '4px 8px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.875rem' }}>
                    Activate
                  </button>
                )}
                <button onClick={() => setEditingYear(year)} disabled={loading} style={{ padding: '4px 8px', background: '#ed8936', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.875rem' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(year)} disabled={loading || year.is_active} style={{ padding: '4px 8px', background: year.is_active ? '#a0aec0' : '#e53e3e', color: 'white', border: 'none', borderRadius: 4, cursor: (loading || year.is_active) ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90%', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Create Academic Year</h3>
            <AcademicYearForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {editingYear && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90%', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Edit Academic Year</h3>
            <AcademicYearForm initialData={editingYear} onSubmit={handleEdit} onCancel={() => setEditingYear(null)} />
          </div>
        </div>
      )}
    </div>
  );
}