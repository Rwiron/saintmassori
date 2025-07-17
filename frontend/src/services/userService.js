import apiClient from './apiClient';

const userService = {
  // Get all users with optional filtering
  getUsers: async (params = {}) => {
    console.log('UserService: Getting users with params:', params);
    const response = await apiClient.get('/users', { params });
    console.log('UserService: Raw response:', response);
    console.log('UserService: Response data:', response.data);
    console.log('UserService: Full response structure:', JSON.stringify(response.data, null, 2));
    
    // Check if response.data has the Laravel API structure
    if (response.data && response.data.success && response.data.data) {
      console.log('UserService: Extracting from Laravel structure');
      return response.data.data;
    }
    
    // Check if response.data is already an array (the users)
    if (Array.isArray(response.data)) {
      console.log('UserService: Response is already an array, using directly');
      return response.data;
    }
    
    // Fallback
    console.log('UserService: Using response.data as fallback');
    return response.data;
  },

  // Get a specific user by ID
  getUser: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data?.data || response.data;
  },

  // Create a new user
  createUser: async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data?.data || response.data;
  },

  // Update a user
  updateUser: async (userId, userData) => {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data?.data || response.data;
  },

  // Delete a user
  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  // Activate a user
  activateUser: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/activate`);
    return response.data;
  },

  // Deactivate a user
  deactivateUser: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/deactivate`);
    return response.data;
  },

  // Get user statistics
  getUserStatistics: async () => {
    const response = await apiClient.get('/users/statistics');
    return response.data?.data || response.data;
  },

  // Get available user roles
  getUserRoles: async () => {
    const response = await apiClient.get('/users/roles');
    return response.data?.data || response.data;
  },

  // Perform bulk action on users
  bulkAction: async (action, userIds) => {
    const response = await apiClient.post('/users/bulk-action', {
      action,
      user_ids: userIds
    });
    return response.data;
  },

  // Search users
  searchUsers: async (query) => {
    const response = await apiClient.get('/users', {
      params: { search: query }
    });
    return response.data?.data || response.data;
  },

  // Get users by role
  getUsersByRole: async (role) => {
    const response = await apiClient.get('/users', {
      params: { role }
    });
    return response.data?.data || response.data;
  },

  // Get users by status
  getUsersByStatus: async (status) => {
    const response = await apiClient.get('/users', {
      params: { status }
    });
    return response.data?.data || response.data;
  },

  // Get active users only
  getActiveUsers: async () => {
    const response = await apiClient.get('/users', {
      params: { status: 'active' }
    });
    return response.data?.data || response.data;
  },

  // Get inactive users only
  getInactiveUsers: async () => {
    const response = await apiClient.get('/users', {
      params: { status: 'inactive' }
    });
    return response.data?.data || response.data;
  },

  // Advanced filtering
  getFilteredUsers: async (filters) => {
    const response = await apiClient.get('/users', { params: filters });
    return response.data;
  },

  // Bulk activate users
  bulkActivateUsers: async (userIds) => {
    return await userService.bulkAction('activate', userIds);
  },

  // Bulk deactivate users
  bulkDeactivateUsers: async (userIds) => {
    return await userService.bulkAction('deactivate', userIds);
  },

  // Bulk delete users
  bulkDeleteUsers: async (userIds) => {
    return await userService.bulkAction('delete', userIds);
  },

  // Validate user data before submission
  validateUserData: (userData, isUpdate = false) => {
    const errors = {};

    // Name validation
    if (!userData.name || userData.name.trim() === '') {
      errors.name = 'Name is required';
    } else if (userData.name.length > 255) {
      errors.name = 'Name must be less than 255 characters';
    }

    // Email validation
    if (!userData.email || userData.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation (only for create or if password is being changed)
    if (!isUpdate || userData.password) {
      if (!userData.password) {
        errors.password = 'Password is required';
      } else if (userData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      } else if (userData.password !== userData.password_confirmation) {
        errors.password_confirmation = 'Password confirmation does not match';
      }
    }

    // Role validation
    if (!userData.role) {
      errors.role = 'Role is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Format user data for display
  formatUserForDisplay: (user) => {
    return {
      ...user,
      status_label: user.is_active ? 'Active' : 'Inactive',
      status_color: user.is_active ? 'success' : 'destructive',
      created_date: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
      last_login_date: user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never',
      full_display_name: `${user.name} (${user.role_label})`,
    };
  },

  // Get user permission labels
  getPermissionLabels: () => {
    return {
      'manage_academic_years': 'Manage Academic Years',
      'manage_terms': 'Manage Terms',
      'manage_grades': 'Manage Grades',
      'manage_classes': 'Manage Classes',
      'manage_students': 'Manage Students',
      'manage_tariffs': 'Manage Tariffs',
      'manage_bills': 'Manage Bills',
      'view_reports': 'View Reports',
      'promote_students': 'Promote Students',
      'view_classes': 'View Classes',
      'view_students': 'View Students',
      'view_own_profile': 'View Own Profile',
      'view_own_bills': 'View Own Bills',
      'view_own_class': 'View Own Class',
      'view_child_profile': 'View Child Profile',
      'view_child_bills': 'View Child Bills',
      'view_child_class': 'View Child Class',
    };
  },

  // Check if current user can perform action on target user
  canPerformAction: (currentUser, targetUser, action) => {
    // Admin can perform any action except on themselves for certain actions
    if (currentUser.role === 'admin') {
      if (currentUser.id === targetUser.id) {
        return !['delete', 'deactivate'].includes(action);
      }
      return true;
    }

    // Non-admin users cannot perform user management actions
    return false;
  },

  // Get role color for badge display
  getRoleColor: (role) => {
    const roleColors = {
      'admin': 'outline',
      'teacher': 'default',
      'student': 'secondary',
      'parent': 'outline'
    };
    return roleColors[role] || 'default';
  },

  // Get status color for badge display
  getStatusColor: (isActive) => {
    return isActive ? 'success' : 'destructive';
  },

  // Sort users by different criteria
  sortUsers: (users, sortBy, sortOrder = 'asc') => {
    return [...users].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.role_label;
          bValue = b.role_label;
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'last_login_at':
          aValue = a.last_login_at ? new Date(a.last_login_at) : new Date(0);
          bValue = b.last_login_at ? new Date(b.last_login_at) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // Filter users by multiple criteria
  filterUsers: (users, filters) => {
    return users.filter(user => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.role_label.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Role filter
      if (filters.role && user.role !== filters.role) {
        return false;
      }

      // Status filter
      if (filters.status !== undefined) {
        const isActive = filters.status === 'active';
        if (user.is_active !== isActive) {
          return false;
        }
      }

      return true;
    });
  },

  // Export users data for CSV/Excel
  exportUsers: (users) => {
    return users.map(user => ({
      'Name': user.name,
      'Email': user.email,
      'Role': user.role_label,
      'Status': user.is_active ? 'Active' : 'Inactive',
      'Created Date': user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
      'Last Login': user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never',
      'Permissions': user.permissions ? user.permissions.join(', ') : 'None'
    }));
  }
};

export default userService; 