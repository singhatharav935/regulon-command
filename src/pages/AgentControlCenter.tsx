/**
 * AGENT CONTROL CENTER — Settings Page
 * =====================================
 * Advanced route at /settings/agent-control-center
 * 
 * Full 12-agent swarm grid organized into 4 Consensus Groups:
 * - ANALYSER (A1-Prime, A2-Cross, A3-Audit)
 * - DRAFTER  (D1-Maker, D2-Refiner, D3-Aligner)
 * - REVIEWER (R1-Tax, R2-Legal, R3-Final)
 * - MONITOR  (M1-Pulse, M2-Tracker, M3-Herald)
 * 
 * Individual agent start/pause controls, cross-agent wire feed,
 * and system health metrics.
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
  Bot, Shield, Building, Sparkles, FileText, Search, Radio, Activity,
  Eye, CheckCircle, BarChart3, Cpu, Network, Zap,
  Play, Pause, AlertOctagon, RefreshCw, ArrowRight, ArrowLeft,
  MessageSquare, AlertTriangle, Wifi, Settings2, Power,
  Database, PenTool, Scale, Calculator, ShieldAlert, CheckSquare,
  Clock, Bell, FileWarning
} from 'lucide-react';
import { 
  CAAgentProvider, useCAAgentOrchestrator, 
  type CAAgentId, type CAAgentDefinition, type CAAgentStatus, type CAAgentMessage,
  type CAAgentGroupId
} from '@/components/agents/CAAgentOrchestrator';

// ================================================================
// ICON MAP
// ================================================================

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Cpu, Sparkles, FileText, Building, CheckCircle, Search,
  Radio, Activity, Eye, MessageSquare, BarChart3, Shield, Bot,
  Database, PenTool, Scale, Calculator, ShieldAlert, CheckSquare,
  Clock, Bell, FileWarning, AlertTriangle,
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  active:             { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/25', dot: 'bg-green-400' },
  working:            { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/25', dot: 'bg-blue-400' },
  analyzing:          { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/25', dot: 'bg-cyan-400' },
  consensus_check:    { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/25', dot: 'bg-violet-400' },
  resolving_conflict: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/25', dot: 'bg-amber-400' },
  alert:              { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/25', dot: 'bg-red-400' },
  error:              { bg: 'bg-red-600/10', text: 'text-red-500', border: 'border-red-600/25', dot: 'bg-red-500' },
  paused:             { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/25', dot: 'bg-yellow-400' },
  idle:               { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/25', dot: 'bg-slate-400' },
};

const GROUP_CONFIG: Record<CAAgentGroupId, { title: string; desc: string; accent: string; border: string }> = {
  ANALYSER: { title: '1. ANALYSER GROUP', desc: 'Cross-checking data intake — A1 collects, A2 verifies, A3 flags discrepancies.', accent: 'text-cyan-400', border: 'border-cyan-500/30' },
  DRAFTER:  { title: '2. DRAFTER GROUP', desc: 'Document generation pipeline — D1 drafts, D2 refines legal phrasing, D3 aligns to statutes.', accent: 'text-purple-400', border: 'border-purple-500/30' },
  REVIEWER: { title: '3. REVIEWER GROUP', desc: 'Quality assurance — R1 checks tax impact, R2 scans legal risk, R3 prepares CA approval.', accent: 'text-amber-400', border: 'border-amber-500/30' },
  MONITOR:  { title: '4. MONITOR GROUP', desc: 'Post-execution oversight — M1 syncs portals, M2 tracks deadlines, M3 notifies clients.', accent: 'text-emerald-400', border: 'border-emerald-500/30' },
};

const MSG_TYPE_CONFIG: Record<string, { color: string; icon: React.ComponentType<any>; label: string }> = {
  ALERT_PROPAGATION:      { color: 'text-red-400', icon: AlertTriangle, label: 'Alert' },
  DATA_SYNC:              { color: 'text-blue-400', icon: RefreshCw, label: 'Sync' },
  TASK_DELEGATION:        { color: 'text-purple-400', icon: ArrowRight, label: 'Task' },
  INSIGHT_SHARE:          { color: 'text-green-400', icon: Sparkles, label: 'Insight' },
  APPROVAL_REQUEST:       { color: 'text-amber-400', icon: CheckCircle, label: 'Approval' },
  CONSENSUS_REACHED:      { color: 'text-emerald-400', icon: CheckCircle, label: '✓ Consensus' },
  CONSENSUS_FAILED:       { color: 'text-red-400', icon: AlertTriangle, label: '✗ Conflict' },
  ISSUE_TICKET_GENERATED: { color: 'text-orange-400', icon: FileWarning, label: 'Issue Ticket' },
};

// ================================================================
// INDIVIDUAL AGENT CARD (Full Control)
// ================================================================

const AgentControlCard = ({ agent }: { agent: CAAgentDefinition }) => {
  const { resumeAgent, pauseAgent, triggerAgent, messages } = useCAAgentOrchestrator();
  const Icon = ICON_MAP[agent.icon] || Bot;
  const statusStyle = STATUS_COLORS[agent.status] || STATUS_COLORS.idle;

  const recentMessages = messages
    .filter(m => m.fromAgent === agent.id || m.toAgent === agent.id || m.toAgent === agent.groupId)
    .slice(0, 2);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative p-5 rounded-2xl border ${statusStyle.border} ${statusStyle.bg} transition-all`}
    >
      {/* Live status dot */}
      {(agent.status === 'active' || agent.status === 'working' || agent.status === 'analyzing' || agent.status === 'consensus_check') && (
        <motion.div
          className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${statusStyle.dot}`}
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${agent.bgColor}`}>
          <Icon className={`w-5 h-5 ${agent.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">{agent.name}</span>
            <Badge className={`text-[9px] h-4 px-1.5 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
              {agent.status.toUpperCase().replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{agent.fullName}</p>
        </div>
      </div>

      {/* Section Assignment */}
      <div className="px-3 py-2 rounded-lg bg-background/40 border border-border/20 mb-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Assigned Section</p>
        <p className="text-xs font-medium text-foreground">{agent.section}</p>
        <p className="text-[10px] text-muted-foreground mt-1">Group: {agent.groupId}</p>
      </div>

      {/* Current Task */}
      <div className="mb-3 p-3 rounded-lg bg-background/40 border border-border/20">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 shrink-0" />
          {agent.currentTask}
        </p>
      </div>

      {/* Recent Messages */}
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

      {/* Wired To */}
      <div className="mb-3">
        <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
          <Network className="w-3 h-3" /> Wired to:
        </p>
        <div className="flex flex-wrap gap-1">
          {agent.wiredTo.map(id => (
            <Badge key={id} variant="outline" className="text-[9px] px-1.5 h-4">{id}</Badge>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3 pt-2.5 border-t border-border/20">
        <span>✅ {agent.metrics.tasksCompleted}</span>
        <span>💡 {agent.metrics.insightsGenerated}</span>
        <span>📡 {agent.metrics.messagesSent}</span>
        <span>🔧 {agent.metrics.conflictsResolved}</span>
      </div>

      {/* Individual Controls */}
      <div className="flex gap-2">
        <Button 
          size="sm" variant="ghost" 
          className="h-8 text-xs flex-1 hover:bg-cyan-500/10 text-cyan-400" 
          onClick={() => triggerAgent(agent.id)}
          disabled={agent.status === 'paused' || agent.status === 'error'}
        >
          <Zap className="w-3.5 h-3.5 mr-1.5" /> Trigger
        </Button>
        {agent.status === 'paused' ? (
          <Button 
            size="sm" variant="ghost" 
            className="h-8 text-xs flex-1 hover:bg-green-500/10 text-green-400" 
            onClick={() => resumeAgent(agent.id)}
          >
            <Play className="w-3.5 h-3.5 mr-1.5" /> Start
          </Button>
        ) : (
          <Button 
            size="sm" variant="ghost" 
            className="h-8 text-xs flex-1 hover:bg-yellow-500/10 text-yellow-400" 
            onClick={() => pauseAgent(agent.id)}
          >
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

const WireFeed = () => {
  const { messages } = useCAAgentOrchestrator();

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Radio className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No cross-agent messages yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Messages will appear as agents communicate</p>
        </div>
      ) : (
        messages.slice(0, 30).map((msg, index) => {
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
                msg.type === 'CONSENSUS_FAILED' ? 'bg-red-500/5 border-red-500/20' :
                msg.type === 'CONSENSUS_REACHED' ? 'bg-emerald-500/5 border-emerald-500/20' :
                msg.priority === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                msg.priority === 'high' ? 'bg-orange-500/5 border-orange-500/20' :
                'bg-muted/20 border-border/30'
              } ${!msg.acknowledged ? 'border-l-2' : ''}`}
              style={!msg.acknowledged ? { borderLeftColor: msg.type === 'CONSENSUS_FAILED' ? '#ef4444' : msg.type === 'CONSENSUS_REACHED' ? '#10b981' : '#8b5cf6' } : undefined}
            >
              <MsgIcon className={`w-4 h-4 ${typeConfig.color} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${typeConfig.color}`}>
                    {typeConfig.label}
                  </Badge>
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
        })
      )}
    </div>
  );
};

// ================================================================
// MAIN CONTENT (inside provider)
// ================================================================

const AgentControlCenterContent = () => {
  const navigate = useNavigate();
  const { agents, messages, isRunning, systemStatus, startAllAgents, pauseAllAgents, emergencyStop } = useCAAgentOrchestrator();
  const [activeTab, setActiveTab] = useState<'agents' | 'wire'>('agents');

  const activeCount = agents.filter(a => 
    a.status === 'active' || a.status === 'working' || a.status === 'analyzing'
  ).length;
  const pausedCount = agents.filter(a => a.status === 'paused').length;
  const errorCount = agents.filter(a => a.status === 'error').length;
  const conflictCount = agents.filter(a => a.status === 'resolving_conflict').length;
  const totalConflictsResolved = agents.reduce((sum, a) => sum + a.metrics.conflictsResolved, 0);
  const isOnline = isRunning && activeCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Back Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button 
              variant="ghost" 
              className="text-sm text-muted-foreground hover:text-foreground gap-2"
              onClick={() => navigate('/real-external-ca-dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to CA Dashboard
            </Button>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/20">
                  <Settings2 className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Swarm Control Center</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    4 Groups × 3 Agents — Consensus cross-checking architecture
                  </p>
                </div>
              </div>

              {/* Bulk Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  onClick={startAllAgents}
                  className="bg-green-600 hover:bg-green-700 text-xs h-9 gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Start All
                </Button>
                <Button 
                  size="sm" variant="outline"
                  onClick={pauseAllAgents}
                  className="border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/10 text-xs h-9 gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause All
                </Button>
                <Button 
                  size="sm" variant="outline"
                  onClick={emergencyStop}
                  className="border-red-500/25 text-red-400 hover:bg-red-500/10 text-xs h-9 gap-1.5"
                >
                  <AlertOctagon className="w-3.5 h-3.5" /> Emergency Stop
                </Button>
              </div>
            </div>
          </motion.div>

          {/* System Status Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl border border-border/30 bg-muted/20"
          >
            <div className="flex items-center gap-6 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  {isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                </span>
                <span className={`font-semibold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                  {isOnline ? 'SWARM ONLINE' : 'SWARM OFFLINE'}
                </span>
              </div>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">Active: <strong className="text-green-400">{activeCount}</strong></span>
              <span className="text-muted-foreground">Paused: <strong className="text-yellow-400">{pausedCount}</strong></span>
              {conflictCount > 0 && <span className="text-muted-foreground">Resolving: <strong className="text-amber-400">{conflictCount}</strong></span>}
              {errorCount > 0 && <span className="text-muted-foreground">Errors: <strong className="text-red-400">{errorCount}</strong></span>}
              <span className="text-muted-foreground">Wire Msgs: <strong className="text-foreground">{messages.length}</strong></span>
              <span className="text-muted-foreground">Conflicts Resolved: <strong className="text-foreground">{totalConflictsResolved}</strong></span>
            </div>
          </motion.div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex rounded-xl border border-border/50 overflow-hidden">
              <Button 
                size="sm" variant={activeTab === 'agents' ? 'default' : 'ghost'} 
                className="h-10 px-5 text-sm rounded-none gap-2"
                onClick={() => setActiveTab('agents')}
              >
                <Cpu className="w-4 h-4" /> Agent Grid ({agents.length})
              </Button>
              <Button 
                size="sm" variant={activeTab === 'wire' ? 'default' : 'ghost'} 
                className="h-10 px-5 text-sm rounded-none gap-2"
                onClick={() => setActiveTab('wire')}
              >
                <Radio className="w-4 h-4" /> Wire Feed
                {messages.filter(m => !m.acknowledged).length > 0 && (
                  <Badge className="ml-1 bg-primary/20 text-primary text-[10px] px-1.5 h-4">
                    {messages.filter(m => !m.acknowledged).length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'agents' ? (
              <motion.div
                key="agents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {(['ANALYSER', 'DRAFTER', 'REVIEWER', 'MONITOR'] as CAAgentGroupId[]).map((groupId) => {
                  const config = GROUP_CONFIG[groupId];
                  const groupAgents = agents.filter(a => a.groupId === groupId);
                  return (
                    <div key={groupId} className="space-y-4">
                      <div className={`border-b ${config.border} pb-2`}>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                          <Network className={`w-5 h-5 ${config.accent}`} /> {config.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">{config.desc}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupAgents.map((agent) => (
                          <AgentControlCard key={agent.id} agent={agent} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="wire"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-border/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Radio className="w-5 h-5 text-cyan-400" />
                      Cross-Agent Wire Feed
                    </CardTitle>
                    <CardDescription>
                      Real-time consensus protocol and inter-agent communication log
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WireFeed />
                  </CardContent>
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

// ================================================================
// EXPORTED PAGE (wraps with Provider)
// ================================================================

const AgentControlCenter = () => {
  return (
    <CAAgentProvider>
      <AgentControlCenterContent />
    </CAAgentProvider>
  );
};

export default AgentControlCenter;
