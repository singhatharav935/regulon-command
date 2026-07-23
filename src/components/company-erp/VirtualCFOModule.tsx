/**
 * VIRTUAL CFO INTELLIGENCE CENTER
 * ================================
 * AI-powered Virtual CFO module for the Sannidh Company Dashboard.
 * Provides real-time financial intelligence that a ₹1.5L/month human CFO
 * would normally provide — at a fraction of the cost.
 *
 * Features:
 * - Cash Flow Runway & Alerts
 * - Receivables Engine (Days Sales Outstanding)
 * - Vendor Price Creep Detection
 * - ITC Rescue & Tax Leakage Prevention
 * - Advance Tax Forecaster
 * - Monthly MIS Report Generator
 * - Customer Concentration Risk
 * - Hidden Expense Tracker
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  IndianRupee, Calendar, Users, BarChart3, PieChart,
  LineChart, Activity, Shield, Zap, Sparkles, ArrowUpRight,
  ArrowDownRight, Clock, Download, RefreshCw, Eye,
  ChevronDown, ChevronUp, Bell, Target, Lightbulb,
  CreditCard, Landmark, AlertCircle, Star, Building2,
  Package, FileText, Briefcase, BrainCircuit, Gauge,
  Wallet
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ─── Types ─────────────────────────────────────────────────────────────────

interface CFOAlert {
  id: string;
  type: "critical" | "warning" | "opportunity" | "info";
  title: string;
  detail: string;
  amount?: number;
  action: string;
  due_date?: string;
}

interface CashFlowDay {
  date: string;
  label: string;
  projected_balance: number;
  inflow: number;
  outflow: number;
  is_negative?: boolean;
}

interface Customer {
  name: string;
  revenue_pct: number;
  outstanding: number;
  avg_days_to_pay: number;
  risk: "low" | "medium" | "high";
}

interface VendorAlert {
  vendor: string;
  category: string;
  old_price: number;
  new_price: number;
  increase_pct: number;
  annual_impact: number;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const CFO_ALERTS: CFOAlert[] = [
  {
    id: "1", type: "critical",
    title: "Cash Flow Goes Negative in 9 Days",
    detail: "At your current burn rate of ₹12.4L/month, your projected balance on August 1st will be -₹2.1L due to 3 simultaneous vendor payments totalling ₹7.2L.",
    amount: -210000, action: "View Cash Forecast", due_date: "Aug 1, 2025"
  },
  {
    id: "2", type: "critical",
    title: "₹45,000 Input Tax Credit at Risk",
    detail: "Your supplier 'Tech Solutions India' has not filed their GSTR-1 for June 2025. This means ₹6,300 of ITC on their bill will be blocked in GSTR-2B. Call them immediately.",
    amount: 6300, action: "Send Reminder to Vendor", due_date: "Jul 31, 2025"
  },
  {
    id: "3", type: "warning",
    title: "Advance Tax Payment Due — ₹2.4L",
    detail: "Based on Q1 profit of ₹18.3L, you must pay ₹2.4L as Advance Tax by September 15th. Missing this will attract 1% interest per month under Section 234B/C.",
    amount: 240000, action: "Schedule Payment", due_date: "Sep 15, 2025"
  },
  {
    id: "4", type: "warning",
    title: "ECS Bounce Risk on 10th August",
    detail: "Your HDFC Loan EMI of ₹85,000 auto-debits on Aug 10th. Projected balance on Aug 9th is only ₹61,000. A bounce will cost ₹1,500 penalty + CIBIL score drop.",
    amount: 85000, action: "Transfer Funds", due_date: "Aug 9, 2025"
  },
  {
    id: "5", type: "opportunity",
    title: "Claim ₹38,500 in Unclaimed ITC",
    detail: "Sannidh found 3 purchase bills from last quarter where ITC was eligible but not claimed in the GST return. Your CA can file a GSTR-3B amendment to claim this.",
    amount: 38500, action: "Instruct CA to Claim"
  },
  {
    id: "6", type: "opportunity",
    title: "Cancel 4 Unused SaaS Subscriptions — Save ₹2.8L/year",
    detail: "Sannidh detected 4 recurring software charges (₹23,400/month) that have had zero usage logins in the past 60 days. Cancel to save ₹2.8L annually.",
    amount: 280000, action: "View Subscriptions"
  },
];

const CASH_FLOW_FORECAST: CashFlowDay[] = [
  { date: "Jul 24", label: "Today", projected_balance: 1842300, inflow: 0, outflow: 0 },
  { date: "Jul 26", label: "Fri", projected_balance: 2056100, inflow: 213800, outflow: 0 },
  { date: "Jul 28", label: "Sun", projected_balance: 1971100, inflow: 0, outflow: 85000 },
  { date: "Aug 1", label: "Sat", projected_balance: -31900, inflow: 0, outflow: 2003000, is_negative: true },
  { date: "Aug 5", label: "Wed", projected_balance: 521600, inflow: 553500, outflow: 0 },
  { date: "Aug 10", label: "Mon", projected_balance: 436600, inflow: 0, outflow: 85000 },
  { date: "Aug 15", label: "Sat", projected_balance: 1049850, inflow: 613250, outflow: 0 },
];

const TOP_CUSTOMERS: Customer[] = [
  { name: "Reliance Retail Ltd", revenue_pct: 34, outstanding: 0, avg_days_to_pay: 18, risk: "low" },
  { name: "Flipkart Internet Pvt Ltd", revenue_pct: 22, outstanding: 613600, avg_days_to_pay: 31, risk: "medium" },
  { name: "D-Mart Pvt Ltd", revenue_pct: 18, outstanding: 460200, avg_days_to_pay: 52, risk: "high" },
  { name: "Tata Consumer Products", revenue_pct: 14, outstanding: 214760, avg_days_to_pay: 28, risk: "medium" },
  { name: "Metro Cash & Carry", revenue_pct: 12, outstanding: 103250, avg_days_to_pay: 22, risk: "low" },
];

const VENDOR_ALERTS: VendorAlert[] = [
  { vendor: "Shreeji Raw Materials", category: "Steel & Metal", old_price: 10000, new_price: 10500, increase_pct: 5.0, annual_impact: 87000 },
  { vendor: "Prime Logistics", category: "Freight", old_price: 18500, new_price: 22000, increase_pct: 18.9, annual_impact: 42000 },
];

// ─── Sub-sections ───────────────────────────────────────────────────────────

function CashFlowSection() {
  const maxBalance = Math.max(...CASH_FLOW_FORECAST.map(d => d.projected_balance));
  const currentBalance = CASH_FLOW_FORECAST[0].projected_balance;
  const monthlyBurn = 1240000;
  const runwayDays = Math.floor(currentBalance / (monthlyBurn / 30));

  return (
    <div className="space-y-4">
      {/* Runway Meter */}
      <div className="rounded-xl p-4 border border-white/8 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Cash Runway Meter
            </p>
            <p className="text-[10px] text-muted-foreground">Days of operating cash remaining at current burn rate</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-cyan-400">{runwayDays} days</p>
            <p className="text-[10px] text-muted-foreground">Burn: ₹{(monthlyBurn / 100000).toFixed(1)}L/month</p>
          </div>
        </div>
        <Progress value={(runwayDays / 90) * 100} className="h-2.5 bg-white/5" />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-red-400">0 days</span>
          <span className="text-[10px] text-amber-400">30 days</span>
          <span className="text-[10px] text-emerald-400">90 days</span>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-3">7-Day Cash Balance Forecast</p>
        <div className="grid grid-cols-7 gap-1 items-end h-28">
          {CASH_FLOW_FORECAST.map((day, i) => {
            const height = Math.max(8, Math.abs(day.projected_balance) / maxBalance * 100);
            const isNegative = day.projected_balance < 0;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-md transition-all ${isNegative ? "bg-red-500/40 border border-red-500/30" : "bg-cyan-500/30 border border-cyan-500/20"}`}
                  style={{ height: `${height}%` }}
                />
                <p className="text-[9px] text-muted-foreground">{day.date}</p>
                <p className={`text-[8px] font-bold ${isNegative ? "text-red-400" : "text-cyan-400"}`}>
                  {isNegative ? "-" : ""}₹{Math.abs(day.projected_balance / 100000).toFixed(1)}L
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-2 p-2.5 rounded-lg bg-red-500/8 border border-red-500/15">
          <p className="text-[10px] text-red-400 font-semibold">⚠ Aug 1: Balance projected at -₹31,900. Three vendor payments of ₹20.3L hit simultaneously. Transfer ₹3L before Aug 1.</p>
        </div>
      </div>
    </div>
  );
}

function ReceivablesSection() {
  const totalOutstanding = TOP_CUSTOMERS.reduce((s, c) => s + c.outstanding, 0);
  const riskCustomers = TOP_CUSTOMERS.filter(c => c.risk === "high");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 border border-amber-500/20 bg-amber-500/5 text-center">
          <p className="text-lg font-bold text-amber-400">₹{(totalOutstanding / 100000).toFixed(1)}L</p>
          <p className="text-[10px] text-muted-foreground">Total Outstanding</p>
        </div>
        <div className="rounded-xl p-3 border border-red-500/20 bg-red-500/5 text-center">
          <p className="text-lg font-bold text-red-400">{riskCustomers.length}</p>
          <p className="text-[10px] text-muted-foreground">High Risk Customers</p>
        </div>
        <div className="rounded-xl p-3 border border-cyan-500/20 bg-cyan-500/5 text-center">
          <p className="text-lg font-bold text-cyan-400">31 days</p>
          <p className="text-[10px] text-muted-foreground">Avg Days to Pay</p>
        </div>
      </div>

      {/* Customer Concentration Risk */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Revenue Concentration Risk</p>
        <div className="space-y-2">
          {TOP_CUSTOMERS.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 shrink-0">
                <p className="text-[10px] text-foreground font-medium truncate">{c.name.split(" ")[0]} {c.name.split(" ")[1]}</p>
              </div>
              <div className="flex-1">
                <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.revenue_pct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className={`h-full rounded-full ${
                      c.risk === "high" ? "bg-red-500/50" : c.risk === "medium" ? "bg-amber-500/40" : "bg-emerald-500/40"
                    }`}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground w-8 text-right">{c.revenue_pct}%</p>
              <p className={`text-[10px] font-medium w-16 text-right ${
                c.avg_days_to_pay > 45 ? "text-red-400" : c.avg_days_to_pay > 30 ? "text-amber-400" : "text-emerald-400"
              }`}>{c.avg_days_to_pay}d pay</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium w-14 text-center ${
                c.risk === "high" ? "bg-red-500/10 text-red-400 border-red-500/20"
                : c.risk === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>{c.risk} risk</span>
            </div>
          ))}
        </div>
        {TOP_CUSTOMERS.filter(c => c.revenue_pct > 30).length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <p className="text-[10px] text-amber-400">⚠ <strong>Concentration Risk:</strong> Reliance Retail contributes 34% of revenue. If they delay payment, your cash flow will be severely impacted. Diversify your customer base.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VendorIntelSection() {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <p className="text-xs font-semibold text-amber-300">Sannidh detected vendor price creep in 2 categories</p>
        </div>
        <p className="text-[10px] text-amber-400/70">These price increases were never officially communicated but are visible through bill analysis over time. Total annual impact: ₹1.29L.</p>
      </div>

      {VENDOR_ALERTS.map((v, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-white/5 bg-muted/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-foreground">{v.vendor}</p>
              <p className="text-[10px] text-muted-foreground">{v.category}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-red-400">+{v.increase_pct}% price hike</p>
              <p className="text-[10px] text-red-400/70">₹{v.annual_impact.toLocaleString()}/yr impact</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span>Jan price: <strong className="text-foreground">₹{v.old_price.toLocaleString()}</strong></span>
            <ArrowUpRight className="w-3 h-3 text-red-400" />
            <span>Now: <strong className="text-red-400">₹{v.new_price.toLocaleString()}</strong></span>
          </div>
          <Button size="sm" className="mt-2 h-7 text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">Negotiate / Find Alternatives</Button>
        </motion.div>
      ))}

      {/* Hidden Subscriptions */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-violet-400" />
          <p className="text-xs font-semibold text-violet-300">4 Unused SaaS Subscriptions — ₹23,400/month</p>
        </div>
        <div className="space-y-1.5 text-[10px] text-muted-foreground">
          {["Adobe Creative Cloud — ₹6,200 (0 logins, 60 days)", "Slack Premium — ₹4,800 (team uses WhatsApp)", "Zoom Business — ₹5,400 (uses Google Meet)", "Canva Pro (5 seats) — ₹7,000 (1 person uses it)"].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50 shrink-0" />
              <span>{s}</span>
            </div>
          ))}
        </div>
        <Button size="sm" className="mt-3 h-7 text-[10px] bg-violet-500/15 border border-violet-500/25 text-violet-300">Cancel All — Save ₹2.8L/year</Button>
      </div>
    </div>
  );
}

function TaxShieldSection() {
  return (
    <div className="space-y-3">
      {[
        {
          icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20",
          title: "Advance Tax Forecaster",
          subtitle: "Q2 due: Sep 15, 2025",
          content: "Based on Q1 profit of ₹18.3L, your estimated annual profit is ₹73.2L. Total advance tax liability: ₹9.6L. Pay ₹2.4L by Sep 15th to avoid Section 234C interest.",
          amount: "₹2.4L due Sep 15",
          amountColor: "text-amber-400",
          action: "Schedule Payment"
        },
        {
          icon: Target, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20",
          title: "ITC Rescue — Blocked Credit Recovery",
          subtitle: "3 suppliers not filed",
          content: "Sannidh cross-checked your purchase bills against GSTR-2B. 3 vendors haven't filed, blocking ₹38,500 of your ITC. Auto-reminder sent via WhatsApp to all 3 vendors.",
          amount: "₹38,500 at risk",
          amountColor: "text-red-400",
          action: "Track Vendor Filing"
        },
        {
          icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20",
          title: "TDS Default Prevention",
          subtitle: "2 payments flagged",
          content: "Digital Marketing Agency (₹45,000) and Lawyer (₹15,000) payments require TDS deduction @10% before payment. Total TDS to deposit: ₹6,000 by Aug 7th. Failure = penalty + disallowance of expense.",
          amount: "₹6,000 TDS due",
          amountColor: "text-amber-400",
          action: "View TDS Challan"
        },
        {
          icon: PieChart, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",
          title: "Section 80-IC Deduction Opportunity",
          subtitle: "Potential ₹4.2L saving",
          content: "Your factory is located in a notified industrial area of Himachal Pradesh. You may qualify for 25% profit deduction under Section 80-IC. Consult your CA immediately — this could save ₹4.2L in taxes this year.",
          amount: "₹4.2L potential saving",
          amountColor: "text-violet-400",
          action: "Discuss with CA"
        },
      ].map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          className={`rounded-xl p-3 border ${item.border} ${item.bg}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-white/5 shrink-0 mt-0.5`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <span className={`text-[10px] font-bold ${item.amountColor}`}>{item.amount}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.subtitle}</p>
              <p className="text-[10px] text-muted-foreground/80 mt-1.5 leading-relaxed">{item.content}</p>
              <Button size="sm" className={`mt-2 h-7 text-[10px] ${item.bg} border ${item.border} ${item.color}`}>{item.action}</Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MISReportSection() {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      toast({ title: "MIS Report Generated ✅", description: "July 2025 Management Information System Report is ready. Download it from Document Vault." });
    }, 2200);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 border border-white/8 bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/20">
            <BrainCircuit className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Monthly MIS Report Generator</p>
            <p className="text-[10px] text-muted-foreground">AI generates a bank-ready 3-page PDF report on the 1st of every month</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {[
            { label: "Net Revenue (July)", value: "₹16.81L", trend: "+12.3%", up: true },
            { label: "Total Expenses", value: "₹9.63L", trend: "+2.1%", up: false },
            { label: "Gross Profit", value: "₹7.18L", trend: "+18.7%", up: true },
            { label: "Cash Position", value: "₹18.42L", trend: "+5.4%", up: true },
            { label: "Outstanding Dues", value: "₹13.92L", trend: "-3.2%", up: false },
            { label: "Compliance Score", value: "87/100", trend: "+4pts", up: true },
          ].map((kpi, i) => (
            <div key={i} className="rounded-lg p-2.5 bg-white/3 border border-white/5">
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{kpi.value}</p>
              <p className={`text-[10px] font-medium flex items-center gap-0.5 ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>
                {kpi.up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {kpi.trend} vs last month
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={generating} className="flex-1 h-9 text-xs gap-2 bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30">
            {generating ? (
              <><div className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-3 h-3" /> Generate July 2025 MIS Report</>
            )}
          </Button>
          <Button variant="outline" className="h-9 text-xs border-white/10 gap-1.5">
            <Download className="w-3 h-3" /> June Report
          </Button>
        </div>
      </div>

      {/* Top 3 Action Items */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">🎯 Top 3 CFO Action Items This Month</p>
        <div className="space-y-2">
          {[
            { no: 1, text: "Transfer ₹3L to bank account before August 1st to avoid cash flow going negative.", urgency: "CRITICAL" },
            { no: 2, text: "Call Shreeji Raw Materials and Tech Solutions — negotiate price back or switch vendors. Annual saving: ₹1.29L.", urgency: "HIGH" },
            { no: 3, text: "Ask CA to file GSTR-3B amendment to claim ₹38,500 in blocked ITC from last quarter.", urgency: "HIGH" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg border border-white/5 bg-muted/5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${
                item.urgency === "CRITICAL" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
              }`}>{item.no}</div>
              <div className="flex-1">
                <p className="text-[10px] text-foreground">{item.text}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                item.urgency === "CRITICAL" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
              }`}>{item.urgency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Alert Cards ────────────────────────────────────────────────────────────

function CFOAlertCard({ alert, index }: { alert: CFOAlert; index: number }) {
  const config = {
    critical: { border: "border-red-500/25", bg: "bg-red-500/5", icon: AlertTriangle, iconColor: "text-red-400", badge: "bg-red-500/15 text-red-400" },
    warning: { border: "border-amber-500/25", bg: "bg-amber-500/5", icon: Clock, iconColor: "text-amber-400", badge: "bg-amber-500/15 text-amber-400" },
    opportunity: { border: "border-emerald-500/25", bg: "bg-emerald-500/5", icon: Lightbulb, iconColor: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400" },
    info: { border: "border-cyan-500/25", bg: "bg-cyan-500/5", icon: Star, iconColor: "text-cyan-400", badge: "bg-cyan-500/15 text-cyan-400" },
  }[alert.type];

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-xl p-3.5 border ${config.border} ${config.bg}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white/5 shrink-0 mt-0.5`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="text-xs font-semibold text-foreground leading-snug">{alert.title}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${config.badge} shrink-0`}>
              {alert.type}
            </span>
          </div>
          {alert.due_date && <p className="text-[10px] text-muted-foreground mt-0.5">Due: {alert.due_date}</p>}
          <p className="text-[10px] text-muted-foreground/80 mt-1.5 leading-relaxed">{alert.detail}</p>
          {alert.amount !== undefined && (
            <p className={`text-xs font-bold mt-1.5 ${alert.amount < 0 ? "text-red-400" : alert.type === "opportunity" ? "text-emerald-400" : "text-amber-400"}`}>
              {alert.amount < 0 ? "Deficit: " : alert.type === "opportunity" ? "Savings: " : "Amount: "}
              ₹{Math.abs(alert.amount).toLocaleString()}
            </p>
          )}
          <Button size="sm" className={`mt-2 h-7 text-[10px] border ${config.border} ${config.badge} hover:opacity-80`}>
            {alert.action} →
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main CFO Component ─────────────────────────────────────────────────────

const CFO_TABS = [
  { id: "alerts", label: "CFO Alerts", icon: Bell },
  { id: "cashflow", label: "Cash Flow", icon: Activity },
  { id: "receivables", label: "Receivables", icon: Users },
  { id: "vendors", label: "Vendor Intel", icon: Package },
  { id: "tax", label: "Tax Shield", icon: Shield },
  { id: "mis", label: "MIS Reports", icon: FileText },
] as const;

type CFOTab = typeof CFO_TABS[number]["id"];

export function VirtualCFOModule() {
  const [activeTab, setActiveTab] = useState<CFOTab>("alerts");
  const [collapsed, setCollapsed] = useState(false);

  const criticalCount = CFO_ALERTS.filter(a => a.type === "critical").length;
  const opportunityCount = CFO_ALERTS.filter(a => a.type === "opportunity").length;

  return (
    <Card className="border-white/8 bg-gradient-to-br from-card/60 to-background/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-0 border-b border-white/5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/15 border border-violet-500/20">
              <BrainCircuit className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 flex-wrap">
                CFO Intelligence Center
                <Badge className="text-[9px] bg-violet-500/15 text-violet-400 border-violet-500/25 font-bold px-1.5 py-0">VIRTUAL CFO</Badge>
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Real-time financial intelligence — what a ₹1.5L/month CFO would tell you, live 24/7.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] font-bold text-red-400">{criticalCount} Critical</span>
              </div>
            )}
            {opportunityCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Lightbulb className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">{opportunityCount} Savings Found</span>
              </div>
            )}
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        {!collapsed && (
          <div className="flex gap-1 mt-4 overflow-x-auto pb-0 scrollbar-hide">
            {CFO_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "text-violet-400 border-violet-400 bg-white/4"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-white/3"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
                {tab.id === "alerts" && criticalCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold flex items-center justify-center">
                    {CFO_ALERTS.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-5">
              {activeTab === "alerts" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{CFO_ALERTS.length} active alerts — {criticalCount} require immediate action</p>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/10 gap-1">
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </Button>
                  </div>
                  {CFO_ALERTS.map((alert, i) => <CFOAlertCard key={alert.id} alert={alert} index={i} />)}
                </div>
              )}
              {activeTab === "cashflow" && <CashFlowSection />}
              {activeTab === "receivables" && <ReceivablesSection />}
              {activeTab === "vendors" && <VendorIntelSection />}
              {activeTab === "tax" && <TaxShieldSection />}
              {activeTab === "mis" && <MISReportSection />}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default VirtualCFOModule;
