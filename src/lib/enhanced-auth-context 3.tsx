import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { enhancedAuth, type AuthUser } from '@/lib/enhanced-auth';
import { useToast } from '@/hooks/use-toast';

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
    // Initialize auth state
    const initializeAuth = () => {
      const currentUser = enhancedAuth.getCurrentUser();
      const isAuth = enhancedAuth.isAuthenticated();
      
      setUser(isAuth ? currentUser : null);
      setIsLoading(false);
    };

    initializeAuth();

    // Set up periodic token refresh
    const refreshInterval = setInterval(async () => {
      if (enhancedAuth.isAuthenticated()) {
        try {
          await enhancedAuth.refreshToken();
          const updatedUser = enhancedAuth.getCurrentUser();
          setUser(updatedUser);
        } catch (error) {
          console.warn('Token refresh failed:', error);
          // User will be logged out by the auth service
          setUser(null);
        }
      }
    }, 15 * 60 * 1000); // Every 15 minutes

    return () => {
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
      setUser(null);
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
    return null;
  }

  return <>{children}</>;
};