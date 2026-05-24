import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Shield,
  Activity,
  Calendar,
  CheckCircle,
  Zap,
  FileText,
  Download,
  ArrowRight,
  Eye,
  Database,
  Lock,
  Network,
  Globe,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Users,
  Layers,
  Target,
  ChevronRight,
  Landmark,
  Clock,
  Gauge,
  PieChart,
  LineChart,
  ShieldCheck,
  Play,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/**
 * SANNIDH — Compliance Command Center
 * Unified Dashboard for Multiple Taxpayer Entities — the high-density executive
 * console where CAs manage compliance across their entire client portfolio.
 */

const commandMetrics = [
  {
    icon: <Building2 className="w-8 h-8" />,
    title: "Multi-Entity Coverage",
    value: "500+",
    desc: "Manage compliance for unlimited taxpayer entities from one console",
    detail: "GST, IT, MCA, FEMA, SEBI",
  },
  {
    icon: <AlertTriangle className="w-8 h-8" />,
    title: "Threat Detection",
    value: "Real-Time",
    desc: "Live statutory notice interception across all client portals",
    detail: "<2 min intercept latency",
  },
  {
    icon: <Activity className="w-8 h-8" />,
    title: "Compliance Score",
    value: "AI-Graded",
    desc: "Dynamic compliance health scores per entity, per regulator",
    detail: "Updated every 24 hours",
  },
  {
    icon: <Calendar className="w-8 h-8" />,
    title: "Unified Calendar",
    value: "Smart",
    desc: "Consolidated deadline calendar across all entities and regulators",
    detail: "Auto-buffer alerts at 7, 3, 1 day",
  },
];

const dashboardViews = [
  {
    title: "Global Threat Command Console",
    subtitle: "The Practitioner's War Room",
    icon: <AlertTriangle className="w-8 h-8" />,
    description:
      "A real-time feed of all active compliance threats across the entire client portfolio, sorted by severity (Critical / High / Medium / Low), deadline proximity, and financial exposure. The CA sees every statutory risk across hundreds of entities in one high-density console — no tab-switching, no portal-hopping, no manual aggregation.",
    features: [
      "Priority queuing with severity-based auto-sorting",
      "Batch notice processing for high-volume practices",
      "Color-coded severity indicators (Critical → Low)",
      "Financial impact estimates per threat with penalty projections",
      "One-click drill-down to Nexus-9™ defense drafting",
    ],
    color: "border-red-500/30 bg-red-900/10",
    accentColor: "text-red-400",
  },
  {
    title: "Multi-Entity Health Matrix",
    subtitle: "Portfolio-Wide Compliance Vitals",
    icon: <Activity className="w-8 h-8" />,
    description:
      "A grid view showing every managed entity with AI-computed compliance health scores across GST, Income Tax, MCA, and other regulators. Each cell shows filing status, pending actions, and risk indicators. The matrix surfaces which entities need immediate attention and which are operating cleanly — at a glance.",
    features: [
      "Sortable by health score, entity name, or risk level",
      "Filterable by regulator (GST, IT, MCA, FEMA, SEBI)",
      "Drill-down to individual entity vault and filing history",
      "Trend indicators showing improving or declining compliance",
      "Auto-flagging of entities approaching statutory deadlines",
    ],
    color: "border-emerald-500/30 bg-emerald-900/10",
    accentColor: "text-emerald-400",
  },
  {
    title: "Unified Deadline Calendar",
    subtitle: "Multi-Entity Statutory Timeline",
    icon: <Calendar className="w-8 h-8" />,
    description:
      "A consolidated timeline view showing every statutory deadline across all entities and regulators in one chronological feed. The calendar detects deadline clustering — when multiple filings converge on the same date — and suggests workload balancing strategies to prevent last-minute bottlenecks.",
    features: [
      "Auto-generated buffer alerts at 7, 3, and 1 day before deadline",
      "Conflict detection when multiple deadlines cluster",
      "Workload balancing suggestions for CA team allocation",
      "Batch filing queue for same-deadline submissions",
      "Regulator-specific color coding for instant visual parsing",
    ],
    color: "border-blue-500/30 bg-blue-900/10",
    accentColor: "text-blue-400",
  },
];

const portalSyncPipeline = [
  {
    stage: "1",
    title: "GSTN Portal Sync",
    subtitle: "GST Suvidha Provider (GSP) Production API",
    description:
      "Real-time synchronization with the GST Network for all client GSTINs via authenticated GSP production routes (Decentro/Setu). Sannidh automatically downloads notices, tracks return filing status, monitors ITC ledger balances, and reconciles GSTR-2B vs purchase registers — across every client entity simultaneously.",
    tech: ["GSP Production API (Decentro/Setu)", "Multi-GSTIN Parallel Sync", "Auto Notice Download & Archive", "ITC Reconciliation Engine"],
    color: "from-emerald-600 to-emerald-800",
    icon: <Globe className="w-6 h-6" />,
    metric: { label: "Sync Frequency", value: "Every 4h" },
  },
  {
    stage: "2",
    title: "Income Tax Portal Sync",
    subtitle: "CBDT e-Filing Portal Monitoring",
    description:
      "24/7 background daemon monitoring of the CBDT Income Tax e-Filing portal across all client PANs. Sannidh intercepts faceless assessment notices under Section 143(2), demand letters under Section 156, refund status changes, and outstanding demand notices — filing zero-latency alerts the moment any action appears.",
    tech: ["Multi-PAN Parallel Monitoring", "Faceless Assessment Notice Intercept", "Demand Letter Auto-Detection", "Refund Status Tracking & Alerts"],
    color: "from-blue-600 to-blue-800",
    icon: <Shield className="w-6 h-6" />,
    metric: { label: "Detection Latency", value: "<2 min" },
  },
  {
    stage: "3",
    title: "MCA Portal Sync",
    subtitle: "ROC Filing & Company Master Data",
    description:
      "Continuous monitoring of the MCA V3 portal for all managed companies. Sannidh tracks ROC filing deadlines (AOC-4, MGT-7, ADT-1), monitors company master data changes, DIN status updates, charge creation events, and compliance status flags — ensuring no filing window is ever missed.",
    tech: ["Company Master Data Change Alerts", "Annual Return Deadline Tracking", "DIN & DSC Expiry Monitoring", "Charge Creation/Modification Alerts"],
    color: "from-violet-600 to-violet-800",
    icon: <Building2 className="w-6 h-6" />,
    metric: { label: "Entity Coverage", value: "Unlimited" },
  },
  {
    stage: "4",
    title: "Multi-Bank Ledger Aggregation",
    subtitle: "Account Aggregator Framework Integration",
    description:
      "Aggregated bank statement feeds from multiple banking institutions per entity via the RBI-regulated Account Aggregator (AA) framework. Sannidh pulls structured financial data — credits, debits, running balances — directly into each client's vault for instant cross-referencing during notice defense and compliance audit.",
    tech: ["RBI Account Aggregator (AA) Framework", "Multi-Bank Statement Aggregation", "Structured Transaction Classification", "Real-Time Balance Monitoring"],
    color: "from-amber-600 to-amber-800",
    icon: <Database className="w-6 h-6" />,
    metric: { label: "Bank Sources", value: "50+" },
  },
];

const vaultCapabilities = [
  {
    title: "Row-Level Security Isolation",
    description: "Every client entity gets a cryptographically isolated vault enforced by PostgreSQL Row-Level Security (RLS). No API call, no admin action, and no platform bug can ever leak data across tenant boundaries. The CA sees a unified view across clients, but at the database level, each vault is invisible to every other tenant.",
    icon: <Lock className="w-6 h-6" />,
    stats: { value: "Database-Enforced RLS" },
  },
  {
    title: "Consent-Gated Access Control",
    description: "Every data access is gated by explicit OAuth 2.0 consent from the client entity. Consent carries granular scopes — filing access, ledger read, notice pull — each individually revocable by the client at any time. No blanket API keys, no ambient authority, no assumed permissions.",
    icon: <ShieldCheck className="w-6 h-6" />,
    stats: { value: "OAuth 2.0 + PKCE" },
  },
  {
    title: "7-Year Statutory Retention",
    description: "All regulatory actions, filings, notices, responses, and audit trails are stored in an immutable ledger with 7-year statutory retention. Every action is timestamped, cryptographically signed, and available for regulatory audit at any point — meeting the statutory requirement across GST, Income Tax, and Companies Act.",
    icon: <Database className="w-6 h-6" />,
    stats: { value: "7 Years (Immutable)" },
  },
  {
    title: "Vector-Indexed Document Store",
    description: "All documents — notices, filings, bank statements, ledger data — are indexed using pgvector embeddings for semantic search and instant retrieval. When Nexus-9™ needs to find a specific transaction from 3 years ago to substantiate a defense, the RAG pipeline retrieves it in milliseconds.",
    icon: <Layers className="w-6 h-6" />,
    stats: { value: "pgvector RAG" },
  },
];

const analyticsCapabilities = [
  {
    metric: "Revenue Protected",
    description: "Track how much penalty exposure has been eliminated through timely notice responses, correct filings, and proactive compliance. Sannidh calculates the financial impact of every intercepted notice and every submitted defense — showing the tangible ROI of the compliance infrastructure.",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "text-emerald-400",
  },
  {
    metric: "Hours Saved Analytics",
    description: "Real-time comparison of autonomous pipeline execution time vs. estimated manual workflow time. Track cumulative hours saved across the practice — from notice detection to draft generation to portal submission — quantifying the operational efficiency gain.",
    icon: <Clock className="w-6 h-6" />,
    color: "text-cyan-400",
  },
  {
    metric: "Client Risk Distribution",
    description: "Visual distribution of client entities by compliance risk level. Identify which clients are in the green zone (all filings current, no pending notices) vs. the red zone (overdue filings, active notices, approaching deadlines) — enabling proactive resource allocation.",
    icon: <PieChart className="w-6 h-6" />,
    color: "text-amber-400",
  },
  {
    metric: "Regulatory Change Impact",
    description: "When CBDT, CBIC, or MCA issues new circulars, notifications, or rule changes, Sannidh maps the impact across your entire client portfolio. Identify which entities are affected, what compliance actions are required, and the deadline for implementation.",
    icon: <Zap className="w-6 h-6" />,
    color: "text-violet-400",
  },
  {
    metric: "Practice Performance Dashboard",
    description: "Firm-level KPIs for CA practice management — filings completed, notices resolved, average response time, client satisfaction metrics, and team productivity analytics. Generate automated MIS reports for partner meetings and firm governance.",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "text-pink-400",
  },
  {
    metric: "Compliance Trend Analysis",
    description: "Historical trend analysis showing compliance health trajectory over time for each entity and the overall portfolio. Identify seasonal patterns, recurring risk areas, and systemic improvement trends — enabling data-driven advisory conversations with clients.",
    icon: <LineChart className="w-6 h-6" />,
    color: "text-blue-400",
  },
];

export default function ComplianceCommandCenterPage() {
  const [selectedTab, setSelectedTab] = useState("dashboard-architecture");
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null);
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Badge className="mb-6 bg-emerald-600/20 text-emerald-400 border-emerald-500/30">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Compliance Command Center • Unified Multi-Entity Dashboard
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent mb-8 leading-tight">
              One Console.
              <br />
              Every Client.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-4xl mb-12 leading-relaxed">
              Sannidh's Compliance Command Center is a unified, high-density executive console where
              CAs manage compliance across their entire client portfolio — hundreds of entities, six
              regulatory domains, thousands of deadlines — from a single pane of glass. No portal-hopping.
              No spreadsheet tracking. No blind spots.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-wrap gap-4 mb-14">
            <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-8 py-4 text-lg" onClick={() => navigate("/auth?mode=signup&role=external_ca")}>
              <Play className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-8 py-4 text-lg">
              <Download className="w-5 h-5 mr-2" />
              Architecture Whitepaper
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-8 py-4 text-lg" onClick={() => navigate("/platform/ai-human-review")}>
              Agentic Execution Model
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Hero KPI Cards */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {commandMetrics.map((metric, idx) => (
              <motion.div key={idx} onHoverStart={() => setHoveredMetric(idx)} onHoverEnd={() => setHoveredMetric(null)} whileHover={{ scale: 1.05 }} className="relative group">
                <Card className="bg-slate-800/50 backdrop-blur border-slate-700 hover:border-emerald-500/50 transition-all duration-300 h-full">
                  <CardContent className="pt-6 text-center">
                    <motion.div animate={{ color: hoveredMetric === idx ? "#34d399" : "#64748b" }} className="mb-4 flex justify-center">
                      {metric.icon}
                    </motion.div>
                    <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                    <p className="text-sm font-medium text-slate-300 mb-1">{metric.title}</p>
                    <p className="text-xs text-slate-500">{metric.desc}</p>
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: hoveredMetric === idx ? 1 : 0, height: hoveredMetric === idx ? "auto" : 0 }} className="mt-3 pt-3 border-t border-slate-600 overflow-hidden">
                      <p className="text-xs text-emerald-400">{metric.detail}</p>
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
            <TabsTrigger value="dashboard-architecture" className="text-white data-[state=active]:bg-emerald-600">Dashboard Architecture</TabsTrigger>
            <TabsTrigger value="portal-sync" className="text-white data-[state=active]:bg-emerald-600">Multi-Portal Sync</TabsTrigger>
            <TabsTrigger value="vault-network" className="text-white data-[state=active]:bg-emerald-600">Client Vault Network</TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-emerald-600">Compliance Analytics</TabsTrigger>
          </TabsList>

          {/* TAB 1: Dashboard Architecture */}
          <TabsContent value="dashboard-architecture" className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-4xl font-bold text-white mb-3">Command Dashboard Architecture</h2>
              <p className="text-lg text-slate-300 mb-4 max-w-4xl">
                Three premium high-density executive consoles designed on the Obsidian Slate system palette
                (<code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded text-sm">#0B0F19</code> background,
                <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded text-sm ml-1">#FFFFFF</code> high-contrast text,
                <code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded text-sm ml-1">#34D399</code> Emerald status metrics).
              </p>
            </motion.div>

            <div className="space-y-8">
              {dashboardViews.map((dashboard, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.15 }}>
                  <Card className={`border ${dashboard.color} transition-all duration-300 hover:scale-[1.01]`}>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 bg-slate-700/50 rounded-xl ${dashboard.accentColor}`}>{dashboard.icon}</div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{dashboard.title}</h3>
                              <p className="text-sm text-slate-400">{dashboard.subtitle}</p>
                            </div>
                          </div>
                          <p className="text-slate-300 leading-relaxed text-sm">{dashboard.description}</p>
                        </div>
                        <div className="lg:col-span-2">
                          <h4 className="font-semibold text-white mb-4">Core Capabilities:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {dashboard.features.map((feature, fidx) => (
                              <div key={fidx} className="flex items-start gap-2 p-3 bg-slate-700/30 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gradient-to-r from-emerald-900/30 via-slate-800/50 to-teal-900/30 rounded-2xl p-8 border border-emerald-500/20">
              <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
                <div className="p-4 bg-emerald-600/20 rounded-xl">
                  <Target className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Zero Blind Spots</h3>
                  <p className="text-slate-300 leading-relaxed text-lg">
                    Legacy CA practice management runs on <span className="text-slate-400 line-through">"spreadsheets + portal bookmarks + calendar reminders"</span>.
                    Sannidh replaces this fragmented workflow with a <span className="text-emerald-300 font-semibold">unified compliance intelligence layer</span> that
                    aggregates every threat, every deadline, and every filing status from every regulator into a single command center.
                    The CA never misses a notice. Never misses a deadline. Never loses visibility.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* TAB 2: Multi-Portal Sync */}
          <TabsContent value="portal-sync" className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-4xl font-bold text-white mb-3">Multi-Portal Synchronization</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                Sannidh maintains persistent authenticated connections to every major government regulatory portal —
                GSTN, Income Tax, MCA — plus multi-bank financial data aggregation via the RBI Account Aggregator framework.
                Every entity's data is synced in the background, continuously, without human intervention.
              </p>

              <div className="space-y-8">
                {portalSyncPipeline.map((stage, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.15 }}>
                    <Card className={`bg-gradient-to-r ${stage.color} border-0 overflow-hidden`}>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl font-bold text-white">{stage.stage}</div>
                          <div>
                            <CardTitle className="text-white flex items-center gap-3 text-xl">{stage.icon}{stage.title}</CardTitle>
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
                                  <CheckCircle className="w-3.5 h-3.5 mr-2 flex-shrink-0" />{t}
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Continuous Synchronization Flow</h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {[
                  { label: "Portal Daemons Active", icon: <Eye className="w-5 h-5" /> },
                  { label: "Data Intercepted", icon: <Network className="w-5 h-5" /> },
                  { label: "Schema Normalized", icon: <Layers className="w-5 h-5" /> },
                  { label: "Vault Encrypted", icon: <Lock className="w-5 h-5" /> },
                  { label: "Command Center Live", icon: <Gauge className="w-5 h-5" /> },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white">{step.icon}</div>
                      <p className="text-xs text-slate-400 mt-2 text-center max-w-[100px]">{step.label}</p>
                    </div>
                    {idx < 4 && <ArrowRight className="w-5 h-5 text-emerald-500 hidden md:block" />}
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* TAB 3: Client Vault Network */}
          <TabsContent value="vault-network" className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-4xl font-bold text-white mb-3">Isolated Client Vault Network</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                Every client entity managed through the Command Center gets a cryptographically isolated vault
                built on PostgreSQL with pgvector extensions (Supabase). The CA sees a unified portfolio view,
                but at the database level, each vault is invisible to every other tenant — enforced by Row-Level Security.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {vaultCapabilities.map((capability, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.12 }}>
                    <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/30 transition-all duration-300 h-full">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-emerald-600/20 rounded-xl text-emerald-400">{capability.icon}</div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{capability.title}</h3>
                            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 mt-1">{capability.stats.value}</Badge>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{capability.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-gradient-to-r from-emerald-900/30 via-slate-800/50 to-teal-900/30 rounded-2xl p-8 border border-emerald-500/20">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                  <p className="text-4xl font-bold text-emerald-400 mb-2">RLS</p>
                  <p className="text-white font-semibold mb-1">Row-Level Security</p>
                  <p className="text-sm text-slate-400">Database-enforced tenant isolation per client entity</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-emerald-400 mb-2">AES-256</p>
                  <p className="text-white font-semibold mb-1">Field-Level Encryption</p>
                  <p className="text-sm text-slate-400">PII encrypted at column level with automated key rotation</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-emerald-400 mb-2">7 Years</p>
                  <p className="text-white font-semibold mb-1">Statutory Retention</p>
                  <p className="text-sm text-slate-400">Immutable audit trail for every regulatory action</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-emerald-400 mb-2">OAuth 2.0</p>
                  <p className="text-white font-semibold mb-1">Consent Gateway</p>
                  <p className="text-sm text-slate-400">Granular scopes, individually revocable by client</p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* TAB 4: Compliance Analytics */}
          <TabsContent value="analytics" className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-4xl font-bold text-white mb-3">Compliance Analytics & Practice Intelligence</h2>
              <p className="text-lg text-slate-300 mb-12 max-w-4xl">
                Beyond compliance execution, the Command Center provides deep analytics that transform raw regulatory
                data into actionable practice intelligence — revenue protected, hours saved, risk distribution,
                regulatory change impact, and automated MIS reporting for CA firm governance.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyticsCapabilities.map((capability, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/30 transition-all duration-300 h-full hover:scale-[1.02]">
                    <CardContent className="p-6">
                      <div className={`${capability.color} mb-4`}>{capability.icon}</div>
                      <h3 className="text-lg font-bold text-white mb-3">{capability.metric}</h3>
                      <p className="text-slate-300 text-sm leading-relaxed">{capability.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gradient-to-r from-emerald-900/20 via-slate-800/50 to-teal-900/20 rounded-2xl p-8 border border-emerald-500/20">
              <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
                <div className="p-4 bg-emerald-600/20 rounded-xl shrink-0">
                  <BarChart3 className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Automated MIS Reports</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Generate firm-level Management Information System (MIS) reports automatically — compliance
                    health summaries, revenue protected reports, team productivity analytics, and client portfolio
                    risk assessments. Export to PDF for partner meetings, or schedule automated weekly/monthly
                    dispatches to firm leadership. No manual data compilation.
                  </p>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Final CTA */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-20 bg-gradient-to-br from-emerald-900/30 via-slate-800/50 to-teal-900/30 rounded-2xl p-12 text-center border border-slate-700 backdrop-blur">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent mb-6">
            One Console. Every Client. Zero Blind Spots.
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            The industry's first unified compliance command center — where the CA sees every threat,
            every deadline, and every opportunity across their entire client portfolio in one
            high-density executive console.
          </p>
          <div className="flex flex-wrap gap-6 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-10 py-4 text-lg" onClick={() => navigate("/auth?mode=signup&role=external_ca")}>
              <Play className="w-5 h-5 mr-2" />Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-10 py-4 text-lg">
              <FileText className="w-5 h-5 mr-2" />Download Architecture PDF
            </Button>
            <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-10 py-4 text-lg" onClick={() => navigate("/platform/infrastructure")}>
              <Landmark className="w-5 h-5 mr-2" />Sovereign Infrastructure
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center pt-8 border-t border-slate-700">
            <div><p className="text-3xl font-bold text-white mb-1">500+</p><p className="text-sm text-slate-400">Entities Per Console</p></div>
            <div><p className="text-3xl font-bold text-white mb-1">6</p><p className="text-sm text-slate-400">Regulatory Domains</p></div>
            <div><p className="text-3xl font-bold text-white mb-1">&lt;2 min</p><p className="text-sm text-slate-400">Alert Latency</p></div>
            <div><p className="text-3xl font-bold text-white mb-1">Zero</p><p className="text-sm text-slate-400">Blind Spots</p></div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
