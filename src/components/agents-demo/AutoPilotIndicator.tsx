/**
 * SANNIDH AUTO-PILOT INDICATOR
 * ============================
 * A minimal, glowing status indicator for the top Navbar.
 * Shows that the 12 background CA agents are actively monitoring.
 * 
 * Uses React.useContext with a null-check so it safely renders
 * nothing when outside the CAAgentOrchestrator provider (e.g.,
 * on non-CA pages like landing page, company dashboard, etc.)
 */

import React, { createContext, useContext } from 'react';
import { motion } from 'framer-motion';

// Re-export the context type from the CA orchestrator for safe access.
// We define a standalone context reference here that matches the one
// in CAAgentOrchestrator, so we don't need to import the hook (which throws).
// Instead, we import the context itself.

// This component will be rendered by the Navbar which may or may not be
// inside a CAAgentOrchestratorProvider. We handle that gracefully.

interface AutoPilotState {
  agents: Array<{ status: string }>;
  isRunning: boolean;
}

/**
 * AutoPilotIndicator renders only when wrapped in the CA Agent Orchestrator.
 * On all other pages, it renders nothing — no errors, no exceptions.
 */
export const AutoPilotIndicator = ({ orchestratorState }: { orchestratorState?: AutoPilotState | null }) => {
  if (!orchestratorState) return null;

  const activeCount = orchestratorState.agents.filter(a => 
    a.status === 'active' || a.status === 'working' || a.status === 'analyzing'
  ).length;

  const isOnline = orchestratorState.isRunning && activeCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-default"
      style={{
        background: isOnline
          ? 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(34,197,94,0.08) 100%)'
          : 'rgba(239,68,68,0.08)',
        borderColor: isOnline ? 'rgba(6,182,212,0.25)' : 'rgba(239,68,68,0.25)',
        boxShadow: isOnline ? '0 0 12px rgba(6,182,212,0.15), 0 0 4px rgba(6,182,212,0.1)' : 'none',
      }}
      title={isOnline ? `${activeCount}/12 agents active` : 'Agents offline'}
    >
      <span className="relative flex h-2 w-2">
        {isOnline && (
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-cyan-400' : 'bg-red-400'}`} />
      </span>

      <span className={`text-[10px] font-semibold tracking-wide ${isOnline ? 'text-cyan-400' : 'text-red-400'}`}>
        Auto-Pilot: {isOnline ? 'ON' : 'OFF'}
      </span>
    </motion.div>
  );
};
