/**
 * Enhanced Authentication Service
 * Production-ready authentication with advanced security features
 */

import { backendRequest } from "./real-backend";
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
  private refreshTimer: NodeJS.Timeout | null = null;
  private deviceId: string;
  private suspiciousActivityScore = 0;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.loadStoredAuth();
    this.startTokenRefreshTimer();
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
        // This prevents a previously stored in_house_ca account from overriding
        // a fresh external_ca registration that just happened.
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
   * Detect suspicious activity based on various factors
   */
  private detectSuspiciousActivity(): boolean {
    const storedFingerprint = localStorage.getItem('sannidh_device_fingerprint');
    if (!storedFingerprint) return false;

    try {
      const stored = JSON.parse(storedFingerprint);
      const current = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`,
        platform: navigator.platform,
      };

      // Check for significant changes
      if (stored.userAgent !== current.userAgent) this.suspiciousActivityScore += 2;
      if (stored.timezone !== current.timezone) this.suspiciousActivityScore += 1;
      if (stored.platform !== current.platform) this.suspiciousActivityScore += 3;

      return this.suspiciousActivityScore >= 3;
    } catch {
      return false;
    }
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
   * Register new user with enhanced security
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

    const deviceInfo = this.getDeviceInfo();
    const isSuspicious = this.detectSuspiciousActivity();

    const response = await backendRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        registration_role: registrationRole,
        verification_entity_name: entityName?.trim(),
        device_info: deviceInfo,
        suspicious_activity: isSuspicious,
      }),
    });

    this.storeAuthData(response, rememberDevice);
    return response;
  }

  /**
   * Login user with enhanced security
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

    const deviceInfo = this.getDeviceInfo();
    const isSuspicious = this.detectSuspiciousActivity();

    try {
      const response = await backendRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          device_info: deviceInfo,
          remember_me: rememberMe,
          trust_device: trustDevice,
          suspicious_activity: isSuspicious,
        }),
      });

      this.storeAuthData(response, rememberMe);
      
      if (trustDevice) {
        localStorage.setItem(`trusted_device_${this.deviceId}`, 'true');
      }

      // Reset suspicious activity score on successful login
      this.suspiciousActivityScore = 0;

      return response;
    } catch (error) {
      // Track failed login attempt
      console.warn('Login failed:', error.message);
      throw error;
    }
  }

  /**
   * Store authentication data securely
   */
  private storeAuthData(response: AuthResponse, remember: boolean): void {
    const storage = remember ? localStorage : sessionStorage;
    
    storage.setItem('sannidh_auth_token', response.token);
    storage.setItem('sannidh_refresh_token', response.refresh_token);
    localStorage.setItem('sannidh_user', JSON.stringify(response.user));
    localStorage.setItem('sannidh_session', JSON.stringify(response.session));

    this.currentUser = response.user;
    this.currentSession = response.session;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('sannidh_refresh_token') || 
                        sessionStorage.getItem('sannidh_refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await backendRequest<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: refreshToken,
          device_id: this.deviceId,
        }),
      });

      // Update stored tokens
      const storage = localStorage.getItem('sannidh_auth_token') ? localStorage : sessionStorage;
      storage.setItem('sannidh_auth_token', response.token);
      storage.setItem('sannidh_refresh_token', response.refresh_token);

      this.currentUser = response.user;
      this.currentSession = response.session;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Start automatic token refresh timer
   */
  private startTokenRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Refresh token every 15 minutes
    this.refreshTimer = setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshToken().catch(() => {
          // Silent fail - user will be logged out
        });
      }
    }, 15 * 60 * 1000);
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await backendRequest<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          session_id: this.currentSession?.id,
        }),
      });
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      this.clearStoredAuth();
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    if (!passwordResetLimiter.canProceed()) {
      throw new Error('Too many password reset requests. Please try again later.');
    }

    return backendRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password requirements: ${passwordValidation.feedback.join(', ')}`);
    }

    return backendRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        password: newPassword,
      }),
    });
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password requirements: ${passwordValidation.feedback.join(', ')}`);
    }

    return backendRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  /**
   * Get user sessions (for device management)
   */
  async getSessions(): Promise<AuthSession[]> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const response = await backendRequest<{ sessions: AuthSession[] }>('/auth/sessions');
    return response.sessions;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<{ message: string }> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    return backendRequest<{ message: string }>(`/auth/sessions/${sessionId}/revoke`, {
      method: 'DELETE',
    });
  }

  /**
   * Get security events/audit trail
   */
  async getSecurityEvents(limit = 50): Promise<SecurityEvent[]> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const response = await backendRequest<{ events: SecurityEvent[] }>(`/auth/security-events?limit=${limit}`);
    return response.events;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    return backendRequest<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<{ message: string }> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    return backendRequest<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
    });
  }

  /**
   * Check if user is authenticated
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
   * Update user profile
   */
  async updateProfile(updates: Partial<AuthUser>): Promise<AuthUser> {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    const response = await backendRequest<{ user: AuthUser }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    this.currentUser = response.user;
    localStorage.setItem('sannidh_user', JSON.stringify(response.user));
    
    return response.user;
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