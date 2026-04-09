/**
 * Real Backend API Configuration
 * Replaces workspace-backend.ts to use real backend
 */

const BACKEND_BASE_URL = '/api/v1';

export interface BackendResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class BackendError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'BackendError';
  }
}

/**
 * Make authenticated request to real backend
 */
export async function backendRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  const token = localStorage.getItem('regulon_auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new BackendError(response.status, data.message || data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    if (error instanceof BackendError) {
      throw error;
    }
    
    // Network or other errors
    throw new BackendError(0, `Network error: ${error.message}`);
  }
}

/**
 * Wrapper for workspace backend requests (for compatibility)
 */
export async function workspaceBackendRequest<T>(endpoint: string): Promise<T> {
  return backendRequest<T>(endpoint);
}