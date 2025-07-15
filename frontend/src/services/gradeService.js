import apiClient from './apiClient';

class GradeService {
  // Get all grades with optional filtering
  async getGrades(params = {}) {
    try {
      const response = await apiClient.get('/grades', { params });
      return response;
    } catch (error) {
      console.error('Error fetching grades:', error);
      throw error;
    }
  }

  // Get active grades only
  async getActiveGrades() {
    try {
      const response = await apiClient.get('/grades/active');
      return response;
    } catch (error) {
      console.error('Error fetching active grades:', error);
      throw error;
    }
  }

  // Get specific grade by ID
  async getGrade(id) {
    try {
      const response = await apiClient.get(`/grades/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching grade:', error);
      throw error;
    }
  }

  // Create a new grade
  async createGrade(gradeData) {
    try {
      const response = await apiClient.post('/grades', gradeData);
      return response;
    } catch (error) {
      console.error('Error creating grade:', error);
      throw error;
    }
  }

  // Update a grade
  async updateGrade(id, gradeData) {
    try {
      const response = await apiClient.put(`/grades/${id}`, gradeData);
      return response;
    } catch (error) {
      console.error('Error updating grade:', error);
      throw error;
    }
  }

  // Delete a grade
  async deleteGrade(id) {
    try {
      const response = await apiClient.delete(`/grades/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting grade:', error);
      throw error;
    }
  }

  // Get grade statistics
  async getGradeStatistics(id) {
    try {
      const response = await apiClient.get(`/grades/${id}/statistics`);
      return response;
    } catch (error) {
      console.error('Error fetching grade statistics:', error);
      throw error;
    }
  }

  // Get all grades statistics
  async getStatistics() {
    try {
      const response = await apiClient.get('/grades/statistics');
      return response;
    } catch (error) {
      console.error('Error fetching grades statistics:', error);
      throw error;
    }
  }

  // Activate a grade
  async activateGrade(id) {
    try {
      const response = await apiClient.post(`/grades/${id}/activate`);
      return response;
    } catch (error) {
      console.error('Error activating grade:', error);
      throw error;
    }
  }

  // Deactivate a grade
  async deactivateGrade(id) {
    try {
      const response = await apiClient.post(`/grades/${id}/deactivate`);
      return response;
    } catch (error) {
      console.error('Error deactivating grade:', error);
      throw error;
    }
  }

  // Search grades
  async searchGrades(query) {
    try {
      const response = await apiClient.get('/grades/search', {
        params: { query }
      });
      return response;
    } catch (error) {
      console.error('Error searching grades:', error);
      throw error;
    }
  }

  // Create class for grade
  async createClassForGrade(gradeId, classData) {
    try {
      const response = await apiClient.post(`/grades/${gradeId}/create-class`, classData);
      return response;
    } catch (error) {
      console.error('Error creating class for grade:', error);
      throw error;
    }
  }

  // Helper functions
  formatGradeForDropdown(grade) {
    return {
      value: grade.id,
      label: `${grade.name} - ${grade.display_name}`,
      grade: grade
    };
  }

  // Get grade level order
  getGradeLevelOrder() {
    return ['N1', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
  }

  // Sort grades by level
  sortGradesByLevel(grades) {
    return grades.sort((a, b) => a.level - b.level);
  }
}

export default new GradeService(); 