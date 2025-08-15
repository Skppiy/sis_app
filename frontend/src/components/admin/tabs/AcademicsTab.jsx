// frontend/src/components/admin/tabs/AcademicsTab.jsx
// Academic years, subjects, and classrooms management

import { useState } from "react";
import { apiPost, apiPatch } from "../../../requestHelper";
import AcademicYearForm from "../forms/AcademicYearForm";
import SubjectForm from "../forms/SubjectForm";
import ClassroomForm from "../forms/ClassroomForm";
import Modal from "../shared/Modal";

export default function AcademicsTab({ data, onDataChange, onError, onClearError }) {
  const { academicYears, subjects, classrooms } = data;
  const [showForm, setShowForm] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const activeYear = academicYears.find(y => y.is_active);

  // Academic Year Management
  const handleCreateAcademicYear = async (yearData) => {
    try {
      onClearError();
      await apiPost("/academic-years", yearData);
      onDataChange();
      closeForm();
    } catch (e) {
      console.error("Failed to create academic year:", e);
      onError(`Failed to create academic year: ${e.message}`);
    }
  };

  const handleActivateYear = async (yearId) => {
    try {
      onClearError();
      await apiPatch(`/academic-years/${yearId}/activate`, {});
      onDataChange();
    } catch (e) {
      console.error("Failed to activate academic year:", e);
      onError(`Failed to activate academic year: ${e.message}`);
    }
  };

  // Subject Management
  const handleCreateSubject = async (subjectData) => {
    try {
      onClearError();
      await apiPost("/subjects", subjectData);
      onDataChange();
      closeForm();
    } catch (e) {
      console.error("Failed to create subject:", e);
      onError(`Failed to create subject: ${e.message}`);
    }
  };

  const handleAutoCreateSubjects = async () => {
    try {
      onClearError();
      // This would trigger the auto-create subjects script
      console.log("Auto-creating core subjects...");
      alert('Please run: python scripts/create_core_subjects.py');
      // In the future, this could be an API endpoint
    } catch (error) {
      console.error('Error creating core subjects:', error);
      onError('Error creating core subjects. Please run the script manually.');
    }
  };

  // Classroom Management
  const handleCreateClassroom = async (classroomData) => {
    try {
      onClearError();
      if (!activeYear) {
        onError("Please create and activate an academic year first.");
        return;
      }
      await apiPost("/classrooms", { ...classroomData, academic_year_id: activeYear.id });
      onDataChange();
      closeForm();
    } catch (e) {
      console.error("Failed to create classroom:", e);
      onError(`Failed to create classroom: ${e.message}`);
    }
  };

  const closeForm = () => {
    setShowForm(null);
    setEditingItem(null);
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Academic Years Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="section-title">Academic Years</h2>
            <button
              onClick={() => setShowForm('academic-year')}
              style={{ background: '#48bb78', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4 }}
            >
              ➕ Add Academic Year
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {academicYears.map(year => (
              <div key={year.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px',
                background: year.is_active ? '#c6f6d5' : '#f7fafc',
                borderRadius: 4,
                border: year.is_active ? '2px solid #48bb78' : '1px solid #e2e8f0'
              }}>
                <div>
                  <strong>{year.name}</strong>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    {year.start_date} to {year.end_date}
                  </div>
                  {year.is_active && (
                    <span style={{ background: '#48bb78', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                      Active
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {!year.is_active && (
                    <button
                      onClick={() => handleActivateYear(year.id)}
                      style={{ background: '#48bb78', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem' }}
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subjects Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="section-title">Subjects</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleAutoCreateSubjects}
                style={{ background: '#48bb78', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: '0.875rem' }}
              >
                🚀 Auto-Create Core
              </button>
              <button
                onClick={() => setShowForm('subject')}
                style={{ background: '#667eea', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: '0.875rem' }}
              >
                ➕ Add Custom
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: 12, fontSize: '0.875rem', color: '#718096' }}>
            <strong>Homeroom Intelligence:</strong> Core subjects auto-assign to elementary teachers.
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {subjects.map(subject => (
              <div key={subject.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 12px',
                background: subject.is_homeroom_default ? '#e6fffa' : '#f7fafc',
                borderRadius: 4,
                border: subject.is_homeroom_default ? '2px solid #38b2ac' : '1px solid #e2e8f0'
              }}>
                <div>
                  <strong>{subject.name}</strong> ({subject.code})
                  <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                    {subject.applies_to_elementary && 'Elementary'}
                    {subject.applies_to_elementary && subject.applies_to_middle && ' • '}
                    {subject.applies_to_middle && 'Middle School'}
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {subject.is_homeroom_default && (
                      <span style={{ background: '#38b2ac', color: 'white', padding: '1px 4px', borderRadius: 2, fontSize: '0.7rem' }}>
                        AUTO-ASSIGN
                      </span>
                    )}
                    {subject.requires_specialist && (
                      <span style={{ background: '#f6ad55', color: 'white', padding: '1px 4px', borderRadius: 2, fontSize: '0.7rem' }}>
                        SPECIALIST
                      </span>
                    )}
                    {subject.is_system_core && (
                      <span style={{ background: '#9f7aea', color: 'white', padding: '1px 4px', borderRadius: 2, fontSize: '0.7rem' }}>
                        SYSTEM
                      </span>
                    )}
                    <span style={{ 
                      background: subject.subject_type === 'CORE' ? '#48bb78' : subject.subject_type === 'ENRICHMENT' ? '#667eea' : '#e53e3e', 
                      color: 'white', 
                      padding: '1px 4px', 
                      borderRadius: 2, 
                      fontSize: '0.7rem' 
                    }}>
                      {subject.subject_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Classrooms Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-title">Classrooms - {activeYear ? activeYear.name : 'No Active Year'}</h2>
          {activeYear && (
            <button
              onClick={() => setShowForm('classroom')}
              style={{ background: '#667eea', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4 }}
            >
              ➕ Add Classroom
            </button>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
          {classrooms.map(classroom => (
            <div key={classroom.id} className="card" style={{ margin: 0 }}>
              <h3 style={{ margin: '0 0 8px 0' }}>{classroom.name}</h3>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                Grade: {classroom.grade_level} • Subject: {classroom.subject?.name || 'N/A'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: 4 }}>
                Type: {classroom.classroom_type} • Max: {classroom.max_students || 'No limit'}
              </div>
              <div style={{ marginTop: 8, fontSize: '0.875rem' }}>
                Enrolled: {classroom.enrollment_count || 0} students
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forms */}
      {showForm === 'academic-year' && (
        <Modal onClose={closeForm} title="Add Academic Year">
          <AcademicYearForm
            onSubmit={handleCreateAcademicYear}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {showForm === 'subject' && (
        <Modal onClose={closeForm} title="Add Custom Subject">
          <SubjectForm
            onSubmit={handleCreateSubject}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {showForm === 'classroom' && (
        <Modal onClose={closeForm} title="Add Classroom">
          <ClassroomForm
            subjects={subjects}
            onSubmit={handleCreateClassroom}
            onCancel={closeForm}
          />
        </Modal>
      )}
    </>
  );
}