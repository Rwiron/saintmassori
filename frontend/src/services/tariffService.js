import apiClient from './apiClient';

const tariffService = {
  // Get all tariffs
  getAllTariffs: async () => {
    const response = await apiClient.get('/tariffs');
    return response.data;
  },

  // Get classes with minimal data and pagination
  getClassesWithPagination: async (page = 1, limit = 10) => {
    const response = await apiClient.get(`/classes?page=${page}&limit=${limit}&minimal=true`);
    return response.data;
  },

  // Get classes grouped by grade with pagination
  getClassesGroupedByGrade: async (page = 1, limit = 10) => {
    const response = await apiClient.get(`/classes/grouped-by-grade?page=${page}&limit=${limit}&minimal=true`);
    return response.data;
  },

  // Get classes with their tariffs (legacy method for backward compatibility)
  getClassesWithTariffs: async () => {
    const response = await apiClient.get('/classes/with-tariffs');
    return response.data;
  },

  // Get specific class tariffs for modal view
  getClassTariffs: async (classId) => {
    const response = await apiClient.get(`/classes/${classId}/tariffs`);
    return response.data;
  },

  // Create a new tariff
  createTariff: async (tariffData) => {
    const response = await apiClient.post('/tariffs', tariffData);
    return response.data;
  },

  // Update an existing tariff
  updateTariff: async (id, tariffData) => {
    const response = await apiClient.put(`/tariffs/${id}`, tariffData);
    return response.data;
  },

  // Delete a tariff
  deleteTariff: async (id) => {
    const response = await apiClient.delete(`/tariffs/${id}`);
    return response.data;
  },

  // Assign tariffs to a class
  assignTariffsToClass: async (classId, tariffIds) => {
    const response = await apiClient.post(`/classes/${classId}/assign-tariffs`, {
      tariff_ids: tariffIds
    });
    return response.data;
  },

  // Remove tariff from class
  removeTariffFromClass: async (classId, tariffId) => {
    const response = await apiClient.delete(`/classes/${classId}/tariffs/${tariffId}`);
    return response.data;
  },

  // Get tariff statistics
  getTariffStats: async () => {
    const response = await apiClient.get('/tariffs/stats');
    return response.data;
  },

  // Helper methods for UI components
  getTariffTypes: () => {
    return [
      { value: 'tuition', label: 'Tuition Fee' },
      { value: 'activity_fee', label: 'Activity Fee' },
      { value: 'transport', label: 'Transport Fee' },
      { value: 'meal', label: 'Meal Fee' },
      { value: 'other', label: 'Other Fee' }
    ];
  },

  getBillingFrequencies: () => {
    return [
      { value: 'per_term', label: 'Per Term' },
      { value: 'per_month', label: 'Per Month' },
      { value: 'per_year', label: 'Per Year' },
      { value: 'one_time', label: 'One Time' }
    ];
  },

  // Format amount for display
  formatAmount: (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  // Format tariff type for display
  formatTariffType: (type) => {
    const typeMap = {
      'tuition': 'Tuition Fee',
      'activity_fee': 'Activity Fee',
      'transport': 'Transport Fee',
      'meal': 'Meal Fee',
      'other': 'Other Fee'
    };
    return typeMap[type] || type;
  },

  // Format billing frequency for display
  formatBillingFrequency: (frequency) => {
    const frequencyMap = {
      'per_term': 'Per Term',
      'per_month': 'Per Month',
      'per_year': 'Per Year',
      'one_time': 'One Time'
    };
    return frequencyMap[frequency] || frequency;
  },

  // Calculate projected revenue based on tariff and student count
  calculateProjectedRevenue: (tariff, studentCount) => {
    if (!tariff.amount || !tariff.billing_frequency || !studentCount) {
      return null;
    }

    const amount = parseFloat(tariff.amount);
    const totalStudents = parseInt(studentCount);
    
    if (isNaN(amount) || isNaN(totalStudents) || amount <= 0 || totalStudents <= 0) {
      return null;
    }

    let perTerm = 0;
    let perYear = 0;

    switch (tariff.billing_frequency) {
      case 'per_term':
        perTerm = amount * totalStudents;
        perYear = perTerm * 3; // Assuming 3 terms per year
        break;
      case 'per_month':
        perTerm = amount * totalStudents * 4; // Assuming 4 months per term
        perYear = amount * totalStudents * 12;
        break;
      case 'per_year':
        perTerm = (amount * totalStudents) / 3; // Divide by 3 terms
        perYear = amount * totalStudents;
        break;
      case 'one_time':
        perTerm = amount * totalStudents;
        perYear = amount * totalStudents;
        break;
      default:
        return null;
    }

    return {
      per_term: perTerm,
      per_year: perYear,
      total_projected: perYear,
      student_count: totalStudents,
      amount_per_student: amount,
      billing_frequency: tariff.billing_frequency
    };
  },

  // Validate tariff data
  validateTariffData: (data) => {
    const errors = {};
    let isValid = true;

    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      errors.name = 'Tariff name is required';
      isValid = false;
    } else if (data.name.trim().length < 2) {
      errors.name = 'Tariff name must be at least 2 characters long';
      isValid = false;
    } else if (data.name.trim().length > 255) {
      errors.name = 'Tariff name must not exceed 255 characters';
      isValid = false;
    }

    // Validate type
    if (!data.type || data.type.trim().length === 0) {
      errors.type = 'Tariff type is required';
      isValid = false;
    } else {
      const validTypes = ['tuition', 'activity_fee', 'transport', 'meal', 'other'];
      if (!validTypes.includes(data.type)) {
        errors.type = 'Invalid tariff type';
        isValid = false;
      }
    }

    // Validate amount
    if (!data.amount || data.amount === '') {
      errors.amount = 'Amount is required';
      isValid = false;
    } else {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Amount must be a positive number';
        isValid = false;
      } else if (amount > 10000000) { // 10 million RWF limit
        errors.amount = 'Amount cannot exceed 10,000,000 RWF';
        isValid = false;
      }
    }

    // Validate billing frequency
    if (!data.billing_frequency || data.billing_frequency.trim().length === 0) {
      errors.billing_frequency = 'Billing frequency is required';
      isValid = false;
    } else {
      const validFrequencies = ['per_term', 'per_month', 'per_year', 'one_time'];
      if (!validFrequencies.includes(data.billing_frequency)) {
        errors.billing_frequency = 'Invalid billing frequency';
        isValid = false;
      }
    }

    // Validate description (optional but if provided, check length)
    if (data.description && data.description.trim().length > 1000) {
      errors.description = 'Description must not exceed 1000 characters';
      isValid = false;
    }

    // Validate class assignment (at least one class should be selected if not editing)
    if (data.class_ids && Array.isArray(data.class_ids) && data.class_ids.length === 0) {
      errors.class_ids = 'At least one class must be selected';
      isValid = false;
    }

    return {
      isValid,
      errors
    };
  }
};

export default tariffService; 