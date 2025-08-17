// frontend/src/components/admin/sections/ClassroomsSection.jsx
// Updated with better teacher assignment display and SmartClassroomForm integration

import { useState } from "react";
import { apiPost, apiPut, apiDelete } from "../../../requestHelper";
import SmartClassroomForm from "../forms/SmartClassroomForm";
import ErrorBanner from "../shared/ErrorBanner";

export default function ClassroomsSection({ classrooms, subjects, onDataChange, allData }) {
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { academicYears = [], users = [] } = allData || {};
  const activeYear = academicYears.find(y => y.is_active);
  const coreSubjects = subjects.filter(s => s.is_homeroom_default) || [];

  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      setError("");
      
      // Determine which endpoint to use based on grade level
      const isElementary = ['K', '1', '2', '3', '4', '5'].includes(formData.grade_level);
      const endpoint = isElementary ? "/classrooms/homeroom" : "/classrooms";
      
      console.log(`Creating classroom via ${endpoint}:`, formData);
      
      await apiPost(endpoint, formData);
      if (onDataChange) await onDataChange();
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create classroom:", err);
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

  // Group classrooms by grade for better organization
  const classroomsByGrade = classrooms.reduce((acc, classroom) => {
    const grade = classroom.grade_level || 'Unassigned';
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(classroom);
    return acc;
  }, {});

  // Sort grades logically
  const sortedGrades = Object.keys(classroomsByGrade).sort((a, b) => {
    if (a === 'Unassigned') return 1;
    if (b === 'Unassigned') return -1;
    if (a === 'K') return -1;
    if (b === 'K') return 1;
    return parseInt(a) - parseInt(b);
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>Classrooms ({classrooms.length})</h3>
        <button
          onClick={() => setShowForm(true)}
          disabled={loading || !activeYear || subjects.length === 0}
          style={{
            padding: '6px 12px',
            background: (!activeYear || subjects.length === 0) ? '#a0aec0' : '#9f7aea',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: (loading || !activeYear || subjects.length === 0) ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
          title={!activeYear ? "Create active academic year first" : subjects.length === 0 ? "Create subjects first" : "Create smart classroom"}
        >
          + Add Smart Classroom
        </button>
      </div>

      <ErrorBanner error={error} onClear={() => setError("")} />

      {/* Prerequisites Check */}
      {!activeYear ? (
        <div style={{ 
          background: '#fed7d7', 
          color: '#c53030', 
          padding: 12, 
          borderRadius: 4, 
          marginBottom: 12,
          fontSize: '0.875rem'
        }}>
          ⚠️ Please create and activate an academic year first.
        </div>
      ) : subjects.length === 0 ? (
        <div style={{ 
          background: '#fed7d7', 
          color: '#c53030', 
          padding: 12, 
          borderRadius: 4, 
          marginBottom: 12,
          fontSize: '0.875rem'
        }}>
          ⚠️ Please create subjects before adding classrooms.
        </div>
      ) : coreSubjects.length === 0 ? (
        <div style={{ 
          background: '#fff3cd', 
          color: '#856404', 
          padding: 12, 
          borderRadius: 4, 
          marginBottom: 12,
          fontSize: '0.875rem'
        }}>
          💡 <strong>Tip:</strong> Mark core subjects (Math, English, Science, Social Studies) as "homeroom default" to enable elementary auto-assignment.
        </div>
      ) : null}

      {/* Classrooms by Grade */}
      {sortedGrades.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#718096',
          fontStyle: 'italic',
          background: '#f7fafc',
          borderRadius: 4,
          border: '2px dashed #e2e8f0'
        }}>
          No classrooms created yet. {activeYear && subjects.length > 0 ? 'Create your first smart classroom!' : ''}
        </div>
      ) : (
        sortedGrades.map(grade => (
          <div key={grade} style={{ marginBottom: 20 }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              color: '#4a5568',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 4
            }}>
              Grade {grade} ({classroomsByGrade[grade].length})
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {classroomsByGrade[grade].map(classroom => (
                <div 
                  key={classroom.id} 
                  style={{ 
                    padding: '16px',
                    background: '#f7fafc',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    position: 'relative'
                  }}
                >
                  <div style={{ paddingRight: 60 }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>
                      {classroom.name}
                    </h5>
                    
                    <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: 8 }}>
                      <div>Subject: {classroom.subject?.name || 'N/A'} ({classroom.subject?.code || 'N/A'})</div>
                      <div>Type: {classroom.classroom_type || 'CORE'}</div>
                      <div>Max Students: {classroom.max_students || 25}</div>
                      {classroom.room && (
                        <div>Room: {classroom.room.name} ({classroom.room.room_code})</div>
                      )}
                    </div>

                    {/* Teacher Assignment Display */}
                    <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                      <strong>Teacher:</strong> {
                        classroom.teacher_assignments && classroom.teacher_assignments.length > 0 
                          ? classroom.teacher_assignments.map(ta => 
                              `${ta.teacher?.first_name || 'Unknown'} ${ta.teacher?.last_name || 'Teacher'}`
                            ).join(', ')
                          : <span style={{ fontStyle: 'italic', color: '#718096' }}>No teacher assigned</span>
                      }
                    </div>
                  </div>
                  
                  <div style={{ 
                    position: 'absolute', 
                    top: 12, 
                    right: 12, 
                    display: 'flex', 
                    gap: 6 
                  }}>
                    <button
                      onClick={() => setEditingClassroom(classroom)}
                      disabled={loading}
                      style={{
                        padding: '4px 8px',
                        background: '#ed8936',
                        color: 'white',
                        border: 'none',
                        borderRadius: 3,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(classroom)}
                      disabled={loading}
                      style={{
                        padding: '4px 8px',
                        background: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: 3,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Smart Classroom Form */}
      {showForm && (
        <SmartClassroomForm
          data={{ subjects, activeYear, coreSubjects }}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingClassroom && (
        <SmartClassroomForm
          classroom={editingClassroom}
          data={{ subjects, activeYear, coreSubjects }}
          onSubmit={handleEdit}
          onCancel={() => setEditingClassroom(null)}
        />
      )}
    </div>
  );
}