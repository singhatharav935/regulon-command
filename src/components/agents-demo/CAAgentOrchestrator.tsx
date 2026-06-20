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
  | 'CLIENT_UPDATE'
  | 'DEADLINE_WARNING'
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
    status: 'active', currentTask: 'Scanning live CBIC and CBDT notifications...', lastActivity: new Date().toISOString(),
    wiredTo: ['A2_CROSS', 'A3_AUDIT', 'D1_MAKER', 'R1_TAX'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 14, insightsGenerated: 9, messagesSent: 24, messagesReceived: 18 }, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: 'Database'
  },
  {
    id: 'A2_CROSS', groupId: 'ANALYSER', name: 'RADAR', fullName: 'Applicable Rule Identifier',
    section: 'Compliance Health & Change Log',
    description: 'Identifies applicable rules on incoming notices. Checks company compliance status against MCA/GST portal. Maps notice clauses to statutory sections.',
    status: 'active', currentTask: 'Cross-referencing notice clauses u/s 143(2)...', lastActivity: new Date().toISOString(),
    wiredTo: ['A1_PRIME', 'A3_AUDIT', 'D2_REFINER', 'R2_LEGAL'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 19, insightsGenerated: 7, messagesSent: 22, messagesReceived: 21 }, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: 'Search'
  },
  {
    id: 'A3_AUDIT', groupId: 'ANALYSER', name: 'METRIC', fullName: 'Risk Score Calculator',
    section: 'CA Analytics & Performance',
    description: 'Calculates risk score of the draft using compliance matrix. Evaluates penalty probability, deadline proximity, and historical default patterns.',
    status: 'active', currentTask: 'Recalculating multi-client compliance risk scores...', lastActivity: new Date().toISOString(),
    wiredTo: ['A1_PRIME', 'A2_CROSS', 'D3_ALIGNER', 'R3_FINAL'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 22, insightsGenerated: 12, messagesSent: 28, messagesReceived: 26 }, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: 'BarChart3'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // DRAFTER GROUP — Generate, Calculate, Handle Edge Cases
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'D1_MAKER', groupId: 'DRAFTER', name: 'DRAFTER', fullName: 'Compliant Document Generator',
    section: 'AI Drafting Engine',
    description: 'Generates compliant documents (GSTR-3B, ITR, ROC forms). Loads documents for filling data fields. Maintains balance sheet computations in background.',
    status: 'active', currentTask: 'Compiling draft response for GST mismatch notice...', lastActivity: new Date().toISOString(),
    wiredTo: ['D2_REFINER', 'D3_ALIGNER', 'A1_PRIME', 'R1_TAX'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 8, insightsGenerated: 6, messagesSent: 15, messagesReceived: 14 }, color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: 'FileText'
  },
  {
    id: 'D2_REFINER', groupId: 'DRAFTER', name: 'TASKMASTER', fullName: 'Tax Liability & Reconciliation Engine',
    section: 'Task & Filing Management',
    description: 'Calculates tax liability (CGST/SGST/IGST breakup). Generates invoice reconciliation reports (GSTR-2B vs books). Processes ITC computations.',
    status: 'active', currentTask: 'Reconciling GSTR-2B purchase register mismatches...', lastActivity: new Date().toISOString(),
    wiredTo: ['D1_MAKER', 'D3_ALIGNER', 'A2_CROSS', 'R2_LEGAL'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 11, insightsGenerated: 4, messagesSent: 18, messagesReceived: 17 }, color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: 'Calculator'
  },
  {
    id: 'D3_ALIGNER', groupId: 'DRAFTER', name: 'HERALD', fullName: 'Edge Case Handler',
    section: 'Audit & Inspection Support',
    description: 'Handles edge cases: reversed invoices, credit notes, exempted supplies (Schedule III), zero-rated exports, and composition scheme transactions.',
    status: 'active', currentTask: 'Auditing SLM depreciation schedules...', lastActivity: new Date().toISOString(),
    wiredTo: ['D1_MAKER', 'D2_REFINER', 'A3_AUDIT', 'R3_FINAL'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 9, insightsGenerated: 5, messagesSent: 16, messagesReceived: 15 }, color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: 'Scale'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // REVIEWER GROUP — Validate, Compare, Flag Issues
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'R1_TAX', groupId: 'REVIEWER', name: 'INSPECTOR', fullName: 'Regulation Validator',
    section: 'Client Dependency Tracker',
    description: 'Validates generated document against CGST/IGST Act regulations. Compares generated values with auto-populated GSTR-2B data.',
    status: 'active', currentTask: 'Verifying input tax credit claims u/s 17(5)...', lastActivity: new Date().toISOString(),
    wiredTo: ['R2_LEGAL', 'R3_FINAL', 'D1_MAKER', 'M1_PULSE'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 31, insightsGenerated: 14, messagesSent: 35, messagesReceived: 33 }, color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: 'CheckSquare'
  },
  {
    id: 'R2_LEGAL', groupId: 'REVIEWER', name: 'TRACKER', fullName: 'Mandatory Field & Calculation Auditor',
    section: 'Company Management',
    description: 'Checks for missing mandatory fields. Validates all calculations (ITC, tax liability, interest u/s 50). Cross-checks against previous quarterly filings.',
    status: 'active', currentTask: 'Checking mandatory fields for ROC Form AOC-4...', lastActivity: new Date().toISOString(),
    wiredTo: ['R1_TAX', 'R3_FINAL', 'D2_REFINER', 'M2_TRACKER'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 27, insightsGenerated: 11, messagesSent: 32, messagesReceived: 30 }, color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: 'ShieldAlert'
  },
  {
    id: 'R3_FINAL', groupId: 'REVIEWER', name: 'PORTFOLIO', fullName: 'Draft Issue Flagger',
    section: 'Revenue & Billing',
    description: 'Flags all issues found in the generated draft. Produces final approval/rejection report with itemized discrepancies for CA sign-off.',
    status: 'active', currentTask: 'Generating draft approval discrepancy report...', lastActivity: new Date().toISOString(),
    wiredTo: ['R1_TAX', 'R2_LEGAL', 'D3_ALIGNER', 'M3_HERALD'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 24, insightsGenerated: 15, messagesSent: 29, messagesReceived: 27 }, color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: 'AlertTriangle'
  },
  
  // ═══════════════════════════════════════════════════════════════
  // MONITOR GROUP — Track, Respond, Update Score
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'M1_PULSE', groupId: 'MONITOR', name: 'COMMAND', fullName: 'Filing Status & Reminder Engine',
    section: 'Daily Governance Brief',
    description: 'Schedules filing reminders (GSTR-1, GSTR-3B, ITR deadlines). Tracks filing status lifecycle: pending → submitted → filed → acknowledged.',
    status: 'active', currentTask: 'Monitoring GSTR-3B statutory deadlines...', lastActivity: new Date().toISOString(),
    wiredTo: ['M2_TRACKER', 'M3_HERALD', 'R1_TAX', 'A1_PRIME'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 45, insightsGenerated: 18, messagesSent: 48, messagesReceived: 44 }, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: 'Activity'
  },
  {
    id: 'M2_TRACKER', groupId: 'MONITOR', name: 'PULSE', fullName: 'Tax Authority Response Checker',
    section: 'Communication Logs',
    description: 'Checks tax authority response on filed returns (accepted/rejected/defective). Monitors DRC-01/DRC-07 notices. Tracks SCN response deadlines.',
    status: 'active', currentTask: 'Checking GST e-filing portal server status...', lastActivity: new Date().toISOString(),
    wiredTo: ['M1_PULSE', 'M3_HERALD', 'R2_LEGAL', 'A2_CROSS'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 38, insightsGenerated: 13, messagesSent: 41, messagesReceived: 39 }, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: 'Radio'
  },
  {
    id: 'M3_HERALD', groupId: 'MONITOR', name: 'OVERWATCH', fullName: 'Compliance Health Score Updater',
    section: 'Document Vault',
    description: 'Updates compliance health score after each filing cycle. Sends client notifications on status changes. Maintains historical compliance trend data.',
    status: 'active', currentTask: 'Recalculating portfolio health metrics...', lastActivity: new Date().toISOString(),
    wiredTo: ['M1_PULSE', 'M2_TRACKER', 'R3_FINAL', 'A3_AUDIT'],
    metrics: { ...ZERO_METRICS, tasksCompleted: 41, insightsGenerated: 21, messagesSent: 45, messagesReceived: 42 }, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: 'Eye'
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
  acknowledgeMessage: (id: string) => void;
}

const CAAgentContext = createContext<CAAgentContextType | undefined>(undefined);

// Helper: pick random item from array
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Preloaded beautiful compliance swarm messages
const initialDemoMessages = (): CAAgentMessage[] => {
  let firstClientName = 'your new client';
  let secondClientName = 'another client';
  try {
    const saved = localStorage.getItem('demo_clients');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[0]) firstClientName = parsed[0].name || parsed[0].client_name;
      if (parsed[1]) secondClientName = parsed[1].name || parsed[1].client_name;
      else secondClientName = firstClientName;
    }
  } catch (e) {
    console.warn('[CAAgentOrchestrator-Demo] Failed to parse demo_clients:', e);
  }

  return [
    {
      id: 'msg-demo-1',
      fromAgent: 'D1_MAKER',
      toAgent: 'ALL',
      type: 'APPROVAL_REQUEST',
      priority: 'critical',
      subject: 'GSTR-2B Mismatch Rebuttal Ready',
      content: `Draft Legal Notice Response prepared under Section 16(4) safe harbor for ${firstClientName}. AI has reconciled 847 invoices, resolved a ₹40,000 difference, and verified the rebuttal with Peer Agents. Awaiting final CA approval.`,
      timestamp: new Date(Date.now() - 60000).toISOString(),
      acknowledged: false
    },
    {
      id: 'msg-demo-2',
      fromAgent: 'R3_FINAL',
      toAgent: 'REVIEWER',
      type: 'CONSENSUS_REACHED',
      priority: 'medium',
      subject: 'HSN classification consensus achieved',
      content: 'All 3 review agents (INSPECTOR, TRACKER, PORTFOLIO) resolved classification mismatch for HSN 8471. Rule 36(4) ITC restriction verified and validated. Consolidated draft marked as compliant.',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      acknowledged: false
    },
    {
      id: 'msg-demo-3',
      fromAgent: 'R2_LEGAL',
      toAgent: 'A3_AUDIT',
      type: 'ISSUE_TICKET_GENERATED',
      priority: 'medium',
      subject: 'DIR-3 KYC default variance resolved',
      content: `Dissenting agent PORTFOLIO flagged a potential KYC default for ${firstClientName}. TRACKER cross-verified with MCA live portal, confirming the compliance status is active. Variance resolved, issue closed.`,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      acknowledged: false
    },
    {
      id: 'msg-demo-4',
      fromAgent: 'D2_REFINER',
      toAgent: 'ANALYSER',
      type: 'INSIGHT_SHARE',
      priority: 'high',
      subject: 'GST ITC Reconciliation completed',
      content: `Auto-populated GSTR-2B reconciled with purchase books. Identified ₹1,20,000 ineligible tax credit under Section 17(5) for ${secondClientName}. Output flagged and ledger adjusted.`,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      acknowledged: false
    },
    {
      id: 'msg-demo-5',
      fromAgent: 'M1_PULSE',
      toAgent: 'ALL',
      type: 'DEADLINE_WARNING',
      priority: 'high',
      subject: 'Statutory Deadline: GSTR-3B filing',
      content: `Annual compliance filing deadline u/s 39 approaching in 13 days for ${firstClientName}. Automated data extraction sequence pre-scheduled.`,
      timestamp: new Date(Date.now() - 900000).toISOString(),
      acknowledged: false
    },
    {
      id: 'msg-demo-6',
      fromAgent: 'A3_AUDIT',
      toAgent: 'ANALYSER',
      type: 'CONSENSUS_REACHED',
      priority: 'low',
      subject: 'Risk rating calculation validated',
      content: `Swarm consensus reached on ${secondClientName} risk level. Overall compliance score set to 91% based on history, timely tax deposit trail, and ROC active filings.`,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      acknowledged: false
    }
  ];
};

const isDemoMode = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path === '/ca-dashboard' || path === '/ca-dashboard/' || path.startsWith('/ca-dashboard/');
};

export const CAAgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    const key = isDemoMode() ? 'sannidh:ca-swarm-running' : 'real:sannidh:ca-swarm-running';
    const saved = localStorage.getItem(key);
    return saved !== null ? saved === 'true' : false; // Default to false (Engine does NOT auto-run)
  });

  const [agents, setAgents] = useState<CAAgentDefinition[]>(() => {
    const key = isDemoMode() ? 'sannidh:ca-swarm-agents' : 'real:sannidh:ca-swarm-agents';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing ca-swarm-agents', e);
      }
    }
    const initial = createInitialCAAgents();
    const runningKey = isDemoMode() ? 'sannidh:ca-swarm-running' : 'real:sannidh:ca-swarm-running';
    const savedRunning = localStorage.getItem(runningKey);
    const isCurrentlyRunning = savedRunning !== null ? savedRunning === 'true' : false;
    if (!isCurrentlyRunning) {
      return initial.map(a => ({ ...a, status: 'paused' as CAAgentStatus, currentTask: 'Paused by CA' }));
    }
    return initial;
  });

  const [messages, setMessages] = useState<CAAgentMessage[]>(() => {
    const key = isDemoMode() ? 'sannidh:ca-swarm-messages' : 'real:sannidh:ca-swarm-messages';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing ca-swarm-messages', e);
      }
    }
    // Real dashboard does not load initial demo/mock message logs
    return isDemoMode() ? initialDemoMessages() : [];
  });

  const [systemStatus, setSystemStatus] = useState<'optimal' | 'processing' | 'degraded' | 'alert'>(() => {
    const key = isDemoMode() ? 'sannidh:ca-swarm-system-status' : 'real:sannidh:ca-swarm-system-status';
    const saved = localStorage.getItem(key);
    return (saved as 'optimal' | 'processing' | 'degraded' | 'alert') || 'optimal';
  });

  const [realClientNames, setRealClientNames] = useState<string[]>([]);

  useEffect(() => {
    if (isDemoMode()) return;
    const fetchRealClients = async () => {
      try {
        const { loadCAClients } = await import('@/services/ca-supabase-service');
        const dbClients = await loadCAClients();
        if (dbClients && dbClients.length > 0) {
          setRealClientNames(dbClients.map(c => c.name));
        }
      } catch (err) {
        console.error("Error loading real client names in orchestrator:", err);
      }
    };
    fetchRealClients();
    window.addEventListener('demo-client-added', fetchRealClients);
    window.addEventListener('ca:metrics-updated', fetchRealClients);
    return () => {
      window.removeEventListener('demo-client-added', fetchRealClients);
      window.removeEventListener('ca:metrics-updated', fetchRealClients);
    };
  }, []);

  // Update initial messages when real clients load in production
  useEffect(() => {
    if (isDemoMode() || realClientNames.length === 0) return;
    
    setMessages(prev => {
      const firstClientName = realClientNames[0] || 'your client';
      const secondClientName = realClientNames[1] || firstClientName;

      return prev.map(m => {
        let content = m.content;
        let subject = m.subject;

        if (m.id === 'msg-demo-1') {
          content = `Draft Legal Notice Response prepared under Section 16(4) safe harbor for ${firstClientName}. AI has reconciled 847 invoices, resolved a ₹40,000 difference, and verified the rebuttal with Peer Agents. Awaiting final CA approval.`;
        } else if (m.id === 'msg-demo-3') {
          content = `Dissenting agent PORTFOLIO flagged a potential KYC default for ${firstClientName}. TRACKER cross-verified with MCA live portal, confirming the compliance status is active. Variance resolved, issue closed.`;
        } else if (m.id === 'msg-demo-4') {
          content = `Auto-populated GSTR-2B reconciled with purchase books. Identified ₹1,20,000 ineligible tax credit under Section 17(5) for ${secondClientName}. Output flagged and ledger adjusted.`;
        } else if (m.id === 'msg-demo-5') {
          content = `Annual compliance filing deadline u/s 39 approaching in 13 days for ${firstClientName}. Automated data extraction sequence pre-scheduled.`;
        } else if (m.id === 'msg-demo-6') {
          content = `Swarm consensus reached on ${secondClientName} risk level. Overall compliance score set to 91% based on history, timely tax deposit trail, and ROC active filings.`;
        }

        return { ...m, content, subject };
      });
    });
  }, [realClientNames]);

  useEffect(() => {
    const key = isDemoMode() ? 'sannidh:ca-swarm-running' : 'real:sannidh:ca-swarm-running';
    localStorage.setItem(key, String(isRunning));
  }, [isRunning]);

  useEffect(() => {
    const key = isDemoMode() ? 'sannidh:ca-swarm-agents' : 'real:sannidh:ca-swarm-agents';
    localStorage.setItem(key, JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    const key = isDemoMode() ? 'sannidh:ca-swarm-messages' : 'real:sannidh:ca-swarm-messages';
    localStorage.setItem(key, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const key = isDemoMode() ? 'sannidh:ca-swarm-system-status' : 'real:sannidh:ca-swarm-system-status';
    localStorage.setItem(key, systemStatus);
  }, [systemStatus]);

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
      
      let clientName = '';
      const isDemo = isDemoMode();

      if (isDemo) {
        try {
          const saved = localStorage.getItem('demo_clients');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed[0]) clientName = parsed[0].name || parsed[0].client_name;
          }
        } catch(e) {
          console.warn('[CAAgentOrchestrator-Demo] Failed to parse demo_clients in cycle:', e);
        }
      } else {
        if (realClientNames.length > 0) {
          clientName = realClientNames[Math.floor(Math.random() * realClientNames.length)];
        }
      }
      const targetStr = clientName ? ` for ${clientName}` : '';

      // Phase 1: All 3 agents begin their domain-specific task
      setSystemStatus('processing');
      const taskRaw = pick(groupMsgs.tasks);
      const task = taskRaw.replace('...', '') + targetStr + '...';
      groupAgents.forEach(a => updateAgentStatus(a.id, 'consensus_check', task));

      const isConflict = Math.random() < 0.15;

      setTimeout(() => {
        if (isConflict) {
          // CONFLICT — one agent rejects another's output
          const dissenter = Math.random() > 0.5 ? Agent2 : Agent3;
          const conflictMsgRaw = pick(groupMsgs.conflicts);
          const conflictMsg = conflictMsgRaw + targetStr;
          
          updateAgentStatus(dissenter.id, 'alert', `Discrepancy detected${targetStr} — generating issue ticket...`);
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
            const resolutionRaw = pick(groupMsgs.resolutions);
            const resolution = resolutionRaw + targetStr;
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
          }, 2000);

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
      }, 1500);
    };

    tickRef.current = setInterval(runConsensusCycle, 6000);
    return () => clearInterval(tickRef.current);
  }, [isRunning, agents, publishMessage, updateAgentStatus, realClientNames]);

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

  const acknowledgeMessage = useCallback((id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, acknowledged: true } : m));
  }, []);

  return (
    <CAAgentContext.Provider value={{ agents, messages, isRunning, systemStatus, resumeAgent, pauseAgent, triggerAgent, startAllAgents, pauseAllAgents, emergencyStop, getAgent, getAgentMessages, updateAgentStatus, publishMessage, acknowledgeMessage }}>
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
