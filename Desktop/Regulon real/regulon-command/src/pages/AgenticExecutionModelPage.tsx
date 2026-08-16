import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Brain,
  Cpu,
  Eye,
  CheckCircle,
  Zap,
  FileText,
  Download,
  ArrowRight,
  Shield,
  Clock,
  Network,
  Activity,
  Layers,
  Target,
  Workflow,
  Database,
  Key,
  Fingerprint,
  Play,
  Timer,
  Send,
  SplitSquareVertical,
  ChevronRight,
  Lock,
  Gauge,
  AlertTriangle,
  Landmark,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/**
 * SANNIDH — Agentic Execution Model
 * Understanding AI + Human Review Workflows — the 6-stage pipeline that compresses
 * a 5-day manual resolution cycle to <20 minutes through autonomous multi-agent execution.
 */

// Hero KPI metrics for the agentic model
const agenticMetrics = [
  {
    icon: <Timer className="w-8 h-8" />,
    title: "Turn-Around Time",
    value: "<20 min",
    desc: "End-to-end from notice detection to filed response",
    detail: "vs. 5-day industry standard",
  },
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Autonomous Execution",
    value: ">95%",
    desc: "Of pipeline steps require zero human intervention",
    detail: "<5% human review only",
  },
  {
    icon: <Cpu className="w-8 h-8" />,
    title: "Nexus-9™ Engine",
    value: "Neural",
    desc: "Multi-agent legal synthesis with RAG pipeline",
    detail: "LangGraph / CrewAI orchestration",
  },
  {
    icon: <Activity className="w-8 h-8" />,
    title: "Sentinel™ Polling",
    value: "24/7",
    desc: "Background daemon monitoring of GSTN, IT, MCA",
    detail: "Notice intercept in <2 min",
  },
];

// The 6-stage agentic pipeline — real production state machine
const agenticPipeline = [
  {
    stage: 1,
    title: "One-Click Mandate Contract",
    subtitle: "CA → Client Digital Authorization",
    actor: "CA (Initiator)",
    automation: "100%",
    description: "The CA initiates an encrypted OAuth consent request link from Sannidh. The payload is sent via a secure URL endpoint to the client for instant digital authorization — no physical forms, no email chains, no wet signatures. The consent carries granular scopes: filing access, ledger read, notice pull — each individually revocable by the client at any time.",
    techStack: ["OAuth 2.0 + PKCE", "Encrypted Consent Token", "Granular Scope Selection", "Digital Signature Binding"],
    humanRole: "CA clicks 'Send Mandate' — one button.",
    color: "from-cyan-600 to-cyan-800",
    icon: <Key className="w-7 h-7" />,
    metric: { label: "Execution Time", value: "<30 sec" },
  },
  {
    stage: 2,
    title: "Authenticated System Ingestion",
    subtitle: "GSP API → Client Vault",
    actor: "System (Autonomous)",
    automation: "100%",
    description: "Client approval fires an event trigger invoking real-world authorized GSP (GST Suvidha Provider) APIs via production routes (Decentro/Setu). Sannidh securely fetches historical filings, live multi-bank transaction ledgers, and previous returns — organizing the structured schema into an isolated Client Vault with Row-Level Security.",
    techStack: ["GSP Production API (Decentro/Setu)", "Multi-Bank Ledger Aggregation", "Structured Schema Mapping", "PostgreSQL RLS Vault"],
    humanRole: "Client clicks 'Approve' on consent link — one click.",
    color: "from-blue-600 to-blue-800",
    icon: <Database className="w-7 h-7" />,
    metric: { label: "Ingestion Latency", value: "<45 sec" },
  },
  {
    stage: 3,
    title: "Active Real-Time Portal Interception",
    subtitle: "Sentinel™ Daemon → Zero-Latency Alerts",
    actor: "System (Daemon)",
    automation: "100%",
    description: "Sannidh background daemons run persistent 24/7 cron-based polls across official government frameworks — GSTN, Income Tax, MCA portals. The precise millisecond a statutory notice hits, Sannidh bypasses human lag, downloads the document, and fires a zero-latency system alert to the CA's Threat Command dashboard.",
    techStack: ["24/7 Cron Daemon Polling", "GSTN / IT / MCA Portal Hooks", "Zero-Latency Alert Dispatch", "Auto Document Download & Archive"],
    humanRole: "None. Fully autonomous daemon — no human in the loop.",
    color: "from-violet-600 to-violet-800",
    icon: <Eye className="w-7 h-7" />,
    metric: { label: "Threat Intercept", value: "<2 min" },
  },
  {
    stage: 4,
    title: "Filing-Ready Neural Synthesis",
    subtitle: "Nexus-9™ Multi-Agent Architecture",
    actor: "Nexus-9™ Engine",
    automation: "100%",
    description: "An autonomous multi-agent parser runs a cognitive breakdown of the intercepted notice PDF. It flags the specific legal violations and discrepancies, then queries the Client Vault using a vector similarity database (pgvector RAG). Sannidh maps ledger rows to the legal defense and writes a mathematically sound, bulletproof, filing-ready legal draft — without human keystrokes.",
    techStack: ["Multi-Agent Parser (LangGraph/CrewAI)", "Vector Similarity DB (pgvector RAG)", "Legal Taxonomy Matching", "Automated UDIN Mapping"],
    humanRole: "None. Nexus-9™ generates the complete defense draft autonomously.",
    color: "from-emerald-600 to-emerald-800",
    icon: <Brain className="w-7 h-7" />,
    metric: { label: "Draft Generation", value: "<5 min" },
  },
  {
    stage: 5,
    title: "One-Click Production Review",
    subtitle: "Split-Screen CA Workspace",
    actor: "CA (Reviewer)",
    automation: "0%",
    description: "The dashboard loads a high-scannability split-screen workspace. The live notice sits on the left; the synthesized neural defense with the CA's auto-mapped UDIN number sits on the right for instant audit. This is the only stage where human judgment is required — the CA validates the AI-generated response against the original notice. No data entry, no copy-paste, no template hunting.",
    techStack: ["Split-Screen IDE Workspace", "Inline Transaction Audit Traces", "Auto-Mapped UDIN Number", "Diff-View Notice vs. Response"],
    humanRole: "CA reviews and validates — professional sign-off only.",
    color: "from-amber-600 to-amber-800",
    icon: <SplitSquareVertical className="w-7 h-7" />,
    metric: { label: "Review Time", value: "~10 min" },
  },
  {
    stage: 6,
    title: "The 20-Minute TAT Resolution",
    subtitle: "GSP Tunnel → Government Portal",
    actor: "System (Autonomous)",
    automation: "100%",
    description: "The CA hits 'Execute Submission'. The engine pipes the authenticated, CA-validated draft directly to the government portal endpoints via the secure GSP network tunnel. The 5-day manual resolution cycle is compressed to under 20 minutes. The submission, response, and audit trail are permanently archived in the Client Vault with statutory-grade immutability.",
    techStack: ["GSP Network Tunnel Submission", "Authenticated Portal Endpoint", "Immutable Audit Trail Archive", "Statutory-Grade Timestamping"],
    humanRole: "CA clicks 'Execute Submission' — one button.",
    color: "from-rose-600 to-rose-800",
    icon: <Send className="w-7 h-7" />,
    metric: { label: "Total TAT", value: "<20 min" },
  },
];

// The three command dashboard views from the architecture document
const commandDashboards = [
  {
    title: "CA Global Threat Command",
    subtitle: "The Practitioner's War Room",
    icon: <AlertTriangle className="w-8 h-8" />,
    description: "A clean feed prioritizing active client exposure, real-time portal tracking indicators, and total hours saved analytics. The CA sees every statutory threat across their entire client roster in one high-density console — sorted by severity, deadline proximity, and financial exposure.",
    features: [
      "Active client exposure feed sorted by severity",
      "Real-time GSTN / IT / MCA portal tracking indicators",
      "Total hours saved and revenue protected analytics",
      "Batch notice processing with priority queuing",
      "Multi-client deadline calendar with buffer alerts",
    ],
    palette: "#0B0F19 Obsidian Slate + #38BDF8 Electric Cyan",
    color: "border-cyan-500/30 bg-cyan-900/10",
  },
  {
    title: "Isolated Client Vault Design",
    subtitle: "Secure Financial Data Compartment",
    icon: <Lock className="w-8 h-8" />,
    description: "Secure storage zones utilizing database Row-Level Security (RLS), visualizing live financial pipes and bank statement feeds. Each client's vault is cryptographically isolated — the CA sees only their authorized clients, and each client's data is invisible to every other tenant in the system.",
    features: [
      "Row-Level Security (RLS) enforced tenant isolation",
      "Live financial pipe visualization from GSP APIs",
      "Multi-bank statement feed aggregation view",
      "Historical filing archive with statutory retention",
      "Consent scope dashboard with revocation controls",
    ],
    palette: "PostgreSQL + pgvector + Supabase RLS",
    color: "border-blue-500/30 bg-blue-900/10",
  },
  {
    title: "Nexus-9™ Split Workspace",
    subtitle: "Terminal-Style IDE for Legal Defense",
    icon: <SplitSquareVertical className="w-8 h-8" />,
    description: "A terminal-style IDE balancing the raw notice PDF directly against the neural-generated response with inline transaction audit traces. The CA can trace every claim in the AI-drafted response back to the specific ledger row, bank statement entry, or prior filing that substantiates it.",
    features: [
      "Left panel: Original notice PDF with violation highlights",
      "Right panel: Neural defense draft with UDIN mapping",
      "Inline transaction audit traces linked to ledger rows",
      "Diff-view showing claim-to-evidence mapping",
      "One-click 'Execute Submission' to GSP tunnel",
    ],
    palette: "Terminal-Style Dark + Inline Annotations",
    color: "border-violet-500/30 bg-violet-900/10",
  },
];

// Cognitive agent specifications
const agentSpecs = [
  {
    component: "Backend Engine",
    spec: "Asynchronous Python FastAPI & Node.js TypeScript",
    purpose: "Prevents thread blocks during high-volume document ingestions. Every I/O-bound operation — GSP API calls, portal scraping, database writes — runs on non-blocking async event loops.",
    tech: ["Python FastAPI (async)", "Node.js TypeScript", "Event-Driven Architecture", "Non-Blocking I/O"],
    icon: <Cpu className="w-6 h-6" />,
  },
  {
    component: "Agent Orchestration",
    spec: "LangGraph / CrewAI Stateful Framework Trees",
    purpose: "Multi-agent tracking executes via stateful framework trees to manage multi-tiered calculations. Each agent has a defined scope — notice parser, ledger matcher, legal drafter, UDIN mapper — orchestrated in a deterministic DAG.",
    tech: ["LangGraph State Machines", "CrewAI Agent Roles", "Deterministic DAG Execution", "Stateful Checkpoint Recovery"],
    icon: <Network className="w-6 h-6" />,
  },
  {
    component: "Storage Layer",
    spec: "PostgreSQL + pgvector (Supabase)",
    purpose: "Structured relational storage for client filings and ledgers, with integrated vector extensions (pgvector) to index legal taxonomies and notice contexts. RAG queries hit the vector index to find the most relevant legal precedent and ledger evidence for each notice.",
    tech: ["PostgreSQL (Relational)", "pgvector (Vector Index)", "Supabase (Auth + RLS)", "RAG Pipeline Integration"],
    icon: <Database className="w-6 h-6" />,
  },
  {
    component: "Nexus-9™ Neural Synthesis",
    spec: "Multi-Agent Cognitive Legal Engine",
    purpose: "The crown jewel — a multi-agent parser that decomposes notice PDFs into legal claims, matches each claim against the client vault's ledger data, and synthesizes a filing-ready legal defense with mathematical accuracy. Not a template filler. Not a prompt wrapper. A cognitive legal synthesis engine.",
    tech: ["PDF Cognitive Decomposition", "Claim-to-Ledger Mapping", "Legal Defense Synthesis", "UDIN Auto-Assignment"],
    icon: <Brain className="w-6 h-6" />,
  },
];

// TAT comparison data
const tatComparison = [
  { stage: "Notice Detection", manual: "24-48 hours", sannidh: "<2 minutes", savings: "99.9%" },
  { stage: "Document Download", manual: "30-60 minutes", sannidh: "Automatic", savings: "100%" },
  { stage: "Notice Analysis", manual: "2-4 hours", sannidh: "<1 minute", savings: "99.5%" },
  { stage: "Ledger Matching", manual: "4-8 hours", sannidh: "<2 minutes", savings: "99.6%" },
  { stage: "Draft Preparation", manual: "1-2 days", sannidh: "<5 minutes", savings: "99.7%" },
  { stage: "Review & Validation", manual: "2-4 hours", sannidh: "~10 minutes", savings: "92%" },
  { stage: "Portal Submission", manual: "30-60 minutes", sannidh: "<30 seconds", savings: "99%" },
];

export default function AgenticExecutionModelPage() {
  const [selectedTab, setSelectedTab] = useState("pipeline");
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-slate-900 via-[#0B0F19] to-slate-900 border-b border-slate-700 px-6 pt-32 pb-24 overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-grid-slate-700/25 bg-[size:20px_20px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/80 to-transparent" />
        {/* Amber accent glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="mb-6 bg-amber-600/20 text-amber-400 border-amber-500/30">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Agentic Execution • AI + Human Review Workflows
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent mb-8 leading-tight">
              The 20-Minute
              <br />
              Resolution Engine
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-4xl mb-12 leading-relaxed">
              Sannidh executes a 6-stage autonomous pipeline that compresses the 5-day manual compliance resolution
              cycle to under 20 minutes. From consent to submission, less than 5% of the workflow requires human
              intervention — the CA validates, not manually builds. This is not an AI assistant. This is an execution engine.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 mb-14"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 px-8 py-4 text-lg"
              onClick={() => navigate("/auth?mode=signup&role=external_ca")}
            >
              <Play className="w-5 h-5 mr-2" />
              See It In Action
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-8 py-4 text-lg">
              <Download className="w-5 h-5 mr-2" />
              Technical Architecture PDF
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-8 py-4 text-lg"
              onClick={() => navigate("/platform/infrastructure")}
            >
              Sovereign Infrastructure
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Agentic KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {agenticMetrics.map((metric, idx) => (
              <motion.div
                key={idx}
                onHoverStart={() => setHoveredMetric(idx)}
                onHoverEnd={() => setHoveredMetric(null)}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-amber-500/50 transition-all duration-300 h-full">
                  <CardContent className="pt-6 text-center">
                    <motion.div
                      animate={{
                        color: hoveredMetric === idx ? "#f59e0b" : "#64748b"
                      }}
                      className="mb-4 flex justify-center"
                    >
                      {metric.icon}
                    </motion.div>
                    <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                    <p className="text-sm font-medium text-slate-300 mb-1">{metric.title}</p>
                    <p className="text-xs text-slate-500">{metric.desc}</p>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{
                        opacity: hoveredMetric === idx ? 1 : 0,
                        height: hoveredMetric === idx ? "auto" : 0
                      }}
                      className="mt-3 pt-3 border-t border-slate-600 overflow-hidden"
                    >
                      <p className="text-xs text-amber-400">{metric.detail}</p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Tabbed Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-800/50 border border-slate-700 mb-12 h-14">
            <TabsTrigger value="pipeline" className="text-white data-[state=active]:bg-amber-600">
              6-Stage Pipeline
            </TabsTrigger>
            <TabsTrigger value="dashboards" className="text-white data-[state=active]:bg-amber-600">
              Command Dashboards
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-white data-[state=active]:bg-amber-600">
              Cognitive Agent Specs
            </TabsTrigger>
            <TabsTrigger value="tat" className="text-white data-[state=active]:bg-amber-600">
              TAT Comparison
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB 1: The 6-Stage Agentic Pipeline ─── */}
          <TabsContent value="pipeline" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold text-white mb-3">End-to-End Agentic Pipeline</h2>
              <p className="text-lg text-slate-300 mb-8 max-w-4xl">
                A 6-stage linear state machine running via serverless API hooks. No hardcoded mocks.
                No dummy data. Every stage is a production code path executing through authenticated channels.
              </p>
            </motion.div>

            {/* Pipeline Stages */}
            {agenticPipeline.map((stage, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card
                  className={`bg-gradient-to-r ${stage.color} border-0 overflow-hidden cursor-pointer transition-all duration-300`}
                  onClick={() => setExpandedStage(expandedStage === idx ? null : idx)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl font-bold text-white shrink-0">
                        {stage.stage}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-white flex items-center gap-3 text-xl">
                          {stage.icon}
                          {stage.title}
                        </CardTitle>
                        <CardDescription className="text-white/70 mt-1">{stage.subtitle}</CardDescription>
                      </div>
                      <div className="hidden md:flex items-center gap-4">
                        <Badge className={`${stage.automation === "0%" ? "bg-amber-500/20 text-amber-300 border-amber-400/30" : "bg-white/15 text-white border-white/30"}`}>
                          {stage.automation === "0%" ? "Human Review" : `${stage.automation} Autonomous`}
                        </Badge>
                        <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-center">
                          <p className="text-xs text-white/60">{stage.metric.label}</p>
                          <p className="text-lg font-bold text-white">{stage.metric.value}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <motion.div
                    initial={false}
                    animate={{
                      height: expandedStage === idx ? "auto" : 0,
                      opacity: expandedStage === idx ? 1 : 0,
                    }}
                    className="overflow-hidden"
                  >
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                          <p className="text-white/90 leading-relaxed mb-6">{stage.description}</p>

                          {/* Tech Stack */}
                          <h4 className="font-semibold text-white mb-3">Technology Stack:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                            {stage.techStack.map((t, tidx) => (
                              <Badge key={tidx} className="bg-white/15 text-white border-white/30 justify-start p-2.5">
                                <CheckCircle className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                                {t}
                              </Badge>
                            ))}
                          </div>

                          {/* Human Role */}
                          <div className="p-4 bg-white/10 backdrop-blur rounded-lg">
                            <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Human Role in This Stage</p>
                            <p className="text-white font-medium">{stage.humanRole}</p>
                          </div>
                        </div>

                        {/* Right Panel — Mobile metrics */}
                        <div className="md:hidden flex items-center gap-4 mb-4">
                          <Badge className={`${stage.automation === "0%" ? "bg-amber-500/20 text-amber-300 border-amber-400/30" : "bg-white/15 text-white border-white/30"}`}>
                            {stage.automation === "0%" ? "Human Review" : `${stage.automation} Autonomous`}
                          </Badge>
                          <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-center">
                            <p className="text-xs text-white/60">{stage.metric.label}</p>
                            <p className="text-lg font-bold text-white">{stage.metric.value}</p>
                          </div>
                        </div>

                        {/* Actor & Metric Summary */}
                        <div className="hidden lg:flex flex-col gap-4">
                          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center flex-1 flex flex-col justify-center">
                            <p className="text-xs text-white/60 mb-1">Primary Actor</p>
                            <p className="text-lg font-bold text-white mb-4">{stage.actor}</p>
                            <p className="text-xs text-white/60 mb-1">{stage.metric.label}</p>
                            <p className="text-3xl font-bold text-white">{stage.metric.value}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                </Card>
              </motion.div>
            ))}

            {/* Pipeline Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center"
            >
              <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Click any stage above to expand full details</p>
              <h3 className="text-2xl font-bold text-white mb-2">5-Day Manual Cycle → 20-Minute Autonomous Resolution</h3>
              <p className="text-slate-300 max-w-2xl mx-auto">
                Stages 1, 2, 3, 4, and 6 are fully autonomous. Stage 5 is the only human touchpoint —
                and it's a review, not a build.
              </p>
            </motion.div>
          </TabsContent>

          {/* ─── TAB 2: Command Dashboards ─── */}
          <TabsContent value="dashboards" className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold text-white mb-3">UI/UX Architecture — Command Dashboards</h2>
              <p className="text-lg text-slate-300 mb-4 max-w-4xl">
                Three premium high-density executive consoles designed on the Obsidian Slate system palette
                (<code className="text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded text-sm">#0B0F19</code> background,
                <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded text-sm ml-1">#FFFFFF</code> high-contrast text,
                <code className="text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded text-sm ml-1">#38BDF8</code> Electric Cyan metrics).
              </p>
            </motion.div>

            <div className="space-y-8">
              {commandDashboards.map((dashboard, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className={`border ${dashboard.color} transition-all duration-300 hover:scale-[1.01]`}>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-slate-700/50 rounded-xl text-cyan-400">{dashboard.icon}</div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{dashboard.title}</h3>
                              <p className="text-sm text-slate-400">{dashboard.subtitle}</p>
                            </div>
                          </div>
                          <p className="text-slate-300 leading-relaxed text-sm">{dashboard.description}</p>
                          <p className="text-xs text-slate-500 mt-4">
                            <span className="text-slate-400 font-medium">Design System:</span> {dashboard.palette}
                          </p>
                        </div>
                        <div className="lg:col-span-2">
                          <h4 className="font-semibold text-white mb-4">Core Capabilities:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {dashboard.features.map((feature, fidx) => (
                              <div key={fidx} className="flex items-start gap-2 p-3 bg-slate-700/30 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-300 text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* ─── TAB 3: Cognitive Agent Specs ─── */}
          <TabsContent value="agents" className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold text-white mb-3">Cognitive Agent & Database Specifications</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                Sannidh's execution engine is built on asynchronous infrastructure to prevent thread blocks,
                multi-agent orchestration for complex calculations, and a vector-augmented storage layer
                for semantic legal retrieval.
              </p>
            </motion.div>

            <div className="space-y-8">
              {agentSpecs.map((spec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.12 }}
                >
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/30 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-amber-600/20 rounded-xl text-amber-400">{spec.icon}</div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{spec.component}</h3>
                              <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 mt-1">{spec.spec}</Badge>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-300 text-sm leading-relaxed">{spec.purpose}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-3 text-sm">Technology Stack:</h4>
                          <div className="space-y-2">
                            {spec.tech.map((t, tidx) => (
                              <div key={tidx} className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                <span className="text-slate-300 text-sm">{t}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Architecture Callout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-amber-900/20 via-slate-800/50 to-orange-900/20 rounded-2xl p-8 border border-amber-500/20"
            >
              <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
                <div className="p-4 bg-amber-600/20 rounded-xl shrink-0">
                  <Workflow className="w-10 h-10 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Why Multi-Agent, Not Single-LLM?</h3>
                  <p className="text-slate-300 leading-relaxed">
                    A single LLM prompt cannot reliably decompose a 47-page GST notice, cross-reference it against
                    3 years of ledger data, identify the specific ITC discrepancy, calculate the correct tax liability,
                    draft a legally valid response, and map it to the CA's UDIN — all in one pass. Sannidh uses
                    <span className="text-amber-300 font-semibold"> stateful multi-agent orchestration </span>
                    where each agent has a defined scope and the framework ensures deterministic execution order
                    with checkpoint recovery on failure.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ─── TAB 4: TAT Comparison ─── */}
          <TabsContent value="tat" className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold text-white mb-3">Turn-Around Time Comparison</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                A stage-by-stage breakdown showing the time compression from traditional manual workflow
                to Sannidh's autonomous execution. The total pipeline moves from ~5 days to under 20 minutes.
              </p>
            </motion.div>

            {/* TAT Table */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 p-6 bg-slate-700/50 border-b border-slate-600">
                  <div className="text-sm font-semibold text-white">Stage</div>
                  <div className="text-sm font-semibold text-red-400">Manual Process</div>
                  <div className="text-sm font-semibold text-cyan-400">SANNIDH Engine</div>
                  <div className="text-sm font-semibold text-green-400">Time Saved</div>
                </div>
                {/* Table Rows */}
                {tatComparison.map((row, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`grid grid-cols-4 gap-4 p-6 ${idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/50"} border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors`}
                  >
                    <div className="text-white font-medium text-sm">{row.stage}</div>
                    <div className="text-red-400/80 text-sm line-through">{row.manual}</div>
                    <div className="text-cyan-300 font-semibold text-sm">{row.sannidh}</div>
                    <div>
                      <Badge className="bg-green-600/20 text-green-400 border-green-500/30">{row.savings}</Badge>
                    </div>
                  </motion.div>
                ))}
                {/* Summary Row */}
                <div className="grid grid-cols-4 gap-4 p-6 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-t-2 border-amber-500/30">
                  <div className="text-white font-bold">Total Pipeline</div>
                  <div className="text-red-400 font-bold">~5 Days</div>
                  <div className="text-cyan-300 font-bold">&lt;20 Minutes</div>
                  <div>
                    <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30 font-bold">99.7%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visual Impact Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <Card className="bg-red-900/10 border-red-500/20">
                <CardContent className="p-8 text-center">
                  <p className="text-4xl font-bold text-red-400 mb-2">~5 Days</p>
                  <p className="text-white font-semibold mb-1">Manual Process</p>
                  <p className="text-sm text-slate-400">Portal checks → Download → Analysis → Draft → Review → Submit</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-900/10 border-amber-500/20">
                <CardContent className="p-8 text-center flex flex-col justify-center h-full">
                  <ArrowRight className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-amber-400">99.7% Compression</p>
                  <p className="text-sm text-slate-400 mt-1">6-Stage Autonomous Pipeline</p>
                </CardContent>
              </Card>
              <Card className="bg-cyan-900/10 border-cyan-500/20">
                <CardContent className="p-8 text-center">
                  <p className="text-4xl font-bold text-cyan-400 mb-2">&lt;20 min</p>
                  <p className="text-white font-semibold mb-1">SANNIDH Engine</p>
                  <p className="text-sm text-slate-400">Consent → Ingest → Intercept → Synthesize → Review → Submit</p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Final CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20 bg-gradient-to-br from-amber-900/30 via-slate-800/50 to-orange-900/30 rounded-2xl p-12 text-center border border-slate-700 backdrop-blur"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent mb-6">
            Stop Building. Start Reviewing.
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            The industry's first autonomous compliance execution engine — where the CA's job shifts from
            manual document assembly to professional validation of AI-synthesized legal defense.
          </p>

          <div className="flex flex-wrap gap-6 justify-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 px-10 py-4 text-lg"
              onClick={() => navigate("/auth?mode=signup&role=external_ca")}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-10 py-4 text-lg">
              <FileText className="w-5 h-5 mr-2" />
              Download Architecture PDF
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-10 py-4 text-lg"
              onClick={() => navigate("/platform/infrastructure")}
            >
              <Landmark className="w-5 h-5 mr-2" />
              Sovereign Infrastructure
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center pt-8 border-t border-slate-700">
            <div>
              <p className="text-3xl font-bold text-white mb-1">&lt;20 min</p>
              <p className="text-sm text-slate-400">Total Resolution TAT</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">&lt;5%</p>
              <p className="text-sm text-slate-400">Human Intervention</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">6 Stages</p>
              <p className="text-sm text-slate-400">Autonomous Pipeline</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">Nexus-9™</p>
              <p className="text-sm text-slate-400">Neural Legal Synthesis</p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
