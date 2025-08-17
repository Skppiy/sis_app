// frontend/src/services/specialNeedsService.js
// Special needs management

export class SpecialNeedsService {
    // Tag library management
    static async getTagLibrary(schoolId = null) {
      const params = schoolId ? `?school_id=${schoolId}` : '';
      return apiGet(`/special-needs/tags${params}`);
    }
  
    static async createTag(tagData) {
      return apiPost('/special-needs/tags', tagData);
    }
  
    static async updateTag(tagId, tagData) {
      return apiPut(`/special-needs/tags/${tagId}`, tagData);
    }
  
    static async deleteTag(tagId) {
      return apiDelete(`/special-needs/tags/${tagId}`);
    }
  
    // Student special needs assignment
    static async getStudentSpecialNeeds(studentId) {
      return apiGet(`/students/${studentId}/special-needs`);
    }
  
    static async assignSpecialNeed(studentId, tagId, notes = '') {
      return apiPost(`/students/${studentId}/special-needs`, {
        tag_id: tagId,
        notes: notes
      });
    }
  
    static async updateSpecialNeedAssignment(assignmentId, data) {
      return apiPut(`/special-needs/assignments/${assignmentId}`, data);
    }
  
    static async removeSpecialNeedAssignment(assignmentId) {
      return apiDelete(`/special-needs/assignments/${assignmentId}`);
    }
  }
  
  // Export all services
  export { StudentService, EnrollmentService, SpecialNeedsService };