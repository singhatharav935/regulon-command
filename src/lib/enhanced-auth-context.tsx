import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { enhancedAuth, type AuthUser } from '@/lib/enhanced-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';

interface EnhancedAuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean, trustDevice?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, fullName: string, role: string, entityName?: string) => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const EnhancedAuthContext = createContext<EnhancedAuthContextValue | null>(null);

interface EnhancedAuthProviderProps {
  children: React.ReactNode;
}

export const EnhancedAuthProvider: React.FC<EnhancedAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    // Helper to build AuthUser from a Supabase session user
    const buildUserFromSession = (sessionUser: any, session: any): AuthUser => {
      const meta = sessionUser.user_metadata || {};
      // Respect the freshly-set current_user_role over any stale backend user role.
      const freshRole = localStorage.getItem('current_user_role');
      const registrationRole = freshRole || meta.registration_role || 'company_owner';

      const authUser: AuthUser = {
        id: sessionUser.id,
        email: sessionUser.email || '',
        full_name: meta.full_name || '',
        registration_role: registrationRole,
        verification_entity_name: meta.verification_entity_name,
        email_verified: !!sessionUser.email_confirmed_at,
        profile_completed: true,
        created_at: sessionUser.created_at,
        last_login: new Date().toISOString(),
      };

      // Sync tokens to localStorage so sessions survive browser restarts
      if (session.access_token) {
        localStorage.setItem('sannidh_auth_token', session.access_token);
        localStorage.setItem('auth_token', session.access_token);
      }
      if (session.refresh_token) {
        localStorage.setItem('sannidh_refresh_token', session.refresh_token);
      }
      localStorage.setItem('sannidh_user', JSON.stringify(authUser));

      return authUser;
    };

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Asynchronously retrieve active session, which auto-refreshes if expired
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          if (cancelled) return;
          const authUser = buildUserFromSession(session.user, session);
          setUser(authUser);
        } else {
          // If no active session, but we have stored tokens, try manual refresh
          const storedRefresh = localStorage.getItem('sannidh_refresh_token');
          if (storedRefresh) {
            try {
              const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
              if (!refreshErr && refreshData.session) {
                if (cancelled) return;
                const authUser = buildUserFromSession(refreshData.session.user, refreshData.session);
                setUser(authUser);
                setIsLoading(false);
                return;
              }
            } catch (e) {
              console.warn('Initial session refresh failed:', e);
            }
          }
          
          // Default to fallback if no active session
          if (cancelled) return;
          const storedUser = localStorage.getItem('sannidh_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Initial session check failed:', err);
        if (cancelled) return;
        // Fallback to local storage if offline (keeps user logged in)
        const currentUser = enhancedAuth.getCurrentUser();
        const isAuth = enhancedAuth.isAuthenticated();
        setUser(isAuth ? currentUser : null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for Supabase auth state changes (covers cross-tab login/logout,
    // token refreshes, and email verification callbacks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        const authUser = buildUserFromSession(session.user, session);
        setUser(authUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // Clear all stored auth data
        localStorage.removeItem('sannidh_auth_token');
        localStorage.removeItem('sannidh_refresh_token');
        localStorage.removeItem('sannidh_user');
        localStorage.removeItem('auth_token');
      }
    });

    // Set up periodic token refresh
    const refreshInterval = setInterval(async () => {
      if (enhancedAuth.isAuthenticated()) {
        try {
          await enhancedAuth.refreshToken();
          const updatedUser = enhancedAuth.getCurrentUser();
          if (updatedUser && !cancelled) setUser(updatedUser);
        } catch (error) {
          console.warn('[EnhancedAuth] Token refresh failed (preserving active user session):', error);
          const currentUser = enhancedAuth.getCurrentUser();
          if (currentUser && !cancelled) {
            setUser(currentUser);
          }
        }
      }
    }, 15 * 60 * 1000); // Every 15 minutes

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const login = async (email: string, password: string, rememberMe = false, trustDevice = false) => {
    try {
      const response = await enhancedAuth.login(email, password, rememberMe, trustDevice);
      setUser(response.user);
    } catch (error) {
      throw error; // Re-throw for component handling
    }
  };

  const logout = async () => {
    try {
      await enhancedAuth.logout();
      setUser(null);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear state even if logout fails
      setUser(null);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: string, 
    entityName?: string
  ) => {
    try {
      const response = await enhancedAuth.register(email, password, fullName, role, entityName);
      setUser(response.user);
    } catch (error) {
      throw error; // Re-throw for component handling
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      const updatedUser = await enhancedAuth.updateProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      throw error; // Re-throw for component handling
    }
  };

  const refreshUser = async () => {
    try {
      await enhancedAuth.refreshToken();
      const updatedUser = enhancedAuth.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: EnhancedAuthContextValue = {
    user,
    isAuthenticated: !!user && enhancedAuth.isAuthenticated(),
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    refreshUser,
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};

export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within EnhancedAuthProvider');
  }
  return context;
};

// Enhanced protected route component
interface EnhancedProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireEmailVerified?: boolean;
  requireProfileComplete?: boolean;
  fallbackPath?: string;
}

export const EnhancedProtectedRoute: React.FC<EnhancedProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireEmailVerified = true,
  requireProfileComplete = false,
  fallbackPath = '/auth',
}) => {
  const { user, isAuthenticated, isLoading } = useEnhancedAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      navigate(fallbackPath, { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }

    if (requireEmailVerified && !user.email_verified) {
      navigate('/auth?mode=email-verification', { replace: true });
      return;
    }

    if (requireProfileComplete && !user.profile_completed) {
      navigate('/profile/complete', { replace: true });
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.registration_role)) {
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [isLoading, isAuthenticated, user, navigate, allowedRoles, requireEmailVerified, requireProfileComplete, fallbackPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground text-sm">Redirecting to login...</p></div>;
  }

  return <>{children}</>;
};

export default EnhancedAuthProvider;