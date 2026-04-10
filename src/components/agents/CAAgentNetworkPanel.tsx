/**
 * CA AGENT NETWORK PANEL
 * ======================
 * Advanced visualization of 12 CA-specific AI agents.
 * Tailored for practice management — shows client-centric metrics,
 * filing deadlines, and cross-agent communication feed.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, Shield, Building, Sparkles, FileText, Search, Radio, Activity,
  Eye, CheckCircle, MessageSquare, BarChart3, Cpu,
  ChevronDown, ChevronUp, RefreshCw, Play, Pause, Zap,
  ArrowRight, Network, AlertTriangle
} from 'lucide-react';
import { useCAAgentOrchestrator, type CAAgentId, type CAAgentDefinition, type CAAgentMessage } from './CAAgentOrchestrator';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Cpu, Sparkles, FileText, Building, CheckCircle, Search,
  Radio, Activity, Eye, MessageSquare, BarChart3, Shield, Bot,
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active:    { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
  working:   { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  analyzing: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  alert:     { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  error:     { bg: 'bg-red-600/15', text: 'text-red-500', border: 'border-red-600/30' },
  paused:    { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  idle:      { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
};

const MSG_TYPE_CONFIG: Record<string, { color: string; icon: React.ComponentType<any>; label: string }> = {
  ALERT_PROPAGATION: { color: 'text-red-400', icon: AlertTriangle, label: 'Alert' },
  DATA_SYNC:         { color: 'text-blue-400', icon: RefreshCw, label: 'Sync' },
  TASK_DELEGATION:   { color: 'text-purple-400', icon: ArrowRight, label: 'Task' },
  INSIGHT_SHARE:     { color: 'text-green-400', icon: Sparkles, label: 'Insight' },
  APPROVAL_REQUEST:  { color: 'text-amber-400', icon: CheckCircle, label: 'Approval' },
  CLIENT_UPDATE:     { color: 'text-cyan-400', icon: Building, label: 'Client' },
  DEADLINE_WARNING:  { color: 'text-orange-400', icon: AlertTriangle, label: 'Deadline' },
};

// ================================================================
// AGENT CARD
// ================================================================

const CAAgentCard = ({ agent, onTrigger, onPause, onResume }: {
  agent: CAAgentDefinition;
  onTrigger: () => void;
  onPause: () => void;
  onResume: () => void;
}) => {
  const Icon = ICON_MAP[agent.icon] || Bot;
  const statusStyle = STATUS_COLORS[agent.status] || STATUS_COLORS.idle;
  const { state } = useCAAgentOrchestrator();
  
  const recentMessages = state.messages
    .filter(m => m.fromAgent === agent.id || m.toAgent === agent.id)
    .slice(0, 2);

  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -3 }}
      transition={{ duration: 0.2 }}
      className={`relative p-5 rounded-2xl border ${statusStyle.border} ${statusStyle.bg} transition-all cursor-default`}
    >
      {(agent.status === 'active' || agent.status === 'working' || agent.status === 'analyzing') && (
        <motion.div
          className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${statusStyle.text.replace('text-', 'bg-')}`}
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${agent.bgColor}`}>
          <Icon className={`w-5 h-5 ${agent.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">{agent.name}</span>
            <Badge className={`text-[9px] h-4 px-1.5 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
              {agent.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.fullName}</p>
        </div>
      </div>

      <div className="mb-3 p-3 rounded-lg bg-background/40 border border-border/30">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 shrink-0" />
          {agent.currentTask}
        </p>
      </div>

      {recentMessages.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {recentMessages.map((msg) => {
            const typeConfig = MSG_TYPE_CONFIG[msg.type] || MSG_TYPE_CONFIG.DATA_SYNC;
            const MsgIcon = typeConfig.icon;
            return (
              <div key={msg.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MsgIcon className={`w-3 h-3 ${typeConfig.color} shrink-0`} />
                <span className="truncate">
                  {msg.fromAgent === agent.id ? `→ ${msg.toAgent}` : `← ${msg.fromAgent}`}: {msg.subject}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3 pt-2.5 border-t border-border/30">
        <span>✅ {agent.metrics.tasksCompleted}</span>
        <span>💡 {agent.metrics.insightsGenerated}</span>
        <span>📡 {agent.metrics.messagesSent}</span>
        {agent.metrics.clientsServed > 0 && <span>👥 {agent.metrics.clientsServed}</span>}
        <span className="ml-auto text-foreground font-semibold">{agent.metrics.accuracy}%</span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 hover:bg-primary/10" onClick={onTrigger} disabled={agent.status === 'paused'}>
          <Zap className="w-3.5 h-3.5 mr-1.5" /> Trigger
        </Button>
        {agent.status === 'paused' ? (
          <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 hover:bg-green-500/10 text-green-400" onClick={onResume}>
            <Play className="w-3.5 h-3.5 mr-1.5" /> Resume
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 hover:bg-yellow-500/10 text-yellow-400" onClick={onPause}>
            <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// ================================================================
// WIRE FEED
// ================================================================

const CAWireFeed = ({ messages }: { messages: CAAgentMessage[] }) => {
  return (
    <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-2">
      {messages.slice(0, 20).map((msg, index) => {
        const typeConfig = MSG_TYPE_CONFIG[msg.type] || MSG_TYPE_CONFIG.DATA_SYNC;
        const MsgIcon = typeConfig.icon;
        const time = new Date(msg.timestamp);
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
              msg.priority === 'critical' ? 'bg-red-500/5 border-red-500/20' :
              msg.priority === 'high' ? 'bg-orange-500/5 border-orange-500/20' :
              'bg-muted/30 border-border/30'
            } ${!msg.acknowledged ? 'border-l-2' : ''}`}
            style={!msg.acknowledged ? { borderLeftColor: msg.priority === 'critical' ? '#ef4444' : msg.priority === 'high' ? '#f97316' : '#8b5cf6' } : undefined}
          >
            <MsgIcon className={`w-4 h-4 ${typeConfig.color} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${typeConfig.color}`}>{typeConfig.label}</Badge>
                <span className="text-xs font-bold text-foreground">{msg.fromAgent}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">{msg.toAgent}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">{timeStr}</span>
              </div>
              <p className="text-xs font-medium text-foreground/90 mt-1">{msg.subject}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{msg.content}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ================================================================
// MAIN PANEL
// ================================================================

export const CAAgentNetworkPanel = () => {
  const [expanded, setExpanded] = useState(true);
  const [activeView, setActiveView] = useState<'grid' | 'feed'>('grid');
  const { state, actions } = useCAAgentOrchestrator();

  const activeCount = state.agents.filter(a => 
    a.status === 'active' || a.status === 'working' || a.status === 'analyzing'
  ).length;
  const alertCount = state.agents.filter(a => a.status === 'alert').length;
  const errorCount = state.agents.filter(a => a.status === 'error').length;
  const unacknowledgedMessages = state.messages.filter(m => !m.acknowledged).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-background to-background overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/20">
                <Network className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  CA AI Agent Network
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                    {activeCount}/12 ACTIVE
                  </Badge>
                  {alertCount > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs animate-pulse">
                      {alertCount} ALERT
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  12 interconnected agents managing your practice across {state.totalClientsManaged} clients
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border/50 overflow-hidden">
                <Button size="sm" variant={activeView === 'grid' ? 'default' : 'ghost'} className="h-9 px-4 text-xs rounded-none" onClick={() => setActiveView('grid')}>
                  <Cpu className="w-4 h-4 mr-1.5" /> Agents
                </Button>
                <Button size="sm" variant={activeView === 'feed' ? 'default' : 'ghost'} className="h-9 px-4 text-xs rounded-none" onClick={() => setActiveView('feed')}>
                  <Radio className="w-4 h-4 mr-1.5" /> Wire Feed
                  {unacknowledgedMessages > 0 && (
                    <Badge className="ml-1.5 bg-primary/20 text-primary text-[10px] px-1.5 h-4">{unacknowledgedMessages}</Badge>
                  )}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-9 w-9 p-0">
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* System Metrics */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Uptime: <strong className="text-foreground">{state.systemUptime}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-blue-400" />
              <span>Wire: <strong className="text-foreground">{state.totalMessagesExchanged}</strong> msgs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-green-400" />
              <span>Tasks: <strong className="text-foreground">{state.totalTasksCompleted}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-purple-400" />
              <span>Clients: <strong className="text-foreground">{state.totalClientsManaged}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Active: <strong className="text-green-400">{activeCount}</strong> agents</span>
              {errorCount > 0 && <span className="text-red-400 ml-1">{errorCount} error</span>}
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <CardContent className="pt-2">
                {activeView === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {state.agents.map((agent) => (
                      <CAAgentCard
                        key={agent.id}
                        agent={agent}
                        onTrigger={() => actions.triggerAgent(agent.id)}
                        onPause={() => actions.pauseAgent(agent.id)}
                        onResume={() => actions.resumeAgent(agent.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <CAWireFeed messages={state.messages} />
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
