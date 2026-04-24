import { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, AlertTriangle, RefreshCw, TrendingDown, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const API_BASE = `${CA_API}/api/v1/corporate`;

type DebtorRow = { customer_name: string; invoice_date: string; invoice_amount: string; amount_received: string };

const BUCKET_COLORS: Record<string, string> = { '0-30': 'bg-green-500', '31-60': 'bg-yellow-400', '61-90': 'bg-orange-500', '90+': 'bg-red-500' };
const BUCKET_TEXT: Record<string, string> = { '0-30': 'text-green-400', '31-60': 'text-yellow-400', '61-90': 'text-orange-400', '90+': 'text-red-400' };

export default function DebtorsAgingPanel({ clientId }: { clientId?: string }) {
  const [debtors, setDebtors] = useState<DebtorRow[]>([{ customer_name: '', invoice_date: '', invoice_amount: '', amount_received: '' }]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addDebtor = () => setDebtors(p => [...p, { customer_name: '', invoice_date: '', invoice_amount: '', amount_received: '' }]);
  const updateDebtor = (idx: number, field: keyof DebtorRow, val: string) => setDebtors(p => p.map((d, i) => i === idx ? { ...d, [field]: val } : d));

  const analyze = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);
    try {
      const payload = {
        client_id: clientId,
        debtors: debtors.map(d => ({ ...d, invoice_amount: parseFloat(d.invoice_amount || '0'), amount_received: parseFloat(d.amount_received || '0') })),
      };
      const res = await fetch(`${API_BASE}/debtors/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { setResult(data.data); toast.success('Debtors aging analyzed'); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-orange-500/20 rounded-lg"><PieChart className="w-5 h-5 text-orange-400" /></div>
        <div>
          <h3 className="font-bold text-lg">Debtors Aging Analysis</h3>
          <p className="text-xs text-muted-foreground">Auto-bucket outstanding amounts. 180+ days → 50% provision auto-applied.</p>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {debtors.map((d, idx) => (
          <div key={idx} className="p-3 border border-border/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Debtor {idx + 1}</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Customer Name" value={d.customer_name} onChange={e => updateDebtor(idx, 'customer_name', e.target.value)} className="text-sm" />
              <Input type="date" value={d.invoice_date} onChange={e => updateDebtor(idx, 'invoice_date', e.target.value)} className="text-sm" />
              <Input type="number" placeholder="Invoice Amount (₹)" value={d.invoice_amount} onChange={e => updateDebtor(idx, 'invoice_amount', e.target.value)} className="text-sm" />
              <Input type="number" placeholder="Amount Received (₹)" value={d.amount_received} onChange={e => updateDebtor(idx, 'amount_received', e.target.value)} className="text-sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addDebtor} className="flex-1">+ Add Debtor</Button>
        <Button onClick={analyze} disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <PieChart className="w-4 h-4 mr-2" />}
          Analyze Aging
        </Button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Aging bucket bars */}
          <div className="space-y-2">
            {(['0-30', '31-60', '61-90', '90+'] as const).map((bucket) => {
              const amt = result.summary[bucket.replace('-', '_').replace('+', 'plus') as keyof typeof result.summary] || 0;
              const total = result.summary.total_outstanding || 1;
              const pct = total > 0 ? (amt / total) * 100 : 0;
              return (
                <div key={bucket}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={BUCKET_TEXT[bucket]}>{bucket} days</span>
                    <span className="font-bold">₹{(amt as number)?.toLocaleString()} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${BUCKET_COLORS[bucket]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-card/50 border border-border/30 rounded-lg"><p className="text-xs text-muted-foreground">Total Outstanding</p><p className="font-bold text-lg">₹{result.summary?.total_outstanding?.toLocaleString()}</p></div>
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"><p className="text-xs text-muted-foreground">Provision Required</p><p className="font-bold text-lg text-red-400">₹{result.summary?.total_provision_required?.toLocaleString()}</p></div>
          </div>

          {result.aged_debtors_requiring_action?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Action Required — {result.aged_debtors_requiring_action.length} debtors over 90 days</p>
              {result.aged_debtors_requiring_action.map((d: any, i: number) => (
                <div key={i} className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{d.customer_name}</span>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">{d.days_outstanding} days</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Outstanding: ₹{d.outstanding_amount?.toLocaleString()} | Provision: {d.provision_pct}</p>
                  <Button size="sm" variant="outline" className="mt-2 h-6 text-xs border-red-500/30 text-red-400"><Mail className="w-3 h-3 mr-1" />Send Recovery Letter</Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">{result.collection_forecast?.provision_note}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
