import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
  Landmark,
  Shield,
  Database,
  Lock,
  Server,
  Globe,
  CheckCircle,
  Zap,
  Cloud,
  Eye,
  FileText,
  Download,
  ArrowRight,
  Cpu,
  Network,
  HardDrive,
  Key,
  Fingerprint,
  Activity,
  Layers,
  Timer,
  ShieldCheck,
  AlertTriangle,
  Building2,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/**
 * SANNIDH — Sovereign Infrastructure Overview
 * How SANNIDH secures national data via Indian-sovereign cloud architecture,
 * authenticated GSP ingestion, isolated client vaults, and zero-trust data governance.
 */

// Core sovereign data residency pillars
const sovereignPillars = [
  {
    icon: <Landmark className="w-8 h-8" />,
    title: "100% Indian Data Residency",
    value: "MeitY Empaneled",
    desc: "All taxpayer data lives exclusively on Indian sovereign cloud infrastructure — no cross-border data transfer, ever.",
    detail: "DPDP Act 2026 Compliant"
  },
  {
    icon: <Lock className="w-8 h-8" />,
    title: "AES-256 Vault Encryption",
    value: "End-to-End",
    desc: "Every client vault is encrypted at rest and in transit using military-grade AES-256 with automated key rotation.",
    detail: "Field-level encryption on PII"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Row-Level Security (RLS)",
    value: "Client Isolated",
    desc: "PostgreSQL RLS enforces strict tenant isolation — one client's data is cryptographically invisible to all others.",
    detail: "Zero cross-tenant leakage"
  },
  {
    icon: <Fingerprint className="w-8 h-8" />,
    title: "OAuth Consent Gateway",
    value: "Zero-Trust Auth",
    desc: "Every data access requires explicit OAuth 2.0 consent from the client — no blanket API keys, no ambient authority.",
    detail: "PKCE + JWT session binding"
  },
];

// Authenticated GSP Ingestion Pipeline — real production architecture
const gspIngestionPipeline = [
  {
    stage: "1",
    title: "One-Click Mandate Contract",
    subtitle: "CA → Client Consent Request",
    description: "The CA initiates an encrypted OAuth consent request link from Sannidh. The payload is sent via a secure URL endpoint to the client for instant digital authorization. No manual document exchange. The consent includes granular scopes — filing access, ledger read, notice pull — each individually revocable.",
    tech: ["OAuth 2.0 + PKCE", "Encrypted Consent Token", "Granular Scope Selection", "Digital Signature Binding"],
    color: "from-cyan-600 to-cyan-800",
    icon: <Key className="w-6 h-6" />,
    metric: { label: "Consent Execution", value: "<30 sec" },
  },
  {
    stage: "2",
    title: "Authenticated System Ingestion",
    subtitle: "GSP API Production Routes",
    description: "Client approval fires an event trigger invoking authorized GSP (GST Suvidha Provider) APIs via production routes (Decentro/Setu). Sannidh securely fetches historical filings, live multi-bank transaction ledgers, and previous returns — organizing the structured schema into an isolated Client Vault.",
    tech: ["GSP Production API (Decentro/Setu)", "Multi-Bank Ledger Aggregation", "Structured Schema Mapping", "Isolated Client Vault Storage"],
    color: "from-blue-600 to-blue-800",
    icon: <Database className="w-6 h-6" />,
    metric: { label: "Ingestion Latency", value: "<45 sec" },
  },
  {
    stage: "3",
    title: "Real-Time Portal Interception",
    subtitle: "Sentinel™ Daemon Polling",
    description: "Background daemons run persistent 24/7 cron-based polls across GSTN, Income Tax, and MCA portals. The millisecond a statutory notice hits, Sannidh bypasses human lag, downloads the document, and fires a zero-latency system alert to the CA's Command Center.",
    tech: ["24/7 Cron Daemon Polling", "GSTN / IT / MCA Portal Hooks", "Zero-Latency Alert System", "Auto Document Download"],
    color: "from-violet-600 to-violet-800",
    icon: <Eye className="w-6 h-6" />,
    metric: { label: "Threat Intercept", value: "<2 min" },
  },
];

// Client Vault Architecture — database-level isolation
const vaultArchitecture = [
  {
    layer: "Ingestion Layer",
    color: "from-cyan-600 to-cyan-700",
    icon: <Network className="w-6 h-6" />,
    components: [
      "GSP Authenticated API Connectors",
      "Multi-Bank Statement Feed Aggregator",
      "GSTN / IT / MCA Portal Scrapers",
      "Real-Time Document Download Service",
      "Structured Data Schema Normalizer",
    ],
    specs: {
      "Sources": "GSTN, CBDT, MCA, Banks",
      "Protocols": "OAuth 2.0, mTLS",
      "Throughput": "500K events/sec",
      "Format": "JSON, XML, PDF",
    }
  },
  {
    layer: "Client Vault (Isolated Storage)",
    color: "from-blue-600 to-blue-700",
    icon: <Database className="w-6 h-6" />,
    components: [
      "PostgreSQL + pgvector (Supabase)",
      "Row-Level Security (RLS) Enforcement",
      "AES-256 Field-Level Encryption",
      "Legal Taxonomy Vector Index",
      "Immutable Audit Trail Ledger",
    ],
    specs: {
      "Isolation": "RLS per Client",
      "Encryption": "AES-256 at rest",
      "Vector DB": "pgvector (RAG)",
      "Retention": "7-Year Statutory",
    }
  },
  {
    layer: "Compute & Intelligence",
    color: "from-violet-600 to-violet-700",
    icon: <Cpu className="w-6 h-6" />,
    components: [
      "Async Python FastAPI / Node.js TS",
      "LangGraph Multi-Agent Orchestration",
      "Nexus-9™ Neural Legal Synthesis",
      "RAG Pipeline (Vector Similarity Search)",
      "Stateful Agent Framework Trees",
    ],
    specs: {
      "Runtime": "FastAPI + Node.js TS",
      "Agents": "LangGraph / CrewAI",
      "Inference": "Nexus-9™ Engine",
      "Concurrency": "Async (no thread blocks)",
    }
  },
  {
    layer: "Sovereign Infrastructure",
    color: "from-emerald-600 to-emerald-700",
    icon: <Server className="w-6 h-6" />,
    components: [
      "Indian Sovereign Cloud (MeitY Empaneled)",
      "Kubernetes Container Orchestration",
      "Zero-Downtime Rolling Deployments",
      "Prometheus + Grafana Observability",
      "Terraform Infrastructure as Code",
    ],
    specs: {
      "Residency": "100% India",
      "Orchestration": "Kubernetes",
      "Deployment": "Zero-downtime",
      "Monitoring": "24/7/365",
    }
  },
];

// Compliance & data governance certifications
const dataGovernance = [
  {
    standard: "DPDP Act 2026",
    authority: "Ministry of Electronics & IT (India)",
    status: "Compliant",
    scope: "Digital personal data protection for Indian citizens",
    controls: [
      "Purpose limitation on all data processing",
      "Automated data principal rights portal",
      "Consent audit trail with revocation support",
      "Data fiduciary obligation enforcement",
    ],
  },
  {
    standard: "SOC 2 Type II",
    authority: "AICPA Audited",
    status: "Certified",
    scope: "Operational security, availability, and confidentiality",
    controls: [
      "Continuous monitoring of security controls",
      "Penetration testing every 6 months",
      "Incident response SLA: <15 minutes",
      "Immutable audit event logging",
    ],
  },
  {
    standard: "ISO 27001:2022",
    authority: "BSI Certified",
    status: "Certified",
    scope: "Information security management system",
    controls: [
      "Risk-based security control framework",
      "Annual third-party surveillance audit",
      "Asset classification and handling",
      "Business continuity planning",
    ],
  },
  {
    standard: "RBI Data Localization",
    authority: "Reserve Bank of India",
    status: "Compliant",
    scope: "Financial data must reside exclusively on Indian servers",
    controls: [
      "Zero cross-border data transfer enforcement",
      "Indian sovereign cloud infrastructure",
      "Network perimeter restricted to Indian IPs",
      "Real-time data residency attestation",
    ],
  },
];

// Disruption matrix — Sannidh vs legacy vs point AI
const disruptionMatrix = [
  {
    vector: "Data Capture",
    legacy: "Manual Upload/Entry",
    pointAI: "Manual Copy-Paste",
    sannidh: "Auth Token GSP Ingestion",
    advantage: "Authenticated, zero-touch data pull from production GSP APIs — no human keystrokes.",
  },
  {
    vector: "Threat Intercept",
    legacy: "Manual Check (~5 Days)",
    pointAI: "Manual Check (~5 Days)",
    sannidh: "Daemon Polling (<2 Minutes)",
    advantage: "24/7 background daemons intercept notices the millisecond they hit government portals.",
  },
  {
    vector: "Drafting Logic",
    legacy: "Static Math Calculators",
    pointAI: "Isolated Text Templates",
    sannidh: "Neural Legal Synthesis (Nexus-9™)",
    advantage: "Multi-agent RAG pipeline maps ledger data to legal defense, generates filing-ready drafts.",
  },
  {
    vector: "Human Labor Matrix",
    legacy: "100% Manual Execution",
    pointAI: "~60% Human Crafting",
    sannidh: "<5% Human Review Only",
    advantage: "Autonomous execution from ingestion to draft — the CA validates, not manually builds.",
  },
];

// The economic bleed that Sannidh addresses
const economicBleed = [
  {
    amount: "$180B",
    label: "Annual Regulatory Bleed",
    description: "Enterprises globally leak $180 billion annually due to structural human latencies in legal and tax defense — missed deadlines, late compliance penalties, compounding interest on undetected notices, and frozen input tax credits (ITC).",
    icon: <AlertTriangle className="w-8 h-8" />,
    color: "text-red-400",
    bgColor: "bg-red-600/10 border-red-500/20",
  },
  {
    amount: "$400B",
    label: "Compliance Salary Overhead",
    description: "Legal departments and CA networks globally burn $400 billion in human labor capital on brute-force administrative tasks — manual portal checking, document downloading, file splitting, and continuous ledger data entry.",
    icon: <Building2 className="w-8 h-8" />,
    color: "text-orange-400",
    bgColor: "bg-orange-600/10 border-orange-500/20",
  },
];

export default function SovereignInfrastructurePage() {
  const [selectedTab, setSelectedTab] = useState("sovereign-data");
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);
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
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-grid-slate-700/25 bg-[size:20px_20px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/80 to-transparent" />
        {/* Cyan accent glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="mb-6 bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
              <Landmark className="w-3.5 h-3.5 mr-1.5" />
              Sovereign Infrastructure • Indian Data Residency
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent mb-8 leading-tight">
              How SANNIDH Secures
              <br />
              National Data
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-4xl mb-12 leading-relaxed">
              Sannidh is a sovereign compliance infrastructure that processes every byte of taxpayer data
              exclusively on Indian soil. From authenticated GSP ingestion to isolated client vaults
              with row-level security — we have eliminated the paradigm of "upload and pray" SaaS tools
              and replaced it with an autonomous, zero-trust data architecture.
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
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-8 py-4 text-lg"
              onClick={() => navigate("/auth?mode=signup&role=company_owner")}
            >
              <Shield className="w-5 h-5 mr-2" />
              Request Security Assessment
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-8 py-4 text-lg">
              <Download className="w-5 h-5 mr-2" />
              Infrastructure Whitepaper
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-8 py-4 text-lg"
              onClick={() => navigate("/platform/ai-human-review")}
            >
              Agentic Execution Model
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Sovereign Pillars — KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {sovereignPillars.map((pillar, idx) => (
              <motion.div
                key={idx}
                onHoverStart={() => setHoveredPillar(idx)}
                onHoverEnd={() => setHoveredPillar(null)}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-cyan-500/50 transition-all duration-300 h-full">
                  <CardContent className="pt-6 text-center">
                    <motion.div
                      animate={{
                        color: hoveredPillar === idx ? "#22d3ee" : "#64748b"
                      }}
                      className="mb-4 flex justify-center"
                    >
                      {pillar.icon}
                    </motion.div>
                    <p className="text-2xl font-bold text-white mb-1">{pillar.value}</p>
                    <p className="text-sm font-medium text-slate-300 mb-1">{pillar.title}</p>
                    <p className="text-xs text-slate-500">{pillar.desc}</p>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{
                        opacity: hoveredPillar === idx ? 1 : 0,
                        height: hoveredPillar === idx ? "auto" : 0
                      }}
                      className="mt-3 pt-3 border-t border-slate-600 overflow-hidden"
                    >
                      <p className="text-xs text-cyan-400">{pillar.detail}</p>
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
            <TabsTrigger value="sovereign-data" className="text-white data-[state=active]:bg-cyan-600">
              Sovereign Data Residency
            </TabsTrigger>
            <TabsTrigger value="gsp-pipeline" className="text-white data-[state=active]:bg-cyan-600">
              GSP Ingestion Pipeline
            </TabsTrigger>
            <TabsTrigger value="vault-architecture" className="text-white data-[state=active]:bg-cyan-600">
              Client Vault Architecture
            </TabsTrigger>
            <TabsTrigger value="disruption" className="text-white data-[state=active]:bg-cyan-600">
              Disruption Matrix
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB 1: Sovereign Data Residency ─── */}
          <TabsContent value="sovereign-data" className="space-y-12">
            {/* Economic Bleed Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold text-white mb-3">The Global Macroeconomic Bleed</h2>
              <p className="text-lg text-slate-400 mb-8 max-w-4xl">
                Two catastrophic financial drains that Sannidh is engineered to permanently liquidate.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {economicBleed.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.2 }}
                  >
                    <Card className={`${item.bgColor} border h-full`}>
                      <CardContent className="p-8">
                        <div className={`${item.color} mb-4`}>{item.icon}</div>
                        <p className={`text-5xl font-bold ${item.color} mb-2`}>{item.amount}</p>
                        <h3 className="text-xl font-bold text-white mb-3">{item.label}</h3>
                        <p className="text-slate-300 leading-relaxed">{item.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Data Governance & Compliance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-4xl font-bold text-white mb-3">Data Governance & Compliance</h2>
              <p className="text-lg text-slate-400 mb-8 max-w-4xl">
                Sannidh is certified and compliant across every regulatory framework governing financial data in India.
              </p>
              <div className="space-y-6">
                {dataGovernance.map((standard, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/30 transition-all duration-300">
                      <CardContent className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <ShieldCheck className="w-6 h-6 text-cyan-400" />
                              <h3 className="font-bold text-white text-lg">{standard.standard}</h3>
                            </div>
                            <Badge className={`mb-2 ${standard.status === "Certified" ? "bg-green-600/20 text-green-400 border-green-500/30" : "bg-cyan-600/20 text-cyan-400 border-cyan-500/30"}`}>
                              {standard.status}
                            </Badge>
                            <p className="text-xs text-slate-500 mt-1">{standard.authority}</p>
                          </div>
                          <div className="lg:col-span-1">
                            <p className="text-slate-300 text-sm leading-relaxed">{standard.scope}</p>
                          </div>
                          <div className="lg:col-span-2">
                            <h4 className="font-semibold text-white mb-3 text-sm">Active Controls:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {standard.controls.map((control, cidx) => (
                                <div key={cidx} className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-slate-300 text-sm">{control}</span>
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
            </motion.div>

            {/* Paradigm Shift Callout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-cyan-900/30 via-slate-800/50 to-blue-900/30 rounded-2xl p-8 border border-cyan-500/20"
            >
              <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
                <div className="p-4 bg-cyan-600/20 rounded-xl">
                  <Zap className="w-10 h-10 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">The Paradigm Shift</h3>
                  <p className="text-slate-300 leading-relaxed text-lg">
                    Sannidh alters the industry paradigm by moving from a <span className="text-slate-400 line-through">"Human-In-The-Loop SaaS Tool"</span> (Legacy Utilities)
                    to an <span className="text-cyan-300 font-semibold">"Autonomous Infrastructure Ecosystem"</span> (Zero-Touch Execution).
                    This is not an incremental upgrade — it is a structural displacement of the $580B annual compliance inefficiency.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ─── TAB 2: GSP Ingestion Pipeline ─── */}
          <TabsContent value="gsp-pipeline" className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold text-white mb-3">Authenticated GSP Ingestion Pipeline</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                Sannidh's data capture begins with an authenticated, consent-gated connection to government
                GSP (GST Suvidha Provider) production APIs — not manual uploads, not scraped portals, not copy-paste workflows.
                Every byte enters through a verified, auditable channel.
              </p>

              <div className="space-y-8">
                {gspIngestionPipeline.map((stage, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.15 }}
                  >
                    <Card className={`bg-gradient-to-r ${stage.color} border-0 overflow-hidden`}>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl font-bold text-white">
                            {stage.stage}
                          </div>
                          <div>
                            <CardTitle className="text-white flex items-center gap-3 text-xl">
                              {stage.icon}
                              {stage.title}
                            </CardTitle>
                            <CardDescription className="text-white/70 mt-1">{stage.subtitle}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-2">
                            <p className="text-white/90 leading-relaxed mb-6">{stage.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {stage.tech.map((t, tidx) => (
                                <Badge key={tidx} className="bg-white/15 text-white border-white/30 justify-start p-2.5">
                                  <CheckCircle className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white/10 backdrop-blur rounded-lg p-6 flex flex-col items-center justify-center text-center">
                            <p className="text-white/70 text-sm mb-2">{stage.metric.label}</p>
                            <p className="text-4xl font-bold text-white">{stage.metric.value}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Pipeline Flow Diagram */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700"
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center">End-to-End Data Flow</h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {[
                  { label: "CA Sends Consent Link", icon: <Key className="w-5 h-5" /> },
                  { label: "Client Authorizes", icon: <Fingerprint className="w-5 h-5" /> },
                  { label: "GSP API Fires", icon: <Network className="w-5 h-5" /> },
                  { label: "Data Enters Vault", icon: <Database className="w-5 h-5" /> },
                  { label: "Sentinel™ Active", icon: <Eye className="w-5 h-5" /> },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white">
                        {step.icon}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 text-center max-w-[100px]">{step.label}</p>
                    </div>
                    {idx < 4 && (
                      <ArrowRight className="w-5 h-5 text-cyan-500 hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* ─── TAB 3: Client Vault Architecture ─── */}
          <TabsContent value="vault-architecture" className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold text-white mb-3">Isolated Client Vault Architecture</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                Every client's financial data lives in a cryptographically isolated vault built on PostgreSQL with
                pgvector extensions (Supabase). Row-Level Security ensures that no API call, no admin action,
                and no platform bug can ever leak data across tenant boundaries.
              </p>

              <div className="space-y-8">
                {vaultArchitecture.map((layer, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.12 }}
                  >
                    <Card className={`bg-gradient-to-r ${layer.color} border-0 overflow-hidden`}>
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3 text-xl">
                          {layer.icon}
                          {layer.layer}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {layer.components.map((component, cidx) => (
                                <Badge key={cidx} className="bg-white/15 text-white border-white/30 justify-start p-2.5">
                                  <CheckCircle className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                                  {component}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                            <h4 className="font-semibold text-white mb-4">Technical Specs</h4>
                            <div className="space-y-3">
                              {Object.entries(layer.specs).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-white/70">{key}:</span>
                                  <span className="font-semibold text-white">{value}</span>
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
            </motion.div>

            {/* Security Detail Callout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-blue-900/30 via-slate-800/50 to-violet-900/30 rounded-2xl p-8 border border-blue-500/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-4xl font-bold text-cyan-400 mb-2">7 Years</p>
                  <p className="text-white font-semibold mb-1">Statutory Data Retention</p>
                  <p className="text-sm text-slate-400">Immutable audit trail for every regulatory action</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-cyan-400 mb-2">RLS</p>
                  <p className="text-white font-semibold mb-1">Row-Level Security</p>
                  <p className="text-sm text-slate-400">Database-enforced tenant isolation per client</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-cyan-400 mb-2">AES-256</p>
                  <p className="text-white font-semibold mb-1">Field-Level Encryption</p>
                  <p className="text-sm text-slate-400">PII encrypted at column level, not just disk</p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ─── TAB 4: Disruption Matrix ─── */}
          <TabsContent value="disruption" className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold text-white mb-3">Competitive Disruption Matrix</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                Sannidh is architecturally positioned to exploit the engineering gaps of legacy compliance utilities
                and isolated AI point-solutions. This is not feature parity — it is structural displacement.
              </p>

              <div className="space-y-6">
                {disruptionMatrix.map((row, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.12 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/30 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          {/* Vector Label */}
                          <div className="lg:col-span-2">
                            <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30 mb-2">
                              {row.vector}
                            </Badge>
                          </div>
                          {/* Comparison Columns */}
                          <div className="lg:col-span-3">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Legacy Utilities</p>
                            <p className="text-sm text-red-400/80 line-through">{row.legacy}</p>
                          </div>
                          <div className="lg:col-span-3">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Point AI Solutions</p>
                            <p className="text-sm text-orange-400/80 line-through">{row.pointAI}</p>
                          </div>
                          <div className="lg:col-span-4">
                            <p className="text-xs text-cyan-500 uppercase tracking-wider mb-1">SANNIDH Autonomous Engine</p>
                            <p className="text-sm text-cyan-300 font-semibold mb-2">{row.sannidh}</p>
                            <p className="text-xs text-slate-400">{row.advantage}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Summary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 text-center"
            >
              <h3 className="text-2xl font-bold text-white mb-3">From Utility to Infrastructure</h3>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                Legacy tools are utilities — they assist humans. Sannidh is infrastructure — it executes autonomously.
                The competitive moat is not a feature list, it is an architectural category difference.
              </p>
              <Button
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-8"
                onClick={() => navigate("/platform/ai-human-review")}
              >
                <Cpu className="w-4 h-4 mr-2" />
                Explore the Agentic Execution Model
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Final CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20 bg-gradient-to-br from-cyan-900/30 via-slate-800/50 to-blue-900/30 rounded-2xl p-12 text-center border border-slate-700 backdrop-blur"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-6">
            Sovereign. Encrypted. Autonomous.
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Your taxpayer data never leaves India. Every vault is isolated. Every access is audited.
            Every notice is intercepted before your competitors even check their email.
          </p>

          <div className="flex flex-wrap gap-6 justify-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-10 py-4 text-lg"
              onClick={() => navigate("/auth?mode=signup&role=company_owner")}
            >
              <Shield className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-10 py-4 text-lg">
              <FileText className="w-5 h-5 mr-2" />
              Download Whitepaper
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center pt-8 border-t border-slate-700">
            <div>
              <p className="text-3xl font-bold text-white mb-1">100%</p>
              <p className="text-sm text-slate-400">Indian Data Residency</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">&lt;2 min</p>
              <p className="text-sm text-slate-400">Notice Interception Time</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">AES-256</p>
              <p className="text-sm text-slate-400">Vault Encryption Standard</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-1">&lt;5%</p>
              <p className="text-sm text-slate-400">Human Touch Required</p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
