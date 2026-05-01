/**
 * CapitalGainsPanel — STCG / LTCG Calculator with CII & Grandfathering
 * Part of Sannidh ComplianceModulesHub — Advanced Calculators
 */
import React, { useState } from 'react';
import { TrendingUp, Plus, Trash2, Upload, Zap, RotateCcw, IndianRupee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const CII: Record<string, number> = {
  '2001-02':100,'2002-03':105,'2003-04':109,'2004-05':113,'2005-06':117,'2006-07':122,
  '2007-08':129,'2008-09':137,'2009-10':148,'2010-11':167,'2011-12':184,'2012-13':200,
  '2013-14':220,'2014-15':240,'2015-16':254,'2016-17':264,'2017-18':272,'2018-19':280,
  '2019-20':289,'2020-21':301,'2021-22':317,'2022-23':331,'2023-24':348,'2024-25':363,
};

const getFY = (d: string) => {
  const dt = new Date(d); const yr = dt.getFullYear(); const mo = dt.getMonth() + 1;
  return mo >= 4 ? `${yr}-${String(yr+1).slice(-2)}` : `${yr-1}-${String(yr).slice(-2)}`;
};

interface Trade {
  id: string; name: string; buy_date: string; sell_date: string;
  buy_price: number; sell_price: number; quantity: number;
  fmv_jan31?: number; asset_type: 'equity' | 'debt' | 'gold';
}

interface TradeResult extends Trade {
  holding_days: number; type: 'STCG' | 'LTCG';
  indexed_cost: number; gain: number;
}

const EMPTY_TRADE = (): Trade => ({
  id: Date.now().toString(), name: '', buy_date: '', sell_date: '',
  buy_price: 0, sell_price: 0, quantity: 1, fmv_jan31: undefined, asset_type: 'equity',
});

export default function CapitalGainsPanel({ clientId }: { clientId?: string }) {
  const [trades, setTrades] = useState<Trade[]>([EMPTY_TRADE()]);
  const [results, setResults] = useState<TradeResult[] | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const updateTrade = (id: string, key: keyof Trade, val: any) =>
    setTrades(t => t.map(r => r.id === id ? { ...r, [key]: val } : r));

  const calcClientSide = () => {
    const res: TradeResult[] = trades.map(t => {
      const buyDt = new Date(t.buy_date); const sellDt = new Date(t.sell_date);
      const holdingDays = Math.floor((sellDt.getTime() - buyDt.getTime()) / 86400000);
      const threshold = t.asset_type === 'equity' ? 365 : t.asset_type === 'debt' ? 730 : 1095;
      const isLT = holdingDays > threshold;
      const saleVal = t.sell_price * t.quantity;
      let cost = t.buy_price * t.quantity;
      if (isLT && t.asset_type === 'equity' && t.fmv_jan31) {
        cost = Math.min(Math.max(cost, t.fmv_jan31 * t.quantity), saleVal);
      }
      let indexedCost = cost;
      if (isLT && t.asset_type !== 'equity') {
        const ciiBuy = CII[getFY(t.buy_date)] || 100;
        const ciiSell = CII[getFY(t.sell_date)] || 363;
        indexedCost = cost * (ciiSell / ciiBuy);
      }
      return { ...t, holding_days: holdingDays, type: isLT ? 'LTCG' : 'STCG', indexed_cost: Math.round(indexedCost), gain: Math.round(saleVal - indexedCost) };
    });

    const totalSTCG = res.filter(r => r.type === 'STCG').reduce((s, r) => s + r.gain, 0);
    const totalLTCG = res.filter(r => r.type === 'LTCG').reduce((s, r) => s + r.gain, 0);
    const taxableLTCG = Math.max(0, totalLTCG - 100000);
    const ltcgTax = Math.round(taxableLTCG * 0.10 * 1.04);
    const stcgTax = Math.round(Math.max(0, totalSTCG) * 0.15 * 1.04);

    setResults(res);
    setSummary({ total_stcg: totalSTCG, total_ltcg: totalLTCG, ltcg_exemption: 100000, taxable_ltcg: taxableLTCG, stcg_tax: stcgTax, ltcg_tax: ltcgTax, total_capital_gains_tax: stcgTax + ltcgTax });
  };

  const calculate = async () => {
    if (trades.some(t => !t.buy_date || !t.sell_date || !t.name)) return;
    setLoading(true);
    try {
      const res = await fetch(`${CA_API}/api/v1/ca/calculators/capital-gains`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, trades }),
      });
      const json = await res.json();
      if (json.success) { setResults(json.data.breakdown); setSummary(json.data.summary); }
      else calcClientSide();
    } catch { calcClientSide(); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Trades */}
      <div className="space-y-3">
        {trades.map((t, i) => (
          <div key={t.id} className="p-3 bg-card/30 rounded-xl border border-border/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Trade #{i + 1}</span>
              <div className="flex items-center gap-2">
                <select
                  value={t.asset_type}
                  onChange={e => updateTrade(t.id, 'asset_type', e.target.value)}
                  className="text-xs bg-card border border-border/40 rounded px-2 py-0.5"
                >
                  <option value="equity">Equity</option>
                  <option value="debt">Debt</option>
                  <option value="gold">Gold</option>
                </select>
                {trades.length > 1 && (
                  <button onClick={() => setTrades(tr => tr.filter(r => r.id !== t.id))} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <input
              placeholder="Security / Asset Name (e.g. HDFC Bank)"
              value={t.name} onChange={e => updateTrade(t.id, 'name', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-card/50 border border-border/40 rounded-lg focus:outline-none focus:border-primary/60"
            />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] text-muted-foreground">Buy Date</label>
                <input type="date" value={t.buy_date} onChange={e => updateTrade(t.id, 'buy_date', e.target.value)} className="w-full px-2 py-1 text-xs bg-card/50 border border-border/40 rounded-lg" /></div>
              <div><label className="text-[10px] text-muted-foreground">Sell Date</label>
                <input type="date" value={t.sell_date} onChange={e => updateTrade(t.id, 'sell_date', e.target.value)} className="w-full px-2 py-1 text-xs bg-card/50 border border-border/40 rounded-lg" /></div>
              <div><label className="text-[10px] text-muted-foreground">Buy Price (₹)</label>
                <input type="number" value={t.buy_price || ''} onChange={e => updateTrade(t.id, 'buy_price', Number(e.target.value))} className="w-full px-2 py-1 text-xs bg-card/50 border border-border/40 rounded-lg" /></div>
              <div><label className="text-[10px] text-muted-foreground">Sell Price (₹)</label>
                <input type="number" value={t.sell_price || ''} onChange={e => updateTrade(t.id, 'sell_price', Number(e.target.value))} className="w-full px-2 py-1 text-xs bg-card/50 border border-border/40 rounded-lg" /></div>
              <div><label className="text-[10px] text-muted-foreground">Quantity</label>
                <input type="number" value={t.quantity || ''} onChange={e => updateTrade(t.id, 'quantity', Number(e.target.value))} className="w-full px-2 py-1 text-xs bg-card/50 border border-border/40 rounded-lg" /></div>
              {t.asset_type === 'equity' && (
                <div><label className="text-[10px] text-muted-foreground">FMV Jan 31, 2018 (₹/unit)</label>
                  <input type="number" value={t.fmv_jan31 || ''} onChange={e => updateTrade(t.id, 'fmv_jan31', Number(e.target.value))} placeholder="For LTCG grandfathering" className="w-full px-2 py-1 text-xs bg-card/50 border border-border/40 rounded-lg" /></div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setTrades(t => [...t, EMPTY_TRADE()])}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Trade
        </Button>
        <Button onClick={calculate} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          <Zap className="w-4 h-4 mr-2" />{loading ? 'Calculating...' : 'Calculate Capital Gains'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setTrades([EMPTY_TRADE()]); setResults(null); setSummary(null); }}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Results */}
      {summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total STCG', value: summary.total_stcg, color: 'text-orange-400' },
              { label: 'Total LTCG', value: summary.total_ltcg, color: 'text-purple-400' },
              { label: 'LTCG Exemption (Sec 112A)', value: summary.ltcg_exemption, color: 'text-green-400' },
              { label: 'Taxable LTCG', value: summary.taxable_ltcg, color: 'text-red-400' },
              { label: 'STCG Tax @15%+Cess', value: summary.stcg_tax, color: 'text-orange-400' },
              { label: 'LTCG Tax @10%+Cess', value: summary.ltcg_tax, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-2.5 bg-card/30 rounded-lg border border-border/30">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex justify-between items-center">
            <span className="font-bold text-sm">Total Capital Gains Tax</span>
            <span className="text-red-400 font-bold text-lg">{fmt(summary.total_capital_gains_tax)}</span>
          </div>

          {/* Breakdown Table */}
          {results && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border/30">
                  {['Asset','Type','Holding','Buy Cost','Indexed Cost','Gain/Loss'].map(h => (
                    <th key={h} className="text-left py-1.5 px-2 text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.id} className="border-b border-border/20">
                      <td className="py-1.5 px-2">{r.name}</td>
                      <td className="py-1.5 px-2"><Badge className={`text-[10px] px-1 ${r.type === 'LTCG' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>{r.type}</Badge></td>
                      <td className="py-1.5 px-2 text-muted-foreground">{r.holding_days}d</td>
                      <td className="py-1.5 px-2">{fmt(r.buy_price * r.quantity)}</td>
                      <td className="py-1.5 px-2">{fmt(r.indexed_cost)}</td>
                      <td className={`py-1.5 px-2 font-semibold ${r.gain >= 0 ? 'text-red-400' : 'text-green-400'}`}>{r.gain >= 0 ? fmt(r.gain) : `(${fmt(Math.abs(r.gain))})`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground text-center">CII applied for non-equity LTCG. Grandfathering (Jan 31, 2018) applied for equity LTCG.</p>
        </div>
      )}
    </div>
  );
}
