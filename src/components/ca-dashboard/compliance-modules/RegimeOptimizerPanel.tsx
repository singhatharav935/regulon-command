/**
 * RegimeOptimizerPanel — Tax Regime Optimizer (Old vs New FY 2024-25)
 * Part of Sannidh ComplianceModulesHub — Advanced Calculators
 */
import React, { useState } from 'react';
import { IndianRupee, TrendingDown, TrendingUp, Zap, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';

interface RegimeResult {
  old_regime: { gross_salary: number; hra_exemption: number; standard_deduction: number; total_deductions: number; taxable_income: number; tax_liability: number };
  new_regime: { gross_salary: number; standard_deduction: number; taxable_income: number; tax_liability: number };
  comparison: { saving: number; saving_regime: string; recommended: string; recommendation_text: string };
}

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const Field = ({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max?: number }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-muted-foreground">{label}{max ? ` (max ${fmt(max)})` : ''}</label>
    <div className="relative">
      <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
      <input
        type="number"
        min={0}
        max={max}
        value={value || ''}
        onChange={e => onChange(Math.min(Number(e.target.value), max ?? Infinity))}
        className="w-full pl-7 pr-3 py-1.5 text-sm bg-card/50 border border-border/40 rounded-lg focus:outline-none focus:border-primary/60"
        placeholder="0"
      />
    </div>
  </div>
);

export default function RegimeOptimizerPanel({ clientId }: { clientId?: string }) {
  const [form, setForm] = useState({
    gross_salary: 0, hra_exemption: 0, sec_80c: 0,
    sec_80d: 0, sec_80ccd_1b: 0, home_loan_interest: 0,
    other_deductions: 0, professional_tax: 0,
  });
  const [result, setResult] = useState<RegimeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: number) => setForm(f => ({ ...f, [k]: v }));

  const calculate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${CA_API}/api/v1/ca/calculators/regime-optimizer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, ...form }),
      });
      const json = await res.json();
      if (json.success) setResult(json.data);
    } catch {
      // fallback: run purely client-side
      const oldSlabs = (ti: number) => {
        let t = ti <= 250000 ? 0 : ti <= 500000 ? (ti-250000)*0.05 : ti <= 1000000 ? 12500+(ti-500000)*0.20 : 112500+(ti-1000000)*0.30;
        if (ti <= 500000) t = 0;
        return Math.round(t * 1.04);
      };
      const newSlabs = (ti: number) => {
        let t = ti <= 300000 ? 0 : ti <= 700000 ? (ti-300000)*0.05 : ti <= 1000000 ? 20000+(ti-700000)*0.10 : ti <= 1200000 ? 50000+(ti-1000000)*0.15 : ti <= 1500000 ? 80000+(ti-1200000)*0.20 : 140000+(ti-1500000)*0.30;
        if (ti <= 700000) t = 0;
        return Math.round(t * 1.04);
      };
      const totalDed = Math.min(form.sec_80c,150000)+Math.min(form.sec_80d,50000)+Math.min(form.sec_80ccd_1b,50000)+Math.min(form.home_loan_interest,200000)+form.other_deductions+Math.min(form.professional_tax,2400);
      const taxableOld = Math.max(0, form.gross_salary - form.hra_exemption - 50000 - totalDed);
      const taxableNew = Math.max(0, form.gross_salary - 75000);
      const taxOld = oldSlabs(taxableOld);
      const taxNew = newSlabs(taxableNew);
      const saving = taxOld - taxNew;
      setResult({
        old_regime: { gross_salary: form.gross_salary, hra_exemption: form.hra_exemption, standard_deduction: 50000, total_deductions: totalDed, taxable_income: taxableOld, tax_liability: taxOld },
        new_regime: { gross_salary: form.gross_salary, standard_deduction: 75000, taxable_income: taxableNew, tax_liability: taxNew },
        comparison: { saving: Math.abs(saving), saving_regime: saving >= 0 ? 'new' : 'old', recommended: saving >= 0 ? 'new' : 'old', recommendation_text: saving >= 0 ? `You save ${fmt(Math.abs(saving))} by choosing the New Regime.` : `You save ${fmt(Math.abs(saving))} by staying in the Old Regime.` },
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Input Grid */}
      <div className="p-4 bg-card/30 rounded-xl border border-border/30 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Income Details</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gross Salary / Income" value={form.gross_salary} onChange={set('gross_salary')} />
          <Field label="HRA Exemption (u/s 10)" value={form.hra_exemption} onChange={set('hra_exemption')} />
        </div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Old Regime Deductions</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sec 80C (PPF/ELSS/LIC)" value={form.sec_80c} onChange={set('sec_80c')} max={150000} />
          <Field label="Sec 80D (Health Ins)" value={form.sec_80d} onChange={set('sec_80d')} max={50000} />
          <Field label="Sec 80CCD(1B) NPS" value={form.sec_80ccd_1b} onChange={set('sec_80ccd_1b')} max={50000} />
          <Field label="Home Loan Interest" value={form.home_loan_interest} onChange={set('home_loan_interest')} max={200000} />
          <Field label="Other Deductions" value={form.other_deductions} onChange={set('other_deductions')} />
          <Field label="Professional Tax" value={form.professional_tax} onChange={set('professional_tax')} max={2400} />
        </div>
        <div className="flex gap-2 pt-1">
          <Button onClick={calculate} disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700">
            <Zap className="w-4 h-4 mr-2" />{loading ? 'Calculating...' : 'Compare Regimes'}
          </Button>
          <Button variant="outline" onClick={() => { setForm({ gross_salary:0,hra_exemption:0,sec_80c:0,sec_80d:0,sec_80ccd_1b:0,home_loan_interest:0,other_deductions:0,professional_tax:0 }); setResult(null); }}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Recommendation Banner */}
          <div className={`p-4 rounded-xl border ${result.comparison.recommended === 'new' ? 'bg-green-500/10 border-green-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
            <div className="flex items-center gap-2 mb-1">
              {result.comparison.recommended === 'new' ? <TrendingDown className="w-5 h-5 text-green-400" /> : <TrendingUp className="w-5 h-5 text-blue-400" />}
              <span className="font-bold text-sm">
                {result.comparison.recommended === 'new' ? '✅ New Regime Recommended' : '✅ Old Regime Recommended'}
              </span>
              <Badge className="ml-auto bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{fmt(result.comparison.saving)} Savings</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{result.comparison.recommendation_text}</p>
          </div>

          {/* Side-by-Side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Old Regime */}
            <div className={`p-4 rounded-xl border ${result.comparison.recommended === 'old' ? 'border-green-500/50 bg-green-500/5' : 'border-border/30 bg-card/30'}`}>
              <p className="text-xs font-bold text-muted-foreground mb-2">OLD REGIME</p>
              {[
                ['Gross Income', result.old_regime.gross_salary],
                ['HRA Exemption', -result.old_regime.hra_exemption],
                ['Std. Deduction', -result.old_regime.standard_deduction],
                ['All Deductions', -result.old_regime.total_deductions],
                ['Taxable Income', result.old_regime.taxable_income],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between text-xs py-0.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className={Number(v) < 0 ? 'text-green-400' : ''}>{Number(v) < 0 ? `(${fmt(Math.abs(Number(v)))})` : fmt(Number(v))}</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border/30 flex justify-between">
                <span className="text-sm font-bold">Tax Liability</span>
                <span className="text-red-400 font-bold">{fmt(result.old_regime.tax_liability)}</span>
              </div>
            </div>

            {/* New Regime */}
            <div className={`p-4 rounded-xl border ${result.comparison.recommended === 'new' ? 'border-green-500/50 bg-green-500/5' : 'border-border/30 bg-card/30'}`}>
              <p className="text-xs font-bold text-muted-foreground mb-2">NEW REGIME</p>
              {[
                ['Gross Income', result.new_regime.gross_salary],
                ['Std. Deduction', -result.new_regime.standard_deduction],
                ['No other deductions', 0],
                ['', null],
                ['Taxable Income', result.new_regime.taxable_income],
              ].map(([k, v], i) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className={Number(v) < 0 ? 'text-green-400' : ''}>{v === null ? '' : Number(v) < 0 ? `(${fmt(Math.abs(Number(v)))})` : v === 0 && k === '' ? '' : fmt(Number(v))}</span>
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-border/30 flex justify-between">
                <span className="text-sm font-bold">Tax Liability</span>
                <span className="text-red-400 font-bold">{fmt(result.new_regime.tax_liability)}</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Includes 4% Health & Education Cess. Surcharge applied for income &gt; ₹50L.
          </p>
        </div>
      )}
    </div>
  );
}
