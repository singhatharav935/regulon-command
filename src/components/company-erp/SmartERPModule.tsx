/**
 * SMART BUSINESS ERP MODULE
 * ========================
 * Full-featured ERP system inside the Company Dashboard.
 * Replaces Tally for MSMEs — AI-powered, cloud-first.
 * Covers: Sales Invoices, Purchase Bills, Expenses, Payroll,
 *         Bank Reconciliation, Inventory, and GST Ledger.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  FileText, ShoppingCart, Receipt, Users, Package,
  Landmark, Plus, Upload, Search, Filter, ChevronDown,
  ChevronUp, ArrowUpRight, ArrowDownRight, CheckCircle2,
  AlertCircle, Clock, Camera, Zap, BarChart3, TrendingUp,
  TrendingDown, IndianRupee, Calendar, Building2, Hash,
  Download, Eye, Edit2, Trash2, Send, RefreshCw, Star,
  Shield, Sparkles, FileCheck, AlertTriangle, X, Check,
  CreditCard, Wallet, PiggyBank, Briefcase
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Invoice {
  id: string;
  invoice_no: string;
  date: string;
  customer: string;
  gstin: string;
  items: number;
  amount: number;
  gst: number;
  total: number;
  status: "paid" | "pending" | "overdue" | "draft";
  due_date: string;
  days_overdue?: number;
}

interface PurchaseBill {
  id: string;
  bill_no: string;
  date: string;
  vendor: string;
  gstin: string;
  amount: number;
  gst: number;
  total: number;
  itc_eligible: boolean;
  itc_claimed: boolean;
  status: "processed" | "pending_review" | "rejected";
  ai_confidence: number;
  category: string;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paid_by: "cash" | "bank" | "card";
  receipt_uploaded: boolean;
  tds_applicable: boolean;
  tds_amount?: number;
}

interface PayrollEntry {
  id: string;
  employee: string;
  designation: string;
  basic: number;
  hra: number;
  allowances: number;
  gross: number;
  pf: number;
  esic: number;
  tds: number;
  net_pay: number;
  status: "paid" | "pending";
  bank_account: string;
}

interface BankTxn {
  id: string;
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
  matched: boolean;
  category: string;
  confidence: number;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_INVOICES: Invoice[] = [
  { id: "1", invoice_no: "INV-2025-0847", date: "2025-07-18", customer: "Reliance Retail Ltd", gstin: "27AAACR5055K1ZS", items: 12, amount: 245000, gst: 44100, total: 289100, status: "paid", due_date: "2025-08-17" },
  { id: "2", invoice_no: "INV-2025-0848", date: "2025-07-20", customer: "Tata Consumer Products", gstin: "27AAACT2727Q1ZG", items: 8, amount: 182000, gst: 32760, total: 214760, status: "pending", due_date: "2025-08-19" },
  { id: "3", invoice_no: "INV-2025-0849", date: "2025-07-01", customer: "D-Mart Pvt Ltd", gstin: "27AAACM5456P1ZS", items: 24, amount: 390000, gst: 70200, total: 460200, status: "overdue", due_date: "2025-07-31", days_overdue: 22 },
  { id: "4", invoice_no: "INV-2025-0850", date: "2025-07-22", customer: "Metro Cash & Carry", gstin: "27AABCM2596N1ZK", items: 5, amount: 87500, gst: 15750, total: 103250, status: "draft", due_date: "2025-08-21" },
  { id: "5", invoice_no: "INV-2025-0851", date: "2025-07-23", customer: "Flipkart Internet Pvt Ltd", gstin: "29AABCF8078M2Z8", items: 31, amount: 520000, gst: 93600, total: 613600, status: "pending", due_date: "2025-08-22" },
];

const MOCK_PURCHASES: PurchaseBill[] = [
  { id: "1", bill_no: "PB-2025-1201", date: "2025-07-19", vendor: "Shreeji Raw Materials", gstin: "27AABCS8765M1ZP", amount: 145000, gst: 26100, total: 171100, itc_eligible: true, itc_claimed: true, status: "processed", ai_confidence: 98, category: "Raw Materials" },
  { id: "2", bill_no: "PB-2025-1202", date: "2025-07-20", vendor: "Tech Solutions India", gstin: "29AACTS2345K1Z1", amount: 35000, gst: 6300, total: 41300, itc_eligible: true, itc_claimed: false, status: "pending_review", ai_confidence: 91, category: "IT Services" },
  { id: "3", bill_no: "PB-2025-1203", date: "2025-07-21", vendor: "Prime Logistics", gstin: "27AABCP9012L1ZQ", amount: 18500, gst: 3330, total: 21830, itc_eligible: true, itc_claimed: true, status: "processed", ai_confidence: 99, category: "Freight" },
  { id: "4", bill_no: "HAND-2025-0041", date: "2025-07-22", vendor: "Ramesh Hardware (Cash)", gstin: "UNREGISTERED", amount: 4200, gst: 0, total: 4200, itc_eligible: false, itc_claimed: false, status: "pending_review", ai_confidence: 74, category: "Office Supplies" },
  { id: "5", bill_no: "PB-2025-1204", date: "2025-07-22", vendor: "HDFC Bank — Loan EMI", gstin: "N/A", amount: 85000, gst: 0, total: 85000, itc_eligible: false, itc_claimed: false, status: "processed", ai_confidence: 100, category: "Loan Repayment" },
];

const MOCK_EXPENSES: Expense[] = [
  { id: "1", date: "2025-07-23", description: "Office canteen supplies", category: "Office Expenses", amount: 3200, paid_by: "cash", receipt_uploaded: true, tds_applicable: false },
  { id: "2", date: "2025-07-22", description: "Electricity Bill — Factory", category: "Utilities", amount: 24500, paid_by: "bank", receipt_uploaded: true, tds_applicable: false },
  { id: "3", date: "2025-07-21", description: "Digital Marketing — Agency Fee", category: "Marketing", amount: 45000, paid_by: "bank", receipt_uploaded: true, tds_applicable: true, tds_amount: 4500 },
  { id: "4", date: "2025-07-20", description: "Travel — Sales team client visit", category: "Travel", amount: 8700, paid_by: "card", receipt_uploaded: false, tds_applicable: false },
  { id: "5", date: "2025-07-19", description: "Lawyer fees — Contract Review", category: "Professional Fees", amount: 15000, paid_by: "bank", receipt_uploaded: true, tds_applicable: true, tds_amount: 1500 },
];

const MOCK_PAYROLL: PayrollEntry[] = [
  { id: "1", employee: "Priya Mehta", designation: "Sr. Sales Manager", basic: 45000, hra: 18000, allowances: 7000, gross: 70000, pf: 5400, esic: 0, tds: 4200, net_pay: 60400, status: "paid", bank_account: "HDFC ****8421" },
  { id: "2", employee: "Rahul Sharma", designation: "Accountant", basic: 28000, hra: 11200, allowances: 3800, gross: 43000, pf: 3360, esic: 645, tds: 0, net_pay: 38995, status: "paid", bank_account: "SBI ****2104" },
  { id: "3", employee: "Ananya Patel", designation: "Operations Head", basic: 55000, hra: 22000, allowances: 8000, gross: 85000, pf: 6600, esic: 0, tds: 7800, net_pay: 70600, status: "pending", bank_account: "ICICI ****5537" },
  { id: "4", employee: "Kiran Desai", designation: "Factory Supervisor", basic: 22000, hra: 8800, allowances: 2200, gross: 33000, pf: 2640, esic: 495, tds: 0, net_pay: 29865, status: "paid", bank_account: "BOI ****9923" },
];

const MOCK_BANK_TXNS: BankTxn[] = [
  { id: "1", date: "2025-07-23", description: "NEFT/289100/RELIANCE RETAIL", credit: 289100, balance: 1842300, matched: true, category: "Invoice Receipt", confidence: 99 },
  { id: "2", date: "2025-07-22", description: "UPI/TRANSFER/RAMESH K/Q293", debit: 50000, balance: 1553200, matched: false, category: "Unknown", confidence: 0 },
  { id: "3", date: "2025-07-22", description: "IMPS/SHREEJI RAW MAT/1234", debit: 171100, balance: 1603200, matched: true, category: "Vendor Payment", confidence: 97 },
  { id: "4", date: "2025-07-21", description: "AUTO-DEBIT/HDFC LOAN EMI", debit: 85000, balance: 1774300, matched: true, category: "Loan EMI", confidence: 100 },
  { id: "5", date: "2025-07-20", description: "NEFT/SALARY/PRIYA MEHTA", debit: 60400, balance: 1859300, matched: true, category: "Salary", confidence: 100 },
  { id: "6", date: "2025-07-20", description: "GST PORTAL/TAX PMT/24Q", debit: 124500, balance: 1919700, matched: true, category: "Tax Payment", confidence: 100 },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    paid: { label: "Paid", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
    pending: { label: "Pending", class: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
    overdue: { label: "Overdue", class: "bg-red-500/15 text-red-400 border-red-500/25" },
    draft: { label: "Draft", class: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
    processed: { label: "Processed", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
    pending_review: { label: "AI Review", class: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" },
    rejected: { label: "Rejected", class: "bg-red-500/15 text-red-400 border-red-500/25" },
  };
  const s = map[status] || { label: status, class: "bg-muted/30 text-muted-foreground" };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.class}`}>{s.label}</span>;
}

function AIConfidencePill({ score }: { score: number }) {
  const color = score >= 95 ? "text-emerald-400" : score >= 80 ? "text-amber-400" : "text-red-400";
  const bg = score >= 95 ? "bg-emerald-500/10" : score >= 80 ? "bg-amber-500/10" : "bg-red-500/10";
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${bg} ${color}`}>
      <Sparkles className="w-2.5 h-2.5" /> {score}% AI
    </span>
  );
}

// ─── Sales Invoices Panel ───────────────────────────────────────────────────

function SalesInvoicePanel() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);

  const filtered = MOCK_INVOICES.filter(inv =>
    inv.customer.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoice_no.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceivable = MOCK_INVOICES.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const overdue = MOCK_INVOICES.filter(i => i.status === "overdue");

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Receivable", value: `₹${(totalReceivable / 100000).toFixed(1)}L`, icon: IndianRupee, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Overdue Invoices", value: overdue.length, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "This Month Revenue", value: "₹16.8L", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "GST Collected", value: "₹2.56L", icon: Shield, color: "text-violet-400", bg: "bg-violet-500/10" },
        ].map((kpi, i) => (
          <div key={i} className={`rounded-xl p-3 border border-white/5 ${kpi.bg} flex items-center gap-3`}>
            <div className={`p-2 rounded-lg bg-white/5`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div>
              <p className={`text-base font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices, customers..." className="pl-8 h-9 text-xs bg-muted/20 border-white/10" />
        </div>
        <Button size="sm" variant="outline" className="h-9 text-xs border-white/10 gap-1.5">
          <Filter className="w-3 h-3" /> Filter
        </Button>
        <Button size="sm" onClick={() => setShowNew(true)} className="h-9 text-xs gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30">
          <Plus className="w-3 h-3" /> New Invoice
        </Button>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-red-300">Payment Overdue — ₹{(overdue.reduce((s, i) => s + i.total, 0) / 100000).toFixed(1)}L outstanding</p>
            <p className="text-[10px] text-red-400/70">D-Mart Pvt Ltd invoice overdue by 22 days. Sannidh will auto-send a payment reminder via WhatsApp.</p>
          </div>
          <Button size="sm" className="h-7 text-[10px] bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 shrink-0">Send Reminder</Button>
        </div>
      )}

      {/* Invoice Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/20 border-b border-white/5">
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Invoice #</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Customer</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium hidden md:table-cell">Date</th>
                <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Amount</th>
                <th className="text-right px-3 py-2.5 text-muted-foreground font-medium hidden md:table-cell">GST</th>
                <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Total</th>
                <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">Status</th>
                <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-white/3 hover:bg-white/2 transition-colors"
                >
                  <td className="px-3 py-3">
                    <span className="font-mono text-cyan-400 font-medium">{inv.invoice_no}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div>
                      <p className="font-medium text-foreground">{inv.customer}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{inv.gstin}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell text-muted-foreground">{inv.date}</td>
                  <td className="px-3 py-3 text-right font-medium">₹{inv.amount.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right hidden md:table-cell text-muted-foreground">₹{inv.gst.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-bold text-foreground">₹{inv.total.toLocaleString()}</td>
                  <td className="px-3 py-3 text-center">
                    <StatusBadge status={inv.status} />
                    {inv.days_overdue && <p className="text-[9px] text-red-400 mt-0.5">{inv.days_overdue}d overdue</p>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-3 h-3" /></button>
                      <button className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-3 h-3" /></button>
                      <button className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"><Download className="w-3 h-3" /></button>
                      <button className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-cyan-400 transition-colors"><Send className="w-3 h-3" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Purchase Bills Panel ───────────────────────────────────────────────────

function PurchaseBillPanel() {
  const [uploading, setUploading] = useState(false);

  const totalITC = MOCK_PURCHASES.filter(p => p.itc_eligible && p.itc_claimed).reduce((s, p) => s + p.gst, 0);
  const pendingITC = MOCK_PURCHASES.filter(p => p.itc_eligible && !p.itc_claimed).reduce((s, p) => s + p.gst, 0);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      toast({ title: "Bill Processed by AI ✅", description: "Vendor: Tech Solutions India — ₹41,300 extracted with 91% confidence. Awaiting your review.", });
    }, 2500);
  };

  return (
    <div className="space-y-4">
      {/* ITC Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[10px] text-emerald-400/70 mb-1">ITC Claimed This Month</p>
          <p className="text-lg font-bold text-emerald-400">₹{(totalITC / 1000).toFixed(1)}K</p>
          <p className="text-[10px] text-emerald-400/60">Saved from tax outflow</p>
        </div>
        <div className="rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
          <p className="text-[10px] text-amber-400/70 mb-1">Pending ITC Claim</p>
          <p className="text-lg font-bold text-amber-400">₹{(pendingITC / 1000).toFixed(1)}K</p>
          <p className="text-[10px] text-amber-400/60">Awaiting CA approval</p>
        </div>
        <div className="rounded-xl p-3 border border-cyan-500/20 bg-cyan-500/5">
          <p className="text-[10px] text-cyan-400/70 mb-1">Bills Processed by AI</p>
          <p className="text-lg font-bold text-cyan-400">{MOCK_PURCHASES.length} / {MOCK_PURCHASES.length}</p>
          <p className="text-[10px] text-cyan-400/60">Avg 96% confidence</p>
        </div>
      </div>

      {/* AI Upload Zone */}
      <div
        onClick={handleUpload}
        className="rounded-xl border-2 border-dashed border-cyan-500/25 bg-cyan-500/3 hover:bg-cyan-500/8 hover:border-cyan-500/40 transition-all cursor-pointer p-5 text-center group"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-cyan-400 font-medium">Sannidh AI is reading your bill...</p>
            <p className="text-[10px] text-muted-foreground">Extracting vendor, GSTIN, items & amounts</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 justify-center">
              <Camera className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <Upload className="w-5 h-5 text-cyan-400/60" />
            </div>
            <p className="text-xs font-semibold text-cyan-300">Click photo of bill or Upload PDF</p>
            <p className="text-[10px] text-muted-foreground">AI will auto-extract all data in seconds • Supports handwritten, GST & cash memos</p>
          </div>
        )}
      </div>

      {/* Bills Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/20 border-b border-white/5">
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Bill #</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Vendor</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium hidden md:table-cell">Category</th>
                <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Total</th>
                <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">ITC</th>
                <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">AI Score</th>
                <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PURCHASES.map((bill, i) => (
                <motion.tr key={bill.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="border-b border-white/3 hover:bg-white/2 transition-colors">
                  <td className="px-3 py-3 font-mono text-amber-400">{bill.bill_no}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground">{bill.vendor}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{bill.gstin}</p>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground text-[10px]">{bill.category}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-bold">₹{bill.total.toLocaleString()}</td>
                  <td className="px-3 py-3 text-center">
                    {bill.itc_eligible ? (
                      bill.itc_claimed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <Clock className="w-3.5 h-3.5 text-amber-400 mx-auto" />
                    ) : <X className="w-3.5 h-3.5 text-red-400/50 mx-auto" />}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {bill.ai_confidence > 0 ? <AIConfidencePill score={bill.ai_confidence} /> : <span className="text-[10px] text-muted-foreground">Manual</span>}
                  </td>
                  <td className="px-3 py-3 text-center"><StatusBadge status={bill.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses Panel ──────────────────────────────────────────────────────────

function ExpensesPanel() {
  const totalExpenses = MOCK_EXPENSES.reduce((s, e) => s + e.amount, 0);
  const tdsTotal = MOCK_EXPENSES.filter(e => e.tds_applicable).reduce((s, e) => s + (e.tds_amount || 0), 0);
  const missingReceipts = MOCK_EXPENSES.filter(e => !e.receipt_uploaded).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 border border-rose-500/20 bg-rose-500/5">
          <p className="text-[10px] text-rose-400/70 mb-1">Total Expenses (July)</p>
          <p className="text-lg font-bold text-rose-400">₹{(totalExpenses / 1000).toFixed(1)}K</p>
        </div>
        <div className="rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
          <p className="text-[10px] text-amber-400/70 mb-1">TDS to Deduct</p>
          <p className="text-lg font-bold text-amber-400">₹{tdsTotal.toLocaleString()}</p>
          <p className="text-[10px] text-amber-400/60">Due by 7th Aug</p>
        </div>
        <div className="rounded-xl p-3 border border-red-500/20 bg-red-500/5">
          <p className="text-[10px] text-red-400/70 mb-1">Missing Receipts</p>
          <p className="text-lg font-bold text-red-400">{missingReceipts}</p>
          <p className="text-[10px] text-red-400/60">Upload to avoid disallowance</p>
        </div>
      </div>

      {/* TDS Alert */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-300">TDS Deduction Required — 2 Professional Payments</p>
          <p className="text-[10px] text-amber-400/70 mt-0.5">Digital Marketing fee (₹45K) and Lawyer fee (₹15K) require TDS @ 10%. Total TDS: ₹6,000. Deduct before making payment to avoid penalty u/s 201.</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/20 border-b border-white/5">
              <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Date</th>
              <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Description</th>
              <th className="text-left px-3 py-2.5 text-muted-foreground font-medium hidden md:table-cell">Category</th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Amount</th>
              <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">Paid By</th>
              <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">Receipt</th>
              <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">TDS</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_EXPENSES.map((exp, i) => (
              <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="border-b border-white/3 hover:bg-white/2 transition-colors">
                <td className="px-3 py-3 text-muted-foreground">{exp.date}</td>
                <td className="px-3 py-3 font-medium text-foreground">{exp.description}</td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground text-[10px]">{exp.category}</span>
                </td>
                <td className="px-3 py-3 text-right font-bold text-rose-400">₹{exp.amount.toLocaleString()}</td>
                <td className="px-3 py-3 text-center">
                  <span className="flex items-center justify-center gap-1">
                    {exp.paid_by === "cash" ? <Wallet className="w-3 h-3 text-amber-400" /> : exp.paid_by === "bank" ? <Landmark className="w-3 h-3 text-cyan-400" /> : <CreditCard className="w-3 h-3 text-violet-400" />}
                    <span className="text-[10px] capitalize text-muted-foreground">{exp.paid_by}</span>
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  {exp.receipt_uploaded ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : (
                    <button className="flex items-center gap-1 mx-auto text-[10px] text-red-400 hover:text-red-300">
                      <Upload className="w-3 h-3" /> Upload
                    </button>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {exp.tds_applicable ? <span className="text-[10px] text-amber-400 font-medium">₹{exp.tds_amount?.toLocaleString()}</span> : <span className="text-[10px] text-muted-foreground">—</span>}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payroll Panel ──────────────────────────────────────────────────────────

function PayrollPanel() {
  const totalGross = MOCK_PAYROLL.reduce((s, e) => s + e.gross, 0);
  const totalNetPay = MOCK_PAYROLL.reduce((s, e) => s + e.net_pay, 0);
  const totalPF = MOCK_PAYROLL.reduce((s, e) => s + e.pf, 0);
  const totalTDS = MOCK_PAYROLL.reduce((s, e) => s + e.tds, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Gross Payroll", value: `₹${(totalGross / 1000).toFixed(0)}K`, color: "text-foreground" },
          { label: "Net Pay (Bank)", value: `₹${(totalNetPay / 1000).toFixed(0)}K`, color: "text-emerald-400" },
          { label: "PF Contribution", value: `₹${(totalPF / 1000).toFixed(1)}K`, color: "text-cyan-400" },
          { label: "TDS Payable", value: `₹${(totalTDS / 1000).toFixed(1)}K`, color: "text-amber-400" },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-3 border border-white/5 bg-muted/10 text-center">
            <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">July 2025 Payroll — {MOCK_PAYROLL.length} Employees</p>
        <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25">
          <Send className="w-3 h-3" /> Process All Payments
        </Button>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/20 border-b border-white/5">
              <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Employee</th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium hidden md:table-cell">Gross</th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium hidden md:table-cell">PF</th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium hidden md:table-cell">TDS</th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Net Pay</th>
              <th className="text-left px-3 py-2.5 text-muted-foreground font-medium hidden md:table-cell">Bank</th>
              <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PAYROLL.map((emp, i) => (
              <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                className="border-b border-white/3 hover:bg-white/2">
                <td className="px-3 py-3">
                  <p className="font-medium text-foreground">{emp.employee}</p>
                  <p className="text-[10px] text-muted-foreground">{emp.designation}</p>
                </td>
                <td className="px-3 py-3 text-right hidden md:table-cell">₹{emp.gross.toLocaleString()}</td>
                <td className="px-3 py-3 text-right hidden md:table-cell text-cyan-400">₹{emp.pf.toLocaleString()}</td>
                <td className="px-3 py-3 text-right hidden md:table-cell text-amber-400">{emp.tds > 0 ? `₹${emp.tds.toLocaleString()}` : "—"}</td>
                <td className="px-3 py-3 text-right font-bold text-emerald-400">₹{emp.net_pay.toLocaleString()}</td>
                <td className="px-3 py-3 hidden md:table-cell text-[10px] text-muted-foreground font-mono">{emp.bank_account}</td>
                <td className="px-3 py-3 text-center"><StatusBadge status={emp.status} /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Bank Reconciliation Panel ──────────────────────────────────────────────

function BankReconPanel() {
  const unmatched = MOCK_BANK_TXNS.filter(t => !t.matched);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 border border-cyan-500/20 bg-cyan-500/5 text-center">
          <p className="text-lg font-bold text-cyan-400">₹18.42L</p>
          <p className="text-[10px] text-muted-foreground">Current Bank Balance</p>
          <p className="text-[10px] text-cyan-400/60">HDFC Current A/C ****4421</p>
        </div>
        <div className="rounded-xl p-3 border border-emerald-500/20 bg-emerald-500/5 text-center">
          <p className="text-lg font-bold text-emerald-400">{MOCK_BANK_TXNS.filter(t => t.matched).length}/{MOCK_BANK_TXNS.length}</p>
          <p className="text-[10px] text-muted-foreground">AI Auto-Matched</p>
        </div>
        <div className="rounded-xl p-3 border border-red-500/20 bg-red-500/5 text-center">
          <p className="text-lg font-bold text-red-400">{unmatched.length}</p>
          <p className="text-[10px] text-muted-foreground">Need Your Review</p>
        </div>
      </div>

      {unmatched.length > 0 && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-xs font-semibold text-red-300">1 Unmatched Transaction — Action Required</p>
          </div>
          <p className="text-[10px] text-red-400/70 mb-3">₹50,000 transferred to "Ramesh K" via UPI has no matching bill or voucher. Your CA cannot file this without a valid document.</p>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-[10px] bg-cyan-500/15 border border-cyan-500/25 text-cyan-300">Upload Bill</Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/10">Mark as Salary Advance</Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/10">Mark as Loan</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/20 border-b border-white/5">
              <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Date</th>
              <th className="text-left px-3 py-2.5 text-muted-foreground font-medium">Description</th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Debit</th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium">Credit</th>
              <th className="text-right px-3 py-2.5 text-muted-foreground font-medium hidden md:table-cell">Balance</th>
              <th className="text-center px-3 py-2.5 text-muted-foreground font-medium">Matched</th>
              <th className="text-left px-3 py-2.5 text-muted-foreground font-medium hidden md:table-cell">Category</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_BANK_TXNS.map((txn, i) => (
              <motion.tr key={txn.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className={`border-b border-white/3 hover:bg-white/2 ${!txn.matched ? 'bg-red-500/3' : ''}`}>
                <td className="px-3 py-3 text-muted-foreground">{txn.date}</td>
                <td className="px-3 py-3">
                  <p className="font-medium text-foreground text-[11px]">{txn.description}</p>
                  {!txn.matched && <p className="text-[10px] text-red-400 mt-0.5">⚠ Sign-off required</p>}
                </td>
                <td className="px-3 py-3 text-right text-red-400 font-medium">{txn.debit ? `₹${txn.debit.toLocaleString()}` : "—"}</td>
                <td className="px-3 py-3 text-right text-emerald-400 font-medium">{txn.credit ? `₹${txn.credit.toLocaleString()}` : "—"}</td>
                <td className="px-3 py-3 text-right hidden md:table-cell text-muted-foreground">₹{txn.balance.toLocaleString()}</td>
                <td className="px-3 py-3 text-center">
                  {txn.matched
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                    : <AlertCircle className="w-3.5 h-3.5 text-red-400 mx-auto animate-pulse" />}
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground text-[10px]">{txn.category}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main ERP Component ─────────────────────────────────────────────────────

const ERP_TABS = [
  { id: "sales", label: "Sales & Invoices", icon: FileText, color: "text-cyan-400" },
  { id: "purchase", label: "Purchase Bills", icon: ShoppingCart, color: "text-amber-400" },
  { id: "expenses", label: "Expenses", icon: Receipt, color: "text-rose-400" },
  { id: "payroll", label: "Payroll & TDS", icon: Users, color: "text-violet-400" },
  { id: "bank", label: "Bank Reconciliation", icon: Landmark, color: "text-emerald-400" },
] as const;

type ERPTab = typeof ERP_TABS[number]["id"];

export function SmartERPModule() {
  const [activeTab, setActiveTab] = useState<ERPTab>("sales");
  const [collapsed, setCollapsed] = useState(false);

  const currentTab = ERP_TABS.find(t => t.id === activeTab)!;

  return (
    <Card className="border-white/8 bg-gradient-to-br from-card/60 to-background/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-0 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/15 border border-cyan-500/20">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Smart Business ERP
                <Badge className="text-[9px] bg-cyan-500/15 text-cyan-400 border-cyan-500/25 font-bold px-1.5 py-0">AI-POWERED</Badge>
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Complete accounting system — replaces Tally. Just click photos of bills.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs border-white/10 gap-1.5">
              <RefreshCw className="w-3 h-3" /> Sync Bank
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs border-white/10 gap-1.5">
              <Download className="w-3 h-3" /> Export
            </Button>
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        {!collapsed && (
          <div className="flex gap-1 mt-4 overflow-x-auto pb-0 scrollbar-hide">
            {ERP_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
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
              {activeTab === "sales" && <SalesInvoicePanel />}
              {activeTab === "purchase" && <PurchaseBillPanel />}
              {activeTab === "expenses" && <ExpensesPanel />}
              {activeTab === "payroll" && <PayrollPanel />}
              {activeTab === "bank" && <BankReconPanel />}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default SmartERPModule;
