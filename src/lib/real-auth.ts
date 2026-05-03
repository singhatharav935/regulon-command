/**
 * Real Authentication Service
 * Handles registration and login with Supabase Auth
 */

import { supabase } from "@/integrations/supabase/client";

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
 * Register new user with Supabase Auth
 */
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  registrationRole: string,
  entityName?: string
): Promise<AuthResponse> {
  const redirectUrl = `${window.location.origin}/auth?mode=login&role=${registrationRole}`;

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
        registration_role: registrationRole,
        verification_entity_name: entityName,
      },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Registration failed');

  const user: AuthUser = {
    id: data.user.id,
    email: data.user.email || '',
    full_name: fullName,
    registration_role: registrationRole,
    verification_entity_name: entityName,
    email_verified: !!data.user.email_confirmed_at,
    profile_completed: true,
  };

  if (data.session) {
    localStorage.setItem('sannidh_auth_token', data.session.access_token);
    localStorage.setItem('auth_token', data.session.access_token);
  }
  localStorage.setItem('sannidh_user', JSON.stringify(user));

  return {
    user,
    token: data.session?.access_token || '',
    expires_in: String(data.session?.expires_in || 0),
    message: data.session ? 'Account created!' : 'Please check your email to confirm your account.',
  };
}

/**
 * Login user with Supabase Auth
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw new Error(error.message);
  if (!data.user || !data.session) throw new Error('Login failed');

  const meta = data.user.user_metadata || {};
  const user: AuthUser = {
    id: data.user.id,
    email: data.user.email || '',
    full_name: meta.full_name || '',
    registration_role: meta.registration_role || 'company_owner',
    verification_entity_name: meta.verification_entity_name,
    email_verified: !!data.user.email_confirmed_at,
    profile_completed: true,
  };

  localStorage.setItem('sannidh_auth_token', data.session.access_token);
  localStorage.setItem('auth_token', data.session.access_token);
  localStorage.setItem('sannidh_user', JSON.stringify(user));

  return {
    user,
    token: data.session.access_token,
    expires_in: String(data.session.expires_in),
    message: 'Login successful',
  };
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('sannidh_auth_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('sannidh_user');
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): AuthUser | null {
  const userStr = localStorage.getItem('sannidh_user');
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
  const token = localStorage.getItem('sannidh_auth_token');
  const user = getCurrentUser();
  return Boolean(token && user);
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('sannidh_auth_token');
}