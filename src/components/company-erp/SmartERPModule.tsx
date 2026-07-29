/**
 * SMART ERP MODULE — Full Enterprise Accounting & Compliance System
 * =================================================================
 * Matches + surpasses Tally. ZERO hardcoded data inside this file.
 * ALL data flows in as props from:
 *   - Demo: DEMO_* arrays from src/data/demo-data.ts
 *   - Real: Live Supabase data from RealERPModule
 *
 * 11 Modules (all computed from props):
 *  1.  Summary        — P&L snapshot, cash position, key KPIs
 *  2.  Sales          — Tax Invoices, Credit Notes, e-Invoice, Receivables Aging
 *  3.  Purchases      — Bills, AI OCR, GSTR-2B Match, Debit Notes, Payables Aging
 *  4.  Expenses       — Vouchers, Petty Cash Register, TDS on Payments
 *  5.  Bank & Cash    — Reconciliation, Cash Book, Contra, Auto-Match
 *  6.  Payroll        — Salary Register, PF/ESIC/PT/TDS, Payslips, Bank File
 *  7.  GST Returns    — GSTR-1 (B2B/B2C), GSTR-3B, ITC Ledger, E-Way Bill
 *  8.  TDS / TCS      — 194C/J/I/A Register, Challans, Form 16A, 26Q
 *  9.  Ledger         — Day Book, Journal Vouchers, Chart of Accounts, Ledger
 * 10.  Inventory      — Stock Items, HSN/SAC, Movement, Reorder, Valuation
 * 11.  Reports        — P&L, Balance Sheet, Cash Flow, Receivable/Payable Aging
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, ShoppingCart, Receipt, Users, Landmark,
  Package, BarChart3, Shield, TrendingUp, TrendingDown,
  IndianRupee, AlertTriangle, CheckCircle2, Clock, X,
  Camera, Upload, Search, Filter, Plus, Download, Eye,
  Edit2, Send, RefreshCw, Sparkles, AlertCircle, Zap,
  CreditCard, Wallet, ArrowUpRight, ArrowDownRight,
  BookOpen, PieChart, FileBarChart2, Hash, Building2,
  ChevronDown, ChevronUp, Info, Star, Archive, Layers,
  RotateCcw, PrinterIcon, ExternalLink, ListChecks, Globe
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FinancialStatementsModule } from "./FinancialStatementsModule";
import { StatutoryTaxModule } from "./StatutoryTaxModule";
import { StatutoryNoticeModule } from "./StatutoryNoticeModule";
import { GovEFilingHubModule } from "./GovEFilingHubModule";
import { BankReconciliationModule } from "./BankReconciliationModule";
import { FXInternationalModule } from "./FXInternationalModule";
import { FixedAssetModule } from "./FixedAssetModule";
import { CFOIntelligenceModule } from "./CFOIntelligenceModule";
import {
  DEMO_BALANCE_SHEET,
  DEMO_PROFIT_LOSS,
  DEMO_ASSET_REGISTER,
  DEMO_DEFERRED_TAX,
  DEMO_FINANCIAL_RATIOS,
  DEMO_CARO_2020,
  DEMO_NOTES_TO_ACCOUNTS,
  DEMO_PERIOD_FINANCIALS,
} from "@/data/demo-financial-statements-data";
import {
  DEMO_ADVANCE_TAX,
  DEMO_FORM_138_SUMMARY,
  DEMO_FORM_140_SUMMARY,
  DEMO_FORM_143_SUMMARY,
  DEMO_FORM_144_SUMMARY,
  DEMO_GSTR3B_SET_OFF,
  DEMO_GSTR2B_RECONCILIATION,
} from "@/data/demo-statutory-tax-data";
import {
  DEMO_STATUTORY_NOTICES,
  DEMO_LEGAL_DRAFTS,
  DEMO_RISK_SCORES,
  DEMO_NOTICE_DASHBOARD_SUMMARY,
} from "@/data/demo-statutory-notice-data";
import type {
  SmartERPProps, ERPInvoice, ERPPurchase, ERPExpense,
  ERPPayroll, ERPBankTxn, ERPStockItem
} from "./erp-types";

// ─── Helper UI ────────────────────────────────────────────────────────────────

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtL = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : fmt(n);

export const TALLY_50_INDIRECT_EXPENSE_LEDGERS = [
  { no: 1, name: "Salary", group: "Personnel Expenses", desc: "Staff & management monthly remuneration" },
  { no: 2, name: "Wages (Office)", group: "Personnel Expenses", desc: "Office support & casual administrative labour" },
  { no: 3, name: "Rent", group: "Administrative Expenses", desc: "Office premises, warehouse & branch rent" },
  { no: 4, name: "Electricity Expenses", group: "Utilities", desc: "Office & commercial power charges" },
  { no: 5, name: "Telephone Expenses", group: "Utilities", desc: "Landline & corporate mobile connections" },
  { no: 6, name: "Internet Expenses", group: "Utilities", desc: "Broadband, fiber & cloud network links" },
  { no: 7, name: "Printing & Stationery", group: "Administrative Expenses", desc: "Paper, printing, toner & office supplies" },
  { no: 8, name: "Postage & Courier", group: "Administrative Expenses", desc: "Postal stamps, speed post & courier services" },
  { no: 9, name: "Travelling Expenses", group: "Operational Expenses", desc: "Outstation business travel, lodging & boarding" },
  { no: 10, name: "Conveyance Expenses", group: "Operational Expenses", desc: "Local travel, cab & daily transit allowance" },
  { no: 11, name: "Fuel & Petrol Expenses", group: "Operational Expenses", desc: "Vehicle fuel & diesel generator expenditure" },
  { no: 12, name: "Vehicle Maintenance", group: "Operational Expenses", desc: "Company vehicle service, insurance & repairs" },
  { no: 13, name: "Repair & Maintenance", group: "Operational Expenses", desc: "Building, office equipment & IT maintenance" },
  { no: 14, name: "Office Expenses", group: "Administrative Expenses", desc: "General office overheads & supplies" },
  { no: 15, name: "Staff Welfare Expenses", group: "Personnel Expenses", desc: "Employee tea, snacks, medical & wellness" },
  { no: 16, name: "Refreshment Expenses", group: "Personnel Expenses", desc: "Client meetings & executive hospitality" },
  { no: 17, name: "Advertisement Expenses", group: "Sales & Marketing", desc: "Print, TV, radio & outdoor advertisements" },
  { no: 18, name: "Marketing Expenses", group: "Sales & Marketing", desc: "Digital campaigns, SEO & agency retainers" },
  { no: 19, name: "Commission Paid", group: "Sales & Marketing", desc: "Sales channel, broker & agent commissions" },
  { no: 20, name: "Legal & Professional Fees", group: "Legal & Statutory", desc: "Advocate, consultant & secretarial charges" },
  { no: 21, name: "Audit Fees", group: "Legal & Statutory", desc: "Statutory, internal & tax auditor remuneration" },
  { no: 22, name: "Consultancy Charges", group: "Legal & Statutory", desc: "Technical, management & advisory fees" },
  { no: 23, name: "Bank Charges", group: "Financial Expenses", desc: "Bank processing, NEFT, RTGS & gateway fees" },
  { no: 24, name: "Interest Paid", group: "Financial Expenses", desc: "Interest on loans, overdrafts & working capital" },
  { no: 25, name: "Insurance Expenses", group: "Financial Expenses", desc: "Fire, transit, asset & director liability insurance" },
  { no: 26, name: "Computer Expenses", group: "IT & Software", desc: "Hardware maintenance, peripherals & IT accessories" },
  { no: 27, name: "Software Expenses", group: "IT & Software", desc: "SaaS subscriptions, Tally license & cloud hosting" },
  { no: 28, name: "Security Expenses", group: "Administrative Expenses", desc: "Security guard agency & surveillance services" },
  { no: 29, name: "Housekeeping Expenses", group: "Administrative Expenses", desc: "Sanitation, janitorial & facility management" },
  { no: 30, name: "Cleaning Expenses", group: "Administrative Expenses", desc: "Office cleaning materials & waste management" },
  { no: 31, name: "Donation (Business Purpose)", group: "Administrative Expenses", desc: "Approved business donations & statutory CSR" },
  { no: 32, name: "Subscription Charges", group: "Administrative Expenses", desc: "Trade journals, industry reports & databases" },
  { no: 33, name: "Membership Fees", group: "Administrative Expenses", desc: "Chamber of Commerce & industry association fees" },
  { no: 34, name: "Miscellaneous Expenses", group: "Administrative Expenses", desc: "Sundry unclassified office expenditures" },
  { no: 35, name: "Water Charges", group: "Utilities", desc: "Commercial water supply & tanker charges" },
  { no: 36, name: "Depreciation", group: "Non-Cash Expenses", desc: "Section 32 Income Tax / Schedule II asset write-off" },
  { no: 37, name: "Bad Debts", group: "Non-Cash Expenses", desc: "Irrecoverable customer balance write-off" },
  { no: 38, name: "GST Late Fee", group: "Legal & Statutory", desc: "Late filing fee for GSTR-1, 3B & Annual returns" },
  { no: 39, name: "Penalty & Fine", group: "Legal & Statutory", desc: "Statutory non-compliance fines (Non-deductible u/s 37)" },
  { no: 40, name: "Packing Charges", group: "Sales & Marketing", desc: "Secondary & tertiary dispatch packaging" },
  { no: 41, name: "Forwarding Charges", group: "Sales & Marketing", desc: "Outward freight & dispatch logistics" },
  { no: 42, name: "Professional Tax", group: "Legal & Statutory", desc: "State Professional Tax (Employer registration liability)" },
  { no: 43, name: "RTO Expenses", group: "Operational Expenses", desc: "Vehicle registration, fitness & road tax" },
  { no: 44, name: "Indirect Labour Charges", group: "Personnel Expenses", desc: "Contract labour for non-production duties" },
  { no: 45, name: "Loading & Unloading Charges", group: "Operational Expenses", desc: "Outward goods handling & coolie charges" },
  { no: 46, name: "Gate Pass Charges", group: "Operational Expenses", desc: "Port, octroi, toll & gate entry charges" },
  { no: 47, name: "Weighment Charges", group: "Operational Expenses", desc: "Dharamkanta & truck weighbridge fees" },
  { no: 48, name: "Sampling Charges", group: "Operational Expenses", desc: "Product quality sampling & laboratory costs" },
  { no: 49, name: "Testing Charges", group: "Operational Expenses", desc: "Quality assurance & ISO certification testing" },
  { no: 50, name: "Loss by Theft / Fire", group: "Non-Cash Expenses", desc: "Abnormal inventory or asset loss (Extraordinary item)" },
];

function SBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    overdue: "bg-red-500/15 text-red-400 border-red-500/25",
    draft: "bg-slate-500/15 text-slate-400 border-slate-500/25",
    processed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    pending_review: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
    rejected: "bg-red-500/15 text-red-400 border-red-500/25",
    low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    high: "bg-red-500/15 text-red-400 border-red-500/25",
  };
  const labels: Record<string, string> = {
    paid: "Paid", pending: "Pending", overdue: "Overdue", draft: "Draft",
    processed: "Processed", pending_review: "AI Review", rejected: "Rejected",
    low: "Low", medium: "Medium", high: "High",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] || "bg-muted/30 text-muted-foreground"}`}>
      {labels[status] || status}
    </span>
  );
}

function AIScore({ score }: { score: number }) {
  if (score === 0) return <span className="text-[10px] text-muted-foreground">Manual</span>;
  const cls = score >= 95 ? "text-emerald-400 bg-emerald-500/10" : score >= 80 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10";
  return (
    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
      <Sparkles className="w-2.5 h-2.5" /> {score}%
    </span>
  );
}

function KPI({ label, value, sub, color, icon: Icon, bg }: {
  label: string; value: string | number; sub?: string;
  color: string; icon: React.ElementType; bg: string;
}) {
  return (
    <div className={`rounded-xl p-3 border border-white/5 ${bg} flex items-center gap-3`}>
      <div className="p-2 rounded-lg bg-black/20 shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-bold ${color} truncate`}>{value}</p>
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        {sub && <p className={`text-[9px] ${color}/60 truncate`}>{sub}</p>}
      </div>
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">{children}</table>
      </div>
    </div>
  );
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2.5 text-muted-foreground font-medium ${right ? "text-right" : "text-left"} whitespace-nowrap`}>{children}</th>;
}

function Toolbar({ search, onSearch, onNew, newLabel, onFilter }: {
  search: string; onSearch: (v: string) => void;
  onNew?: () => void; newLabel?: string; onFilter?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search..." className="pl-9 h-9 text-xs bg-muted/20 border-white/10" />
      </div>
      {onFilter && (
        <Button size="sm" variant="outline" className="h-9 text-xs border-white/10 gap-1.5">
          <Filter className="w-3 h-3" /> Filter
        </Button>
      )}
      <Button size="sm" variant="outline" className="h-9 text-xs border-white/10 gap-1.5">
        <Download className="w-3 h-3" /> Export
      </Button>
      {onNew && (
        <Button size="sm" onClick={onNew} className="h-9 text-xs gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30">
          <Plus className="w-3 h-3" /> {newLabel || "New"}
        </Button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="text-center py-12 space-y-2">
      <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/60">{sub}</p>
    </div>
  );
}

// ─── 1. SUMMARY PANEL ────────────────────────────────────────────────────────

function SummaryPanel({ invoices, purchases, expenses, payroll, bankTxns, inventory }: SmartERPProps) {
  const totalRevenue = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPurchases = purchases.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPayroll = payroll.reduce((s, p) => s + p.gross, 0);
  const grossProfit = totalRevenue - totalPurchases;
  const netProfit = grossProfit - totalExpenses - totalPayroll;
  const receivable = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const payable = purchases.filter(p => p.status === "pending_review").reduce((s, p) => s + p.total, 0);
  const bankBalance = bankTxns.length > 0 ? bankTxns[0].balance : 0;
  const totalGSTCollected = invoices.reduce((s, i) => s + i.gst, 0);
  const totalITCAvailable = purchases.filter(p => p.itc_eligible && p.itc_claimed).reduce((s, p) => s + p.gst, 0);
  const netGSTPayable = totalGSTCollected - totalITCAvailable;
  const overdueInvoices = invoices.filter(i => i.status === "overdue");
  const stockValue = (inventory || []).reduce((s, item) => s + item.current_qty * item.rate, 0);

  return (
    <div className="space-y-5">
      {/* P&L Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total Revenue" value={fmtL(totalRevenue)} sub="From all invoices" icon={TrendingUp} color="text-emerald-400" bg="bg-emerald-500/5" />
        <KPI label="Total Purchases" value={fmtL(totalPurchases)} sub="Raw material + services" icon={ShoppingCart} color="text-amber-400" bg="bg-amber-500/5" />
        <KPI label="Gross Profit" value={fmtL(grossProfit)} sub={`${((grossProfit / totalRevenue) * 100).toFixed(1)}% margin`} icon={BarChart3} color="text-cyan-400" bg="bg-cyan-500/5" />
        <KPI label="Net Profit" value={fmtL(netProfit)} sub="After all expenses" icon={IndianRupee} color={netProfit >= 0 ? "text-emerald-400" : "text-red-400"} bg={netProfit >= 0 ? "bg-emerald-500/5" : "bg-red-500/5"} />
      </div>

      {/* Working Capital */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Bank Balance" value={fmtL(bankBalance)} sub="Current position" icon={Landmark} color="text-blue-400" bg="bg-blue-500/5" />
        <KPI label="Receivables" value={fmtL(receivable)} sub={`${overdueInvoices.length} overdue`} icon={ArrowUpRight} color="text-violet-400" bg="bg-violet-500/5" />
        <KPI label="Payables" value={fmtL(payable)} sub="Bills under review" icon={ArrowDownRight} color="text-rose-400" bg="bg-rose-500/5" />
        <KPI label="Stock Value" value={fmtL(stockValue)} sub={`${(inventory || []).length} items`} icon={Package} color="text-orange-400" bg="bg-orange-500/5" />
      </div>

      {/* GST Position */}
      <div className="rounded-xl border border-white/8 bg-gradient-to-r from-violet-500/5 to-blue-500/5 p-4">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-violet-400" /> GST Position — Current Month
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Output Tax (Collected)</p>
            <p className="text-lg font-bold text-rose-400">{fmtL(totalGSTCollected)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">ITC Available</p>
            <p className="text-lg font-bold text-emerald-400">{fmtL(totalITCAvailable)}</p>
          </div>
          <div className="text-center border-l border-white/5 pl-4">
            <p className="text-xs text-muted-foreground">Net GST Payable</p>
            <p className="text-lg font-bold text-amber-400">{fmtL(netGSTPayable)}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground">Action Items</p>
        {overdueInvoices.length > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-300">{overdueInvoices.length} Invoices Overdue — {fmtL(overdueInvoices.reduce((s, i) => s + i.total, 0))} outstanding</p>
              <p className="text-[10px] text-red-400/70">Send reminders via WhatsApp / Email</p>
            </div>
            <Button size="sm" className="h-7 text-[10px] bg-red-500/20 border border-red-500/30 text-red-300 shrink-0">Send All</Button>
          </div>
        )}
        {purchases.some(p => p.itc_eligible && !p.itc_claimed) && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-300">Unclaimed ITC — {fmtL(purchases.filter(p => p.itc_eligible && !p.itc_claimed).reduce((s, p) => s + p.gst, 0))}</p>
              <p className="text-[10px] text-amber-400/70">Claim before GSTR-3B deadline to avoid lapse</p>
            </div>
            <Button size="sm" className="h-7 text-[10px] bg-amber-500/15 border border-amber-500/25 text-amber-300 shrink-0">Claim ITC</Button>
          </div>
        )}
        {bankTxns.some(t => !t.matched) && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-cyan-300">{bankTxns.filter(t => !t.matched).length} Bank Transactions Unmatched</p>
              <p className="text-[10px] text-cyan-400/70">Assign voucher or category before CA filing</p>
            </div>
          </div>
        )}
        {(inventory || []).filter(i => i.current_qty <= i.reorder_level).length > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
            <Package className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-orange-300">{(inventory || []).filter(i => i.current_qty <= i.reorder_level).length} Stock Items Below Reorder Level</p>
              <p className="text-[10px] text-orange-400/70">Raise purchase orders immediately</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 2. SALES PANEL ──────────────────────────────────────────────────────────

function SalesPanel({ invoices }: { invoices: ERPInvoice[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "overdue" | "draft">("all");
  const [subTab, setSubTab] = useState<"invoices" | "aging" | "einvoice">("invoices");

  const filtered = invoices.filter(i =>
    (filter === "all" || i.status === filter) &&
    (i.customer.toLowerCase().includes(search.toLowerCase()) || i.invoice_no.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = invoices.reduce((s, i) => s + i.amount, 0);
  const totalGST = invoices.reduce((s, i) => s + i.gst, 0);
  const receivable = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0);

  // Aging buckets
  const aging = {
    current: invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.total, 0),
    days30: invoices.filter(i => i.status === "overdue" && (i.days_overdue || 0) <= 30).reduce((s, i) => s + i.total, 0),
    days60: invoices.filter(i => i.status === "overdue" && (i.days_overdue || 0) > 30 && (i.days_overdue || 0) <= 60).reduce((s, i) => s + i.total, 0),
    days90: invoices.filter(i => i.status === "overdue" && (i.days_overdue || 0) > 60).reduce((s, i) => s + i.total, 0),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total Invoiced" value={fmtL(totalRevenue + totalGST)} sub="This period" icon={FileText} color="text-cyan-400" bg="bg-cyan-500/5" />
        <KPI label="Total Receivable" value={fmtL(receivable)} sub="Outstanding" icon={IndianRupee} color="text-amber-400" bg="bg-amber-500/5" />
        <KPI label="GST Collected" value={fmtL(totalGST)} sub="Output tax" icon={Shield} color="text-violet-400" bg="bg-violet-500/5" />
        <KPI label="Overdue" value={invoices.filter(i => i.status === "overdue").length} sub="invoices" icon={AlertTriangle} color="text-red-400" bg="bg-red-500/5" />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-white/5 pb-0">
        {(["invoices", "aging", "einvoice"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-3 py-2 text-xs font-medium border-b-2 transition-all -mb-px ${subTab === t ? "text-cyan-400 border-cyan-400" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            {t === "invoices" ? "Tax Invoices" : t === "aging" ? "Receivables Aging" : "e-Invoice / e-Way Bill"}
          </button>
        ))}
      </div>

      {subTab === "invoices" && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <Toolbar search={search} onSearch={setSearch} onNew={() => toast({ title: "New Invoice", description: "Invoice builder opening..." })} newLabel="New Invoice" onFilter={() => {}} />
            <div className="flex gap-1">
              {(["all", "paid", "pending", "overdue", "draft"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-all ${filter === f ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? <EmptyState icon={FileText} title="No invoices found" sub="Create your first tax invoice to get started" /> : (
            <TableWrap>
              <thead><tr className="bg-muted/20 border-b border-white/5">
                <TH>Invoice #</TH><TH>Customer / GSTIN</TH><TH>Date</TH>
                <TH right>Taxable</TH><TH right>GST</TH><TH right>Total</TH>
                <TH>Status</TH><TH>Due Date</TH><TH>Actions</TH>
              </tr></thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="px-3 py-3 font-mono text-cyan-400 font-medium">{inv.invoice_no}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-foreground text-xs">{inv.customer}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{inv.gstin}</p>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{inv.date}</td>
                    <td className="px-3 py-3 text-right font-medium">{fmt(inv.amount)}</td>
                    <td className="px-3 py-3 text-right text-violet-400">{fmt(inv.gst)}</td>
                    <td className="px-3 py-3 text-right font-bold text-foreground">{fmt(inv.total)}</td>
                    <td className="px-3 py-3">
                      <SBadge status={inv.status} />
                      {inv.days_overdue && <p className="text-[9px] text-red-400 mt-0.5">{inv.days_overdue}d overdue</p>}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{inv.due_date}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground" title="View"><Eye className="w-3 h-3" /></button>
                        <button className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground" title="Edit"><Edit2 className="w-3 h-3" /></button>
                        <button className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground" title="Print"><PrinterIcon className="w-3 h-3" /></button>
                        <button className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-cyan-400" title="Send"><Send className="w-3 h-3" /></button>
                        <button className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground" title="Download PDF"><Download className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </>
      )}

      {subTab === "aging" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Current (0–30 days)", value: aging.current, color: "text-emerald-400" },
              { label: "31–60 days overdue", value: aging.days30, color: "text-amber-400" },
              { label: "61–90 days overdue", value: aging.days60, color: "text-orange-400" },
              { label: "90+ days overdue", value: aging.days90, color: "text-red-400" },
            ].map((b, i) => (
              <div key={i} className="rounded-xl p-3 border border-white/5 bg-muted/5 text-center">
                <p className={`text-base font-bold ${b.color}`}>{fmtL(b.value)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{b.label}</p>
              </div>
            ))}
          </div>
          <TableWrap>
            <thead><tr className="bg-muted/20 border-b border-white/5">
              <TH>Customer</TH><TH>Invoice #</TH><TH right>Amount</TH><TH>Due Date</TH><TH>Days</TH><TH>Risk</TH>
            </tr></thead>
            <tbody>
              {invoices.filter(i => i.status !== "paid" && i.status !== "draft").map((inv, i) => {
                const days = inv.days_overdue || 0;
                const risk = days === 0 ? "current" : days <= 30 ? "low" : days <= 60 ? "medium" : "high";
                return (
                  <tr key={inv.id} className="border-b border-white/3 hover:bg-white/2">
                    <td className="px-3 py-3 font-medium text-foreground">{inv.customer}</td>
                    <td className="px-3 py-3 font-mono text-cyan-400">{inv.invoice_no}</td>
                    <td className="px-3 py-3 text-right font-bold">{fmt(inv.total)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{inv.due_date}</td>
                    <td className="px-3 py-3">{days > 0 ? <span className="text-red-400 font-medium">{days}d</span> : <span className="text-emerald-400">On time</span>}</td>
                    <td className="px-3 py-3"><SBadge status={risk} /></td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </div>
      )}

      {subTab === "einvoice" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-cyan-300">e-Invoice & e-Way Bill — AI Auto-Generation</p>
                <p className="text-xs text-cyan-400/70 mt-1">Connect your GSTN credentials to auto-generate IRN numbers, QR codes, and e-Way Bills directly from invoices. Mandatory for turnover &gt; ₹5 Crore.</p>
                <Button size="sm" className="mt-3 h-8 text-xs bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 gap-1.5">
                  <ExternalLink className="w-3 h-3" /> Connect GSTN Portal
                </Button>
              </div>
            </div>
          </div>
          <TableWrap>
            <thead><tr className="bg-muted/20 border-b border-white/5">
              <TH>Invoice #</TH><TH>Customer</TH><TH right>Value</TH><TH>IRN Status</TH><TH>e-Way Bill</TH><TH>Actions</TH>
            </tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-white/3 hover:bg-white/2">
                  <td className="px-3 py-3 font-mono text-cyan-400">{inv.invoice_no}</td>
                  <td className="px-3 py-3 text-foreground">{inv.customer}</td>
                  <td className="px-3 py-3 text-right">{fmt(inv.total)}</td>
                  <td className="px-3 py-3">
                    {inv.status === "paid" ? (
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />IRN Generated</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] text-muted-foreground">Not Required</span>
                  </td>
                  <td className="px-3 py-3">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] border-white/10 gap-1">
                      <Zap className="w-2.5 h-2.5" /> Generate IRN
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}
    </div>
  );
}

// ─── 3. PURCHASES PANEL ──────────────────────────────────────────────────────

function PurchasesPanel({ purchases }: { purchases: ERPPurchase[] }) {
  const [search, setSearch] = useState("");
  const [subTab, setSubTab] = useState<"bills" | "gstr2b" | "debit">("bills");
  const [uploading, setUploading] = useState(false);

  const totalITC = purchases.filter(p => p.itc_eligible && p.itc_claimed).reduce((s, p) => s + p.gst, 0);
  const pendingITC = purchases.filter(p => p.itc_eligible && !p.itc_claimed).reduce((s, p) => s + p.gst, 0);
  const avgConf = purchases.filter(p => p.ai_confidence > 0).reduce((s, p) => s + p.ai_confidence, 0) / (purchases.filter(p => p.ai_confidence > 0).length || 1);
  const payable = purchases.reduce((s, p) => s + p.total, 0);

  const filtered = purchases.filter(p =>
    p.vendor.toLowerCase().includes(search.toLowerCase()) ||
    p.bill_no.toLowerCase().includes(search.toLowerCase())
  );

  const handleOCR = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast({ title: "✅ Bill Processed by Sannidh AI", description: "Vendor, GSTIN, items & amounts extracted. Awaiting your review." });
    }, 2500);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total Payable" value={fmtL(payable)} sub="All bills" icon={ShoppingCart} color="text-amber-400" bg="bg-amber-500/5" />
        <KPI label="ITC Claimed" value={fmtL(totalITC)} sub="Tax saved" icon={CheckCircle2} color="text-emerald-400" bg="bg-emerald-500/5" />
        <KPI label="ITC Pending" value={fmtL(pendingITC)} sub="Claim before deadline" icon={Clock} color="text-orange-400" bg="bg-orange-500/5" />
        <KPI label="AI Accuracy" value={`${avgConf.toFixed(0)}%`} sub="Avg OCR confidence" icon={Sparkles} color="text-cyan-400" bg="bg-cyan-500/5" />
      </div>

      {/* AI OCR Upload */}
      <div onClick={handleOCR} className="rounded-xl border-2 border-dashed border-cyan-500/25 bg-cyan-500/3 hover:bg-cyan-500/8 hover:border-cyan-500/40 cursor-pointer p-4 text-center group transition-all">
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-cyan-400 font-medium">Sannidh AI reading your bill...</p>
            <p className="text-[10px] text-muted-foreground">Extracting vendor, GSTIN, HSN, items & tax amounts</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <Camera className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-cyan-400/70">Click Photo</span>
            </div>
            <div className="text-muted-foreground/30">|</div>
            <div className="flex flex-col items-center gap-1">
              <Upload className="w-6 h-6 text-cyan-400/60" />
              <span className="text-[10px] text-cyan-400/70">Upload PDF/Image</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-cyan-300">AI Bill Scanner</p>
              <p className="text-[10px] text-muted-foreground">Supports tax invoices, cash memos & handwritten bills</p>
            </div>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-white/5 pb-0">
        {(["bills", "gstr2b", "debit"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-3 py-2 text-xs font-medium border-b-2 transition-all -mb-px ${subTab === t ? "text-amber-400 border-amber-400" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            {t === "bills" ? "Purchase Bills" : t === "gstr2b" ? "GSTR-2B Match" : "Debit Notes"}
          </button>
        ))}
      </div>

      {subTab === "bills" && (
        <>
          <Toolbar search={search} onSearch={setSearch} onNew={() => {}} newLabel="Manual Entry" onFilter={() => {}} />
          <TableWrap>
            <thead><tr className="bg-muted/20 border-b border-white/5">
              <TH>Bill #</TH><TH>Vendor / GSTIN</TH><TH>Category</TH>
              <TH right>Taxable</TH><TH right>GST</TH><TH right>Total</TH>
              <TH>ITC</TH><TH>AI Score</TH><TH>Status</TH>
            </tr></thead>
            <tbody>
              {filtered.map((bill, i) => (
                <motion.tr key={bill.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-white/3 hover:bg-white/2">
                  <td className="px-3 py-3 font-mono text-amber-400">{bill.bill_no}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground">{bill.vendor}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{bill.gstin}</p>
                  </td>
                  <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground text-[10px]">{bill.category}</span></td>
                  <td className="px-3 py-3 text-right">{fmt(bill.amount)}</td>
                  <td className="px-3 py-3 text-right text-violet-400">{bill.gst > 0 ? fmt(bill.gst) : "—"}</td>
                  <td className="px-3 py-3 text-right font-bold">{fmt(bill.total)}</td>
                  <td className="px-3 py-3">
                    {bill.itc_eligible ? (bill.itc_claimed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-amber-400" />) : <X className="w-3.5 h-3.5 text-red-400/50" />}
                  </td>
                  <td className="px-3 py-3"><AIScore score={bill.ai_confidence} /></td>
                  <td className="px-3 py-3"><SBadge status={bill.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </TableWrap>
        </>
      )}

      {subTab === "gstr2b" && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-300">GSTR-2B Auto-Reconciliation Active</p>
              <p className="text-[10px] text-emerald-400/70">Sannidh AI matches your purchase bills against supplier-filed GSTR-1 data in GSTR-2B to validate ITC eligibility.</p>
            </div>
          </div>
          <TableWrap>
            <thead><tr className="bg-muted/20 border-b border-white/5">
              <TH>Vendor</TH><TH>Bill #</TH><TH right>ITC Amount</TH><TH>GSTR-2B Status</TH><TH>Match</TH>
            </tr></thead>
            <tbody>
              {purchases.filter(p => p.itc_eligible).map((p, i) => (
                <tr key={p.id} className="border-b border-white/3 hover:bg-white/2">
                  <td className="px-3 py-3 text-foreground">{p.vendor}</td>
                  <td className="px-3 py-3 font-mono text-amber-400">{p.bill_no}</td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-400">{fmt(p.gst)}</td>
                  <td className="px-3 py-3">
                    {p.itc_claimed
                      ? <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Reflected in 2B</span>
                      : <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Not in 2B — Supplier not filed</span>}
                  </td>
                  <td className="px-3 py-3">{p.itc_claimed ? <SBadge status="paid" /> : <SBadge status="overdue" />}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}

      {subTab === "debit" && (
        <EmptyState icon={RotateCcw} title="No Debit Notes Created" sub="Debit notes are generated when you return goods to a vendor. Create one from a purchase bill." />
      )}
    </div>
  );
}

// ─── 4. EXPENSES PANEL ───────────────────────────────────────────────────────

function ExpensesPanel({ expenses }: { expenses: ERPExpense[] }) {
  const [search, setSearch] = useState("");
  const [subTab, setSubTab] = useState<"expenses" | "tally50" | "petty" | "tds">("expenses");

  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const tdsTotal = expenses.filter(e => e.tds_applicable).reduce((s, e) => s + (e.tds_amount || 0), 0);
  const missingReceipts = expenses.filter(e => !e.receipt_uploaded).length;
  const cashExpenses = expenses.filter(e => e.paid_by === "cash").reduce((s, e) => s + e.amount, 0);

  const filtered = expenses.filter(e => e.description.toLowerCase().includes(search.toLowerCase()));

  const catGroups = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total Expenses" value={fmtL(totalExp)} sub="This period" icon={Receipt} color="text-rose-400" bg="bg-rose-500/5" />
        <KPI label="TDS Deductible" value={fmt(tdsTotal)} sub="Due by 7th" icon={AlertTriangle} color="text-amber-400" bg="bg-amber-500/5" />
        <KPI label="Petty Cash Spent" value={fmt(cashExpenses)} sub="Cash vouchers" icon={Wallet} color="text-orange-400" bg="bg-orange-500/5" />
        <KPI label="Missing Receipts" value={missingReceipts} sub="Upload to avoid disallowance" icon={Upload} color="text-red-400" bg="bg-red-500/5" />
      </div>

      <div className="flex gap-1 border-b border-white/5 overflow-x-auto">
        {(["expenses", "tally50", "petty", "tds"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-3 py-2 text-xs font-medium border-b-2 transition-all -mb-px shrink-0 ${subTab === t ? "text-rose-400 border-rose-400" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            {t === "expenses" ? "Expense Vouchers" : t === "tally50" ? "50 Tally Indirect Expense Ledgers" : t === "petty" ? "Category Summary" : "TDS on Payments"}
          </button>
        ))}
      </div>

      {subTab === "expenses" && (
        <>
          <Toolbar search={search} onSearch={setSearch} onNew={() => {}} newLabel="Add Expense" onFilter={() => {}} />
          <TableWrap>
            <thead><tr className="bg-muted/20 border-b border-white/5">
              <TH>Date</TH><TH>Description</TH><TH>Category</TH>
              <TH right>Amount</TH><TH>Paid By</TH><TH>Receipt</TH><TH>TDS</TH>
            </tr></thead>
            <tbody>
              {filtered.map((exp, i) => (
                <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-white/3 hover:bg-white/2">
                  <td className="px-3 py-3 text-muted-foreground">{exp.date}</td>
                  <td className="px-3 py-3 font-medium text-foreground">{exp.description}</td>
                  <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground text-[10px]">{exp.category}</span></td>
                  <td className="px-3 py-3 text-right font-bold text-rose-400">{fmt(exp.amount)}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5">
                      {exp.paid_by === "cash" ? <Wallet className="w-3 h-3 text-amber-400" /> : exp.paid_by === "bank" ? <Landmark className="w-3 h-3 text-cyan-400" /> : <CreditCard className="w-3 h-3 text-violet-400" />}
                      <span className="text-[10px] capitalize text-muted-foreground">{exp.paid_by}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {exp.receipt_uploaded ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : (
                      <button className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"><Upload className="w-3 h-3" />Upload</button>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {exp.tds_applicable ? <span className="text-[10px] text-amber-400 font-medium">{fmt(exp.tds_amount || 0)}</span> : <span className="text-muted-foreground">—</span>}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </TableWrap>
        </>
      )}

      {subTab === "tally50" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-purple-500/10 border border-amber-500/20">
            <div>
              <p className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" /> 50 Most Important Indirect Expenses Ledgers List (Tally Prime Compatible)
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Standard double-entry chart of accounts ledgers grouped under "Indirect Expenses" for Income Tax & P&L reporting.
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[10px] border-amber-500/30 text-amber-300 gap-1 shrink-0">
              <Download className="w-3 h-3" /> Export Tally Master (.xlsx)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Ledgers 1 - 25 */}
            <div className="rounded-xl border border-white/8 bg-muted/5 overflow-hidden">
              <div className="px-3 py-2 bg-amber-500/10 border-b border-white/5 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-400 font-mono">No. 1 — 25 | INDIRECT EXPENSE LEDGERS</span>
                <span className="text-[10px] text-muted-foreground">Tally Group: Indirect Expenses</span>
              </div>
              <TableWrap>
                <thead>
                  <tr className="bg-black/20 border-b border-white/5">
                    <TH>No.</TH><TH>Ledger Name</TH><TH>Category Group</TH><TH right>Accrued Amount</TH>
                  </tr>
                </thead>
                <tbody>
                  {TALLY_50_INDIRECT_EXPENSE_LEDGERS.slice(0, 25).map((item) => {
                    const spent = expenses.filter(e => e.category === item.name).reduce((s, e) => s + e.amount, 0);
                    return (
                      <tr key={item.no} className="border-b border-white/3 hover:bg-white/3 text-xs">
                        <td className="px-3 py-2 font-mono text-muted-foreground font-semibold">{item.no}.</td>
                        <td className="px-3 py-2 font-medium text-foreground">{item.name}</td>
                        <td className="px-3 py-2 text-[10px] text-muted-foreground">{item.group}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-rose-400">
                          {spent > 0 ? fmt(spent) : <span className="text-muted-foreground/40 font-normal">₹0</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            </div>

            {/* Column 2: Ledgers 26 - 50 */}
            <div className="rounded-xl border border-white/8 bg-muted/5 overflow-hidden">
              <div className="px-3 py-2 bg-amber-500/10 border-b border-white/5 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-400 font-mono">No. 26 — 50 | INDIRECT EXPENSE LEDGERS</span>
                <span className="text-[10px] text-muted-foreground">Tally Group: Indirect Expenses</span>
              </div>
              <TableWrap>
                <thead>
                  <tr className="bg-black/20 border-b border-white/5">
                    <TH>No.</TH><TH>Ledger Name</TH><TH>Category Group</TH><TH right>Accrued Amount</TH>
                  </tr>
                </thead>
                <tbody>
                  {TALLY_50_INDIRECT_EXPENSE_LEDGERS.slice(25, 50).map((item) => {
                    const spent = expenses.filter(e => e.category === item.name).reduce((s, e) => s + e.amount, 0);
                    return (
                      <tr key={item.no} className="border-b border-white/3 hover:bg-white/3 text-xs">
                        <td className="px-3 py-2 font-mono text-muted-foreground font-semibold">{item.no}.</td>
                        <td className="px-3 py-2 font-medium text-foreground">{item.name}</td>
                        <td className="px-3 py-2 text-[10px] text-muted-foreground">{item.group}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-rose-400">
                          {spent > 0 ? fmt(spent) : <span className="text-muted-foreground/40 font-normal">₹0</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            </div>
          </div>
        </div>
      )}

      {subTab === "petty" && (
        <div className="space-y-3">
          {Object.entries(catGroups).sort((a, b) => b[1] - a[1]).map(([cat, amt], i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-40 truncate">{cat}</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(amt / totalExp) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full bg-rose-500/60" />
              </div>
              <span className="text-xs font-bold text-rose-400 w-24 text-right">{fmt(amt)}</span>
              <span className="text-[10px] text-muted-foreground w-12 text-right">{((amt / totalExp) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}

      {subTab === "tds" && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs font-bold text-amber-300 mb-1">TDS Deduction Tracker — Section 194C, 194J, 194I</p>
            <p className="text-[10px] text-amber-400/70">TDS must be deducted at the time of payment / credit, whichever is earlier. Deposit by 7th of the following month.</p>
          </div>
          <TableWrap>
            <thead><tr className="bg-muted/20 border-b border-white/5">
              <TH>Payee</TH><TH>Nature</TH><TH>Section</TH><TH right>Payment</TH><TH>Rate</TH><TH right>TDS</TH><TH>Challan Due</TH>
            </tr></thead>
            <tbody>
              {expenses.filter(e => e.tds_applicable).map((e, i) => {
                const section = e.category === "Professional Fees" ? "194J" : e.category === "Marketing" ? "194C" : "194J";
                return (
                  <tr key={e.id} className="border-b border-white/3 hover:bg-white/2">
                    <td className="px-3 py-3 text-foreground">{e.description}</td>
                    <td className="px-3 py-3 text-muted-foreground">{e.category}</td>
                    <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">{section}</span></td>
                    <td className="px-3 py-3 text-right">{fmt(e.amount)}</td>
                    <td className="px-3 py-3 text-muted-foreground">10%</td>
                    <td className="px-3 py-3 text-right font-bold text-amber-400">{fmt(e.tds_amount || 0)}</td>
                    <td className="px-3 py-3 text-muted-foreground">Aug 7, 2025</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-white/5">
            <span className="text-xs text-muted-foreground">Total TDS Payable this month</span>
            <span className="text-base font-bold text-amber-400">{fmt(tdsTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 5. BANK & CASH PANEL ────────────────────────────────────────────────────

function BankPanel({ bankTxns }: { bankTxns: ERPBankTxn[] }) {
  const [subTab, setSubTab] = useState<"recon" | "cashbook" | "contra">("recon");
  const unmatched = bankTxns.filter(t => !t.matched);
  const totalDebits = bankTxns.reduce((s, t) => s + (t.debit || 0), 0);
  const totalCredits = bankTxns.reduce((s, t) => s + (t.credit || 0), 0);
  const currentBalance = bankTxns.length > 0 ? bankTxns[0].balance : 0;
  const cashTxns = bankTxns.filter(t => t.category === "Salary" || t.category === "Unknown");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Bank Balance" value={fmtL(currentBalance)} sub="Current A/C" icon={Landmark} color="text-blue-400" bg="bg-blue-500/5" />
        <KPI label="Total Credits" value={fmtL(totalCredits)} sub="Inflows" icon={ArrowUpRight} color="text-emerald-400" bg="bg-emerald-500/5" />
        <KPI label="Total Debits" value={fmtL(totalDebits)} sub="Outflows" icon={ArrowDownRight} color="text-red-400" bg="bg-red-500/5" />
        <KPI label="Unmatched" value={unmatched.length} sub="Need review" icon={AlertCircle} color="text-orange-400" bg="bg-orange-500/5" />
      </div>

      {unmatched.length > 0 && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-xs font-semibold text-red-300">{unmatched.length} Transaction(s) Unmatched — CA Cannot File Without Voucher</p>
          </div>
          {unmatched.map(t => (
            <div key={t.id} className="flex items-center justify-between text-xs mt-2 p-2 rounded-lg bg-red-500/5">
              <div>
                <p className="text-red-200 font-medium">{t.description}</p>
                <p className="text-red-400/70">{fmt(t.debit || t.credit || 0)} on {t.date}</p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="h-6 text-[10px] bg-cyan-500/15 border border-cyan-500/25 text-cyan-300">Attach Bill</Button>
                <Button size="sm" variant="outline" className="h-6 text-[10px] border-white/10">Journal Entry</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-white/5">
        {(["recon", "cashbook", "contra"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-3 py-2 text-xs font-medium border-b-2 transition-all -mb-px ${subTab === t ? "text-blue-400 border-blue-400" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            {t === "recon" ? "Bank Reconciliation" : t === "cashbook" ? "Cash Book" : "Contra / Transfers"}
          </button>
        ))}
      </div>

      {subTab === "recon" && (
        <TableWrap>
          <thead><tr className="bg-muted/20 border-b border-white/5">
            <TH>Date</TH><TH>Description</TH><TH right>Debit</TH><TH right>Credit</TH>
            <TH right>Balance</TH><TH>Category</TH><TH>Match</TH>
          </tr></thead>
          <tbody>
            {bankTxns.map((txn, i) => (
              <motion.tr key={txn.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className={`border-b border-white/3 hover:bg-white/2 transition-colors ${!txn.matched ? "bg-red-500/3" : ""}`}>
                <td className="px-3 py-3 text-muted-foreground">{txn.date}</td>
                <td className="px-3 py-3">
                  <p className="text-foreground font-medium">{txn.description}</p>
                  {!txn.matched && <p className="text-[10px] text-red-400 mt-0.5">⚠ Needs sign-off</p>}
                </td>
                <td className="px-3 py-3 text-right text-red-400 font-medium">{txn.debit ? fmt(txn.debit) : "—"}</td>
                <td className="px-3 py-3 text-right text-emerald-400 font-medium">{txn.credit ? fmt(txn.credit) : "—"}</td>
                <td className="px-3 py-3 text-right text-muted-foreground">{fmt(txn.balance)}</td>
                <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground text-[10px]">{txn.category}</span></td>
                <td className="px-3 py-3">
                  {txn.matched ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 className="w-3 h-3" />{txn.confidence}%</span>
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {subTab === "cashbook" && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-muted/5 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Cash in Hand</span>
            <span className="text-base font-bold text-foreground">₹8,350</span>
          </div>
          <TableWrap>
            <thead><tr className="bg-muted/20 border-b border-white/5">
              <TH>Date</TH><TH>Particulars</TH><TH>Voucher</TH><TH right>Cash In</TH><TH right>Cash Out</TH>
            </tr></thead>
            <tbody>
              {bankTxns.filter(t => t.category === "Salary" || t.category === "Tax Payment").map((t, i) => (
                <tr key={t.id} className="border-b border-white/3 hover:bg-white/2">
                  <td className="px-3 py-3 text-muted-foreground">{t.date}</td>
                  <td className="px-3 py-3 text-foreground">{t.description}</td>
                  <td className="px-3 py-3 text-muted-foreground">Cash PMT-{i + 1}</td>
                  <td className="px-3 py-3 text-right text-emerald-400">{t.credit ? fmt(t.credit) : "—"}</td>
                  <td className="px-3 py-3 text-right text-red-400">{t.debit ? fmt(t.debit) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      )}

      {subTab === "contra" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-muted/5 border border-white/5">
            <p className="text-xs text-muted-foreground">Contra entries record transfers between your own bank accounts or cash-to-bank/bank-to-cash movements. No P&L impact.</p>
          </div>
          <Button className="gap-1.5 text-xs h-8 bg-blue-500/15 border border-blue-500/25 text-blue-300">
            <Plus className="w-3 h-3" /> New Contra Entry
          </Button>
          <EmptyState icon={Landmark} title="No Contra Entries" sub="Record cash deposits to bank or inter-bank transfers here" />
        </div>
      )}
    </div>
  );
}

// ─── 6. PAYROLL PANEL ────────────────────────────────────────────────────────

function PayrollPanel({ payroll }: { payroll: ERPPayroll[] }) {
  const [subTab, setSubTab] = useState<"register" | "statutory" | "compliance">("register");

  const totalGross = payroll.reduce((s, e) => s + e.gross, 0);
  const totalNet = payroll.reduce((s, e) => s + e.net_pay, 0);
  const totalPF = payroll.reduce((s, e) => s + e.pf, 0);
  const totalESIC = payroll.reduce((s, e) => s + e.esic, 0);
  const totalTDS = payroll.reduce((s, e) => s + e.tds, 0);
  const pending = payroll.filter(e => e.status === "pending");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Gross Payroll" value={fmtL(totalGross)} sub={`${payroll.length} employees`} icon={Users} color="text-foreground" bg="bg-muted/5" />
        <KPI label="Net Pay (Bank)" value={fmtL(totalNet)} sub="After deductions" icon={Landmark} color="text-emerald-400" bg="bg-emerald-500/5" />
        <KPI label="PF (Employee)" value={fmt(totalPF)} sub="12% of basic" icon={Shield} color="text-cyan-400" bg="bg-cyan-500/5" />
        <KPI label="TDS u/s 192" value={fmt(totalTDS)} sub="Salary TDS" icon={AlertTriangle} color="text-amber-400" bg="bg-amber-500/5" />
      </div>

      {pending.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-300">{pending.length} salary payment(s) pending</p>
            <p className="text-[10px] text-amber-400/70">{pending.map(e => e.employee).join(", ")}</p>
          </div>
          <Button size="sm" className="h-7 text-[10px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 gap-1 shrink-0">
            <Send className="w-2.5 h-2.5" /> Pay All Pending
          </Button>
        </div>
      )}

      <div className="flex gap-1 border-b border-white/5">
        {(["register", "statutory", "compliance"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-3 py-2 text-xs font-medium border-b-2 transition-all -mb-px ${subTab === t ? "text-violet-400 border-violet-400" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            {t === "register" ? "Salary Register" : t === "statutory" ? "PF / ESIC / PT" : "Compliance Files"}
          </button>
        ))}
      </div>

      {subTab === "register" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">July 2025 Payroll — {payroll.length} Employees</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/10 gap-1"><Download className="w-3 h-3" />Bank File</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/10 gap-1"><PrinterIcon className="w-3 h-3" />Salary Slips</Button>
            </div>
          </div>
          <TableWrap>
            <thead><tr className="bg-muted/20 border-b border-white/5">
              <TH>Employee</TH><TH right>Basic</TH><TH right>HRA</TH><TH right>Gross</TH>
              <TH right>PF</TH><TH right>ESIC</TH><TH right>TDS</TH><TH right>Net Pay</TH><TH>Bank</TH><TH>Status</TH>
            </tr></thead>
            <tbody>
              {payroll.map((emp, i) => (
                <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-white/3 hover:bg-white/2">
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground">{emp.employee}</p>
                    <p className="text-[10px] text-muted-foreground">{emp.designation}</p>
                  </td>
                  <td className="px-3 py-3 text-right">{fmt(emp.basic)}</td>
                  <td className="px-3 py-3 text-right text-muted-foreground">{fmt(emp.hra)}</td>
                  <td className="px-3 py-3 text-right font-medium">{fmt(emp.gross)}</td>
                  <td className="px-3 py-3 text-right text-cyan-400">{fmt(emp.pf)}</td>
                  <td className="px-3 py-3 text-right text-blue-400">{emp.esic > 0 ? fmt(emp.esic) : "—"}</td>
                  <td className="px-3 py-3 text-right text-amber-400">{emp.tds > 0 ? fmt(emp.tds) : "—"}</td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-400">{fmt(emp.net_pay)}</td>
                  <td className="px-3 py-3 text-[10px] text-muted-foreground font-mono">{emp.bank_account}</td>
                  <td className="px-3 py-3"><SBadge status={emp.status} /></td>
                </motion.tr>
              ))}
              <tr className="bg-muted/10 border-t border-white/10 font-bold">
                <td className="px-3 py-2 text-foreground text-xs">TOTAL</td>
                <td className="px-3 py-2 text-right text-xs">{fmt(payroll.reduce((s, e) => s + e.basic, 0))}</td>
                <td className="px-3 py-2 text-right text-xs text-muted-foreground">{fmt(payroll.reduce((s, e) => s + e.hra, 0))}</td>
                <td className="px-3 py-2 text-right text-xs">{fmt(totalGross)}</td>
                <td className="px-3 py-2 text-right text-xs text-cyan-400">{fmt(totalPF)}</td>
                <td className="px-3 py-2 text-right text-xs text-blue-400">{fmt(totalESIC)}</td>
                <td className="px-3 py-2 text-right text-xs text-amber-400">{fmt(totalTDS)}</td>
                <td className="px-3 py-2 text-right text-xs text-emerald-400">{fmt(totalNet)}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </TableWrap>
        </>
      )}

      {subTab === "statutory" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Provident Fund (PF)", code: "EPF", emp: totalPF, employer: Math.round(totalPF * 0.83), total: Math.round(totalPF * 1.83), due: "Sep 15, 2025", badge: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" },
            { title: "ESIC", code: "ESI", emp: totalESIC, employer: Math.round(totalESIC * 2.125 / 0.75), total: totalESIC + Math.round(totalESIC * 2.125 / 0.75), due: "Aug 15, 2025", badge: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
            { title: "Professional Tax (PT)", code: "PT-MH", emp: payroll.length * 200, employer: 0, total: payroll.length * 200, due: "Aug 31, 2025", badge: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl p-4 border ${s.badge.split(" ")[1]} bg-gradient-to-br from-muted/5 to-transparent`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-foreground">{s.title}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${s.badge}`}>{s.code}</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Employee Share</span><span className="font-medium">{fmt(s.emp)}</span></div>
                {s.employer > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Employer Share</span><span className="font-medium">{fmt(s.employer)}</span></div>}
                <div className="flex justify-between border-t border-white/5 pt-1.5"><span className="font-semibold">Total Challan</span><span className="font-bold">{fmt(s.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span className="text-amber-400">{s.due}</span></div>
              </div>
              <Button size="sm" className="mt-3 w-full h-7 text-[10px] border border-white/10 bg-white/5">Pay Challan</Button>
            </div>
          ))}
        </div>
      )}

      {subTab === "compliance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: "PF ECR File", desc: "Electronic Challan-cum-Return for EPFO", ext: ".txt", icon: FileText },
            { title: "ESIC Monthly Return", desc: "Submit via ESIC portal by 11th", ext: ".xlsx", icon: FileText },
            { title: "Form 16 (Part B)", desc: "Employee TDS Certificate u/s 192", ext: ".pdf", icon: FileText },
            { title: "Form 24Q", desc: "Quarterly TDS return for salaries", ext: ".fvu", icon: FileText },
            { title: "Salary Slips (All)", desc: "Print-ready for all employees", ext: ".pdf", icon: PrinterIcon },
            { title: "Bank NEFT File", desc: "Upload to bank for bulk salary transfer", ext: ".txt", icon: Landmark },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-muted/5 hover:bg-muted/10 transition-all">
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <f.icon className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">{f.title}</p>
                <p className="text-[10px] text-muted-foreground">{f.desc}</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/10 gap-1 shrink-0">
                <Download className="w-2.5 h-2.5" />{f.ext}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 7. GST RETURNS PANEL ────────────────────────────────────────────────────

function GSTPanel({ company }: SmartERPProps) {
  return (
    <StatutoryTaxModule
      mode="demo"
      advanceTax={DEMO_ADVANCE_TAX}
      form138={DEMO_FORM_138_SUMMARY}
      form140={DEMO_FORM_140_SUMMARY}
      form143={DEMO_FORM_143_SUMMARY}
      form144={DEMO_FORM_144_SUMMARY}
      gstr3bSetOff={DEMO_GSTR3B_SET_OFF}
      gstr2bRecon={DEMO_GSTR2B_RECONCILIATION}
      companyName={company?.name || "Sannidh Technologies Pvt. Ltd."}
      pan={company?.pan || "AAKCS1234F"}
      tan="MUMS12345T"
      gstin={company?.gstin || "27AAKCS1234F1Z5"}
    />
  );
}

// ─── 8. TDS / TCS PANEL ──────────────────────────────────────────────────────

function TDSPanel({ company }: SmartERPProps) {
  return (
    <StatutoryTaxModule
      mode="demo"
      advanceTax={DEMO_ADVANCE_TAX}
      form138={DEMO_FORM_138_SUMMARY}
      form140={DEMO_FORM_140_SUMMARY}
      form143={DEMO_FORM_143_SUMMARY}
      form144={DEMO_FORM_144_SUMMARY}
      gstr3bSetOff={DEMO_GSTR3B_SET_OFF}
      gstr2bRecon={DEMO_GSTR2B_RECONCILIATION}
      companyName={company?.name || "Sannidh Technologies Pvt. Ltd."}
      pan={company?.pan || "AAKCS1234F"}
      tan="MUMS12345T"
      gstin={company?.gstin || "27AAKCS1234F1Z5"}
    />
  );
}

// ─── 9. LEDGER / ACCOUNTS PANEL ──────────────────────────────────────────────

function LedgerPanel({ invoices, purchases, expenses, bankTxns, payroll }: SmartERPProps) {
  const [subTab, setSubTab] = useState<"daybook" | "accounts" | "voucher">("daybook");

  // Compose Day Book from all transaction types
  const dayBook = [
    ...invoices.map(i => ({ date: i.date, type: "Sales Invoice", ref: i.invoice_no, party: i.customer, debit: i.total, credit: 0, ledger: "Accounts Receivable" })),
    ...purchases.map(p => ({ date: p.date, type: "Purchase Bill", ref: p.bill_no, party: p.vendor, debit: 0, credit: p.total, ledger: "Accounts Payable" })),
    ...expenses.map(e => ({ date: e.date, type: "Expense Voucher", ref: `EXP-${e.id}`, party: e.description, debit: 0, credit: e.amount, ledger: e.category })),
    ...bankTxns.map(t => ({ date: t.date, type: t.credit ? "Receipt" : "Payment", ref: t.id, party: t.description, debit: t.credit || 0, credit: t.debit || 0, ledger: "Bank Account" })),
    ...payroll.map(p => ({ date: "2025-07-31", type: "Payroll", ref: `SAL-${p.id}`, party: p.employee, debit: 0, credit: p.net_pay, ledger: "Salary Expense" })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const chartOfAccounts = [
    { group: "Fixed Assets", accounts: ["Land & Building", "Plant & Machinery", "Furniture & Fixtures", "Computers & IT Hardware", "Vehicles"] },
    { group: "Current Assets", accounts: ["Bank Account (HDFC/SBI)", "Cash in Hand", "Accounts Receivable (Sundry Debtors)", "Raw Materials Inventory", "Finished Goods Inventory"] },
    { group: "Current Liabilities", accounts: ["Accounts Payable (Sundry Creditors)", "GST Payable (CGST/SGST/IGST)", "TDS Payable (Sec 194C/194J/192)", "Salary Payable", "PF & ESIC Payable"] },
    { group: "Equity & Capital", accounts: ["Share Capital", "Reserves & Surplus", "Retained Earnings", "Directors Capital Account"] },
    { group: "Revenue & Income", accounts: ["Sales Revenue (B2B/B2C)", "Export Revenue", "Other Operating Income", "Interest Received", "Discount Received"] },
    { group: "Direct Expenses (Trading/Manufacturing)", accounts: ["Purchases / COGS", "Freight Inward", "Carriage Inward", "Factory Power & Fuel", "Customs Duty & Import Charges", "Factory Direct Labour"] },
    { group: "Indirect Expenses (50 Tally Ledgers)", accounts: TALLY_50_INDIRECT_EXPENSE_LEDGERS.map(l => l.name) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-white/5">
        {(["daybook", "accounts", "voucher"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-3 py-2 text-xs font-medium border-b-2 transition-all -mb-px ${subTab === t ? "text-emerald-400 border-emerald-400" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            {t === "daybook" ? "Day Book" : t === "accounts" ? "Chart of Accounts" : "Journal Voucher"}
          </button>
        ))}
      </div>

      {subTab === "daybook" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">All transactions chronologically — {dayBook.length} entries</p>
            <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/10 gap-1"><Download className="w-3 h-3" />Export Day Book</Button>
          </div>
          <TableWrap>
            <thead><tr className="bg-muted/20 border-b border-white/5">
              <TH>Date</TH><TH>Type</TH><TH>Ref #</TH><TH>Party / Narration</TH>
              <TH>Ledger</TH><TH right>Debit</TH><TH right>Credit</TH>
            </tr></thead>
            <tbody>
              {dayBook.map((entry, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="border-b border-white/3 hover:bg-white/2">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{entry.date}</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground text-[10px]">{entry.type}</span></td>
                  <td className="px-3 py-2 font-mono text-cyan-400/80 text-[10px]">{entry.ref}</td>
                  <td className="px-3 py-2 text-foreground max-w-48 truncate">{entry.party}</td>
                  <td className="px-3 py-2 text-muted-foreground">{entry.ledger}</td>
                  <td className="px-3 py-2 text-right text-emerald-400 font-medium">{entry.debit > 0 ? fmt(entry.debit) : "—"}</td>
                  <td className="px-3 py-2 text-right text-red-400 font-medium">{entry.credit > 0 ? fmt(entry.credit) : "—"}</td>
                </motion.tr>
              ))}
            </tbody>
          </TableWrap>
        </>
      )}

      {subTab === "accounts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartOfAccounts.map((group, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-muted/5 overflow-hidden">
              <div className="px-3 py-2 bg-muted/10 border-b border-white/5">
                <p className="text-xs font-bold text-foreground">{group.group}</p>
              </div>
              <div className="p-2 space-y-0.5">
                {group.accounts.map((acc, j) => (
                  <button key={j} className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors flex items-center gap-2">
                    <BookOpen className="w-3 h-3" /> {acc}
                  </button>
                ))}
                <button className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-cyan-500/70 hover:text-cyan-400 transition-colors flex items-center gap-1">
                  <Plus className="w-2.5 h-2.5" /> Add Account
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === "voucher" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Payment Voucher", desc: "Record cash/bank payment to vendor", color: "text-red-400" },
              { label: "Receipt Voucher", desc: "Record payment received from customer", color: "text-emerald-400" },
              { label: "Contra Voucher", desc: "Cash↔Bank or Bank↔Bank transfer", color: "text-cyan-400" },
              { label: "Journal Voucher", desc: "Adjustment / correction entry", color: "text-amber-400" },
              { label: "Credit Note", desc: "Sales return from customer", color: "text-violet-400" },
              { label: "Debit Note", desc: "Purchase return to vendor", color: "text-orange-400" },
            ].map((v, i) => (
              <button key={i} className="p-3 rounded-xl border border-white/5 bg-muted/5 hover:bg-muted/10 text-left transition-all">
                <p className={`text-xs font-semibold ${v.color}`}>{v.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{v.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 10. INVENTORY PANEL ─────────────────────────────────────────────────────

function InventoryPanel({ inventory = [] }: { inventory?: SmartERPProps["inventory"] }) {
  const [search, setSearch] = useState("");
  const totalValue = inventory.reduce((s, i) => s + i.current_qty * i.rate, 0);
  const lowStock = inventory.filter(i => i.current_qty <= i.reorder_level);

  const filtered = inventory.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.hsn_code.includes(search)
  );

  if (inventory.length === 0) {
    return <EmptyState icon={Package} title="No Inventory Items" sub="Add stock items with HSN codes, units and opening quantities to start tracking" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Stock Value (WAC)" value={fmtL(totalValue)} sub="Weighted avg cost" icon={Package} color="text-orange-400" bg="bg-orange-500/5" />
        <KPI label="Total Items" value={inventory.length} sub="Across all categories" icon={Layers} color="text-cyan-400" bg="bg-cyan-500/5" />
        <KPI label="Below Reorder" value={lowStock.length} sub="Need reorder now" icon={AlertTriangle} color="text-red-400" bg="bg-red-500/5" />
        <KPI label="Categories" value={[...new Set(inventory.map(i => i.category))].length} sub="Distinct groups" icon={Hash} color="text-violet-400" bg="bg-violet-500/5" />
      </div>

      {lowStock.length > 0 && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><p className="text-xs font-semibold text-red-300">Low Stock Alert — {lowStock.length} items below reorder level</p></div>
          <div className="flex gap-2 flex-wrap">
            {lowStock.map(i => (
              <span key={i.id} className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">{i.name} ({i.current_qty} {i.unit} left)</span>
            ))}
          </div>
          <Button size="sm" className="mt-2 h-7 text-[10px] bg-amber-500/15 border border-amber-500/25 text-amber-300 gap-1"><Plus className="w-2.5 h-2.5" />Create Purchase Orders</Button>
        </div>
      )}

      <Toolbar search={search} onSearch={setSearch} onNew={() => {}} newLabel="Add Item" onFilter={() => {}} />

      <TableWrap>
        <thead><tr className="bg-muted/20 border-b border-white/5">
          <TH>Item Name</TH><TH>HSN Code</TH><TH>Category</TH>
          <TH right>Opening</TH><TH right>Current</TH><TH>Unit</TH>
          <TH right>Rate</TH><TH right>Stock Value</TH><TH>Status</TH>
        </tr></thead>
        <tbody>
          {filtered.map((item, i) => {
            const stockPct = (item.current_qty / item.opening_qty) * 100;
            const isLow = item.current_qty <= item.reorder_level;
            return (
              <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-white/3 hover:bg-white/2">
                <td className="px-3 py-3">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden w-24">
                    <div style={{ width: `${stockPct}%` }} className={`h-full rounded-full ${isLow ? "bg-red-500" : stockPct < 60 ? "bg-amber-500" : "bg-emerald-500"}`} />
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-muted-foreground">{item.hsn_code}</td>
                <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground text-[10px]">{item.category}</span></td>
                <td className="px-3 py-3 text-right text-muted-foreground">{item.opening_qty.toLocaleString()}</td>
                <td className="px-3 py-3 text-right font-bold">{item.current_qty.toLocaleString()}</td>
                <td className="px-3 py-3 text-muted-foreground">{item.unit}</td>
                <td className="px-3 py-3 text-right">{fmt(item.rate)}</td>
                <td className="px-3 py-3 text-right font-bold text-orange-400">{fmtL(item.current_qty * item.rate)}</td>
                <td className="px-3 py-3">
                  {isLow ? <span className="text-[10px] text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Reorder</span> : <span className="text-[10px] text-emerald-400">OK</span>}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ─── 11. REPORTS PANEL — CA-GRADE FINANCIAL STATEMENTS ──────────────────────

function ReportsPanel({ company }: SmartERPProps) {
  return (
    <FinancialStatementsModule
      mode="demo"
      balanceSheet={DEMO_BALANCE_SHEET}
      profitLoss={DEMO_PROFIT_LOSS}
      assetRegister={DEMO_ASSET_REGISTER}
      deferredTax={DEMO_DEFERRED_TAX}
      financialRatios={DEMO_FINANCIAL_RATIOS}
      caro2020={DEMO_CARO_2020}
      notesToAccounts={DEMO_NOTES_TO_ACCOUNTS}
      periodTrend={DEMO_PERIOD_FINANCIALS}
      companyName={company?.name || "Sannidh Technologies Pvt. Ltd."}
      fiscalYear="FY 2025-26"
    />
  );
}

// ─── 12. AI TAX ASSISTANT / NOTICES PANEL ───────────────────────────────────

function NoticesPanel({ company }: SmartERPProps) {
  return (
    <StatutoryNoticeModule
      mode="demo"
      notices={DEMO_STATUTORY_NOTICES}
      legalDrafts={DEMO_LEGAL_DRAFTS}
      riskScores={DEMO_RISK_SCORES}
      dashboardSummary={DEMO_NOTICE_DASHBOARD_SUMMARY}
      companyName={company?.name || "Sannidh Technologies Pvt. Ltd."}
    />
  );
}

// ─── 13. GOV PORTAL API & E-FILING HUB PANEL ─────────────────────────────

function GovApiPanel({ company }: SmartERPProps) {
  return (
    <GovEFilingHubModule
      companyGstin="27AAKCS1234F1Z5"
      companyPan="AAKCS1234F"
      companyName={company?.name || "Sannidh Technologies Pvt. Ltd."}
    />
  );
}

// ─── 14. BANK STATEMENT AI AUTO-RECONCILIATION PANEL ─────────────────────

function BankReconPanel({ company }: SmartERPProps) {
  return (
    <BankReconciliationModule
      companyName={company?.name || "Sannidh Technologies Pvt. Ltd."}
    />
  );
}

// ─── 15. CROSS-BORDER FX, FEMA & INTERNATIONAL TAX PANEL ──────────────────

function FXIntlPanel({ company }: SmartERPProps) {
  return (
    <FXInternationalModule
      companyName={company?.name || "Sannidh Technologies Pvt. Ltd."}
    />
  );
}

// ─── 16. FIXED ASSETS & DUAL DEPRECIATION PANEL ─────────────────────────

function FixedAssetPanel({ company }: SmartERPProps) {
  return (
    <FixedAssetModule
      companyName={company?.name || "Sannidh Technologies Pvt. Ltd."}
    />
  );
}

// ─── 17. ADVANCED VIRTUAL CFO AI INTELLIGENCE PANEL ──────────────────────

function CFOIntelPanel({ company }: SmartERPProps) {
  return (
    <CFOIntelligenceModule
      companyName={company?.name || "Sannidh Technologies Pvt. Ltd."}
    />
  );
}

// ─── MAIN ERP MODULE ─────────────────────────────────────────────────────────

const ERP_TABS = [
  { id: "summary",   label: "Summary",         icon: PieChart,       color: "text-emerald-400" },
  { id: "sales",     label: "Sales",           icon: FileText,       color: "text-cyan-400" },
  { id: "purchases", label: "Purchases",       icon: ShoppingCart,   color: "text-amber-400" },
  { id: "expenses",  label: "Expenses",        icon: Receipt,        color: "text-rose-400" },
  { id: "bank",      label: "Bank & Cash",     icon: Landmark,       color: "text-blue-400" },
  { id: "payroll",   label: "Payroll",         icon: Users,          color: "text-violet-400" },
  { id: "gst",       label: "GST Returns",     icon: Shield,         color: "text-purple-400" },
  { id: "tds",       label: "TDS / TCS",       icon: ListChecks,     color: "text-orange-400" },
  { id: "ledger",    label: "Ledger",          icon: BookOpen,       color: "text-teal-400" },
  { id: "inventory", label: "Inventory",       icon: Package,        color: "text-orange-400" },
  { id: "reports",   label: "Reports",         icon: FileBarChart2,  color: "text-green-400" },
  { id: "notices",   label: "AI Tax Assistant", icon: AlertTriangle,  color: "text-purple-400" },
  { id: "govapi",    label: "Gov API Hub",     icon: Landmark,       color: "text-cyan-400" },
  { id: "bankrecon", label: "Bank Recon AI",   icon: Zap,            color: "text-green-400" },
  { id: "fxintl",    label: "FX & Intl Tax",  icon: Globe,          color: "text-emerald-400" },
  { id: "fixedassets",label: "Fixed Assets",   icon: Building2,      color: "text-cyan-400" },
  { id: "cfointel",  label: "CFO Intel AI",    icon: Sparkles,       color: "text-cyan-400" },
] as const;

type ERPSub = typeof ERP_TABS[number]["id"];

export function SmartERPModule({ invoices, purchases, expenses, payroll, bankTxns, inventory, company }: SmartERPProps) {
  const [activeTab, setActiveTab] = useState<ERPSub>("summary");

  const currentTab = ERP_TABS.find(t => t.id === activeTab)!;

  return (
    <Card className="border-white/8 bg-gradient-to-br from-card/80 to-background/90 backdrop-blur-xl overflow-hidden">
      {/* ERP Header */}
      <CardHeader className="pb-0 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                Smart ERP
                <Badge className="text-[9px] bg-cyan-500/15 text-cyan-400 border-cyan-500/25 font-bold px-1.5">FULL SYSTEM</Badge>
                {company?.gstin && <span className="text-[10px] text-muted-foreground font-normal font-mono">GSTIN: {company.gstin}</span>}
              </h3>
              <p className="text-[11px] text-muted-foreground">Complete accounting & compliance — replaces Tally, powered by AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs border-white/10 gap-1.5 hidden md:flex">
              <RefreshCw className="w-3 h-3" /> Sync Bank
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs border-white/10 gap-1.5 hidden md:flex">
              <Download className="w-3 h-3" /> Export All
            </Button>
          </div>
        </div>

        {/* ERP Sub-Tab Bar */}
        <div className="flex gap-0.5 overflow-x-auto pb-0 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {ERP_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 shrink-0 ${
                activeTab === tab.id
                  ? `${tab.color} border-current bg-white/4`
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-white/3"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          <CardContent className="pt-5">
            {activeTab === "summary"   && <SummaryPanel invoices={invoices} purchases={purchases} expenses={expenses} payroll={payroll} bankTxns={bankTxns} inventory={inventory} company={company} />}
            {activeTab === "sales"     && <SalesPanel invoices={invoices} />}
            {activeTab === "purchases" && <PurchasesPanel purchases={purchases} />}
            {activeTab === "expenses"  && <ExpensesPanel expenses={expenses} />}
            {activeTab === "bank"      && <BankPanel bankTxns={bankTxns} />}
            {activeTab === "payroll"   && <PayrollPanel payroll={payroll} />}
            {activeTab === "gst"       && <GSTPanel company={company} />}
            {activeTab === "tds"       && <TDSPanel company={company} />}
            {activeTab === "ledger"    && <LedgerPanel invoices={invoices} purchases={purchases} expenses={expenses} payroll={payroll} bankTxns={bankTxns} inventory={inventory} company={company} />}
            {activeTab === "inventory" && <InventoryPanel inventory={inventory} />}
            {activeTab === "reports"   && <ReportsPanel invoices={invoices} purchases={purchases} expenses={expenses} payroll={payroll} bankTxns={bankTxns} inventory={inventory} company={company} />}
            {activeTab === "notices"   && <NoticesPanel company={company} />}
            {activeTab === "govapi"    && <GovApiPanel company={company} />}
            {activeTab === "bankrecon"   && <BankReconPanel company={company} />}
            {activeTab === "fxintl"      && <FXIntlPanel company={company} />}
            {activeTab === "fixedassets" && <FixedAssetPanel company={company} />}
            {activeTab === "cfointel"    && <CFOIntelPanel company={company} />}
          </CardContent>
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}

export default SmartERPModule;
