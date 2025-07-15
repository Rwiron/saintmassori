import apiClient from './apiClient';

const classService = {
  // List all classes with optional filtering
  getAllClasses: async (params = {}) => {
    const response = await apiClient.get('/classes', { params });
    return response;
  },

  // Get a specific class by ID
  getClassById: async (id) => {
    const response = await apiClient.get(`/classes/${id}`);
    return response;
  },

  // Create a new class
  createClass: async (classData) => {
    const response = await apiClient.post('/classes', classData);
    return response;
  },

  // Update a class
  updateClass: async (id, classData) => {
    const response = await apiClient.put(`/classes/${id}`, classData);
    return response;
  },

  // Delete a class
  deleteClass: async (id) => {
    const response = await apiClient.delete(`/classes/${id}`);
    return response;
  },

  // Get classes with available spots
  getClassesWithAvailableSpots: async () => {
    const response = await apiClient.get('/classes/with-available-spots');
    return response;
  },

  // Get classes with tariff counts
  getClassesWithTariffCounts: async () => {
    const response = await apiClient.get('/classes/with-tariff-counts');
    return response;
  },

  // Get class statistics
  getClassStatistics: async (id) => {
    const response = await apiClient.get(`/classes/${id}/statistics`);
    return response;
  },

  // Assign tariffs to class
  assignTariffs: async (id, tariffIds) => {
    const response = await apiClient.post(`/classes/${id}/assign-tariffs`, {
      tariff_ids: tariffIds
    });
    return response;
  },

  // Remove tariff from class
  removeTariff: async (classId, tariffId) => {
    const response = await apiClient.delete(`/classes/${classId}/tariffs/${tariffId}`);
    return response;
  },

  // Get classes by grade
  getClassesByGrade: async (gradeId) => {
    const response = await apiClient.get('/classes', {
      params: { grade_id: gradeId }
    });
    return response;
  },

  // Search classes
  searchClasses: async (query) => {
    const response = await apiClient.get('/classes', {
      params: { search: query }
    });
    return response;
  }
};

// Helper functions for data processing
export const classHelpers = {
  // Calculate occupancy percentage
  calculateOccupancyRate: (currentEnrollment, capacity) => {
    if (capacity === 0) return 0;
    return ((currentEnrollment / capacity) * 100).toFixed(1);
  },

  // Get occupancy status
  getOccupancyStatus: (currentEnrollment, capacity) => {
    const rate = (currentEnrollment / capacity) * 100;
    if (rate >= 100) return 'full';
    if (rate >= 80) return 'high';
    if (rate >= 50) return 'medium';
    return 'low';
  },

  // Get occupancy color
  getOccupancyColor: (currentEnrollment, capacity) => {
    const status = classHelpers.getOccupancyStatus(currentEnrollment, capacity);
    switch (status) {
      case 'full': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  },

  // Format class display name
  formatClassDisplayName: (className, gradeName, gradeDisplayName) => {
    return `${gradeName}${className} (${gradeDisplayName})`;
  },

  // Validate class data
  validateClassData: (classData) => {
    const errors = {};

    if (!classData.name || classData.name.trim() === '') {
      errors.name = 'Class name is required';
    }

    if (!classData.grade_id) {
      errors.grade_id = 'Grade is required';
    }

    if (!classData.capacity || classData.capacity < 1 || classData.capacity > 100) {
      errors.capacity = 'Capacity must be between 1 and 100';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Format capacity display
  formatCapacityDisplay: (currentEnrollment, capacity) => {
    return `${currentEnrollment}/${capacity}`;
  },

  // Check if class is full
  isClassFull: (currentEnrollment, capacity) => {
    return currentEnrollment >= capacity;
  },

  // Get available spots
  getAvailableSpots: (currentEnrollment, capacity) => {
    return Math.max(0, capacity - currentEnrollment);
  },

  // Sort classes by grade level and name
  sortClasses: (classes) => {
    return classes.sort((a, b) => {
      // Check if grade objects exist
      if (!a.grade || !b.grade) {
        return 0;
      }
      
      // First sort by grade level
      if (a.grade.level !== b.grade.level) {
        return a.grade.level - b.grade.level;
      }
      // Then sort by class name
      return a.name.localeCompare(b.name);
    });
  }
};

export default classService; 