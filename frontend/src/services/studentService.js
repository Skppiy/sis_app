// frontend/src/services/studentService.js
// Improved with better error handling

import { apiGet, apiPost, apiPut, apiDelete } from '../requestHelper';

export class StudentService {
  static async getStudents(schoolId = null) {
    try {
      const params = schoolId ? `?school_id=${schoolId}` : '';
      return await apiGet(`/students${params}`);
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error(error.message || 'Failed to fetch students');
    }
  }

  static async getStudent(studentId) {
    try {
      return await apiGet(`/students/${studentId}`);
    } catch (error) {
      console.error('Error fetching student:', error);
      throw new Error(error.message || 'Failed to fetch student');
    }
  }

  static async createStudent(studentData) {
    try {
      console.log('Creating student with data:', studentData);
      const result = await apiPost('/students', studentData);
      console.log('Student created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating student:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('Student ID already exists')) {
        throw new Error('This Student ID is already in use. Please choose a different ID.');
      }
      if (error.message && error.message.includes('Email already exists')) {
        throw new Error('This email address is already in use. Please choose a different email.');
      }
      
      throw new Error(error.message || 'Failed to create student');
    }
  }

  static async updateStudent(studentId, studentData) {
    try {
      console.log('Updating student with data:', studentData);
      const result = await apiPut(`/students/${studentId}`, studentData);
      console.log('Student updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error updating student:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('Student ID already exists')) {
        throw new Error('This Student ID is already in use. Please choose a different ID.');
      }
      if (error.message && error.message.includes('Email already exists')) {
        throw new Error('This email address is already in use. Please choose a different email.');
      }
      
      throw new Error(error.message || 'Failed to update student');
    }
  }

  static async deleteStudent(studentId) {
    try {
      return await apiDelete(`/students/${studentId}`);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw new Error(error.message || 'Failed to delete student');
    }
  }
}