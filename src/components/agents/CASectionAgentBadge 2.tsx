/**
 * CA SECTION AGENT BADGE
 * =====================
 * Displays the assigned CA AI agent's live status on each dashboard section card.
 * Shows agent codename (ORACLE, RADAR, etc.), animated status indicator, and current task.
 */

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, Building, Shield, Sparkles, FileWarning, Globe, 
  Eye, Zap, CheckCircle, Folder, Activity, Wifi,
  Database, Search, BarChart3, FileText, Calculator,
  Scale, CheckSquare, ShieldAlert, AlertTriangle,
  Clock, Bell, Radio
} from 'lucide-react';
import { useCAAgentOrchestrator, type CAAgentId, type CAAgentStatus } from './CAAgentOrchestrator';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Bot, Building, Shield, Sparkles, FileWarning, Globe, Eye, Zap, 
  CheckCircle, Folder, Database, Search, BarChart3, FileText, 
  Calculator, Scale, CheckSquare, ShieldAlert, AlertTriangle,
  Clock, Bell, Radio, Activity
};

interface CASectionAgentBadgeProps {
  agentId: CAAgentId;
  compact?: boolean;
}

const STATUS_CONFIG: Record<CAAgentStatus, { color: string; label: string; dotColor: string; pulse: boolean }> = {
  active:             { color: 'text-green-400',  label: 'Watching',   dotColor: 'bg-green-400',  pulse: true },
  idle:               { color: 'text-slate-400',  label: 'Standby',    dotColor: 'bg-slate-400',  pulse: false },
  working:            { color: 'text-blue-400',   label: 'Working',    dotColor: 'bg-blue-400',   pulse: true },
  analyzing:          { color: 'text-cyan-400',   label: 'Analyzing',  dotColor: 'bg-cyan-400',   pulse: true },
  alert:              { color: 'text-red-400',    label: 'Conflict!',  dotColor: 'bg-red-400',    pulse: true },
  error:              { color: 'text-red-500',    label: 'Error',      dotColor: 'bg-red-500',    pulse: false },
  paused:             { color: 'text-yellow-400', label: 'Paused',     dotColor: 'bg-yellow-400', pulse: false },
  consensus_check:    { color: 'text-amber-400',  label: 'Consensus',  dotColor: 'bg-amber-400',  pulse: true },
  resolving_conflict: { color: 'text-orange-400', label: 'Resolving',  dotColor: 'bg-orange-400', pulse: true },
};

export const CASectionAgentBadge = ({ agentId, compact = false }: CASectionAgentBadgeProps) => {
  const { agents } = useCAAgentOrchestrator();
  const agent = agents.find(a => a.id === agentId);
  
  if (!agent) return null;
  
  const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
  const Icon = ICON_MAP[agent.icon] || Bot;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/60 border border-border/50"
      >
        <span className="relative flex h-2 w-2">
          {statusConfig.pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusConfig.dotColor} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dotColor}`} />
        </span>
        <span className={`text-[10px] font-bold ${statusConfig.color}`}>{agent.name}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-muted/40 to-cyan-500/[0.03] border border-cyan-500/10 backdrop-blur-sm"
    >
      {/* Agent Icon */}
      <div className={`relative p-1 rounded-md ${agent.bgColor}`}>
        <Icon className={`w-3.5 h-3.5 ${agent.color}`} />
        {/* Status dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          {statusConfig.pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusConfig.dotColor} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dotColor}`} />
        </span>
      </div>

      {/* Agent Info */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-wide text-foreground">{agent.name}</span>
          <Badge 
            className={`text-[9px] px-1 py-0 h-3.5 border ${
              agent.status === 'alert' || agent.status === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
              agent.status === 'working' || agent.status === 'analyzing' || agent.status === 'consensus_check' || agent.status === 'resolving_conflict' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
              agent.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              agent.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
              'bg-muted text-muted-foreground border-border'
            }`}
          >
            {statusConfig.label}
          </Badge>
        </div>
        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
          {agent.currentTask}
        </span>
      </div>

      {/* Cross-wire pulse */}
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="ml-auto pl-2"
      >
        <Wifi className={`w-3 h-3 ${agent.status !== 'idle' && agent.status !== 'paused' ? 'text-cyan-400' : 'text-muted-foreground'}`} />
      </motion.div>
    </motion.div>
  );
};
