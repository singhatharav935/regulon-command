/**
 * COMPACT AGENT NETWORK SUMMARY
 * ==============================
 * Inline summary card for the Real Company Dashboard.
 * Shows all 10 agents in a compact strip with live status dots,
 * key system metrics, and a link to the full Agent Control Center.
 * 
 * Replaces the heavy AgentNetworkPanel grid on the dashboard —
 * the full grid lives at /settings/company-agent-control-center.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, Shield, Building2, Sparkles, FileWarning, Globe, Eye, Zap,
  CheckCircle2, Folder, Network, Activity, Cpu, Radio,
  Settings2, ChevronRight, Wifi
} from 'lucide-react';
import { useAgentOrchestrator, type AgentStatus } from './CompanyAgentOrchestrator';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Bot, Building2, Shield, Sparkles, FileWarning, Globe, Eye, Zap, CheckCircle2, Folder,
};

export const CompactAgentNetworkSummary = () => {
  const navigate = useNavigate();
  const { state } = useAgentOrchestrator();

  const activeCount = state.agents.filter(a => 
    a.status === 'active' || a.status === 'working' || a.status === 'analyzing'
  ).length;
  const alertCount = state.agents.filter(a => a.status === 'alert').length;
  const errorCount = state.agents.filter(a => a.status === 'error').length;

  const statusDotColor = (status: AgentStatus) => {
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

  const statusTextColor = (status: AgentStatus) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'working': return 'text-blue-400';
      case 'analyzing': return 'text-cyan-400';
      case 'alert': return 'text-red-400';
      case 'error': return 'text-red-500';
      case 'paused': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="mb-6"
    >
      <Card className="border-violet-500/15 bg-gradient-to-r from-violet-500/[0.04] via-background to-cyan-500/[0.03] overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Left: Title & Summary */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/20">
                <Network className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  AI Agent Network
                  <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] h-4 px-1.5">
                    {activeCount}/10 ACTIVE
                  </Badge>
                  {alertCount > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] h-4 px-1.5 animate-pulse">
                      {alertCount} ALERT
                    </Badge>
                  )}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  10 agents monitoring your compliance ecosystem
                </p>
              </div>
            </div>

            {/* Center: Agent Strip — all 10 agents as compact pills */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1">
              {state.agents.map((agent) => {
                const Icon = ICON_MAP[agent.icon] || Bot;
                return (
                  <motion.div
                    key={agent.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/30 bg-background/60 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-default shrink-0"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      {(agent.status === 'active' || agent.status === 'working' || agent.status === 'analyzing') && (
                        <motion.span
                          className={`absolute inline-flex h-full w-full rounded-full ${statusDotColor(agent.status)} opacity-50`}
                          animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: Math.random() }}
                        />
                      )}
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusDotColor(agent.status)}`} />
                    </span>
                    <Icon className={`w-3 h-3 ${agent.color}`} />
                    <span className="text-[10px] font-semibold text-foreground">{agent.name}</span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                        <p className="font-bold text-foreground">{agent.name} — {agent.fullName}</p>
                        <p className="text-muted-foreground mt-0.5">{agent.section}</p>
                        <p className={`mt-0.5 font-medium ${statusTextColor(agent.status)}`}>
                          Status: {agent.status.toUpperCase()}
                        </p>
                        <p className="text-muted-foreground mt-0.5">{agent.currentTask}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Right: Metrics + CTA */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Compact Metrics */}
              <div className="hidden md:flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-violet-400" />
                  <strong className="text-foreground">{state.systemUptime}%</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-blue-400" />
                  <strong className="text-foreground">{state.totalMessagesExchanged}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-green-400" />
                  <strong className="text-foreground">{state.totalTasksCompleted}</strong>
                </span>
              </div>

              {/* Open Agent Control Center */}
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-8 gap-1.5 border-violet-500/25 hover:bg-violet-500/10 text-violet-400 hover:text-violet-300 shrink-0"
                onClick={() => navigate('/settings/company-agent-control-center')}
              >
                <Settings2 className="w-3.5 h-3.5" />
                Agent Control Center
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
