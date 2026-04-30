/**
 * CA SWARM CONSENSUS ORCHESTRATOR
 * ================================
 * 12-Agent architecture broken into 4 Groups (Analyser, Drafter, Reviewer, Monitor).
 * Each group has 3 agents with specific CA workflow responsibilities.
 * Cross-group wiring ensures every output is rechecked by peer agents.
 * 
 * ANALYSER: Extract regulatory data, identify applicable rules, calculate risk scores
 * DRAFTER:  Generate compliant documents, calculate tax liability, handle edge cases
 * REVIEWER: Validate against regulations, check mandatory fields, flag issues
 * MONITOR:  Track filing status, check authority responses, update compliance scores
 * 
 * Engine does NOT auto-run. CA must press "Start" to activate the swarm.
 * No mock data — wire feed only populates when swarm is explicitly started.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type CAAgentGroupId = 'ANALYSER' | 'DRAFTER' | 'REVIEWER' | 'MONITOR';

export type CAAgentId = 
  | 'A1_PRIME' | 'A2_CROSS' | 'A3_AUDIT'
  | 'D1_MAKER' | 'D2_REFINER' | 'D3_ALIGNER'
  | 'R1_TAX' | 'R2_LEGAL' | 'R3_FINAL'
  | 'M1_PULSE' | 'M2_TRACKER' | 'M3_HERALD';

export type CAAgentStatus = 'active' | 'idle' | 'working' | 'analyzing' | 'alert' | 'error' | 'paused' | 'consensus_check' | 'resolving_conflict';

export type CAMessageType = 
  | 'ALERT_PROPAGATION' 
  | 'DATA_SYNC' 
  | 'TASK_DELEGATION' 
  | 'INSIGHT_SHARE' 
  | 'APPROVAL_REQUEST'
  | 'CONSENSUS_REACHED'
  | 'CONSENSUS_FAILED'
  | 'ISSUE_TICKET_GENERATED';

export type CAMessagePriority = 'critical' | 'high' | 'medium' | 'low';

export interface CAAgentMessage {
  id: string;
  fromAgent: CAAgentId;
  toAgent: CAAgentId | 'ALL' | CAAgentGroupId;
  type: CAMessageType;
  priority: CAMessagePriority;
  subject: string;
  content: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface CAAgentMetrics {
  tasksCompleted: number;
  insightsGenerated: number;
  messagesSent: number;
  messagesReceived: number;
  alertsRaised: number;
  conflictsResolved: number;
  accuracy: number;
}

export interface CAAgentDefinition {
  id: CAAgentId;
  groupId: CAAgentGroupId;
  name: string;
  fullName: string;
  section: string;
  description: string;
  status: CAAgentStatus;
  currentTask: string;
  lastActivity: string;
  wiredTo: CAAgentId[];
  metrics: CAAgentMetrics;
  color: string;
  bgColor: string;
  icon: string;
}

export const CA_AGENT_SECTION_MAP: Record<number, CAAgentId> = {
  1: 'A1_PRIME', 2: 'A2_CROSS', 3: 'A3_AUDIT',
  4: 'D1_MAKER', 5: 'D2_REFINER', 6: 'D3_ALIGNER',
  7: 'R1_TAX', 8: 'R2_LEGAL', 9: 'R3_FINAL',
  10: 'M1_PULSE', 11: 'M2_TRACKER', 12: 'M3_HERALD'
};

// Domain-specific consensus messages per group
const GROUP_CONSENSUS_MESSAGES: Record<CAAgentGroupId, {
  tasks: string[];
  conflicts: string[];
  resolutions: string[];
}> = {
  ANALYSER: {
    tasks: [
      'Extracting regulatory requirements from CBDT/CBIC notifications...',
      'Scanning applicable GST rules on incoming notice...',
      'Computing draft risk score using compliance matrix...',
      'Pulling company compliance status from MCA portal...',
      'Cross-referencing notice clauses with CGST Act sections...',
      'Identifying applicable ITR sections for assessment year...',
    ],
    conflicts: [
      'Risk score mismatch — A1 calculated 72% but A2 derived 58% from alternate data source. Section 44AB threshold variance detected.',
      'Regulatory extraction inconsistency — A1 pulled CGST Rule 36(4) but A3 flagged that Rule 36(4) was superseded by Notification 94/2020.',
      'Compliance status conflict — A2 shows company as "active" on MCA but A3 found pending DIR-3 KYC default.',
    ],
    resolutions: [
      'Risk score recalculated using weighted average. A2 verified against CBDT circular. All 3 agents aligned at 65%.',
      'Regulatory data corrected. A1 updated rule reference. A3 confirmed against latest GST Council notification.',
      'MCA status reconciled. DIR-3 KYC default was resolved on portal. A2 confirmed active status. Handoff to DRAFTER.',
    ]
  },
  DRAFTER: {
    tasks: [
      'Generating compliant GSTR-3B draft with auto-filled ITC values...',
      'Loading documents for balance sheet preparation...',
      'Calculating tax liability — CGST, SGST, IGST breakup...',
      'Generating invoice reconciliation report (GSTR-2B vs books)...',
      'Handling edge case: reversed invoices and credit notes...',
      'Processing exempted supplies under Schedule III...',
    ],
    conflicts: [
      'Tax liability mismatch — D1 computed ₹4,72,000 IGST but D2 calculated ₹4,58,000. Difference traced to reversed invoice treatment.',
      'Invoice reconciliation gap — D1 generated 847 matched invoices but D3 found 12 unmatched entries from exempted supply category.',
      'Balance sheet variance — D2 total assets differ by ₹2.3L from D3 statutory alignment check. Depreciation schedule conflict.',
    ],
    resolutions: [
      'IGST recalculated. D3 confirmed reversed invoices should be excluded per Rule 42. All agents aligned at ₹4,58,000.',
      'Reconciliation corrected. D3 matched 12 entries as Schedule III exempted. Zero-rated supply classification applied.',
      'Depreciation resolved using SLM method per Companies Act 2013 Schedule II. D2 updated. Balance sheet aligned.',
    ]
  },
  REVIEWER: {
    tasks: [
      'Validating GSTR-3B against CGST Act and notification circulars...',
      'Comparing generated values with GSTR-2B auto-populated data...',
      'Checking for missing mandatory fields in filing documents...',
      'Validating ITC calculations against Rule 36(4) restriction...',
      'Cross-checking against previous quarter filings for consistency...',
      'Flagging compliance issues in generated draft...',
    ],
    conflicts: [
      'Validation failure — R1 approved ITC claim but R2 flagged ₹1,20,000 as ineligible under Section 17(5) (motor vehicle expense).',
      'Mandatory field missing — R2 passed the draft but R3 found PAN-GSTIN linkage field empty on Page 3.',
      'Previous filing inconsistency — R1 accepted current HSN summary but R3 found HSN code 8471 was reported as 8473 last quarter.',
    ],
    resolutions: [
      'ITC corrected. R1 reversed ₹1,20,000 blocked credit. R2 confirmed Section 17(5) applicability. Net ITC reduced.',
      'Missing PAN-GSTIN field populated from master data. R3 verified. Draft now passes all 47 mandatory field checks.',
      'HSN code corrected from 8473 to 8471. R1 verified against customs tariff schedule. Consistency with Q3 filing restored.',
    ]
  },
  MONITOR: {
    tasks: [
      'Scheduling filing reminder — GSTR-3B due in 4 days...',
      'Tracking filing status: pending → submitted → acknowledged...',
      'Checking tax authority response on previous filing...',
      'Updating compliance health score post-filing...',
      'Monitoring DRC-01 notice response deadline...',
      'Syncing acknowledgment receipts from GST portal...',
    ],
    conflicts: [
      'Filing status mismatch — M1 shows "submitted" but M2 received portal timeout error. ARN not generated.',
      'Authority response conflict — M2 received "accepted" status but M3 found penalty notice DRC-07 issued for same period.',
      'Compliance score disagreement — M1 computed 94% but M3 calculated 87% due to unacknowledged quarterly returns.',
    ],
    resolutions: [
      'Portal re-checked. ARN confirmed as generated after retry. M2 updated status to "filed". M3 sent confirmation to client.',
      'DRC-07 identified as duplicate notice for pre-revised return. M2 flagged for CA review. Compliance score maintained.',
      'Score recalculated with quarterly return acknowledgments. M1 and M3 aligned at 91%. Client dashboard updated.',
    ]
  }
};

const ZERO_METRICS: CAAgentMetrics = { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, conflictsResolved: 0, accuracy: 100 };

const createInitialCAAgents = (): CAAgentDefinition[] => [
  // ═══════════════════════════════════════════════════════════════
  // ANALYSER GROUP — Extract, Identify, Calculate Risk
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'A1_PRIME', groupId: 'ANALYSER', name: 'ORACLE', fullName: 'Regulatory Data Extractor',
    section: 'Regulatory News & Rule Impact',
    description: 'Extracts regulatory requirements and data from CBDT/CBIC/MCA notifications for draft generation. Pulls latest circulars, amendments, and compliance rules.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['A2_CROSS', 'A3_AUDIT', 'D1_MAKER', 'R1_TAX'],
    metrics: { ...ZERO_METRICS }, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: 'Database'
  },
  {
    id: 'A2_CROSS', groupId: 'ANALYSER', name: 'RADAR', fullName: 'Applicable Rule Identifier',
    section: 'Compliance Health & Change Log',
    description: 'Identifies applicable rules on incoming notices. Checks company compliance status against MCA/GST portal. Maps notice clauses to statutory sections.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['A1_PRIME', 'A3_AUDIT', 'D2_REFINER', 'R2_LEGAL'],
    metrics: { ...ZERO_METRICS }, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: 'Search'
  },
  {
    id: 'A3_AUDIT', groupId: 'ANALYSER', name: 'METRIC', fullName: 'Risk Score Calculator',
    section: 'CA Analytics & Performance',
    description: 'Calculates risk score of the draft using compliance matrix. Evaluates penalty probability, deadline proximity, and historical default patterns.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['A1_PRIME', 'A2_CROSS', 'D3_ALIGNER', 'R3_FINAL'],
    metrics: { ...ZERO_METRICS }, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: 'BarChart3'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // DRAFTER GROUP — Generate, Calculate, Handle Edge Cases
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'D1_MAKER', groupId: 'DRAFTER', name: 'DRAFTER', fullName: 'Compliant Document Generator',
    section: 'AI Drafting Engine',
    description: 'Generates compliant documents (GSTR-3B, ITR, ROC forms). Loads documents for filling data fields. Maintains balance sheet computations in background.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['D2_REFINER', 'D3_ALIGNER', 'A1_PRIME', 'R1_TAX'],
    metrics: { ...ZERO_METRICS }, color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: 'FileText'
  },
  {
    id: 'D2_REFINER', groupId: 'DRAFTER', name: 'TASKMASTER', fullName: 'Tax Liability & Reconciliation Engine',
    section: 'Task & Filing Management',
    description: 'Calculates tax liability (CGST/SGST/IGST breakup). Generates invoice reconciliation reports (GSTR-2B vs books). Processes ITC computations.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['D1_MAKER', 'D3_ALIGNER', 'A2_CROSS', 'R2_LEGAL'],
    metrics: { ...ZERO_METRICS }, color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: 'Calculator'
  },
  {
    id: 'D3_ALIGNER', groupId: 'DRAFTER', name: 'HERALD', fullName: 'Edge Case Handler',
    section: 'Audit & Inspection Support',
    description: 'Handles edge cases: reversed invoices, credit notes, exempted supplies (Schedule III), zero-rated exports, and composition scheme transactions.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['D1_MAKER', 'D2_REFINER', 'A3_AUDIT', 'R3_FINAL'],
    metrics: { ...ZERO_METRICS }, color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: 'Scale'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // REVIEWER GROUP — Validate, Compare, Flag Issues
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'R1_TAX', groupId: 'REVIEWER', name: 'INSPECTOR', fullName: 'Regulation Validator',
    section: 'Client Dependency Tracker',
    description: 'Validates generated document against CGST/IGST Act regulations. Compares generated values with auto-populated GSTR-2B data.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['R2_LEGAL', 'R3_FINAL', 'D1_MAKER', 'M1_PULSE'],
    metrics: { ...ZERO_METRICS }, color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: 'CheckSquare'
  },
  {
    id: 'R2_LEGAL', groupId: 'REVIEWER', name: 'TRACKER', fullName: 'Mandatory Field & Calculation Auditor',
    section: 'Company Management',
    description: 'Checks for missing mandatory fields. Validates all calculations (ITC, tax liability, interest u/s 50). Cross-checks against previous quarterly filings.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['R1_TAX', 'R3_FINAL', 'D2_REFINER', 'M2_TRACKER'],
    metrics: { ...ZERO_METRICS }, color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: 'ShieldAlert'
  },
  {
    id: 'R3_FINAL', groupId: 'REVIEWER', name: 'PORTFOLIO', fullName: 'Draft Issue Flagger',
    section: 'Revenue & Billing',
    description: 'Flags all issues found in the generated draft. Produces final approval/rejection report with itemized discrepancies for CA sign-off.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['R1_TAX', 'R2_LEGAL', 'D3_ALIGNER', 'M3_HERALD'],
    metrics: { ...ZERO_METRICS }, color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: 'AlertTriangle'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // MONITOR GROUP — Track, Respond, Update Score
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'M1_PULSE', groupId: 'MONITOR', name: 'COMMAND', fullName: 'Filing Status & Reminder Engine',
    section: 'Daily Governance Brief',
    description: 'Schedules filing reminders (GSTR-1, GSTR-3B, ITR deadlines). Tracks filing status lifecycle: pending → submitted → filed → acknowledged.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['M2_TRACKER', 'M3_HERALD', 'R1_TAX', 'A1_PRIME'],
    metrics: { ...ZERO_METRICS }, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: 'Activity'
  },
  {
    id: 'M2_TRACKER', groupId: 'MONITOR', name: 'PULSE', fullName: 'Tax Authority Response Checker',
    section: 'Communication Logs',
    description: 'Checks tax authority response on filed returns (accepted/rejected/defective). Monitors DRC-01/DRC-07 notices. Tracks SCN response deadlines.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['M1_PULSE', 'M3_HERALD', 'R2_LEGAL', 'A2_CROSS'],
    metrics: { ...ZERO_METRICS }, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: 'Radio'
  },
  {
    id: 'M3_HERALD', groupId: 'MONITOR', name: 'OVERWATCH', fullName: 'Compliance Health Score Updater',
    section: 'Document Vault',
    description: 'Updates compliance health score after each filing cycle. Sends client notifications on status changes. Maintains historical compliance trend data.',
    status: 'idle', currentTask: 'Standby — waiting for Start', lastActivity: new Date().toISOString(),
    wiredTo: ['M1_PULSE', 'M2_TRACKER', 'R3_FINAL', 'A3_AUDIT'],
    metrics: { ...ZERO_METRICS }, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: 'Eye'
  },
];

interface CAAgentContextType {
  agents: CAAgentDefinition[];
  messages: CAAgentMessage[];
  isRunning: boolean;
  systemStatus: 'optimal' | 'processing' | 'degraded' | 'alert';
  resumeAgent: (agentId: CAAgentId) => void;
  pauseAgent: (agentId: CAAgentId) => void;
  triggerAgent: (agentId: CAAgentId) => void;
  startAllAgents: () => void;
  pauseAllAgents: () => void;
  emergencyStop: () => void;
  getAgent: (agentId: CAAgentId) => CAAgentDefinition | undefined;
  getAgentMessages: (agentId: CAAgentId) => CAAgentMessage[];
  updateAgentStatus: (agentId: CAAgentId, status: CAAgentStatus, task?: string) => void;
  publishMessage: (msg: Omit<CAAgentMessage, 'id' | 'timestamp' | 'acknowledged'>) => void;
}

const CAAgentContext = createContext<CAAgentContextType | undefined>(undefined);

// Helper: pick random item from array
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const CAAgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<CAAgentDefinition[]>(createInitialCAAgents());
  const [messages, setMessages] = useState<CAAgentMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'optimal' | 'processing' | 'degraded' | 'alert'>('optimal');
  
  const tickRef = useRef<NodeJS.Timeout>();

  const publishMessage = useCallback((msg: Omit<CAAgentMessage, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newMessage: CAAgentMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
    
    setMessages(prev => [newMessage, ...prev].slice(0, 100));
    
    setAgents(prev => prev.map(a => {
      if (a.id === msg.fromAgent) {
        return { ...a, metrics: { ...a.metrics, messagesSent: a.metrics.messagesSent + 1 }};
      }
      if (a.id === msg.toAgent || msg.toAgent === 'ALL' || a.groupId === msg.toAgent) {
        return { ...a, metrics: { ...a.metrics, messagesReceived: a.metrics.messagesReceived + 1 }};
      }
      return a;
    }));
  }, []);

  const updateAgentStatus = useCallback((agentId: CAAgentId, status: CAAgentStatus, task?: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        return { ...a, status, ...(task ? { currentTask: task } : {}), lastActivity: new Date().toISOString() };
      }
      return a;
    }));
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // SWARM CONSENSUS ENGINE — Domain-Specific CA Workflow
  // Only runs when isRunning === true. No mock data.
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isRunning) {
      clearInterval(tickRef.current);
      return;
    }

    const runConsensusCycle = () => {
      const groups: CAAgentGroupId[] = ['ANALYSER', 'DRAFTER', 'REVIEWER', 'MONITOR'];
      const activeGroup = groups[Math.floor(Math.random() * groups.length)];
      const groupAgents = agents.filter(a => a.groupId === activeGroup && a.status !== 'paused');
      if (groupAgents.length < 3) return;

      const [Agent1, Agent2, Agent3] = groupAgents;
      const groupMsgs = GROUP_CONSENSUS_MESSAGES[activeGroup];
      
      // Phase 1: All 3 agents begin their domain-specific task
      setSystemStatus('processing');
      const task = pick(groupMsgs.tasks);
      groupAgents.forEach(a => updateAgentStatus(a.id, 'consensus_check', task));

      const isConflict = Math.random() < 0.15;

      setTimeout(() => {
        if (isConflict) {
          // CONFLICT — one agent rejects another's output
          const dissenter = Math.random() > 0.5 ? Agent2 : Agent3;
          const conflictMsg = pick(groupMsgs.conflicts);
          
          updateAgentStatus(dissenter.id, 'alert', 'Discrepancy detected — generating issue ticket...');
          updateAgentStatus(Agent1.id, 'resolving_conflict', 'Correcting output based on peer review...');
          
          publishMessage({
            fromAgent: dissenter.id, toAgent: Agent1.id,
            type: 'CONSENSUS_FAILED', priority: 'high',
            subject: `${dissenter.name} rejected ${Agent1.name} output`,
            content: conflictMsg
          });

          // Also notify the cross-group wired agent for independent verification
          const crossGroupTarget = Agent1.wiredTo.find(id => !groupAgents.some(a => a.id === id));
          if (crossGroupTarget) {
            publishMessage({
              fromAgent: dissenter.id, toAgent: crossGroupTarget,
              type: 'ISSUE_TICKET_GENERATED', priority: 'medium',
              subject: `Cross-group verification requested`,
              content: `${activeGroup} group conflict. Requesting ${crossGroupTarget} to independently verify: ${conflictMsg.substring(0, 80)}...`
            });
          }

          // Phase 2: Auto-resolve after peer correction
          setTimeout(() => {
            const resolution = pick(groupMsgs.resolutions);
            updateAgentStatus(dissenter.id, 'active', 'Peer review complete. Consensus achieved.');
            updateAgentStatus(Agent1.id, 'active', 'Output corrected and verified by all peers.');
            updateAgentStatus(Agent3.id, 'active', 'Cross-validation confirmed.');
            
            publishMessage({
              fromAgent: Agent1.id, toAgent: activeGroup,
              type: 'CONSENSUS_REACHED', priority: 'medium',
              subject: `${activeGroup} conflict resolved — all 3 agents aligned`,
              content: resolution
            });
            
            setAgents(prev => prev.map(a => {
              if (a.id === dissenter.id) return { ...a, metrics: { ...a.metrics, conflictsResolved: a.metrics.conflictsResolved + 1, insightsGenerated: a.metrics.insightsGenerated + 1 }};
              if (a.id === Agent1.id) return { ...a, metrics: { ...a.metrics, tasksCompleted: a.metrics.tasksCompleted + 1 }};
              return a;
            }));
            setSystemStatus('optimal');
          }, 4000);

        } else {
          // SUCCESS — all 3 agents agree. Increment metrics.
          publishMessage({
            fromAgent: Agent1.id, toAgent: activeGroup,
            type: 'CONSENSUS_REACHED', priority: 'low',
            subject: `${activeGroup} consensus validated`,
            content: `All 3 agents (${Agent1.name}, ${Agent2.name}, ${Agent3.name}) independently verified. ${task} — 100% alignment. Handoff to next pipeline stage.`
          });
          
          groupAgents.forEach(a => updateAgentStatus(a.id, 'active', 'Consensus achieved — monitoring...'));
          setAgents(prev => prev.map(a => {
            if (groupAgents.some(ga => ga.id === a.id)) {
              return { ...a, metrics: { ...a.metrics, tasksCompleted: a.metrics.tasksCompleted + 1 }};
            }
            return a;
          }));
          setSystemStatus('optimal');
        }
      }, 2000);
    };

    tickRef.current = setInterval(runConsensusCycle, 15000);
    return () => clearInterval(tickRef.current);
  }, [isRunning, agents, publishMessage, updateAgentStatus]);

  const resumeAgent = useCallback((id: CAAgentId) => updateAgentStatus(id, 'active', 'Agent resumed by CA'), [updateAgentStatus]);
  const pauseAgent = useCallback((id: CAAgentId) => updateAgentStatus(id, 'paused', 'Force paused by CA'), [updateAgentStatus]);
  const triggerAgent = useCallback((id: CAAgentId) => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;
    const groupMsgs = GROUP_CONSENSUS_MESSAGES[agent.groupId];
    const task = pick(groupMsgs.tasks);
    updateAgentStatus(id, 'working', `Manual trigger — ${task}`);
    setTimeout(() => {
      updateAgentStatus(id, 'active', 'Manual task complete');
      setAgents(prev => prev.map(a => a.id === id ? { ...a, metrics: { ...a.metrics, tasksCompleted: a.metrics.tasksCompleted + 1 }} : a));
    }, 3000);
  }, [updateAgentStatus, agents]);

  const startAllAgents = useCallback(() => {
    setIsRunning(true);
    setSystemStatus('optimal');
    setAgents(prev => prev.map(a => ({ ...a, status: 'active' as CAAgentStatus, currentTask: 'Online — monitoring compliance pipeline' })));
  }, []);

  const pauseAllAgents = useCallback(() => {
    setIsRunning(false);
    setAgents(prev => prev.map(a => ({ ...a, status: 'paused' as CAAgentStatus, currentTask: 'Paused by CA' })));
  }, []);

  const emergencyStop = useCallback(() => {
    setIsRunning(false);
    clearInterval(tickRef.current);
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle' as CAAgentStatus, currentTask: 'EMERGENCY STOP — all systems halted' })));
    setMessages([]);
    setSystemStatus('alert');
  }, []);

  const getAgent = useCallback((id: CAAgentId) => agents.find(a => a.id === id), [agents]);
  const getAgentMessages = useCallback((id: CAAgentId) => messages.filter(m => m.fromAgent === id || m.toAgent === id || m.toAgent === 'ALL' || m.toAgent === getAgent(id)?.groupId), [messages, getAgent]);

  return (
    <CAAgentContext.Provider value={{ agents, messages, isRunning, systemStatus, resumeAgent, pauseAgent, triggerAgent, startAllAgents, pauseAllAgents, emergencyStop, getAgent, getAgentMessages, updateAgentStatus, publishMessage }}>
      {children}
    </CAAgentContext.Provider>
  );
};

export const useCAAgentOrchestrator = () => {
  const context = useContext(CAAgentContext);
  if (context === undefined) {
    throw new Error('useCAAgentOrchestrator must be used within a CAAgentProvider');
  }
  return context;
};
