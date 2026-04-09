import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_VERSION = 'v1';
const BASE_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log performance metrics
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and performance logging
api.interceptors.response.use(
  (response) => {
    // Log performance metric
    const responseTime = Date.now() - response.config.metadata.startTime;
    logPerformanceMetric('api_response_time', responseTime, 'ms', {
      endpoint: response.config.url,
      method: response.config.method,
      status: response.status
    });
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('auth_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/auth';
          return Promise.reject(refreshError);
        }
      }
    }
    
    // Log error to backend
    logError({
      error_type: 'api_error',
      error_message: error.message,
      stack_trace: error.stack,
      request_data: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    
    return Promise.reject(error);
  }
);

/**
 * Enhanced API Service Class
 */
class APIService {
  
  /**
   * Authentication Methods
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user_data', JSON.stringify(user));
      
      return { user, token: access_token };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
    }
  }

  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(token, password) {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * User Profile Methods
   */
  async getUserProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUserProfile(userData) {
    try {
      const response = await api.put('/auth/profile', userData);
      return response.data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Security Methods
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post('/security/password/change', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkPasswordStrength(password) {
    try {
      const response = await api.post('/security/password/strength', { password });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserPersonas() {
    try {
      const response = await api.get('/security/personas');
      return response.data.personas;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addPersona(personaData) {
    try {
      const response = await api.post('/security/personas', personaData);
      return response.data.persona;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Company Methods
   */
  async getCompanies() {
    try {
      const response = await api.get('/company');
      return response.data.companies;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCompanyById(id) {
    try {
      const response = await api.get(`/company/${id}`);
      return response.data.company;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCompany(companyData) {
    try {
      const response = await api.post('/company', companyData);
      return response.data.company;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCompany(id, companyData) {
    try {
      const response = await api.put(`/company/${id}`, companyData);
      return response.data.company;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * CA Methods
   */
  async getCADashboardData() {
    try {
      const response = await api.get('/ca/dashboard');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCAClients() {
    try {
      const response = await api.get('/ca/clients');
      return response.data.clients;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCAWorkflows() {
    try {
      const response = await api.get('/ca/workflows');
      return response.data.workflows;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Admin Methods
   */
  async getAdminStats() {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAllUsers() {
    try {
      const response = await api.get('/admin/users');
      return response.data.users;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSystemHealth() {
    try {
      const response = await api.get('/monitoring/system');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Documents Methods
   */
  async getDocuments() {
    try {
      const response = await api.get('/documents');
      return response.data.documents;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadDocument(formData) {
    try {
      const response = await api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Tasks Methods
   */
  async getTasks() {
    try {
      const response = await api.get('/company/tasks');
      return response.data.tasks;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createTask(taskData) {
    try {
      const response = await api.post('/company/tasks', taskData);
      return response.data.task;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateTask(taskId, taskData) {
    try {
      const response = await api.put(`/company/tasks/${taskId}`, taskData);
      return response.data.task;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Notifications Methods
   */
  async getNotifications() {
    try {
      const response = await api.get('/notifications');
      return response.data.notifications;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reports Methods
   */
  async generateReport(reportType, filters = {}) {
    try {
      const response = await api.post('/reports/generate', {
        type: reportType,
        filters
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getReports() {
    try {
      const response = await api.get('/reports');
      return response.data.reports;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Audit Methods
   */
  async getAuditLogs(filters = {}) {
    try {
      const response = await api.get('/audit', { params: filters });
      return response.data.logs;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Health Check
   */
  async getHealthStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Error Handling
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

/**
 * Performance Monitoring
 */
async function logPerformanceMetric(metricName, value, unit, tags = {}) {
  try {
    await axios.post(`${BASE_URL}/monitoring/metrics`, {
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit,
      tags
    });
  } catch (error) {
    console.error('Failed to log performance metric:', error);
  }
}

/**
 * Error Logging
 */
async function logError(errorData) {
  try {
    await axios.post(`${BASE_URL}/security/errors`, {
      ...errorData,
      user_agent: navigator.userAgent
    });
  } catch (error) {
    console.error('Failed to log error:', error);
  }
}

// Export singleton instance
const apiService = new APIService();
export default apiService;

// Export individual functions for convenience
export {
  logPerformanceMetric,
  logError,
  api as axiosInstance
};