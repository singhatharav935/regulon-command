/**
 * Enhanced Authentication Service
 * Production-ready authentication powered by Supabase Auth
 * with client-side security features (rate limiting, device tracking)
 */

import { supabase } from "@/integrations/supabase/client";
import { ClientRateLimiter, validatePasswordStrength, generateSecureToken } from "./security";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  registration_role: string;
  verification_entity_name?: string;
  email_verified: boolean;
  profile_completed: boolean;
  created_at?: string;
  last_login?: string;
  login_count?: number;
  account_locked?: boolean;
  lockout_until?: string;
  failed_attempts?: number;
}

export interface AuthSession {
  id: string;
  user_id: string;
  device_info: DeviceInfo;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

export interface DeviceInfo {
  device_id: string;
  device_name: string;
  browser: string;
  os: string;
  is_mobile: boolean;
  is_trusted: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refresh_token: string;
  expires_in: number;
  message: string;
  session: AuthSession;
  requiresEmailConfirmation?: boolean;
}

export interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'account_locked' | 'suspicious_activity';
  ip_address: string;
  user_agent: string;
  details?: string;
  timestamp: string;
}

// Rate limiters for different operations
const loginRateLimiter = new ClientRateLimiter(5, 60000); // 5 attempts per minute
const registrationRateLimiter = new ClientRateLimiter(3, 300000); // 3 attempts per 5 minutes
const passwordResetLimiter = new ClientRateLimiter(2, 600000); // 2 attempts per 10 minutes

class EnhancedAuthService {
  private currentUser: AuthUser | null = null;
  private currentSession: AuthSession | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private deviceId: string;
  private suspiciousActivityScore = 0;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.loadStoredAuth();
    this.startSessionListener();
    this.trackDeviceFingerprint();
  }

  /**
   * Generate or retrieve device ID for tracking
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('sannidh_device_id');
    if (!deviceId) {
      deviceId = generateSecureToken(16);
      localStorage.setItem('sannidh_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Load authentication state from storage
   */
  private loadStoredAuth(): void {
    try {
      const userStr = localStorage.getItem('sannidh_user');
      const sessionStr = localStorage.getItem('sannidh_session');
      
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        // Respect the freshly-set current_user_role over any stale backend user role.
        const freshRole = localStorage.getItem('current_user_role');
        if (freshRole && parsedUser.registration_role !== freshRole) {
          parsedUser.registration_role = freshRole;
        }
        this.currentUser = parsedUser;
      }
      if (sessionStr) this.currentSession = JSON.parse(sessionStr);
    } catch (error) {
      console.warn('Error loading stored auth:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Clear stored authentication data
   */
  private clearStoredAuth(): void {
    localStorage.removeItem('sannidh_auth_token');
    localStorage.removeItem('sannidh_refresh_token');
    localStorage.removeItem('sannidh_user');
    localStorage.removeItem('sannidh_session');
    this.currentUser = null;
    this.currentSession = null;
  }

  /**
   * Track device fingerprint for security
   */
  private trackDeviceFingerprint(): void {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      platform: navigator.platform,
    };
    
    localStorage.setItem('sannidh_device_fingerprint', JSON.stringify(fingerprint));
  }

  /**
   * Listen for Supabase auth state changes and keep local state in sync
   */
  private startSessionListener(): void {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: meta.full_name || '',
          registration_role: meta.registration_role || 'company_owner',
          verification_entity_name: meta.verification_entity_name,
          email_verified: !!session.user.email_confirmed_at,
          profile_completed: true,
          created_at: session.user.created_at,
          last_login: new Date().toISOString(),
        };
        this.currentUser = authUser;
        localStorage.setItem('sannidh_user', JSON.stringify(authUser));

        if (session.access_token) {
          localStorage.setItem('sannidh_auth_token', session.access_token);
        }
        if (session.refresh_token) {
          localStorage.setItem('sannidh_refresh_token', session.refresh_token);
        }
      } else {
        // User signed out or session expired
        this.currentUser = null;
        this.clearStoredAuth();
      }
    });
  }

  /**
   * Build AuthUser from a Supabase User object
   */
  private buildAuthUser(supabaseUser: any): AuthUser {
    const meta = supabaseUser.user_metadata || {};
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      full_name: meta.full_name || '',
      registration_role: meta.registration_role || 'company_owner',
      verification_entity_name: meta.verification_entity_name,
      email_verified: !!supabaseUser.email_confirmed_at,
      profile_completed: true,
      created_at: supabaseUser.created_at,
      last_login: new Date().toISOString(),
    };
  }

  /**
   * Build a mock AuthSession from a Supabase session
   */
  private buildAuthSession(supabaseSession: any): AuthSession {
    return {
      id: supabaseSession?.access_token?.slice(0, 16) || generateSecureToken(8),
      user_id: supabaseSession?.user?.id || '',
      device_info: this.getDeviceInfo(),
      ip_address: '0.0.0.0',
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      is_current: true,
    };
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    const parser = new UAParser();
    const result = parser.getResult();

    return {
      device_id: this.deviceId,
      device_name: this.getDeviceName(result),
      browser: `${result.browser.name} ${result.browser.version}`,
      os: `${result.os.name} ${result.os.version}`,
      is_mobile: result.device.type === 'mobile' || result.device.type === 'tablet',
      is_trusted: localStorage.getItem(`trusted_device_${this.deviceId}`) === 'true',
    };
  }

  /**
   * Generate user-friendly device name
   */
  private getDeviceName(uaResult: any): string {
    const { browser, os, device } = uaResult;
    
    if (device.vendor && device.model) {
      return `${device.vendor} ${device.model}`;
    }
    
    return `${browser.name} on ${os.name}`;
  }

  /**
   * Register new user with Supabase Auth
   */
  async register(
    email: string,
    password: string,
    fullName: string,
    registrationRole: string,
    entityName?: string,
    rememberDevice = false
  ): Promise<AuthResponse> {
    if (!registrationRateLimiter.canProceed()) {
      throw new Error('Too many registration attempts. Please try again later.');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password requirements: ${passwordValidation.feedback.join(', ')}`);
    }

    const redirectUrl = `${window.location.origin}/auth?mode=login&role=${registrationRole}`;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName.trim(),
          registration_role: registrationRole,
          verification_entity_name: entityName?.trim(),
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed. Please try again.');
    }

    // Detect fake user for duplicate signups (identities array is empty)
    const identities = (data.user as any)?.identities ?? data.user?.identities;
    if (Array.isArray(identities) && identities.length === 0) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const needsConfirmation = !data.session;
    const authUser = this.buildAuthUser(data.user);
    const authSession = data.session ? this.buildAuthSession(data.session) : this.buildAuthSession(null);

    const response: AuthResponse = {
      user: authUser,
      token: data.session?.access_token || '',
      refresh_token: data.session?.refresh_token || '',
      expires_in: data.session?.expires_in || 0,
      message: needsConfirmation
        ? 'Account created! Please check your email to confirm your account.'
        : 'Account created successfully!',
      session: authSession,
      requiresEmailConfirmation: needsConfirmation,
    };

    if (data.session) {
      this.storeAuthData(response, rememberDevice);
    } else {
      // Store user info for the email verification flow, but not session tokens
      this.currentUser = authUser;
      localStorage.setItem('sannidh_user', JSON.stringify(authUser));
    }

    return response;
  }

  /**
   * Login user with Supabase Auth
   */
  async login(
    email: string,
    password: string,
    rememberMe = false,
    trustDevice = false
  ): Promise<AuthResponse> {
    if (!loginRateLimiter.canProceed()) {
      throw new Error('Too many login attempts. Please try again in a minute.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      if (msg.includes('email not confirmed')) {
        throw new Error('Please confirm your email before signing in. Check your inbox for the confirmation link.');
      }
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed. Please try again.');
    }

    const authUser = this.buildAuthUser(data.user);
    const authSession = this.buildAuthSession(data.session);

    const response: AuthResponse = {
      user: authUser,
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      message: 'Login successful!',
      session: authSession,
    };

    this.storeAuthData(response, rememberMe);
    
    if (trustDevice) {
      localStorage.setItem(`trusted_device_${this.deviceId}`, 'true');
    }

    // Reset suspicious activity score on successful login
    this.suspiciousActivityScore = 0;

    return response;
  }

  /**
   * Store authentication data securely
   */
  private storeAuthData(response: AuthResponse, _remember: boolean): void {
    // Always persist to localStorage so sessions survive browser restarts
    // (device-level persistence). Supabase's own persistSession: true already
    // stores the real session in localStorage; this keeps the wrapper consistent.
    localStorage.setItem('sannidh_auth_token', response.token);
    localStorage.setItem('sannidh_refresh_token', response.refresh_token);
    localStorage.setItem('sannidh_user', JSON.stringify(response.user));
    localStorage.setItem('sannidh_session', JSON.stringify(response.session));
    // Also store in localStorage so the api.ts service can read it
    localStorage.setItem('auth_token', response.token);

    this.currentUser = response.user;
    this.currentSession = response.session;
  }

  /**
   * Refresh authentication token via Supabase
   */
  async refreshToken(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        throw new Error(error?.message || 'Session refresh failed');
      }

      const storage = localStorage.getItem('sannidh_auth_token') ? localStorage : sessionStorage;
      storage.setItem('sannidh_auth_token', data.session.access_token);
      storage.setItem('sannidh_refresh_token', data.session.refresh_token);
      localStorage.setItem('auth_token', data.session.access_token);

      if (data.user) {
        this.currentUser = this.buildAuthUser(data.user);
        localStorage.setItem('sannidh_user', JSON.stringify(this.currentUser));
      }
    } catch (error) {
      console.warn('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      this.clearStoredAuth();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user_role');
      localStorage.removeItem('pending_registration_role');
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    }
  }

  /**
   * Request password reset via Supabase
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    if (!passwordResetLimiter.canProceed()) {
      throw new Error('Too many password reset requests. Please try again later.');
    }

    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: redirectUrl }
    );

    if (error) throw new Error(error.message);
    return { message: 'Password reset email sent. Please check your inbox.' };
  }

  /**
   * Reset password with token (user is already authenticated via the reset link)
   */
  async resetPassword(_token: string, newPassword: string): Promise<{ message: string }> {
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password requirements: ${passwordValidation.feedback.join(', ')}`);
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    return { message: 'Password has been reset successfully.' };
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(_currentPassword: string, newPassword: string): Promise<{ message: string }> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password requirements: ${passwordValidation.feedback.join(', ')}`);
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    return { message: 'Password changed successfully.' };
  }

  /**
   * Get user sessions — Supabase doesn't expose multi-session management on the client,
   * so we return the current session only.
   */
  async getSessions(): Promise<AuthSession[]> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }
    return this.currentSession ? [this.currentSession] : [];
  }

  /**
   * Revoke a specific session (sign out)
   */
  async revokeSession(_sessionId: string): Promise<{ message: string }> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }
    await this.logout();
    return { message: 'Session revoked.' };
  }

  /**
   * Get security events/audit trail (placeholder — would need a custom table)
   */
  async getSecurityEvents(_limit = 50): Promise<SecurityEvent[]> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }
    return [];
  }

  /**
   * Verify email with token (handled by Supabase link click)
   */
  async verifyEmail(_token: string): Promise<{ message: string }> {
    return { message: 'Email verified via confirmation link.' };
  }

  /**
   * Resend email verification via Supabase
   */
  async resendEmailVerification(): Promise<{ message: string }> {
    const email = this.currentUser?.email;
    if (!email) {
      throw new Error('No email to verify.');
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth?mode=login`,
      },
    });

    if (error) throw new Error(error.message);
    return { message: 'Verification email sent. Please check your inbox.' };
  }

  /**
   * Check if user is authenticated (has a valid Supabase session)
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('sannidh_auth_token') || 
                  sessionStorage.getItem('sannidh_auth_token');
    return Boolean(token && this.currentUser);
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Get current session
   */
  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * Get auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem('sannidh_auth_token') || 
           sessionStorage.getItem('sannidh_auth_token');
  }

  /**
   * Update user profile via Supabase
   */
  async updateProfile(updates: Partial<AuthUser>): Promise<AuthUser> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: updates.full_name,
        registration_role: updates.registration_role,
        verification_entity_name: updates.verification_entity_name,
      },
    });

    if (error) throw new Error(error.message);

    if (data.user) {
      this.currentUser = this.buildAuthUser(data.user);
      localStorage.setItem('sannidh_user', JSON.stringify(this.currentUser));
    }
    
    return this.currentUser!;
  }

  /**
   * Clean up on destroy
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
}

// Simple UA Parser alternative (basic detection)
class UAParser {
  getResult() {
    const userAgent = navigator.userAgent;
    
    return {
      browser: this.parseBrowser(userAgent),
      os: this.parseOS(userAgent),
      device: this.parseDevice(userAgent),
    };
  }

  private parseBrowser(ua: string) {
    if (ua.includes('Firefox')) return { name: 'Firefox', version: this.extractVersion(ua, 'Firefox/') };
    if (ua.includes('Chrome')) return { name: 'Chrome', version: this.extractVersion(ua, 'Chrome/') };
    if (ua.includes('Safari') && !ua.includes('Chrome')) return { name: 'Safari', version: this.extractVersion(ua, 'Version/') };
    if (ua.includes('Edge')) return { name: 'Edge', version: this.extractVersion(ua, 'Edge/') };
    return { name: 'Unknown', version: '' };
  }

  private parseOS(ua: string) {
    if (ua.includes('Windows')) return { name: 'Windows', version: '' };
    if (ua.includes('Macintosh')) return { name: 'macOS', version: '' };
    if (ua.includes('Linux')) return { name: 'Linux', version: '' };
    if (ua.includes('Android')) return { name: 'Android', version: '' };
    if (ua.includes('iPhone') || ua.includes('iPad')) return { name: 'iOS', version: '' };
    return { name: 'Unknown', version: '' };
  }

  private parseDevice(ua: string) {
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
      return { type: 'mobile', vendor: '', model: '' };
    }
    if (ua.includes('iPad') || ua.includes('Tablet')) {
      return { type: 'tablet', vendor: '', model: '' };
    }
    return { type: 'desktop', vendor: '', model: '' };
  }

  private extractVersion(ua: string, pattern: string): string {
    const index = ua.indexOf(pattern);
    if (index === -1) return '';
    
    const version = ua.substring(index + pattern.length);
    const match = version.match(/^[\d.]+/);
    return match ? match[0] : '';
  }
}

// Create singleton instance
export const enhancedAuth = new EnhancedAuthService();

// Export for cleanup on app unmount
export { EnhancedAuthService };