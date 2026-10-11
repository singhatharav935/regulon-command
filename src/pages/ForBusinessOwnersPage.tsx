/*
 * ForBusinessOwnersPage.tsx
 *
 * SEO Meta:
 * Title: Sannidh for Business Owners — Smart ERP, Self-Driving Finance & Zero-Penalty Compliance
 * Description: Sannidh replaces manual accounting chaos for Indian businesses. Get automated Smart ERP,
 *   real-time Virtual CFO intelligence, 100% penalty-free compliance, and tax savings under
 *   Government of India schemes—connected live to your CA.
 *
 * Route: /for-business-owners
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
  DollarSign,
  ArrowRight,
  AlertTriangle,
  BarChart3,
  Clock,
  Users,
  BookOpen,
  Landmark,
  Wallet,
  Building2,
  Lock,
  ChevronRight,
  Percent,
  CalendarCheck,
  Star,
  Activity,
  Receipt,
  Layers,
  Sparkles,
  ArrowUpRight,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";

// Animation Variants
const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

// 7 Accounting Books of Smart ERP
const erpBooks = [
  {
    icon: Receipt,
    title: "Sales Book & Invoicing",
    desc: "Instant GST-compliant e-invoicing and e-way bill generation with automated journal & ledger postings in real time.",
    stat: "100% Real-Time",
  },
  {
    icon: BookOpen,
    title: "Purchase Book & OCR",
    desc: "AI OCR line-item extraction from bills and PDFs. Direct cross-verification against vendor ledgers and GSTR-2B.",
    stat: "Zero Manual Entry",
  },
  {
    icon: Landmark,
    title: "Cash & Bank Book",
    desc: "Automated real-time feed synchronization via RBI-licensed Account Aggregator protocols with zero OTP storage.",
    stat: "Live Bank Sync",
  },
  {
    icon: Layers,
    title: "Journal Book (Double-Entry)",
    desc: "Every transaction automatically splits into standard double-entry Debit & Credit vouchers compliant with Ind AS.",
    stat: "Audit-Ready Entries",
  },
  {
    icon: FileText,
    title: "General Ledger (All Accounts)",
    desc: "Always-balanced ledgers for every customer, vendor, expense category, and asset. No manual month-end closing.",
    stat: "Always Balanced",
  },
  {
    icon: BarChart3,
    title: "Trial Balance, P&L & Balance Sheet",
    desc: "Updated live with every single invoice or payment voucher. Generate real-time statutory financial statements instantly.",
    stat: "Instant Generation",
  },
  {
    icon: Zap,
    title: "Standalone System of Record",
    desc: "Complete native financial OS. No Tally exports, no Excel spreadsheets, and no dependency on manual data-entry staff.",
    stat: "Zero ERP Dependency",
  },
];

// Penalty Protection Modules
const penaltyShields = [
  {
    title: "Statutory Deadline Radar",
    section: "Sec 47, Sec 234F & Sec 234B/C",
    desc: "Automated countdown and preparation for GSTR-1, GSTR-3B, TDS quarterly returns, EPF/ESI, and Advance Tax. Never pay ₹50/day late fees or 1% monthly interest penalties.",
    savedMetric: "₹1,20,000+ Late Fees Avoided",
    icon: Clock,
  },
  {
    title: "Section 43B(h) MSME 45-Day Shield",
    section: "Micro & Small Enterprise Protection",
    desc: "Automatically cross-references vendor GSTINs against the official MSME Udyam directory. Fires critical alerts on Day 30 to settle dues and prevent loss of expense tax deductions.",
    savedMetric: "100% Tax Deduction Safe",
    icon: Shield,
  },
  {
    title: "GSTR-2B ITC Mismatch Guard",
    section: "Rule 36(4) & Sec 16(2)(aa)",
    desc: "Continuous automated cross-matching of purchase bills with supplier portal filings. Identifies non-compliant vendors instantly before tax credits are blocked.",
    savedMetric: "Zero Blocked Input Credit",
    icon: AlertTriangle,
  },
];

// Tax Optimization Schemes
const taxSavings = [
  {
    section: "Section 80JJAA",
    title: "New Employee Wage Deduction",
    desc: "Additional 30% deduction on gross emoluments paid to new regular employees for 3 consecutive assessment years.",
    saving: "Up to ₹7.5L / 10 staff",
  },
  {
    section: "Section 32(1)(iia)",
    title: "Accelerated Technology Depreciation",
    desc: "Claim 40% depreciation on specialized hardware and up to 20% additional depreciation on manufacturing plant.",
    saving: "Significant Tax Postponement",
  },
  {
    section: "Foreign Trade / RoDTEP",
    title: "Export Duty Remissions & RoSCTL",
    desc: "Automated calculation of customs duty refunds and tax rebates credited directly into electronic ledger scrips.",
    saving: "0.5% - 4.3% FOB Value",
  },
  {
    section: "GSTR-2B Recovery",
    title: "100% Unclaimed ITC Harvesting",
    desc: "Scans past FY ledgers to recover forgotten input tax credits and inverted duty refunds under Section 54(3).",
    saving: "Average ₹3.4L Recovered",
  },
];

// FAQ List for Business Owners
const businessFaqs = [
  {
    q: "What does Sannidh do for my business day-to-day?",
    a: "Sannidh acts as your company's autonomous self-driving finance department. You create compliant GST invoices in seconds or scan purchase bills with your camera. Sannidh's OCR reads every line item, matches it to your inventory and vendor ledgers, synchronizes your bank account transactions via RBI-licensed Account Aggregators, and prepares every book—from Sales Book to Balance Sheet—in real time.",
  },
  {
    q: "Do I need to hire a full-time in-house accountant if I use Sannidh?",
    a: "No. Sannidh eliminates the need for manual data entry clerks and mechanical bookkeepers. All routine tasks—recording debit/credit entries, bank reconciliation, ledger mapping, and invoice entry—are executed autonomously. Your books remain 100% clean, balanced, and ready for your Chartered Accountant's review and statutory sign-off.",
  },
  {
    q: "How does Sannidh keep my business 100% tax penalty-free?",
    a: "Sannidh continuously monitors all statutory deadlines across the GST portal, Income Tax portal, EPFO, ESIC, and MCA. It prepares filings in advance, monitors vendor tax compliance, and alerts you before due dates. It prevents ₹50/day late fees under Section 47, ₹5,000 penalties under Section 234F, and high-interest liabilities under Section 234B/C.",
  },
  {
    q: "What is the Virtual CFO Intel in the Company Dashboard?",
    a: "Virtual CFO Intel is an executive analytical engine that analyzes your actual bank feeds and books to deliver live strategic metrics: exact cash runway in days, net burn rate, working capital health, debtor aging, creditor turnover, and tax liability forecasts. It gives you the analytical foresight of a full-time CFO without the ₹30L+ salary.",
  },
  {
    q: "How does Sannidh save my company money on taxes legally?",
    a: "Sannidh features a native Tax Optimization Engine that continuously scans 37 Government of India statutory incentive schemes, deductions, and subsidies. It checks your eligibility for Section 80JJAA wage deductions, Section 32 technology depreciation, Section 80-IAC startup exemptions, export duty remissions (RoDTEP), and recovered Input Tax Credit (ITC).",
  },
  {
    q: "How does Section 43B(h) MSME protection work in Sannidh?",
    a: "Under Section 43B(h) of the Income Tax Act, any payable to a Micro or Small enterprise unpaid beyond 45 days (or 15 days without agreement) is disallowed as an expense and added back to taxable profits. Sannidh automatically checks your vendors' GSTINs against the official MSME registry, tracks payable aging, and triggers automated warnings on Day 30 so you never lose tax deductions.",
  },
  {
    q: "Do I need to switch away from my existing Chartered Accountant?",
    a: "Absolutely not! Sannidh is built to strengthen your relationship with your CA. Your Company Dashboard connects live to your CA's Practice Dashboard. Instead of exchanging messy Excel sheets and bank statements on WhatsApp at midnight, your CA receives perfectly balanced books, audit-ready reports, and pre-compiled returns for their fast review and submission.",
  },
  {
    q: "Is my financial data and banking information secure?",
    a: "Yes. Sannidh utilizes AES-256 bit military-grade encryption both in transit and at rest. Banking data flows strictly via the RBI-regulated Account Aggregator (AA) framework requiring your explicit OTP consent. Sannidh never stores your bank portal passwords or netbanking credentials. All servers and data reside strictly within sovereign Indian borders.",
  },
];

export default function ForBusinessOwnersPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <BackgroundEffects />
      <Navbar />

      <main className="relative z-10 pt-28 pb-20 overflow-hidden">
        {/* Glow gradients */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/15 to-transparent blur-3xl pointer-events-none rounded-full" />

        {/* ─── HERO SECTION ──────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex justify-center mb-6"
          >
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 px-4 py-1.5 text-xs sm:text-sm font-medium tracking-wide flex items-center gap-2 rounded-full shadow-lg shadow-emerald-950/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              India's First Autonomous AI Finance OS
            </Badge>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeIn}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]"
          >
            The Self-Driving Finance Department for{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Indian Businesses & Founders.
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeIn}
            className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          >
            Run your billing, bank feeds, ledgers, and statutory compliance on autopilot—with{" "}
            <strong className="text-white font-semibold">zero manual uploads</strong>,{" "}
            <strong className="text-white font-semibold">zero tax penalties</strong>, and seamless live collaboration with your CA.
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
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-300 hover:scale-[1.02]"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 bg-slate-900/50 hover:bg-slate-800/80 text-slate-200 font-medium px-8 py-6 text-base rounded-xl backdrop-blur-md transition-all"
              >
                See How It Works
              </Button>
            </Link>
          </motion.div>

          {/* Key Stat Strip */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={4}
            variants={fadeIn}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md max-w-4xl mx-auto shadow-2xl"
          >
            <div>
              <div className="text-3xl font-extrabold text-emerald-400">100%</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Penalty-Free Track Record</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-cyan-400">0 min</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Manual Data Entry</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-teal-400">37</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Govt Schemes Scanned</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-400">Live</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Bridge to Your CA</div>
            </div>
          </motion.div>
        </section>

        {/* ─── SECTION 1: SMART ERP (SYSTEM OF RECORD) ───────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 mb-3">
              Full Native Accounting Core
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Every Book. Every Ledger. Formed Automatically.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Sannidh is not an add-on wrapper. It is a complete standalone system of record that creates, balances, and maintains your entire accounting ledger infrastructure in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {erpBooks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <Card className="h-full bg-slate-900/40 border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/60 transition-all duration-300 rounded-xl backdrop-blur-sm group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="text-[11px] font-medium border-slate-700 text-emerald-300 bg-emerald-950/20">
                          {item.stat}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
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
              );
            })}
          </div>

          {/* Standalone banner */}
          <div className="mt-10 p-6 rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-900/40 to-teal-950/30 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-base">No Tally. No Excel. No Mechanical Bookkeepers.</h4>
                <p className="text-slate-400 text-sm">Sannidh maintains the books natively. Zero file imports or messy migrations required for day-to-day work.</p>
              </div>
            </div>
            <Link to="/auth">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0">
                Explore Smart ERP
              </Button>
            </Link>
          </div>
        </section>

        {/* ─── SECTION 2: ZERO PENALTY GUARD ─────────────────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 mb-3">
              100% Statutory Compliance
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              100% Penalty-Free. Every Single Month.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Indian businesses bleed lakhs every year in statutory late fees, interest penalties, and disallowances. Sannidh seals every legal loophole automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {penaltyShields.map((shield, idx) => {
              const Icon = shield.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full bg-slate-900/40 border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/70 transition-all rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                    <CardHeader>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge className="bg-emerald-500/15 text-emerald-300 border-none text-[11px]">
                          {shield.savedMetric}
                        </Badge>
                      </div>
                      <div className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                        {shield.section}
                      </div>
                      <CardTitle className="text-xl font-bold text-white mt-1">
                        {shield.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-300 text-sm leading-relaxed">
                        {shield.desc}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ─── SECTION 3: VIRTUAL CFO INTEL ──────────────────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 px-3 py-1 mb-3">
                Strategic Executive Intelligence
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Real-Time CFO Intelligence. <br />
                <span className="text-teal-400">No ₹30L CFO Required.</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                Most founders find out they are running out of cash when the bank account reaches zero. Sannidh's Virtual CFO Intel continuously scans your bank transactions, receivables, and payables to give you instant clarity on your business runway.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-teal-500/20 text-teal-400 mt-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">Live Cash Runway & Net Burn Rate</h4>
                    <p className="text-slate-400 text-xs sm:text-sm">Real-time prediction of days remaining until cash exhaustion based on verified bank ledger velocity.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-teal-500/20 text-teal-400 mt-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">Debtors & Creditors Aging Radar</h4>
                    <p className="text-slate-400 text-xs sm:text-sm">Automated tracking of overdue customer payments with one-click compliant legal reminders.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-teal-500/20 text-teal-400 mt-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">Automated Real-Time Financial Statements</h4>
                    <p className="text-slate-400 text-xs sm:text-sm">P&L, Balance Sheet, and Working Capital ratio analytics generated live from double-entry vouchers.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Dashboard Preview Card */}
            <div className="lg:col-span-6">
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-teal-500/30 shadow-2xl backdrop-blur-xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">Virtual CFO Intel Console</span>
                  </div>
                  <Badge variant="outline" className="border-teal-500/30 text-teal-300 text-xs">
                    Live Feed Active
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-xs text-slate-400">Cash Runway</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">142 Days</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Burn: ₹2.4L / month</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-xs text-slate-400">Working Capital</div>
                    <div className="text-2xl font-bold text-teal-400 mt-1">₹38.6 Lakhs</div>
                    <div className="text-[11px] text-emerald-400 mt-0.5">Ratio: 1.84 (Healthy)</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-medium text-white">Section 43B(h) MSME Alert</div>
                        <div className="text-[11px] text-slate-400">2 Vendor Invoices reaching Day 30</div>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">Action Required</Badge>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Percent className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-medium text-white">Sec 80JJAA Optimization</div>
                        <div className="text-[11px] text-slate-400">4 New qualifying employees identified</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">+₹2.8L Deduction</Badge>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Last synced: 2 minutes ago via AA Feed</span>
                  <span className="text-teal-400 font-medium">Bank-Grade Verified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: TAX OPTIMIZATION ENGINE ────────────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1 mb-3">
              Statutory Incentive Scanner
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Legally Save What You Overpay to the Government.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              India has 37 statutory government tax-saving provisions and subsidies. Most businesses never claim them because they don't know they exist. Sannidh scans every single provision against your data.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-emerald-950/30 border border-cyan-500/30 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-extrabold text-white">37 Schemes</div>
              <div className="text-sm text-cyan-400 mt-1 font-medium">Continuously Auto-Scanned</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-400">₹10 Lakhs+</div>
              <div className="text-sm text-slate-400 mt-1 font-medium">Average Annual Tax Saved</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-teal-400">100% Legal</div>
              <div className="text-sm text-slate-400 mt-1 font-medium">Statutory CBDT & CBIC Laws</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {taxSavings.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
              >
                <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 text-xs">
                      {item.section}
                    </Badge>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                      {item.saving}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── SECTION 5: THE LIVE BRIDGE TO CA ──────────────────────────── */}
        <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900/80 via-emerald-950/20 to-slate-900/80 border border-emerald-500/30 backdrop-blur-xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <Badge className="bg-emerald-500/15 text-emerald-300 border-none px-3 py-1 text-xs mb-3">
                  Real-Time Collaboration
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Your Books Reach Your CA. Automatically.
                </h2>
                <p className="mt-3 text-slate-300 text-base leading-relaxed">
                  No more messy zip files, missing bank statements at midnight, or WhatsApp chaos during tax season. Every bill, bank transaction, and ledger entry created in your Company Dashboard flows seamlessly into your CA's Practice Dashboard.
                </p>
                <div className="mt-6 flex flex-wrap gap-4 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Sync</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Zero Data Loss</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Your CA Reviews & Submits</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <Link to="/for-chartered-accountants">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-6 rounded-xl shadow-lg shadow-emerald-950/40"
                  >
                    See CA Side Features
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 6: FAQ ACCORDION ──────────────────────────────────── */}
        <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 mb-3">
              Everything You Need to Know
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Clear answers for founders, directors, and finance teams evaluating Sannidh.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {businessFaqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="bg-slate-900/40 border border-slate-800/80 rounded-xl px-5 py-1 backdrop-blur-sm data-[state=open]:border-emerald-500/40 transition-colors"
              >
                <AccordionTrigger className="text-left text-base sm:text-lg font-semibold text-white hover:text-emerald-400 hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-300 text-sm sm:text-base leading-relaxed pb-5 pt-1">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ─── SECTION 7: BOTTOM CTA ─────────────────────────────────────── */}
        <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center border-t border-slate-800/60">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-emerald-950/20 border border-emerald-500/30 backdrop-blur-xl relative shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to Stop Bleeding Cash on Accounting Chaos?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
              Join forward-thinking Indian businesses automating their finance operations, eliminating penalties, and collaborating with their CAs on Sannidh.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-emerald-900/40"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-white font-medium px-8 py-6 text-base rounded-xl"
                >
                  Explore Architecture
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>RBI Account Aggregator Protected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Your CA Connects Free</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
