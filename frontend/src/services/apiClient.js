import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { authToasts } from '../utils/toast';

// API base configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData properly - remove Content-Type to let browser set it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if this is an auth-related endpoint
    const isAuthEndpoint = error.config?.url?.startsWith('/auth/') || 
                          error.config?.url?.includes('/api/auth/');
    
    // Handle common errors
    if (error.response?.status === API_CONFIG.STATUS_CODES.UNAUTHORIZED) {
      // Token expired or invalid
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
      
      // Only show session expired toast if not from auth endpoints
      if (!isAuthEndpoint) {
        authToasts.sessionExpired();
      }
      
      // Redirect to login after a short delay (only if not already on login page)
      if (!window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    
    // Handle network errors - but not for auth endpoints
    if (!error.response && !isAuthEndpoint) {
      authToasts.networkError();
    }
    
    // Return a standardized error format
    const errorResponse = {
      success: false,
      message: error.response?.data?.message || 'An error occurred',
      errors: error.response?.data?.errors || {},
      status: error.response?.status || 500,
      code: error.code,
    };
    
    return Promise.reject(errorResponse);
  }
);

class ApiClient {
  // Generic HTTP methods
  async get(url, config = {}) {
    try {
      const response = await apiClient.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async post(url, data = {}, config = {}) {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async put(url, data = {}, config = {}) {
    try {
      const response = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async patch(url, data = {}, config = {}) {
    try {
      const response = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // File upload method
  async upload(url, formData, config = {}) {
    try {
      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...config,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Download file method
  async download(url, config = {}) {
    try {
      const response = await apiClient.get(url, {
        responseType: 'blob',
        ...config,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Utility methods for common operations
  async fetchList(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.get(url);
  }

  async fetchById(endpoint, id) {
    return this.get(`${endpoint}/${id}`);
  }

  async create(endpoint, data) {
    return this.post(endpoint, data);
  }

  async update(endpoint, id, data) {
    return this.put(`${endpoint}/${id}`, data);
  }

  async partialUpdate(endpoint, id, data) {
    return this.patch(`${endpoint}/${id}`, data);
  }

  async remove(endpoint, id) {
    return this.delete(`${endpoint}/${id}`);
  }

  // Batch operations
  async batchCreate(endpoint, dataArray) {
    return this.post(`${endpoint}/batch`, { items: dataArray });
  }

  async batchUpdate(endpoint, dataArray) {
    return this.put(`${endpoint}/batch`, { items: dataArray });
  }

  async batchDelete(endpoint, ids) {
    return this.delete(`${endpoint}/batch`, { data: { ids } });
  }

  // Search and filter operations
  async search(endpoint, query, filters = {}) {
    const params = { search: query, ...filters };
    return this.fetchList(endpoint, params);
  }

  async filter(endpoint, filters) {
    return this.fetchList(endpoint, filters);
  }

  // Pagination helper
  async paginate(endpoint, page = 1, perPage = 10, params = {}) {
    const paginationParams = {
      page,
      per_page: perPage,
      ...params,
    };
    return this.fetchList(endpoint, paginationParams);
  }

  // Request cancellation
  createCancelToken() {
    return axios.CancelToken.source();
  }

  isCancel(error) {
    return axios.isCancel(error);
  }

  // Request with timeout
  async requestWithTimeout(method, url, data = {}, timeout = 5000) {
    const cancelToken = this.createCancelToken();
    
    const timeoutId = setTimeout(() => {
      cancelToken.cancel('Request timeout');
    }, timeout);

    try {
      const response = await this[method](url, data, {
        cancelToken: cancelToken.token,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get API version/info
  async getApiInfo() {
    try {
      const response = await this.get('/');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Set custom headers for specific requests
  setHeaders(headers) {
    Object.assign(apiClient.defaults.headers, headers);
  }

  // Remove custom headers
  removeHeaders(headerKeys) {
    headerKeys.forEach(key => {
      delete apiClient.defaults.headers[key];
    });
  }

  // Get current configuration
  getConfig() {
    return {
      baseURL: apiClient.defaults.baseURL,
      timeout: apiClient.defaults.timeout,
      headers: apiClient.defaults.headers,
    };
  }

  // Update base configuration
  updateConfig(config) {
    Object.assign(apiClient.defaults, config);
  }
}

// Export singleton instance
export default new ApiClient(); 