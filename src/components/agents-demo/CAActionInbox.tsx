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
  Clock, Building, RefreshCw, Filter, Archive, Activity, Zap
} from 'lucide-react';
import { useCAAgentOrchestrator } from './CAAgentOrchestrator';
import { useNavigate } from 'react-router-dom';
import { buildOfflineDraft, readyNoticeTemplates } from '../ca-dashboard-demo/AIDraftingEngine';

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

interface FixDetails {
  proposedFix: string;
  pdfName: string;
}

const getFixDetails = (title: string, description: string, clientName: string): FixDetails => {
  const clientSanitized = clientName ? clientName.replace(/\s+/g, '_') : 'Client';
  const descLower = description.toLowerCase();
  const titleLower = title.toLowerCase();

  if (titleLower.includes('gstr-2b mismatch') || descLower.includes('gstr-2b mismatch')) {
    return {
      proposedFix: "Review and sign GSTR-2B mismatch rebuttal safe harbor response under Section 16(4). Reconcile 847 invoices.",
      pdfName: `Resolution_GSTR_2B_Mismatch_Rebuttal_${clientSanitized}.pdf`
    };
  }
  if (titleLower.includes('hsn classification') || descLower.includes('hsn classification')) {
    return {
      proposedFix: "Update master inventory database with unified classification for HSN 8471. Recalculate Rule 36(4) ITC claim limits.",
      pdfName: `Resolution_HSN_Classification_Audit_${clientSanitized}.pdf`
    };
  }
  if (titleLower.includes('dir-3 kyc') || descLower.includes('dir-3 kyc')) {
    return {
      proposedFix: "Update corporate governance registry with active MCA portal verification. Clear DIR-3 KYC default variance flags.",
      pdfName: `Resolution_DIR3_KYC_Verification_${clientSanitized}.pdf`
    };
  }
  if (titleLower.includes('gst itc reconciliation') || descLower.includes('gst itc reconciliation') || descLower.includes('section 17(5)')) {
    return {
      proposedFix: "Reverse blocked credit u/s 17(5) for ineligible expenses. Adjust GST general ledger accounts.",
      pdfName: `Resolution_GST_ITC_Section17_5_Adjustment_${clientSanitized}.pdf`
    };
  }
  if (titleLower.includes('statutory deadline') || descLower.includes('statutory deadline') || descLower.includes('gstr-3b filing')) {
    return {
      proposedFix: "Execute automated GSTR-3B filing submission sequence. Verify compliance with Section 39.",
      pdfName: `Resolution_GSTR3B_Filing_Submission_${clientSanitized}.pdf`
    };
  }
  if (titleLower.includes('risk rating') || descLower.includes('compliance score')) {
    return {
      proposedFix: "Re-calculate and lock compliance health score including quarterly return acknowledgments and MCA filing logs.",
      pdfName: `Resolution_Compliance_Score_Sync_${clientSanitized}.pdf`
    };
  }
  if (descLower.includes('tax liability mismatch') || descLower.includes('igst recalculated')) {
    return {
      proposedFix: "Apply Rule 42 exclusion for reversed invoice treatment. Recalculate IGST liability.",
      pdfName: `Resolution_IGST_Rule42_Recalculation_${clientSanitized}.pdf`
    };
  }
  if (descLower.includes('invoice reconciliation gap') || descLower.includes('reconciliation corrected')) {
    return {
      proposedFix: "Apply Schedule III exemptions to 12 unmatched entries. Reconcile invoices under zero-rated supplies.",
      pdfName: `Resolution_ScheduleIII_Exempt_Reconciliation_${clientSanitized}.pdf`
    };
  }
  if (descLower.includes('depreciation resolved') || descLower.includes('depreciation schedule conflict') || descLower.includes('balance sheet variance')) {
    return {
      proposedFix: "Re-calculate depreciation schedule using Straight Line Method (SLM) under Schedule II of Companies Act 2013 and align balance sheet assets.",
      pdfName: `Resolution_Depreciation_SLM_Alignment_${clientSanitized}.pdf`
    };
  }
  if (descLower.includes('validation failure') || descLower.includes('itc corrected')) {
    return {
      proposedFix: "Reverse blocked credit u/s 17(5) for motor vehicle expenses. Adjust net ITC claim value.",
      pdfName: `Resolution_Section17_5_ITC_Reversal_${clientSanitized}.pdf`
    };
  }
  if (descLower.includes('mandatory field missing') || descLower.includes('pan-gstin linkage')) {
    return {
      proposedFix: "Populate PAN-GSTIN linkage on Page 3 from master client records. Complete mandatory field audit.",
      pdfName: `Resolution_PAN_GSTIN_Linkage_Correction_${clientSanitized}.pdf`
    };
  }
  if (descLower.includes('previous filing inconsistency') || descLower.includes('hsn code corrected')) {
    return {
      proposedFix: "Reconcile HSN code mismatch (8473 corrected to 8471) against customs tariff schedule and previous quarter returns.",
      pdfName: `Resolution_HSN_Code_Consistency_Sync_${clientSanitized}.pdf`
    };
  }
  if (descLower.includes('filing status mismatch') || descLower.includes('portal re-checked') || descLower.includes('arn confirmed')) {
    return {
      proposedFix: "Re-query tax portal to fetch ARN reference post timeout. Update return status to filed.",
      pdfName: `Resolution_Portal_ARN_Retrieval_${clientSanitized}.pdf`
    };
  }
  if (descLower.includes('authority response conflict') || descLower.includes('drc-07')) {
    return {
      proposedFix: "Resolve duplicate DRC-07 penalty notice flag. Maintain compliance health score.",
      pdfName: `Resolution_Duplicate_DRC07_Notice_Dismissal_${clientSanitized}.pdf`
    };
  }
  
  return {
    proposedFix: "Analyze agent telemetry trace, execute consensus alignment checks, and generate compliance resolution report.",
    pdfName: `Resolution_Consensus_Audit_${clientSanitized}.pdf`
  };
};

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

const getDraftContentForAction = (action: ActionItem) => {
  let docType = "gst-show-cause";
  let authority = "GST Adjudicating Officer";
  
  const titleLower = action.title.toLowerCase();
  if (titleLower.includes("mca") || titleLower.includes("roc") || titleLower.includes("board resolution") || titleLower.includes("aoc-4") || titleLower.includes("mgt-7")) {
    docType = "mca-notice";
    authority = "Registrar of Companies";
  } else if (titleLower.includes("income tax") || titleLower.includes("tds") || titleLower.includes("advance tax") || titleLower.includes("26q") || titleLower.includes("143(3)")) {
    docType = "income-tax-response";
    authority = "Income Tax Assessing Officer";
  } else if (titleLower.includes("rbi") || titleLower.includes("fema")) {
    docType = "rbi-filing";
    authority = "Reserve Bank of India";
  } else if (titleLower.includes("sebi") || titleLower.includes("lodr") || titleLower.includes("pit")) {
    docType = "sebi-compliance";
    authority = "Securities and Exchange Board of India";
  } else if (titleLower.includes("customs") || titleLower.includes("tariff") || titleLower.includes("bill of entry")) {
    docType = "customs-response";
    authority = "Customs Commissionerate";
  } else if (titleLower.includes("contract") || titleLower.includes("agreement")) {
    docType = "contract-review";
    authority = "Legal Department";
  }

  const noticeText = readyNoticeTemplates[docType] || action.description;

  return buildOfflineDraft({
    documentType: docType,
    authority: authority,
    companyName: action.client || "Client Company",
    noticeText: noticeText,
    modeLabel: "balanced",
    templatePack: "facts-heavy",
    promptPack: "prompt-facts-first",
    sovereignEngine: "sannidh_nexus_9",
  });
};

export const CAActionInbox = () => {
  const navigate = useNavigate();
  const { agents, messages, isRunning, systemStatus, acknowledgeMessage } = useCAAgentOrchestrator();
  const [filter, setFilter] = useState<'all' | ActionType>('all');
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);

  const [isFixing, setIsFixing] = useState(false);
  const [fixingProgress, setFixingProgress] = useState(0);
  const [fixingStep, setFixingStep] = useState('');
  const [fixCompleted, setFixCompleted] = useState(false);
  const [resolvedPdf, setResolvedPdf] = useState<any>(null);

  const isAutoMode = localStorage.getItem('sannidh:dashboard-mode') === 'auto';

  useEffect(() => {
    if (!selectedAction) {
      setIsFixing(false);
      setFixingProgress(0);
      setFixingStep('');
      setFixCompleted(false);
      setResolvedPdf(null);
    }
  }, [selectedAction]);

  useEffect(() => {
    if (selectedAction && isAutoMode && !isFixing && !fixCompleted) {
      const timer = setTimeout(() => {
        handleExecuteFix(selectedAction);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedAction, isAutoMode]);

  const handleExecuteFix = (action: ActionItem) => {
    setIsFixing(true);
    setFixingProgress(0);
    setFixingStep('Initializing resolution protocol...');

    const steps = [
      { progress: 15, step: 'Initializing resolution protocol...' },
      { progress: 40, step: 'Executing automated consensus validation...' },
      { progress: 65, step: 'Generating audit-sealed resolution report...' },
      { progress: 90, step: 'Signing and registering document to vault...' },
      { progress: 100, step: 'Resolution completed' }
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setFixingProgress(steps[currentStepIndex].progress);
        setFixingStep(steps[currentStepIndex].step);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        
        // Finalize fix
        const clientName = action.client || 'Reliance Industries';
        const details = getFixDetails(action.title, action.description, clientName);
        
        // Find client ID
        let clientId = 'demo-auto-123';
        try {
          const saved = localStorage.getItem('demo_clients');
          if (saved) {
            const clients = JSON.parse(saved);
            const matchedClient = clients.find((c: any) => (c.name || c.client_name) === clientName);
            if (matchedClient) clientId = matchedClient.id;
          }
        } catch (e) {
          console.warn('[CAActionInbox-Demo] Silent catch triggered:', e);
        }

        const formattedTitle = action.title.replace(/[^a-zA-Z0-9]/g, '_');
        const clientSanitized = clientName.replace(/\s+/g, '_');
        const pdfName = `Resolution_${formattedTitle}_${clientSanitized}.pdf`;

        // 1. Save to client completed_tasks_${clientId}
        const taskEntry = {
          title: action.title,
          pdfName: pdfName,
          completedAt: new Date().toISOString(),
          draftType: 'resolution'
        };
        
        let completed: any[] = [];
        try {
          const saved = localStorage.getItem(`completed_tasks_${clientId}`);
          if (saved) completed = JSON.parse(saved);
        } catch (e) {
          console.warn('[CAActionInbox-Demo] Silent catch triggered:', e);
        }

        if (!completed.find((c: any) => c.title === action.title)) {
          completed.push(taskEntry);
          localStorage.setItem(`completed_tasks_${clientId}`, JSON.stringify(completed));
        }

        // 2. Save to global completed work history
        let history: any[] = [];
        try {
          const saved = localStorage.getItem('demo:sannidh:completed-work-history');
          if (saved) history = JSON.parse(saved);
        } catch (e) {
          console.warn('[CAActionInbox-Demo] Silent catch triggered:', e);
        }

        const newHistoryEntry = {
          id: `resolved-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title: action.title,
          client: clientName,
          completedAt: new Date().toISOString(),
          documentName: pdfName,
          proposedFix: details.proposedFix,
        };
        
        // Deduplicate in global history
        history = history.filter((h: any) => !(h.title === action.title && h.client === clientName));
        history.unshift(newHistoryEntry);
        localStorage.setItem('demo:sannidh:completed-work-history', JSON.stringify(history));
        
        // Dispatch custom event to notify components
        window.dispatchEvent(new CustomEvent('demo:sannidh:history-updated'));

        // 3. Acknowledge message to remove from pending
        acknowledgeMessage(action.id);

        setIsFixing(false);
        setFixCompleted(true);
        setResolvedPdf({
          title: action.title,
          client: clientName,
          documentName: pdfName
        });

        toast.success(`Fix successfully executed for ${clientName}`, {
          description: `Resolution PDF: ${pdfName}`
        });
      }
    }, 400);
  };

  const [completedHistory, setCompletedHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('demo:sannidh:completed-work-history');
      if (!saved) return [];
      let history = JSON.parse(saved);
      
      // Clean up old duplicates and fix buggy "Draft_Draft_" prefix names
      const seen = new Set<string>();
      history = history.filter((item: any) => {
        // Fix double Draft_ prefix from old bug
        if (item.documentName && item.documentName.startsWith('Draft_Draft_')) {
          item.documentName = item.documentName.replace('Draft_Draft_', 'Draft_');
        }
        if (item.documentName && item.documentName.startsWith('Completed_Work_')) {
          item.documentName = item.documentName.replace('Completed_Work_', 'Draft_');
        }
        // Deduplicate: keep only the latest entry per unique title+client combo
        const key = `${item.title}::${item.client}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      // Persist the cleaned-up list
      localStorage.setItem('demo:sannidh:completed-work-history', JSON.stringify(history));
      return history;
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('demo:sannidh:completed-work-history');
        if (saved) {
          setCompletedHistory(JSON.parse(saved));
        }
      } catch (e) {
          console.warn('[CAActionInbox-Demo] Silent catch triggered:', e);
        }
    };
    window.addEventListener('demo:sannidh:history-updated', handleUpdate);
    return () => window.removeEventListener('demo:sannidh:history-updated', handleUpdate);
  }, []);

  const handleViewCompletedWorkPdf = (item: any) => {
    let demoClients: any[] = [];
    try {
      const saved = localStorage.getItem('demo_clients');
      if (saved) demoClients = JSON.parse(saved);
    } catch (e) {
          console.warn('[CAActionInbox-Demo] Silent catch triggered:', e);
        }

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

      // Extract client name
      let clientName = '';
      const content = msg.content || '';
      try {
        const saved = localStorage.getItem('demo_clients');
        if (saved) {
          const clients = JSON.parse(saved);
          for (const c of clients) {
            const name = c.name || c.client_name;
            if (name && content.toLowerCase().includes(name.toLowerCase())) {
              clientName = name;
              break;
            }
          }
        }
      } catch (e) {
          console.warn('[CAActionInbox-Demo] Silent catch triggered:', e);
        }

      if (!clientName) {
        const match = content.match(/for\s+([^.]+)/i);
        if (match && match[1]) {
          clientName = match[1].trim();
        }
      }

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
        client: clientName || undefined,
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
      <Dialog open={!!selectedAction} onOpenChange={(open) => !open && !isFixing && setSelectedAction(null)}>
        <DialogContent className="max-w-2xl bg-[#0B1120] border-border/50 text-foreground relative overflow-hidden">
          
          {/* Fixing Progress Overlay */}
          {isFixing && (
            <div className="absolute inset-0 bg-[#0B1120]/95 flex flex-col items-center justify-center p-6 text-center z-50 animate-fadeIn">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
              <h4 className="text-sm font-semibold text-white mb-2">Executing Swarm Self-Healing Fix</h4>
              <p className="text-xs text-muted-foreground mb-4">{fixingStep}</p>
              <div className="w-48 bg-muted/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${fixingProgress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 font-mono">{fixingProgress}%</span>
            </div>
          )}

          {/* Fix Completed Success Overlay */}
          {fixCompleted && (
            <div className="absolute inset-0 bg-[#0B1120]/95 flex flex-col items-center justify-center p-6 text-center z-50 animate-fadeIn">
              <div className="p-3 bg-green-500/15 border border-green-500/30 rounded-full mb-4 text-green-400">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">Resolution Completed Successfully!</h4>
              <p className="text-xs text-muted-foreground mb-6">
                The compliance variance has been resolved and the audit-sealed report has been saved date & time wise.
              </p>
              <div className="flex gap-2">
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-white gap-1.5"
                  onClick={() => {
                    if (resolvedPdf) {
                      handleViewCompletedWorkPdf(resolvedPdf);
                      setSelectedAction(null);
                    }
                  }}
                >
                  <Eye className="w-4 h-4" /> View Resolution PDF
                </Button>
                <Button variant="outline" onClick={() => setSelectedAction(null)}>Close</Button>
              </div>
            </div>
          )}

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              {selectedAction?.actionLabel === 'Review Draft' ? 'AI Draft Review' : 'Agent Telemetry Logs'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction?.title}
            </DialogDescription>
          </DialogHeader>

          {/* Proposed Fix Details Card */}
          {selectedAction && (
            <div className="mt-4 p-4 border border-cyan-500/20 bg-cyan-500/[0.02] rounded-xl text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Proposed Automated Fix
                </h4>
                <Badge variant="outline" className={`text-[10px] uppercase font-mono tracking-wider ${isAutoMode ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                  {isAutoMode ? 'Mode: Auto' : 'Mode: Manual'}
                </Badge>
              </div>
              <p className="text-foreground/90 font-medium">
                {getFixDetails(selectedAction.title, selectedAction.description, selectedAction.client || '').proposedFix}
              </p>
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                <FileText className="w-3.5 h-3.5" />
                <span>Target Document: <code className="text-cyan-300/80">{getFixDetails(selectedAction.title, selectedAction.description, selectedAction.client || '').pdfName}</code></span>
              </div>
            </div>
          )}

          <div className="mt-4">
            <ScrollArea className={`${selectedAction?.actionLabel === 'Review Draft' ? 'h-[450px] bg-[#FAF9F6] text-[#1F2937]' : 'h-[250px] bg-black/40 text-muted-foreground'} w-full rounded-md border border-border/50 p-4`}>
              <div className={selectedAction?.actionLabel === 'Review Draft' ? 'font-serif text-[13px] leading-relaxed whitespace-pre-wrap p-2' : 'font-mono text-xs space-y-4'}>
                {selectedAction?.actionLabel === 'Review Draft' ? (
                  <div className="space-y-2 select-text">
                    {selectedAction && getDraftContentForAction(selectedAction)}
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs">
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
            {selectedAction?.actionLabel === 'Review Draft' ? (
              <Button 
                className="bg-cyan-500 hover:bg-cyan-600 text-white gap-1.5" 
                onClick={() => selectedAction && handleExecuteFix(selectedAction)}
              >
                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                Approve Draft
              </Button>
            ) : (
              <Button 
                className="bg-cyan-500 hover:bg-cyan-600 text-white gap-1.5" 
                onClick={() => selectedAction && handleExecuteFix(selectedAction)}
              >
                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                Execute Fix
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
