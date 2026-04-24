import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Calculator, FileText, CheckCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const API_BASE = `${CA_API}/api/v1/compliance`;

export default function GSTR1Panel({ clientId }: { clientId?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('client_id', clientId);
      formData.append('period_month', String(periodMonth));
      formData.append('period_year', String(periodYear));
      if (file) formData.append('invoices_csv', file);

      const response = await fetch(`${API_BASE}/gstr1/generate`, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) { setResult(data.data); toast.success('GSTR-1 generated successfully'); }
      else toast.error(data.error || 'Generation failed');
    } catch {
      toast.error('Connection error. Ensure backend is running on port 3001.');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-green-500/20 rounded-lg"><Calculator className="w-5 h-5 text-green-400" /></div>
        <div>
          <h3 className="font-bold text-lg">GSTR-1 Auto-Generation</h3>
          <p className="text-xs text-muted-foreground">Upload invoice CSV → Auto-populate B1/B2/B2BA sections with tax calculations</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Period Month</label>
          <Input type="number" min={1} max={12} value={periodMonth} onChange={e => setPeriodMonth(parseInt(e.target.value))} className="mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Period Year</label>
          <Input type="number" min={2020} value={periodYear} onChange={e => setPeriodYear(parseInt(e.target.value))} className="mt-1" />
        </div>
        <div className="flex items-end">
          <Button onClick={handleGenerate} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
            Generate
          </Button>
        </div>
      </div>

      <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => document.getElementById('gstr1-file')?.click()}>
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">{file ? file.name : 'Upload Invoice CSV'}</p>
        <p className="text-xs text-muted-foreground mt-1">Columns: invoice_number, customer_gstin, taxable_value, tax_rate, supply_type, hsn_code</p>
        <input id="gstr1-file" type="file" accept=".csv" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      </div>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
            <p className="text-sm font-bold text-green-400 mb-2">📊 GSTR-1 Summary</p>
            <p className="text-sm">{result.summary?.alert}</p>
            <p className="text-xs text-muted-foreground mt-1">Due Date: {result.summary?.due_date}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{ label: 'Total Invoices', val: result.summary?.total_invoices, color: 'text-foreground' }, { label: 'Taxable Value', val: `₹${((result.summary?.total_taxable || 0) / 100000).toFixed(2)}L`, color: 'text-blue-400' }, { label: 'Total Tax', val: `₹${((result.summary?.total_tax || 0) / 1000).toFixed(1)}K`, color: 'text-green-400' }, { label: 'Invalid', val: result.summary?.invalid_invoices, color: 'text-red-400' }].map(s => (
              <div key={s.label} className="p-3 bg-card/50 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>
          {result.summary?.invalid_invoices > 0 && (
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-400 inline mr-2" />
              <span className="text-sm text-red-400">{result.summary.invalid_invoices} invoices have validation errors. Fix before filing.</span>
            </div>
          )}
          <Button variant="outline" className="w-full border-green-500/30 text-green-400">
            <Download className="w-4 h-4 mr-2" /> Export Government PDF
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
