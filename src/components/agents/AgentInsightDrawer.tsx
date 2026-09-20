/**
 * AGENT INSIGHT DRAWER
 * ====================
 * A slide-in drawer within dashboard sections showing AI-generated insights,
 * cross-agent references, and actionable recommendations.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, ArrowRight, ChevronDown, ChevronUp, 
  MessageSquare, Zap, Link2, Bot, AlertCircle
} from 'lucide-react';
import { useAgentOrchestrator, type AgentId } from './CompanyAgentOrchestrator';

interface AgentInsightDrawerProps {
  agentId: AgentId;
}

interface Insight {
  id: string;
  text: string;
  type: 'recommendation' | 'warning' | 'info' | 'cross_ref';
  fromAgent?: AgentId;
  actionable: boolean;
  actionLabel?: string;
}

// Generate insights based on agent messages
const generateInsights = (agentId: AgentId, messages: any[]): Insight[] => {
  const relevantMessages = messages.filter(m => m.toAgent === agentId || m.fromAgent === agentId);
  const insights: Insight[] = [];

  relevantMessages.slice(0, 3).forEach((msg, i) => {
    if (msg.fromAgent !== agentId) {
      insights.push({
        id: `insight-${agentId}-${i}`,
        text: `${msg.fromAgent} reports: ${msg.subject}`,
        type: msg.type === 'ALERT_PROPAGATION' ? 'warning' : 'cross_ref',
        fromAgent: msg.fromAgent,
        actionable: msg.priority === 'critical' || msg.priority === 'high',
        actionLabel: msg.priority === 'critical' ? 'Act Now' : 'Review',
      });
    } else {
      insights.push({
        id: `insight-${agentId}-out-${i}`,
        text: `Sent to ${msg.toAgent}: ${msg.subject}`,
        type: 'info',
        fromAgent: agentId,
        actionable: false,
      });
    }
  });

  // Always add at least one generated recommendation
  if (insights.length === 0) {
    insights.push({
      id: `insight-${agentId}-default`,
      text: 'All systems nominal. No cross-agent alerts at this time.',
      type: 'info',
      actionable: false,
    });
  }

  return insights;
};

export const AgentInsightDrawer = ({ agentId }: AgentInsightDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { state } = useAgentOrchestrator();
  const agent = state.agents.find(a => a.id === agentId);
  
  if (!agent) return null;

  const agentMessages = state.messages.filter(
    m => m.fromAgent === agentId || m.toAgent === agentId || m.toAgent === 'ALL'
  );
  
  const insights = generateInsights(agentId, agentMessages);
  const unacknowledgedCount = agentMessages.filter(m => !m.acknowledged && m.toAgent === agentId).length;

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between text-xs hover:bg-primary/5 border border-transparent hover:border-primary/20 h-7 px-2"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-muted-foreground">{agent.name} Insights</span>
          {unacknowledgedCount > 0 && (
            <Badge className="bg-primary/20 text-primary text-[9px] px-1 h-4 min-w-[16px] justify-center">
              {unacknowledgedCount}
            </Badge>
          )}
        </span>
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 p-3 rounded-lg bg-gradient-to-br from-primary/5 via-background to-muted/30 border border-primary/10">
              {/* Cross-Wire Status */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground pb-2 border-b border-border/40">
                <Link2 className="w-3 h-3" />
                <span>Wired to: {agent.wiredTo.map(id => (
                  <Badge key={id} variant="outline" className="text-[9px] mx-0.5 px-1 h-3.5">{id}</Badge>
                ))}</span>
              </div>

              {/* Insights */}
              {insights.map((insight) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-2 rounded-md border text-xs ${
                    insight.type === 'warning' 
                      ? 'bg-orange-500/10 border-orange-500/20' 
                      : insight.type === 'cross_ref'
                      ? 'bg-purple-500/10 border-purple-500/20'
                      : 'bg-muted/40 border-border/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {insight.type === 'warning' && <AlertCircle className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" />}
                    {insight.type === 'cross_ref' && <MessageSquare className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />}
                    {insight.type === 'info' && <Bot className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />}
                    {insight.type === 'recommendation' && <Zap className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />}
                    <span className="flex-1 text-foreground/80">{insight.text}</span>
                  </div>
                  {insight.actionable && insight.actionLabel && (
                    <Button size="sm" variant="outline" className="mt-1.5 h-5 text-[10px] px-2">
                      {insight.actionLabel}
                      <ArrowRight className="w-2.5 h-2.5 ml-1" />
                    </Button>
                  )}
                </motion.div>
              ))}

              {/* Agent Stats Mini */}
              <div className="flex items-center gap-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                <span>Tasks: <strong className="text-foreground">{agent.metrics.tasksCompleted}</strong></span>
                <span>Accuracy: <strong className="text-foreground">{agent.metrics.accuracy}%</strong></span>
                <span>Alerts: <strong className="text-foreground">{agent.metrics.alertsRaised}</strong></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
