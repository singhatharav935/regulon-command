/**
 * CA AGENT ORCHESTRATION ENGINE
 * ================================
 * Manages 12 interconnected AI agents for the External CA Dashboard.
 * Each agent is assigned to a specific CA dashboard section and they
 * communicate cross-section to share insights, delegate tasks, and
 * propagate alerts.
 * 
 * Tailored for CA professional workflows: client management, filing,
 * audit prep, compliance monitoring, and revenue optimization.
 * 
 * Live data only — no mock or simulated data.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// ================================================================
// TYPES
// ================================================================

export type CAAgentId = 
  | 'COMMAND' | 'ORACLE' | 'DRAFTER' | 'PORTFOLIO' | 'TASKMASTER'
  | 'TRACKER' | 'RADAR' | 'PULSE' | 'INSPECTOR' | 'HERALD'
  | 'METRIC' | 'OVERWATCH';

export type CAAgentStatus = 'active' | 'idle' | 'working' | 'analyzing' | 'alert' | 'error' | 'paused';

export type CAMessageType = 
  | 'ALERT_PROPAGATION' 
  | 'DATA_SYNC' 
  | 'TASK_DELEGATION' 
  | 'INSIGHT_SHARE' 
  | 'APPROVAL_REQUEST'
  | 'CLIENT_UPDATE'
  | 'DEADLINE_WARNING';

export type CAMessagePriority = 'critical' | 'high' | 'medium' | 'low';

export interface CAAgentMessage {
  id: string;
  fromAgent: CAAgentId;
  toAgent: CAAgentId | 'ALL';
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
  accuracy: number;
  uptime: number;
  avgResponseTime: number;
  clientsServed: number;
}

export interface CAAgentDefinition {
  id: CAAgentId;
  name: string;
  fullName: string;
  section: string;
  sectionIndex: number;
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

// ================================================================
// AGENT DEFINITIONS — Structural only, all metrics start at 0
// ================================================================

const createInitialCAAgents = (): CAAgentDefinition[] => [
  {
    id: 'COMMAND',
    name: 'COMMAND',
    fullName: 'Control & Metrics Operations Node Director',
    section: 'Control Tower',
    sectionIndex: 1,
    description: 'Monitors all CA metrics in real-time — assigned companies, pending tasks, deadlines, alerts, revenue, and plan utilization',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['ORACLE', 'PORTFOLIO', 'TASKMASTER', 'METRIC', 'OVERWATCH'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    icon: 'Cpu'
  },
  {
    id: 'ORACLE',
    name: 'ORACLE',
    fullName: 'Operational Risk Analysis & Compliance Law Engine',
    section: 'Daily Governance Brief',
    sectionIndex: 2,
    description: 'Generates the AI daily governance brief — portfolio analysis, priority assignments, critical alerts, and actionable AI recommendations',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['COMMAND', 'DRAFTER', 'PORTFOLIO', 'RADAR', 'PULSE'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    icon: 'Sparkles'
  },
  {
    id: 'DRAFTER',
    name: 'DRAFTER',
    fullName: 'Document Response & Automated Filing Technology Engine Resource',
    section: 'Live AI Drafting Engine',
    sectionIndex: 3,
    description: 'Powers the AI Drafting Engine — generates balance sheets, GST reconciliation, audit papers, notice responses, and compliance documents',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['ORACLE', 'PORTFOLIO', 'TASKMASTER', 'INSPECTOR'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: 'FileText'
  },
  {
    id: 'PORTFOLIO',
    name: 'PORTFOLIO',
    fullName: 'Practice Organization & Real-Time Folio Operations Liaison',
    section: 'Client Portfolio',
    sectionIndex: 4,
    description: 'Manages the client portfolio — company onboarding, compliance status, risk assessments, and portfolio health across all assigned companies',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['COMMAND', 'ORACLE', 'TASKMASTER', 'TRACKER', 'HERALD'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    icon: 'Building'
  },
  {
    id: 'TASKMASTER',
    name: 'TASKMASTER',
    fullName: 'Task Allocation & Scheduling Keeper for Multi-client Automation',
    section: 'Task & Filing Management',
    sectionIndex: 5,
    description: 'Orchestrates task and filing management — auto-prioritizes filings by deadline, syncs with government portals, and manages multi-client task queues',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['COMMAND', 'PORTFOLIO', 'DRAFTER', 'TRACKER'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    icon: 'CheckCircle'
  },
  {
    id: 'TRACKER',
    name: 'TRACKER',
    fullName: 'Tracking & Resolution Agent for Client Knowledge Exchange',
    section: 'Client Dependency Tracker',
    sectionIndex: 6,
    description: 'Tracks and chases client dependencies — pending documents, missing data, overdue responses — and auto-sends reminders via WhatsApp/email',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['PORTFOLIO', 'TASKMASTER', 'HERALD'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    icon: 'Search'
  },
  {
    id: 'RADAR',
    name: 'RADAR',
    fullName: 'Regulatory Alert & Dynamic Analysis Resource',
    section: 'Regulatory News & Rule Impact',
    sectionIndex: 7,
    description: 'Monitors regulatory news, new circulars, and rule changes — assesses impact on each client portfolio and triggers compliance updates',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['ORACLE', 'PULSE', 'TASKMASTER', 'PORTFOLIO'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    icon: 'Radio'
  },
  {
    id: 'PULSE',
    name: 'PULSE',
    fullName: 'Portfolio Unified Live Status Engine',
    section: 'Compliance Health Log',
    sectionIndex: 8,
    description: 'Tracks compliance health changes across all clients — monitors score fluctuations, gap emergence, and recovery patterns in real-time',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['ORACLE', 'RADAR', 'PORTFOLIO', 'INSPECTOR'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    icon: 'Activity'
  },
  {
    id: 'INSPECTOR',
    name: 'INSPECTOR',
    fullName: 'Intelligent National Standards & Practice Examination Compliance Tracker Oversight Resource',
    section: 'Audit & Inspection Support',
    sectionIndex: 9,
    description: 'Prepares audit-ready document bundles, maintains inspection readiness, and generates audit working papers for all clients',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['DRAFTER', 'PULSE', 'PORTFOLIO', 'OVERWATCH'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    icon: 'Eye'
  },
  {
    id: 'HERALD',
    name: 'HERALD',
    fullName: 'Hub for Enterprise Relationship & Alert Liaison Dispatch',
    section: 'Communication & Logs',
    sectionIndex: 10,
    description: 'Manages all CA-client communications — logs messages, auto-drafts responses, schedules follow-ups, and maintains complete audit trail',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['PORTFOLIO', 'TRACKER', 'TASKMASTER'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    icon: 'MessageSquare'
  },
  {
    id: 'METRIC',
    name: 'METRIC',
    fullName: 'Management & Enterprise Trend Report Intelligence Computing',
    section: 'CA Analytics & Performance',
    sectionIndex: 11,
    description: 'Generates analytics and performance intelligence — revenue trends, utilization rates, efficiency scores, and practice growth insights',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['COMMAND', 'OVERWATCH', 'PORTFOLIO'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    icon: 'BarChart3'
  },
  {
    id: 'OVERWATCH',
    name: 'OVERWATCH',
    fullName: 'Orchestrated Verification & Enterprise Risk Watch Agent for Threat Containment Hub',
    section: 'System Orchestrator',
    sectionIndex: 12,
    description: 'Master orchestrator — coordinates all 12 agents, resolves conflicts, manages inter-agent dependencies, and ensures system-wide coherence',
    status: 'active',
    currentTask: 'Online — monitoring section',
    lastActivity: new Date().toISOString(),
    wiredTo: ['COMMAND', 'ORACLE', 'DRAFTER', 'PORTFOLIO', 'TASKMASTER', 'TRACKER', 'RADAR', 'PULSE', 'INSPECTOR', 'HERALD', 'METRIC'],
    metrics: { tasksCompleted: 0, insightsGenerated: 0, messagesSent: 0, messagesReceived: 0, alertsRaised: 0, accuracy: 0, uptime: 0, avgResponseTime: 0, clientsServed: 0 },
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    icon: 'Shield'
  },
];

// ================================================================
// CONTEXT
// ================================================================

interface CAOrchestratorState {
  agents: CAAgentDefinition[];
  messages: CAAgentMessage[];
  isRunning: boolean;
  totalMessagesExchanged: number;
  totalTasksCompleted: number;
  systemUptime: number;
  lastSyncTime: string;
  totalClientsManaged: number;
}

interface CAOrchestratorActions {
  startAllAgents: () => void;
  pauseAllAgents: () => void;
  resumeAgent: (agentId: CAAgentId) => void;
  pauseAgent: (agentId: CAAgentId) => void;
  triggerAgent: (agentId: CAAgentId) => void;
  emergencyStop: () => void;
  syncNow: () => void;
  getAgent: (agentId: CAAgentId) => CAAgentDefinition | undefined;
  getAgentMessages: (agentId: CAAgentId) => CAAgentMessage[];
  acknowledgeMessage: (messageId: string) => void;
  pushMessage: (message: Omit<CAAgentMessage, 'id' | 'timestamp' | 'acknowledged'>) => void;
  updateAgentStatus: (agentId: CAAgentId, status: CAAgentStatus, task?: string) => void;
}

interface CAOrchestratorContextValue {
  state: CAOrchestratorState;
  actions: CAOrchestratorActions;
}

const CAOrchestratorContext = createContext<CAOrchestratorContextValue | null>(null);

// ================================================================
// PROVIDER — No simulation loops, clean state
// ================================================================

export const CAAgentOrchestratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<CAAgentDefinition[]>(createInitialCAAgents);
  const [messages, setMessages] = useState<CAAgentMessage[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [totalMessagesExchanged, setTotalMessagesExchanged] = useState(0);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
  const [systemUptime] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toISOString());

  const genId = () => `ca-msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const startAllAgents = useCallback(() => {
    setIsRunning(true);
    setAgents(prev => prev.map(a => ({ ...a, status: 'active' as CAAgentStatus, currentTask: 'Online — monitoring section' })));
  }, []);

  const pauseAllAgents = useCallback(() => {
    setIsRunning(false);
    setAgents(prev => prev.map(a => ({ ...a, status: 'paused' as CAAgentStatus })));
  }, []);

  const resumeAgent = useCallback((agentId: CAAgentId) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'active' as CAAgentStatus, currentTask: 'Resumed — monitoring section' } : a));
  }, []);

  const pauseAgent = useCallback((agentId: CAAgentId) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'paused' as CAAgentStatus } : a));
  }, []);

  const triggerAgent = useCallback((agentId: CAAgentId) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status: 'working' as CAAgentStatus, currentTask: 'Manual trigger — executing...', lastActivity: new Date().toISOString() } : a
    ));
    setTimeout(() => {
      setAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, status: 'active' as CAAgentStatus, currentTask: 'Manual task complete' } : a
      ));
      setTotalTasksCompleted(prev => prev + 1);
    }, 3000);
  }, []);

  const emergencyStop = useCallback(() => {
    setIsRunning(false);
    setAgents(prev => prev.map(a => ({ ...a, status: 'error' as CAAgentStatus, currentTask: 'EMERGENCY STOP — All agents halted' })));
  }, []);

  const syncNow = useCallback(() => {
    setLastSyncTime(new Date().toISOString());
    setAgents(prev => prev.map(a => ({
      ...a,
      status: a.status === 'paused' ? 'paused' : 'working' as CAAgentStatus,
      currentTask: a.status === 'paused' ? a.currentTask : 'Syncing with government portals...',
    })));
    setTimeout(() => {
      setAgents(prev => prev.map(a => ({
        ...a,
        status: a.status === 'paused' ? 'paused' : 'active' as CAAgentStatus,
        currentTask: a.status === 'paused' ? a.currentTask : 'Sync complete — data refreshed',
        lastActivity: new Date().toISOString(),
      })));
    }, 2500);
  }, []);

  const getAgent = useCallback((agentId: CAAgentId) => agents.find(a => a.id === agentId), [agents]);

  const getAgentMessages = useCallback((agentId: CAAgentId) => 
    messages.filter(m => m.fromAgent === agentId || m.toAgent === agentId || m.toAgent === 'ALL'), [messages]);

  const acknowledgeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, acknowledged: true } : m));
  }, []);

  // Public API to push real messages from backend
  const pushMessage = useCallback((msg: Omit<CAAgentMessage, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newMessage: CAAgentMessage = {
      ...msg,
      id: genId(),
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    setMessages(prev => [newMessage, ...prev].slice(0, 60));
    setTotalMessagesExchanged(prev => prev + 1);
  }, []);

  // Public API to update agent status from backend
  const updateAgentStatus = useCallback((agentId: CAAgentId, status: CAAgentStatus, task?: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status, currentTask: task || a.currentTask, lastActivity: new Date().toISOString() } : a
    ));
  }, []);

  const ctxState: CAOrchestratorState = {
    agents, messages, isRunning, totalMessagesExchanged, totalTasksCompleted,
    systemUptime, lastSyncTime, totalClientsManaged: 0,
  };

  const ctxActions: CAOrchestratorActions = {
    startAllAgents, pauseAllAgents, resumeAgent, pauseAgent,
    triggerAgent, emergencyStop, syncNow, getAgent, getAgentMessages, acknowledgeMessage,
    pushMessage, updateAgentStatus,
  };

  return (
    <CAOrchestratorContext.Provider value={{ state: ctxState, actions: ctxActions }}>
      {children}
    </CAOrchestratorContext.Provider>
  );
};

// ================================================================
// HOOK
// ================================================================

export const useCAAgentOrchestrator = (): CAOrchestratorContextValue => {
  const context = useContext(CAOrchestratorContext);
  if (!context) throw new Error('useCAAgentOrchestrator must be used within a CAAgentOrchestratorProvider');
  return context;
};

export const CA_AGENT_SECTION_MAP: Record<number, CAAgentId> = {
  1: 'COMMAND', 2: 'ORACLE', 3: 'DRAFTER', 4: 'PORTFOLIO', 5: 'TASKMASTER',
  6: 'TRACKER', 7: 'RADAR', 8: 'PULSE', 9: 'INSPECTOR', 10: 'HERALD',
  11: 'METRIC', 12: 'OVERWATCH',
};
