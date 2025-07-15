// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      LOGOUT_ALL: '/auth/logout-all',
      PROFILE: '/auth/profile',
      CHANGE_PASSWORD: '/auth/change-password',
      PERMISSIONS: '/auth/permissions',
      REFRESH: '/auth/refresh',
    },
    STUDENTS: {
      LIST: '/students',
      CREATE: '/students',
      SHOW: '/students/:id',
      UPDATE: '/students/:id',
      DELETE: '/students/:id',
      BY_CLASS: '/students/by-class/:classId',
      BY_GRADE: '/students/by-grade/:gradeId',
      WITH_OUTSTANDING_BILLS: '/students/with-outstanding-bills',
      BULK_PROMOTE: '/students/bulk-promote',
    },
    CLASSES: {
      LIST: '/classes',
      CREATE: '/classes',
      SHOW: '/classes/:id',
      UPDATE: '/classes/:id',
      DELETE: '/classes/:id',
      WITH_AVAILABLE_SPOTS: '/classes/with-available-spots',
      STATISTICS: '/classes/:id/statistics',
    },
    GRADES: {
      LIST: '/grades',
      CREATE: '/grades',
      SHOW: '/grades/:id',
      UPDATE: '/grades/:id',
      DELETE: '/grades/:id',
      ACTIVE: '/grades/active',
      STATISTICS: '/grades/statistics',
    },
    ACADEMIC_YEARS: {
      LIST: '/academic-years',
      CREATE: '/academic-years',
      SHOW: '/academic-years/:id',
      UPDATE: '/academic-years/:id',
      DELETE: '/academic-years/:id',
      CURRENT: '/academic-years/current',
      ACTIVE: '/academic-years/active',
      ACTIVATE: '/academic-years/:id/activate',
      CLOSE: '/academic-years/:id/close',
    },
    TERMS: {
      LIST: '/terms',
      CREATE: '/terms',
      SHOW: '/terms/:id',
      UPDATE: '/terms/:id',
      DELETE: '/terms/:id',
      CURRENT: '/terms/current',
      ACTIVE: '/terms/active',
      ACTIVATE: '/terms/:id/activate',
      COMPLETE: '/terms/:id/complete',
    },
    TARIFFS: {
      LIST: '/tariffs',
      CREATE: '/tariffs',
      SHOW: '/tariffs/:id',
      UPDATE: '/tariffs/:id',
      DELETE: '/tariffs/:id',
      ACTIVATE: '/tariffs/:id/activate',
      DEACTIVATE: '/tariffs/:id/deactivate',
      BY_CLASS: '/tariffs/by-class/:classId',
      STATISTICS: '/tariffs/statistics',
    },
    BILLING: {
      GENERATE_STUDENT: '/billing/generate/student/:studentId',
      GENERATE_CLASS: '/billing/generate/class/:classId',
      GENERATE_GRADE: '/billing/generate/grade/:gradeId',
      RECORD_PAYMENT: '/billing/bills/:billId/payment',
      CANCEL_BILL: '/billing/bills/:billId/cancel',
      STUDENT_BILLS: '/billing/students/:studentId/bills',
      STUDENT_BALANCE: '/billing/students/:studentId/balance',
      SUMMARY: '/billing/summary/:academicYearId',
      REVENUE_REPORT: '/billing/revenue-report/:academicYearId',
      MARK_OVERDUE: '/billing/mark-overdue',
    },
  },
  
  // HTTP Status Codes
  STATUS_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 422,
    SERVER_ERROR: 500,
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
  },
}

// Helper function to build endpoint URLs with parameters
export const buildEndpointUrl = (endpoint, params = {}) => {
  let url = endpoint
  
  // Replace path parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key])
  })
  
  return url
}

// Helper function to get full API URL
export const getApiUrl = (endpoint, params = {}) => {
  const endpointUrl = buildEndpointUrl(endpoint, params)
  return `${API_CONFIG.BASE_URL}${endpointUrl}`
}

export default API_CONFIG 