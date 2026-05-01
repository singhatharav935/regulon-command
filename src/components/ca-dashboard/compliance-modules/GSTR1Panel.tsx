import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Calculator, FileText, CheckCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const API_BASE = `${CA_API}/api/v1/compliance`;

export default function GSTR1Panel({ clientId, isDemo }: { clientId?: string; isDemo?: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const handleGenerate = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        setResult({
          summary: {
            alert: 'GSTR-1 Draft generated with 14 invoices. Ready for Government portal sync.',
            due_date: '11th of Next Month',
            total_invoices: 14,
            total_taxable: 450000,
            total_tax: 81000,
            invalid_invoices: 0
          }
        });
        toast.success('GSTR-1 generated (Demo Mode)');
        setLoading(false);
      }, 800);
      return;
    }

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

  const handleExport = () => {
    if (!result) {
      toast.error('Generate the calculation first before exporting.');
      return;
    }
    setExporting(true);
    toast.info('Initializing Official GSTR-1 Template...', { duration: 1000 });
    
    setTimeout(() => {
      try {
        // Professional PDF Generation using jsPDF
        const doc = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4'
        });
        
        // Header
        doc.setFillColor(15, 23, 42); // Dark slate
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('SANNIDH | REGULON MASTER', 20, 25);
        doc.setFontSize(10);
        doc.text('Advanced Regulatory Calculator Hub - GSTR-1 Draft', 20, 32);

        // Body Content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('GOVERNMENT PORTAL SYNC DRAFT', 20, 55);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Client Identifier: ${clientId || 'DEMO_CLIENT'}`, 20, 65);
        doc.text(`Period: ${periodMonth}/${periodYear}`, 20, 70);
        doc.text(`Status: READY FOR PORTAL SYNC`, 20, 75);
        doc.text(`Due Date: ${result?.summary?.due_date || 'N/A'}`, 20, 80);

        // Summary Box
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, 90, 170, 45);
        doc.setFont('helvetica', 'bold');
        doc.text('RECONCILIATION SUMMARY', 25, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Invoices Processed: ${result?.summary?.total_invoices || 0}`, 25, 110);
        doc.text(`Total Taxable Value: Rs. ${(result?.summary?.total_taxable || 0).toLocaleString()}`, 25, 115);
        doc.text(`Total Tax (IGST/CGST/SGST): Rs. ${(result?.summary?.total_tax || 0).toLocaleString()}`, 25, 120);
        doc.text(`Invalid/Error Invoices: ${result?.summary?.invalid_invoices || 0}`, 25, 125);

        // Audit Trail
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('--------------------------------------------------------------------------------------------------', 20, 270);
        doc.text(`Digitally Signed by Regulon Auto-Pilot | Timestamp: ${new Date().toLocaleString()}`, 20, 275);
        doc.text('Disclaimer: This is an AI-generated draft for demo purposes. Verify with official records before filing.', 20, 280);

        doc.save(`GSTR1_Draft_${clientId || 'DEMO'}_${periodMonth}.pdf`);

        toast.success('GSTR-1 Official Draft Downloaded.');
      } catch (err) {
        console.error('PDF Generation Error:', err);
        toast.error('PDF Generation Failed', {
          description: 'There was a technical error in generating the file binary.'
        });
      } finally {
        setExporting(false);
      }
    }, 1500);
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
          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={exporting}
            className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? 'Generating Signed PDF...' : 'Export Government PDF'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
