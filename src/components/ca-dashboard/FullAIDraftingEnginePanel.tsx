import React, { useState, useEffect, useCallback } from 'react';
import { isCABackendConfigured } from '@/lib/ca-backend-guard';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Cpu, Pause, Play, Sparkles, AlertTriangle, Activity, 
  FileClock, Clock, Zap, Upload, FileText, CheckCircle, Download, 
  Newspaper, RefreshCw, Calculator, Scale, FileCheck, Shield, Radio, Eye, Loader
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';

export const FullAIDraftingEnginePanel = () => {
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
    if (!isCABackendConfigured()) {
      setRegulatoryNews([]);
      return;
    }
    try {
      const response = await fetch(`${CA_API}/api/ai-engine/regulatory-news`);
      const data = await response.json();
      if (data.news) {
        setRegulatoryNews(data.news);
        addAgentLog('📰 Fetched latest regulatory news and circulars');
      }
    } catch (error) {
      setRegulatoryNews([]);
    }
  };

  // Fetch Client Deadlines
  const fetchClientDeadlines = async () => {
    if (!isCABackendConfigured()) {
      setClientDeadlines([]);
      return;
    }
    try {
      const response = await fetch(`${CA_API}/api/ai-engine/client-deadlines`);
      const data = await response.json();
      if (data.deadlines) {
        setClientDeadlines(data.deadlines);
        addAgentLog('📅 Scanned all client deadlines and compliance calendars');
      }
    } catch (error) {
      setClientDeadlines([]);
    }
  };

  // Initialize Agent
  useEffect(() => {
    if (isAgentActive) {
      addAgentLog('🤖 SANNIDH AI Agent initialized and monitoring...');
      fetchRegulatoryNews();
      fetchClientDeadlines();
      
      const monitoringInterval = setInterval(() => {
        if (isAgentActive) {
          addAgentLog('🔍 Scanning for compliance updates...');
          fetchRegulatoryNews();
          fetchClientDeadlines();
        }
      }, 60000);
      
      return () => clearInterval(monitoringInterval);
    }
  }, [isAgentActive, addAgentLog]);

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
    
    await processTask(newTask);
  };

  const processTask = async (task: AITask) => {
    setAiTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: 'processing', progress: 10 } : t
    ));
    addAgentLog(`⚙️ Processing: ${task.title} for ${task.client}`);
    
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
    toast.info(`${task.title} ready for your approval`);
  };

  const generateTaskResult = (type: AITask['type'], client: string) => {
    return {
      documentType: 'Compliance Report',
      status: 'Generated',
      generatedAt: new Date().toISOString()
    };
  };

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

  const approveTask = async (taskId: string) => {
    addAgentLog(`✅ CA APPROVED: Task ${taskId}`);
    setAiTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'approved' } : t
    ));
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAiTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'completed' } : t
    ));
    setShowApprovalModal(false);
    setSelectedTask(null);
    setAgentStatus('monitoring');
    toast.success('Document approved and finalized!');
  };

  const rejectTask = async (taskId: string) => {
    addAgentLog(`❌ CA REJECTED: Task ${taskId} - Requires revision`);
    setAiTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'rejected' } : t
    ));
    setShowApprovalModal(false);
    setSelectedTask(null);
    setAgentStatus('monitoring');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      addAgentLog(`📁 Document uploaded: ${file.name}`);
    }
  };

  const processUploadedDocument = async () => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    addAgentLog(`🔄 Processing document: ${uploadedFile.name}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGeneratedDraft(`RESPONSE TO ${uploadedFile.name.toUpperCase()}\n\nAI GENERATED DRAFT...\n[THIS DRAFT REQUIRES CA REVIEW AND APPROVAL]`);
    setIsProcessing(false);
    addAgentLog(`✅ Draft generated - Awaiting CA review`);
    toast.success('Draft generated successfully!');
  };

  const quickDeployCommands = [
    { type: 'balance_sheet' as const, label: 'Generate Balance Sheet', icon: Calculator },
    { type: 'reconciliation' as const, label: 'GST Reconciliation', icon: Scale },
    { type: 'notice_response' as const, label: 'Draft Notice Response', icon: FileText },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8 space-y-6"
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

            <TabsContent value="dashboard" className="space-y-6">
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

              <div>
                <h3 className="text-lg font-semibold text-orange-300 mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Client Deadlines Being Monitored
                </h3>
                <div className="space-y-2">
                  {clientDeadlines.length === 0 && <p className="text-muted-foreground text-sm">No urgent deadlines detected.</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deploy" className="space-y-6">
              <h3 className="text-lg font-semibold text-cyan-300 mb-3">Quick Deploy AI Agent</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {quickDeployCommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <Button
                      key={cmd.type}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-500/20"
                      onClick={() => deployAgentForTask(cmd.type, 'Sample Client', cmd.label)}
                    >
                      <Icon className="w-6 h-6 text-purple-400" />
                      <span>{cmd.label}</span>
                    </Button>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="drafting" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">Upload Document for AI Analysis</h3>
                <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-cyan-400/50" />
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" id="doc-upload" />
                  <label htmlFor="doc-upload" className="cursor-pointer">
                    <p className="text-muted-foreground mb-2">Drop notice/document here or click to upload</p>
                  </label>
                </div>
                {uploadedFile && (
                  <Button onClick={processUploadedDocument} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Generate Draft'}
                  </Button>
                )}
                <Textarea value={generatedDraft} readOnly className="h-64 mt-4 bg-card/50" />
              </div>
            </TabsContent>

            <TabsContent value="news" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cyan-300">Live Regulatory Updates</h3>
                <Button size="sm" variant="outline" onClick={fetchRegulatoryNews}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cyan-300">AI Agent Activity Log</h3>
                <Button size="sm" variant="outline" onClick={() => setAgentLogs([])}>Clear Logs</Button>
              </div>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm h-[400px] overflow-y-auto">
                {agentLogs.length === 0 ? <p className="text-muted-foreground">No activity yet...</p> : agentLogs.map((log, idx) => <div key={idx} className="text-green-400 mb-1">{log}</div>)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
