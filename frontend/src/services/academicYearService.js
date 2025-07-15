import apiClient from './apiClient';

class AcademicYearService {
  // Get all academic years with optional search
  async getAcademicYears(params = {}) {
    try {
      const response = await apiClient.get('/academic-years', { params });
      return response;
    } catch (error) {
      console.error('Error fetching academic years:', error);
      throw error;
    }
  }

  // Get specific academic year by ID
  async getAcademicYear(id) {
    try {
      const response = await apiClient.get(`/academic-years/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching academic year:', error);
      throw error;
    }
  }

  // Create new academic year
  async createAcademicYear(data) {
    try {
      const response = await apiClient.post('/academic-years', data);
      return response;
    } catch (error) {
      console.error('Error creating academic year:', error);
      throw error;
    }
  }

  // Update academic year
  async updateAcademicYear(id, data) {
    try {
      const response = await apiClient.put(`/academic-years/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating academic year:', error);
      throw error;
    }
  }

  // Delete academic year
  async deleteAcademicYear(id) {
    try {
      const response = await apiClient.delete(`/academic-years/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting academic year:', error);
      throw error;
    }
  }

  // Activate academic year
  async activateAcademicYear(id) {
    try {
      const response = await apiClient.post(`/academic-years/${id}/activate`);
      return response;
    } catch (error) {
      console.error('Error activating academic year:', error);
      throw error;
    }
  }

  // Close academic year
  async closeAcademicYear(id) {
    try {
      const response = await apiClient.post(`/academic-years/${id}/close`);
      return response;
    } catch (error) {
      console.error('Error closing academic year:', error);
      throw error;
    }
  }

  // Get current academic year
  async getCurrentAcademicYear() {
    try {
      const response = await apiClient.get('/academic-years/current');
      return response;
    } catch (error) {
      console.error('Error fetching current academic year:', error);
      throw error;
    }
  }

  // Get active academic years
  async getActiveAcademicYears() {
    try {
      const response = await apiClient.get('/academic-years/active');
      return response;
    } catch (error) {
      console.error('Error fetching active academic years:', error);
      throw error;
    }
  }

  // Get academic year statistics
  async getAcademicYearStatistics(id) {
    try {
      const response = await apiClient.get(`/academic-years/${id}/statistics`);
      return response;
    } catch (error) {
      console.error('Error fetching academic year statistics:', error);
      throw error;
    }
  }

  // Check if academic year can be closed
  async canCloseAcademicYear(id) {
    try {
      const response = await apiClient.get(`/academic-years/${id}/can-close`);
      return response;
    } catch (error) {
      console.error('Error checking if academic year can be closed:', error);
      throw error;
    }
  }

  // Check if academic year can be deleted
  async canDeleteAcademicYear(id) {
    try {
      const response = await apiClient.get(`/academic-years/${id}/can-delete`);
      return response;
    } catch (error) {
      console.error('Error checking if academic year can be deleted:', error);
      throw error;
    }
  }

  // Format academic year for display
  formatAcademicYear(academicYear) {
    return {
      ...academicYear,
      formatted_start_date: new Date(academicYear.start_date).toLocaleDateString(),
      formatted_end_date: new Date(academicYear.end_date).toLocaleDateString(),
      status_label: this.getStatusLabel(academicYear.status),
      status_color: this.getStatusColor(academicYear.status),
      duration_months: this.calculateDurationMonths(academicYear.start_date, academicYear.end_date)
    };
  }

  // Get status label
  getStatusLabel(status) {
    const statusLabels = {
      draft: 'Draft',
      active: 'Active',
      closed: 'Closed'
    };
    return statusLabels[status] || status;
  }

  // Get status color for badges
  getStatusColor(status) {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  // Calculate duration in months
  calculateDurationMonths(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.round(months);
  }

  // Validate academic year data
  validateAcademicYear(data) {
    const errors = {};

    if (!data.name || data.name.trim() === '') {
      errors.name = 'Academic year name is required';
    }

    if (!data.start_date) {
      errors.start_date = 'Start date is required';
    }

    if (!data.end_date) {
      errors.end_date = 'End date is required';
    }

    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (startDate >= endDate) {
        errors.end_date = 'End date must be after start date';
      }

      // Allow start date to be today or in the future (for new academic years)
      // Removed the restriction that start date must be in the future

      // Check minimum duration (6 months)
      const duration = this.calculateDurationMonths(data.start_date, data.end_date);
      if (duration < 6) {
        errors.end_date = 'Academic year must be at least 6 months long';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default new AcademicYearService(); 