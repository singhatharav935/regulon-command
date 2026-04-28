import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx';

// We'll read the current file just to get the `DailyGovernanceBrief` and `ExternalCADashboardReal` component setups.
// But we will completely rewrite the JSX structure of `<main>`.

let newImports = `import { useState, useEffect, useRef, useCallback } from "react";
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
  Bot, Building, Clock, AlertTriangle, TrendingUp, FileText, Users,
  Check, CheckCircle, MessageSquare, BarChart3, Plus, Search, Download,
  DollarSign, CreditCard, RefreshCw, Loader, Zap, Play, Pause, Eye,
  Shield, Newspaper, Scale, Calculator, FileCheck, FileClock, FileWarning,
  Activity, Radio, Cpu, Sparkles, ChevronRight, ChevronDown, ChevronUp, ArrowRight,
  X, Upload, Send, Volume2, Key, Receipt, Briefcase, Calendar, LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";
import useCAMetrics from "@/hooks/useCAMetrics";
import { addCompany as addCompanyAPI } from "@/services/api";
import { CAAgentProvider } from "@/components/agents/CAAgentOrchestrator";
import { CACommandCenterHeader } from "@/components/agents/CACommandCenterHeader";
import { CAActionInbox } from "@/components/agents/CAActionInbox";
import MultiClientMasterHub from "@/components/ca-dashboard/MultiClientMasterHub";
import PracticeBillingPanel from "@/components/ca-dashboard/PracticeBillingPanel";
import SecureFileSharingPanel from "@/components/ca-dashboard/SecureFileSharingPanel";
import StatutoryDeadlineCalendar from "@/components/ca-dashboard/StatutoryDeadlineCalendar";
import ApprovalWorkflowHub from "@/components/ca-dashboard/ApprovalWorkflowHub";
import ComplianceModulesHub from "@/components/ca-dashboard/ComplianceModulesHub";
// specific modules
import GSTR1Panel from "@/components/ca-dashboard/compliance-modules/GSTR1Panel";
import GSTR2BPanel from "@/components/ca-dashboard/compliance-modules/GSTR2BPanel";
import GSTR3BPanel from "@/components/ca-dashboard/compliance-modules/GSTR3BPanel";
import ITRPanel from "@/components/ca-dashboard/compliance-modules/ITRPanel";
import BoardMeetingsPanel from "@/components/ca-dashboard/compliance-modules/BoardMeetingsPanel";
import AGMMinutesPanel from "@/components/ca-dashboard/compliance-modules/AGMMinutesPanel";
import MCAForm20BPanel from "@/components/ca-dashboard/compliance-modules/MCAForm20BPanel";
import EPFESIPanel from "@/components/ca-dashboard/compliance-modules/EPFESIPanel";
import SalaryTDSPanel from "@/components/ca-dashboard/compliance-modules/SalaryTDSPanel";
import GratuityPanel from "@/components/ca-dashboard/compliance-modules/GratuityPanel";
import FinancialsPanel from "@/components/ca-dashboard/compliance-modules/FinancialsPanel";
import DebtorsAgingPanel from "@/components/ca-dashboard/compliance-modules/DebtorsAgingPanel";
import InvoiceParserPanel from "@/components/ca-dashboard/compliance-modules/InvoiceParserPanel";
import NoticeTrackerPanel from "@/components/ca-dashboard/compliance-modules/NoticeTrackerPanel";
import AuditFilePanel from "@/components/ca-dashboard/compliance-modules/AuditFilePanel";
`;

const fileStr = readFileSync('/tmp/old_dashboard.tsx', 'utf8');
const dailyGBMatch = fileStr.match(/\/\/ Daily Governance Brief Component[\s\S]*?const ExternalCADashboardReal/);
const dailyGBCode = dailyGBMatch[0].replace('const ExternalCADashboardReal', '');

// Full UI section replacements inside ExternalCADashboardReal Return:

const mainUI = `
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <CACommandCenterHeader />

          {/* ========================================================================= */}
          {/* SECTION 1: OVERVIEW (COMMAND CENTER) */}
          {/* ========================================================================= */}
          <section id="overview" className="mt-8 mb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/20">
                <LayoutDashboard className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Command Center Overview</h2>
                <p className="text-sm text-muted-foreground">Strategic briefing, control tower, and drafting AI</p>
              </div>
            </div>

            <CAActionInbox />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <motion.div className="p-6 rounded-2xl border border-border/50 bg-card/30">
                    <h3 className="text-xl font-bold text-foreground mb-4">Control Tower Metrics</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                          <div key={i} className="p-4 rounded-xl bg-background/50 border border-border/40 hover:border-cyan-500/30 transition-colors">
                             <div className="flex items-center justify-between mb-2">
                               <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
                               <Icon className={\`w-4 h-4 \${stat.color}\`} />
                             </div>
                             <p className="text-xl font-bold text-foreground">{stat.value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                  <DailyGovernanceBrief />

                  {/* ---------------- REGULON AI DRAFTING ENGINE BANNER -------------- */}
                  <motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
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
                  {/* ------------------------------------------------------------------------- */}
               </div>
               
               <div className="space-y-8">
                  <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                     <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Auto-Pilot Status
                     </h3>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-muted-foreground">Swarm Coordination</span>
                           <span className="text-green-400 font-medium">Optimal</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-muted-foreground">Active Agents</span>
                           <span className="text-cyan-400 font-medium">12/12 online</span>
                        </div>
                     </div>
                  </div>
                  <RegulonAIAgent showMinimal />
               </div>
            </div>
          </section>

          <hr className="my-16 border-border/30" />

          {/* ========================================================================= */}
          {/* SECTION 2: CLIENT VAULT & COMPLIANCE MODULES */}
          {/* ========================================================================= */}
          <section id="clients" className="mb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Client Vault & Portfolio</h2>
                <p className="text-sm text-muted-foreground">Multi-client masters portal, GST, ITR, and Compliance modules</p>
              </div>
            </div>

            <MultiClientMasterHub />
            <InvoiceParserPanel />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <TaskFilingManagement isRealDashboard={true} apiEndpoint={\`\${CA_API}/api/v1/ca/tasks\`} governmentIntegration={true} />
              <ClientDependencyTracker isRealDashboard={true} apiEndpoint={\`\${CA_API}/api/v1/ca/dependencies\`} aiEnabled={true} />
            </div>

            <div className="mt-8 space-y-8">
               <h3 className="text-xl font-bold text-indigo-300 border-b border-border/30 pb-2">Client Compliance Hub (16-Point Integration)</h3>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <GSTR1Panel />
                 <GSTR3BPanel />
                 <ITRPanel />
                 <MCAForm20BPanel />
                 <SalaryTDSPanel />
                 <EPFESIPanel />
                 <ApprovalWorkflowHub />
               </div>
            </div>
          </section>

          <hr className="my-16 border-border/30" />

          {/* ========================================================================= */}
          {/* SECTION 3: FIRM OPERATIONS (BILLING, INVOICES, AES-256) */}
          {/* ========================================================================= */}
          <section id="operations" className="mb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                <Briefcase className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Firm Operations & Practice Management</h2>
                <p className="text-sm text-muted-foreground">Billing and Invoices, AES 256 Vault, Audit, and Performance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <PracticeBillingPanel />
               <SecureFileSharingPanel />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <AuditInspectionSupport isRealDashboard={true} caId={caId} />
               <CAAnalyticsPerformance isRealDashboard={true} caId={caId} />
               <AuditFilePanel />
               <FinancialsPanel />
            </div>
            
            <CommunicationLogsLive isRealDashboard={true} caId={caId} />
          </section>

          <hr className="my-16 border-border/30" />

          {/* ========================================================================= */}
          {/* SECTION 4: REGULATORY NEWS & CALENDAR */}
          {/* ========================================================================= */}
          <section id="regulatory" className="mb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/20">
                <Calendar className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Regulatory Intelligence & Calendar</h2>
                <p className="text-sm text-muted-foreground">Cross-department statutory deadlines and rule updates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1 space-y-8">
                  <StatutoryDeadlineCalendar />
                  <NoticeTrackerPanel />
               </div>
               <div className="lg:col-span-2 space-y-8">
                  <RegulatoryNewsRuleImpact
                    isRealDashboard={true}
                    apiEndpoint={\`\${CA_API}/api/v1/ca/regulatory-news\`}
                    aiEnabled={true}
                    caId={caId}
                  />
                  <ComplianceHealthChangeLog
                    isRealDashboard={true}
                    apiEndpoint={\`\${CA_API}/api/v1/ca\`}
                    caId={caId}
                  />
               </div>
            </div>
          </section>
`;

const stateHooks = `const ExternalCADashboardReal = () => {
  const { caId, caFirmId, isLoading: identityLoading } = useCAIdentity();
  const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
  const navigate = useNavigate();
  const { metrics, loading, refetch } = useCAMetrics();

  useEffect(() => {
    const userRole = localStorage.getItem("current_user_role");
    if (userRole !== "external_ca") {
      navigate("/dashboard");
      return;
    }
  }, [navigate]);

  const [stats, setStats] = useState([
    { id: "companies", label: "Assigned Companies", value: "0", icon: Building, color: "text-cyan-400" },
    { id: "entities", label: "Multi-Entity Hub", value: "0", icon: Building, color: "text-purple-400" },
    { id: "active_tasks", label: "Active AI Agents", value: "12", icon: Bot, color: "text-green-400" },
    { id: "compliance_score", label: "Avg. Health", value: "88%", icon: TrendingUp, color: "text-blue-400" },
    { id: "approvals", label: "Pending Approvals", value: "0", icon: Clock, color: "text-orange-400" },
    { id: "deadlines", label: "Upcoming 7d", value: "0", icon: Calendar, color: "text-amber-400" }
  ]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (metrics) {
      setStats(prev => [
        { ...prev[0], value: String(metrics.total_companies || 0) },
        { ...prev[1], value: String(metrics.multi_entity_groups || 0) },
        { ...prev[2], value: "12" },
        { ...prev[3], value: \`\${metrics.avg_compliance_score || 0}%\` },
        { ...prev[4], value: String(metrics.pending_approvals || 0) },
        { ...prev[5], value: String(metrics.upcoming_deadlines || 0) }
      ]);
    }
  }, [metrics]);

  return (
    <CAAgentProvider>
    <div className="min-h-screen bg-background">
      <Navbar />
      ${mainUI}
      <Footer />
      
      {/* FULL SCREEN SLIDER DRAWER FOR THE DRAFTING ENGINE (TRIGGERED BY OPEN ENGINE) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
              className="w-full h-full max-w-7xl sm:h-[90vh] bg-card border border-border/50 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                     <Cpu className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">REGULON AI Drafting Engine</h2>
                    <p className="text-xs text-muted-foreground">Full Autonomous Executive Interface</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </CAAgentProvider>
  );
};

export default ExternalCADashboardReal;
`;

writeFileSync(filePath, newImports + "\n" + dailyGBCode + "\n" + stateHooks);
