/**
 * SECTOR DEMO CONTEXT
 * ===================
 * Global state for the demo dashboard personalizer.
 * When a sector profile is set, the entire demo dashboard
 * uses this data instead of the static demo-data.ts.
 */

import { createContext, useContext, useState, type ReactNode } from "react";
import type { SectorProfile } from "@/lib/autoSectorEngine";

interface SectorDemoContextType {
  profile: SectorProfile | null;
  setProfile: (profile: SectorProfile | null) => void;
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const SectorDemoContext = createContext<SectorDemoContextType | null>(null);

export function SectorDemoProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SectorProfile | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <SectorDemoContext.Provider value={{ profile, setProfile, isModalOpen, setModalOpen }}>
      {children}
    </SectorDemoContext.Provider>
  );
}

export function useSectorDemo(): SectorDemoContextType {
  const ctx = useContext(SectorDemoContext);
  if (!ctx) throw new Error("useSectorDemo must be used within SectorDemoProvider");
  return ctx;
}
