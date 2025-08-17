// frontend/src/services/enrollmentService.js
// Enrollment and classroom assignment logic

export class EnrollmentService {
    // Core enrollment operations
    static async getStudentEnrollments(studentId) {
      return apiGet(`/students/${studentId}/enrollments`);
    }
  
    static async enrollStudent(studentId, classroomId, enrollmentData = {}) {
      return apiPost('/enrollments', {
        student_id: studentId,
        classroom_id: classroomId,
        ...enrollmentData
      });
    }
  
    static async unenrollStudent(enrollmentId) {
      return apiDelete(`/enrollments/${enrollmentId}`);
    }
  
    static async transferStudent(studentId, fromClassroomId, toClassroomId, transferDate = null) {
      return apiPost(`/students/${studentId}/transfer`, {
        from_classroom_id: fromClassroomId,
        to_classroom_id: toClassroomId,
        transfer_date: transferDate || new Date().toISOString().split('T')[0]
      });
    }
  
    // Smart enrollment features
    static async enrollInHomeroom(studentId, homeroomClassroomId, academicYearId) {
      // This will auto-enroll in all core subjects for the grade
      return apiPost(`/students/${studentId}/enroll-homeroom`, {
        homeroom_classroom_id: homeroomClassroomId,
        academic_year_id: academicYearId
      });
    }
  
    static async bulkEnrollByGrade(gradeLevel, classroomIds, academicYearId) {
      return apiPost('/enrollments/bulk-by-grade', {
        grade_level: gradeLevel,
        classroom_ids: classroomIds,
        academic_year_id: academicYearId
      });
    }
  
    // Classroom rosters
    static async getClassroomRoster(classroomId) {
      return apiGet(`/classrooms/${classroomId}/students`);
    }
  
    static async getTeacherRosters(teacherId) {
      return apiGet(`/teachers/${teacherId}/rosters`);
    }
  }