import toast from 'react-hot-toast';

// Toast deduplication tracking
const activeToasts = new Map();
const messageHistory = new Map();

// Default deduplication window (in milliseconds)
const DEFAULT_DEDUP_WINDOW = 3000;

// Toast configuration
const defaultOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    borderRadius: '12px',
    background: '#333',
    color: '#fff',
    fontSize: '14px',
    padding: '12px 16px',
  },
};

// Deduplication helper function
const shouldPreventDuplicate = (message, id = null, dedupWindow = DEFAULT_DEDUP_WINDOW) => {
  const now = Date.now();
  
  // Check by custom ID first (highest priority)
  if (id && activeToasts.has(id)) {
    return true;
  }
  
  // Check by message content
  const messageKey = message.toLowerCase().trim();
  const lastShown = messageHistory.get(messageKey);
  
  if (lastShown && (now - lastShown) < dedupWindow) {
    return true;
  }
  
  return false;
};

// Register toast in tracking system
const registerToast = (toastId, message, customId = null) => {
  const now = Date.now();
  
  // Track by custom ID
  if (customId) {
    activeToasts.set(customId, { toastId, timestamp: now });
  }
  
  // Track by message
  const messageKey = message.toLowerCase().trim();
  messageHistory.set(messageKey, now);
  
  // Clean up when toast is dismissed
  const originalDismiss = toast.dismiss;
  setTimeout(() => {
    // Remove from tracking when toast expires or is dismissed
    if (customId) {
      activeToasts.delete(customId);
    }
    
    // Clean up old message history (keep last 50 messages)
    if (messageHistory.size > 50) {
      const entries = Array.from(messageHistory.entries());
      entries.sort((a, b) => b[1] - a[1]);
      messageHistory.clear();
      entries.slice(0, 50).forEach(([key, value]) => {
        messageHistory.set(key, value);
      });
    }
  }, defaultOptions.duration + 1000);
};

// Enhanced toast functions with deduplication
const createToastFunction = (toastType, defaultToastOptions = {}) => {
  return (message, options = {}) => {
    const {
      preventDuplicate = true,
      dedupId = null,
      dedupWindow = DEFAULT_DEDUP_WINDOW,
      ...restOptions
    } = options;
    
    // Check for duplicates if enabled
    if (preventDuplicate && shouldPreventDuplicate(message, dedupId, dedupWindow)) {
      return null; // Return null to indicate duplicate was prevented
    }
    
    // Create the toast
    const toastId = toastType(message, {
      ...defaultOptions,
      ...defaultToastOptions,
      ...restOptions,
    });
    
    // Register in tracking system
    registerToast(toastId, message, dedupId);
    
    return toastId;
  };
};

// Success toast
export const showSuccess = createToastFunction(toast.success, {
  style: {
    ...defaultOptions.style,
    background: '#10b981',
  },
  iconTheme: {
    primary: '#fff',
    secondary: '#10b981',
  },
});

// Error toast
export const showError = createToastFunction(toast.error, {
  duration: 5000, // Longer duration for errors
  style: {
    ...defaultOptions.style,
    background: '#ef4444',
  },
  iconTheme: {
    primary: '#fff',
    secondary: '#ef4444',
  },
});

// Warning toast
export const showWarning = createToastFunction(
  (message, options) => toast(message, { ...options, icon: '⚠️' }),
  {
    style: {
      ...defaultOptions.style,
      background: '#f59e0b',
    },
  }
);

// Info toast
export const showInfo = createToastFunction(
  (message, options) => toast(message, { ...options, icon: 'ℹ️' }),
  {
    style: {
      ...defaultOptions.style,
      background: '#3b82f6',
    },
  }
);

// Loading toast
export const showLoading = (message = 'Loading...', options = {}) => {
  const {
    preventDuplicate = true,
    dedupId = null,
    dedupWindow = DEFAULT_DEDUP_WINDOW,
    ...restOptions
  } = options;
  
  // Check for duplicates if enabled
  if (preventDuplicate && shouldPreventDuplicate(message, dedupId, dedupWindow)) {
    return null;
  }
  
  const toastId = toast.loading(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#6b7280',
    },
    ...restOptions,
  });
  
  registerToast(toastId, message, dedupId);
  return toastId;
};

// Promise toast - automatically handles loading, success, and error states
export const showPromise = (promise, messages, options = {}) => {
  const { loading = 'Loading...', success = 'Success!', error = 'Something went wrong!' } = messages;
  const {
    preventDuplicate = true,
    dedupId = null,
    dedupWindow = DEFAULT_DEDUP_WINDOW,
    ...restOptions
  } = options;
  
  // Check for duplicates on the loading message
  if (preventDuplicate && shouldPreventDuplicate(loading, dedupId, dedupWindow)) {
    return null;
  }
  
  const toastId = toast.promise(
    promise,
    {
      loading,
      success,
      error: (err) => {
        // Handle different error formats
        if (typeof err === 'string') return err;
        if (err?.message) return err.message;
        if (err?.response?.data?.message) return err.response.data.message;
        return error;
      },
    },
    {
      ...defaultOptions,
      success: {
        ...defaultOptions,
        style: {
          ...defaultOptions.style,
          background: '#10b981',
        },
      },
      error: {
        ...defaultOptions,
        duration: 5000,
        style: {
          ...defaultOptions.style,
          background: '#ef4444',
        },
      },
      loading: {
        ...defaultOptions,
        style: {
          ...defaultOptions.style,
          background: '#6b7280',
        },
      },
      ...restOptions,
    }
  );
  
  registerToast(toastId, loading, dedupId);
  return toastId;
};

// Dismiss all toasts
export const dismissAll = () => {
  toast.dismiss();
  // Clear tracking
  activeToasts.clear();
  messageHistory.clear();
};

// Dismiss specific toast
export const dismiss = (toastId) => {
  toast.dismiss(toastId);
};

// Force show toast (bypass deduplication)
export const forceShow = {
  success: (message, options = {}) => showSuccess(message, { ...options, preventDuplicate: false }),
  error: (message, options = {}) => showError(message, { ...options, preventDuplicate: false }),
  warning: (message, options = {}) => showWarning(message, { ...options, preventDuplicate: false }),
  info: (message, options = {}) => showInfo(message, { ...options, preventDuplicate: false }),
  loading: (message, options = {}) => showLoading(message, { ...options, preventDuplicate: false }),
};

// Authentication specific toasts with deduplication IDs
export const authToasts = {
  loginSuccess: (userName) => showSuccess(`Welcome back, ${userName}!`, { dedupId: 'login-success' }),
  loginError: (message = 'Invalid email or password') => showError(message, { dedupId: 'login-error' }),
  logoutSuccess: () => showSuccess('Logged out successfully', { dedupId: 'logout-success' }),
  sessionExpired: () => showWarning('Your session has expired. Please log in again.', { 
    dedupId: 'session-expired',
    dedupWindow: 10000 // Longer window for session expiry
  }),
  unauthorized: () => showError('You are not authorized to perform this action', { dedupId: 'unauthorized' }),
  networkError: () => showError('Network error. Please check your connection and try again.', { 
    dedupId: 'network-error',
    dedupWindow: 5000 // Longer window for network errors
  }),
};

// Form validation toasts
export const validationToasts = {
  required: (field) => showError(`${field} is required`, { dedupId: `required-${field}` }),
  invalid: (field) => showError(`Please enter a valid ${field}`, { dedupId: `invalid-${field}` }),
  minLength: (field, min) => showError(`${field} must be at least ${min} characters`, { dedupId: `minlength-${field}` }),
  maxLength: (field, max) => showError(`${field} must not exceed ${max} characters`, { dedupId: `maxlength-${field}` }),
  passwordMismatch: () => showError('Passwords do not match', { dedupId: 'password-mismatch' }),
  weakPassword: () => showWarning('Password is too weak. Use a stronger password.', { dedupId: 'weak-password' }),
};

// API operation toasts
export const apiToasts = {
  created: (item) => showSuccess(`${item} created successfully`, { dedupId: `created-${item}` }),
  updated: (item) => showSuccess(`${item} updated successfully`, { dedupId: `updated-${item}` }),
  deleted: (item) => showSuccess(`${item} deleted successfully`, { dedupId: `deleted-${item}` }),
  fetchError: (item) => showError(`Failed to fetch ${item}`, { dedupId: `fetch-error-${item}` }),
  saveError: (item) => showError(`Failed to save ${item}`, { dedupId: `save-error-${item}` }),
  deleteError: (item) => showError(`Failed to delete ${item}`, { dedupId: `delete-error-${item}` }),
};

// Student management toasts
export const studentToasts = {
  registered: (name) => showSuccess(`Student ${name} registered successfully`, { dedupId: `registered-${name}` }),
  updated: (name) => showSuccess(`Student ${name} updated successfully`, { dedupId: `updated-${name}` }),
  promoted: (name, grade) => showSuccess(`${name} promoted to ${grade} successfully`, { dedupId: `promoted-${name}` }),
  transferred: (name, newClass) => showSuccess(`${name} transferred to ${newClass} successfully`, { dedupId: `transferred-${name}` }),
  graduated: (name) => showSuccess(`${name} graduated successfully`, { dedupId: `graduated-${name}` }),
  registrationError: () => showError('Failed to register student', { dedupId: 'registration-error' }),
  promotionError: () => showError('Failed to promote student', { dedupId: 'promotion-error' }),
  transferError: () => showError('Failed to transfer student', { dedupId: 'transfer-error' }),
};

// Utility functions for managing deduplication
export const deduplication = {
  // Clear all tracking
  clear: () => {
    activeToasts.clear();
    messageHistory.clear();
  },
  
  // Clear specific ID tracking
  clearId: (id) => {
    activeToasts.delete(id);
  },
  
  // Check if message/ID is currently blocked
  isBlocked: (message, id = null) => {
    return shouldPreventDuplicate(message, id);
  },
  
  // Get current tracking stats
  getStats: () => ({
    activeToasts: activeToasts.size,
    messageHistory: messageHistory.size,
  }),
};

// Export all toast functions
export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  promise: showPromise,
  dismiss,
  dismissAll,
  force: forceShow,
  auth: authToasts,
  validation: validationToasts,
  api: apiToasts,
  student: studentToasts,
  deduplication,
};

// Named export for components expecting showToast
export const showToast = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  promise: showPromise,
  dismiss,
  dismissAll,
}; 