// frontend/src/components/admin/student/StudentCard.jsx
// Reusable student display component

import React from 'react';
import SpecialNeedsIndicator from './SpecialNeedsIndicator';
import StudentQuickActions from './StudentQuickActions';

export default function StudentCard({ 
  student, 
  showActions = true, 
  onClick = null,
  onEdit = null,
  onEnroll = null,
  onView = null,
  compact = false 
}) {
  const cardStyle = {
    padding: compact ? '12px' : '16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    background: '#ffffff',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    ':hover': onClick ? {
      borderColor: '#3182ce',
      boxShadow: '0 2px 8px rgba(49, 130, 206, 0.15)'
    } : {}
  };

  const handleCardClick = (e) => {
    if (onClick && !e.target.closest('.student-actions')) {
      onClick(student);
    }
  };

  return (
    <div style={cardStyle} onClick={handleCardClick}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        {/* Student Info */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '4px'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: compact ? '1rem' : '1.1rem',
              fontWeight: '600',
              color: '#2d3748'
            }}>
              {student.first_name} {student.last_name}
            </h3>
            <SpecialNeedsIndicator 
              specialNeeds={student.special_needs || []} 
              compact={compact}
            />
          </div>

          <div style={{ 
            fontSize: '0.875rem', 
            color: '#718096',
            lineHeight: '1.4'
          }}>
            <div>Grade {student.grade_level}</div>
            {student.student_id && (
              <div>ID: {student.student_id}</div>
            )}
            {student.homeroom && (
              <div>Homeroom: {student.homeroom.name}</div>
            )}
            {!compact && student.enrollment_count && (
              <div>{student.enrollment_count} enrollments</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="student-actions">
            <StudentQuickActions
              student={student}
              onEdit={onEdit}
              onEnroll={onEnroll}
              onView={onView}
              compact={compact}
            />
          </div>
        )}
      </div>
    </div>
  );
}



