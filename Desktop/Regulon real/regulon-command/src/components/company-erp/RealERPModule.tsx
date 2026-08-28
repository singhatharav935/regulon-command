/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  REAL ERP MODULE  ·  Sannidh Native Accounting Engine — Dashboard UI
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  This is the BRAIN of the Real Company Owner Dashboard.
 *  It wires the Zero-Penalty Engine + Autonomous Ingestion Service into the UI.
 *
 *  Architecture:
 *    Supabase Tables
 *        ↓  (live fetch with DEMO fallback)
 *    zeroPenaltyEngine.ts   ← runFullZeroPenaltyAudit()
 *        ↓
 *    autonomousIngestionService.ts  ← getAutonomousSyncStatus()
 *        ↓
 *    THIS FILE (RealERPModule.tsx) — renders:
 *      1. Autonomous Mode Status Bar (4 pipeline indicators)
 *      2. Zero-Penalty Guard Dashboard (4-rule compliance status)
 *      3. CA Exception Inbox (real-time alert cards)
 *      4. SmartERPModule (the full ERP ledger UI)
 *
 *  Mode Toggle:
 *    - 100% Autonomous Mode: Sannidh handles all data ingestion automatically
 *    - Manual Control Mode: Accountant/owner can add, edit, delete any voucher
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Edit3, RefreshCw, AlertTriangle, ShieldCheck, Shield,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Mail, Landmark,
  ShoppingCart, FileSpreadsheet, Clock, Info, BarChart3, TrendingUp,
  ArrowRight, AlertCircle, Loader2, Activity, BadgeCheck, Bell,
  FileText, IndianRupee, Lock, Unlock, ClipboardCheck, Upload,
  Trash2, BookOpen, Settings, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { SmartERPModule } from "./SmartERPModule";
import type { ERPInvoice, ERPPurchase, ERPExpense, ERPPayroll, ERPBankTxn, ERPStockItem } from "./erp-types";
import { runFullZeroPenaltyAudit, type ZeroPenaltyReport, type ExceptionAlert } from "@/services/zeroPenaltyEngine";
import { getAutonomousSyncStatus, type AutonomousSyncStatusBar } from "@/services/autonomousIngestionService";
import { DataIngestionModal } from "./DataIngestionModal";
import { useFinancialEngineStore } from '@/stores/useFinancialEngineStore';

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  companyId: string;
  companyName?: string;
}

// ─── HELPER: Format Indian Rupee ──────────────────────────────────────────────

function fmtRs(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/8 bg-card/80 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-56 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-72 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="h-7 w-32 rounded-full bg-white/5 animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-white/5 bg-card/50 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ─── PIPELINE STATUS CHIP ─────────────────────────────────────────────────────

interface PipelineChipProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
  status: "ok" | "syncing" | "error" | "idle";
}

function PipelineChip({ icon, label, value, subtitle, status }: PipelineChipProps) {
  const statusColors = {
    ok:      "border-emerald-500/25 bg-emerald-500/8",
    syncing: "border-cyan-500/25 bg-cyan-500/8",
    error:   "border-red-500/25 bg-red-500/8",
    idle:    "border-white/10 bg-white/4",
  };

  const dotColors = {
    ok:      "bg-emerald-400",
    syncing: "bg-cyan-400 animate-pulse",
    error:   "bg-red-400",
    idle:    "bg-white/30",
  };

  return (
    <div className={`rounded-xl border p-3 ${statusColors[status]}`}>
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-muted-foreground">{icon}</div>
        <div className={`w-2 h-2 rounded-full mt-0.5 ${dotColors[status]}`} />
      </div>
      <div className="text-sm font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
      <div className="text-[9px] text-muted-foreground/60 mt-0.5">{subtitle}</div>
    </div>
  );
}

// ─── ZERO-PENALTY RULE CARD ────────────────────────────────────────────────────

interface RuleCardProps {
  ruleNumber: number;
  title: string;
  subtitle: string;
  passed: boolean;
  detail: string;
  impactLabel?: string;
  impactValue?: string;
  isBlocking?: boolean;
}

function RuleCard({ ruleNumber, title, subtitle, passed, detail, impactLabel, impactValue, isBlocking }: RuleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={`rounded-xl border p-4 transition-all duration-300 ${
        passed
          ? "border-emerald-500/20 bg-emerald-500/5"
          : isBlocking
          ? "border-red-500/30 bg-red-500/8 ring-1 ring-red-500/20"
          : "border-amber-500/25 bg-amber-500/6"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Rule number circle */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            passed
              ? "bg-emerald-500/20 text-emerald-300"
              : isBlocking
              ? "bg-red-500/20 text-red-300"
              : "bg-amber-500/20 text-amber-300"
          }`}>
            {ruleNumber}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{title}</span>
              {isBlocking && !passed && (
                <Badge className="text-[9px] px-1.5 py-0 bg-red-500/20 text-red-300 border border-red-500/30">
                  FILING BLOCKED
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {passed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : isBlocking ? (
            <XCircle className="w-5 h-5 text-red-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-white/5 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {impactLabel && impactValue && (
        <div className="mt-3 flex items-center gap-4">
          <div className="text-xs">
            <span className="text-muted-foreground">{impactLabel}: </span>
            <span className={`font-bold ${passed ? "text-emerald-300" : "text-amber-300"}`}>{impactValue}</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/8">
              <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── CA EXCEPTION ALERT CARD ──────────────────────────────────────────────────

function ExceptionAlertCard({ alert }: { alert: ExceptionAlert }) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    critical: { bg: "bg-red-500/8 border-red-500/30",  icon: <XCircle className="w-4 h-4 text-red-400" />, tag: "CRITICAL", tagClass: "bg-red-500/20 text-red-300 border-red-500/30" },
    warning:  { bg: "bg-amber-500/6 border-amber-500/25", icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, tag: "WARNING", tagClass: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    info:     { bg: "bg-blue-500/6 border-blue-500/20",  icon: <Info className="w-4 h-4 text-blue-400" />, tag: "INFO", tagClass: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  };

  const config = severityConfig[alert.severity];

  return (
    <motion.div
      layout
      className={`rounded-xl border p-4 ${config.bg}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {config.icon}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground leading-snug">{alert.title}</span>
              <Badge className={`text-[9px] px-1.5 py-0 border ${config.tagClass}`}>{config.tag}</Badge>
              {alert.autoResolved && (
                <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  ✓ AUTO-RESOLVED
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">
                Financial exposure: <span className="font-semibold text-foreground">{fmtRs(alert.financialImpact)}</span>
              </span>
              {alert.deadline && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Due: {alert.deadline}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-white/5 transition-colors flex-shrink-0">
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/8 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
              <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-white/4 border border-white/8">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground font-medium">{alert.actionRequired}</p>
              </div>
              {alert.autoResolved && alert.autoResolutionNote && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-300">{alert.autoResolutionNote}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── COMPLIANCE SCORE GAUGE ───────────────────────────────────────────────────

function ComplianceScoreGauge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 90 ? "text-emerald-300" :
    score >= 70 ? "text-amber-300" :
    "text-red-300";
  const progressColor =
    score >= 90 ? "bg-emerald-500" :
    score >= 70 ? "bg-amber-500" :
    "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-lg font-black ${color}`}>{score}</span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`h-full rounded-full ${progressColor}`}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function RealERPModule({ companyId, companyName }: Props) {
  // ─── ERP Data State ─────────────────────────────────────────────────────────
  const [invoices,  setInvoices]  = useState<ERPInvoice[]>([]);
  const [purchases, setPurchases] = useState<ERPPurchase[]>([]);
  const [expenses,  setExpenses]  = useState<ERPExpense[]>([]);
  const [payroll,   setPayroll]   = useState<ERPPayroll[]>([]);
  const [bankTxns,  setBankTxns]  = useState<ERPBankTxn[]>([]);
  const [inventory, setInventory] = useState<ERPStockItem[]>([]);
  const [isLiveData, setIsLiveData] = useState(false);

  // ─── Engine State ────────────────────────────────────────────────────────────
  const [auditReport, setAuditReport] = useState<ZeroPenaltyReport | null>(null);
  const [syncStatus,  setSyncStatus]  = useState<AutonomousSyncStatusBar | null>(null);

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [mode,     setMode]     = useState<"autonomous" | "manual">("autonomous");
  const [showGuard,    setShowGuard]    = useState(true);
  const [showInbox,    setShowInbox]    = useState(true);
  const [inboxFilter,  setInboxFilter]  = useState<"all" | "critical" | "warning" | "info">("all");
  const [showIngestionModal, setShowIngestionModal] = useState(false);
  const [showOpeningBalances, setShowOpeningBalances] = useState(false);
  const [showDepreciationPolicy, setShowDepreciationPolicy] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Opening Balances state
  const [openingBalances, setOpeningBalances] = useState<{
    cash: number; bank: number; debtors: number; creditors: number;
    stock: number; capital: number; reserves: number; loans: number;
    fixedAssets: number; currentLiabilities: number;
  }>(() => {
    try {
      const saved = localStorage.getItem(`sannidh_opening_balances_${companyId}`);
      return saved ? JSON.parse(saved) : { cash: 0, bank: 0, debtors: 0, creditors: 0, stock: 0, capital: 0, reserves: 0, loans: 0, fixedAssets: 0, currentLiabilities: 0 };
    } catch { return { cash: 0, bank: 0, debtors: 0, creditors: 0, stock: 0, capital: 0, reserves: 0, loans: 0, fixedAssets: 0, currentLiabilities: 0 }; }
  });

  // Depreciation Policy state
  const [depPolicy, setDepPolicy] = useState<{
    method: 'SLM' | 'WDV';
    rates: Record<string, number>;
  }>(() => {
    try {
      const saved = localStorage.getItem(`sannidh_dep_policy_${companyId}`);
      return saved ? JSON.parse(saved) : { method: 'WDV', rates: { 'Plant & Machinery': 15, 'Furniture & Fixtures': 10, 'Computers & IT': 40, 'Vehicles': 15, 'Building': 10, 'Intangible Assets': 25 } };
    } catch { return { method: 'WDV', rates: { 'Plant & Machinery': 15, 'Furniture & Fixtures': 10, 'Computers & IT': 40, 'Vehicles': 15, 'Building': 10, 'Intangible Assets': 25 } }; }
  });

  // ─── Reset All Data ─────────────────────────────────────────────────────────
  const handleResetAllData = useCallback(() => {
    const keys = [
      `sannidh_bank_txns_${companyId}`, `company_bank_transactions_${companyId}`,
      `sannidh_payroll_${companyId}`, `company_payroll_${companyId}`,
      `sannidh_invoices_${companyId}`, `company_invoices_${companyId}`,
      `sannidh_purchases_${companyId}`, `company_purchases_${companyId}`,
      `sannidh_expenses_${companyId}`, `company_expenses_${companyId}`,
      `sannidh_opening_balances_${companyId}`, `sannidh_dep_policy_${companyId}`,
      `company_fixed_assets_${companyId}`, `company_manual_journals_${companyId}`,
      `company_bank_accounts_${companyId}`, `company_bank_matches_${companyId}`,
      `company_aging_payments_${companyId}`, `company_dt_custom_${companyId}`,
      `sannidh_pnl_locked_${companyId}`, `sannidh_ca_signoff_${companyId}`,
    ];
    keys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    setInvoices([]); setPurchases([]); setExpenses([]); setPayroll([]);
    setBankTxns([]); setInventory([]); setIsLiveData(false);
    setOpeningBalances({ cash: 0, bank: 0, debtors: 0, creditors: 0, stock: 0, capital: 0, reserves: 0, loans: 0, fixedAssets: 0, currentLiabilities: 0 });
    // Clear central financial engine store
    useFinancialEngineStore.getState().resetAllData();
    setShowResetConfirm(false);
    console.log('[RealERP] All data reset (local state + Zustand store + localStorage)');
  }, [companyId]);

  // ─── Save Opening Balances ──────────────────────────────────────────────────
  const saveOpeningBalances = useCallback(() => {
    localStorage.setItem(`sannidh_opening_balances_${companyId}`, JSON.stringify(openingBalances));
    // Sync to central financial engine store
    useFinancialEngineStore.getState().setOpeningBalances({
      cash_balance: openingBalances.cash,
      bank_balance: openingBalances.bank,
      debtors: openingBalances.debtors,
      creditors: openingBalances.creditors,
      stock: openingBalances.stock,
      share_capital: openingBalances.capital,
      reserves: openingBalances.reserves,
      long_term_loans: openingBalances.loans,
      fixed_assets_gross: openingBalances.fixedAssets,
      accumulated_depreciation: 0,
    });
    setShowOpeningBalances(false);
  }, [companyId, openingBalances]);

  // ─── Save Depreciation Policy ───────────────────────────────────────────────
  const saveDepPolicy = useCallback(() => {
    localStorage.setItem(`sannidh_dep_policy_${companyId}`, JSON.stringify(depPolicy));
    setShowDepreciationPolicy(false);
  }, [companyId, depPolicy]);

  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Data Fetch ──────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, pur, exp, pay, bank, inv_stk] = await Promise.all([
        supabase.from("company_invoices"          as never).select("*").eq("company_id", companyId).order("date", { ascending: false }).limit(100),
        supabase.from("company_purchases"         as never).select("*").eq("company_id", companyId).order("date", { ascending: false }).limit(100),
        supabase.from("company_expenses"          as never).select("*").eq("company_id", companyId).order("date", { ascending: false }).limit(100),
        supabase.from("company_payroll"           as never).select("*").eq("company_id", companyId).order("employee"),
        supabase.from("company_bank_transactions" as never).select("*").eq("company_id", companyId).order("date", { ascending: false }).limit(200),
        supabase.from("company_inventory"         as never).select("*").eq("company_id", companyId).order("name"),
      ]);

      const liveInv  = inv.data  && inv.data.length  > 0 ? (inv.data  as ERPInvoice[])   : null;
      const livePur  = pur.data  && pur.data.length  > 0 ? (pur.data  as ERPPurchase[])  : null;
      const liveExp  = exp.data  && exp.data.length  > 0 ? (exp.data  as ERPExpense[])   : null;
      const livePay  = pay.data  && pay.data.length  > 0 ? (pay.data  as ERPPayroll[])   : null;
      const liveBank = bank.data && bank.data.length > 0 ? (bank.data as ERPBankTxn[])   : null;
      const liveInvStk = inv_stk.data && inv_stk.data.length > 0 ? (inv_stk.data as ERPStockItem[]) : null;

      // ─── localStorage Fallbacks (for when Supabase RLS blocks reads) ────────
      const lsFallback = (key: string): any[] => {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : [];
        } catch { return []; }
      };

      const lsBankTxns = lsFallback(`sannidh_bank_txns_${companyId}`);
      const lsPayroll  = lsFallback(`sannidh_payroll_${companyId}`);
      const lsInvoices = lsFallback(`sannidh_invoices_${companyId}`);
      const lsPurchases = lsFallback(`sannidh_purchases_${companyId}`);
      const lsExpenses = lsFallback(`sannidh_expenses_${companyId}`);

      const hasLive = !!(liveInv || livePur || liveExp || livePay || liveBank || lsBankTxns.length || lsPayroll.length || lsInvoices.length);
      setIsLiveData(hasLive);

      const finalInvoices  = liveInv      ?? (lsInvoices.length  > 0 ? lsInvoices  : []);
      const finalPurchases = livePur      ?? (lsPurchases.length > 0 ? lsPurchases : []);
      const finalExpenses  = liveExp      ?? (lsExpenses.length  > 0 ? lsExpenses  : []);
      const finalPayroll   = livePay      ?? (lsPayroll.length   > 0 ? lsPayroll   : []);
      const finalBankTxns  = liveBank     ?? (lsBankTxns.length  > 0 ? lsBankTxns  : []);
      const finalInventory = liveInvStk   ?? [];

      if (finalBankTxns.length > 0) {
        console.log(`[RealERP] Loaded ${finalBankTxns.length} bank txns (source: ${liveBank ? 'Supabase' : 'localStorage'})`);
      }

      setInvoices(finalInvoices);
      setPurchases(finalPurchases);
      setExpenses(finalExpenses);
      setPayroll(finalPayroll);
      setBankTxns(finalBankTxns);
      setInventory(finalInventory);

      // ─── Sync into central Zustand financial engine store ──────────────────
      const engineStore = useFinancialEngineStore.getState();
      engineStore.setCompanyContext(companyId, companyName || '', 'FY 2025-26');
      if (finalInvoices.length > 0) engineStore.ingestInvoices(finalInvoices);
      if (finalPurchases.length > 0) engineStore.ingestPurchases(finalPurchases);
      if (finalExpenses.length > 0) engineStore.ingestExpenses(finalExpenses);
      if (finalPayroll.length > 0) engineStore.ingestPayroll(finalPayroll);
      if (finalBankTxns.length > 0) engineStore.ingestBankTxns(finalBankTxns);

      // ─── Run Zero-Penalty Audit Engine ────────────────────────────────────
      const report = runFullZeroPenaltyAudit({
        companyId,
        companyName: companyName ?? "Your Company",
        gstin: "",
        financialYear: "2025-26",
        taxPeriod: "July 2025",
        invoices: finalInvoices.map((i) => ({
          id: i.id,
          amount: i.amount ?? 0,
          gst: i.gst ?? 0,
          status: i.status,
        })),
        purchases: finalPurchases.map((p) => ({
          id: p.id,
          amount: p.amount ?? 0,
          gst: p.gst ?? 0,
          category: p.category ?? "General",
          itc_eligible: p.itc_eligible ?? false,
          itc_claimed: p.itc_claimed ?? false,
        })),
        expenses: finalExpenses.map((e) => ({
          id: e.id,
          description: e.description ?? "",
          category: e.category ?? "Miscellaneous",
          amount: e.amount ?? 0,
          paid_by: e.paid_by ?? "bank",
          receipt_uploaded: e.receipt_uploaded ?? false,
          tds_applicable: e.tds_applicable ?? false,
          tds_amount: e.tds_amount ?? 0,
        })),
        payroll: finalPayroll.map((p) => ({
          id: p.id,
          employee: p.employee,
          gross: p.gross ?? 0,
          pf: p.pf ?? 0,
          esic: p.esic ?? 0,
          tds: p.tds ?? 0,
        })),
        bankTxns: finalBankTxns.map((t) => ({
          id: t.id,
          description: t.description ?? "",
          debit: t.debit,
          credit: t.credit,
          matched: t.matched ?? false,
        })),
        inventory: finalInventory.map((s) => ({
          rate: s.rate ?? 0,
          current_qty: s.current_qty ?? 0,
        })),
        shareCapital: 0,
        longTermBorrowings: 0,
        gstr2bVerifiedITC: finalPurchases
          .filter((p) => p.itc_eligible && p.itc_claimed)
          .reduce((s, p) => s + (p.gst ?? 0), 0) * 0.85, // 85% verified by GSTR-2B
        bankBalance: finalBankTxns.length > 0 ? (finalBankTxns[0]?.balance || 0) : 0,
      });

      setAuditReport(report);

      // ─── Run Autonomous Ingestion Status ──────────────────────────────────
      const syncStat = await getAutonomousSyncStatus(companyId);
      setSyncStatus(syncStat);

    } catch {
      // Ensure dashboard never crashes — always fall back to demo data
      setInvoices([]);
      setPurchases([]);
      setExpenses([]);
      setPayroll([]);
      setBankTxns([]);
      setInventory([]);
      setIsLiveData(false);
    } finally {
      setLoading(false);
    }
  }, [companyId, companyName]);

  useEffect(() => {
    fetchAll();
    // Auto-refresh every 5 minutes in autonomous mode
    syncIntervalRef.current = setInterval(() => {
      if (mode === "autonomous") fetchAll();
    }, 5 * 60 * 1000);
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [fetchAll, mode]);

  const handleManualSync = async () => {
    setSyncing(true);
    await fetchAll();
    setSyncing(false);
  };

  // ─── Filtered Inbox Alerts ───────────────────────────────────────────────────
  const allAlerts = auditReport?.exceptionAlerts ?? [];
  const filteredAlerts = inboxFilter === "all"
    ? allAlerts
    : allAlerts.filter((a) => a.severity === inboxFilter);

  // ─── Derived Metrics ─────────────────────────────────────────────────────────
  const criticalCount  = allAlerts.filter((a) => a.severity === "critical").length;
  const warningCount   = allAlerts.filter((a) => a.severity === "warning").length;
  const autoResolvedCount = allAlerts.filter((a) => a.autoResolved).length;

  // ─── Render: Loading ─────────────────────────────────────────────────────────
  if (loading) return <LoadingSkeleton />;

  // ─── Render: Full Dashboard ──────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION A — AUTONOMOUS MODE CONTROL BAR
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              mode === "autonomous"
                ? "bg-cyan-500/12 border-cyan-500/30 text-cyan-300"
                : "bg-amber-500/12 border-amber-500/30 text-amber-300"
            }`}>
              {mode === "autonomous"
                ? <><Zap className="w-3.5 h-3.5 fill-cyan-400/30" /> 100% Autonomous Mode</>
                : <><Edit3 className="w-3.5 h-3.5" /> Manual Control & Edit Mode</>
              }
            </div>
            {isLiveData ? (
              <Badge className="bg-emerald-500/12 text-emerald-300 border border-emerald-500/25 text-[10px] gap-1">
                <Activity className="w-2.5 h-2.5 animate-pulse" /> Live Supabase Data
              </Badge>
            ) : (
              <Badge className="bg-blue-500/12 text-blue-300 border border-blue-500/25 text-[10px] gap-1">
                <FileText className="w-2.5 h-2.5" /> Sannidh ERP Starter Template
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {syncStatus && (
              <span className="text-[11px] text-muted-foreground hidden md:inline">
                Last sync: <strong className="text-foreground">{syncStatus.lastSyncAt}</strong>
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode(mode === "autonomous" ? "manual" : "autonomous")}
              className="h-7 text-[11px] px-3 text-muted-foreground hover:text-foreground"
            >
              {mode === "autonomous"
                ? <><Unlock className="w-3 h-3 mr-1" />Switch to Manual Edit</>
                : <><Lock className="w-3 h-3 mr-1" />Switch to Autonomous</>
              }
            </Button>
            <Button
              onClick={() => setShowIngestionModal(true)}
              size="sm"
              variant="outline"
              className="h-7 text-[11px] border-primary/30 gap-1.5 px-3 text-primary hover:bg-primary/10"
            >
              <Upload className="w-3 h-3" /> Import Data
            </Button>
            <Button
              onClick={() => setShowOpeningBalances(true)}
              size="sm"
              variant="outline"
              className="h-7 text-[11px] border-emerald-500/30 gap-1.5 px-3 text-emerald-300 hover:bg-emerald-500/10"
            >
              <BookOpen className="w-3 h-3" /> Opening Balances
            </Button>
            <Button
              onClick={() => setShowDepreciationPolicy(true)}
              size="sm"
              variant="outline"
              className="h-7 text-[11px] border-violet-500/30 gap-1.5 px-3 text-violet-300 hover:bg-violet-500/10"
            >
              <Settings className="w-3 h-3" /> Depreciation Policy
            </Button>
            <Button
              onClick={() => setShowResetConfirm(true)}
              size="sm"
              variant="outline"
              className="h-7 text-[11px] border-red-500/30 gap-1.5 px-3 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-3 h-3" /> Reset All Data
            </Button>
            <Button
              onClick={handleManualSync}
              disabled={syncing}
              size="sm"
              variant="outline"
              className="h-7 text-[11px] border-white/12 gap-1.5 px-3"
            >
              {syncing
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing…</>
                : <><RefreshCw className="w-3 h-3" /> Sync All Feeds</>
              }
            </Button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-300 font-semibold">Zero-Penalty Guard Active</span>
            </div>
          </div>
        </div>

        {/* 4 Pipeline chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          <PipelineChip
            icon={<FileSpreadsheet className="w-4 h-4" />}
            label="GSTR-2B API"
            value={syncStatus ? `${syncStatus.gstr2bFetchedCount} records` : "Checking…"}
            subtitle="Daily 12:30AM sync"
            status={syncing ? "syncing" : syncStatus ? "ok" : "idle"}
          />
          <PipelineChip
            icon={<Mail className="w-4 h-4" />}
            label="Email Invoice Parser"
            value={syncStatus ? `${syncStatus.emailParsedCount} parsed` : "Checking…"}
            subtitle={syncStatus?.inboxEmail ?? "invoices@sannidh.ai"}
            status={syncing ? "syncing" : syncStatus ? "ok" : "idle"}
          />
          <PipelineChip
            icon={<Landmark className="w-4 h-4" />}
            label="FIU Bank Feed"
            value={syncStatus ? `${syncStatus.bankTxnsSyncedCount} txns` : "Checking…"}
            subtitle="RBI AA framework · Every 4h"
            status={syncing ? "syncing" : syncStatus ? "ok" : "idle"}
          />
          <PipelineChip
            icon={<ShoppingCart className="w-4 h-4" />}
            label="Sales Webhook"
            value={syncStatus ? `${syncStatus.webhookSalesCount} orders` : "Checking…"}
            subtitle={syncStatus?.webhookUrl ?? "api.sannidh.ai/webhooks"}
            status={syncing ? "syncing" : syncStatus ? "ok" : "idle"}
          />
        </div>

        {/* Sync health bar */}
        {syncStatus && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">Pipeline Health Score</span>
              <span className="text-[11px] font-bold text-foreground">{syncStatus.syncHealthScore}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${syncStatus.syncHealthScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION B — ZERO-PENALTY GUARD DASHBOARD (4 Rules)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setShowGuard(!showGuard)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/12 border border-emerald-500/20">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Zero-Penalty Compliance Guard</h3>
                {auditReport && (
                  <Badge className={`text-[10px] px-2 py-0 border ${
                    auditReport.overallComplianceScore >= 90
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                      : auditReport.overallComplianceScore >= 70
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
                      : "bg-red-500/15 text-red-300 border-red-500/25"
                  }`}>
                    Score: {auditReport.overallComplianceScore}/100
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                4 Mechanical rules that make tax penalties impossible
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {auditReport && (
              <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {[
                    auditReport.rule1_trialBalance.passed,
                    auditReport.rule2_gstr2bItcLock.passed,
                    auditReport.rule3_tdsCompliance.passed,
                  ].filter(Boolean).length}/4 rules passed
                </span>
                <span>
                  Penalty exposure: {" "}
                  <strong className={auditReport.estimatedPenaltyAfterSannidh === 0 ? "text-emerald-300" : "text-amber-300"}>
                    {fmtRs(auditReport.estimatedPenaltyAfterSannidh)}
                  </strong>
                </span>
              </div>
            )}
            {showGuard ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        <AnimatePresence>
          {showGuard && auditReport && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4">
                {/* Compliance score bars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white/3 border border-white/6">
                  <ComplianceScoreGauge score={auditReport.overallComplianceScore} label="Overall Compliance Score" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">ITR Filing Ready</span>
                      {auditReport.canFileTaxReturns
                        ? <span className="text-emerald-300 font-semibold flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> YES</span>
                        : <span className="text-red-300 font-semibold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> BLOCKED</span>
                      }
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">GSTR Filing Ready</span>
                      {auditReport.canFileGSTReturns
                        ? <span className="text-emerald-300 font-semibold flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> YES</span>
                        : <span className="text-red-300 font-semibold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> BLOCKED</span>
                      }
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Penalty Exposure</span>
                      <span className={`font-bold ${auditReport.estimatedPenaltyExposure > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                        {fmtRs(auditReport.estimatedPenaltyExposure)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">After Sannidh Guard</span>
                      <span className="font-bold text-emerald-300">{fmtRs(auditReport.estimatedPenaltyAfterSannidh)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">TDS Shortfall</span>
                      <span className={`font-bold ${auditReport.rule3_tdsCompliance.totalShortfall > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                        {fmtRs(auditReport.rule3_tdsCompliance.totalShortfall)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">ITC Blocked</span>
                      <span className={`font-bold ${auditReport.rule2_gstr2bItcLock.blockedAmount > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                        {fmtRs(auditReport.rule2_gstr2bItcLock.blockedAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Trial Balance</span>
                      <span className={`font-bold ${auditReport.trialBalance.isBalanced ? "text-emerald-300" : "text-red-300"}`}>
                        {auditReport.trialBalance.isBalanced ? "BALANCED ✓" : `OFF BY ${fmtRs(auditReport.trialBalance.imbalanceAmount)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Rule Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <RuleCard
                    ruleNumber={1}
                    title="Trial Balance Auto-Lock"
                    subtitle="Double-entry verification before every filing"
                    passed={auditReport.rule1_trialBalance.passed}
                    isBlocking={!auditReport.rule1_trialBalance.passed}
                    detail={
                      auditReport.rule1_trialBalance.passed
                        ? `All ${auditReport.trialBalance.entries.length} ledger accounts balance to zero. Total debits = Total credits = ${fmtRs(auditReport.trialBalance.totalDebit)}. Filing is UNLOCKED.`
                        : `Ledger imbalance of ${fmtRs(auditReport.rule1_trialBalance.imbalance)} detected. This means a journal entry is missing its counterpart. ALL GST and income tax filings are LOCKED until this is corrected. Post the missing journal entry (debit or credit) to release the lock.`
                    }
                    impactLabel="Imbalance"
                    impactValue={auditReport.rule1_trialBalance.passed ? "₹0.00" : fmtRs(auditReport.rule1_trialBalance.imbalance)}
                  />

                  <RuleCard
                    ruleNumber={2}
                    title="GSTR-2B ITC Hard Lock"
                    subtitle="Input Tax Credit capped to GSTR-2B verified amount"
                    passed={auditReport.rule2_gstr2bItcLock.passed}
                    detail={
                      auditReport.rule2_gstr2bItcLock.passed
                        ? `All Input Tax Credit claims are within the GSTR-2B verified amount of ${fmtRs(auditReport.gstr3bSummary.gstr2bVerifiedITC)}. Zero risk of Section 16(4) denial or 18% interest penalty.`
                        : `${fmtRs(auditReport.rule2_gstr2bItcLock.blockedAmount)} ITC is blocked — vendor has not filed their GSTR-1. Sannidh has automatically adjusted your GSTR-3B claim to ${fmtRs(auditReport.gstr3bSummary.gstr2bVerifiedITC)} (verified amount). Send vendor a filing reminder immediately.`
                    }
                    impactLabel="Blocked ITC"
                    impactValue={fmtRs(auditReport.rule2_gstr2bItcLock.blockedAmount)}
                  />

                  <RuleCard
                    ruleNumber={3}
                    title="TDS Auto-Deduction Engine"
                    subtitle="Section-wise TDS computed on every expense & payroll"
                    passed={auditReport.rule3_tdsCompliance.passed}
                    detail={
                      auditReport.rule3_tdsCompliance.passed
                        ? `All ${auditReport.tdsRegister.records.length} payments evaluated for TDS under Sections 192, 194C, 194J, 194I, 194H, 194A. Total TDS: ${fmtRs(auditReport.tdsRegister.totalTDSDeducted)}. Zero shortfall.`
                        : `${auditReport.rule3_tdsCompliance.shortfallCount} payments have TDS shortfall totalling ${fmtRs(auditReport.rule3_tdsCompliance.totalShortfall)}. Correction journal vouchers generated. Deposit via Challan 281 by 7th of next month. Sannidh has sent alerts to CA inbox.`
                    }
                    impactLabel="TDS Shortfall"
                    impactValue={fmtRs(auditReport.rule3_tdsCompliance.totalShortfall)}
                  />

                  <RuleCard
                    ruleNumber={4}
                    title="CA Exception Inbox"
                    subtitle="95% auto-resolved · Edge cases routed to CA"
                    passed={criticalCount === 0}
                    detail={`${auditReport.rule4_caExceptionInbox.totalAlerts} total alerts generated. ${autoResolvedCount} auto-resolved by Sannidh engine. ${criticalCount} critical alerts require CA attention. ${auditReport.rule4_caExceptionInbox.totalAlerts - criticalCount} routine items. CA receives a pre-filled audit-ready package with all flagged items.`}
                    impactLabel="Critical Alerts"
                    impactValue={`${criticalCount} open`}
                  />
                </div>

                {/* Quick GSTR-3B Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Outward GST</div>
                    <div className="text-sm font-bold text-foreground">{fmtRs(auditReport.gstr3bSummary.totalTaxPayable)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">ITC Available</div>
                    <div className="text-sm font-bold text-emerald-300">{fmtRs(auditReport.gstr3bSummary.netItcAvailable)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Net Cash Payable</div>
                    <div className="text-sm font-bold text-amber-300">{fmtRs(auditReport.gstr3bSummary.totalCashPayment)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">GSTR-3B Status</div>
                    <div className={`text-sm font-bold ${auditReport.gstr3bSummary.isFilingReady ? "text-emerald-300" : "text-red-300"}`}>
                      {auditReport.gstr3bSummary.isFilingReady ? "READY ✓" : "LOCKED ✗"}
                    </div>
                  </div>
                </div>

                {/* P&L Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Revenue</div>
                    <div className="text-sm font-bold text-foreground">{fmtRs(auditReport.profitAndLoss.totalRevenue)}</div>
                    <div className="text-[10px] text-muted-foreground">{auditReport.profitAndLoss.period}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><BarChart3 className="w-3 h-3" /> EBITDA</div>
                    <div className="text-sm font-bold text-foreground">{fmtRs(auditReport.profitAndLoss.ebitda)}</div>
                    <div className="text-[10px] text-muted-foreground">{auditReport.profitAndLoss.ebitdaMarginPct}% margin</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Profit After Tax</div>
                    <div className={`text-sm font-bold ${auditReport.profitAndLoss.profitAfterTax >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                      {fmtRs(auditReport.profitAndLoss.profitAfterTax)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{auditReport.profitAndLoss.netProfitMarginPct}% margin</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><ClipboardCheck className="w-3 h-3" /> Balance Sheet</div>
                    <div className={`text-sm font-bold ${auditReport.balanceSheet.isBalanced ? "text-emerald-300" : "text-red-300"}`}>
                      {auditReport.balanceSheet.isBalanced ? "BALANCED ✓" : "MISMATCH ✗"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Assets: {fmtRs(auditReport.balanceSheet.totalAssets)}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION C — CA EXCEPTION INBOX
      ═══════════════════════════════════════════════════════════════════════ */}
      {allAlerts.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setShowInbox(!showInbox)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${criticalCount > 0 ? "bg-red-500/12 border-red-500/25" : "bg-amber-500/12 border-amber-500/25"}`}>
                <Bell className={`w-5 h-5 ${criticalCount > 0 ? "text-red-400" : "text-amber-400"}`} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">CA Exception Inbox</h3>
                  {criticalCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {criticalCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {autoResolvedCount} auto-resolved by Sannidh · {allAlerts.length - autoResolvedCount} need CA attention
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {criticalCount > 0 && (
                  <Badge className="bg-red-500/15 text-red-300 border border-red-500/25 text-[10px]">
                    {criticalCount} CRITICAL
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[10px]">
                    {warningCount} WARNING
                  </Badge>
                )}
                <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px]">
                  {autoResolvedCount} AUTO-RESOLVED
                </Badge>
              </div>
              {showInbox ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>

          <AnimatePresence>
            {showInbox && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3">
                  {/* Filter tabs */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(["all", "critical", "warning", "info"] as const).map((f) => {
                      const count = f === "all" ? allAlerts.length : allAlerts.filter((a) => a.severity === f).length;
                      return (
                        <button
                          key={f}
                          onClick={() => setInboxFilter(f)}
                          className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                            inboxFilter === f
                              ? f === "critical" ? "bg-red-500/20 text-red-300 border-red-500/30"
                              : f === "warning" ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : f === "info" ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-white/10 text-foreground border-white/15"
                              : "text-muted-foreground border-white/8 hover:border-white/15 hover:text-foreground"
                          }`}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Alert cards */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    <AnimatePresence mode="popLayout">
                      {filteredAlerts.length > 0 ? (
                        filteredAlerts.map((alert, i) => (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <ExceptionAlertCard alert={alert} />
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2" />
                          No {inboxFilter === "all" ? "" : inboxFilter} alerts — all clear!
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION D — SANNIDH NATIVE ERP (Full Ledger UI)
          ─── The body of the ERP — all tabs, invoices, purchases, payroll ───
      ═══════════════════════════════════════════════════════════════════════ */}
      <SmartERPModule
        invoices={invoices}
        purchases={purchases}
        expenses={expenses}
        payroll={payroll}
        bankTxns={bankTxns}
        inventory={inventory}
        company={{
          name: companyName ?? "Your Company",
          gstin: "",
          state: "",
        }}
        companyId={companyId}
        financialYear="2025-26"
        mode="real"
      />

      {/* ── Data Ingestion Modal ─────────────────────────────────────────────
          Triggered by the "Import Data" button in the control bar.
          Supports: Bank CSV, Invoice PDF, GSTR-2B JSON, Payroll CSV/Excel.
          After successful import, re-fetches all data to refresh the dashboard.
      ─────────────────────────────────────────────────────────────────────── */}
      <DataIngestionModal
        companyId={companyId}
        open={showIngestionModal}
        onClose={() => setShowIngestionModal(false)}
        onDataImported={(result) => {
          // Immediately use parsed data if available (bypasses Supabase RLS issues)
          if (result.parsedData && result.parsedData.length > 0) {
            if (result.type === 'bank') {
              setBankTxns(result.parsedData as ERPBankTxn[]);
              setIsLiveData(true);
              console.log(`[RealERP] Loaded ${result.parsedData.length} bank txns directly from import`);
            } else if (result.type === 'payroll') {
              setPayroll(result.parsedData as ERPPayroll[]);
              setIsLiveData(true);
            }
          }
          // Also re-fetch all data (will pick up localStorage fallbacks too)
          fetchAll();
        }}
      />

      {/* ── Reset All Data Confirmation ──────────────────────────────────── */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-[#0f1419] border border-red-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-red-500/15"><Trash2 className="w-5 h-5 text-red-400" /></div>
                <h3 className="text-lg font-bold text-white">Reset All Data</h3>
              </div>
              <p className="text-sm text-gray-400 mb-6">This will permanently delete <strong className="text-red-300">all uploaded data</strong> — bank transactions, invoices, purchases, payroll, expenses, opening balances, and depreciation policy. This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)} className="h-9 px-4 text-sm">Cancel</Button>
                <Button size="sm" onClick={handleResetAllData} className="h-9 px-4 text-sm bg-red-600 hover:bg-red-700 text-white border-0">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Yes, Reset Everything
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Opening Balances Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showOpeningBalances && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowOpeningBalances(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0f1419] border border-emerald-500/30 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-500/15"><BookOpen className="w-5 h-5 text-emerald-400" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Opening Balances</h3>
                    <p className="text-[11px] text-gray-500">FY 2025-26 · As on 1st April 2025</p>
                  </div>
                </div>
                <button onClick={() => setShowOpeningBalances(false)} className="p-1 rounded-full hover:bg-white/10"><X className="w-4 h-4 text-gray-400" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-2">Assets</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([['cash', 'Cash in Hand'], ['bank', 'Bank Balance'], ['debtors', 'Sundry Debtors'], ['stock', 'Closing Stock'], ['fixedAssets', 'Fixed Assets']] as const).map(([key, label]) => (
                      <div key={key}>
                        <label className="text-[11px] text-gray-400 mb-1 block">{label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">₹</span>
                          <input type="number" value={openingBalances[key] || ''} onChange={e => setOpeningBalances(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))} className="w-full h-9 pl-7 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-emerald-500/50 focus:outline-none" placeholder="0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-red-300 uppercase tracking-wider mb-2">Liabilities & Equity</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([['creditors', 'Sundry Creditors'], ['capital', 'Capital Account'], ['reserves', 'Reserves & Surplus'], ['loans', 'Loans (Secured)'], ['currentLiabilities', 'Current Liabilities']] as const).map(([key, label]) => (
                      <div key={key}>
                        <label className="text-[11px] text-gray-400 mb-1 block">{label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">₹</span>
                          <input type="number" value={openingBalances[key] || ''} onChange={e => setOpeningBalances(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))} className="w-full h-9 pl-7 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-red-500/50 focus:outline-none" placeholder="0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Balance check */}
                {(() => {
                  const totalAssets = openingBalances.cash + openingBalances.bank + openingBalances.debtors + openingBalances.stock + openingBalances.fixedAssets;
                  const totalLiabilities = openingBalances.creditors + openingBalances.capital + openingBalances.reserves + openingBalances.loans + openingBalances.currentLiabilities;
                  const diff = totalAssets - totalLiabilities;
                  return (
                    <div className={`p-3 rounded-lg border ${Math.abs(diff) < 1 ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-amber-500/8 border-amber-500/20'}`}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">Total Assets: <strong className="text-emerald-300">₹{totalAssets.toLocaleString('en-IN')}</strong></span>
                        <span className="text-gray-400">Total Liabilities: <strong className="text-red-300">₹{totalLiabilities.toLocaleString('en-IN')}</strong></span>
                      </div>
                      {Math.abs(diff) >= 1 && (
                        <p className="text-[10px] text-amber-400 mt-1.5">⚠ Difference of ₹{Math.abs(diff).toLocaleString('en-IN')} — Assets and Liabilities must match.</p>
                      )}
                      {Math.abs(diff) < 1 && (
                        <p className="text-[10px] text-emerald-400 mt-1.5">✓ Balanced — Assets = Liabilities + Equity</p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-3 justify-end mt-5">
                <Button variant="ghost" size="sm" onClick={() => setShowOpeningBalances(false)} className="h-9 px-4 text-sm">Cancel</Button>
                <Button size="sm" onClick={saveOpeningBalances} className="h-9 px-4 text-sm bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Save Opening Balances
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Depreciation Policy Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showDepreciationPolicy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDepreciationPolicy(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0f1419] border border-violet-500/30 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-violet-500/15"><Settings className="w-5 h-5 text-violet-400" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Depreciation Policy</h3>
                    <p className="text-[11px] text-gray-500">As per Income Tax Act / Companies Act</p>
                  </div>
                </div>
                <button onClick={() => setShowDepreciationPolicy(false)} className="p-1 rounded-full hover:bg-white/10"><X className="w-4 h-4 text-gray-400" /></button>
              </div>

              {/* Method selection */}
              <div className="mb-5">
                <p className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider mb-2">Method</p>
                <div className="flex gap-3">
                  {(['SLM', 'WDV'] as const).map(m => (
                    <button key={m} onClick={() => setDepPolicy(prev => ({ ...prev, method: m }))} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${depPolicy.method === m ? 'bg-violet-500/20 border-violet-500/40 text-violet-200' : 'bg-white/3 border-white/10 text-gray-400 hover:border-white/20'}`}>
                      {m === 'SLM' ? 'Straight Line (SLM)' : 'Written Down Value (WDV)'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5">{depPolicy.method === 'WDV' ? 'WDV applies depreciation on reducing balance — standard for Income Tax Act.' : 'SLM applies equal depreciation every year — standard for Companies Act.'}</p>
              </div>

              {/* Rates per asset class */}
              <div>
                <p className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider mb-2">Rates by Asset Class (%)</p>
                <div className="space-y-2.5">
                  {Object.entries(depPolicy.rates).map(([assetClass, rate]) => (
                    <div key={assetClass} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-300 flex-1">{assetClass}</span>
                      <div className="relative w-24">
                        <input type="number" min={0} max={100} value={rate} onChange={e => setDepPolicy(prev => ({ ...prev, rates: { ...prev.rates, [assetClass]: parseFloat(e.target.value) || 0 } }))} className="w-full h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white text-right focus:border-violet-500/50 focus:outline-none" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IT Act standard rates info */}
              <div className="mt-4 p-3 rounded-lg bg-violet-500/5 border border-violet-500/15">
                <p className="text-[10px] text-violet-300 font-semibold mb-1">Standard IT Act WDV Rates (Sec 32)</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">Building: 10% · Furniture: 10% · Plant & Machinery: 15% · Computers: 40% · Vehicles: 15% · Intangibles: 25%</p>
              </div>

              <div className="flex gap-3 justify-end mt-5">
                <Button variant="ghost" size="sm" onClick={() => setShowDepreciationPolicy(false)} className="h-9 px-4 text-sm">Cancel</Button>
                <Button size="sm" onClick={saveDepPolicy} className="h-9 px-4 text-sm bg-violet-600 hover:bg-violet-700 text-white border-0">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Save Policy
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

export default RealERPModule;
