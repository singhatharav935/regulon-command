// Persona Authentication Context
import React, { createContext, useContext, useEffect, useState } from 'react';
import { PersonaType, SessionUser } from '@/types/personas';

interface PersonaAuthContextType {
  currentUser: SessionUser | null;
  loginAsPersona: (persona: PersonaType, email?: string, companyName?: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const PersonaAuthContext = createContext<PersonaAuthContextType | undefined>(undefined);

export function PersonaAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('persona_session');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        user.createdAt = new Date(user.createdAt);
        setCurrentUser(user);
      } catch {
        localStorage.removeItem('persona_session');
      }
    }
    setIsLoading(false);
  }, []);

  const loginAsPersona = (persona: PersonaType, email?: string, companyName?: string) => {
    const user: SessionUser = {
      id: `user_${Date.now()}`,
      email: email || `test_${persona}_${Date.now()}@sannidh.local`,
      persona,
      companyId: `company_${Date.now()}`,
      companyName: companyName || `Test ${persona} Company`,
      isTestUser: true,
      createdAt: new Date(),
    };

    setCurrentUser(user);
    localStorage.setItem('persona_session', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('persona_session');
  };

  return (
    <PersonaAuthContext.Provider value={{ currentUser, loginAsPersona, logout, isLoading }}>
      {children}
    </PersonaAuthContext.Provider>
  );
}

export function usePersonaAuth() {
  const context = useContext(PersonaAuthContext);
  if (!context) {
    throw new Error('usePersonaAuth must be used within PersonaAuthProvider');
  }
  return context;
}
