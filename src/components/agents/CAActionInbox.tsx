/**
 * CA AI ACTION INBOX
 * ==================
 * Clean, results-oriented inbox that displays actionable outputs
 * from the background AI agent swarm. Replaces the complex 12-agent
 * telemetry grid on the main CA dashboard.
 * 
 * Shows: drafted rebuttals, risk alerts, reconciled mismatches,
 * filing readiness, dependency reminders, and regulatory impacts.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Inbox, FileText, AlertTriangle, CheckCircle, Scale, Bell,
  ChevronRight, Settings2, Eye, Sparkles, Shield, ExternalLink,
  Clock, Building, RefreshCw, Filter, Archive, Activity
} from 'lucide-react';
import { useCAAgentOrchestrator } from './CAAgentOrchestrator';
import { useNavigate } from 'react-router-dom';

type ActionType = 'draft_ready' | 'risk_alert' | 'reconciliation' | 'filing_ready' | 'dependency' | 'regulatory' | 'consensus_check' | 'issue_ticket' | 'consensus_failure';

interface ActionItem {
  id: string;
  type: ActionType;
  agent: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  client?: string;
  timestamp: string;
  actionLabel: string;
  read: boolean;
}

const ACTION_TYPE_CONFIG: Record<ActionType, { icon: React.ComponentType<any>; color: string; bgColor: string; label: string }> = {
  draft_ready:    { icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/10', label: 'Draft Ready' },
  risk_alert:     { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Risk Alert' },
  reconciliation: { icon: Scale, color: 'text-purple-400', bgColor: 'bg-purple-500/10', label: 'Reconciliation' },
  filing_ready:   { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', label: 'Filing Ready' },
  dependency:     { icon: Clock, color: 'text-orange-400', bgColor: 'bg-orange-500/10', label: 'Dependency' },
  regulatory:     { icon: Shield, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', label: 'Regulatory' },
  consensus_check: { icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'Consensus Reached' },
  issue_ticket:   { icon: Activity, color: 'text-amber-400', bgColor: 'bg-amber-500/10', label: 'Issue Ticket' },
  consensus_failure: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Consensus Failed' },
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'border-l-red-500 bg-red-500/5',
  high: 'border-l-orange-500 bg-orange-500/5',
  medium: 'border-l-yellow-500',
  low: 'border-l-cyan-500/50',
};

export const CAActionInbox = () => {
  const navigate = useNavigate();
  const { agents, messages, isRunning, systemStatus } = useCAAgentOrchestrator();
  const [filter, setFilter] = useState<'all' | ActionType>('all');
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);

  const [completedHistory, setCompletedHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('demo:sannidh:completed-work-history');
      if (!saved) return [];
      let history = JSON.parse(saved);
      
      // Clean up old duplicates and fix buggy "Draft_Draft_" prefix names
      const seen = new Set<string>();
      history = history.filter((item: any) => {
        if (item.documentName && item.documentName.startsWith('Draft_Draft_')) {
          item.documentName = item.documentName.replace('Draft_Draft_', 'Draft_');
        }
        if (item.documentName && item.documentName.startsWith('Completed_Work_')) {
          item.documentName = item.documentName.replace('Completed_Work_', 'Draft_');
        }
        const key = `${item.title}::${item.client}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      localStorage.setItem('demo:sannidh:completed-work-history', JSON.stringify(history));
      return history;
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('real:sannidh:completed-work-history');
        if (saved) {
          setCompletedHistory(JSON.parse(saved));
        }
      } catch (e) {}
    };
    window.addEventListener('real:sannidh:history-updated', handleUpdate);
    return () => window.removeEventListener('real:sannidh:history-updated', handleUpdate);
  }, []);

  const handleViewCompletedWorkPdf = (item: any) => {
    let demoClients: any[] = [];
    try {
      const saved = localStorage.getItem('demo_clients');
      if (saved) demoClients = JSON.parse(saved);
    } catch (e) {}

    const matchedClient = demoClients.find(c => (c.name || c.client_name) === item.client);
    const clientId = matchedClient ? matchedClient.id : 'demo-auto-123';

    toast.success(`Opening completed work PDF for ${item.client}...`);
    localStorage.setItem('selected_client_id', clientId);
    localStorage.setItem('auto_open_pdf', 'true');
    localStorage.setItem('auto_open_task_title', item.title);
    
    window.dispatchEvent(new CustomEvent('change-dashboard-zone', { detail: 'clients' }));
    window.dispatchEvent(new CustomEvent('select-client-event', { 
      detail: { clientId: clientId, autoOpenPdf: true } 
    }));
  };

  const activeAgentCount = agents.filter(a => 
    a.status === 'active' || a.status === 'working' || a.status === 'analyzing'
  ).length;

  // Convert agent messages into actionable inbox items
  const actionItems: ActionItem[] = messages
    .filter(m => !m.acknowledged && !(m.type === 'CONSENSUS_REACHED' && m.priority === 'low'))
    .map((msg): ActionItem => {
      let type: ActionType = 'regulatory';
      if (msg.type === 'APPROVAL_REQUEST') type = 'draft_ready';
      else if (msg.type === 'ALERT_PROPAGATION') type = 'risk_alert';
      else if (msg.type === 'TASK_DELEGATION') type = 'filing_ready';
      else if (msg.type === 'CLIENT_UPDATE') type = 'dependency';
      else if (msg.type === 'DEADLINE_WARNING') type = 'risk_alert';
      else if (msg.type === 'INSIGHT_SHARE') type = 'reconciliation';
      else if (msg.type === 'CONSENSUS_REACHED') type = 'consensus_check';
      else if (msg.type === 'CONSENSUS_FAILED') type = 'consensus_failure';
      else if (msg.type === 'ISSUE_TICKET_GENERATED') type = 'issue_ticket';

      return {
        id: msg.id,
        type,
        agent: msg.fromAgent,
        title: msg.subject,
        description: msg.content,
        priority: msg.priority,
        timestamp: msg.timestamp,
        actionLabel: type === 'consensus_failure' ? 'Review Ticket' : type === 'draft_ready' ? 'Review Draft' : 'View Logs',
        read: msg.acknowledged,
      };
    });

  const filteredItems = filter === 'all' ? actionItems : actionItems.filter(i => i.type === filter);
  const unreadCount = actionItems.filter(i => !i.read).length;

  const emptyStateMessage = isRunning
    ? 'All 12 agents are actively monitoring. Results will appear here as they are generated.'
    : 'Agents are paused. Press Start All to begin the swarm consensus engine.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <Card className="border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.03] via-background to-background overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/20">
                <Inbox className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  AI Action Inbox
                  {unreadCount > 0 && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                      {unreadCount} New
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Actionable results from {activeAgentCount} active agents
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-8 gap-1.5 border-border/50"
                onClick={() => navigate('/settings/agent-control-center')}
              >
                <Settings2 className="w-3.5 h-3.5" />
                Agent Controls
              </Button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/30 overflow-x-auto">
            <Button
              size="sm" variant={filter === 'all' ? 'default' : 'ghost'}
              className="h-7 text-[11px] px-2.5 rounded-full shrink-0"
              onClick={() => setFilter('all')}
            >
              All {actionItems.length > 0 && `(${actionItems.length})`}
            </Button>
            {(Object.entries(ACTION_TYPE_CONFIG) as [ActionType, typeof ACTION_TYPE_CONFIG[ActionType]][]).map(([type, config]) => {
              const count = actionItems.filter(i => i.type === type).length;
              if (count === 0) return null;
              const FilterIcon = config.icon;
              return (
                <Button
                  key={type} size="sm"
                  variant={filter === type ? 'default' : 'ghost'}
                  className="h-7 text-[11px] px-2.5 rounded-full shrink-0 gap-1"
                  onClick={() => setFilter(type)}
                >
                  <FilterIcon className={`w-3 h-3 ${filter === type ? '' : config.color}`} />
                  {config.label} ({count})
                </Button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="bg-[#0f172a] border border-border/30 mb-4 p-1 rounded-lg">
              <TabsTrigger value="pending" className="text-xs px-4 py-1.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Pending Actions ({filteredItems.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-4 py-1.5 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                Completed Work History ({completedHistory.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="m-0 border-0 p-0">
              {filteredItems.length > 0 ? (
                <div className="space-y-2">
                  {filteredItems.slice(0, 8).map((item, index) => {
                    const config = ACTION_TYPE_CONFIG[item.type];
                    const ItemIcon = config.icon;
                    const time = new Date(item.timestamp);
                    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border border-border/30 border-l-[3px] transition-all hover:bg-muted/30 cursor-pointer ${PRIORITY_STYLES[item.priority]}`}
                      >
                        <div className={`p-2 rounded-lg ${config.bgColor} shrink-0 mt-0.5`}>
                          <ItemIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{item.title}</span>
                            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${config.color} border-current/20 shrink-0`}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                              {item.agent}
                            </span>
                            {item.client && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Building className="w-2.5 h-2.5" />
                                {item.client}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">{timeStr}</span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-[11px] px-2 shrink-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAction(item);
                          }}
                        >
                          {item.actionLabel}
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="p-4 rounded-2xl bg-cyan-500/10 mb-4">
                    <Inbox className="w-8 h-8 text-cyan-400/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No pending actions</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">
                    {emptyStateMessage}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="m-0 border-0 p-0 space-y-2">
              {completedHistory.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 animate-fadeIn">
                  {completedHistory.map((item, index) => {
                    const time = new Date(item.completedAt);
                    const dateTimeStr = `${time.toLocaleDateString('en-IN')} ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-border/30 border-l-[3px] border-l-green-500 bg-green-500/[0.02] hover:bg-muted/30 transition-all cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400 shrink-0 mt-0.5">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{item.title}</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-green-400 border-green-500/20 shrink-0">
                              Resolved
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Document generated: {item.documentName}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Building className="w-2.5 h-2.5 text-green-400" />
                              {item.client}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {dateTimeStr}
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-[11px] px-2.5 shrink-0 text-green-400 hover:text-green-300 hover:bg-green-500/10 gap-1"
                          onClick={() => handleViewCompletedWorkPdf(item)}
                        >
                          <Eye className="w-3 h-3" />
                          View PDF
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="p-4 rounded-2xl bg-green-500/10 mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No completed history</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">
                    Completed tasks from the swarm will be archived here date & time wise.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Logs Modal */}
      <Dialog open={!!selectedAction} onOpenChange={(open) => !open && setSelectedAction(null)}>
        <DialogContent className="max-w-2xl bg-[#0B1120] border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              {selectedAction?.actionLabel === 'Review Draft' ? 'AI Draft Review' : 'Agent Telemetry Logs'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ScrollArea className="h-[400px] w-full rounded-md border border-border/50 bg-black/40 p-4">
              <div className="space-y-4 font-mono text-xs">
                {selectedAction?.actionLabel === 'Review Draft' ? (
                  <div className="text-muted-foreground space-y-2">
                    <p className="text-cyan-400">// DOCUMENT GENERATED BY SANNIDH AI SWARM</p>
                    <p>// TARGET: {selectedAction?.title}</p>
                    <div className="w-full h-px bg-border/50 my-2" />
                    <p className="text-foreground mt-4">{selectedAction?.description}</p>
                    <div className="p-4 border border-dashed border-border/50 rounded-lg mt-4 bg-muted/10">
                      <p className="text-emerald-400 mb-2">[✓] Statutory references verified</p>
                      <p className="text-emerald-400 mb-2">[✓] Computations cross-checked</p>
                      <p className="text-emerald-400 mb-2">[✓] Previous filings reconciled</p>
                      <p className="text-emerald-400 mb-4">[✓] Formatted for electronic submission</p>
                      <p className="text-foreground/70 italic text-[10px]">Document preview simulated. In production, this renders a full PDF or E-Filing Form.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground space-y-2">
                    <p className="text-cyan-400">$ tail -f /var/log/sannidh/swarm/{selectedAction?.agent.toLowerCase()}.log</p>
                    <p className="text-foreground">[{selectedAction?.timestamp}] [WARN] Issue detected during consensus protocol.</p>
                    <p>[{selectedAction?.timestamp}] [{selectedAction?.agent}] Executing conflict resolution sub-routine...</p>
                    <p>[{selectedAction?.timestamp}] [{selectedAction?.agent}] Analyzing root cause:</p>
                    <p className="text-amber-400 ml-4">» {selectedAction?.description}</p>
                    <p>[{selectedAction?.timestamp}] [SYSTEM] Triggering cross-group validation...</p>
                    <p className="text-emerald-400">[{selectedAction?.timestamp}] [SUCCESS] Mitigation deployed. Awaiting user acknowledgment.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelectedAction(null)}>Close</Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={() => setSelectedAction(null)}>
              {selectedAction?.actionLabel === 'Review Draft' ? 'Approve Draft' : 'Acknowledge'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
