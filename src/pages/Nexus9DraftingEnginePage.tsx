import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
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
  Database,
  Target,
  Workflow,
  Play,
  Timer,
  BookOpen,
  Scale,
  Layers,
  Search,
  PenTool,
  ShieldCheck,
  ChevronRight,
  Landmark,
  Building2,
  AlertTriangle,
  Sparkles,
  FileScan,
  FileCheck,
  Gavel,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/**
 * SANNIDH — Nexus-9™ Drafting Engine
 * Autonomous Legal & Regulatory Document Generation — a multi-agent neural
 * legal synthesis engine that reads, reasons, retrieves, writes, and validates.
 */

const nexusMetrics = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Neural Synthesis",
    value: "Multi-Agent",
    desc: "Cognitive legal decomposition via stateful agent orchestration",
    detail: "LangGraph / CrewAI framework",
  },
  {
    icon: <Timer className="w-8 h-8" />,
    title: "Draft Generation",
    value: "<5 min",
    desc: "Filing-ready legal defense from notice to submission",
    detail: "vs. 1-2 day manual drafting",
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "Legal Accuracy",
    value: ">99.2%",
    desc: "Precision claim-to-ledger mapping with RAG pipeline",
    detail: "pgvector semantic similarity",
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Document Types",
    value: "40+",
    desc: "GST notices, IT scrutiny, MCA ROC, FEMA, SEBI responses",
    detail: "Expanding continuously",
  },
];

// 5-stage neural synthesis pipeline
const synthesisPipeline = [
  {
    stage: 1,
    title: "Notice Cognitive Decomposition",
    subtitle: "Multi-Agent PDF Parser → Structured Legal Schema",
    description:
      "The engine receives a notice PDF and runs a multi-agent cognitive parser. It identifies: notice type (scrutiny / demand / penalty / reassessment), specific legal sections cited, claim amounts with mathematical breakdowns, discrepancy descriptions, and response deadlines. This is not OCR text extraction — it is semantic legal understanding. The parser distinguishes between a Section 143(1) intimation and a Section 148 reassessment notice, extracting the precise legal implications of each.",
    techStack: ["Cognitive PDF Decomposition", "Legal Section Identification", "Claim Amount Extraction", "Deadline & Jurisdiction Mapping"],
    color: "from-violet-600 to-violet-800",
    icon: <FileScan className="w-7 h-7" />,
    metric: { label: "Parse Time", value: "<30 sec" },
  },
  {
    stage: 2,
    title: "Client Vault RAG Query",
    subtitle: "Vector Similarity Search → Evidence Retrieval",
    description:
      "The decomposed claims trigger vector similarity searches against the client's isolated vault. The RAG pipeline (pgvector) retrieves the most relevant ledger entries, prior filings, bank statements, invoices, and historical responses that substantiate the defense. Every retrieved document is ranked by semantic relevance to the specific claim — ensuring the defense references the exact transaction that disproves the discrepancy.",
    techStack: ["pgvector Semantic Search", "Client Vault Isolation (RLS)", "Multi-Source Evidence Ranking", "Historical Filing Cross-Reference"],
    color: "from-blue-600 to-blue-800",
    icon: <Search className="w-7 h-7" />,
    metric: { label: "Retrieval", value: "<15 sec" },
  },
  {
    stage: 3,
    title: "Legal Taxonomy Matching",
    subtitle: "10,000+ Regulatory Blueprints → Defense Strategy",
    description:
      "Each claim from the notice is mapped against Sannidh's proprietary legal taxonomy database — 10,000+ regulatory blueprints covering GST, Income Tax, MCA, FEMA, and SEBI. The engine identifies the exact legal provision applicable, relevant CBDT/CBIC circulars, tribunal rulings, and the optimal defense strategy. The taxonomy is continuously updated with new circulars, notifications, and case law precedents.",
    techStack: ["10K+ Regulatory Blueprints", "Circular & Notification Index", "Case Law Precedent Matching", "Defense Strategy Selection"],
    color: "from-emerald-600 to-emerald-800",
    icon: <Scale className="w-7 h-7" />,
    metric: { label: "Coverage", value: "10K+ Rules" },
  },
  {
    stage: 4,
    title: "Defense Synthesis & Assembly",
    subtitle: "Multi-Agent Orchestrator → Filing-Ready Draft",
    description:
      "The multi-agent orchestrator assembles a complete, filing-ready legal defense. It includes: point-by-point rebuttal of each claim, mathematical calculations with ledger references, applicable legal provisions with section citations, and suggested relief amounts. The draft is structured in the exact format required by the target regulatory portal — DRC-01 for GST, Section 143(2) response for IT, or MGT-7 workpaper for MCA.",
    techStack: ["Point-by-Point Rebuttal Generation", "Mathematical Ledger Verification", "Legal Provision Citation Engine", "Portal-Format Compliance"],
    color: "from-amber-600 to-amber-800",
    icon: <PenTool className="w-7 h-7" />,
    metric: { label: "Assembly", value: "<3 min" },
  },
  {
    stage: 5,
    title: "UDIN Mapping & Compliance Audit",
    subtitle: "Self-Validation → Submission Readiness",
    description:
      "The final draft is validated against compliance rules, mapped to the CA's UDIN (Unique Document Identification Number), and prepared for portal submission. The engine performs a rigorous self-audit: checking mathematical consistency between claimed amounts and ledger evidence, legal citation accuracy against the taxonomy database, format compliance with portal requirements, and cross-referencing all evidence trails. A confidence score is generated for each section of the defense.",
    techStack: ["UDIN Auto-Assignment", "Mathematical Consistency Check", "Legal Citation Validation", "Confidence Score Generation"],
    color: "from-rose-600 to-rose-800",
    icon: <ShieldCheck className="w-7 h-7" />,
    metric: { label: "Validation", value: "<1 min" },
  },
];

// Document generation capabilities by regulator
const documentCapabilities = [
  {
    regulator: "GST Domain",
    icon: <FileCheck className="w-6 h-6" />,
    color: "from-emerald-600 to-emerald-700",
    documents: [
      "Show Cause Notice responses (DRC-01/DRC-01A)",
      "Demand order appeals (APL-01/APL-02)",
      "ITC mismatch reconciliation statements",
      "GSTR-9 annual return reconciliation workpapers",
      "Reverse charge liability computation sheets",
      "Pre-deposit calculation for appellate filings",
    ],
  },
  {
    regulator: "Income Tax Domain",
    icon: <Landmark className="w-6 h-6" />,
    color: "from-blue-600 to-blue-700",
    documents: [
      "Section 143(1) intimation response letters",
      "Section 143(2) scrutiny assessment replies",
      "Section 148 reassessment notice replies",
      "Tax computation statements (dividend/capital gains)",
      "Advance tax computation workpapers",
      "Transfer pricing documentation (Form 3CEB)",
    ],
  },
  {
    regulator: "MCA / ROC Domain",
    icon: <Building2 className="w-6 h-6" />,
    color: "from-violet-600 to-violet-700",
    documents: [
      "Board resolution drafts (all categories)",
      "Annual return workpapers (MGT-7/MGT-7A)",
      "Director appointment/resignation forms (DIR-12)",
      "Charge creation/modification documents (CHG-1)",
      "Registered office change applications (INC-22)",
      "Compounding applications for delayed filings",
    ],
  },
  {
    regulator: "Cross-Regulatory",
    icon: <Gavel className="w-6 h-6" />,
    color: "from-amber-600 to-amber-700",
    documents: [
      "Penalty waiver applications (all regulators)",
      "Extension of time requests with grounds",
      "Compound interest reduction petitions",
      "Rectification applications (Section 154/161)",
      "Condonation of delay applications",
      "Voluntary disclosure statements",
    ],
  },
];

// Multi-agent architecture
const agentSpecs = [
  {
    agent: "Notice Parser Agent",
    scope: "Decompose notice PDFs into structured legal claims",
    input: "Raw notice PDF (any regulator)",
    output: "JSON schema: claims, legal sections, amounts, deadlines, jurisdiction",
    icon: <FileScan className="w-6 h-6" />,
    accuracy: "99.8%",
    color: "text-violet-400",
    bgColor: "bg-violet-600/20",
  },
  {
    agent: "Ledger Matcher Agent",
    scope: "Cross-reference claims against client vault data",
    input: "Structured claim schema from Parser Agent",
    output: "Ranked evidence: matched ledger entries, bank statements, prior filings",
    icon: <Database className="w-6 h-6" />,
    accuracy: "99.5%",
    color: "text-blue-400",
    bgColor: "bg-blue-600/20",
  },
  {
    agent: "Legal Research Agent",
    scope: "Find applicable legal provisions and case precedents",
    input: "Claim type + jurisdiction + regulator",
    output: "Relevant sections, CBDT/CBIC circulars, tribunal rulings, defense strategy",
    icon: <BookOpen className="w-6 h-6" />,
    accuracy: "99.1%",
    color: "text-emerald-400",
    bgColor: "bg-emerald-600/20",
  },
  {
    agent: "Draft Writer Agent",
    scope: "Synthesize the complete legal defense document",
    input: "All agent outputs: claims, evidence, legal provisions",
    output: "Filing-ready legal draft in regulatory portal format",
    icon: <PenTool className="w-6 h-6" />,
    accuracy: "99.2%",
    color: "text-amber-400",
    bgColor: "bg-amber-600/20",
  },
  {
    agent: "Compliance Auditor Agent",
    scope: "Self-audit the draft for accuracy and consistency",
    input: "Complete draft + all source data",
    output: "Validation report: confidence scores, flagged issues, UDIN mapping",
    icon: <ShieldCheck className="w-6 h-6" />,
    accuracy: "99.9%",
    color: "text-rose-400",
    bgColor: "bg-rose-600/20",
  },
];

// Accuracy benchmarks
const benchmarkData = [
  { stage: "Notice Parsing", metric: "Section Identification", accuracy: "99.8%", manual: "~95%", improvement: "+4.8%" },
  { stage: "Ledger Matching", metric: "Transaction Retrieval", accuracy: "99.5%", manual: "~88%", improvement: "+11.5%" },
  { stage: "Legal Research", metric: "Provision Accuracy", accuracy: "99.1%", manual: "~92%", improvement: "+7.1%" },
  { stage: "Draft Quality", metric: "Mathematical Consistency", accuracy: "99.7%", manual: "~90%", improvement: "+9.7%" },
  { stage: "Format Compliance", metric: "Portal Acceptance Rate", accuracy: "99.9%", manual: "~85%", improvement: "+14.9%" },
];

const commonErrors = [
  { error: "Incorrect section citation", frequency: "23% of manual drafts", prevention: "Legal Taxonomy Agent validates every citation against the regulatory blueprint database" },
  { error: "Mathematical inconsistency", frequency: "18% of manual drafts", prevention: "Compliance Auditor Agent cross-checks all calculations against source ledger data" },
  { error: "Missing evidence linkage", frequency: "31% of manual drafts", prevention: "Ledger Matcher Agent ensures every claim rebuttal references specific vault evidence" },
  { error: "Format non-compliance", frequency: "15% of manual drafts", prevention: "Draft Writer Agent structures output in exact portal-required format (DRC-01, ITR, etc.)" },
  { error: "Deadline miscalculation", frequency: "12% of manual drafts", prevention: "Notice Parser Agent extracts and validates response deadlines against statutory timelines" },
];

export default function Nexus9DraftingEnginePage() {
  const [selectedTab, setSelectedTab] = useState("synthesis-pipeline");
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
        <div className="absolute inset-0 bg-grid-slate-700/25 bg-[size:20px_20px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/80 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Badge className="mb-6 bg-violet-600/20 text-violet-400 border-violet-500/30">
              <Brain className="w-3.5 h-3.5 mr-1.5" />
              Nexus-9™ Drafting Engine • Autonomous Legal Document Generation
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-violet-100 to-purple-200 bg-clip-text text-transparent mb-8 leading-tight">
              Neural Legal
              <br />
              Synthesis Engine
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-4xl mb-12 leading-relaxed">
              Nexus-9™ is a multi-agent cognitive legal synthesis engine that autonomously generates filing-ready
              regulatory defense documents. It reads notices, reasons through legal claims, retrieves evidence from
              client vaults, writes mathematically sound defense drafts, and self-validates — all in under 5 minutes.
              Not a template filler. Not a prompt wrapper. A cognitive legal engine.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-wrap gap-4 mb-14">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 px-8 py-4 text-lg" onClick={() => navigate("/auth?mode=signup&role=external_ca")}>
              <Play className="w-5 h-5 mr-2" />
              See It In Action
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-8 py-4 text-lg">
              <Download className="w-5 h-5 mr-2" />
              Technical Architecture PDF
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-8 py-4 text-lg" onClick={() => navigate("/platform/compliance-command-center")}>
              Compliance Command Center
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Hero KPI Cards */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nexusMetrics.map((metric, idx) => (
              <motion.div key={idx} onHoverStart={() => setHoveredMetric(idx)} onHoverEnd={() => setHoveredMetric(null)} whileHover={{ scale: 1.05 }} className="relative group">
                <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-violet-500/50 transition-all duration-300 h-full">
                  <CardContent className="pt-6 text-center">
                    <motion.div animate={{ color: hoveredMetric === idx ? "#a78bfa" : "#64748b" }} className="mb-4 flex justify-center">
                      {metric.icon}
                    </motion.div>
                    <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                    <p className="text-sm font-medium text-slate-300 mb-1">{metric.title}</p>
                    <p className="text-xs text-slate-500">{metric.desc}</p>
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: hoveredMetric === idx ? 1 : 0, height: hoveredMetric === idx ? "auto" : 0 }} className="mt-3 pt-3 border-t border-slate-600 overflow-hidden">
                      <p className="text-xs text-violet-400">{metric.detail}</p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Tabbed Content */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-800/50 border border-slate-700 mb-12 h-14">
            <TabsTrigger value="synthesis-pipeline" className="text-white data-[state=active]:bg-violet-600">Neural Synthesis Pipeline</TabsTrigger>
            <TabsTrigger value="document-capabilities" className="text-white data-[state=active]:bg-violet-600">Document Capabilities</TabsTrigger>
            <TabsTrigger value="agent-architecture" className="text-white data-[state=active]:bg-violet-600">Multi-Agent Architecture</TabsTrigger>
            <TabsTrigger value="benchmarks" className="text-white data-[state=active]:bg-violet-600">Accuracy & Benchmarks</TabsTrigger>
          </TabsList>

          {/* TAB 1: Neural Synthesis Pipeline */}
          <TabsContent value="synthesis-pipeline" className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-4xl font-bold text-white mb-3">5-Stage Neural Synthesis Pipeline</h2>
              <p className="text-lg text-slate-300 mb-8 max-w-4xl">
                Nexus-9™ executes a 5-stage cognitive pipeline that transforms a raw notice PDF into a
                filing-ready legal defense. Every stage is a production code path — no templates, no
                copy-paste, no manual intervention. Click any stage to expand full details.
              </p>
            </motion.div>

            {synthesisPipeline.map((stage, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
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
                        <CardTitle className="text-white flex items-center gap-3 text-xl">{stage.icon}{stage.title}</CardTitle>
                        <CardDescription className="text-white/70 mt-1">{stage.subtitle}</CardDescription>
                      </div>
                      <div className="hidden md:flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-center">
                          <p className="text-xs text-white/60">{stage.metric.label}</p>
                          <p className="text-lg font-bold text-white">{stage.metric.value}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <motion.div initial={false} animate={{ height: expandedStage === idx ? "auto" : 0, opacity: expandedStage === idx ? 1 : 0 }} className="overflow-hidden">
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                          <p className="text-white/90 leading-relaxed mb-6">{stage.description}</p>
                          <h4 className="font-semibold text-white mb-3">Technology Stack:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {stage.techStack.map((t, tidx) => (
                              <Badge key={tidx} className="bg-white/15 text-white border-white/30 justify-start p-2.5">
                                <CheckCircle className="w-3.5 h-3.5 mr-2 flex-shrink-0" />{t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="hidden lg:flex flex-col gap-4">
                          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center flex-1 flex flex-col justify-center">
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
              <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Click any stage above to expand full details</p>
              <h3 className="text-2xl font-bold text-white mb-2">Notice PDF → Filing-Ready Defense in &lt;5 Minutes</h3>
              <p className="text-slate-300 max-w-2xl mx-auto">
                All 5 stages execute autonomously. The CA's only role is Stage 5 review — a professional
                validation of the AI-synthesized defense, not a manual build.
              </p>
            </motion.div>
          </TabsContent>

          {/* TAB 2: Document Generation Capabilities */}
          <TabsContent value="document-capabilities" className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-4xl font-bold text-white mb-3">Document Generation Capabilities</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                Nexus-9™ generates 40+ types of regulatory and legal documents across GST, Income Tax,
                MCA/ROC, and cross-regulatory domains. Each document type is structured in the exact format
                required by the target regulatory portal — ready for direct submission.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {documentCapabilities.map((category, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.12 }}>
                  <Card className={`bg-gradient-to-br ${category.color} border-0 overflow-hidden h-full`}>
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-3 text-xl">
                        {category.icon}
                        {category.regulator}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2.5">
                        {category.documents.map((doc, didx) => (
                          <div key={didx} className="flex items-start gap-2.5">
                            <CheckCircle className="w-4 h-4 text-white/80 flex-shrink-0 mt-0.5" />
                            <span className="text-white/90 text-sm">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gradient-to-r from-violet-900/30 via-slate-800/50 to-purple-900/30 rounded-2xl p-8 border border-violet-500/20">
              <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
                <div className="p-4 bg-violet-600/20 rounded-xl shrink-0">
                  <Sparkles className="w-10 h-10 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Continuously Expanding Coverage</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Nexus-9™'s document coverage expands with every regulatory update. When CBDT issues a new
                    circular or CBIC modifies a GST form, the legal taxonomy database is updated and new
                    document templates are synthesized automatically. The engine doesn't wait for manual template
                    creation — it <span className="text-violet-300 font-semibold">generates document structures from regulatory rules</span>,
                    not from static templates.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* TAB 3: Multi-Agent Architecture */}
          <TabsContent value="agent-architecture" className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-4xl font-bold text-white mb-3">Cognitive Agent Architecture</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                Nexus-9™ is powered by 5 specialized cognitive agents, each with a defined scope and responsibility.
                The agents execute in a deterministic DAG (directed acyclic graph) via LangGraph stateful orchestration,
                with checkpoint recovery on failure. Each agent's output feeds into the next — no single-prompt shortcuts.
              </p>
            </motion.div>

            <div className="space-y-6">
              {agentSpecs.map((agent, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.12 }}>
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-violet-500/30 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-3">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-3 ${agent.bgColor} rounded-xl ${agent.color}`}>{agent.icon}</div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{agent.agent}</h3>
                              <Badge className="bg-violet-600/20 text-violet-400 border-violet-500/30 mt-1">Accuracy: {agent.accuracy}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="lg:col-span-5">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Scope</p>
                          <p className="text-slate-300 text-sm mb-3">{agent.scope}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Input</p>
                          <p className="text-slate-400 text-sm">{agent.input}</p>
                        </div>
                        <div className="lg:col-span-4">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Output</p>
                          <p className="text-slate-300 text-sm">{agent.output}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Architecture Callout */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gradient-to-r from-violet-900/20 via-slate-800/50 to-purple-900/20 rounded-2xl p-8 border border-violet-500/20">
              <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
                <div className="p-4 bg-violet-600/20 rounded-xl shrink-0">
                  <Workflow className="w-10 h-10 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Why Multi-Agent, Not Single-LLM?</h3>
                  <p className="text-slate-300 leading-relaxed">
                    A single LLM prompt cannot reliably decompose a 47-page GST notice, cross-reference it against
                    3 years of ledger data, identify the specific ITC discrepancy, calculate the correct tax liability,
                    draft a legally valid response, and map it to the CA's UDIN — all in one pass. Nexus-9™ uses
                    <span className="text-violet-300 font-semibold"> stateful multi-agent orchestration </span>
                    where each agent has a defined scope and the framework ensures deterministic execution order
                    with checkpoint recovery on failure.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* TAB 4: Accuracy & Benchmarks */}
          <TabsContent value="benchmarks" className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-4xl font-bold text-white mb-3">Accuracy & Performance Benchmarks</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                Stage-by-stage performance metrics comparing Nexus-9™ autonomous drafting against
                traditional manual workflows. The engine achieves &gt;99% accuracy across all critical
                dimensions — with the CA review layer as the final quality gate.
              </p>
            </motion.div>

            {/* Benchmark Table */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-5 gap-4 p-6 bg-slate-700/50 border-b border-slate-600">
                  <div className="text-sm font-semibold text-white">Stage</div>
                  <div className="text-sm font-semibold text-white">Metric</div>
                  <div className="text-sm font-semibold text-violet-400">Nexus-9™</div>
                  <div className="text-sm font-semibold text-red-400">Manual Process</div>
                  <div className="text-sm font-semibold text-emerald-400">Improvement</div>
                </div>
                {benchmarkData.map((row, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                    className={`grid grid-cols-5 gap-4 p-6 ${idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/50"} border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors`}
                  >
                    <div className="text-white font-medium text-sm">{row.stage}</div>
                    <div className="text-slate-300 text-sm">{row.metric}</div>
                    <div className="text-violet-300 font-semibold text-sm">{row.accuracy}</div>
                    <div className="text-red-400/80 text-sm">{row.manual}</div>
                    <div><Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30">{row.improvement}</Badge></div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Error Prevention */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="text-2xl font-bold text-white mb-6">Human Error Prevention</h3>
              <p className="text-slate-300 mb-8 max-w-4xl">
                The most common human errors in manual compliance drafting — and how Nexus-9™ prevents each one.
              </p>
              <div className="space-y-4">
                {commonErrors.map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                          <div className="lg:col-span-3">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="font-semibold text-white text-sm">{item.error}</span>
                            </div>
                            <Badge className="bg-red-600/20 text-red-400 border-red-500/30">{item.frequency}</Badge>
                          </div>
                          <div className="lg:col-span-9">
                            <div className="flex items-start gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span className="text-slate-300 text-sm">{item.prevention}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quality Assurance Callout */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gradient-to-r from-violet-900/20 via-slate-800/50 to-purple-900/20 rounded-2xl p-8 border border-violet-500/20">
              <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
                <div className="p-4 bg-violet-600/20 rounded-xl shrink-0">
                  <Eye className="w-10 h-10 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">The CA Review Layer</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Despite &gt;99% accuracy across all agents, every Nexus-9™ draft must pass through the
                    CA's professional review before submission. This is by design — Sannidh is a
                    <span className="text-violet-300 font-semibold"> "human-verified autonomous execution" </span>
                    platform, not a fully unattended system. The CA validates the AI-synthesized defense
                    in a split-screen workspace (notice on the left, defense on the right) with inline
                    audit traces linking every claim to its source evidence. The review typically takes ~10 minutes.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Final CTA */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-20 bg-gradient-to-br from-violet-900/30 via-slate-800/50 to-purple-900/30 rounded-2xl p-12 text-center border border-slate-700 backdrop-blur">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent mb-6">
            From Notice to Defense. In Minutes, Not Days.
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Nexus-9™ is not a template filler. Not a prompt wrapper. It is a cognitive legal synthesis
            engine that reads, reasons, retrieves, writes, and validates — autonomously generating
            filing-ready regulatory defense that the CA validates with a single review.
          </p>
          <div className="flex flex-wrap gap-6 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 px-10 py-4 text-lg" onClick={() => navigate("/auth?mode=signup&role=external_ca")}>
              <Play className="w-5 h-5 mr-2" />See It In Action
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-10 py-4 text-lg">
              <FileText className="w-5 h-5 mr-2" />Technical Architecture PDF
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-10 py-4 text-lg" onClick={() => navigate("/platform/infrastructure")}>
              <Landmark className="w-5 h-5 mr-2" />Sovereign Infrastructure
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center pt-8 border-t border-slate-700">
            <div><p className="text-3xl font-bold text-white mb-1">&lt;5 min</p><p className="text-sm text-slate-400">Draft Generation</p></div>
            <div><p className="text-3xl font-bold text-white mb-1">40+</p><p className="text-sm text-slate-400">Document Types</p></div>
            <div><p className="text-3xl font-bold text-white mb-1">&gt;99.2%</p><p className="text-sm text-slate-400">Legal Accuracy</p></div>
            <div><p className="text-3xl font-bold text-white mb-1">5</p><p className="text-sm text-slate-400">Cognitive Agents</p></div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
