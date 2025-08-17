// frontend/src/components/admin/tabs/StudentsTab.jsx
// Fixed student management interface

import React from 'react';
import StudentListContainer from '../student/StudentListContainer';

function StudentsTab({ data }) {
  return (
    <div>
      <StudentListContainer />
    </div>
  );
}

// Single clean export
export default StudentsTab;