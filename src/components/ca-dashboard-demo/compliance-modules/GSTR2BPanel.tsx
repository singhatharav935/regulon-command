import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Upload, RefreshCw, AlertTriangle, CheckCircle, ArrowRight, Bell, Download, Zap } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAICommunication } from '@/store/useAICommunication';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string);
const API_BASE = `${CA_API}/api/v1/compliance`;

/**
 * GSTR-2B Reconciliation Panel
 * Runs: Purchase Register vs Portal GSTR-2B
 * Flags: missing_in_2b | missing_in_register | amount_mismatch
 */
export default function GSTR2BPanel({ clientId, isDemo }: { clientId?: string; isDemo?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [purchaseRegisterJSON, setPurchaseRegisterJSON] = useState('');
  const [gstr2bJSON, setGstr2bJSON] = useState('');
  const [exporting, setExporting] = useState(false);
  const { triggerAI } = useAICommunication();

  const handleExport = () => {
    setExporting(true);
    toast.info('Generating GSTR-2B Reconciliation Audit Report...', { duration: 1000 });
    setTimeout(() => {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(139, 92, 246); // Violet-500
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('SANNIDH | RECONCILIATION AUDIT', 20, 25);
      doc.setFontSize(10);
      doc.text('GSTR-2B Portal vs Purchase Register Reconciliation', 20, 32);

      // Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RECONCILIATION SUMMARY', 20, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Client ID: ${clientId}`, 20, 65);
      doc.text(`Period: ${periodMonth}/${periodYear}`, 20, 70);
      doc.text(`Purchase Register Total: Rs. ${result.summary.purchase_register_total.toLocaleString()}`, 20, 80);
      doc.text(`GSTR-2B Portal Total: Rs. ${result.summary.gstr2b_total.toLocaleString()}`, 20, 85);
      doc.setFont('helvetica', 'bold');
      doc.text(`NET VARIANCE: Rs. ${result.summary.variance.toLocaleString()}`, 20, 95);

      // Mismatches Table
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 105, 190, 105);
      doc.text('INV NUMBER', 25, 112);
      doc.text('TYPE', 70, 112);
      doc.text('VARIANCE', 120, 112);
      doc.text('RECOMMENDED ACTION', 150, 112);
      doc.line(20, 115, 190, 115);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      let y = 125;
      result.mismatches.slice(0, 15).forEach((m: any) => {
        doc.text(m.purchase?.invoice_number || m.gstr2b?.invoice_number || 'N/A', 25, y);
        doc.text(m.type, 70, y);
        doc.text(m.variance?.toLocaleString() || '0', 120, y);
        doc.text(m.action, 150, y, { maxWidth: 40 });
        y += 12;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Audit Generation: ${new Date().toLocaleString()} | Sannidh AI Reconciliation Engine`, 20, 280);

      doc.save(`GSTR2B_Reconciliation_${clientId}.pdf`);

      toast.success('Reconciliation Report Downloaded.', {
        description: 'Check your downloads for the real PDF.',
      });
      setExporting(false);
    }, 1500);
  };

  const sampleData = () => {
    const sample = {
      items: [
        { supplier_gstin: '07AABCU9603R1ZP', invoice_number: 'INV-001', taxable_value: 100000, igst: 18000 },
        { supplier_gstin: '27AAPFU0939F1ZV', invoice_number: 'INV-002', taxable_value: 50000, cgst: 4500, sgst: 4500 },
        { supplier_gstin: '29AABCT1332L1ZN', invoice_number: 'INV-003', taxable_value: 25000, igst: 4500 },
      ],
    };
    setPurchaseRegisterJSON(JSON.stringify({ items: [...sample.items, { supplier_gstin: '06AAACT2727Q1ZX', invoice_number: 'INV-EXTRA', taxable_value: 30000, igst: 5400 }] }, null, 2));
    setGstr2bJSON(JSON.stringify({ items: [...sample.items, { supplier_gstin: '07AABCU9603R1ZP', invoice_number: 'INV-001', taxable_value: 90000, igst: 16200 }].slice(0, 3) }, null, 2));
    toast.info('Sample data loaded. INV-001 has ₹10K mismatch, INV-EXTRA is missing in portal.');
  };

  const handleReconcile = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    if (!purchaseRegisterJSON || !gstr2bJSON) { toast.error('Provide both Purchase Register and GSTR-2B data'); return; }

    let purchaseData: any, gstr2bData: any;
    try {
      purchaseData = JSON.parse(purchaseRegisterJSON);
      gstr2bData = JSON.parse(gstr2bJSON);
    } catch { toast.error('Invalid JSON format. Use the sample data loader to see the expected format.'); return; }

    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        setResult({
          summary: {
            alert: 'Reconciliation complete. 2 mismatches found. Recommend sending notices to vendors.',
            total_mismatches: 2,
            missing_in_2b: 1,
            missing_in_register: 0,
            amount_mismatches: 1,
            purchase_register_total: 180000,
            gstr2b_total: 162000,
            variance: 18000
          },
          mismatches: [
            { type: 'missing_in_2b', purchase: { invoice_number: 'INV-EXTRA', supplier_gstin: '06AAACT2727Q1ZX' }, action: 'Vendor hasn\'t filed GSTR-1. Send reminder.' },
            { type: 'amount_mismatch', purchase: { invoice_number: 'INV-001', supplier_gstin: '07AABCU9603R1ZP' }, gstr2b: { taxable_value: 90000 }, variance: 10000, action: 'Tax value mismatch. Verify with physical invoice.' }
          ]
        });
        toast.success('Reconciliation complete (Demo Mode)');
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/gstr2b/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, period_month: periodMonth, period_year: periodYear, purchase_register: { ...purchaseData, items: purchaseData.items }, gstr2b_data: gstr2bData }),
      });
      const data = await response.json();
      if (data.success) { setResult(data.data); toast.success('Reconciliation complete'); }
      else toast.error(data.error || 'Reconciliation failed');
    } catch { toast.error('Backend connection error. Ensure backend is running on port 3001.'); }
    finally { setLoading(false); }
  };

  const MISMATCH_COLORS: Record<string, string> = {
    missing_in_2b: 'border-red-500/30 bg-red-500/5',
    missing_in_register: 'border-yellow-500/30 bg-yellow-500/5',
    amount_mismatch: 'border-orange-500/30 bg-orange-500/5',
    matched: 'border-green-500/30 bg-green-500/5',
  };
  const MISMATCH_BADGE: Record<string, string> = {
    missing_in_2b: 'bg-red-500/20 text-red-400 border-red-500/30',
    missing_in_register: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    amount_mismatch: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    matched: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-violet-500/20 rounded-lg"><GitCompare className="w-5 h-5 text-violet-400" /></div>
        <div>
          <h3 className="font-bold text-lg">GSTR-2B Reconciliation</h3>
          <p className="text-xs text-muted-foreground">Portal GSTR-2B vs Purchase Register → auto-flag ITC mismatches, missing invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground">Month</label><Input type="number" min={1} max={12} value={periodMonth} onChange={e => setPeriodMonth(parseInt(e.target.value))} className="mt-1" /></div>
        <div><label className="text-xs text-muted-foreground">Year</label><Input type="number" value={periodYear} onChange={e => setPeriodYear(parseInt(e.target.value))} className="mt-1" /></div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={sampleData} className="text-xs border-violet-500/30 text-violet-400">Load Sample Data</Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Purchase Register Data (JSON)</label>
          <p className="text-xs text-muted-foreground mb-1">Fields: supplier_gstin, invoice_number, taxable_value, igst/cgst/sgst</p>
          <textarea
            value={purchaseRegisterJSON}
            onChange={e => setPurchaseRegisterJSON(e.target.value)}
            className="w-full h-28 text-xs font-mono p-2 rounded-lg bg-card/50 border border-border/30 resize-none focus:outline-none focus:border-violet-500/50"
            placeholder='{"items": [{"supplier_gstin": "07AABCU9603R1ZP", "invoice_number": "INV-001", "taxable_value": 100000, "igst": 18000}]}'
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">GSTR-2B Portal Data (JSON)</label>
          <p className="text-xs text-muted-foreground mb-1">In production: auto-fetched from GSTN portal using stored credentials</p>
          <textarea
            value={gstr2bJSON}
            onChange={e => setGstr2bJSON(e.target.value)}
            className="w-full h-28 text-xs font-mono p-2 rounded-lg bg-card/50 border border-border/30 resize-none focus:outline-none focus:border-violet-500/50"
            placeholder='{"items": [{"supplier_gstin": "07AABCU9603R1ZP", "invoice_number": "INV-001", "taxable_value": 100000, "igst": 18000}]}'
          />
        </div>
      </div>

      <Button onClick={handleReconcile} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <GitCompare className="w-4 h-4 mr-2" />}
        Run Reconciliation
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Alert Banner */}
          <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl flex items-start gap-2">
            <Bell className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
            <p className="text-sm">{result.summary?.alert}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Total Mismatches', val: result.summary?.total_mismatches, color: result.summary?.total_mismatches > 0 ? 'text-red-400' : 'text-green-400' },
              { label: 'Missing in 2B', val: result.summary?.missing_in_2b, color: 'text-red-400' },
              { label: 'Missing in Register', val: result.summary?.missing_in_register, color: 'text-yellow-400' },
              { label: 'Amount Mismatches', val: result.summary?.amount_mismatches, color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="p-2 bg-card/50 border border-border/30 rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Variance */}
          <div className="flex items-center gap-3 p-3 bg-card/30 border border-border/30 rounded-lg">
            <div className="text-center"><p className="text-xs text-muted-foreground">Purchase Register</p><p className="font-bold">₹{result.summary?.purchase_register_total?.toLocaleString('en-IN')}</p></div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="text-center"><p className="text-xs text-muted-foreground">GSTR-2B Portal</p><p className="font-bold">₹{result.summary?.gstr2b_total?.toLocaleString('en-IN')}</p></div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="text-center"><p className="text-xs text-muted-foreground">Variance</p><p className={`font-bold ${result.summary?.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>₹{result.summary?.variance?.toLocaleString('en-IN')}</p></div>
          </div>

          {/* Mismatch List */}
          {result.mismatches?.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              <p className="text-xs font-bold text-muted-foreground">Mismatch Details</p>
              {result.mismatches.map((m: any, i: number) => (
                <div key={i} className={`p-3 rounded-lg border space-y-1 ${MISMATCH_COLORS[m.type] || 'border-border/30'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono">{m.purchase?.invoice_number || m.gstr2b?.invoice_number}</span>
                    <Badge className={`text-[10px] border ${MISMATCH_BADGE[m.type]}`}>{m.type?.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{m.purchase?.supplier_gstin || m.gstr2b?.supplier_gstin}</p>
                  {m.variance !== undefined && <p className="text-xs font-semibold">Variance: ₹{Math.abs(m.variance)?.toLocaleString('en-IN')}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11px] text-blue-400 font-medium">→ {m.action}</p>
                    <Button 
                      size="sm" variant="ghost" 
                      className="h-6 text-[10px] bg-violet-500/10 hover:bg-violet-500/20 text-violet-400"
                      onClick={() => triggerAI(`Draft DRC-01 response for ITC mismatch of ₹${m.variance}. Invoice: ${m.purchase?.invoice_number || m.gstr2b?.invoice_number}`, m)}
                    >
                      <Zap className="w-3 h-3 mr-1" /> Ask AI to resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {result.mismatches?.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-sm font-medium text-green-400">All invoices matched. Purchase register is fully reconciled with GSTR-2B.</p>
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={exporting}
            className="w-full border-violet-500/30 text-violet-400 hover:bg-violet-500/10 mt-2"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? 'Generating Reconciliation Report...' : 'Export Government PDF'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
