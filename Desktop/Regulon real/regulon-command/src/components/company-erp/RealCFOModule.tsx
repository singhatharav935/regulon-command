/**
 * REAL VIRTUAL CFO MODULE — Live Data Binding
 * ============================================
 * Fetches live financial data from Supabase using companyId,
 * computes CFO metrics, and passes them to VirtualCFOModule.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VirtualCFOModule } from "./VirtualCFOModule";

interface RealCFOModuleProps {
  companyId?: string;
  companyName?: string;
}

export function RealCFOModule({ companyId, companyName }: RealCFOModuleProps) {
  const [bankTxns, setBankTxns] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);

  // Fetch live data from Supabase
  useEffect(() => {
    if (!companyId) return;

    const lsFallback = (key: string): any[] => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    };

    const fetchData = async () => {
      try {
        const [bankRes, invRes, purRes, expRes, payRes] = await Promise.all([
          supabase.from("company_bank_transactions" as never).select("*").eq("company_id", companyId).order("date", { ascending: false }).limit(200),
          supabase.from("company_invoices" as never).select("*").eq("company_id", companyId).limit(200),
          supabase.from("company_purchases" as never).select("*").eq("company_id", companyId).limit(200),
          supabase.from("company_expenses" as never).select("*").eq("company_id", companyId).limit(200),
          supabase.from("company_payroll" as never).select("*").eq("company_id", companyId).limit(200),
        ]);

        // Use Supabase data if available, otherwise fall back to localStorage
        const bankData = (bankRes.data as any[])?.length ? (bankRes.data as any[]) : lsFallback(`sannidh_bank_txns_${companyId}`);
        const invData  = (invRes.data as any[])?.length  ? (invRes.data as any[])  : lsFallback(`sannidh_invoices_${companyId}`);
        const purData  = (purRes.data as any[])?.length  ? (purRes.data as any[])  : lsFallback(`sannidh_purchases_${companyId}`);
        const expData  = (expRes.data as any[])?.length  ? (expRes.data as any[])  : lsFallback(`sannidh_expenses_${companyId}`);
        const payData  = (payRes.data as any[])?.length  ? (payRes.data as any[])  : lsFallback(`sannidh_payroll_${companyId}`);

        setBankTxns(bankData);
        setInvoices(invData);
        setPurchases(purData);
        setExpenses(expData);
        setPayroll(payData);

        if (bankData.length > 0) {
          console.log(`[RealCFOModule] Loaded ${bankData.length} bank txns`);
        }
      } catch (err) {
        console.warn("[RealCFOModule] Data fetch error:", err);
        // Even if Supabase completely fails, try localStorage
        setBankTxns(lsFallback(`sannidh_bank_txns_${companyId}`));
        setInvoices(lsFallback(`sannidh_invoices_${companyId}`));
        setPurchases(lsFallback(`sannidh_purchases_${companyId}`));
        setExpenses(lsFallback(`sannidh_expenses_${companyId}`));
        setPayroll(lsFallback(`sannidh_payroll_${companyId}`));
      }
    };

    fetchData();
  }, [companyId]);

  // ─── Compute Live CFO Metrics ──────────────────────────────────────────────

  // Cash position
  const currentBalance = bankTxns.length > 0 ? (bankTxns[0]?.balance || 0) : 0;

  // Monthly burn rate (total debits / number of months)
  const totalDebits = bankTxns.reduce((sum, t) => sum + (t.debit || 0), 0);
  const totalCredits = bankTxns.reduce((sum, t) => sum + (t.credit || 0), 0);
  const dates = bankTxns.map(t => new Date(t.date).getTime()).filter(d => !isNaN(d));
  const monthSpan = dates.length > 1 ? Math.max(1, Math.ceil((Math.max(...dates) - Math.min(...dates)) / (30 * 24 * 60 * 60 * 1000))) : 1;
  const monthlyBurnRate = totalDebits / monthSpan;
  const monthlyInflow = totalCredits / monthSpan;
  const runwayMonths = monthlyBurnRate > 0 ? currentBalance / monthlyBurnRate : 0;

  // Revenue from invoices
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || inv.total || inv.grand_total || 0), 0);
  const totalPurchasesAmt = purchases.reduce((sum, p) => sum + (p.amount || p.total || p.grand_total || 0), 0);
  const totalExpensesAmt = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPayrollAmt = payroll.reduce((sum, p) => sum + (p.gross_salary || p.net_pay || 0), 0);

  // Gross Profit
  const grossProfit = totalRevenue - totalPurchasesAmt;
  const netProfit = grossProfit - totalExpensesAmt - totalPayrollAmt;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

  // Health score (0-100)
  const healthScore = Math.min(100, Math.max(0,
    (runwayMonths >= 6 ? 30 : runwayMonths * 5) +
    (netMargin > 0 ? 30 : 0) +
    (grossMargin > 20 ? 20 : grossMargin) +
    (monthlyInflow > monthlyBurnRate ? 20 : 10)
  ));

  return (
    <VirtualCFOModule 
      companyName={companyName || ''} 
      mode="real"
      liveMetrics={{
        currentBalance,
        monthlyBurnRate,
        monthlyInflow,
        runwayMonths,
        totalRevenue,
        totalPurchases: totalPurchasesAmt,
        totalExpenses: totalExpensesAmt,
        totalPayroll: totalPayrollAmt,
        grossProfit,
        netProfit,
        grossMargin,
        netMargin,
        healthScore,
        bankTxnCount: bankTxns.length,
      }}
    />
  );
}

export default RealCFOModule;
