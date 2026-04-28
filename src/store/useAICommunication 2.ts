import { create } from 'zustand';

interface AICommunicationState {
  isDrawerOpen: boolean;
  activePrompt: string;
  activeContext: any;
  setDrawerOpen: (open: boolean) => void;
  triggerAI: (prompt: string, contextData?: any) => void;
}

export const useAICommunication = create<AICommunicationState>((set) => ({
  isDrawerOpen: false,
  activePrompt: '',
  activeContext: null,
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  triggerAI: (prompt, contextData) => set({ 
    isDrawerOpen: true, 
    activePrompt: prompt, 
    activeContext: contextData 
  }),
}));
