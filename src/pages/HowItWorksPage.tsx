/*
 * HowItWorksPage.tsx
 *
 * SEO Meta:
 * Title: How Sannidh Works — The Two-Dashboard Autonomous Finance Architecture
 * Description: Learn how Sannidh's two interconnected dashboards connect businesses and CAs
 *   in real time. Built with bank-grade encryption, zero manual uploads, and autonomous AI agents.
 *
 * Route: /how-it-works
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Cpu,
  RefreshCw,
  Database,
  KeyRound,
  FileSpreadsheet,
  Server,
  Network,
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

// The 7 Autonomous Headaches Roadmap
const sevenHeadaches = [
  {
    num: "01",
    title: "The GST Matcher (Zero-Upload Reconciliation)",
    headache: "Manual reconciliation of portal GSTR-2B against purchase bills with missing vendor credits.",
    solution: "Downloads GSTR-2B via portal API, cross-reconciles against Sannidh's native Purchase Ledger line by line, and triggers automated follow-up reminders to defaulting suppliers.",
    icon: RefreshCw,
    tag: "Automated ITC Claim",
  },
  {
    num: "02",
    title: "The Notice Reply Generator (Scrape & Auto-Defense)",
    headache: "Panicked scramble for old bills and hours spent researching case laws when tax notices arrive.",
    solution: "Portal crawler detects scrutiny notices. Sannidh AI queries the client's internal database for invoices, receipts, and e-way bills, drafting a full legal defense with relevant case law citations.",
    icon: Scale,
    tag: "Autonomous Legal Defense",
  },
  {
    num: "03",
    title: "The Tax Audit Scanner (Continuous Real-Time Auditing)",
    headache: "Midnight rush in September discovering Section 40A(3) cash limit breaches after financial year ends.",
    solution: "Continuously scans ledgers 24/7 for cash payment violations (u/s 40A(3)), Section 269SS/T limits, and auto-populates the Form 3CD tax audit report throughout the financial year.",
    icon: Shield,
    tag: "Continuous Real-Time Audit",
  },
  {
    num: "04",
    title: "TDS Calculations & Quarterly Filings",
    headache: "Tracking vendor threshold limits across multiple invoices and filing late Form 26Q quarterly returns.",
    solution: "Tracks cumulative vendor payments natively, auto-deducts TDS u/s 194C, 194I, 194J, pre-drafts Challan 281 tax payments, and compiles quarterly Form 26Q return files.",
    icon: FileText,
    tag: "Zero TDS Default",
  },
  {
    num: "05",
    title: "MSME 45-Day Payment Rule (Sec 43B(h))",
    headache: "Disallowance of genuine expenses and massive income tax additions for overdue MSME vendor payables.",
    solution: "Continuously scans the Accounts Payable ledger, matches vendor GSTINs against the official MSME Udyam directory, and triggers proactive warnings on Day 30 to prevent loss of deductions.",
    icon: Clock,
    tag: "Tax Deduction Protection",
  },
  {
    num: "06",
    title: "Advance Tax Radar (Quarterly u/s 208)",
    headache: "Underestimating quarterly advance tax liabilities and incurring heavy 1% monthly interest u/s 234B & 234C.",
    solution: "Monitors live revenue velocity and ledger margins each quarter, estimates statutory liability, and generates ready Challan 280 tax payments before the 15th of June, Sept, Dec, and March.",
    icon: TrendingUp,
    tag: "Interest Penalty Prevention",
  },
  {
    num: "07",
    title: "Monthly EPF & ESI Salary Returns",
    headache: "Manual payroll calculations, wage ceiling caps, and preparing cumbersome EPFO electronic upload files.",
    solution: "Pulls payroll data from Sannidh's native registry, computes PF and ESI contributions, posts the corresponding salary journals, and compiles the official EPFO/ESIC upload files.",
    icon: Users,
    tag: "Automated Payroll Returns",
  },
];

// Zero Upload Philosophy Pillars
const zeroUploadPillars = [
  {
    icon: Landmark,
    title: "RBI Account Aggregator Feeds",
    desc: "Direct cryptographic banking feeds via RBI-licensed Account Aggregators with explicit OTP consent. Zero manual statement uploads.",
  },
  {
    icon: Cpu,
    title: "Smart OCR Invoice Parser",
    desc: "Point camera or drag a PDF bill. Machine intelligence parses vendor, GSTIN, HSN, line items, and tax rates with 99.8% precision.",
  },
  {
    icon: Network,
    title: "Direct Government Portal APIs",
    desc: "Native integration with GST and Income Tax networks to synchronize GSTR-2B, returns acknowledgements, and scrutiny notices.",
  },
  {
    icon: Database,
    title: "Standalone System of Record",
    desc: "Your books live natively inside Sannidh. No Excel sheets, no Tally file conversions, and no back-and-forth email attachments.",
  },
];

// Security Pillars
const securityPillars = [
  {
    icon: Lock,
    title: "AES-256 Military Encryption",
    desc: "Bank-grade cryptographic standards protecting all ledger data, documents, and communications in transit and at rest.",
  },
  {
    icon: KeyRound,
    title: "Zero Credential Storage",
    desc: "Sannidh never asks for or stores your netbanking passwords or portal credentials. Authentication occurs via ephemeral OTP tokens.",
  },
  {
    icon: Shield,
    title: "RBI & DPDP Act 2026 Aligned",
    desc: "Full compliance with the Digital Personal Data Protection Act and Reserve Bank of India data privacy directives.",
  },
  {
    icon: Server,
    title: "Sovereign Indian Cloud",
    desc: "100% of data, backup replicas, and database servers reside strictly within sovereign data centers inside the Republic of India.",
  },
];

// Feature Comparison Matrix
const featureMatrix = [
  { feature: "Smart ERP & Double-Entry Ledgers", company: "Full Native ERP", ca: "Read & Audit Access" },
  { feature: "Bank Reconciliation via Account Aggregator", company: "Continuous Live Sync", ca: "Reconciled Audit View" },
  { feature: "Virtual CFO Intelligence & Runway Radar", company: "Real-Time Executive Intel", ca: "Advisory View" },
  { feature: "Tax Optimization Engine (37 Schemes)", company: "Continuous Eligibility Scan", ca: "Client Recommendations" },
  { feature: "GSTR-2B Auto-Reconciliation", company: "Vendor Reminders Sent", ca: "One-Click File Generation" },
  { feature: "Form 3CD Tax Audit Compilation", company: "Real-Time Limit Tracking", ca: "Full Clause Review & Sign" },
  { feature: "Autonomous Notice Reply Generator", company: "Receives Notice Alert", ca: "AI Legal Draft & Sign-Off" },
  { feature: "TDS (26Q) & Payroll Returns (EPF/ESI)", company: "Payables & Salary Recorded", ca: "Auto-Compiled Return Files" },
  { feature: "Multi-Client Command Center", company: "Single Company View", ca: "100+ Companies in 1 Screen" },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200">
      <BackgroundEffects />
      <Navbar />

      <main className="relative z-10 pt-28 pb-20 overflow-hidden">
        {/* Purple/Indigo background aura */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-purple-500/10 via-indigo-500/15 to-transparent blur-3xl pointer-events-none rounded-full" />

        {/* ─── HERO SECTION ──────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex justify-center mb-6"
          >
            <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 px-4 py-1.5 text-xs sm:text-sm font-medium tracking-wide flex items-center gap-2 rounded-full shadow-lg shadow-purple-950/30">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Autonomous AI Architecture
            </Badge>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeIn}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]"
          >
            The Two-Dashboard Operating System:{" "}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              How Sannidh Works.
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeIn}
            className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          >
            One unified platform. Two interconnected dashboards.{" "}
            <strong className="text-white font-semibold">Zero manual uploads</strong>. Built specifically for the Indian business and tax ecosystem.
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
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-purple-900/30 transition-all duration-300 hover:scale-[1.02]"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/for-business-owners">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-900/50 hover:bg-slate-800/80 text-slate-200 font-medium px-8 py-6 text-base rounded-xl backdrop-blur-md"
              >
                Explore Business Features
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* ─── SECTION 1: THE TWO-DASHBOARD ARCHITECTURE DIAGRAM ─────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-3 py-1 mb-3">
              Connected Architecture
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Two Dashboards. One Seamless Bridge.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              The historical disconnect between businesses and their accountants is solved. When a transaction occurs in your business, it is instantly reflected on your CA's desk.
            </p>
          </div>

          {/* Interactive Dual-Dashboard Visual */}
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-md relative overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
              {/* Left Side: Company Dashboard */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-950/80 border border-emerald-500/30 shadow-lg">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Company Dashboard</h3>
                    <p className="text-xs text-emerald-400 font-medium">Business Owner & Finance Team</p>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Create GST e-invoices with automated debit/credit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Smart OCR line-item extraction on purchase bills</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Live RBI Account Aggregator bank reconciliation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Virtual CFO Intel: Cash runway & burn rate radar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>37 Tax Optimization schemes auto-scanned</span>
                  </li>
                </ul>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Input: Real-time billing & banking</span>
                  <Badge className="bg-emerald-500/10 text-emerald-300 border-none text-[10px]">Zero Tally</Badge>
                </div>
              </div>

              {/* Center: The Live Bridge Connector */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center py-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 via-purple-500 to-indigo-500 p-0.5 animate-pulse shadow-lg shadow-purple-500/20">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-purple-300">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                </div>
                <div className="hidden lg:block h-16 w-0.5 bg-gradient-to-b from-purple-500 to-transparent my-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 text-center mt-1">
                  Live Bridge
                </span>
              </div>

              {/* Right Side: CA Practice Dashboard */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-950/80 border border-indigo-500/30 shadow-lg">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">CA Practice Dashboard</h3>
                    <p className="text-xs text-indigo-400 font-medium">Chartered Accountant & Audit Staff</p>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Pre-reconciled client ledgers ready for inspection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Auto-compiled GSTR-1, 3B, 9 JSON filing files</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Form 3CD Tax Audit report pre-filled clauses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Autonomous Notice Reply Generator with case laws</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Unified Command Center for 100+ corporate clients</span>
                  </li>
                </ul>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Output: Review & Submit</span>
                  <Badge className="bg-indigo-500/10 text-indigo-300 border-none text-[10px]">Zero Chasing</Badge>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
              ⚡ No file exports. No WhatsApp attachments. No midnight Excel reconciliations. Continuous cryptographic streaming.
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: THE 7 AUTONOMOUS HEADACHES ──────────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-3 py-1 mb-3">
              Product Blueprint
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              The 7 Autonomous Headaches Solved Natively.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              We identified the 7 most painful, manual, and expensive compliance bottlenecks in India. Sannidh automates every single one natively without external ERP dependencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sevenHeadaches.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.07 }}
                  className={idx === 6 ? "md:col-span-2 lg:col-span-1" : ""}
                >
                  <Card className="h-full bg-slate-900/40 border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900/60 transition-all rounded-xl flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-black text-purple-400/40">{item.num}</span>
                        <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300 bg-purple-950/20">
                          {item.tag}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold text-white leading-snug">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-slate-300">
                        <strong className="text-red-400 block mb-0.5">The Headache:</strong>
                        {item.headache}
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300">
                        <strong className="text-emerald-400 block mb-0.5">Sannidh Autonomous Fix:</strong>
                        {item.solution}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ─── SECTION 3: ZERO MANUAL UPLOAD PHILOSOPHY ───────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 mb-3">
              Core Architecture Principle
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Zero Manual Uploads. Ever.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Legacy compliance software asks you to download bank Excel sheets, convert Tally XMLs, and upload them repeatedly. Sannidh eliminates manual uploads at the root.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {zeroUploadPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/40 transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── SECTION 4: BANK-GRADE SECURITY ────────────────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 mb-3">
              Trust & Data Sovereignty
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your Financial Data Is Fortified. Always.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Financial ledgers are the most sensitive asset of any enterprise. Sannidh is architected from the ground up to exceed banking standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-emerald-500/40 transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── SECTION 5: THE COMPLETE SANNIDH STACK (SUMMARY MATRIX) ────── */}
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-3 py-1 mb-3">
              Feature Matrix
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              The Complete Sannidh Platform Stack
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              How features divide between your business team and your Chartered Accountant.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold text-white">Platform Capability</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-emerald-400">Company Dashboard</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-indigo-400">CA Practice Dashboard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {featureMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-emerald-300 font-medium">
                        {row.company}
                      </td>
                      <td className="px-6 py-4 text-indigo-300 font-medium">
                        {row.ca}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── SECTION 6: BOTTOM CTA ─────────────────────────────────────── */}
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center border-t border-slate-800/60">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-purple-950/20 border border-purple-500/30 backdrop-blur-xl relative shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              See the Sannidh Architecture in Action.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
              Start your free trial today or connect your Chartered Accountant to experience zero-upload financial compliance.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-purple-900/40"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/for-chartered-accountants">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white font-medium px-8 py-6 text-base rounded-xl"
                >
                  For Chartered Accountants
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span>Zero Installation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span>Account Aggregator Direct Feed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span>100% Data Stored in India</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
