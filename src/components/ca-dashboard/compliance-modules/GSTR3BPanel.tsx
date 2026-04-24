import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RefreshCw, AlertTriangle, CheckCircle, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const API_BASE = `${CA_API}/api/v1/compliance`;

export default function GSTR3BPanel({ clientId }: { clientId?: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({ period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), outward_cgst: '', outward_sgst: '', outward_igst: '', itc_cgst: '', itc_sgst: '', itc_igst: '', rcm_liability: '' });

  const handleCalc = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/gstr3b/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, period_month: form.period_month, period_year: form.period_year, outward: { cgst: parseFloat(form.outward_cgst || '0'), sgst: parseFloat(form.outward_sgst || '0'), igst: parseFloat(form.outward_igst || '0') }, inward_itc: { cgst: parseFloat(form.itc_cgst || '0'), sgst: parseFloat(form.itc_sgst || '0'), igst: parseFloat(form.itc_igst || '0') }, rcm_liability: parseFloat(form.rcm_liability || '0') }),
      });
      const data = await response.json();
      if (data.success) { setResult(data.data); toast.success('GSTR-3B calculated'); }
      else toast.error(data.error || 'Calculation failed');
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  const field = (label: string, key: string) => (
    <div>
      <label className="text-xs text-muted-foreground">{label} (₹)</label>
      <Input type="number" min={0} value={(form as any)[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="mt-1" placeholder="0" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg"><IndianRupee className="w-5 h-5 text-blue-400" /></div>
        <div>
          <h3 className="font-bold text-lg">GSTR-3B Net Tax Calculator</h3>
          <p className="text-xs text-muted-foreground">Auto-calculate: Outward Tax − ITC = Net Tax Due</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground">Month</label><Input type="number" min={1} max={12} value={form.period_month} onChange={e => setForm({...form, period_month: parseInt(e.target.value)})} className="mt-1" /></div>
        <div><label className="text-xs text-muted-foreground">Year</label><Input type="number" value={form.period_year} onChange={e => setForm({...form, period_year: parseInt(e.target.value)})} className="mt-1" /></div>
      </div>
      <div>
        <p className="text-xs font-semibold text-orange-400 mb-2">Outward Tax Liability (from GSTR-1)</p>
        <div className="grid grid-cols-3 gap-2">{field('CGST', 'outward_cgst')}{field('SGST', 'outward_sgst')}{field('IGST', 'outward_igst')}</div>
      </div>
      <div>
        <p className="text-xs font-semibold text-green-400 mb-2">ITC Available (from GSTR-2B)</p>
        <div className="grid grid-cols-3 gap-2">{field('ITC CGST', 'itc_cgst')}{field('ITC SGST', 'itc_sgst')}{field('ITC IGST', 'itc_igst')}</div>
      </div>
      {field('RCM Liability', 'rcm_liability')}
      <Button onClick={handleCalc} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
        Calculate Net Tax
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
            <p className="text-sm font-bold text-blue-400">Summary</p>
            <p className="text-sm mt-1">{result.summary}</p>
            <p className="text-xs text-muted-foreground mt-1">Payment Due: {result.due_date} | Mode: {result.payment_mode}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20"><p className="text-xs text-muted-foreground">Total Outward Tax</p><p className="text-base font-bold text-orange-400">₹{result.computation?.outward_tax?.total?.toLocaleString()}</p></div>
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20"><p className="text-xs text-muted-foreground">ITC Credit</p><p className="text-base font-bold text-green-400">₹{result.computation?.itc_available?.total?.toLocaleString()}</p></div>
            <div className={`p-3 rounded-lg border ${result.computation?.net_tax_payable?.total > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}><p className="text-xs text-muted-foreground">Net Payable</p><p className={`text-base font-bold ${result.computation?.net_tax_payable?.total > 0 ? 'text-red-400' : 'text-green-400'}`}>₹{result.computation?.net_tax_payable?.total?.toLocaleString()}</p></div>
          </div>
          {result.alerts?.map((alert: any, i: number) => (
            <div key={i} className={`p-3 rounded-lg border flex items-start gap-2 ${alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <AlertTriangle className={`w-4 h-4 mt-0.5 ${alert.type === 'warning' ? 'text-yellow-400' : 'text-red-400'}`} />
              <p className="text-sm">{alert.message}</p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
