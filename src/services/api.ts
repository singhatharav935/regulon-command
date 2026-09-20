/**
 * API Service - Frontend API integration
 * Connects to Real Backend for CA Dashboard and other features
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/v1` : '/api/v1';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Get user ID from localStorage
const getUserId = () => {
  return localStorage.getItem('user_id');
};

// Get user role from localStorage
const getUserRole = () => {
  return localStorage.getItem('current_user_role');
};

/**
 * Generic API request handler
 */
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 - redirect to login
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        window.location.href = '/auth';
        throw new Error('Unauthorized');
      }
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Callers handle their own error state — no need to log here
    throw error;
  }
};

/**
 * CA Dashboard Services
 */

// GET CA Control Tower Stats
export const getCAMetrics = async () => {
  return apiRequest('/ca/dashboard/stats', {
    method: 'GET',
  });
};

// GET CA Client Portfolio
export const getCAClientPortfolio = async (params?: {
  page?: number;
  limit?: number;
  risk_level?: string;
  search?: string;
}) => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, String(value));
      }
    });
  }
  return apiRequest(`/ca/clients/portfolio?${query.toString()}`, {
    method: 'GET',
  });
};

// GET CA Filings Dashboard
export const getCAFilings = async (params?: {
  status?: string;
  period?: string;
}) => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, String(value));
      }
    });
  }
  return apiRequest(`/ca/filings/dashboard?${query.toString()}`, {
    method: 'GET',
  });
};

// POST Add Company
export const addCompany = async (companyData: {
  pan?: string;
  cin?: string;
  name: string;
  industry: string;
  email?: string;
  phone?: string;
}) => {
  return apiRequest('/ca/companies/add', {
    method: 'POST',
    body: JSON.stringify(companyData),
  });
};

// GET Pending Dependencies
export const getPendingDependencies = async () => {
  return apiRequest('/ca/dependencies/pending', {
    method: 'GET',
  });
};

// POST Send Reminder for Dependency
export const sendDependencyReminder = async (dependencyId: string, reminderType: string = 'whatsapp') => {
  return apiRequest('/ca/dependencies/send-reminder', {
    method: 'POST',
    body: JSON.stringify({
      dependency_id: dependencyId,
      reminder_type: reminderType,
    }),
  });
};

// POST AI Drafting
export const generateAIDraft = async (draftData: {
  client_id?: string;
  document_type: string;
  input_document: string;
  instructions?: string;
}) => {
  return apiRequest('/ca/ai/draft-response', {
    method: 'POST',
    body: JSON.stringify(draftData),
  });
};

/**
 * Company Dashboard Services
 */

// GET Company Compliance Status
export const getComplianceStatus = async () => {
  return apiRequest('/company/compliance/status', {
    method: 'GET',
  });
};

// GET Company Tasks
export const getCompanyTasks = async () => {
  return apiRequest('/company/tasks', {
    method: 'GET',
  });
};

/**
 * General Services
 */

// Check API Health
export const checkAPIHealth = async () => {
  try {
    return await apiRequest('/health', {
      method: 'GET',
    });
  } catch (error) {
    return { success: false, message: 'API unreachable' };
  }
};

// Get Current User Info
export const getCurrentUser = async () => {
  return apiRequest('/user/profile', {
    method: 'GET',
  });
};

/**
 * Export all methods
 */
export default {
  getCAMetrics,
  getCAClientPortfolio,
  getCAFilings,
  addCompany,
  getPendingDependencies,
  sendDependencyReminder,
  generateAIDraft,
  getComplianceStatus,
  getCompanyTasks,
  checkAPIHealth,
  getCurrentUser,
};
