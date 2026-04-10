/**
 * REAL COMPANY DASHBOARD
 * =====================
 * This is the LIVE dashboard for registered companies.
 * - Each company gets their own isolated dashboard
 * - All data fetched from real backend API
 * - NO mock data - everything is live
 * - Separated from Demo Company Dashboard
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RegulonAIAgent from "@/components/ai-agent/RegulonAIAgent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, 
  Bell, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Upload,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  Building2,
  FileWarning,
  Lightbulb,
  Target,
  DollarSign,
  Zap,
  Eye,
  Download,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  Info,
  Folder,
  Lock,
  Unlock,
  BarChart3,
  Activity,
  Users,
  Scale,
  Briefcase,
  Globe,
  PieChart,
  LineChart,
  X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AgentOrchestratorProvider, AGENT_SECTION_MAP } from "@/components/agents/CompanyAgentOrchestrator";
import { CommandCenterHeader } from "@/components/agents/CommandCenterHeader";

import { CompanyActionInbox } from "@/components/agents/CompanyActionInbox";
import { SectionAgentBadge } from "@/components/agents/SectionAgentBadge";
import { AgentInsightDrawer } from "@/components/agents/AgentInsightDrawer";

// ========================================
// TYPES
// ========================================

interface CompanyData {
  id: string;
  company_name: string;
  industry: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  compliance_score: number;
  health_status: 'green' | 'yellow' | 'red' | 'unknown';
  registration_date?: string;
  state?: string;
  company_type?: string;
}

interface AIMessage {
  id: string;
  type: 'notification' | 'reminder' | 'alert' | 'insight';
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  action_required: boolean;
  action_label?: string;
}

interface RegulatoryExposure {
  id: string;
  regulator: string;
  status: 'active' | 'potential' | 'inactive';
  risk_level: 'high' | 'medium' | 'low';
  last_filing?: string;
  next_deadline?: string;
  notes: string;
}

interface BusinessInsight {
  id: string;
  category: 'growth' | 'cost_saving' | 'risk' | 'opportunity' | 'efficiency';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  potential_savings?: string;
}

interface ComplianceGap {
  id: string;
  area: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  deadline?: string;
  action_required: string;
  estimated_penalty?: string;
}

interface RegulatoryImpact {
  id: string;
  title: string;
  source: string;
  effective_date: string;
  action_deadline?: string;
  impact_score: number;
  description: string;
  affected_areas: string[];
  company_exposure: 'high' | 'medium' | 'low';
}

interface AuditRecord {
  id: string;
  audit_type: string;
  authority: string;
  status: 'ready' | 'partial' | 'not_ready';
  documents_ready: number;
  documents_required: number;
  last_inspection?: string;
  next_review?: string;
  notes: string;
}

interface ComplianceTask {
  id: string;
  title: string;
  regulator: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  due_date: string;
  assigned_to?: string;
  description?: string;
}

interface Document {
  id: string;
  name: string;
  file_type: string;
  category: string;
  regulator: string;
  status: 'approved' | 'pending' | 'rejected' | 'expired';
  uploaded_at: string;
  expires_at?: string;
  size?: string;
}

// ========================================
// API SERVICE
// ========================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

const companyAPI = {
  // Get company profile
  getProfile: async (companyId: string): Promise<CompanyData | null> => {
    try {
      const response = await fetch(`${API_BASE}/company/${companyId}/profile`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching company profile:', error);
      return null;
    }
  },

  // Get AI messages/notifications
  getAIMessages: async (companyId: string): Promise<AIMessage[]> => {
    try {
      const response = await fetch(`${API_BASE}/company/${companyId}/ai-messages`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching AI messages:', error);
      return [];
    }
  },

  // Get regulatory exposures
  getExposures: async (companyId: string): Promise<RegulatoryExposure[]> => {
    try {
      const response = await fetch(`${API_BASE}/company/${companyId}/regulatory-exposures`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching exposures:', error);
      return [];
    }
  },

  // Get business insights
  getBusinessInsights: async (companyId: string): Promise<BusinessInsight[]> => {
    try {
      const response = await fetch(`${API_BASE}/company/${companyId}/business-insights`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching business insights:', error);
      return [];
    }
  },

  // Get compliance gaps
  getComplianceGaps: async (companyId: string): Promise<ComplianceGap[]> => {
    try {
      const response = await fetch(`${API_BASE}/company/${companyId}/compliance-gaps`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching compliance gaps:', error);
      return [];
    }
  },

  // Get regulatory impacts
  getRegulatoryImpacts: async (companyId: string): Promise<RegulatoryImpact[]> => {
    try {
      const response = await fetch(`${API_BASE}/company/${companyId}/regulatory-impacts`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching regulatory impacts:', error);
      return [];
    }
  },

  // Get audit records
  getAuditRecords: async (companyId: string): Promise<AuditRecord[]> => {
    try {
      const response = await fetch(`${API_BASE}/company/${companyId}/audit-records`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching audit records:', error);
      return [];
    }
  },

  // Get compliance tasks
  getTasks: async (companyId: string): Promise<ComplianceTask[]> => {
    try {
      const response = await fetch(`${API_BASE}/company/${companyId}/tasks`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  // Get documents
  getDocuments: async (companyId: string): Promise<Document[]> => {
    try {
      const response = await fetch(`${API_BASE}/company/${companyId}/documents`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  },

  // Send message to CA
  sendMessageToCA: async (companyId: string, message: string, urgent: boolean): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/company/${companyId}/send-ca-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, urgent, timestamp: new Date().toISOString() })
      });
      return response.ok;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  },

  // Upload document
  uploadDocument: async (companyId: string, file: File, category: string): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      
      const response = await fetch(`${API_BASE}/company/${companyId}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      return response.ok;
    } catch (error) {
      console.error('Error uploading document:', error);
      return false;
    }
  }
};

// ========================================
// HELPER COMPONENTS
// ========================================

const HealthScoreBadge = ({ score, status }: { score: number; status: string }) => {
  const getColor = () => {
    if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (score >= 40) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getColor()}`}>
      <Activity className="w-4 h-4" />
      <span className="font-bold text-lg">{score}%</span>
      <span className="text-xs opacity-80">Health Score</span>
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30'
  };

  return (
    <Badge className={`${styles[priority] || styles.medium} border`}>
      {priority.toUpperCase()}
    </Badge>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    ready: 'bg-green-500/20 text-green-400',
    completed: 'bg-green-500/20 text-green-400',
    approved: 'bg-green-500/20 text-green-400',
    active: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    partial: 'bg-yellow-500/20 text-yellow-400',
    potential: 'bg-purple-500/20 text-purple-400',
    not_ready: 'bg-red-500/20 text-red-400',
    overdue: 'bg-red-500/20 text-red-400',
    rejected: 'bg-red-500/20 text-red-400',
    expired: 'bg-gray-500/20 text-gray-400',
    inactive: 'bg-gray-500/20 text-gray-400'
  };

  return (
    <Badge className={styles[status] || 'bg-gray-500/20 text-gray-400'}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};

const EmptyState = ({ title, description, icon: Icon }: { title: string; description: string; icon: any }) => (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      <Icon className="w-8 h-8 text-primary" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm max-w-md mx-auto">{description}</p>
  </div>
);

// ========================================
// SECTION COMPONENTS
// ========================================

// Section 1: Regulon AI Compliance Partner
const RegulonAIPartnerSection = ({ 
  companyId, 
  companyName,
  messages,
  onRefresh,
  isLoading 
}: { 
  companyId: string;
  companyName: string;
  messages: AIMessage[];
  onRefresh: () => void;
  isLoading: boolean;
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleSendToCA = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    const success = await companyAPI.sendMessageToCA(companyId, newMessage, isUrgent);
    setSending(false);

    if (success) {
      toast({
        title: "Message Sent",
        description: isUrgent 
          ? "Your urgent message has been sent to your CA. They will be notified immediately."
          : "Your message has been sent to your CA.",
      });
      setNewMessage('');
      setIsUrgent(false);
    } else {
      toast({
        title: "Failed to Send",
        description: "Could not send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Regulon Compliance Partner
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>Your AI-powered compliance assistant</span>
                  <SectionAgentBadge agentId="ARIA" />
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="space-y-4">
                {/* Welcome Message */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-sm">
                    Good morning, <span className="font-semibold text-primary">{companyName}</span>! 
                    I'm your Regulon Compliance Partner. I monitor your regulatory obligations 24/7 
                    and will alert you to important deadlines, changes, and opportunities.
                  </p>
                </div>

                {/* Notifications/Messages */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    Recent Alerts & Notifications
                  </h4>
                  
                  {messages.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-3 rounded-lg border ${
                            msg.priority === 'critical' 
                              ? 'bg-red-500/10 border-red-500/30' 
                              : msg.priority === 'high'
                              ? 'bg-orange-500/10 border-orange-500/30'
                              : 'bg-muted/50 border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2">
                              {msg.type === 'alert' && <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />}
                              {msg.type === 'notification' && <Bell className="w-4 h-4 text-blue-400 mt-0.5" />}
                              {msg.type === 'reminder' && <Clock className="w-4 h-4 text-yellow-400 mt-0.5" />}
                              {msg.type === 'insight' && <Lightbulb className="w-4 h-4 text-green-400 mt-0.5" />}
                              <div>
                                <p className="text-sm font-medium">{msg.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{msg.message}</p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                          </div>
                          {msg.action_required && msg.action_label && (
                            <Button size="sm" variant="outline" className="mt-2 text-xs h-7">
                              {msg.action_label}
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                      <p className="text-xs">Your compliance partner will notify you of important updates</p>
                    </div>
                  )}
                </div>

                {/* ARIA Agent Insights */}
                <AgentInsightDrawer agentId="ARIA" />

                {/* Send Message to CA */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Send Message to Your CA
                  </h4>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Type your message to your Chartered Accountant..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isUrgent}
                          onChange={(e) => setIsUrgent(e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          Mark as Urgent (Due Today)
                        </span>
                      </label>
                      <Button 
                        onClick={handleSendToCA} 
                        disabled={!newMessage.trim() || sending}
                        className="gap-2"
                      >
                        {sending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Send to CA
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Section 2: Company Profile & Health Score
const CompanyProfileSection = ({ company, isLoading }: { company: CompanyData | null; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-8">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState 
            title="Company Profile Not Found" 
            description="Please complete your registration to see your company profile."
            icon={Building2}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">{company.company_name}</h2>
                  <SectionAgentBadge agentId="ATLAS" compact />
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <span>{company.industry || 'Industry not specified'}</span>
                  {company.company_type && (
                    <>
                      <span className="text-border">•</span>
                      <span>{company.company_type}</span>
                    </>
                  )}
                </p>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {company.gstin && (
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">GSTIN</Badge>
                      {company.gstin}
                    </span>
                  )}
                  {company.pan && (
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">PAN</Badge>
                      {company.pan}
                    </span>
                  )}
                  {company.cin && (
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">CIN</Badge>
                      {company.cin}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <HealthScoreBadge score={company.compliance_score} status={company.health_status} />
              <div className="w-48">
                <Progress value={company.compliance_score} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground">
                {company.compliance_score >= 80 ? 'Excellent compliance health' :
                 company.compliance_score >= 60 ? 'Good compliance health' :
                 company.compliance_score >= 40 ? 'Needs attention' :
                 'Critical - immediate action required'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Section 3: Regulatory Exposure
const RegulatoryExposureSection = ({ 
  exposures, 
  isLoading 
}: { 
  exposures: RegulatoryExposure[];
  isLoading: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader><div className="h-6 bg-muted rounded w-1/4" /></CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const regulatorIcons: Record<string, any> = {
    'MCA': Scale,
    'GST': FileText,
    'Income Tax': DollarSign,
    'RBI': Building2,
    'SEBI': TrendingUp,
    'EPFO': Users,
    'ESIC': Shield,
    'Labour': Briefcase
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Regulatory Exposure</CardTitle>
              <SectionAgentBadge agentId="SENTINEL" compact />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          <CardDescription>Your company's regulatory landscape powered by AI analysis</CardDescription>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent>
                {exposures.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {exposures.map((exposure) => {
                      const Icon = regulatorIcons[exposure.regulator] || Globe;
                      return (
                        <motion.div
                          key={exposure.id}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 rounded-xl border ${
                            exposure.status === 'active' 
                              ? 'border-green-500/30 bg-green-500/5' 
                              : exposure.status === 'potential'
                              ? 'border-purple-500/30 bg-purple-500/5'
                              : 'border-gray-500/30 bg-gray-500/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-5 h-5 text-primary" />
                            <span className="font-semibold text-sm">{exposure.regulator}</span>
                          </div>
                          <StatusBadge status={exposure.status} />
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{exposure.notes}</p>
                          {exposure.next_deadline && (
                            <div className="mt-2 text-xs flex items-center gap-1 text-yellow-400">
                              <Clock className="w-3 h-3" />
                              Next: {exposure.next_deadline}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState 
                    title="No Regulatory Exposure Data" 
                    description="Your regulatory exposure will be analyzed once your company data is synced."
                    icon={Shield}
                  />
                )}

                {/* SENTINEL Agent Insights */}
                <AgentInsightDrawer agentId="SENTINEL" />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Section 4: AI Business Intelligence
const AIBusinessIntelligenceSection = ({ 
  insights, 
  companyName,
  isLoading 
}: { 
  insights: BusinessInsight[];
  companyName: string;
  isLoading: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const filteredInsights = activeTab === 'all' 
    ? insights 
    : insights.filter(i => i.category === activeTab);

  const categoryIcons: Record<string, any> = {
    growth: TrendingUp,
    cost_saving: DollarSign,
    risk: AlertTriangle,
    opportunity: Lightbulb,
    efficiency: Zap
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-background to-background">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Business Intelligence
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">LIVE</Badge>
                  <SectionAgentBadge agentId="CORTEX" compact />
                </CardTitle>
                <CardDescription>Strategic insights for {companyName}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : insights.length > 0 ? (
                  <>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid grid-cols-6 w-full">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="growth">Growth</TabsTrigger>
                        <TabsTrigger value="cost_saving">Savings</TabsTrigger>
                        <TabsTrigger value="risk">Risks</TabsTrigger>
                        <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
                        <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {filteredInsights.map((insight) => {
                        const Icon = categoryIcons[insight.category] || Lightbulb;
                        return (
                          <motion.div
                            key={insight.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                insight.category === 'growth' ? 'bg-green-500/20' :
                                insight.category === 'cost_saving' ? 'bg-blue-500/20' :
                                insight.category === 'risk' ? 'bg-red-500/20' :
                                insight.category === 'opportunity' ? 'bg-purple-500/20' :
                                'bg-yellow-500/20'
                              }`}>
                                <Icon className={`w-4 h-4 ${
                                  insight.category === 'growth' ? 'text-green-400' :
                                  insight.category === 'cost_saving' ? 'text-blue-400' :
                                  insight.category === 'risk' ? 'text-red-400' :
                                  insight.category === 'opportunity' ? 'text-purple-400' :
                                  'text-yellow-400'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                                  <PriorityBadge priority={insight.impact} />
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                                <div className="p-2 rounded bg-primary/10 border border-primary/20">
                                  <p className="text-xs text-primary flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    <span className="font-medium">Recommendation:</span> {insight.recommendation}
                                  </p>
                                </div>
                                {insight.potential_savings && (
                                  <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    Potential Savings: {insight.potential_savings}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <EmptyState 
                    title="No Business Insights Yet" 
                    description="Our AI is analyzing your business data. Check back soon for personalized insights on growth, savings, and optimization opportunities."
                    icon={Sparkles}
                  />
                )}

                {/* CORTEX Agent Insights */}
                <AgentInsightDrawer agentId="CORTEX" />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Section 5: Compliance Gaps (Why Compliance is Incomplete)
const ComplianceGapsSection = ({ 
  gaps, 
  isLoading 
}: { 
  gaps: ComplianceGap[];
  isLoading: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);

  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const sortedGaps = [...gaps].sort((a, b) => 
    severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className={gaps.some(g => g.severity === 'critical') ? 'border-red-500/30' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-orange-400" />
              <CardTitle>Why Is Your Compliance Incomplete?</CardTitle>
              <SectionAgentBadge agentId="GUARDIAN" compact />
              {gaps.length > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {gaps.length} Gap{gaps.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          <CardDescription>AI-identified gaps in your compliance posture</CardDescription>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : sortedGaps.length > 0 ? (
                  <div className="space-y-3">
                    {sortedGaps.map((gap) => (
                      <motion.div
                        key={gap.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg border ${
                          gap.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                          gap.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                          gap.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                          'bg-muted/50 border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{gap.area}</span>
                              <PriorityBadge priority={gap.severity} />
                            </div>
                            <p className="text-sm text-muted-foreground">{gap.description}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs">
                              {gap.deadline && (
                                <span className="flex items-center gap-1 text-yellow-400">
                                  <Clock className="w-3 h-3" />
                                  Deadline: {gap.deadline}
                                </span>
                              )}
                              {gap.estimated_penalty && (
                                <span className="flex items-center gap-1 text-red-400">
                                  <AlertTriangle className="w-3 h-3" />
                                  Potential Penalty: {gap.estimated_penalty}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="shrink-0">
                            Fix Now
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                        <p className="text-xs text-primary mt-2 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Action Required: {gap.action_required}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Compliance Gaps Detected</h3>
                    <p className="text-muted-foreground text-sm">Great job! Your compliance posture looks healthy.</p>
                  </div>
                )}

                {/* GUARDIAN Agent Insights */}
                <AgentInsightDrawer agentId="GUARDIAN" />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Section 6: Upcoming Regulatory Impact
const RegulatoryImpactSection = ({ 
  impacts, 
  isLoading 
}: { 
  impacts: RegulatoryImpact[];
  isLoading: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <CardTitle>Upcoming Regulatory Impact</CardTitle>
              <SectionAgentBadge agentId="NEXUS" compact />
              {impacts.length > 0 && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {impacts.length} Update{impacts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          <CardDescription>Regulatory changes that may affect your business</CardDescription>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : impacts.length > 0 ? (
                  <div className="space-y-3">
                    {impacts.map((impact) => (
                      <motion.div
                        key={impact.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{impact.title}</h4>
                              <Badge variant="outline" className="text-xs">{impact.source}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{impact.description}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-sm font-bold ${
                              impact.impact_score >= 7 ? 'text-red-400' :
                              impact.impact_score >= 4 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {impact.impact_score.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">/10</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            Effective: {impact.effective_date}
                          </span>
                          {impact.action_deadline && (
                            <span className="flex items-center gap-1 text-orange-400">
                              <Clock className="w-3 h-3" />
                              Action by: {impact.action_deadline}
                            </span>
                          )}
                          <StatusBadge status={impact.company_exposure} />
                        </div>
                        {impact.affected_areas.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {impact.affected_areas.map((area, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="No Upcoming Regulatory Changes" 
                    description="We're monitoring regulatory sources. You'll be notified of any changes that affect your business."
                    icon={Globe}
                  />
                )}

                {/* NEXUS Agent Insights */}
                <AgentInsightDrawer agentId="NEXUS" />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Section 7: Audit & Inspection Ready Record
const AuditReadySection = ({ 
  records, 
  isLoading 
}: { 
  records: AuditRecord[];
  isLoading: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              <CardTitle>Audit & Inspection Ready Record</CardTitle>
              <SectionAgentBadge agentId="VANGUARD" compact />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          <CardDescription>Your readiness for regulatory audits and inspections</CardDescription>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-32 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : records.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {records.map((record) => (
                      <motion.div
                        key={record.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-xl border ${
                          record.status === 'ready' ? 'border-green-500/30 bg-green-500/5' :
                          record.status === 'partial' ? 'border-yellow-500/30 bg-yellow-500/5' :
                          'border-red-500/30 bg-red-500/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{record.audit_type}</span>
                          <StatusBadge status={record.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{record.authority}</p>
                        
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Documents Ready</span>
                            <span>{record.documents_ready}/{record.documents_required}</span>
                          </div>
                          <Progress 
                            value={(record.documents_ready / record.documents_required) * 100} 
                            className="h-1.5" 
                          />
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          {record.last_inspection && (
                            <p className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last: {record.last_inspection}
                            </p>
                          )}
                          {record.next_review && (
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Next Review: {record.next_review}
                            </p>
                          )}
                        </div>
                        <p className="text-xs mt-2 line-clamp-2">{record.notes}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    title="No Audit Records Yet" 
                    description="Your audit readiness status will appear here once compliance data is synced."
                    icon={Eye}
                  />
                )}

                {/* VANGUARD Agent Insights */}
                <AgentInsightDrawer agentId="VANGUARD" />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Section 8: Quick Actions
const QuickActionsSection = ({ companyId }: { companyId: string }) => {
  const actions = [
    { icon: Upload, label: 'Upload Document', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { icon: FileText, label: 'View All Filings', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    { icon: MessageSquare, label: 'Contact CA', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { icon: Calendar, label: 'View Calendar', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    { icon: BarChart3, label: 'Compliance Report', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    { icon: Shield, label: 'Security Check', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <CardTitle>Quick Actions</CardTitle>
            <SectionAgentBadge agentId="FORGE" compact />
          </div>
          <CardDescription>Frequently used actions for your compliance management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {actions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-xl border border-border bg-muted/50 hover:border-primary/30 hover:bg-muted transition-all flex flex-col items-center gap-2"
              >
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-xs font-medium text-center">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Section 9: Active Compliance Tasks
const ComplianceTasksSection = ({ 
  tasks, 
  isLoading 
}: { 
  tasks: ComplianceTask[];
  isLoading: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filter);

  const priorityOrder = ['critical', 'high', 'medium', 'low'];
  const sortedTasks = [...filteredTasks].sort((a, b) => 
    priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <CardTitle>Active Compliance Tasks</CardTitle>
              <SectionAgentBadge agentId="NEXTSTEP" compact />
              {tasks.length > 0 && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {tasks.filter(t => t.status !== 'completed').length} Active
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          <CardDescription>Track and manage your compliance obligations</CardDescription>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="h-14 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : tasks.length > 0 ? (
                  <>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {['all', 'pending', 'in_progress', 'overdue', 'completed'].map((f) => (
                        <Button
                          key={f}
                          size="sm"
                          variant={filter === f ? 'default' : 'outline'}
                          onClick={() => setFilter(f)}
                          className="text-xs"
                        >
                          {f === 'all' ? 'All' : f.replace('_', ' ').toUpperCase()}
                        </Button>
                      ))}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Task</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Regulator</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Priority</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Due Date</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedTasks.map((task) => (
                            <motion.tr
                              key={task.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-b border-border/50 hover:bg-muted/50"
                            >
                              <td className="py-3 px-3">
                                <span className="font-medium text-sm">{task.title}</span>
                              </td>
                              <td className="py-3 px-3">
                                <Badge variant="outline" className="text-xs">{task.regulator}</Badge>
                              </td>
                              <td className="py-3 px-3">
                                <PriorityBadge priority={task.priority} />
                              </td>
                              <td className="py-3 px-3">
                                <StatusBadge status={task.status} />
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-sm ${task.status === 'overdue' ? 'text-red-400' : ''}`}>
                                  {task.due_date}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <Button size="sm" variant="ghost">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <EmptyState 
                    title="No Active Tasks" 
                    description="Your compliance tasks will appear here once your company data is synced."
                    icon={CheckCircle2}
                  />
                )}

                {/* NEXTSTEP Agent Insights */}
                <AgentInsightDrawer agentId="NEXTSTEP" />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Section 10: Document Vault
const DocumentVaultSection = ({ 
  documents, 
  companyId,
  isLoading,
  onRefresh
}: { 
  documents: Document[];
  companyId: string;
  isLoading: boolean;
  onRefresh: () => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filteredDocs = filter === 'all' 
    ? documents 
    : documents.filter(d => d.status === filter);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const success = await companyAPI.uploadDocument(companyId, file, 'general');
    setUploading(false);

    if (success) {
      toast({
        title: "Document Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
      onRefresh();
    } else {
      toast({
        title: "Upload Failed",
        description: "Could not upload document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return FileText;
      case 'docx':
      case 'doc': return FileText;
      case 'xlsx':
      case 'xls': return BarChart3;
      default: return FileText;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-yellow-400" />
              <CardTitle>Document Vault</CardTitle>
              <SectionAgentBadge agentId="VAULT" compact />
              {documents.length > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  {documents.length} Document{documents.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <Button size="sm" variant="outline" asChild disabled={uploading}>
                  <span>
                    {uploading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload
                  </span>
                </Button>
              </label>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <CardDescription>Securely store and manage your compliance documents</CardDescription>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : documents.length > 0 ? (
                  <>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {['all', 'approved', 'pending', 'rejected', 'expired'].map((f) => (
                        <Button
                          key={f}
                          size="sm"
                          variant={filter === f ? 'default' : 'outline'}
                          onClick={() => setFilter(f)}
                          className="text-xs"
                        >
                          {f.toUpperCase()}
                        </Button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredDocs.map((doc) => {
                        const FileIcon = getFileIcon(doc.file_type);
                        return (
                          <motion.div
                            key={doc.id}
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-xl border border-border bg-muted/50 hover:border-primary/30 transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <FileIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{doc.file_type.toUpperCase()}</Badge>
                                  <Badge variant="outline" className="text-xs">{doc.regulator}</Badge>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <StatusBadge status={doc.status} />
                                  <span className="text-xs text-muted-foreground">{doc.uploaded_at}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                              <Button size="sm" variant="ghost" className="flex-1 text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="ghost" className="flex-1 text-xs">
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <EmptyState 
                    title="No Documents Yet" 
                    description="Upload your compliance documents to securely store and manage them."
                    icon={Folder}
                  />
                )}

                {/* VAULT Agent Insights */}
                <AgentInsightDrawer agentId="VAULT" />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// ========================================
// MAIN DASHBOARD COMPONENT
// ========================================

const CompanyDashboardReal = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  
  // Data states
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([]);
  const [exposures, setExposures] = useState<RegulatoryExposure[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [gaps, setGaps] = useState<ComplianceGap[]>([]);
  const [impacts, setImpacts] = useState<RegulatoryImpact[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Load company from session/localStorage
  useEffect(() => {
    const storedCompanyId = localStorage.getItem('regulon_company_id');
    const storedCompanyData = localStorage.getItem('regulon_company_data');
    
    if (storedCompanyId) {
      setCompanyId(storedCompanyId);
      if (storedCompanyData) {
        try {
          const parsedData = JSON.parse(storedCompanyData);
          // Ensure company has proper health status
          setCompany({
            ...parsedData,
            compliance_score: parsedData.compliance_score || 0,
            health_status: parsedData.health_status || 'unknown'
          });
        } catch (e) {
          console.error('Error parsing stored company data:', e);
          // Create default company from ID
          setCompany({
            id: storedCompanyId,
            company_name: 'My Company',
            industry: 'General',
            compliance_score: 0,
            health_status: 'unknown'
          });
        }
      } else {
        // No stored data, create minimal company object
        setCompany({
          id: storedCompanyId,
          company_name: 'My Company',
          industry: 'General',
          compliance_score: 0,
          health_status: 'unknown'
        });
      }
      // Don't set loading false here - let fetchDashboardData handle it
    } else {
      // No company ID - redirect to registration
      toast({
        title: "Login Required",
        description: "Please register or login to access your dashboard.",
        variant: "destructive"
      });
      setIsLoading(false);
      navigate('/auth');
    }
  }, [navigate]);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    
    try {
      const [
        profileData,
        messagesData,
        exposuresData,
        insightsData,
        gapsData,
        impactsData,
        auditsData,
        tasksData,
        docsData
      ] = await Promise.all([
        companyAPI.getProfile(companyId),
        companyAPI.getAIMessages(companyId),
        companyAPI.getExposures(companyId),
        companyAPI.getBusinessInsights(companyId),
        companyAPI.getComplianceGaps(companyId),
        companyAPI.getRegulatoryImpacts(companyId),
        companyAPI.getAuditRecords(companyId),
        companyAPI.getTasks(companyId),
        companyAPI.getDocuments(companyId)
      ]);

      if (profileData) setCompany(profileData);
      setAIMessages(messagesData);
      setExposures(exposuresData);
      setInsights(insightsData);
      setGaps(gapsData);
      setImpacts(impactsData);
      setAuditRecords(auditsData);
      setTasks(tasksData);
      setDocuments(docsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error Loading Data",
        description: "Some data could not be loaded. Please refresh.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  // Initial data fetch
  useEffect(() => {
    if (companyId) {
      fetchDashboardData();
    }
  }, [companyId, fetchDashboardData]);

  // Loading state
  if (isLoading && !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AgentOrchestratorProvider>
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Advanced Command Center Header */}
          <CommandCenterHeader 
            companyName={company?.company_name || 'Company'}
            complianceScore={company?.compliance_score || 0}
            healthStatus={company?.health_status || 'unknown'}
          />

          {/* AI Action Inbox — Clean results from background agents */}
          <CompanyActionInbox />

          <div className="space-y-6">
            {/* Section 1: Regulon AI Compliance Partner */}
            <RegulonAIPartnerSection 
              companyId={companyId || ''}
              companyName={company?.company_name || 'Company'}
              messages={aiMessages}
              onRefresh={fetchDashboardData}
              isLoading={isLoading}
            />

            {/* Section 2: Company Profile & Health Score */}
            <CompanyProfileSection company={company} isLoading={isLoading} />

            {/* Section 3: Regulatory Exposure */}
            <RegulatoryExposureSection exposures={exposures} isLoading={isLoading} />

            {/* Section 4: AI Business Intelligence */}
            <AIBusinessIntelligenceSection 
              insights={insights} 
              companyName={company?.company_name || 'Company'}
              isLoading={isLoading} 
            />

            {/* Section 5: Why Is Your Compliance Incomplete */}
            <ComplianceGapsSection gaps={gaps} isLoading={isLoading} />

            {/* Section 6: Upcoming Regulatory Impact */}
            <RegulatoryImpactSection impacts={impacts} isLoading={isLoading} />

            {/* Section 7: Audit & Inspection Ready Record */}
            <AuditReadySection records={auditRecords} isLoading={isLoading} />

            {/* Section 8: Quick Actions */}
            <QuickActionsSection companyId={companyId || ''} />

            {/* Section 9: Active Compliance Tasks */}
            <ComplianceTasksSection tasks={tasks} isLoading={isLoading} />

            {/* Section 10: Document Vault */}
            <DocumentVaultSection 
              documents={documents} 
              companyId={companyId || ''}
              isLoading={isLoading}
              onRefresh={fetchDashboardData}
            />
          </div>
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
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-gradient-to-r from-purple-500/5 to-cyan-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/20">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Regulon AI Agent</h3>
                    <p className="text-[11px] text-muted-foreground">Your Compliance Intelligence Partner</p>
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
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[65] flex items-center gap-2 px-3 py-3 rounded-l-xl border border-r-0 border-purple-500/25 transition-all hover:px-4 group"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(6,182,212,0.12) 100%)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(139,92,246,0.15), 0 0 8px rgba(139,92,246,0.1)',
            writingMode: 'vertical-rl' as const,
            textOrientation: 'mixed' as const,
          }}
          title="Open Regulon AI Agent Chat"
        >
          <Bot className="w-4 h-4 text-purple-400 rotate-90" />
          <span className="text-[11px] font-bold tracking-wider text-purple-300 group-hover:text-purple-200">
            AI Agent
          </span>
          <motion.span
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-400"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      )}
    </div>
    </AgentOrchestratorProvider>
  );
};

export default CompanyDashboardReal;
