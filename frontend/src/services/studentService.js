// frontend/src/services/studentService.js
// Minimal service for testing

import { apiGet, apiPost, apiPut, apiDelete } from '../requestHelper';

export class StudentService {
  static async getStudents(schoolId = null) {
    const params = schoolId ? `?school_id=${schoolId}` : '';
    return apiGet(`/students${params}`);
  }

  static async getStudent(studentId) {
    return apiGet(`/students/${studentId}`);
  }

  static async createStudent(studentData) {
    return apiPost('/students', studentData);
  }

  static async updateStudent(studentId, studentData) {
    return apiPut(`/students/${studentId}`, studentData);
  }

  static async deleteStudent(studentId) {
    return apiDelete(`/students/${studentId}`);
  }
}