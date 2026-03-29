import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Zap,
  Clock,
  TrendingUp,
  Briefcase,
  BarChart3,
  FileCheck,
} from 'lucide-react';

/**
 * AI Agent System for REGULON
 * 4 Specialized AI Agents with different roles for CA and other dashboards
 * 
 * 1. The Ingestor - Data Entry & Sorting (OCR + Entity Extraction)
 * 2. The Matchmaker - Reconciliation (Purchase Register vs GSTR-2B/Bank)
 * 3. The Architect - Balance Sheet & Journal Entries (Double Entry Bookkeeping)
 * 4. The Sentinel - Compliance & Filing (Deadline tracking, Return preparation)
 */

interface AIAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: React.ReactNode;
  status: 'idle' | 'working' | 'completed' | 'needs_approval';
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
  color: string;
  actions: AgentAction[];
}

interface AgentAction {
  id: string;
  timestamp: string;
  description: string;
  type: 'extraction' | 'reconciliation' | 'generation' | 'compliance';
  status: 'completed' | 'in_progress' | 'pending_approval';
}

// ============================================================================
// THE INGESTOR - Data Entry & Sorting Agent
// ============================================================================

export const TheIngestor = {
  id: 'ingestor',
  name: 'The Ingestor',
  role: 'Data Entry & Sorting',
  description: 'Watches emails, WhatsApp, and Google Drive. Extracts data from invoices, bank statements, and bills using OCR + Entity Extraction. Validates if GSTIN is real.',
  icon: <Upload className="w-6 h-6" />,
  manualTaskReplaced: 'Manual Data Entry & Document Sorting',
  capabilities: [
    'Email monitoring (Gmail, Outlook)',
    'WhatsApp document extraction',
    'Google Drive integration',
    'OCR-based invoice reading',
    'GSTIN validation with real-time verification',
    'Bank statement parsing',
    'Bill categorization',
    'Duplicate detection',
  ],
  output: {
    extractedDocuments: 0,
    validatedGSTINs: 0,
    categorizedBills: 0,
    pendingVerification: 0,
  },
  sampleActions: [
    {
      timestamp: '09:15 AM',
      description: 'Extracted 5 invoices from email. Validated GSTIN for all 5 vendors against CBIC registry.',
      type: 'extraction',
    },
    {
      timestamp: '09:32 AM',
      description: 'Processed bank statement from HDFC Bank. Matched 12 transactions with invoice register.',
      type: 'extraction',
    },
    {
      timestamp: '10:01 AM',
      description: 'Found 2 duplicate invoices from same vendor. Flagged for CA review.',
      type: 'extraction',
    },
  ],
};

// ============================================================================
// THE MATCHMAKER - Reconciliation Agent
// ============================================================================

export const TheMatchmaker = {
  id: 'matchmaker',
  name: 'The Matchmaker',
  role: 'Reconciliation',
  description: 'Compares Purchase Register with GSTR-2B and Bank Statements. If ₹1 is missing, finds exactly which invoice caused the gap.',
  icon: <CheckCircle className="w-6 h-6" />,
  manualTaskReplaced: 'Manual Reconciliation (Most Boring Task)',
  capabilities: [
    'Purchase Register analysis',
    'GSTR-2B comparison',
    'Bank statement matching',
    'GST Input Credit reconciliation',
    'TDS certificate verification',
    'Variance analysis (down to ₹1)',
    'Discrepancy detection',
    'Reconciliation report generation',
  ],
  output: {
    purchasesReconciled: 0,
    gstrMatches: 0,
    bankMatches: 0,
    variancesFound: 0,
  },
  sampleActions: [
    {
      timestamp: '10:45 AM',
      description: 'Reconciled 142 invoices with GSTR-2B. Found ₹5,430 variance in Input Credit.',
      type: 'reconciliation',
    },
    {
      timestamp: '10:58 AM',
      description: 'Identified invoice INV-2024-0847 (₹1,200) missing from GSTR-2B. Flagged for vendor follow-up.',
      type: 'reconciliation',
    },
    {
      timestamp: '11:23 AM',
      description: 'Bank reconciliation complete. Matched 156 transactions. 3 pending clearance items.',
      type: 'reconciliation',
    },
  ],
};

// ============================================================================
// THE ARCHITECT - Balance Sheet & Finalization Agent
// ============================================================================

export const TheArchitect = {
  id: 'architect',
  name: 'The Architect',
  role: 'Finalization (Balance Sheet)',
  description: 'Understands Double Entry Bookkeeping. Creates Journal Entries, Ledger Postings, and Trial Balances. Classifies transactions automatically.',
  icon: <BarChart3 className="w-6 h-6" />,
  manualTaskReplaced: 'Manual Balance Sheet & Journal Entry Creation',
  capabilities: [
    'Double Entry Bookkeeping logic',
    'Journal Entry generation',
    'Ledger Posting automation',
    'Trial Balance creation',
    'Account classification (Asset/Liability/Expense/Income)',
    'Depreciation calculation',
    'Provision creation',
    'Balance Sheet generation',
  ],
  output: {
    journalEntriesCreated: 0,
    ledgersPosted: 0,
    trialBalancesGenerated: 0,
    classificationsDone: 0,
  },
  sampleActions: [
    {
      timestamp: '11:45 AM',
      description: 'Created 87 Journal Entries for month-end transactions. Auto-classified laptop purchase as Fixed Asset.',
      type: 'generation',
    },
    {
      timestamp: '12:01 PM',
      description: 'Generated Trial Balance showing ₹42.3L net profit. All accounts in balance.',
      type: 'generation',
    },
    {
      timestamp: '12:15 PM',
      description: 'Calculated depreciation: ₹45,000 on office equipment. Created provision entry.',
      type: 'generation',
    },
  ],
};

// ============================================================================
// THE SENTINEL - Compliance & Filing Agent
// ============================================================================

export const TheSentinel = {
  id: 'sentinel',
  name: 'The Sentinel',
  role: 'Compliance & Filing',
  description: 'Looks at calendar and portals. Knows deadlines. Prepares Returns and waits for CA to click Sign & File.',
  icon: <FileCheck className="w-6 h-6" />,
  manualTaskReplaced: 'Manual Compliance & Return Filing',
  capabilities: [
    'Deadline calendar management',
    'GST Return (GSTR-1, GSTR-3B) preparation',
    'Income Tax Return (ITR) generation',
    'TDS Return processing',
    'MCA e-form preparation',
    'RBI/SEBI compliance checking',
    'Portal integration readiness',
    'CA approval workflow',
  ],
  output: {
    deadlinesTracked: 0,
    returnsPrepared: 0,
    complianceChecks: 0,
    pendingCASignoff: 0,
  },
  sampleActions: [
    {
      timestamp: '01:30 PM',
      description: 'TDS payment deadline tomorrow (March 30). Generated TDS return. Awaiting CA signature.',
      type: 'compliance',
    },
    {
      timestamp: '01:45 PM',
      description: 'GSTR-3B due in 5 days. Pre-populated with all input credit. Ready for CA review.',
      type: 'compliance',
    },
    {
      timestamp: '02:00 PM',
      description: 'Annual compliance checklist: 8/10 items completed. 2 pending documents from client.',
      type: 'compliance',
    },
  ],
};

// ============================================================================
// AI AGENT PANEL COMPONENT
// ============================================================================

interface AIAgentPanelProps {
  dashboardType: 'ca' | 'admin' | 'legal' | 'company' | 'university';
  agentsActive?: typeof TheIngestor[];
}

export const AIAgentPanel = ({ dashboardType, agentsActive }: AIAgentPanelProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(
    dashboardType === 'ca' ? 'architect' : 'ingestor'
  );

  const agents = {
    ca: [TheIngestor, TheMatchmaker, TheArchitect, TheSentinel],
    admin: [TheIngestor, TheArchitect, TheSentinel],
    legal: [TheIngestor, TheArchitect],
    company: [TheIngestor, TheSentinel],
    university: [TheIngestor],
  };

  const currentAgents = agents[dashboardType] || [];
  const selectedAgentData = currentAgents.find(a => a.id === selectedAgent) || currentAgents[0];

  return (
    <div className="space-y-6">
      {/* Agent Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentAgents.map((agent, idx) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setSelectedAgent(agent.id)}
            className="cursor-pointer"
          >
            <Card className={`${selectedAgent === agent.id ? 'border-primary' : 'border-slate-700'} transition-all hover:border-primary`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="text-2xl text-amber-500">{agent.icon}</div>
                  <Badge variant="outline" className="text-xs">
                    {agent.id === 'ingestor' ? 'Data' : agent.id === 'matchmaker' ? 'Recon' : agent.id === 'architect' ? 'BS' : 'Filing'}
                  </Badge>
                </div>
                <CardTitle className="text-sm mt-2">{agent.name}</CardTitle>
                <CardDescription className="text-xs">{agent.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <Badge className="text-xs bg-green-600">Active</Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>45%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[45%] h-full bg-green-600"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Selected Agent Details */}
      {selectedAgentData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={selectedAgentData.id}
        >
          <Card className="border-slate-700">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl text-amber-500">{selectedAgentData.icon}</div>
                    <div>
                      <CardTitle>{selectedAgentData.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Replaces: <span className="text-amber-400">{selectedAgentData.manualTaskReplaced}</span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-600">Working</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="font-semibold text-white mb-2">How It Works</h4>
                <p className="text-sm text-slate-300">{selectedAgentData.description}</p>
              </div>

              {/* Capabilities */}
              <div>
                <h4 className="font-semibold text-white mb-3">Core Capabilities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedAgentData.capabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Actions */}
              <div>
                <h4 className="font-semibold text-white mb-3">Actions This Session</h4>
                <div className="space-y-3">
                  {selectedAgentData.sampleActions.map((action, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-3 rounded-lg bg-slate-700/50 border border-slate-600"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {action.type === 'extraction' && (
                            <Upload className="w-4 h-4 text-blue-500 mt-0.5" />
                          )}
                          {action.type === 'reconciliation' && (
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          )}
                          {action.type === 'generation' && (
                            <BarChart3 className="w-4 h-4 text-purple-500 mt-0.5" />
                          )}
                          {action.type === 'compliance' && (
                            <FileCheck className="w-4 h-4 text-amber-500 mt-0.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">{action.timestamp}</span>
                            <Badge variant="outline" className="text-xs">
                              {action.type.charAt(0).toUpperCase() + action.type.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-200">{action.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div className="pt-4 border-t border-slate-700 flex gap-3">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Actions
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 flex-1">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Review Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

// ============================================================================
// AI AGENT SUMMARY WIDGET (For Dashboard Sidebar)
// ============================================================================

export const AIAgentSummaryWidget = ({ dashboardType }: { dashboardType: string }) => {
  const agentGroups = {
    ca: [TheIngestor, TheMatchmaker, TheArchitect, TheSentinel],
    admin: [TheIngestor, TheArchitect, TheSentinel],
    legal: [TheIngestor, TheArchitect],
    company: [TheIngestor, TheSentinel],
  };

  const agents = agentGroups[dashboardType as keyof typeof agentGroups] || [];

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-base">AI Agents Working</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div className="text-sm">{agent.icon}</div>
                <div>
                  <p className="text-xs font-medium text-white">{agent.name}</p>
                  <p className="text-xs text-slate-400">{agent.role}</p>
                </div>
              </div>
              <Badge className="text-xs bg-green-600">Active</Badge>
            </div>
          ))}
        </div>
        <Button size="sm" className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-xs">
          View All Agents →
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIAgentPanel;
