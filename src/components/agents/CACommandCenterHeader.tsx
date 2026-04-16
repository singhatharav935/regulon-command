/**
 * CA COMMAND CENTER HEADER
 * ========================
 * Premium header for the External CA Dashboard.
 * Shows practice metrics ring, agent swarm status, client count,
 * agent control buttons, and Regulon Auto-Pilot ON/OFF indicator.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PowerOff, Play, Pause, RefreshCw, Shield, 
  Activity, Clock, AlertOctagon, Bot, Wifi, Building, Users, Briefcase
} from 'lucide-react';
import { useCAAgentOrchestrator, type CAAgentStatus } from './CAAgentOrchestrator';

interface CACommandCenterHeaderProps {
  title?: string;
  subtitle?: string;
}

export const CACommandCenterHeader = ({ title, subtitle }: CACommandCenterHeaderProps) => {
  const { state, actions } = useCAAgentOrchestrator();

  const activeAgentCount = state.agents.filter(a => 
    a.status === 'active' || a.status === 'working' || a.status === 'analyzing'
  ).length;

  const alertCount = state.agents.filter(a => a.status === 'alert').length;
  const isOnline = state.isRunning && activeAgentCount > 0;

  const timeSinceSync = useMemo(() => {
    const diff = Date.now() - new Date(state.lastSyncTime).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }, [state.lastSyncTime]);

  // Practice utilization ring
  const utilizationPercent = Math.round((activeAgentCount / 12) * 100);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (utilizationPercent / 100) * circumference;
  const ringColor = utilizationPercent >= 80 ? '#22c55e' : utilizationPercent >= 50 ? '#eab308' : '#ef4444';

  const statusDotColor = (status: CAAgentStatus) => {
    switch (status) {
      case 'active': return 'bg-green-400';
      case 'working': return 'bg-blue-400';
      case 'analyzing': return 'bg-cyan-400';
      case 'alert': return 'bg-red-400';
      case 'error': return 'bg-red-500';
      case 'paused': return 'bg-yellow-400';
      default: return 'bg-slate-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mb-8 p-5 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(16,185,129,0.05) 100%)',
        border: '1px solid rgba(6,182,212,0.15)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div className="relative flex flex-col lg:flex-row items-center gap-5">
        {/* Left: Utilization Ring */}
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <motion.circle
                cx="50" cy="50" r={radius} fill="none"
                stroke={ringColor} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 6px ${ringColor}40)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-2xl font-bold text-foreground">{activeAgentCount}</motion.span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Agents</span>
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{title || 'CA Practice Command Center'}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Briefcase className="w-3 h-3 text-cyan-400" />
              {subtitle || 'External CA — AI-Powered Practice Management'}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Auto-Pilot ON/OFF Indicator — inside the header */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border cursor-default"
                style={{
                  background: isOnline
                    ? 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(34,197,94,0.12) 100%)'
                    : 'rgba(239,68,68,0.12)',
                  borderColor: isOnline ? 'rgba(6,182,212,0.35)' : 'rgba(239,68,68,0.35)',
                  boxShadow: isOnline ? '0 0 14px rgba(6,182,212,0.2), 0 0 5px rgba(6,182,212,0.12)' : 'none',
                }}
                title={isOnline ? `Regulon Auto-Pilot: ${activeAgentCount}/12 agents active` : 'Auto-Pilot is OFF'}
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
                <span className={`text-[10px] font-bold tracking-wider ${isOnline ? 'text-cyan-300' : 'text-red-400'}`}>
                  Regulon Auto-Pilot: {isOnline ? 'ON' : 'OFF'}
                </span>
              </motion.div>

              <Badge variant="outline" className="text-[10px]">
                <Building className="w-2.5 h-2.5 mr-1" />
                {state.totalClientsManaged} Clients
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                <Clock className="w-2.5 h-2.5 mr-1" />
                Synced {timeSinceSync}
              </Badge>
            </div>
          </div>
        </div>

        {/* Center: Agent Swarm */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">Agent Swarm</span>
            <span className="text-foreground font-bold">{activeAgentCount}/12</span>
            <span>Active</span>
            {alertCount > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] ml-1">
                {alertCount} Alert{alertCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {state.agents.map((agent) => (
              <motion.div key={agent.id} className="group relative cursor-pointer" whileHover={{ scale: 1.3 }}>
                <div className={`w-3 h-3 rounded-full ${statusDotColor(agent.status)} transition-colors`}>
                  {(agent.status === 'active' || agent.status === 'working') && (
                    <motion.div
                      className={`absolute inset-0 rounded-full ${statusDotColor(agent.status)} opacity-50`}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: Math.random() }}
                    />
                  )}
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-popover border border-border rounded-md px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                    <p className="font-bold text-foreground">{agent.name}</p>
                    <p className="text-muted-foreground">{agent.currentTask}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Wifi className="w-3 h-3 text-cyan-400" />
            </motion.div>
            <span>{state.totalMessagesExchanged} cross-wire msgs</span>
            <span className="text-border">•</span>
            <span>{state.totalTasksCompleted} tasks done</span>
            <span className="text-border">•</span>
            <span>{state.systemUptime}% uptime</span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={actions.syncNow} className="text-xs h-8 border-cyan-500/20 hover:bg-cyan-500/10">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync
          </Button>
          {state.isRunning ? (
            <Button size="sm" variant="outline" onClick={actions.pauseAllAgents} className="text-xs h-8 border-yellow-500/20 hover:bg-yellow-500/10 text-yellow-400">
              <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
            </Button>
          ) : (
            <Button size="sm" onClick={actions.startAllAgents} className="text-xs h-8 bg-green-600 hover:bg-green-700">
              <Play className="w-3.5 h-3.5 mr-1.5" /> Start
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={actions.emergencyStop} className="text-xs h-8 border-red-500/20 hover:bg-red-500/10 text-red-400">
            <AlertOctagon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
