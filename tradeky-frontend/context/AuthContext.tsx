'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  token: string | null;
  login: (token: string, role?: string) => void;
  loginWithRedirect: (token: string, redirectUrl?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = (jwt: string, role?: string) => {
    localStorage.setItem('token', jwt);
    if (role) {
      localStorage.setItem('userRole', role);
    }
    setToken(jwt);
    router.push('/dashboard');
  };

  const loginWithRedirect = (jwt: string, redirectUrl?: string) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
    if (redirectUrl) {
      router.push(redirectUrl);
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ token, login, loginWithRedirect, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
