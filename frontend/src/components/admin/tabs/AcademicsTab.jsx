// frontend/src/components/admin/tabs/AcademicsTab.jsx
// Updated to pass all data to ClassroomsSection

import AcademicYearsSection from "../sections/AcademicYearsSection";
import SubjectsSection from "../sections/SubjectsSection";  
import ClassroomsSection from "../sections/ClassroomsSection";

export default function AcademicsTab({ data, onDataChange }) {
  const { academicYears, subjects, classrooms } = data;

  return (
    <div className="card">
      <h2 className="section-title">Academic Management</h2>
      <p style={{ color: '#718096', marginBottom: '24px' }}>
        Manage academic structure: years, subjects, and classrooms. All changes are immediately saved.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Academic Years Section */}
        <AcademicYearsSection 
          academicYears={academicYears}
          onDataChange={onDataChange}
        />
        
        {/* Two-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <SubjectsSection 
            subjects={subjects}
            onDataChange={onDataChange}
          />
          
          <ClassroomsSection 
            classrooms={classrooms}
            subjects={subjects}
            onDataChange={onDataChange}
            allData={data}
          />
        </div>
      </div>
    </div>
  );
}