/**
 * DeferredTaxDepreciationPanel — Dual-Book Depreciation (Companies Act vs IT Act)
 * Part of Sannidh ComplianceModulesHub — Advanced Calculators
 */
import React, { useState } from 'react';
import { Building2, Plus, Trash2, Zap, RotateCcw, BookOpen, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const pct = (r: number) => `${(r * 100).toFixed(2)}%`;

const ASSET_CLASSES = [
  { value: 'buildings_factory', label: 'Factory Buildings' },
  { value: 'buildings_other', label: 'Other Buildings' },
  { value: 'plant_machinery', label: 'Plant & Machinery' },
  { value: 'computers', label: 'Computers & Software' },
  { value: 'furniture', label: 'Furniture & Fixtures' },
  { value: 'vehicles', label: 'Motor Vehicles' },
  { value: 'intangibles', label: 'Intangible Assets' },
];

const CA_RATES: Record<string, number> = {
  buildings_factory: 0.10, buildings_other: 0.05, plant_machinery: 0.1526,
  computers: 0.3167, furniture: 0.0621, vehicles: 0.1186, intangibles: 0.25, default: 0.10,
};
const IT_RATES: Record<string, number> = {
  buildings_factory: 0.10, buildings_other: 0.05, plant_machinery: 0.15,
  computers: 0.40, furniture: 0.10, vehicles: 0.15, intangibles: 0.25, default: 0.15,
};

interface Asset { id: string; name: string; cost: number; asset_class: string; }

const EMPTY = (): Asset => ({ id: Date.now().toString(), name: '', cost: 0, asset_class: 'plant_machinery' });

export default function DeferredTaxDepreciationPanel({ clientId }: { clientId?: string }) {
  const [assets, setAssets] = useState<Asset[]>([EMPTY()]);
  const [taxRate, setTaxRate] = useState(25.92);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const update = (id: string, key: keyof Asset, val: any) =>
    setAssets(a => a.map(x => x.id === id ? { ...x, [key]: val } : x));

  const calcClientSide = () => {
    const rate = taxRate / 100;
    const schedule = assets.map(a => {
      const caRate = CA_RATES[a.asset_class] ?? CA_RATES.default;
      const itRate = IT_RATES[a.asset_class] ?? IT_RATES.default;
      const depnCA = Math.round(a.cost * caRate);
      const depnIT = Math.round(a.cost * itRate);
      const timing = depnIT - depnCA;
      const dtImpact = Math.round(timing * rate);
      return {
        name: a.name, gross_block: a.cost, asset_class: a.asset_class,
        companies_act: { rate_pct: pct(caRate), depreciation: depnCA, wdv_after: a.cost - depnCA },
        it_act: { rate_pct: pct(itRate), depreciation: depnIT, wdv_after: a.cost - depnIT },
        timing_difference: timing, deferred_tax_impact: dtImpact,
        type: dtImpact >= 0 ? 'DTL' : 'DTA',
      };
    });
    const totalTiming = schedule.reduce((s, a) => s + a.timing_difference, 0);
    const totalDT = schedule.reduce((s, a) => s + a.deferred_tax_impact, 0);
    const totalGross = assets.reduce((s, a) => s + a.cost, 0);
    setResult({
      summary: {
        total_assets: assets.length, total_gross_block: totalGross,
        total_companies_act_depn: schedule.reduce((s, a) => s + a.companies_act.depreciation, 0),
        total_it_act_depn: schedule.reduce((s, a) => s + a.it_act.depreciation, 0),
        net_timing_difference: totalTiming, tax_rate_applied: rate, total_deferred_tax: totalDT,
        balance_sheet_entry: totalDT >= 0
          ? `Deferred Tax Liability (DTL): ${fmt(Math.abs(totalDT))}`
          : `Deferred Tax Asset (DTA): ${fmt(Math.abs(totalDT))}`,
      },
      asset_schedule: schedule,
    });
  };

  const calculate = async () => {
    if (assets.some(a => !a.name || !a.cost)) return;
    setLoading(true);
    try {
      const res = await fetch(`${CA_API}/api/v1/ca/calculators/deferred-tax`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, assets: assets.map(a => ({ name: a.name, cost: a.cost, asset_class: a.asset_class })), tax_rate: taxRate / 100 }),
      });
      const json = await res.json();
      if (json.success) setResult(json.data);
      else calcClientSide();
    } catch { calcClientSide(); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Rate header */}
      <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/30">
        <Scale className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Applicable Tax Rate (%)</span>
        <input
          type="number" value={taxRate} step={0.01} min={0} max={100}
          onChange={e => setTaxRate(Number(e.target.value))}
          className="w-24 px-2 py-1 text-sm bg-card/50 border border-border/40 rounded-lg ml-auto"
        />
        <span className="text-xs text-muted-foreground">(25.92% = 25% + SC + Cess)</span>
      </div>

      {/* Asset Rows */}
      <div className="space-y-2">
        {assets.map((a, i) => (
          <div key={a.id} className="p-3 bg-card/30 rounded-xl border border-border/30 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Asset #{i + 1}</span>
              {assets.length > 1 && (
                <button onClick={() => setAssets(a => a.filter(x => x.id !== a[i]?.id))}
                  className="ml-auto text-red-400 hover:text-red-300">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-[10px] text-muted-foreground">Asset Name</label>
                <input value={a.name} onChange={e => update(a.id, 'name', e.target.value)}
                  placeholder="e.g. CNC Machine"
                  className="w-full px-2 py-1.5 text-xs bg-card/50 border border-border/40 rounded-lg" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Gross Block (₹)</label>
                <input type="number" value={a.cost || ''} onChange={e => update(a.id, 'cost', Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-card/50 border border-border/40 rounded-lg" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Asset Class</label>
                <select value={a.asset_class} onChange={e => update(a.id, 'asset_class', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-card/50 border border-border/40 rounded-lg">
                  {ASSET_CLASSES.map(ac => <option key={ac.value} value={ac.value}>{ac.label}</option>)}
                </select>
              </div>
            </div>

            {/* Rate Preview */}
            {a.cost > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex justify-between text-[10px] bg-blue-500/10 rounded px-2 py-1.5 border border-blue-500/20">
                  <span className="text-muted-foreground">Companies Act ({pct(CA_RATES[a.asset_class] ?? CA_RATES.default)})</span>
                  <span className="text-blue-400 font-semibold">{fmt(Math.round(a.cost * (CA_RATES[a.asset_class] ?? CA_RATES.default)))}</span>
                </div>
                <div className="flex justify-between text-[10px] bg-purple-500/10 rounded px-2 py-1.5 border border-purple-500/20">
                  <span className="text-muted-foreground">IT Act ({pct(IT_RATES[a.asset_class] ?? IT_RATES.default)})</span>
                  <span className="text-purple-400 font-semibold">{fmt(Math.round(a.cost * (IT_RATES[a.asset_class] ?? IT_RATES.default)))}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setAssets(a => [...a, EMPTY()])}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Asset
        </Button>
        <Button onClick={calculate} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          <Zap className="w-4 h-4 mr-2" />{loading ? 'Calculating...' : 'Generate Dual Depreciation Schedule'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setAssets([EMPTY()]); setResult(null); }}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total Gross Block', value: result.summary.total_gross_block, color: 'text-foreground' },
              { label: 'Companies Act Depn', value: result.summary.total_companies_act_depn, color: 'text-blue-400' },
              { label: 'IT Act Depn', value: result.summary.total_it_act_depn, color: 'text-purple-400' },
              { label: 'Timing Difference', value: result.summary.net_timing_difference, color: 'text-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-2.5 bg-card/30 rounded-lg border border-border/30">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>

          {/* DTL/DTA Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${result.summary.total_deferred_tax >= 0 ? 'border-red-500/40 bg-red-500/10' : 'border-green-500/30 bg-green-500/10'}`}>
            <div>
              <p className="text-xs text-muted-foreground">Balance Sheet Entry</p>
              <p className="font-bold text-sm">{result.summary.balance_sheet_entry}</p>
            </div>
            <Badge className={`text-sm px-3 py-1 ${result.summary.total_deferred_tax >= 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
              {result.summary.total_deferred_tax >= 0 ? 'DTL' : 'DTA'}
            </Badge>
          </div>

          {/* Asset Table */}
          <div className="overflow-x-auto">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Dual Depreciation Schedule
            </p>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/30">
                {['Asset','Gross Block','CA Rate','CA Depn','IT Rate','IT Depn','Timing Diff','DT Impact','Type'].map(h => (
                  <th key={h} className="text-left py-1.5 px-1.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {result.asset_schedule.map((a: any, i: number) => (
                  <tr key={i} className="border-b border-border/20">
                    <td className="py-1.5 px-1.5 font-medium">{a.name}</td>
                    <td className="py-1.5 px-1.5">{fmt(a.gross_block)}</td>
                    <td className="py-1.5 px-1.5 text-blue-400">{a.companies_act.rate_pct}%</td>
                    <td className="py-1.5 px-1.5 text-blue-400">{fmt(a.companies_act.depreciation)}</td>
                    <td className="py-1.5 px-1.5 text-purple-400">{a.it_act.rate_pct}%</td>
                    <td className="py-1.5 px-1.5 text-purple-400">{fmt(a.it_act.depreciation)}</td>
                    <td className="py-1.5 px-1.5 text-orange-400">{fmt(a.timing_difference)}</td>
                    <td className="py-1.5 px-1.5 font-semibold">{fmt(Math.abs(a.deferred_tax_impact))}</td>
                    <td className="py-1.5 px-1.5">
                      <Badge className={`text-[10px] px-1 ${a.type === 'DTL' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>{a.type}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">Rates: Companies Act Schedule II WDV vs IT Act Appendix I (Section 32). One-year depreciation shown.</p>
        </div>
      )}
    </div>
  );
}
