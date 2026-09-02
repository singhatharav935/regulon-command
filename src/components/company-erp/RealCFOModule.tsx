/**
 * REAL VIRTUAL CFO MODULE — Live Data from Central Financial Engine Store
 * ======================================================================
 * Reads live financial data from the Zustand store (useFinancialEngineStore),
 * computes CFO metrics, and passes them to VirtualCFOModule.
 * Zero Supabase/localStorage calls — the store is the single source of truth.
 */

import { VirtualCFOModule } from "./VirtualCFOModule";
import { useFinancialEngineStore } from '@/stores/useFinancialEngineStore';

interface RealCFOModuleProps {
  companyId?: string;
  companyName?: string;
}

export function RealCFOModule({ companyId, companyName }: RealCFOModuleProps) {
  // Read directly from the central Zustand store
  const { invoices, purchases, expenses, payroll, bankTxns } = useFinancialEngineStore();

  // ─── Compute Live CFO Metrics ──────────────────────────────────────────────

  // Cash position
  const currentBalance = bankTxns.length > 0 ? (bankTxns[0]?.balance || 0) : 0;

  // Monthly burn rate (total debits / number of months)
  const totalDebits = bankTxns.reduce((sum: number, t: any) => sum + (Number(t.debit) || 0), 0);
  const totalCredits = bankTxns.reduce((sum: number, t: any) => sum + (Number(t.credit) || 0), 0);
  const dates = bankTxns.map((t: any) => new Date(t.date).getTime()).filter((d: number) => !isNaN(d));
  const monthSpan = dates.length > 1 ? Math.max(1, Math.ceil((Math.max(...dates) - Math.min(...dates)) / (30 * 24 * 60 * 60 * 1000))) : 1;
  const monthlyBurnRate = totalDebits / monthSpan;
  const monthlyInflow = totalCredits / monthSpan;
  const runwayMonths = monthlyBurnRate > 0 ? currentBalance / monthlyBurnRate : 0;

  // Revenue from invoices
  const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.amount) || Number(inv.total) || 0), 0);
  const totalPurchasesAmt = purchases.reduce((sum: number, p: any) => sum + (Number(p.amount) || Number(p.total) || 0), 0);
  const totalExpensesAmt = expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
  const totalPayrollAmt = payroll.reduce((sum: number, p: any) => sum + (Number(p.gross) || Number(p.net_pay) || 0), 0);

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
