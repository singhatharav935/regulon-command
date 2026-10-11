/*
 * ForCAsPage.tsx
 *
 * SEO Meta:
 * Title: Sannidh for Chartered Accountants — Scale Your CA Practice 10x with Autonomous Workflows
 * Description: Eliminate mechanical data entry and client follow-ups. Sannidh connects your clients'
 *   business data directly to your CA Practice Dashboard, automating return generation, tax audits,
 *   and notice defense.
 *
 * Route: /for-chartered-accountants
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle,
  Shield,
  Zap,
  TrendingUp,
  FileText,
  ArrowRight,
  Clock,
  Users,
  Building2,
  Lock,
  ChevronRight,
  Star,
  Activity,
  Layers,
  Sparkles,
  Scale,
  Gavel,
  Briefcase,
  Laptop,
  CheckCircle2,
  ArrowRightLeft,
  FileCheck,
  AlertCircle,
  BarChart4,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

// Return Compilation Items
const returnCompilations = [
  {
    title: "Form 3CD Tax Audit Reports",
    law: "Sec 44AB / Rule 6G",
    desc: "Autonomous continuous scanning of ledgers for 40A(3) cash violations, 269SS/T loan limits, depreciation schedules, and automated clause population.",
    timing: "10 mins review vs 18 hrs manual prep",
  },
  {
    title: "GST Returns (1, 3B, 9 & 9C)",
    law: "Sec 37, 39 & 44",
    desc: "Direct JSON generation from matched sales and GSTR-2B reconciled purchase ledgers. Ready for portal upload with zero schema errors.",
    timing: "Instant auto-compiled JSON",
  },
  {
    title: "Form 26Q TDS Quarterly Returns",
    law: "Sec 194C, 194I, 194J & 200",
    desc: "Automatic vendor threshold tracking, Section mapping, challan payment 281 matching, and error-free CSI file validation.",
    timing: "Zero penalty delay",
  },
  {
    title: "EPFO & ESIC Monthly Filings",
    law: "PF Act & ESI Act",
    desc: "Aggregates payroll registry numbers, applies wage ceiling rules, calculates employer/employee split, and formats official text upload files.",
    timing: "One-click generation",
  },
];

// 4-Step Notice Defense Flow
const noticeFlow = [
  {
    step: "01",
    title: "Portal Crawler & Scrutiny Detection",
    desc: "Sannidh connects directly to GST and Income Tax compliance portals to detect and download ASMT-10, DRC-01, Section 148A, and 143(2) notices the moment they are issued.",
    icon: Laptop,
  },
  {
    step: "02",
    title: "Autonomous Fact-Finding & Ledger Query",
    desc: "The AI agent queries the client's internal Sannidh database for specific invoice copies, e-way bills, bank payment receipts, and delivery proofs disputed in the notice.",
    icon: FileText,
  },
  {
    step: "03",
    title: "Legal Defense & Case Law Drafting",
    desc: "Nexus-9 legal drafting engine synthesizes the defense using relevant Sections, CBIC/CBDT circulars, and binding Supreme Court & High Court precedents.",
    icon: Scale,
  },
  {
    step: "04",
    title: "CA Review & Digital Signature Sign-Off",
    desc: "The complete notice reply is compiled into a formal PDF package. The CA reviews the legal arguments, edits if desired, and signs off with DSC.",
    icon: FileCheck,
  },
];

// FAQs for Chartered Accountants
const caFaqs = [
  {
    q: "How does Sannidh benefit my CA practice?",
    a: "Sannidh eliminates 80% of the manual, low-margin grunt work that drags down CA firms—such as chasing clients on WhatsApp for missing bank statements, manual data entry in Tally, Excel spreadsheet reconciliations, and late-night return compilations. By having your clients on Sannidh's Company Dashboard, you receive clean, pre-reconciled books, allowing you to focus on high-margin advisory and Virtual CFO services.",
  },
  {
    q: "Does Sannidh take away CA clients or work?",
    a: "Never. Sannidh is strictly an infrastructure platform designed for CAs, not a replacement. All statutory filings, tax audit reports (Form 3CD), and notice replies require the expert review, discretion, and digital signature of a licensed Chartered Accountant. Sannidh automates the preparation so the CA can serve 10x more clients with zero extra headcount.",
  },
  {
    q: "How does the 'Review & Submit' workflow work for CAs?",
    a: "Instead of spending 15 hours manually entering transactions or verifying Excel sheets, the CA logs into the CA Practice Dashboard. The client's ledgers are already reconciled against bank feeds and GSTR-2B. Sannidh auto-compiles the statutory files (GSTR JSONs, Form 3CD clauses, TDS returns). The CA performs a rapid professional review, makes adjustments if necessary, and submits.",
  },
  {
    q: "How does the Autonomous Notice Reply Generator work?",
    a: "When a tax notice arrives (e.g., GST ASMT-10 or Income Tax scrutiny), Sannidh scans the demand, queries the client's database for corresponding invoices, payment receipts, and e-way bills, and drafts a comprehensive legal defense complete with relevant sections, circulars, and case law precedents. The CA receives an audit-ready draft PDF to inspect, refine, and sign off.",
  },
  {
    q: "How does Sannidh help a CA scale to 100+ corporate clients?",
    a: "A traditional CA firm requires 1-2 article clerks or junior accountants for every 10-15 active corporate clients just to handle data entry and phone calls. With Sannidh, the mechanical reconciliation happens autonomously. One CA partner or manager can oversee 50 to 100+ corporate clients with ease, maintaining high audit quality without employee burnout.",
  },
  {
    q: "Can CAs manage multiple client companies from a single dashboard?",
    a: "Yes. The CA Practice Dashboard features a centralized multi-tenant Command Center. You can view all linked corporate clients, their real-time books status, pending statutory deadlines, notice alerts, and tax optimization findings in a single unified view with granular staff access permissions.",
  },
];

export default function ForCAsPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      <BackgroundEffects />
      <Navbar />

      <main className="relative z-10 pt-28 pb-20 overflow-hidden">
        {/* Blue/Indigo background aura */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-indigo-500/10 via-blue-500/15 to-transparent blur-3xl pointer-events-none rounded-full" />

        {/* ─── HERO SECTION ──────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex justify-center mb-6"
          >
            <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30 px-4 py-1.5 text-xs sm:text-sm font-medium tracking-wide flex items-center gap-2 rounded-full shadow-lg shadow-indigo-950/30">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              Built Exclusively for Indian Chartered Accountants
            </Badge>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeIn}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]"
          >
            Scale Your CA Practice 10x{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Without Hiring Extra Staff.
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeIn}
            className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          >
            Transform your firm from manual data entry, client chasing, and midnight deadline panic into a high-margin,{" "}
            <strong className="text-white font-semibold">Review-and-Submit</strong> advisory powerhouse.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeIn}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-indigo-900/30 transition-all duration-300 hover:scale-[1.02]"
              >
                Start Free for CAs
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-900/50 hover:bg-slate-800/80 text-slate-200 font-medium px-8 py-6 text-base rounded-xl backdrop-blur-md"
              >
                See the CA Workflow
              </Button>
            </Link>
          </motion.div>

          {/* Scale Metrics Strip */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={4}
            variants={fadeIn}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md max-w-4xl mx-auto shadow-2xl"
          >
            <div>
              <div className="text-3xl font-extrabold text-blue-400">80%</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Manual Time Saved</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-indigo-400">10x</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Client Capacity per Partner</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-cyan-400">0</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Extra Staff Required</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-400">3x - 5x</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Higher Advisory Retainers</div>
            </div>
          </motion.div>
        </section>

        {/* ─── SECTION 1: NO MORE CLIENT CHASING ──────────────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 mb-3">
              Zero Manual Chasing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your Clients' Books Arrive Clean. Always.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Stop calling clients at 11 PM for missing bank statements or unreadable invoice photos. In Sannidh, every client transaction is already validated, reconciled, and posted.
            </p>
          </div>

          {/* Interactive Bridge Diagram */}
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-md relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Box 1: Client Company */}
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-emerald-500/30 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Company Dashboard</h3>
                <p className="text-xs text-slate-400 mt-1">Client creates invoices, captures bills, and syncs bank feeds.</p>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 font-medium">
                  ✓ Double-Entry Auto-Posted
                </div>
              </div>

              {/* Box 2: The Real-Time Bridge */}
              <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center relative">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Real-Time Live Bridge
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Continuous data streaming with bank-grade encryption. No files, no spreadsheets.
                </div>
                <Badge className="mt-4 bg-indigo-500/20 text-indigo-300 border-none text-[10px]">
                  Zero Manual Uploads
                </Badge>
              </div>

              {/* Box 3: CA Practice */}
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-blue-500/30 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">CA Practice Dashboard</h3>
                <p className="text-xs text-slate-400 mt-1">CA partner inspects clean ledgers and approves auto-compiled returns.</p>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-blue-400 font-medium">
                  ✓ 15-Minute Review & Submit
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: THE REVIEW & SUBMIT WORKFLOW ────────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 mb-3">
              Automated Statutory Filings
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              From 15 Hours to 15 Minutes.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Sannidh autonomously compiles raw client books into exact statutory return schemas. The Chartered Accountant's role shifts to high-value expert validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {returnCompilations.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <Card className="h-full bg-slate-900/40 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all rounded-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-300 bg-indigo-950/20">
                        {item.law}
                      </Badge>
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.timing}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-white">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-300 text-sm leading-relaxed">
                      {item.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Before vs After Comparison Card */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900/80 via-indigo-950/20 to-slate-900/80 border border-indigo-500/30">
            <h3 className="text-xl font-bold text-white text-center mb-6">The Daily Reality Shift for Your Firm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-red-950/20 border border-red-500/20 space-y-3">
                <div className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Traditional CA Practice
                </div>
                <ul className="text-xs sm:text-sm text-slate-300 space-y-2">
                  <li>❌ 15+ hours spent reconciling messy bank PDFs and Tally data</li>
                  <li>❌ Chasing uncooperative clients on WhatsApp on filing day</li>
                  <li>❌ Articles burning out during September and October tax audit season</li>
                  <li>❌ Low fee margins consumed entirely by mechanical labor costs</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Powered by Sannidh
                </div>
                <ul className="text-xs sm:text-sm text-slate-300 space-y-2">
                  <li>✅ 15 minutes to review and approve pre-compiled returns</li>
                  <li>✅ Real-time data sync eliminates last-minute file chasing</li>
                  <li>✅ Calm, predictable tax audit season with clause pre-validation</li>
                  <li>✅ High-margin Virtual CFO advisory retainers at 3x to 5x higher revenue</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: NOTICE REPLY GENERATOR ─────────────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 mb-3">
              Scrape & Auto-Defense Engine
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Every Notice Handled. Automatically.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Tax notices create panic for clients and consume dozens of billable hours. Sannidh transforms notice handling into an automated 4-step assembly line.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {noticeFlow.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-black text-indigo-400/40">{step.step}</span>
                      <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── SECTION 4: SCALE WITHOUT OVERHEAD ─────────────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 mb-3">
                Practice Multiplier
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                One Partner. 100 Clients. <br />
                <span className="text-blue-400">Zero Burnout.</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                Historically, the only way for a CA practice to grow was to hire more articles, rent bigger office space, and manage more chaos. Sannidh breaks that linear bottleneck permanently.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-blue-500/20 text-blue-400 mt-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">Central Multi-Client Command Center</h4>
                    <p className="text-slate-400 text-xs sm:text-sm">Monitor books health, filing status, and notice radar for 100+ businesses from one unified portal.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-blue-500/20 text-blue-400 mt-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">Shift to High-Value Virtual CFO Advisory</h4>
                    <p className="text-slate-400 text-xs sm:text-sm">Upgrade clients from basic ₹5,000/month compliance retainers to ₹25,000 - ₹50,000/month strategic CFO retainers.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-blue-500/20 text-blue-400 mt-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">Granular Staff & Article Work Assignment</h4>
                    <p className="text-slate-400 text-xs sm:text-sm">Assign review tasks to articles with strict audit logs and partner final sign-off controls.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-blue-500/30 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Firm Growth Calculator</span>
                  <Badge className="bg-blue-500/10 text-blue-300 border-none text-xs">Simulated</Badge>
                </div>

                <div className="space-y-6 my-6">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Client Capacity (1 Partner + 2 Articles)</span>
                      <span className="font-bold text-white">120 Clients (vs 25 Traditional)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[85%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Time Spent on Data Entry / Chasing</span>
                      <span className="font-bold text-emerald-400">Reduced by 80%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[20%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Firm Average Monthly Retainer</span>
                      <span className="font-bold text-white">₹35,000 / Client</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-[70%]" />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-center">
                  <div className="text-xs text-slate-400">Estimated Annual Practice Revenue Potential</div>
                  <div className="text-2xl font-black text-white mt-1">₹50 Lakhs+ / Year</div>
                  <div className="text-[11px] text-indigo-300 mt-0.5">With zero additional office overhead</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: FAQ ACCORDION ──────────────────────────────────── */}
        <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 mb-3">
              CA Firm FAQs
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions for CAs
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Everything practicing Chartered Accountants want to know about Sannidh.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {caFaqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`ca-faq-${idx}`}
                className="bg-slate-900/40 border border-slate-800/80 rounded-xl px-5 py-1 backdrop-blur-sm data-[state=open]:border-indigo-500/40 transition-colors"
              >
                <AccordionTrigger className="text-left text-base sm:text-lg font-semibold text-white hover:text-indigo-400 hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-300 text-sm sm:text-base leading-relaxed pb-5 pt-1">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ─── SECTION 6: BOTTOM CTA ─────────────────────────────────────── */}
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center border-t border-slate-800/60">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-indigo-950/20 border border-indigo-500/30 backdrop-blur-xl relative shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to Scale Your CA Practice?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
              Equip your firm with autonomous workflows, eliminate manual data entry, and connect directly with your corporate clients.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-indigo-900/40"
                >
                  Start Free for CAs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white font-medium px-8 py-6 text-base rounded-xl"
                >
                  Explore Platform Architecture
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                <span>Zero Subscription for Verified CAs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                <span>Multi-Client Dashboard Included</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                <span>Full Audit Trail & Traceability</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
