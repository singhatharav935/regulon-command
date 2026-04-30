import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AICommunicationContextProps {
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  triggerAI: (prompt: string, contextData?: any) => void;
  activePrompt: string;
  activeContext: any;
}

const AICommunicationContext = createContext<AICommunicationContextProps | undefined>(undefined);

export function AICommunicationProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');
  const [activeContext, setActiveContext] = useState<any>(null);

  const triggerAI = (prompt: string, contextData?: any) => {
    setActivePrompt(prompt);
    setActiveContext(contextData);
    setDrawerOpen(true);
  };

  return (
    <AICommunicationContext.Provider
      value={{
        isDrawerOpen,
        setDrawerOpen,
        triggerAI,
        activePrompt,
        activeContext,
      }}
    >
      {children}
    </AICommunicationContext.Provider>
  );
}

export function useAICommunication() {
  const context = useContext(AICommunicationContext);
  if (context === undefined) {
    throw new Error('useAICommunication must be used within an AICommunicationProvider');
  }
  return context;
}
