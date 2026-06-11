/**
 * COMPANY AI ACTION INBOX
 * ========================
 * Clean, results-oriented inbox for the Real Company Dashboard.
 * Displays actionable outputs from the 10 background AI agents.
 * 
 * Shows: compliance alerts, gap remediations, regulatory impact notices,
 * audit readiness updates, and task completions.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Inbox, FileText, AlertTriangle, CheckCircle, Shield, 
  ChevronRight, Settings2, Sparkles, Clock, Building2, Eye
} from 'lucide-react';
import { useAgentOrchestrator } from './CompanyAgentOrchestrator';
import { useNavigate } from 'react-router-dom';

type ActionType = 'compliance_alert' | 'gap_remediation' | 'regulatory_impact' | 'audit_ready' | 'task_complete' | 'insight';

interface ActionItem {
  id: string;
  type: ActionType;
  agent: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  actionLabel: string;
  read: boolean;
}

const ACTION_TYPE_CONFIG: Record<ActionType, { icon: React.ComponentType<any>; color: string; bgColor: string; label: string }> = {
  compliance_alert:  { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Compliance Alert' },
  gap_remediation:   { icon: Shield, color: 'text-orange-400', bgColor: 'bg-orange-500/10', label: 'Gap Remediation' },
  regulatory_impact: { icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/10', label: 'Regulatory Impact' },
  audit_ready:       { icon: Eye, color: 'text-purple-400', bgColor: 'bg-purple-500/10', label: 'Audit Ready' },
  task_complete:     { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10', label: 'Task Complete' },
  insight:           { icon: Sparkles, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', label: 'AI Insight' },
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'border-l-red-500 bg-red-500/5',
  high: 'border-l-orange-500 bg-orange-500/5',
  medium: 'border-l-yellow-500',
  low: 'border-l-slate-500',
};

export const CompanyActionInbox = () => {
  const navigate = useNavigate();
  const { state } = useAgentOrchestrator();
  const [filter, setFilter] = useState<'all' | ActionType>('all');

  const activeAgentCount = state.agents.filter(a => 
    a.status === 'active' || a.status === 'working' || a.status === 'analyzing'
  ).length;

  // Convert agent messages into actionable inbox items
  const actionItems: ActionItem[] = state.messages
    .filter(m => !m.acknowledged)
    .map((msg): ActionItem => {
      let type: ActionType = 'insight';
      if (msg.type === 'ALERT_PROPAGATION') type = 'compliance_alert';
      else if (msg.type === 'TASK_DELEGATION') type = 'task_complete';
      else if (msg.type === 'APPROVAL_REQUEST') type = 'gap_remediation';
      else if (msg.type === 'DATA_SYNC') type = 'regulatory_impact';
      else if (msg.type === 'INSIGHT_SHARE') type = 'insight';

      return {
        id: msg.id,
        type,
        agent: msg.fromAgent,
        title: msg.subject,
        description: msg.content,
        priority: msg.priority,
        timestamp: msg.timestamp,
        actionLabel: type === 'compliance_alert' ? 'View Alert' : type === 'gap_remediation' ? 'Review' : 'Take Action',
        read: msg.acknowledged,
      };
    });

  const filteredItems = filter === 'all' ? actionItems : actionItems.filter(i => i.type === filter);
  const unreadCount = actionItems.filter(i => !i.read).length;

  const emptyStateMessage = state.isRunning 
    ? 'All 10 agents are actively monitoring your compliance. Results will appear here.'
    : 'Agents are paused. Start the Auto-Pilot to begin monitoring.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Card className="border-violet-500/15 bg-gradient-to-br from-violet-500/[0.03] via-background to-background overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/20">
                <Inbox className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  AI Action Inbox
                  {unreadCount > 0 && (
                    <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">
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
                onClick={() => navigate('/settings/company-agent-control-center')}
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
                          <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                          {item.agent}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{timeStr}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-[11px] px-2 shrink-0 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10">
                      {item.actionLabel}
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-4 rounded-2xl bg-violet-500/10 mb-4">
                <Inbox className="w-8 h-8 text-violet-400/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No pending actions</p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">
                {emptyStateMessage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
