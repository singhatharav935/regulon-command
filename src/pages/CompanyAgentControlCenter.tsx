/**
 * COMPANY AGENT CONTROL CENTER — Settings Page
 * =============================================
 * Advanced route at /settings/company-agent-control-center
 * 
 * Full 10-agent swarm grid with individual controls,
 * wire feed, and system health — mirror of the CA version
 * but for company dashboard agents.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot, Shield, Building2, Sparkles, FileWarning, Globe, Eye, Zap,
  CheckCircle2, Folder, ChevronLeft, Network, Play, Pause, 
  AlertOctagon, RefreshCw, ArrowRight, ArrowLeft, Radio,
  MessageSquare, AlertTriangle, Wifi, Settings2, Cpu, Activity
} from 'lucide-react';
import { 
  AgentOrchestratorProvider, useAgentOrchestrator,
  type AgentId, type AgentDefinition, type AgentStatus, type AgentMessage
} from '@/components/agents/CompanyAgentOrchestrator';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Bot, Building2, Shield, Sparkles, FileWarning, Globe,
  Eye, Zap, CheckCircle2, Folder,
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  active:    { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/25', dot: 'bg-green-400' },
  working:   { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/25', dot: 'bg-blue-400' },
  analyzing: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/25', dot: 'bg-cyan-400' },
  alert:     { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/25', dot: 'bg-red-400' },
  error:     { bg: 'bg-red-600/10', text: 'text-red-500', border: 'border-red-600/25', dot: 'bg-red-500' },
  paused:    { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/25', dot: 'bg-yellow-400' },
  idle:      { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/25', dot: 'bg-slate-400' },
};

const MSG_TYPE_CONFIG: Record<string, { color: string; icon: React.ComponentType<any>; label: string }> = {
  ALERT_PROPAGATION: { color: 'text-red-400', icon: AlertTriangle, label: 'Alert' },
  DATA_SYNC:         { color: 'text-blue-400', icon: RefreshCw, label: 'Sync' },
  TASK_DELEGATION:   { color: 'text-purple-400', icon: ArrowRight, label: 'Task' },
  INSIGHT_SHARE:     { color: 'text-green-400', icon: Sparkles, label: 'Insight' },
  APPROVAL_REQUEST:  { color: 'text-amber-400', icon: CheckCircle2, label: 'Approval' },
};

// Individual Agent Card
const AgentControlCard = ({ agent }: { agent: AgentDefinition }) => {
  const { actions } = useAgentOrchestrator();
  const Icon = ICON_MAP[agent.icon] || Bot;
  const statusStyle = STATUS_COLORS[agent.status] || STATUS_COLORS.idle;

  return (
    <motion.div whileHover={{ y: -2 }} className={`relative p-5 rounded-2xl border ${statusStyle.border} ${statusStyle.bg} transition-all`}>
      {(agent.status === 'active' || agent.status === 'working' || agent.status === 'analyzing') && (
        <motion.div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${statusStyle.dot}`}
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
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
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{agent.fullName}</p>
        </div>
      </div>

      <div className="px-3 py-2 rounded-lg bg-background/40 border border-border/20 mb-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Assigned Section</p>
        <p className="text-xs font-medium text-foreground">{agent.section}</p>
      </div>

      <div className="mb-3 p-3 rounded-lg bg-background/40 border border-border/20">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 shrink-0" />{agent.currentTask}
        </p>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1"><Network className="w-3 h-3" /> Wired to:</p>
        <div className="flex flex-wrap gap-1">
          {agent.wiredTo.map(id => <Badge key={id} variant="outline" className="text-[9px] px-1.5 h-4">{id}</Badge>)}
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3 pt-2.5 border-t border-border/20">
        <span>✅ {agent.metrics.tasksCompleted}</span>
        <span>💡 {agent.metrics.insightsGenerated}</span>
        <span>📡 {agent.metrics.messagesSent}</span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 hover:bg-violet-500/10 text-violet-400" 
          onClick={() => actions.triggerAgent(agent.id)} disabled={agent.status === 'paused' || agent.status === 'error'}>
          <Zap className="w-3.5 h-3.5 mr-1.5" /> Trigger
        </Button>
        {agent.status === 'paused' ? (
          <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 hover:bg-green-500/10 text-green-400" onClick={() => actions.resumeAgent(agent.id)}>
            <Play className="w-3.5 h-3.5 mr-1.5" /> Start
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 hover:bg-yellow-500/10 text-yellow-400" onClick={() => actions.pauseAgent(agent.id)}>
            <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Wire Feed
const WireFeed = () => {
  const { state, actions } = useAgentOrchestrator();
  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
      {state.messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Radio className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No cross-agent messages yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Messages appear as agents communicate</p>
        </div>
      ) : state.messages.slice(0, 30).map((msg, index) => {
        const typeConfig = MSG_TYPE_CONFIG[msg.type] || MSG_TYPE_CONFIG.DATA_SYNC;
        const MsgIcon = typeConfig.icon;
        const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return (
          <motion.div key={msg.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.02 }}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
              msg.priority === 'critical' ? 'bg-red-500/5 border-red-500/20' :
              msg.priority === 'high' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-muted/20 border-border/30'
            } ${!msg.acknowledged ? 'border-l-2' : ''}`}
            style={!msg.acknowledged ? { borderLeftColor: msg.priority === 'critical' ? '#ef4444' : msg.priority === 'high' ? '#f97316' : '#8b5cf6' } : undefined}
          >
            <MsgIcon className={`w-4 h-4 ${typeConfig.color} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${typeConfig.color}`}>{typeConfig.label}</Badge>
                <span className="text-xs font-bold text-foreground">{msg.fromAgent}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">{msg.toAgent}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">{timeStr}</span>
              </div>
              <p className="text-xs font-medium text-foreground/90 mt-1">{msg.subject}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{msg.content}</p>
            </div>
            {!msg.acknowledged && (
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 shrink-0" onClick={() => actions.acknowledgeMessage(msg.id)}>Ack</Button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

// Main Content
const CompanyAgentControlCenterContent = () => {
  const navigate = useNavigate();
  const { state, actions } = useAgentOrchestrator();
  const [activeTab, setActiveTab] = useState<'agents' | 'wire'>('agents');

  const activeCount = state.agents.filter(a => a.status === 'active' || a.status === 'working' || a.status === 'analyzing').length;
  const pausedCount = state.agents.filter(a => a.status === 'paused').length;
  const errorCount = state.agents.filter(a => a.status === 'error').length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
            <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground gap-2" onClick={() => navigate('/real-company-dashboard')}>
              <ArrowLeft className="w-4 h-4" /> Back to Company Dashboard
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-violet-500/15 border border-violet-500/20">
                  <Settings2 className="w-7 h-7 text-violet-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Agent Control Center</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Advanced configuration for 10 Regulon AI compliance agents</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" onClick={actions.startAllAgents} className="bg-green-600 hover:bg-green-700 text-xs h-9 gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Start All
                </Button>
                <Button size="sm" variant="outline" onClick={actions.pauseAllAgents} className="border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/10 text-xs h-9 gap-1.5">
                  <Pause className="w-3.5 h-3.5" /> Pause All
                </Button>
                <Button size="sm" variant="outline" onClick={actions.syncNow} className="border-violet-500/25 hover:bg-violet-500/10 text-xs h-9 gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> Sync All
                </Button>
                <Button size="sm" variant="outline" onClick={actions.emergencyStop} className="border-red-500/25 text-red-400 hover:bg-red-500/10 text-xs h-9 gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" /> Emergency Stop
                </Button>
              </div>
            </div>
          </motion.div>

          {/* System Status Bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 rounded-2xl border border-border/30 bg-muted/20">
            <div className="flex items-center gap-6 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  {state.isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${state.isRunning ? 'bg-green-400' : 'bg-red-400'}`} />
                </span>
                <span className={`font-semibold ${state.isRunning ? 'text-green-400' : 'text-red-400'}`}>
                  {state.isRunning ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                </span>
              </div>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">Active: <strong className="text-green-400">{activeCount}</strong></span>
              <span className="text-muted-foreground">Paused: <strong className="text-yellow-400">{pausedCount}</strong></span>
              {errorCount > 0 && <span className="text-muted-foreground">Errors: <strong className="text-red-400">{errorCount}</strong></span>}
              <span className="text-muted-foreground">Messages: <strong className="text-foreground">{state.totalMessagesExchanged}</strong></span>
              <span className="text-muted-foreground">Tasks: <strong className="text-foreground">{state.totalTasksCompleted}</strong></span>
            </div>
          </motion.div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex rounded-xl border border-border/50 overflow-hidden">
              <Button size="sm" variant={activeTab === 'agents' ? 'default' : 'ghost'} className="h-10 px-5 text-sm rounded-none gap-2" onClick={() => setActiveTab('agents')}>
                <Cpu className="w-4 h-4" /> Agent Grid ({state.agents.length})
              </Button>
              <Button size="sm" variant={activeTab === 'wire' ? 'default' : 'ghost'} className="h-10 px-5 text-sm rounded-none gap-2" onClick={() => setActiveTab('wire')}>
                <Radio className="w-4 h-4" /> Wire Feed
                {state.messages.filter(m => !m.acknowledged).length > 0 && (
                  <Badge className="ml-1 bg-primary/20 text-primary text-[10px] px-1.5 h-4">{state.messages.filter(m => !m.acknowledged).length}</Badge>
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'agents' ? (
              <motion.div key="agents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {state.agents.map((agent) => <AgentControlCard key={agent.id} agent={agent} />)}
                </div>
              </motion.div>
            ) : (
              <motion.div key="wire" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="border-border/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2"><Radio className="w-5 h-5 text-violet-400" /> Cross-Agent Wire Feed</CardTitle>
                    <CardDescription>Real-time inter-agent communication log</CardDescription>
                  </CardHeader>
                  <CardContent><WireFeed /></CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const CompanyAgentControlCenter = () => (
  <AgentOrchestratorProvider>
    <CompanyAgentControlCenterContent />
  </AgentOrchestratorProvider>
);

export default CompanyAgentControlCenter;
