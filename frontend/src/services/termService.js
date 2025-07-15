import apiClient from './apiClient';

class TermService {
  // Get all terms with optional search and filtering
  async getTerms(params = {}) {
    try {
      const response = await apiClient.get('/terms', { params });
      return response;
    } catch (error) {
      console.error('Error fetching terms:', error);
      throw error;
    }
  }

  // Get specific term by ID
  async getTerm(id) {
    try {
      const response = await apiClient.get(`/terms/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching term:', error);
      throw error;
    }
  }

  // Create new term
  async createTerm(data) {
    try {
      const response = await apiClient.post('/terms', data);
      return response;
    } catch (error) {
      console.error('Error creating term:', error);
      throw error;
    }
  }

  // Update term
  async updateTerm(id, data) {
    try {
      const response = await apiClient.put(`/terms/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating term:', error);
      throw error;
    }
  }

  // Delete term
  async deleteTerm(id) {
    try {
      const response = await apiClient.delete(`/terms/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting term:', error);
      throw error;
    }
  }

  // Activate term
  async activateTerm(id) {
    try {
      const response = await apiClient.post(`/terms/${id}/activate`);
      return response;
    } catch (error) {
      console.error('Error activating term:', error);
      throw error;
    }
  }

  // Complete term
  async completeTerm(id) {
    try {
      const response = await apiClient.post(`/terms/${id}/complete`);
      return response;
    } catch (error) {
      console.error('Error completing term:', error);
      throw error;
    }
  }

  // Get current term
  async getCurrentTerm() {
    try {
      const response = await apiClient.get('/terms/current');
      return response;
    } catch (error) {
      console.error('Error fetching current term:', error);
      throw error;
    }
  }

  // Get active terms
  async getActiveTerms() {
    try {
      const response = await apiClient.get('/terms/active');
      return response;
    } catch (error) {
      console.error('Error fetching active terms:', error);
      throw error;
    }
  }

  // Get terms by academic year
  async getTermsByAcademicYear(academicYearId) {
    try {
      const response = await apiClient.get(`/terms/by-academic-year/${academicYearId}`);
      return response;
    } catch (error) {
      console.error('Error fetching terms by academic year:', error);
      throw error;
    }
  }

  // Get term statistics
  async getTermStatistics(id) {
    try {
      const response = await apiClient.get(`/terms/${id}/statistics`);
      return response;
    } catch (error) {
      console.error('Error fetching term statistics:', error);
      throw error;
    }
  }

  // Check if term can be deleted
  async canDeleteTerm(id) {
    try {
      const response = await apiClient.get(`/terms/${id}/can-delete`);
      return response;
    } catch (error) {
      console.error('Error checking if term can be deleted:', error);
      throw error;
    }
  }

  // Format term for display
  formatTerm(term) {
    return {
      ...term,
      formatted_start_date: new Date(term.start_date).toLocaleDateString(),
      formatted_end_date: new Date(term.end_date).toLocaleDateString(),
      status_label: this.getStatusLabel(term.status),
      status_color: this.getStatusColor(term.status),
      duration_days: this.calculateDurationDays(term.start_date, term.end_date),
      days_remaining: this.calculateDaysRemaining(term.end_date)
    };
  }

  // Get status label
  getStatusLabel(status) {
    const statusLabels = {
      upcoming: 'Upcoming',
      active: 'Active',
      completed: 'Completed'
    };
    return statusLabels[status] || status;
  }

  // Get status color for badges
  getStatusColor(status) {
    const statusColors = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  // Calculate duration in days
  calculateDurationDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Calculate days remaining
  calculateDaysRemaining(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    const timeDiff = end.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Validate term data
  validateTerm(data) {
    const errors = {};

    if (!data.name || data.name.trim() === '') {
      errors.name = 'Term name is required';
    }

    if (!data.academic_year_id) {
      errors.academic_year_id = 'Academic year is required';
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

      // Check minimum duration (1 week)
      const duration = this.calculateDurationDays(data.start_date, data.end_date);
      if (duration < 7) {
        errors.end_date = 'Term must be at least 1 week long';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Get term progress percentage
  getTermProgress(term) {
    const today = new Date();
    const start = new Date(term.start_date);
    const end = new Date(term.end_date);
    
    if (today < start) return 0;
    if (today > end) return 100;
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    
    return Math.round((elapsed / totalDuration) * 100);
  }

  // Check if term is current (active and within date range)
  isCurrentTerm(term) {
    if (term.status !== 'active') return false;
    
    const today = new Date();
    const start = new Date(term.start_date);
    const end = new Date(term.end_date);
    
    return today >= start && today <= end;
  }

  // Get term date range display
  getDateRangeDisplay(term) {
    const start = new Date(term.start_date);
    const end = new Date(term.end_date);
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    
    if (start.getFullYear() === end.getFullYear()) {
      if (start.getMonth() === end.getMonth()) {
        return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
      }
    } else {
      return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }
  }
}

export default new TermService(); 