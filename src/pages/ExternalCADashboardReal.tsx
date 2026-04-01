import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RegulonAIAgent from "@/components/ai-agent/RegulonAIAgent";
import AIDraftingEngine from "@/components/ca-dashboard/AIDraftingEngine";
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
  ArrowRight,
  X,
  Upload,
  Send,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import useCAMetrics from "@/hooks/useCAMetrics";
import { addCompany as addCompanyAPI } from "@/services/api";

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
      // Use demo data if backend not available
      setRegulatoryNews([
        {
          id: 'news-1',
          title: 'GST Council Meeting: New ITC Rules Announced',
          source: 'Ministry of Finance',
          category: 'GST',
          date: new Date().toISOString(),
          impact: 'high',
          summary: 'New Input Tax Credit claiming procedures announced effective from next quarter.'
        },
        {
          id: 'news-2',
          title: 'Income Tax Department Issues New TDS Guidelines',
          source: 'CBDT',
          category: 'Income Tax',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          impact: 'medium',
          summary: 'Updated TDS rates and filing requirements for FY 2026-27.'
        },
        {
          id: 'news-3',
          title: 'MCA Compliance Calendar Update',
          source: 'Ministry of Corporate Affairs',
          category: 'MCA',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          impact: 'high',
          summary: 'Annual return filing deadline extended by 15 days for all companies.'
        }
      ]);
      addAgentLog('📰 Loaded regulatory news from cache');
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
      // Use demo data
      setClientDeadlines([
        {
          id: 'dl-1',
          client: 'TechVenture Private Limited',
          type: 'GSTR-3B Filing',
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 2,
          status: 'urgent'
        },
        {
          id: 'dl-2',
          client: 'Digital Solutions India',
          type: 'Quarterly TDS Return',
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 5,
          status: 'upcoming'
        },
        {
          id: 'dl-3',
          client: 'Global Exports Pvt Ltd',
          type: 'Annual Audit Submission',
          deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 1,
          status: 'urgent'
        }
      ]);
      addAgentLog('📅 Loaded client deadlines from portfolio data');
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
                      id="document-upload"
                    />
                    <label htmlFor="document-upload" className="cursor-pointer">
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
                    <div className="flex gap-2">
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

const ExternalCADashboardReal = () => {
  const navigate = useNavigate();
  const { metrics, loading, refetch } = useCAMetrics();

  // Role-based access control
  useEffect(() => {
    const userRole = localStorage.getItem("current_user_role");
    if (userRole !== "external_ca") {
      navigate("/dashboard");
      return;
    }
  }, [navigate]);

  const [stats, setStats] = useState([
    { id: "companies", label: "Assigned Companies", value: "0", icon: Building, color: "text-cyan-400" },
    { id: "tasks", label: "Pending Tasks", value: "0", icon: FileText, color: "text-yellow-400" },
    { id: "due", label: "Due in 7 Days", value: "0", icon: Clock, color: "text-orange-400" },
    { id: "alerts", label: "High-Risk Alerts", value: "0", icon: AlertTriangle, color: "text-red-400" },
    { id: "revenue", label: "Revenue This Month", value: "₹0", icon: DollarSign, color: "text-green-400" },
    { id: "plan", label: "Plan Limit", value: "0/10", icon: CreditCard, color: "text-primary" },
  ]);

  const [companies, setCompanies] = useState<any[]>([]);
  const [newCompanyPan, setNewCompanyPan] = useState("");
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [draftText, setDraftText] = useState("");

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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-foreground">External CA Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage all assigned companies and compliance tasks from one control center.</p>
          </motion.div>

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

          {/* Regulon AI Executive Agent - AUTONOMOUS SYSTEM */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-16"
          >
            <RegulonAIAgent />
          </motion.div>

          {/* Daily Governance Brief */}
          <DailyGovernanceBrief />

          {/* Live AI Drafting Engine */}
          <LiveAIDraftingEngine />

          {/* Full AI Drafting Engine from CA Demo Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-16"
          >
            <AIDraftingEngine />
          </motion.div>

          {/* Client Portfolio */}
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
                </h2>
                <p className="text-sm text-muted-foreground">Manage and monitor all assigned companies</p>
              </div>
              <Button className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-1" />
                Add Company
              </Button>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Enter PAN/CIN..."
                    value={newCompanyPan}
                    onChange={(e) => setNewCompanyPan(e.target.value)}
                    className="bg-card border-border/50"
                    disabled={isAddingCompany}
                  />
                  <Button
                    onClick={addCompany}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isAddingCompany}
                  >
                    {isAddingCompany ? (
                      <>
                        <Loader className="w-4 h-4 mr-1 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
                
                {companies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No companies added yet</p>
                    <p className="text-sm">Add your first client to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead>Company Name</TableHead>
                        <TableHead>Health Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Filing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company, idx) => (
                        <TableRow key={idx} className="border-border/50">
                          <TableCell>{company.name}</TableCell>
                          <TableCell>{company.health}%</TableCell>
                          <TableCell><Badge>{company.status}</Badge></TableCell>
                          <TableCell>{company.lastFiling}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Task & Filing Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <Clock className="w-6 h-6 mr-2" />
                Task & Filing Management
              </h2>
              <p className="text-sm text-muted-foreground">Track and manage compliance filing deadlines</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Once you add companies, tasks will be synced automatically</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Document Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <Search className="w-6 h-6 mr-2" />
                Document Tracker
              </h2>
              <p className="text-sm text-muted-foreground">Track document submission status from clients</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Once you add companies, documents will be tracked automatically</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Regulatory News */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 mr-2" />
                Regulatory News & Rule Impact
              </h2>
              <p className="text-sm text-muted-foreground">Latest compliance updates and regulatory changes</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Regulatory news will be populated from government sources</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Compliance Health Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <TrendingUp className="w-6 h-6 mr-2" />
                Compliance Health Change Log
              </h2>
              <p className="text-sm text-muted-foreground">Historical tracking of compliance score changes</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Health changes will be logged automatically</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Audit Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <Check className="w-6 h-6 mr-2" />
                Audit, Inspection & Due Diligence Support
              </h2>
              <p className="text-sm text-muted-foreground">Support for government audits and inspections</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <Check className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Audit records will be populated as they occur</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Communication & Logs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <MessageSquare className="w-6 h-6 mr-2" />
                Communication & Logs
              </h2>
              <p className="text-sm text-muted-foreground">All client communications and system logs</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Communications will be logged automatically</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CA Analytics & Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 flex items-center mb-4">
                <BarChart3 className="w-6 h-6 mr-2" />
                CA Analytics & Performance
              </h2>
              <p className="text-sm text-muted-foreground">Your performance metrics and analytics dashboard</p>
            </div>
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="text-center py-16 text-muted-foreground">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Data will appear here</p>
                  <p className="text-sm">Analytics will be calculated as data is collected</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ExternalCADashboardReal;
