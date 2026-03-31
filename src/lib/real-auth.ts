/**
 * Real Authentication Service
 * Handles registration and login with real backend
 */

import { backendRequest } from "./real-backend";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  registration_role: string;
  verification_entity_name?: string;
  email_verified: boolean;
  profile_completed: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  expires_in: string;
  message: string;
}

/**
 * Register new user with real backend
 */
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  registrationRole: string,
  entityName?: string
): Promise<AuthResponse> {
  const response = await backendRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
      registration_role: registrationRole,
      verification_entity_name: entityName,
    }),
  });

  // Store token in localStorage
  localStorage.setItem('regulon_auth_token', response.token);
  localStorage.setItem('regulon_user', JSON.stringify(response.user));

  return response;
}

/**
 * Login user with real backend
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await backendRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });

  // Store token in localStorage
  localStorage.setItem('regulon_auth_token', response.token);
  localStorage.setItem('regulon_user', JSON.stringify(response.user));

  return response;
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  try {
    await backendRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of backend success
    localStorage.removeItem('regulon_auth_token');
    localStorage.removeItem('regulon_user');
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): AuthUser | null {
  const userStr = localStorage.getItem('regulon_user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('regulon_auth_token');
  const user = getCurrentUser();
  return Boolean(token && user);
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('regulon_auth_token');
}