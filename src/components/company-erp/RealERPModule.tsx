/**
 * REAL ERP MODULE — Live Supabase Data Fetcher
 * =============================================
 * This is a thin data-fetching wrapper for the real company dashboard.
 * It fetches ALL data from Supabase and passes it as props to SmartERPModule.
 * SmartERPModule handles ALL UI — this file only handles data.
 *
 * Data sources:
 *  company_invoices          → Sales invoices
 *  company_purchases         → Purchase bills
 *  company_expenses          → Expenses & petty cash
 *  company_payroll           → Payroll & salary records
 *  company_bank_transactions → Bank statement & reconciliation
 *  company_inventory         → Stock items & HSN codes
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart3, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SmartERPModule } from "./SmartERPModule";
import type {
  ERPInvoice, ERPPurchase, ERPExpense,
  ERPPayroll, ERPBankTxn, ERPStockItem
} from "./erp-types";

interface Props {
  companyId: string;
  companyName?: string;
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="rounded-2xl border border-white/8 bg-card/80 backdrop-blur-xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-48 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-64 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-white/3 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Empty / No Data State ────────────────────────────────────────────────────

function OnboardingState({ companyName }: { companyName?: string }) {
  return (
    <div className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/5 to-background p-8 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
        <BarChart3 className="w-7 h-7 text-cyan-400" />
      </div>
      <div>
        <h3 className="text-base font-bold text-foreground">Smart ERP — Ready for {companyName || "Your Company"}</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          Your ERP is live. Start by creating your first sales invoice or uploading a purchase bill.
          Sannidh AI will automatically track GST, ITC, TDS, payroll and bank reconciliation.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
        {[
          "Create Sales Invoice", "Upload Purchase Bill", "Add Bank Statement",
          "Run Payroll", "File GSTR-1", "Track Inventory"
        ].map((action, i) => (
          <button key={i} className="px-3 py-2 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 text-xs text-muted-foreground hover:text-foreground transition-all text-left">
            + {action}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex items-center gap-4">
      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-300">Unable to load ERP data</p>
        <p className="text-xs text-red-400/70 mt-0.5">Could not connect to your company's data. Check your connection and try again.</p>
      </div>
      <Button onClick={onRetry} size="sm" className="h-8 text-xs gap-1.5 bg-red-500/15 border border-red-500/25 text-red-300">
        <RefreshCw className="w-3 h-3" /> Retry
      </Button>
    </div>
  );
}

// ─── Main Real ERP Module ─────────────────────────────────────────────────────

export function RealERPModule({ companyId, companyName }: Props) {
  const [invoices,  setInvoices]  = useState<ERPInvoice[]>([]);
  const [purchases, setPurchases] = useState<ERPPurchase[]>([]);
  const [expenses,  setExpenses]  = useState<ERPExpense[]>([]);
  const [payroll,   setPayroll]   = useState<ERPPayroll[]>([]);
  const [bankTxns,  setBankTxns]  = useState<ERPBankTxn[]>([]);
  const [inventory, setInventory] = useState<ERPStockItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [inv, pur, exp, pay, bank, inv_stk] = await Promise.all([
        supabase.from("company_invoices"          as never).select("*").eq("company_id", companyId).order("date", { ascending: false }).limit(100),
        supabase.from("company_purchases"         as never).select("*").eq("company_id", companyId).order("date", { ascending: false }).limit(100),
        supabase.from("company_expenses"          as never).select("*").eq("company_id", companyId).order("date", { ascending: false }).limit(100),
        supabase.from("company_payroll"           as never).select("*").eq("company_id", companyId).order("employee"),
        supabase.from("company_bank_transactions" as never).select("*").eq("company_id", companyId).order("date", { ascending: false }).limit(200),
        supabase.from("company_inventory"         as never).select("*").eq("company_id", companyId).order("name"),
      ]);

      if (inv.data)     setInvoices(inv.data   as ERPInvoice[]);
      if (pur.data)     setPurchases(pur.data  as ERPPurchase[]);
      if (exp.data)     setExpenses(exp.data   as ERPExpense[]);
      if (pay.data)     setPayroll(pay.data    as ERPPayroll[]);
      if (bank.data)    setBankTxns(bank.data  as ERPBankTxn[]);
      if (inv_stk.data) setInventory(inv_stk.data as ERPStockItem[]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSync = async () => {
    setSyncing(true);
    await fetchAll();
    setSyncing(false);
  };

  if (loading) return <LoadingSkeleton />;
  if (error)   return <ErrorState onRetry={fetchAll} />;

  const hasNoData = invoices.length === 0 && purchases.length === 0 &&
                    expenses.length === 0 && payroll.length === 0 &&
                    bankTxns.length === 0;

  if (hasNoData) return <OnboardingState companyName={companyName} />;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {/* Sync Bar */}
      <div className="flex items-center justify-end mb-3">
        <Button
          onClick={handleSync}
          disabled={syncing}
          size="sm"
          variant="outline"
          className="h-8 text-xs border-white/10 gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Refresh Live Data"}
        </Button>
      </div>

      {/* Full ERP — same UI as Demo, live Supabase data */}
      <SmartERPModule
        invoices={invoices}
        purchases={purchases}
        expenses={expenses}
        payroll={payroll}
        bankTxns={bankTxns}
        inventory={inventory}
        company={{ name: companyName || "Company", gstin: "", state: "" }}
      />
    </motion.div>
  );
}

export default RealERPModule;
