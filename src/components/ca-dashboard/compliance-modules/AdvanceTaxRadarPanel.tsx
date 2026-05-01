/**
 * AdvanceTaxRadarPanel — Predictive Advance Tax with Sec 234B/C Interest
 * Part of Sannidh ComplianceModulesHub — Advanced Calculators
 */
import React, { useState } from 'react';
import { Zap, Target, RefreshCw, Download, AlertTriangle, ChevronRight, IndianRupee, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const INSTALLMENTS = [
  { label: '1st Instalment', due: 'June 15', pct: 0.15, month: 6 },
  { label: '2nd Instalment', due: 'Sept 15', pct: 0.45, month: 9 },
  { label: '3rd Instalment', due: 'Dec 15', pct: 0.75, month: 12 },
  { label: '4th Instalment', due: 'Mar 15', pct: 1.00, month: 3 },
];

const calcNewTax = (ti: number) => {
  let t = ti <= 300000 ? 0 : ti <= 700000 ? (ti-300000)*0.05 : ti <= 1000000 ? 20000+(ti-700000)*0.10 : ti <= 1200000 ? 50000+(ti-1000000)*0.15 : ti <= 1500000 ? 80000+(ti-1200000)*0.20 : 140000+(ti-1500000)*0.30;
  if (ti <= 700000) t = 0;
  return Math.round(t * 1.04);
};

const calcOldTax = (ti: number) => {
  let t = ti <= 250000 ? 0 : ti <= 500000 ? (ti-250000)*0.05 : ti <= 1000000 ? 12500+(ti-500000)*0.20 : 112500+(ti-1000000)*0.30;
  if (ti <= 500000) t = 0;
  return Math.round(t * 1.04);
};

export default function AdvanceTaxRadarPanel({ clientId, isDemo }: { clientId?: string; isDemo?: boolean }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-based

  const [form, setForm] = useState({
    ytd_profit: 0,
    months_elapsed: currentMonth >= 4 ? currentMonth - 3 : currentMonth + 9, // FY months
    tds_deducted: 0,
    advance_paid: 0,
    other_income: 0,
    regime: 'new' as 'old' | 'new',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!result) {
      toast.error('Generate the projection first before exporting.');
      return;
    }
    setExporting(true);
    toast.info('Generating Advance Tax Payment Schedule...', { duration: 1000 });
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(6, 182, 212); // Cyan-500
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('SANNIDH | ADVANCE TAX ADVISORY', 20, 25);
        doc.setFontSize(10);
        doc.text('FY 2024-25 - Predictive Installment Schedule', 20, 32);

        // Projections
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ANNUAL TAX PROJECTION SUMMARY', 20, 55);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Client ID: ${clientId || 'DEMO_CLIENT'}`, 20, 65);
        doc.text(`Projected Annual Profit: Rs. ${(result?.projection?.projected_annual_profit || 0).toLocaleString()}`, 20, 75);
        doc.text(`Gross Tax Liability (Est): Rs. ${(result?.projection?.gross_tax_liability || 0).toLocaleString()}`, 20, 80);
        doc.text(`Net Payable after TDS/Paid: Rs. ${(result?.projection?.balance_payable || 0).toLocaleString()}`, 20, 85);

        // Schedule Table
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 95, 190, 95);
        doc.setFont('helvetica', 'bold');
        doc.text('INSTALLMENT', 25, 102);
        doc.text('DUE DATE', 80, 102);
        doc.text('PAYABLE (RS.)', 150, 102);
        doc.line(20, 105, 190, 105);

        doc.setFont('helvetica', 'normal');
        let y = 115;
        (result?.installment_schedule || []).forEach((inst: any) => {
          doc.text(inst.label || 'Installment', 25, y);
          doc.text(inst.due || 'N/A', 80, y);
          doc.text((inst.amount_due_now || 0).toLocaleString(), 150, y);
          y += 10;
        });

        // Risk Alert
        y += 10;
        doc.setFillColor(254, 242, 242); // Red-50
        doc.rect(20, y, 170, 20, 'F');
        doc.setTextColor(153, 27, 27); // Red-800
        doc.setFont('helvetica', 'bold');
        doc.text('INTEREST RISK ANALYSIS (SEC 234B/C)', 25, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(result?.interest_risk?.message || 'Calculation complete.', 25, y + 15);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Document Type: Tax Advisory | Generated: ${new Date().toLocaleString()}`, 20, 280);

        doc.save(`Advance_Tax_Schedule_${clientId || 'DEMO'}.pdf`);

        toast.success('Advance Tax Advisory PDF Downloaded.');
      } catch (err) {
        console.error('PDF Generation Error:', err);
        toast.error('Failed to generate Advance Tax PDF.');
      } finally {
        setExporting(false);
      }
    }, 1500);
  };

  const set = (k: string) => (v: any) => setForm(f => ({ ...f, [k]: v }));

  const calcClientSide = () => {
    const projectedProfit = (form.ytd_profit / Math.max(1, form.months_elapsed)) * 12 + form.other_income;
    const grossTax = form.regime === 'new' ? calcNewTax(projectedProfit) : calcOldTax(projectedProfit);
    const netTax = Math.max(0, grossTax - form.tds_deducted);
    const schedule = INSTALLMENTS.map(inst => {
      const cumRequired = Math.round(netTax * inst.pct);
      const due = Math.max(0, cumRequired - form.advance_paid);
      return { ...inst, cumulative_required: cumRequired, amount_due_now: due, interest_risk_234c: due > 0 ? Math.round(due * 0.01) : 0 };
    });
    const shortfall234B = Math.max(0, Math.round(netTax * 0.90) - form.advance_paid);
    setResult({
      projection: { projected_annual_profit: Math.round(projectedProfit), gross_tax_liability: grossTax, net_tax_after_tds: netTax, advance_paid: form.advance_paid, balance_payable: Math.max(0, netTax - form.advance_paid) },
      installment_schedule: schedule,
      interest_risk: { sec_234b_shortfall: shortfall234B, sec_234b_interest_per_month: Math.round(shortfall234B * 0.01), message: shortfall234B > 0 ? `Risk: ₹${Math.round(shortfall234B * 0.01).toLocaleString('en-IN')}/month interest u/s 234B.` : 'No 234B risk — advance tax on track.' }
    });
  };

  const calculate = async () => {
    if (!form.ytd_profit || !form.months_elapsed) return;
    setLoading(true);
    if (isDemo) {
      setTimeout(() => {
        calcClientSide();
        setLoading(false);
      }, 600);
      return;
    }
    try {
      const res = await fetch(`${CA_API}/api/v1/ca/calculators/advance-tax`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, ...form }),
      });
      const json = await res.json();
      if (json.success) setResult(json.data);
      else calcClientSide();
    } catch { calcClientSide(); }
    setLoading(false);
  };

  // Determine current installment
  const fyMonth = currentMonth >= 4 ? currentMonth - 3 : currentMonth + 9;
  const activeInstIdx = INSTALLMENTS.findIndex(i => fyMonth <= (i.month >= 4 ? i.month - 3 : i.month + 9)) ?? 3;

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="p-4 bg-card/30 rounded-xl border border-border/30 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profit & Tax Data</span>
          <Badge variant="outline" className="text-[10px]">FY 2024-25</Badge>
          <select value={form.regime} onChange={e => set('regime')(e.target.value as any)}
            className="ml-auto text-xs bg-card border border-border/40 rounded px-2 py-0.5">
            <option value="new">New Regime</option>
            <option value="old">Old Regime</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'YTD Net Profit (₹)', key: 'ytd_profit' },
            { label: `Months Elapsed (${form.months_elapsed})`, key: 'months_elapsed', max: 12 },
            { label: 'TDS Deducted (₹)', key: 'tds_deducted' },
            { label: 'Advance Tax Paid (₹)', key: 'advance_paid' },
            { label: 'Other Income (₹)', key: 'other_income' },
          ].map(({ label, key, max }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{label}</label>
              <input
                type="number" min={0} max={max}
                value={(form as any)[key] || ''}
                onChange={e => set(key)(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-card/50 border border-border/40 rounded-lg focus:outline-none focus:border-primary/60"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={calculate} disabled={loading} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
            <Zap className="w-4 h-4 mr-2" />{loading ? 'Projecting...' : 'Run Advance Tax Radar'}
          </Button>
          <Button variant="outline" onClick={() => { setForm({ ytd_profit:0, months_elapsed:1, tds_deducted:0, advance_paid:0, other_income:0, regime:'new' }); setResult(null); }}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Projection Cards */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Projected Annual Profit', value: result.projection.projected_annual_profit, color: 'text-blue-400' },
              { label: 'Total Tax Liability', value: result.projection.gross_tax_liability, color: 'text-red-400' },
              { label: 'Balance Payable', value: result.projection.balance_payable, color: 'text-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-2.5 bg-card/30 rounded-lg border border-border/30 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>

          {/* Installment Schedule */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Installment Radar</p>
            {result.installment_schedule.map((inst: any, i: number) => {
              const isActive = i === activeInstIdx;
              const isPast = i < activeInstIdx;
              return (
                <div key={inst.label} className={`p-3 rounded-xl border transition-all ${isActive ? 'border-cyan-500/50 bg-cyan-500/10' : isPast ? 'border-green-500/30 bg-green-500/5 opacity-70' : 'border-border/30 bg-card/20'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${isActive ? 'text-cyan-400' : isPast ? 'text-green-400' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="text-sm font-semibold">{inst.label}
                          <span className="text-xs text-muted-foreground ml-1">— {inst.due}</span>
                          {isActive && <Badge className="ml-2 text-[10px] bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Current</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground">Cumulative required: {fmt(inst.cumulative_required)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${inst.amount_due_now > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {inst.amount_due_now > 0 ? fmt(inst.amount_due_now) : '✓ Paid'}
                      </p>
                      {inst.interest_risk_234c > 0 && (
                        <p className="text-[10px] text-orange-400">+{fmt(inst.interest_risk_234c)}/mo 234C risk</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 234B Alert */}
          <div className={`p-3 rounded-xl border flex items-start gap-2 ${result.interest_risk.sec_234b_shortfall > 0 ? 'border-red-500/40 bg-red-500/10' : 'border-green-500/30 bg-green-500/10'}`}>
            {result.interest_risk.sec_234b_shortfall > 0
              ? <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              : <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />}
            <div>
              <p className="text-xs font-semibold">{result.interest_risk.sec_234b_shortfall > 0 ? 'Section 234B Interest Risk' : 'Section 234B — Clear'}</p>
              <p className="text-xs text-muted-foreground">{result.interest_risk.message}</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={exporting}
            className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 mt-2"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? 'Generating Advisory Report...' : 'Export Government PDF'}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">Interest projections are indicative. Actual computation subject to final assessment.</p>
        </div>
      )}
    </div>
  );
}
