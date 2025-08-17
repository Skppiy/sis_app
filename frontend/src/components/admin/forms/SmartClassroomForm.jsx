// frontend/src/components/admin/forms/SmartClassroomForm.jsx
// Fixed API endpoints and teacher loading

import { useState, useEffect } from "react";
import { apiGet } from "../../../requestHelper";
import FormField from "../shared/FormField";

export default function SmartClassroomForm({ classroom = null, data, onSubmit, onCancel }) {
  const { subjects, activeYear } = data;
  const isEditing = !!classroom;
  
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    teacher_id: classroom?.teacher_id || '',
    grade_level: classroom?.grade_level || '',
    room_id: classroom?.room_id || '',
    subject_id: classroom?.subject_id || '', // For middle school only
    max_students: classroom?.max_students || 25,
    academic_year_id: activeYear?.id || ''
  });

  const [error, setError] = useState("");

  // Load teachers and rooms on mount
  useEffect(() => {
    loadTeachersAndRooms();
  }, []);

  const loadTeachersAndRooms = async () => {
    try {
      setDataLoading(true);
      const [usersRes, roomsRes] = await Promise.all([
        apiGet("/admin/users"), // Fixed: Remove the ?role=teacher parameter
        apiGet("/rooms")
      ]);
      
      // Filter users to get only teachers
      const teacherUsers = usersRes.filter(u => 
        u.roles?.some(r => r.role === 'teacher' || r.role === 'admin') || 
        u.role === 'teacher' || 
        u.user_type === 'teacher'
      ) || [];
      
      console.log("Available teachers:", teacherUsers);
      console.log("Available rooms:", roomsRes);
      
      setTeachers(teacherUsers);
      setRooms(roomsRes || []);
    } catch (err) {
      console.error("Failed to load teachers/rooms:", err);
      setError(`Failed to load teachers and rooms: ${err.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  // Determine if this is elementary or middle school
  const isElementary = formData.grade_level && ['K', '1', '2', '3', '4', '5'].includes(formData.grade_level);
  const isMiddleSchool = formData.grade_level && ['6', '7', '8'].includes(formData.grade_level);
  
  // Get core subjects for homeroom display
  const coreSubjects = subjects.filter(s => s.is_homeroom_default) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validation
      if (!formData.teacher_id || !formData.grade_level || !formData.academic_year_id) {
        throw new Error("Teacher, grade level, and academic year are required");
      }

      if (isMiddleSchool && !formData.subject_id) {
        throw new Error("Subject is required for middle school classrooms");
      }

      // Auto-generate classroom name if not provided
      const selectedTeacher = teachers.find(t => t.id === formData.teacher_id);
      let classroomName = formData.name;
      
      if (!classroomName && selectedTeacher) {
        if (isElementary) {
          classroomName = `${selectedTeacher.first_name} ${selectedTeacher.last_name}'s Grade ${formData.grade_level} Homeroom`;
        } else {
          const selectedSubject = subjects.find(s => s.id === formData.subject_id);
          classroomName = `Grade ${formData.grade_level} ${selectedSubject?.name || 'Subject'} - ${selectedTeacher.first_name} ${selectedTeacher.last_name}`;
        }
      }

      const submitData = {
        ...formData,
        name: classroomName
      };

      console.log("Submitting classroom data:", submitData);
      await onSubmit(submitData);
    } catch (err) {
      setError(err.message || "Failed to create classroom");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear subject when switching to elementary
    if (field === 'grade_level' && ['K', '1', '2', '3', '4', '5'].includes(value)) {
      setFormData(prev => ({ ...prev, subject_id: '' }));
    }
  };

  const gradeLevels = [
    { value: 'K', label: 'Kindergarten', division: 'Elementary' },
    { value: '1', label: '1st Grade', division: 'Elementary' },
    { value: '2', label: '2nd Grade', division: 'Elementary' },
    { value: '3', label: '3rd Grade', division: 'Elementary' },
    { value: '4', label: '4th Grade', division: 'Elementary' },
    { value: '5', label: '5th Grade', division: 'Elementary' },
    { value: '6', label: '6th Grade', division: 'Middle School' },
    { value: '7', label: '7th Grade', division: 'Middle School' },
    { value: '8', label: '8th Grade', division: 'Middle School' }
  ];

  if (dataLoading) {
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
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          Loading teachers and rooms...
        </div>
      </div>
    );
  }

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
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90%',
        overflow: 'auto'
      }}>
        <h3 style={{ marginTop: 0 }}>
          {isEditing ? 'Edit' : 'Create'} Smart Classroom
        </h3>

        {/* Smart Classroom Intelligence Info */}
        <div style={{ 
          background: '#f0f9ff', 
          padding: 16, 
          borderRadius: 6, 
          marginBottom: 20,
          fontSize: '0.875rem',
          color: '#0c4a6e'
        }}>
          <strong>🧠 Smart Classroom Intelligence:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li><strong>Elementary (K-5):</strong> Creates homeroom + auto-assigns {coreSubjects.length} core subjects</li>
            <li><strong>Middle School (6-8):</strong> Creates subject-specific classroom</li>
          </ul>
          {coreSubjects.length > 0 && (
            <div style={{ fontSize: '0.8rem', marginTop: 8, color: '#1e40af' }}>
              <strong>Core Subjects Available:</strong> {coreSubjects.map(s => s.name).join(', ')}
            </div>
          )}
        </div>

        {error && (
          <div style={{ 
            background: '#fed7d7', 
            color: '#c53030', 
            padding: 12, 
            borderRadius: 4, 
            marginBottom: 16
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Grade Level Selection - First to drive intelligence */}
          <FormField label="Grade Level" required>
            <select
              value={formData.grade_level}
              onChange={(e) => handleChange('grade_level', e.target.value)}
              style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
              required
            >
              <option value="">Select Grade Level</option>
              {gradeLevels.map(grade => (
                <option key={grade.value} value={grade.value}>
                  {grade.label} ({grade.division})
                </option>
              ))}
            </select>
          </FormField>

          {/* Intelligence Display */}
          {formData.grade_level && (
            <div style={{ 
              background: isElementary ? '#f0fff4' : '#fffbeb', 
              border: `1px solid ${isElementary ? '#9ae6b4' : '#fed7aa'}`,
              padding: 12, 
              borderRadius: 4, 
              marginBottom: 16
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                {isElementary ? '🏫 Elementary Homeroom' : '📚 Middle School Subject Classroom'}
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {isElementary 
                  ? `Will create homeroom and auto-assign ${coreSubjects.length} core subjects to this teacher`
                  : 'Will create subject-specific classroom for departmentalized teaching'
                }
              </div>
            </div>
          )}

          {/* Teacher Selection */}
          <FormField label="Teacher" required>
            <select
              value={formData.teacher_id}
              onChange={(e) => handleChange('teacher_id', e.target.value)}
              style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
              required
            >
              <option value="">Select Teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name} ({teacher.email})
                </option>
              ))}
            </select>
            {teachers.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: '#e53e3e', marginTop: 4 }}>
                No teachers found. Please add teachers first.
              </div>
            )}
          </FormField>

          {/* Subject Selection (Middle School Only) */}
          {isMiddleSchool && (
            <FormField label="Subject" required>
              <select
                value={formData.subject_id}
                onChange={(e) => handleChange('subject_id', e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code}) - {subject.subject_type}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {/* Room Assignment */}
          <FormField label="Room Assignment">
            <select
              value={formData.room_id}
              onChange={(e) => handleChange('room_id', e.target.value)}
              style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            >
              <option value="">No Room Assigned</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.room_code}) - {room.room_type} - Capacity: {room.capacity}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: 4 }}>
              Optional: Assign a physical room to this classroom
            </div>
          </FormField>

          {/* Maximum Students */}
          <FormField label="Maximum Students">
            <input
              type="number"
              value={formData.max_students}
              onChange={(e) => handleChange('max_students', parseInt(e.target.value))}
              min="1"
              max="50"
              style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            />
          </FormField>

          {/* Academic Year (Hidden, auto-filled) */}
          <input type="hidden" value={formData.academic_year_id} />

          {/* Preview of what will be created */}
          {formData.grade_level && formData.teacher_id && (
            <div style={{ 
              background: '#f7fafc', 
              padding: 12, 
              borderRadius: 4, 
              marginBottom: 16,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Preview:</div>
              <div style={{ fontSize: '0.875rem' }}>
                <div><strong>Classroom Name:</strong> {(() => {
                  const teacher = teachers.find(t => t.id === formData.teacher_id);
                  if (!teacher) return "Select teacher first";
                  
                  if (isElementary) {
                    return `${teacher.first_name} ${teacher.last_name}'s Grade ${formData.grade_level} Homeroom`;
                  } else {
                    const subject = subjects.find(s => s.id === formData.subject_id);
                    return `Grade ${formData.grade_level} ${subject?.name || '[Select Subject]'} - ${teacher.first_name} ${teacher.last_name}`;
                  }
                })()}</div>
                
                <div><strong>Type:</strong> {isElementary ? 'Homeroom' : 'Subject-Specific'}</div>
                
                {isElementary && coreSubjects.length > 0 && (
                  <div><strong>Auto-Assigned Subjects:</strong> {coreSubjects.map(s => s.name).join(', ')}</div>
                )}
                
                {formData.room_id && (
                  <div><strong>Room:</strong> {rooms.find(r => r.id === formData.room_id)?.name || 'Unknown'}</div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button 
              type="button" 
              onClick={onCancel}
              disabled={loading}
              style={{ 
                padding: '8px 16px', 
                border: '1px solid #ccc', 
                borderRadius: 4, 
                background: 'white', 
                cursor: loading ? 'not-allowed' : 'pointer' 
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !formData.grade_level || !formData.teacher_id || (isMiddleSchool && !formData.subject_id)}
              style={{ 
                padding: '8px 16px', 
                border: 'none', 
                borderRadius: 4, 
                background: loading ? '#a0aec0' : '#667eea', 
                color: 'white', 
                cursor: loading ? 'not-allowed' : 'pointer' 
              }}
            >
              {loading ? 'Creating...' : (isEditing ? 'Update' : 'Create')} Smart Classroom
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
