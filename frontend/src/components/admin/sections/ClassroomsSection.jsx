// frontend/src/components/admin/sections/ClassroomsSection.jsx
// Enhanced with Grade and Room view modes

import { useState } from "react";
import { apiPost, apiPut, apiDelete } from "../../../requestHelper";
import SmartClassroomForm from "../forms/SmartClassroomForm";
import ErrorBanner from "../shared/ErrorBanner";

export default function ClassroomsSection({ classrooms, subjects, onDataChange, allData }) {
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grade"); // "grade" or "room"

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
      
      console.log("Updating classroom:", editingClassroom.id, formData);
      
      // Use PUT endpoint for updates
      await apiPut(`/classrooms/${editingClassroom.id}`, formData);
      if (onDataChange) await onDataChange();
      setEditingClassroom(null);
    } catch (err) {
      console.error("Failed to update classroom:", err);
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
      console.error("Failed to delete classroom:", err);
      setError(`Failed to delete classroom: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get primary teacher name
  const getPrimaryTeacherName = (classroom) => {
    if (!classroom.teacher_assignments || classroom.teacher_assignments.length === 0) {
      return "No teacher assigned";
    }
    
    const primaryTeacher = classroom.teacher_assignments.find(ta => 
      ta.is_active && (ta.role_name === 'Homeroom Teacher' || ta.role_name === 'Primary Teacher')
    );
    
    if (primaryTeacher && primaryTeacher.teacher) {
      return `${primaryTeacher.teacher.first_name} ${primaryTeacher.teacher.last_name}`;
    }
    
    // Fallback to first active teacher
    const firstActive = classroom.teacher_assignments.find(ta => ta.is_active && ta.teacher);
    return firstActive ? `${firstActive.teacher.first_name} ${firstActive.teacher.last_name}` : "Unknown teacher";
  };

  // Helper function to get room display
  const getRoomDisplay = (classroom) => {
    if (classroom.room) {
      return `${classroom.room.name} (${classroom.room.room_code})`;
    }
    return "No room assigned";
  };

  // Group classrooms by grade level
  const classroomsByGrade = classrooms.reduce((acc, classroom) => {
    const grade = classroom.grade_level;
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(classroom);
    return acc;
  }, {});

  // Group classrooms by room
  const classroomsByRoom = classrooms.reduce((acc, classroom) => {
    const roomKey = classroom.room ? `${classroom.room.name} (${classroom.room.room_code})` : "No Room Assigned";
    if (!acc[roomKey]) acc[roomKey] = [];
    acc[roomKey].push(classroom);
    return acc;
  }, {});

  const gradeLevelOrder = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];

  const renderClassroomCard = (classroom) => (
    <div 
      key={classroom.id} 
      style={{ 
        padding: '12px', 
        background: '#fafafa', 
        border: '1px solid #e2e8f0', 
        borderRadius: 4, 
        marginBottom: 8
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Classroom Name */}
          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 4 }}>
            {classroom.name}
          </div>
          
          {/* Compact Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.8rem', color: '#4a5568' }}>
            <div><strong>Subject:</strong> {classroom.subject?.name || 'Unknown'}</div>
            <div><strong>Capacity:</strong> {classroom.max_students || 'Unlimited'}</div>
            
            <div><strong>Teacher:</strong> {getPrimaryTeacherName(classroom)}</div>
            <div><strong>Students:</strong> {classroom.enrollment_count || 0}</div>
            
            {viewMode === "grade" && (
              <div><strong>Room:</strong> {getRoomDisplay(classroom)}</div>
            )}
            {viewMode === "room" && (
              <div><strong>Grade:</strong> {classroom.grade_level}</div>
            )}
          </div>

          {/* Special Indicators */}
          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
            {classroom.classroom_type === 'HOMEROOM' && (
              <span style={{ 
                background: '#38b2ac', 
                color: 'white', 
                padding: '1px 4px', 
                borderRadius: 2, 
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                🏫 HOMEROOM
              </span>
            )}
            
            {classroom.subject?.is_homeroom_default && (
              <span style={{ 
                background: '#ed8936', 
                color: 'white', 
                padding: '1px 4px', 
                borderRadius: 2, 
                fontSize: '0.7rem'
              }}>
                CORE
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          <button 
            onClick={() => setEditingClassroom(classroom)} 
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
            onClick={() => handleDelete(classroom)} 
            disabled={loading}
            style={{ 
              padding: '3px 6px', 
              background: '#e53e3e', 
              color: 'white', 
              border: 'none', 
              borderRadius: 2, 
              cursor: 'pointer', 
              fontSize: '0.7rem'
            }}
          >
            Del
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>Classrooms ({classrooms.length})</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: 4, overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode("grade")}
              style={{
                padding: '4px 8px',
                background: viewMode === "grade" ? '#667eea' : 'white',
                color: viewMode === "grade" ? 'white' : '#4a5568',
                border: 'none',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              👨‍🎓 By Grade
            </button>
            <button
              onClick={() => setViewMode("room")}
              style={{
                padding: '4px 8px',
                background: viewMode === "room" ? '#667eea' : 'white',
                color: viewMode === "room" ? 'white' : '#4a5568',
                border: 'none',
                borderLeft: '1px solid #ccc',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              🏢 By Room
            </button>
          </div>
          
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
            + Add Smart Classroom
          </button>
        </div>
      </div>

      <ErrorBanner error={error} onClear={() => setError("")} />

      {classrooms.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px', 
          color: '#718096', 
          fontStyle: 'italic', 
          background: '#f7fafc', 
          borderRadius: 4, 
          border: '2px dashed #e2e8f0' 
        }}>
          No classrooms created yet. Create your first smart classroom!
        </div>
      ) : (
        <div>
          {viewMode === "grade" ? (
            // Grade View
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {gradeLevelOrder
                .filter(grade => classroomsByGrade[grade])
                .map(grade => (
                  <div key={grade}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1rem', 
                      marginBottom: 8, 
                      color: '#2d3748',
                      borderBottom: '2px solid #e2e8f0',
                      paddingBottom: 4
                    }}>
                      Grade {grade} ({classroomsByGrade[grade].length} classroom{classroomsByGrade[grade].length !== 1 ? 's' : ''})
                    </div>
                    {classroomsByGrade[grade].map(renderClassroomCard)}
                  </div>
                ))}
            </div>
          ) : (
            // Room View
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(classroomsByRoom)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([roomName, roomClassrooms]) => (
                  <div key={roomName}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1rem', 
                      marginBottom: 8, 
                      color: '#2d3748',
                      borderBottom: '2px solid #e2e8f0',
                      paddingBottom: 4
                    }}>
                      {roomName} ({roomClassrooms.length} classroom{roomClassrooms.length !== 1 ? 's' : ''})
                    </div>
                    {roomClassrooms.map(renderClassroomCard)}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <SmartClassroomForm 
          data={{ subjects, activeYear }}
          onSubmit={handleCreate} 
          onCancel={() => setShowForm(false)} 
        />
      )}

      {/* Edit Modal */}
      {editingClassroom && (
        <SmartClassroomForm 
          classroom={editingClassroom}
          data={{ subjects, activeYear }}
          onSubmit={handleEdit} 
          onCancel={() => setEditingClassroom(null)} 
        />
      )}
    </div>
  );
}