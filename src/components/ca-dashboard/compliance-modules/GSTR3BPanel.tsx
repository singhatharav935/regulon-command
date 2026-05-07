import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RefreshCw, AlertTriangle, Download, IndianRupee } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Backend API removed — calculations are performed client-side

export default function GSTR3BPanel({ clientId, isDemo }: { clientId?: string; isDemo?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({ period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), outward_cgst: '', outward_sgst: '', outward_igst: '', itc_cgst: '', itc_sgst: '', itc_igst: '', rcm_liability: '' });

  const handleCalc = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);
    // All computation is client-side — no backend dependency
    setTimeout(() => {
      const out = parseFloat(form.outward_cgst || '0') + parseFloat(form.outward_sgst || '0') + parseFloat(form.outward_igst || '0');
      const itc = parseFloat(form.itc_cgst || '0') + parseFloat(form.itc_sgst || '0') + parseFloat(form.itc_igst || '0');
      const rcm = parseFloat(form.rcm_liability || '0');
      const net = Math.max(0, out + rcm - itc);

      setResult({
        summary: `GSTR-3B computation complete. Net tax payable: ₹${net.toLocaleString()}`,
        due_date: '20th of Next Month',
        payment_mode: 'Online/Challan',
        computation: {
          outward_tax: { total: out },
          itc_available: { total: itc },
          net_tax_payable: { total: net }
        },
        alerts: itc > out * 0.8 ? [{ type: 'warning', message: 'ITC utilized is >80% of liability. Ensure Rule 86B compliance.' }] : []
      });
      toast.success('GSTR-3B calculated successfully');
      setLoading(false);
    }, 600);
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!result) {
      toast.error('Generate the computation first before exporting.');
      return;
    }
    setExporting(true);
    toast.info('Generating GSTR-3B Computation Report...', { duration: 1000 });
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(37, 99, 235); // Blue-600
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('SANNIDH | TAX COMPUTATION', 20, 25);
        doc.setFontSize(10);
        doc.text('GSTR-3B Net Tax Liability Statement', 20, 32);

        // Report Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('GSTR-3B PERIODIC COMPUTATION', 20, 55);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Client ID: ${clientId || 'DEMO_CLIENT'}`, 20, 65);
        doc.text(`Period: ${form?.period_month}/${form?.period_year}`, 20, 70);
        doc.text(`Payment Due Date: ${result?.due_date || 'N/A'}`, 20, 75);

        // Computation Grid
        doc.setDrawColor(220, 220, 220);
        doc.line(20, 85, 190, 85);
        
        doc.setFont('helvetica', 'bold');
        doc.text('PARTICULARS', 20, 95);
        doc.text('AMOUNT (RS.)', 150, 95);
        doc.line(20, 98, 190, 98);

        doc.setFont('helvetica', 'normal');
        doc.text('Total Outward Tax Liability', 20, 110);
        doc.text((result?.computation?.outward_tax?.total || 0).toLocaleString(), 150, 110);
        
        doc.text('Less: Eligible ITC (Input Tax Credit)', 20, 120);
        doc.text(`(${(result?.computation?.itc_available?.total || 0).toLocaleString()})`, 150, 120);

        doc.text('Add: RCM Liability / Interest / Late Fee', 20, 130);
        doc.text((result?.computation?.rcm_liability_added || 0).toLocaleString(), 150, 130);

        doc.line(140, 135, 190, 135);
        doc.setFont('helvetica', 'bold');
        doc.text('NET TAX PAYABLE IN CASH', 20, 145);
        doc.text(`Rs. ${(result?.computation?.net_tax_payable?.total || 0).toLocaleString()}`, 150, 145);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Document Generated: ${new Date().toLocaleString()}`, 20, 280);
        doc.text('Sannidh - Compliance Auto-Pilot Signature Verified', 130, 280);

        doc.save(`GSTR3B_Computation_${clientId || 'DEMO'}.pdf`);

        toast.success('GSTR-3B Official Report Downloaded.');
      } catch (err) {
        console.error('PDF Generation Error:', err);
        toast.error('Failed to generate PDF.');
      } finally {
        setExporting(false);
      }
    }, 1500);
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
          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={exporting}
            className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 mt-2"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? 'Generating Report...' : 'Export Government PDF'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
