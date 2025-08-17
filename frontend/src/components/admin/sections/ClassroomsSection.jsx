// frontend/src/components/admin/sections/ClassroomsSection.jsx
// Focused smart classroom management

import { useState } from "react";
import { apiPost, apiDelete } from "../../../requestHelper";
import SmartClassroomForm from "../forms/SmartClassroomForm";
import { isElementaryGrade } from "../../../utils/gradeUtils";

export default function ClassroomsSection({ data, onDataChange, onError }) {
  const { academicYears, subjects, classrooms, users, rooms } = data;
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);

  const activeYear = academicYears?.find(y => y.is_active);
  const teachers = users?.filter(u => u.roles?.some(r => r.role === 'teacher')) || [];
  const coreSubjects = subjects?.filter(s => s.is_homeroom_default) || [];

  const openForm = (classroom = null) => {
    setEditingClassroom(classroom);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingClassroom(null);
  };

  const handleSubmit = async (formData) => {
    try {
      const isElementary = isElementaryGrade(formData.grade_level);
      const endpoint = isElementary ? "/classrooms/homeroom" : "/classrooms/subject-specific";
      
      await apiPost(endpoint, formData);
      
      if (typeof onDataChange === 'function') {
        await onDataChange();
      }
      
      closeForm();
    } catch (e) {
      console.error("Failed to save classroom:", e);
      const errorMessage = e.response?.data?.detail || e.message || "Unknown error occurred";
      
      if (typeof onError === 'function') {
        onError(`Failed to save classroom: ${errorMessage}`);
      }
    }
  };

  const deleteClassroom = async (classroomId) => {
    if (!confirm("Are you sure you want to delete this classroom?")) return;
    
    try {
      await apiDelete(`/classrooms/${classroomId}`);
      if (typeof onDataChange === 'function') {
        await onDataChange();
      }
    } catch (e) {
      console.error("Failed to delete classroom:", e);
      const errorMessage = e.response?.data?.detail || e.message || "Unknown error occurred";
      
      if (typeof onError === 'function') {
        onError(`Failed to delete classroom: ${errorMessage}`);
      }
    }
  };

  return (
    <>
      <div className="card" style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Smart Classrooms ({classrooms?.length || 0})</h3>
          <button
            onClick={() => openForm()}
            disabled={!activeYear || !subjects?.length || !teachers?.length}
            style={{ 
              background: (!activeYear || !subjects?.length || !teachers?.length) ? '#a0aec0' : '#667eea', 
              color: 'white', 
              border: 'none', 
              padding: '4px 8px', 
              borderRadius: 4,
              cursor: (!activeYear || !subjects?.length || !teachers?.length) ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ➕ Add Smart Classroom
          </button>
        </div>
        
        {/* Smart Classroom Info */}
        <div style={{ 
          background: '#f0f9ff', 
          padding: 12, 
          borderRadius: 4, 
          marginBottom: 12,
          fontSize: '0.875rem',
          color: '#0c4a6e'
        }}>
          <strong>🧠 Smart Classroom Creation:</strong><br/>
          • <strong>Elementary (K-5):</strong> Creates homeroom + auto-assigns all core subjects<br/>
          • <strong>Middle School (6-8):</strong> Creates subject-specific classroom<br/>
          • <strong>Core Subjects Available:</strong> {coreSubjects.length} subjects marked for auto-assignment
        </div>
        
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
        ) : !subjects?.length ? (
          <div style={{ 
            background: '#fed7d7', 
            color: '#c53030', 
            padding: 12, 
            borderRadius: 4, 
            marginBottom: 12,
            fontSize: '0.875rem'
          }}>
            ⚠️ Please create subjects before creating classrooms.
          </div>
        ) : !teachers?.length ? (
          <div style={{ 
            background: '#fed7d7', 
            color: '#c53030', 
            padding: 12, 
            borderRadius: 4, 
            marginBottom: 12,
            fontSize: '0.875rem'
          }}>
            ⚠️ No teachers available. Please add teachers first.
          </div>
        ) : classrooms?.length === 0 ? (
          <div style={{ 
            background: '#f0fff4', 
            color: '#22543d', 
            padding: 12, 
            borderRadius: 4, 
            marginBottom: 12,
            fontSize: '0.875rem'
          }}>
            ✅ Ready to create smart classrooms! You have {subjects.length} subjects and {teachers.length} teachers available.
          </div>
        ) : null}
        
        {/* Classrooms Display */}
        {classrooms?.length === 0 ? (
          <p style={{ color: '#718096', fontStyle: 'italic', fontSize: '0.875rem' }}>
            No classrooms created yet.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {classrooms?.map(classroom => (
              <div key={classroom.id} className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>{classroom.name}</h4>
                    
                    {/* Classroom Type Badge */}
                    <div style={{ marginBottom: 8 }}>
                      {isElementaryGrade(classroom.grade_level) ? (
                        <span style={{ 
                          background: '#0d9488', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: 4, 
                          fontSize: '0.75rem' 
                        }}>
                          🏫 HOMEROOM
                        </span>
                      ) : (
                        <span style={{ 
                          background: '#7c3aed', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: 4, 
                          fontSize: '0.75rem' 
                        }}>
                          📚 SUBJECT-SPECIFIC
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                      <div>Grade: {classroom.grade_level}</div>
                      <div>Subject: {classroom.subject?.name || 'Multiple (Homeroom)'}</div>
                      {classroom.max_students && (
                        <div>Max Students: {classroom.max_students}</div>
                      )}
                      {classroom.room && (
                        <div>Room: {classroom.room.name} ({classroom.room.room_code})</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      onClick={() => openForm(classroom)}
                      style={{ 
                        background: '#4299e1', 
                        color: 'white', 
                        border: 'none', 
                        padding: '4px 8px', 
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteClassroom(classroom.id)}
                      style={{ 
                        background: '#e53e3e', 
                        color: 'white', 
                        border: 'none', 
                        padding: '4px 8px', 
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Classroom Form Modal */}
      {showForm && (
        <SmartClassroomForm
          classroom={editingClassroom}
          data={{ subjects, teachers, rooms, activeYear, coreSubjects }}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}
    </>
  );
}