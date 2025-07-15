import apiClient from './apiClient';
import { API_CONFIG } from '../config/api';
import { authToasts } from '../utils/toast';

class AuthService {
  constructor() {
    this.apiClient = apiClient;
    this.storageKeys = API_CONFIG.STORAGE_KEYS;
  }

  // Authentication methods
  async login(credentials) {
    try {
      const response = await this.apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
      
      if (response.success && response.data.token) {
        // Store authentication data
        this._storeAuthData(response.data.token, response.data.user);
        
        // Show success toast
        authToasts.loginSuccess(response.data.user.name);
        
        return {
          success: true,
          data: response.data,
          user: response.data.user,
          token: response.data.token,
        };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      // Handle different error types
      const errorMessage = this._extractErrorMessage(error);
      authToasts.loginError(errorMessage);
      
      throw {
        success: false,
        message: errorMessage,
        errors: error.errors || {},
      };
    }
  }

  async register(userData) {
    try {
      const response = await this.apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
      
      if (response.success && response.data.token) {
        // Store authentication data
        this._storeAuthData(response.data.token, response.data.user);
        
        // Show success toast
        authToasts.loginSuccess(response.data.user.name);
        
        return {
          success: true,
          data: response.data,
          user: response.data.user,
          token: response.data.token,
        };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = this._extractErrorMessage(error);
      authToasts.loginError(errorMessage);
      
      throw {
        success: false,
        message: errorMessage,
        errors: error.errors || {},
      };
    }
  }

  async logout() {
    try {
      // Call logout endpoint
      await this.apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
      
      // Clear stored data
      this._clearAuthData();
      
      // Show success toast
      authToasts.logoutSuccess();
      
      return { success: true };
    } catch (error) {
      // Clear stored data even if logout fails
      this._clearAuthData();
      
      // Still show success message for user experience
      authToasts.logoutSuccess();
      
      return { success: true };
    }
  }

  async logoutAll() {
    try {
      // Call logout all endpoint
      await this.apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT_ALL);
      
      // Clear stored data
      this._clearAuthData();
      
      // Show success toast
      authToasts.logoutSuccess();
      
      return { success: true };
    } catch (error) {
      // Clear stored data even if logout fails
      this._clearAuthData();
      
      // Still show success message for user experience
      authToasts.logoutSuccess();
      
      return { success: true };
    }
  }

  async getProfile() {
    try {
      const response = await this.apiClient.get(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
      
      if (response.success && response.data.user) {
        // Update stored user data
        this._updateStoredUser(response.data.user);
        
        return {
          success: true,
          data: response.data,
          user: response.data.user,
        };
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (error) {
      const errorMessage = this._extractErrorMessage(error);
      
      throw {
        success: false,
        message: errorMessage,
        errors: error.errors || {},
      };
    }
  }

  async updateProfile(userData) {
    try {
      const response = await this.apiClient.put(API_CONFIG.ENDPOINTS.AUTH.PROFILE, userData);
      
      if (response.success && response.data.user) {
        // Update stored user data
        this._updateStoredUser(response.data.user);
        
        return {
          success: true,
          data: response.data,
          user: response.data.user,
        };
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      const errorMessage = this._extractErrorMessage(error);
      
      throw {
        success: false,
        message: errorMessage,
        errors: error.errors || {},
      };
    }
  }

  async changePassword(passwordData) {
    try {
      const response = await this.apiClient.post(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Password changed successfully',
        };
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      const errorMessage = this._extractErrorMessage(error);
      
      throw {
        success: false,
        message: errorMessage,
        errors: error.errors || {},
      };
    }
  }

  async getPermissions() {
    try {
      const response = await this.apiClient.get(API_CONFIG.ENDPOINTS.AUTH.PERMISSIONS);
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          permissions: response.data.permissions || [],
        };
      } else {
        throw new Error(response.message || 'Failed to fetch permissions');
      }
    } catch (error) {
      const errorMessage = this._extractErrorMessage(error);
      
      throw {
        success: false,
        message: errorMessage,
        errors: error.errors || {},
      };
    }
  }

  async refreshToken() {
    try {
      const response = await this.apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH);
      
      if (response.success && response.data.token) {
        // Update stored token
        this._updateStoredToken(response.data.token);
        
        return {
          success: true,
          data: response.data,
          token: response.data.token,
        };
      } else {
        throw new Error(response.message || 'Failed to refresh token');
      }
    } catch (error) {
      // If token refresh fails, clear auth data and redirect to login
      this._clearAuthData();
      authToasts.sessionExpired();
      
      throw {
        success: false,
        message: 'Session expired',
        requiresLogin: true,
      };
    }
  }

  // Utility methods
  isAuthenticated() {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  getStoredUser() {
    try {
      const userData = localStorage.getItem(this.storageKeys.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }

  getStoredToken() {
    return localStorage.getItem(this.storageKeys.AUTH_TOKEN);
  }

  hasPermission(permission) {
    const user = this.getStoredUser();
    return user?.permissions?.includes(permission) || false;
  }

  hasRole(role) {
    const user = this.getStoredUser();
    return user?.role === role;
  }

  hasAnyRole(roles) {
    const user = this.getStoredUser();
    return roles.includes(user?.role);
  }

  getUserRole() {
    const user = this.getStoredUser();
    return user?.role || null;
  }

  getUserPermissions() {
    const user = this.getStoredUser();
    return user?.permissions || [];
  }

  // Private methods
  _storeAuthData(token, user) {
    localStorage.setItem(this.storageKeys.AUTH_TOKEN, token);
    localStorage.setItem(this.storageKeys.USER_DATA, JSON.stringify(user));
  }

  _updateStoredUser(user) {
    localStorage.setItem(this.storageKeys.USER_DATA, JSON.stringify(user));
  }

  _updateStoredToken(token) {
    localStorage.setItem(this.storageKeys.AUTH_TOKEN, token);
  }

  _clearAuthData() {
    localStorage.removeItem(this.storageKeys.AUTH_TOKEN);
    localStorage.removeItem(this.storageKeys.USER_DATA);
  }

  _extractErrorMessage(error) {
    // Handle different error formats
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error?.errors) {
      // Handle validation errors
      const firstError = Object.values(error.errors)[0];
      if (Array.isArray(firstError)) {
        return firstError[0];
      }
      return firstError;
    }
    
    // Handle network errors
    if (error?.code === 'NETWORK_ERROR' || error?.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Handle timeout errors
    if (error?.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
    
    // Default error message
    return 'An unexpected error occurred. Please try again.';
  }

  // Session management
  async checkSession() {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      // Verify token is still valid by fetching profile
      await this.getProfile();
      return true;
    } catch (error) {
      // Token is invalid, clear auth data
      this._clearAuthData();
      return false;
    }
  }

  // Auto-refresh token before expiry (if your API supports token expiry info)
  setupTokenRefresh() {
    // This would need to be implemented based on your token structure
    // For now, we'll just check session periodically
    setInterval(async () => {
      if (this.isAuthenticated()) {
        try {
          await this.checkSession();
        } catch (error) {
          console.error('Session check failed:', error);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}

// Export singleton instance
export default new AuthService(); 