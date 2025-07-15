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
    const response = await apiClient.post(`/classes/${classId}/tariffs/assign`, {
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
  }
};

export default tariffService; 