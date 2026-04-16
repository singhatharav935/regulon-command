import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RegulonAIAgent from "@/components/ai-agent/RegulonAIAgent";
import AIDraftingEngine from "@/components/ca-dashboard/AIDraftingEngine";
import TaskFilingManagement from "@/components/ca-dashboard/TaskFilingManagement";
import ClientDependencyTracker from "@/components/ca-dashboard/ClientDependencyTracker";
import RegulatoryNewsRuleImpact from "@/components/ca-dashboard/RegulatoryNewsRuleImpact";
import ComplianceHealthChangeLog from "@/components/ca-dashboard/ComplianceHealthChangeLog";
import AuditInspectionSupport from "@/components/ca-dashboard/AuditInspectionSupport";
import CommunicationLogsLive from "@/components/ca-dashboard/CommunicationLogsLive";
import CAAnalyticsPerformance from "@/components/ca-dashboard/CAAnalyticsPerformance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Building,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
  Check,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Plus,
  Search,
  Download,
  DollarSign,
  CreditCard,
  RefreshCw,
  Loader,
  Zap,
  Play,
  Pause,
  Eye,
  Shield,
  Newspaper,
  Scale,
  Calculator,
  FileCheck,
  FileClock,
  FileWarning,
  Activity,
  Radio,
  Cpu,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  Upload,
  Send,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import useCAMetrics from "@/hooks/useCAMetrics";
import { addCompany as addCompanyAPI } from "@/services/api";
import { CAAgentOrchestratorProvider } from "@/components/agents/CAAgentOrchestrator";
import { CACommandCenterHeader } from "@/components/agents/CACommandCenterHeader";
import { CAActionInbox } from "@/components/agents/CAActionInbox";

// Daily Governance Brief Component
const DailyGovernanceBrief = () => {
  const [briefData, setBriefData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchDailyBrief = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/ca/daily-governance');
      const data = await response.json();
      setBriefData(data);
      setLastRefresh(new Date());
      toast.success("AI analysis completed successfully");
    } catch (error) {
      console.error('Error fetching daily brief:', error);
      toast.error("Failed to fetch daily brief");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyBrief();
  }, []);

  const handleRefresh = () => {
    fetchDailyBrief();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-red-500/50 bg-red-500/10';
      case 'high': return 'border-orange-500/50 bg-orange-500/10';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07 }}
      className="mb-16 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-2">
            <Bot className="w-6 h-6 mr-2" />
            Daily Governance Brief
            <Badge variant="outline" className="ml-3 text-xs">
              AI v2.1
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Advanced AI-powered portfolio analysis and task prioritization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Analyzing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <Card className="glass-card border-border/50 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 border-cyan-500/30">
        <CardContent className="p-6">
          {loading && !briefData ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-cyan-400">
                <Loader className="w-6 h-6 animate-spin" />
                <span>AI Agent analyzing your portfolio and prioritizing tasks...</span>
              </div>
            </div>
          ) : briefData ? (
            <div className="space-y-8">
              {/* AI Summary */}
              <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
                <h4 className="text-sm font-medium text-cyan-300 mb-2 flex items-center">
                  <Bot className="w-4 h-4 mr-2" />
                  AI Daily Summary
                </h4>
                <p className="text-sm text-muted-foreground">
                  {briefData.aiSummary || briefData.intelligentSummary}
                </p>
              </div>

              {/* Portfolio Overview */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Portfolio Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-card/30 rounded-lg p-4 border border-cyan-500/20">
                    <p className="text-sm text-muted-foreground">Total Companies</p>
                    <p className="text-2xl font-bold text-cyan-400">{briefData.totalCompanies}</p>
                  </div>
                  <div className="bg-card/30 rounded-lg p-4 border border-orange-500/20">
                    <p className="text-sm text-muted-foreground">Pending Tasks</p>
                    <p className="text-2xl font-bold text-orange-400">{briefData.pendingTasks}</p>
                  </div>
                  <div className="bg-card/30 rounded-lg p-4 border border-green-500/20">
                    <p className="text-sm text-muted-foreground">Completed Today</p>
                    <p className="text-2xl font-bold text-green-400">{briefData.completedToday}</p>
                  </div>
                  <div className="bg-card/30 rounded-lg p-4 border border-purple-500/20">
                    <p className="text-sm text-muted-foreground">AI Score</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {briefData.workloadAnalysis?.utilizationPercent || 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Today's AI Focus Areas */}
              {briefData.todaysFocus && briefData.todaysFocus.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-orange-300 mb-3 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Today's AI Focus Areas
                  </h3>
                  <div className="space-y-4">
                    {briefData.todaysFocus.map((focus, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-orange-300">{focus.title}</h4>
                          <Badge variant="destructive">{focus.count} tasks</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{focus.description}</p>
                        <p className="text-xs text-orange-200 italic">💡 AI Advice: {focus.aiAdvice}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-Prioritized Assignments */}
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  AI-Prioritized Assignments
                </h3>
                <div className="space-y-3">
                  {(briefData.prioritizedAssignments || briefData.assignments || []).map((assignment, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getPriorityColor(assignment.priority || assignment.urgencyLevel)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">Client: {assignment.client || assignment.company_name}</p>
                          {assignment.aiRecommendation && (
                            <p className="text-xs text-cyan-300 mt-1">🤖 AI: {assignment.aiRecommendation}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {assignment.aiScore && (
                            <Badge variant="outline" className="text-xs">
                              AI Score: {assignment.aiScore}
                            </Badge>
                          )}
                          <Badge 
                            variant={assignment.priority === 'critical' || assignment.urgencyLevel === 'critical' ? 'destructive' : 
                                   assignment.priority === 'high' || assignment.urgencyLevel === 'high' ? 'default' : 'secondary'}
                          >
                            {assignment.urgencyLevel || assignment.priority}
                          </Badge>
                          <Badge variant="outline">{assignment.status}</Badge>
                        </div>
                      </div>
                      {assignment.daysUntilDue !== undefined && (
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3" />
                          <span className={`text-xs ${getUrgencyColor(assignment.urgencyLevel)}`}>
                            {assignment.daysUntilDue === 0 ? 'Due today' : 
                             assignment.daysUntilDue === 1 ? 'Due tomorrow' :
                             assignment.daysUntilDue < 0 ? `${Math.abs(assignment.daysUntilDue)} days overdue` :
                             `Due in ${assignment.daysUntilDue} days`}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              {briefData.aiRecommendations && briefData.aiRecommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    AI Recommendations
                  </h3>
                  <div className="space-y-3">
                    {briefData.aiRecommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                            {rec.priority}
                          </Badge>
                          <h4 className="font-medium text-purple-300">{rec.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        {rec.actionItems && (
                          <ul className="text-xs text-purple-200 space-y-1">
                            {rec.actionItems.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Critical Alerts */}
              {briefData.criticalAlerts && briefData.criticalAlerts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-300 mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Critical Alerts
                  </h3>
                  <div className="space-y-3">
                    {briefData.criticalAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className="p-4 bg-red-500/10 rounded-lg border border-red-500/30"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">{alert.severity}</Badge>
                          <h4 className="font-medium text-red-300">{alert.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        <p className="text-xs text-red-200">Action: {alert.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Updates */}
              {briefData.liveUpdates && briefData.liveUpdates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Live Portfolio Updates
                  </h3>
                  <div className="space-y-2">
                    {briefData.liveUpdates.map((update, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20"
                      >
                        <p className="text-sm text-foreground">{update.message}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(update.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No AI analysis available</p>
              <p className="text-sm">Click refresh to generate your daily governance brief</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ========================================
// LIVE AI DRAFTING ENGINE COMPONENT
// ========================================

interface AITask {
  id: string;
  type: 'draft' | 'balance_sheet' | 'reconciliation' | 'audit' | 'compliance_check' | 'notice_response';
  title: string;
  client: string;
  status: 'queued' | 'processing' | 'pending_approval' | 'approved' | 'completed' | 'rejected';
  progress: number;
  createdAt: string;
  description: string;
  result?: any;
}

interface RegulatoryNews {
  id: string;
  title: string;
  source: string;
  category: string;
  date: string;
  impact: 'high' | 'medium' | 'low';
  summary: string;
}

interface ClientDeadline {
  id: string;
  client: string;
  type: string;
  deadline: string;
  daysRemaining: number;
  status: 'upcoming' | 'urgent' | 'overdue';
}

const LiveAIDraftingEngine = () => {
  // AI Agent State
  const [isAgentActive, setIsAgentActive] = useState(true);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'monitoring' | 'working' | 'awaiting_approval'>('monitoring');
  const [aiTasks, setAiTasks] = useState<AITask[]>([]);
  const [selectedTask, setSelectedTask] = useState<AITask | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  
  // Real-time Data
  const [regulatoryNews, setRegulatoryNews] = useState<RegulatoryNews[]>([]);
  const [clientDeadlines, setClientDeadlines] = useState<ClientDeadline[]>([]);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  
  // Document Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');
  
  // Deployment
  const [deploymentCommand, setDeploymentCommand] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Log Agent Activity
  const addAgentLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAgentLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }, []);

  // Fetch Regulatory News
  const fetchRegulatoryNews = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/ai-engine/regulatory-news');
      const data = await response.json();
      if (data.news) {
        setRegulatoryNews(data.news);
        addAgentLog('📰 Fetched latest regulatory news and circulars');
      }
    } catch (error) {
      console.error('Failed to fetch regulatory news:', error);
      setRegulatoryNews([]);
      addAgentLog('⚠️ Unable to fetch regulatory news — backend unavailable');
    }
  };

  // Fetch Client Deadlines
  const fetchClientDeadlines = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/ai-engine/client-deadlines');
      const data = await response.json();
      if (data.deadlines) {
        setClientDeadlines(data.deadlines);
        addAgentLog('📅 Scanned all client deadlines and compliance calendars');
      }
    } catch (error) {
      console.error('Failed to fetch client deadlines:', error);
      setClientDeadlines([]);
      addAgentLog('⚠️ Unable to fetch client deadlines — backend unavailable');
    }
  };

  // Initialize Agent
  useEffect(() => {
    if (isAgentActive) {
      addAgentLog('🤖 REGULON AI Agent initialized and monitoring...');
      fetchRegulatoryNews();
      fetchClientDeadlines();
      
      // Set up periodic monitoring
      const monitoringInterval = setInterval(() => {
        if (isAgentActive) {
          addAgentLog('🔍 Scanning for compliance updates...');
          fetchRegulatoryNews();
          fetchClientDeadlines();
        }
      }, 60000); // Every minute
      
      return () => clearInterval(monitoringInterval);
    }
  }, [isAgentActive, addAgentLog]);

  // Deploy AI Agent for Task
  const deployAgentForTask = async (taskType: AITask['type'], client: string, description: string) => {
    const newTask: AITask = {
      id: `task-${Date.now()}`,
      type: taskType,
      title: getTaskTitle(taskType),
      client,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
      description
    };
    
    setAiTasks(prev => [newTask, ...prev]);
    setAgentStatus('working');
    addAgentLog(`🚀 Deploying AI Agent for ${newTask.title} - ${client}`);
    
    // Simulate AI processing
    await processTask(newTask);
  };

  // Process Task
  const processTask = async (task: AITask) => {
    // Update to processing
    setAiTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: 'processing', progress: 10 } : t
    ));
    addAgentLog(`⚙️ Processing: ${task.title} for ${task.client}`);
    
    // Simulate progressive work
    const steps = [
      { progress: 25, log: `📊 Fetching data for ${task.client}...` },
      { progress: 40, log: `🔍 Analyzing compliance requirements...` },
      { progress: 60, log: `📝 Generating draft documents...` },
      { progress: 80, log: `✅ Validating against regulatory standards...` },
      { progress: 95, log: `📋 Preparing for CA review and approval...` },
    ];
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAiTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, progress: step.progress } : t
      ));
      addAgentLog(step.log);
    }
    
    // Complete processing, await approval
    setAiTasks(prev => prev.map(t => 
      t.id === task.id ? { 
        ...t, 
        status: 'pending_approval', 
        progress: 100,
        result: generateTaskResult(task.type, task.client)
      } : t
    ));
    setAgentStatus('awaiting_approval');
    addAgentLog(`⏳ ${task.title} ready for CA approval`);
    toast.info(`${task.title} ready for your approval`, {
      description: `Review and approve to finalize for ${task.client}`
    });
  };

  // Generate Task Result
  const generateTaskResult = (type: AITask['type'], client: string) => {
    switch (type) {
      case 'draft':
        return {
          documentType: 'Legal Notice Response',
          pages: 5,
          sections: ['Introduction', 'Legal Background', 'Arguments', 'Prayer', 'Annexures'],
          generatedAt: new Date().toISOString()
        };
      case 'balance_sheet':
        return {
          documentType: 'Balance Sheet FY 2025-26',
          pages: 12,
          totalAssets: '₹2.5 Cr',
          totalLiabilities: '₹1.8 Cr',
          netWorth: '₹70 L',
          generatedAt: new Date().toISOString()
        };
      case 'reconciliation':
        return {
          documentType: 'GST Reconciliation Report',
          purchaseRegister: '₹45.2 L',
          gstr2a: '₹44.8 L',
          variance: '₹40,000',
          mismatches: 3,
          generatedAt: new Date().toISOString()
        };
      case 'audit':
        return {
          documentType: 'Audit Working Papers',
          pages: 28,
          observations: 4,
          riskAreas: 2,
          recommendations: 6,
          generatedAt: new Date().toISOString()
        };
      default:
        return {
          documentType: 'Compliance Report',
          status: 'Generated',
          generatedAt: new Date().toISOString()
        };
    }
  };

  // Get Task Title
  const getTaskTitle = (type: AITask['type']) => {
    const titles: Record<AITask['type'], string> = {
      'draft': 'Draft Legal Response',
      'balance_sheet': 'Generate Balance Sheet',
      'reconciliation': 'GST Reconciliation',
      'audit': 'Audit Preparation',
      'compliance_check': 'Compliance Check',
      'notice_response': 'Notice Response Draft'
    };
    return titles[type] || 'AI Task';
  };

  // Approve Task
  const approveTask = async (taskId: string) => {
    addAgentLog(`✅ CA APPROVED: Task ${taskId}`);
    setAiTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'approved' } : t
    ));
    
    // Generate final PDF
    await new Promise(resolve => setTimeout(resolve, 1500));
    addAgentLog(`📄 Generating final PDF with REGULON AI seal...`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAiTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'completed' } : t
    ));
    addAgentLog(`✨ Task completed and PDF ready for download`);
    
    setShowApprovalModal(false);
    setSelectedTask(null);
    setAgentStatus('monitoring');
    
    toast.success('Document approved and finalized!', {
      description: 'PDF with REGULON AI seal is ready for download'
    });
  };

  // Reject Task
  const rejectTask = async (taskId: string) => {
    addAgentLog(`❌ CA REJECTED: Task ${taskId} - Requires revision`);
    setAiTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'rejected' } : t
    ));
    setShowApprovalModal(false);
    setSelectedTask(null);
    setAgentStatus('monitoring');
    
    toast.error('Task rejected', {
      description: 'AI Agent will revise and resubmit'
    });
  };

  // Handle Document Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      addAgentLog(`📁 Document uploaded: ${file.name}`);
    }
  };

  // Process Uploaded Document
  const processUploadedDocument = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    addAgentLog(`🔄 Processing document: ${uploadedFile.name}`);
    
    // Simulate OCR and AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    addAgentLog(`📝 Extracting text using OCR...`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    addAgentLog(`🤖 Analyzing document structure and legal content...`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    addAgentLog(`⚖️ Cross-referencing with relevant law sections...`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate draft response
    setGeneratedDraft(`RESPONSE TO ${uploadedFile.name.toUpperCase()}

BEFORE THE COMMISSIONER OF CENTRAL TAX
[Case Reference Generated by REGULON AI]

IN THE MATTER OF:
Notice dated [Auto-detected] regarding [Auto-analyzed Issue]

RESPECTFULLY SUBMITTED BY:
[Client Name - To be filled]
GSTIN: [Auto-populated from system]

1. INTRODUCTION
The undersigned, on behalf of the above-named taxpayer, hereby submits this response to the Show Cause Notice referenced above.

2. FACTUAL BACKGROUND
[AI-generated summary of the case based on document analysis]
- Issue identified: Input Tax Credit discrepancy
- Period in question: FY 2025-26
- Amount involved: ₹[To be verified]

3. LEGAL ARGUMENTS
Based on REGULON AI analysis of applicable law sections:
- Section 16 of CGST Act, 2017
- Rule 36(4) of CGST Rules
- Relevant circulars and notifications

4. PRAYER
In view of the above submissions, the taxpayer prays that:
a) The Show Cause Notice may be dropped
b) No penalty/interest be levied
c) Just and equitable relief be granted

[THIS DRAFT REQUIRES CA REVIEW AND APPROVAL]

---
⚠️ REGULON AI GENERATED DRAFT
CA AUTHORIZATION REQUIRED BEFORE SUBMISSION
Generated: ${new Date().toLocaleString()}
`);
    
    setIsProcessing(false);
    addAgentLog(`✅ Draft generated - Awaiting CA review`);
    
    toast.success('Draft generated successfully!', {
      description: 'Please review and approve before submission'
    });
  };

  // Quick Deploy Commands
  const quickDeployCommands = [
    { type: 'balance_sheet' as const, label: 'Generate Balance Sheet', icon: Calculator },
    { type: 'reconciliation' as const, label: 'GST Reconciliation', icon: Scale },
    { type: 'audit' as const, label: 'Audit Preparation', icon: FileCheck },
    { type: 'compliance_check' as const, label: 'Compliance Check', icon: Shield },
    { type: 'notice_response' as const, label: 'Draft Notice Response', icon: FileText },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-16 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-2">
            <Cpu className="w-6 h-6 mr-2" />
            AI Drafting Engine
            <Badge 
              variant={isAgentActive ? 'default' : 'secondary'} 
              className={`ml-3 ${isAgentActive ? 'bg-green-500/20 text-green-400 border-green-500/50' : ''}`}
            >
              <Radio className={`w-3 h-3 mr-1 ${isAgentActive ? 'animate-pulse' : ''}`} />
              {isAgentActive ? 'LIVE' : 'PAUSED'}
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Autonomous AI agent for drafting, reconciliation, and compliance - Always with CA final approval
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant={isAgentActive ? 'destructive' : 'default'}
            onClick={() => {
              setIsAgentActive(!isAgentActive);
              addAgentLog(isAgentActive ? '⏸️ AI Agent paused' : '▶️ AI Agent resumed');
            }}
          >
            {isAgentActive ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {isAgentActive ? 'Pause Agent' : 'Start Agent'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="glass-card border-border/50 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 border-purple-500/30">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="deploy">Deploy AI</TabsTrigger>
              <TabsTrigger value="drafting">Document Draft</TabsTrigger>
              <TabsTrigger value="news">Regulatory News</TabsTrigger>
              <TabsTrigger value="logs">Agent Logs</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Agent Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/30 rounded-lg p-4 border border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${agentStatus === 'working' ? 'bg-yellow-500/20' : agentStatus === 'awaiting_approval' ? 'bg-orange-500/20' : 'bg-green-500/20'}`}>
                      <Activity className={`w-5 h-5 ${agentStatus === 'working' ? 'text-yellow-400 animate-pulse' : agentStatus === 'awaiting_approval' ? 'text-orange-400' : 'text-green-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Agent Status</p>
                      <p className="font-bold capitalize">{agentStatus.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card/30 rounded-lg p-4 border border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-orange-500/20">
                      <FileClock className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Approvals</p>
                      <p className="font-bold">{aiTasks.filter(t => t.status === 'pending_approval').length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card/30 rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-red-500/20">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Urgent Deadlines</p>
                      <p className="font-bold">{clientDeadlines.filter(d => d.status === 'urgent').length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div>
                <h3 className="text-lg font-semibold text-orange-300 mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Client Deadlines Being Monitored
                </h3>
                <div className="space-y-2">
                  {clientDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        deadline.status === 'urgent' ? 'bg-red-500/10 border-red-500/30' :
                        deadline.status === 'overdue' ? 'bg-red-500/20 border-red-500/50' :
                        'bg-card/20 border-cyan-500/20'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{deadline.client}</p>
                        <p className="text-sm text-muted-foreground">{deadline.type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={deadline.status === 'urgent' ? 'destructive' : 'secondary'}>
                          {deadline.daysRemaining} days
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deployAgentForTask('compliance_check', deadline.client, `Prepare ${deadline.type}`)}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Deploy AI
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Tasks */}
              {aiTasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI Agent Tasks
                  </h3>
                  <div className="space-y-3">
                    {aiTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border ${
                          task.status === 'pending_approval' ? 'bg-orange-500/10 border-orange-500/30' :
                          task.status === 'completed' ? 'bg-green-500/10 border-green-500/30' :
                          task.status === 'processing' ? 'bg-purple-500/10 border-purple-500/30' :
                          'bg-card/20 border-cyan-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">{task.client}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              task.status === 'completed' ? 'default' :
                              task.status === 'pending_approval' ? 'destructive' :
                              'secondary'
                            }>
                              {task.status.replace('_', ' ')}
                            </Badge>
                            {task.status === 'pending_approval' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-400 border-green-500/50"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowApprovalModal(true);
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                        {task.status === 'processing' && (
                          <Progress value={task.progress} className="h-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Deploy AI Tab */}
            <TabsContent value="deploy" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">Quick Deploy AI Agent</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a task type and client to deploy the AI agent. All outputs require CA approval.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {quickDeployCommands.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <Button
                        key={cmd.type}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-500/20 hover:border-purple-500/50"
                        onClick={() => {
                          const client = clientDeadlines[0]?.client || 'Sample Client';
                          deployAgentForTask(cmd.type, client, cmd.label);
                        }}
                      >
                        <Icon className="w-6 h-6 text-purple-400" />
                        <span>{cmd.label}</span>
                      </Button>
                    );
                  })}
                </div>

                <div className="p-4 bg-card/30 rounded-lg border border-cyan-500/20">
                  <h4 className="font-medium mb-3">Custom Deployment Command</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Generate audit report for TechVenture..."
                      value={deploymentCommand}
                      onChange={(e) => setDeploymentCommand(e.target.value)}
                      className="bg-card/50"
                    />
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        if (deploymentCommand) {
                          deployAgentForTask('compliance_check', 'Custom Client', deploymentCommand);
                          setDeploymentCommand('');
                        }
                      }}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Deploy
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Drafting Tab */}
            <TabsContent value="drafting" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-300">Upload Document for AI Analysis</h3>
                  <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-cyan-400/50" />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="inhouse-document-upload"
                    />
                    <label htmlFor="inhouse-document-upload" className="cursor-pointer">
                      <p className="text-muted-foreground mb-2">
                        Drop notice/document here or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports PDF, DOC, DOCX
                      </p>
                    </label>
                  </div>
                  
                  {uploadedFile && (
                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-green-400" />
                          <span>{uploadedFile.name}</span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={processUploadedDocument}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <Loader className="w-4 h-4 mr-1 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-1" />
                              Generate Draft
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generated Draft Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-300">AI-Generated Draft</h3>
                  <Textarea
                    placeholder="AI will generate legal draft here based on uploaded document..."
                    value={generatedDraft}
                    readOnly
                    className="bg-card/50 border-cyan-500/20 h-[400px] font-mono text-sm"
                  />
                  {generatedDraft && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        className="flex-1 text-green-400 border-green-500/50 hover:bg-green-500/20"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve & Generate PDF
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-1" />
                        Download Draft
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-purple-400 border-purple-500/50 hover:bg-purple-500/20"
                        onClick={() => {
                          const draftsSection = document.getElementById('ai-drafting-engine-full');
                          if (draftsSection) {
                            draftsSection.scrollIntoView({ behavior: 'smooth' });
                            toast.success('Opening Advanced Drafting Engine', {
                              description: 'Use the full engine for comprehensive document generation'
                            });
                          }
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Open in Full Engine
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Regulatory News Tab */}
            <TabsContent value="news" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cyan-300 flex items-center">
                  <Newspaper className="w-5 h-5 mr-2" />
                  Live Regulatory Updates
                </h3>
                <Button size="sm" variant="outline" onClick={fetchRegulatoryNews}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>
              
              <div className="space-y-4">
                {regulatoryNews.map((news) => (
                  <div
                    key={news.id}
                    className={`p-4 rounded-lg border ${
                      news.impact === 'high' ? 'bg-red-500/10 border-red-500/30' :
                      news.impact === 'medium' ? 'bg-orange-500/10 border-orange-500/30' :
                      'bg-card/20 border-cyan-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{news.title}</h4>
                        <p className="text-sm text-muted-foreground">{news.source}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={news.impact === 'high' ? 'destructive' : 'secondary'}>
                          {news.impact} impact
                        </Badge>
                        <Badge variant="outline">{news.category}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{news.summary}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(news.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Agent Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cyan-300 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  AI Agent Activity Log
                </h3>
                <Button size="sm" variant="outline" onClick={() => setAgentLogs([])}>
                  Clear Logs
                </Button>
              </div>
              
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm h-[400px] overflow-y-auto border border-cyan-500/20">
                {agentLogs.length === 0 ? (
                  <p className="text-muted-foreground">No activity yet...</p>
                ) : (
                  agentLogs.map((log, idx) => (
                    <div key={idx} className="text-green-400 mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <AnimatePresence>
        {showApprovalModal && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowApprovalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-cyan-500/30 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-cyan-400">CA Authorization Required</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowApprovalModal(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-orange-400" />
                    <span className="font-medium text-orange-300">Awaiting CA Approval</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This document was generated by REGULON AI and requires your authorization before submission.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Task Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Type:</span> {selectedTask.title}</p>
                    <p><span className="text-muted-foreground">Client:</span> {selectedTask.client}</p>
                    <p><span className="text-muted-foreground">Generated:</span> {new Date(selectedTask.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {selectedTask.result && (
                  <div>
                    <h4 className="font-medium mb-2">Generated Output</h4>
                    <div className="bg-card/50 rounded-lg p-4 text-sm space-y-1">
                      {Object.entries(selectedTask.result).map(([key, value]) => (
                        <p key={key}>
                          <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                          {String(value)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => approveTask(selectedTask.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Generate PDF
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => rejectTask(selectedTask.id)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject & Revise
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  By approving, you confirm this document meets professional standards.
                  Final PDF will include REGULON AI seal with CA verification.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const InhouseCADashboardReal = () => {
  const { metrics, loading, refetch } = useCAMetrics();

  // Role-based access control — disabled for now (registration optional)
  // Will re-enable when auth flow for inhouse_ca is built

  const [stats, setStats] = useState([
    { id: "companies", label: "Managed Entities", value: "0", icon: Building, color: "text-cyan-400" },
    { id: "tasks", label: "Pending Tasks", value: "0", icon: FileText, color: "text-yellow-400" },
    { id: "due", label: "Due in 7 Days", value: "0", icon: Clock, color: "text-orange-400" },
    { id: "alerts", label: "High-Risk Alerts", value: "0", icon: AlertTriangle, color: "text-red-400" },
    { id: "revenue", label: "Budget Utilization", value: "₹0", icon: DollarSign, color: "text-green-400" },
    { id: "plan", label: "Assigned Entities", value: "0/10", icon: CreditCard, color: "text-primary" },
  ]);

  const [companies, setCompanies] = useState<any[]>([]);
  const [newCompanyPan, setNewCompanyPan] = useState("");
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [draftText, setDraftText] = useState("");
  
  // New Consent-Based Onboarding State
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    gstin: '',
    pan: '',
    cin: '',
    client_name: '',
    client_email: '',
    client_phone: ''
  });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  // Compliance Service API URL
  const COMPLIANCE_API = 'http://localhost:8001/api/v1';

  // Fetch CA's clients from compliance service
  const fetchClients = async () => {
    try {
      const response = await fetch(`${COMPLIANCE_API}/ca/inhouse-ca-001/clients`);
      const data = await response.json();
      if (data.success && data.clients) {
        setCompanies(data.clients.map((c: any) => ({
          ...c,
          health: c.compliance_score,
          status: c.legal_status || 'Active',
          lastFiling: c.last_sync ? new Date(c.last_sync).toLocaleDateString() : 'Pending'
        })));
      }
    } catch (error) {
      console.log('Compliance service not available, using local state');
    }
  };

  // Fetch pending consent requests
  const fetchPendingRequests = async () => {
    // This would fetch from your backend
    // For now, we'll manage locally
  };

  useEffect(() => {
    fetchClients();
    const interval = setInterval(fetchClients, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle consent-based onboarding
  const handleOnboardClient = async () => {
    if (!onboardForm.gstin && !onboardForm.pan && !onboardForm.cin) {
      toast.error('Enter at least one identifier (GSTIN, PAN, or CIN)');
      return;
    }
    if (!onboardForm.client_name) {
      toast.error('Client name is required');
      return;
    }
    if (!onboardForm.client_email && !onboardForm.client_phone) {
      toast.error('Enter client email or phone for consent notification');
      return;
    }

    setIsOnboarding(true);
    try {
      const response = await fetch(`${COMPLIANCE_API}/client/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ca_id: 'inhouse-ca-001',
          ca_name: 'In-House Compliance Team',
          ca_email: 'inhouse-ca@regulon.ai',
          ...onboardForm
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Consent request sent to client!', {
          description: `Waiting for ${onboardForm.client_name} to authorize access`
        });
        
        // Add to pending requests
        setPendingRequests(prev => [...prev, {
          ...data.data,
          client_name: onboardForm.client_name,
          created_at: new Date().toISOString()
        }]);
        
        // Reset form
        setOnboardForm({
          gstin: '',
          pan: '',
          cin: '',
          client_name: '',
          client_email: '',
          client_phone: ''
        });
        setShowOnboardModal(false);
        
        // Start polling for status
        pollOnboardStatus(data.data.request_id);
      } else {
        toast.error(data.error || 'Failed to initiate onboarding');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to connect to compliance service');
    } finally {
      setIsOnboarding(false);
    }
  };

  // Poll for onboarding status
  const pollOnboardStatus = async (requestId: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${COMPLIANCE_API}/onboard/${requestId}/status`);
        const data = await response.json();
        
        if (data.is_complete) {
          toast.success(`${data.company_name} onboarded successfully!`, {
            description: `Compliance Score: ${data.health_score}%`
          });
          fetchClients();
          setPendingRequests(prev => prev.filter(r => r.request_id !== requestId));
          return true;
        }
        
        if (data.consent_status === 'rejected') {
          toast.error(`${data.company_name} rejected the consent request`);
          setPendingRequests(prev => prev.filter(r => r.request_id !== requestId));
          return true;
        }
        
        return false;
      } catch {
        return false;
      }
    };

    // Poll every 10 seconds for 10 minutes
    const maxAttempts = 60;
    let attempts = 0;
    
    const poll = setInterval(async () => {
      attempts++;
      const done = await checkStatus();
      if (done || attempts >= maxAttempts) {
        clearInterval(poll);
      }
    }, 10000);
  };

  // View company details
  const handleViewCompany = async (company: any) => {
    try {
      const response = await fetch(`${COMPLIANCE_API}/client/${company.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedCompany(data.client);
        setShowCompanyDetails(true);
      }
    } catch {
      setSelectedCompany(company);
      setShowCompanyDetails(true);
    }
  };

  // Refresh company data
  const handleRefreshCompany = async (companyId: string) => {
    try {
      await fetch(`${COMPLIANCE_API}/client/${companyId}/refresh`, { method: 'POST' });
      toast.success('Data refresh initiated');
      setTimeout(fetchClients, 5000);
    } catch {
      toast.error('Failed to refresh data');
    }
  };

  // Get health color
  const getHealthColor = (score: number | undefined) => {
    if (!score) return 'bg-gray-500';
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHealthLabel = (score: number | undefined) => {
    if (!score) return 'Unknown';
    if (score >= 85) return 'Healthy';
    if (score >= 70) return 'Moderate';
    return 'Critical';
  };

  // Update stats when metrics change
  useEffect(() => {
    if (metrics) {
      setStats((prevStats) =>
        prevStats.map((stat) => {
          switch (stat.id) {
            case "companies":
              return { ...stat, value: String(metrics.assigned_companies) };
            case "tasks":
              return { ...stat, value: String(metrics.active_tasks) };
            case "due":
              return { ...stat, value: String(metrics.pending_filings_week) };
            case "alerts":
              return { ...stat, value: String(metrics.high_risk_alerts) };
            case "revenue":
              return {
                ...stat,
                value: `₹${(metrics.monthly_revenue / 100000).toFixed(1)}L`,
              };
            case "plan":
              return {
                ...stat,
                value: `${metrics.assigned_companies}/${10}`,
              };
            default:
              return stat;
          }
        })
      );
    }
  }, [metrics]);

  const addCompany = async () => {
    if (!newCompanyPan.trim()) {
      toast.error("Enter valid PAN/CIN");
      return;
    }

    setIsAddingCompany(true);
    try {
      const result = await addCompanyAPI({
        pan: newCompanyPan.toUpperCase(),
        name: newCompanyPan,
        industry: "Not Specified",
      });

      if (result.success) {
        toast.success("Company added. Waiting for owner approval...");
        setNewCompanyPan("");
        // Refetch metrics after adding company
        await refetch();
      } else {
        toast.error(result.error || "Failed to add company");
      }
    } catch (error) {
      console.error("Error adding company:", error);
      toast.error("Failed to add company. Please try again.");
    } finally {
      setIsAddingCompany(false);
    }
  };

  return (
    <CAAgentOrchestratorProvider>
    <div className="min-h-screen bg-background">
      <Navbar />
      
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* In-House CA Command Center Header */}
          <CACommandCenterHeader 
            title="In-House CA Command Center"
            subtitle="In-House CA — Corporate Compliance Management"
          />

          {/* CA AI Action Inbox — Clean results from background agents */}
          <CAActionInbox />

          {/* Control Tower - Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Control Tower</h2>
                <p className="text-sm text-muted-foreground mt-1">Real-time metrics and status overview</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>

            {loading && stats.every((s) => s.value === "0" || s.value === "0/10") ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat) => (
                  <Card key={stat.id} className="glass-card border-border/50 bg-cyan-500/5 border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-card/50 ${stat.color}`}>
                          <Loader className="w-5 h-5 animate-spin" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-muted-foreground">--</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="glass-card border-border/50 hover:border-primary/30 transition-colors bg-cyan-500/5 border-cyan-500/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-card/50 ${stat.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                              <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>



          {/* Daily Governance Brief */}
          <DailyGovernanceBrief />

          {/* Live AI Drafting Engine */}
          <LiveAIDraftingEngine />

          {/* Full AI Drafting Engine — Inline trigger button */}
          <motion.div
            id="ai-drafting-engine-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-16"
          >
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="w-full group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-cyan-900/20 p-6 hover:border-purple-500/60 hover:from-purple-900/30 hover:to-cyan-900/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                      <Cpu className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-lg">REGULON AI Drafting Engine</h3>
                      <Badge className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs">LIVE v3.0</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Connected to Live AI Agent • Real-time Document Generation • CA Final Approval</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-[10px]"><Sparkles className="w-2.5 h-2.5 mr-1" />MCA Notice</Badge>
                      <Badge variant="outline" className="border-green-500/50 text-green-400 text-[10px]"><FileText className="w-2.5 h-2.5 mr-1" />GST Reply</Badge>
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-[10px]"><Calculator className="w-2.5 h-2.5 mr-1" />Income Tax</Badge>
                      <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-[10px]"><Scale className="w-2.5 h-2.5 mr-1" />RBI FEMA</Badge>
                      <Badge variant="outline" className="border-orange-500/50 text-orange-400 text-[10px]"><Shield className="w-2.5 h-2.5 mr-1" />SEBI</Badge>
                      <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-[10px]"><FileCheck className="w-2.5 h-2.5 mr-1" />Contracts</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col gap-1 text-xs">
                    <span className="flex items-center gap-1.5 text-green-400"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Backend Connected</span>
                    <span className="flex items-center gap-1.5 text-cyan-400"><Radio className="w-3 h-3 animate-pulse" />Real-time Sync Active</span>
                    <span className="flex items-center gap-1.5 text-purple-400"><Shield className="w-3 h-3" />CA Approval Required</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold text-sm shadow-[0_4px_20px_rgba(139,92,246,0.4)] group-hover:shadow-[0_4px_30px_rgba(139,92,246,0.6)] transition-all duration-300">
                    <Zap className="w-4 h-4" />
                    Open Engine
                    <ChevronUp className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </button>
          </motion.div>

          {/* AI Drafting Engine Slide-up Overlay */}
          <AnimatePresence>
            {isDrawerOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="ai-drawer-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                  onClick={() => setIsDrawerOpen(false)}
                />

                {/* Slide-up panel */}
                <motion.div
                  key="ai-drawer-panel"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 280 }}
                  className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-purple-500/30 rounded-t-2xl shadow-[0_-20px_60px_rgba(139,92,246,0.2)] max-h-[88vh] overflow-y-auto"
                >
                  {/* Sticky header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                          <Cpu className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                          REGULON AI Drafting Engine
                          <Badge className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs">LIVE v3.0</Badge>
                        </h3>
                        <p className="text-xs text-muted-foreground">Connected to Live AI Agent • Real-time Document Generation • CA Final Approval</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-green-400"><div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Backend Connected</span>
                        <span className="flex items-center gap-1.5 text-cyan-400"><Radio className="w-3 h-3 animate-pulse" />Real-time Sync Active</span>
                        <span className="flex items-center gap-1.5 text-purple-400"><Shield className="w-3 h-3" />CA Approval Required</span>
                      </div>
                      <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-2 rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Capabilities badges strip */}
                  <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-border/30 bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-cyan-900/10">
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-400"><Sparkles className="w-3 h-3 mr-1" />MCA Notice Response</Badge>
                    <Badge variant="outline" className="border-green-500/50 text-green-400"><FileText className="w-3 h-3 mr-1" />GST Show Cause Reply</Badge>
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-400"><Calculator className="w-3 h-3 mr-1" />Income Tax Response</Badge>
                    <Badge variant="outline" className="border-purple-500/50 text-purple-400"><Scale className="w-3 h-3 mr-1" />RBI FEMA Filing</Badge>
                    <Badge variant="outline" className="border-orange-500/50 text-orange-400"><Shield className="w-3 h-3 mr-1" />SEBI Compliance</Badge>
                    <Badge variant="outline" className="border-red-500/50 text-red-400"><FileWarning className="w-3 h-3 mr-1" />Customs Response</Badge>
                    <Badge variant="outline" className="border-blue-500/50 text-blue-400"><FileCheck className="w-3 h-3 mr-1" />Contract Review</Badge>
                  </div>

                  {/* Engine body */}
                  <div className="p-6">
                    <AIDraftingEngine
                      demoMode={false}
                      isRealDashboard={true}
                      includeLawyerReview={true}
                      apiEndpoint="http://localhost:3001/api/ca-dashboard"
                      openaiIntegration={true}
                      realDocumentGeneration={true}
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Client Portfolio - Consent-Based Onboarding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-16 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-1">
                  <Users className="w-6 h-6 mr-2" />
                  Client Portfolio
                  <Badge className="ml-3 bg-purple-500/20 text-purple-400 border-purple-500/50">
                    Consent-Based
                  </Badge>
                </h2>
                <p className="text-sm text-muted-foreground">Manage clients with secure consent-based data access</p>
              </div>
              <Button 
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                onClick={() => setShowOnboardModal(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Client
              </Button>
            </div>

            {/* Pending Consent Requests */}
            {pendingRequests.length > 0 && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Pending Consent Requests ({pendingRequests.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingRequests.map((req, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-yellow-500/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-medium">{req.client_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {req.identifiers?.gstin || req.identifiers?.pan || req.identifiers?.cin}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                            Awaiting Consent
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Expires: {new Date(req.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client List */}
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                {companies.length === 0 && pendingRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No companies added yet</p>
                    <p className="text-sm mb-4">Add your first client using the consent-based workflow</p>
                    <Button 
                      variant="outline" 
                      className="border-cyan-500/50 text-cyan-400"
                      onClick={() => setShowOnboardModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Onboard First Client
                    </Button>
                  </div>
                ) : companies.length > 0 ? (
                  <div className="space-y-4">
                    {/* Search and Filter */}
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Search companies..."
                        className="bg-card border-border/50 max-w-xs"
                      />
                      <Button variant="outline" size="sm">
                        All
                      </Button>
                      <Button variant="outline" size="sm" className="text-green-400">
                        Healthy
                      </Button>
                      <Button variant="outline" size="sm" className="text-yellow-400">
                        Moderate
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-400">
                        Critical
                      </Button>
                    </div>

                    {/* Company Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {companies.map((company, idx) => (
                        <motion.div
                          key={company.id || idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 transition-all cursor-pointer group"
                          onClick={() => handleViewCompany(company)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full ${getHealthColor(company.compliance_score || company.health)} flex items-center justify-center`}>
                                <Building className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm line-clamp-1">{company.company_name || company.name}</h4>
                                <p className="text-xs text-muted-foreground">{company.gstin || company.pan || 'N/A'}</p>
                                {company.industry && (
                                  <Badge variant="outline" className="mt-1 text-[10px] px-1 py-0 border-cyan-500/30 text-cyan-400">
                                    {company.industry}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge className={`${
                              company.legal_status === 'Active' || company.status === 'Active' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {company.legal_status || company.status}
                            </Badge>
                          </div>
                          
                          {/* Health Score Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Compliance Health</span>
                              <span className={`font-medium ${
                                (company.compliance_score || company.health || 0) >= 85 ? 'text-green-400' :
                                (company.compliance_score || company.health || 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {company.compliance_score || company.health || 0}%
                              </span>
                            </div>
                            <Progress 
                              value={company.compliance_score || company.health || 0} 
                              className="h-2"
                            />
                          </div>

                          {/* Health Risks & Gaps */}
                          {company.health_risks && company.health_risks.length > 0 && (
                            <div className="mb-3 p-2 rounded-lg bg-card/30 border border-border/30">
                              <p className="text-[10px] text-muted-foreground mb-1">Risk Overview</p>
                              <div className="space-y-1">
                                {company.health_risks.slice(0, 2).map((risk: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1 text-[10px]">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      risk.severity === 'critical' ? 'bg-red-500' :
                                      risk.severity === 'high' ? 'bg-orange-500' :
                                      risk.severity === 'medium' ? 'bg-yellow-500' :
                                      risk.severity === 'low' ? 'bg-blue-500' : 'bg-green-500'
                                    }`} />
                                    <span className="text-muted-foreground truncate">{risk.title}</span>
                                  </div>
                                ))}
                                {company.health_risks.length > 2 && (
                                  <p className="text-[9px] text-muted-foreground/60 pl-2.5">
                                    +{company.health_risks.length - 2} more
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Next Deadline */}
                          {company.next_deadline?.nearest && (
                            <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] text-orange-400 font-medium">Next Deadline</p>
                                <Badge className={`text-[9px] px-1 py-0 ${
                                  company.next_deadline.nearest.urgency === 'critical' ? 'bg-red-500/20 text-red-400' :
                                  company.next_deadline.nearest.urgency === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {company.next_deadline.nearest.urgency}
                                </Badge>
                              </div>
                              <p className="text-xs font-medium">{company.next_deadline.nearest.file_type}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-[10px] text-muted-foreground">
                                  Due: {new Date(company.next_deadline.nearest.due_date).toLocaleDateString()}
                                </p>
                                <p className="text-[10px] font-medium text-orange-400">
                                  {company.next_deadline.nearest.days_remaining} days left
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Quick Info */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="p-2 rounded bg-card/50">
                              <p className="text-muted-foreground">State</p>
                              <p className="font-medium">{company.state || 'N/A'}</p>
                            </div>
                            <div className="p-2 rounded bg-card/50">
                              <p className="text-muted-foreground">Last Sync</p>
                              <p className="font-medium">{company.last_sync ? new Date(company.last_sync).toLocaleDateString() : company.lastFiling || 'Pending'}</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshCompany(company.id);
                              }}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Refresh
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 text-xs text-cyan-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewCompany(company);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Onboard Client Modal */}
            <AnimatePresence>
              {showOnboardModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowOnboardModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold">Onboard New Client</h3>
                        <p className="text-sm text-muted-foreground">Consent-based secure data retrieval</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setShowOnboardModal(false)}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Workflow Steps */}
                    <div className="flex items-center gap-2 mb-6 text-xs">
                      <div className="flex items-center gap-1 text-cyan-400">
                        <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">1</div>
                        <span>Enter Details</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center">2</div>
                        <span>Client Consent</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center">3</div>
                        <span>Data Fetch</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center">4</div>
                        <span>Health Score</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Identifiers */}
                      <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                        <h4 className="text-sm font-semibold text-cyan-400 mb-3">Company Identifiers (at least one)</h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">GSTIN</label>
                            <Input
                              placeholder="e.g., 27AABCA1234C1ZS"
                              value={onboardForm.gstin}
                              onChange={(e) => setOnboardForm(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                              className="bg-card border-border/50"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">PAN</label>
                              <Input
                                placeholder="e.g., AABCA1234C"
                                value={onboardForm.pan}
                                onChange={(e) => setOnboardForm(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                                className="bg-card border-border/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">CIN</label>
                              <Input
                                placeholder="e.g., U74999KA2020PTC..."
                                value={onboardForm.cin}
                                onChange={(e) => setOnboardForm(prev => ({ ...prev, cin: e.target.value.toUpperCase() }))}
                                className="bg-card border-border/50"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                        <h4 className="text-sm font-semibold text-purple-400 mb-3">Client Contact (for consent notification)</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Company Name *</label>
                            <Input
                              placeholder="e.g., Acme Technologies Pvt. Ltd."
                              value={onboardForm.client_name}
                              onChange={(e) => setOnboardForm(prev => ({ ...prev, client_name: e.target.value }))}
                              className="bg-card border-border/50"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                              <Input
                                placeholder="finance@company.com"
                                type="email"
                                value={onboardForm.client_email}
                                onChange={(e) => setOnboardForm(prev => ({ ...prev, client_email: e.target.value }))}
                                className="bg-card border-border/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Phone (WhatsApp)</label>
                              <Input
                                placeholder="+91 98765 43210"
                                value={onboardForm.client_phone}
                                onChange={(e) => setOnboardForm(prev => ({ ...prev, client_phone: e.target.value }))}
                                className="bg-card border-border/50"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info Box */}
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                        <p className="flex items-start gap-2">
                          <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            A secure consent link will be sent via WhatsApp & Email. 
                            Data will only be fetched after client authorization.
                          </span>
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setShowOnboardModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600"
                          onClick={handleOnboardClient}
                          disabled={isOnboarding}
                        >
                          {isOnboarding ? (
                            <>
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Consent Request
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Company Details Modal */}
            <AnimatePresence>
              {showCompanyDetails && selectedCompany && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowCompanyDetails(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full ${getHealthColor(selectedCompany.compliance_score)} flex items-center justify-center`}>
                          <Building className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{selectedCompany.company_name}</h3>
                          <p className="text-sm text-muted-foreground">{selectedCompany.trade_name || selectedCompany.company_type}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setShowCompanyDetails(false)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Health Score */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Compliance Health Score</span>
                        <span className={`text-2xl font-bold ${
                          selectedCompany.compliance_score >= 85 ? 'text-green-400' :
                          selectedCompany.compliance_score >= 70 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {selectedCompany.compliance_score || 0}%
                        </span>
                      </div>
                      <Progress value={selectedCompany.compliance_score || 0} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Status: {getHealthLabel(selectedCompany.compliance_score)}
                      </p>
                    </div>

                    {/* Company Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                        <p className="text-xs text-muted-foreground">GSTIN</p>
                        <p className="font-mono">{selectedCompany.gstin || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                        <p className="text-xs text-muted-foreground">PAN</p>
                        <p className="font-mono">{selectedCompany.pan || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                        <p className="text-xs text-muted-foreground">CIN</p>
                        <p className="font-mono text-sm">{selectedCompany.cin || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge className={selectedCompany.legal_status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {selectedCompany.legal_status}
                        </Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                        <p className="text-xs text-muted-foreground">State</p>
                        <p>{selectedCompany.state || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                        <p className="text-xs text-muted-foreground">Company Type</p>
                        <p>{selectedCompany.company_type || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Health Details */}
                    {selectedCompany.health_details && (
                      <div className="space-y-4 mb-6">
                        <h4 className="font-semibold">Compliance Breakdown</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedCompany.health_details.gst && (
                            <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">GST Compliance</span>
                                <span className={`font-bold ${
                                  selectedCompany.health_details.gst.score >= 85 ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                  {selectedCompany.health_details.gst.score}%
                                </span>
                              </div>
                              <Progress value={selectedCompany.health_details.gst.score} className="h-2 mb-2" />
                              <p className="text-xs text-muted-foreground">
                                {selectedCompany.health_details.gst.on_time}/{selectedCompany.health_details.gst.total} returns on time
                              </p>
                            </div>
                          )}
                          {selectedCompany.health_details.mca && (
                            <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">MCA Compliance</span>
                                <span className={`font-bold ${
                                  selectedCompany.health_details.mca.score >= 85 ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                  {selectedCompany.health_details.mca.score}%
                                </span>
                              </div>
                              <Progress value={selectedCompany.health_details.mca.score} className="h-2 mb-2" />
                              <p className="text-xs text-muted-foreground">
                                {selectedCompany.health_details.mca.filed}/{selectedCompany.health_details.mca.total} filings complete
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Directors */}
                    {selectedCompany.directors && selectedCompany.directors.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3">Directors ({selectedCompany.directors.length})</h4>
                        <div className="space-y-2">
                          {selectedCompany.directors.map((dir: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                              <div>
                                <p className="font-medium">{dir.name}</p>
                                <p className="text-xs text-muted-foreground">DIN: {dir.din}</p>
                              </div>
                              <Badge variant="outline">{dir.designation}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleRefreshCompany(selectedCompany.id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Data
                      </Button>
                      <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Task & Filing Management - Auto-synced from Client Portfolio */}
          <TaskFilingManagement 
            isRealDashboard={true}
            apiEndpoint="http://localhost:8001/api/v1/ca/inhouse-ca-001/tasks"
            governmentIntegration={true}
          />

          {/* Client Dependency Tracker - Document & Data Tracking */}
          <ClientDependencyTracker 
            isRealDashboard={true}
            apiEndpoint="http://localhost:8001/api/v1/ca/inhouse-ca-001/dependencies"
            aiEnabled={true}
          />

          {/* Regulatory News & Rule Impact - Live Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <RegulatoryNewsRuleImpact
              isRealDashboard={true}
              apiEndpoint="http://localhost:8001/api/v1/regulatory/news"
              aiEnabled={true}
              caId="inhouse-ca-001"
            />
          </motion.div>

          {/* Compliance Health Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-16 space-y-6"
          >
            {/* Live Compliance Health Change Log Component */}
            <ComplianceHealthChangeLog
              isRealDashboard={true}
              apiEndpoint="http://localhost:8001/api/v1/ca"
              caId={'inhouse-ca-001'}
            />
          </motion.div>

          {/* Audit Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16 space-y-6"
          >
            <AuditInspectionSupport isRealDashboard={true} caId="inhouse-ca-001" />
          </motion.div>

          {/* Communication & Logs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-16 space-y-6"
          >
            <CommunicationLogsLive isRealDashboard={true} caId="inhouse-ca-001" />
          </motion.div>

          {/* CA Analytics & Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16 space-y-6"
          >
            <CAAnalyticsPerformance isRealDashboard={true} caId="inhouse-ca-001" />
          </motion.div>
      </div>
      </main>
      
      <Footer />

      {/* Regulon AI Chat Slide-in Drawer — triggered by fixed side button */}
      <AnimatePresence>
        {chatDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
              onClick={() => setChatDrawerOpen(false)}
            />
            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-[520px] bg-background border-l border-border/50 shadow-2xl z-[80] flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-gradient-to-r from-cyan-500/5 to-violet-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/20">
                    <Bot className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Regulon AI Agent</h3>
                    <p className="text-[11px] text-muted-foreground">Autonomous Compliance Executive</p>
                  </div>
                </div>
                <Button
                  size="sm" variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                  onClick={() => setChatDrawerOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Drawer Content — RegulonAIAgent */}
              <div className="flex-1 overflow-y-auto">
                <RegulonAIAgent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fixed Side Button — Chat Trigger */}
      {!chatDrawerOpen && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          onClick={() => setChatDrawerOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[65] flex items-center gap-2 px-3 py-3 rounded-l-xl border border-r-0 border-cyan-500/25 transition-all hover:px-4 group"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.12) 100%)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(6,182,212,0.15), 0 0 8px rgba(6,182,212,0.1)',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
          }}
          title="Open Regulon AI Agent Chat"
        >
          <Bot className="w-4 h-4 text-cyan-400 rotate-90" />
          <span className="text-[11px] font-bold tracking-wider text-cyan-300 group-hover:text-cyan-200">
            AI Agent
          </span>
          <motion.span
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      )}
    </div>
    </CAAgentOrchestratorProvider>
  );
};

export default InhouseCADashboardReal;
