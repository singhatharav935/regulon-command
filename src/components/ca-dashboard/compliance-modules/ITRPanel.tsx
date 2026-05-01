import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, RefreshCw, AlertTriangle, CheckCircle, Zap, Calculator, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const API_BASE = `${CA_API}/api/v1/compliance`;

export default function ITRPanel({ clientId, isDemo }: { clientId?: string; isDemo?: boolean }) {
  const [itrType, setItrType] = useState<'itr3' | 'itr4'>('itr3');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [itr3Form, setItr3Form] = useState({ gross_profit: '', depreciation: '', rent: '', salary: '', audit_fees: '', entertainment: '', foreign_travel: '', advance_tax: '', tds: '' });
  const [itr4Form, setItr4Form] = useState({ turnover: '', business_type: 'service', advance_tax: '', tds: '' });

  const handleCalculate = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        const income = itrType === 'itr3' ? parseFloat(itr3Form.gross_profit || '0') * 0.8 : parseFloat(itr4Form.turnover || '0') * (itr4Form.business_type === 'service' ? 0.06 : 0.08);
        const tax = income > 700000 ? (income - 700000) * 0.15 : 0;
        
        setResult({
          summary: `ITR-${itrType.slice(-1)} computation finalized for Assessment Year 2025-26.`,
          assessment_year: '2025-26',
          computation: {
            net_taxable_income: Math.round(income),
            tax_at_slab: Math.round(tax),
            surcharge: 0,
            health_education_cess: Math.round(tax * 0.04),
            total_tax_liability: Math.round(tax * 1.04),
            tax_payable: Math.round(tax * 1.04)
          },
          alert: income > 1000000 ? 'Income exceeds ₹10L. Audit may be required under certain conditions.' : null
        });
        toast.success(`ITR-${itrType.slice(-1)} calculated (Demo Mode)`);
        setLoading(false);
      }, 700);
      return;
    }

    try {
      const endpoint = `${API_BASE}/${itrType}/generate`;
      const body = itrType === 'itr3' ? {
        client_id: clientId, assessment_year: '2025-26',
        gross_profit: parseFloat(itr3Form.gross_profit || '0'),
        deductions: { total: [itr3Form.depreciation, itr3Form.rent, itr3Form.salary, itr3Form.audit_fees].reduce((s, v) => s + parseFloat(v || '0'), 0), depreciation: parseFloat(itr3Form.depreciation || '0'), rent: parseFloat(itr3Form.rent || '0'), salary: parseFloat(itr3Form.salary || '0'), audit_fees: parseFloat(itr3Form.audit_fees || '0'), entertainment: parseFloat(itr3Form.entertainment || '0'), foreign_travel: parseFloat(itr3Form.foreign_travel || '0') },
        advance_tax_paid: parseFloat(itr3Form.advance_tax || '0'), tds_deducted: parseFloat(itr3Form.tds || '0'),
      } : {
        client_id: clientId, assessment_year: '2025-26',
        turnover: parseFloat(itr4Form.turnover || '0'), business_type: itr4Form.business_type,
        advance_tax_paid: parseFloat(itr4Form.advance_tax || '0'), tds_deducted: parseFloat(itr4Form.tds || '0'),
      };

      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (data.success) { setResult(data.data); toast.success(`${itrType.toUpperCase()} calculated`); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!result) {
      toast.error('Generate the assessment first before exporting.');
      return;
    }
    setExporting(true);
    toast.info(`Preparing ITR-${itrType.slice(-1)} Official Assessment Draft...`, { duration: 1000 });
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(5, 150, 105); // Emerald-600
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('SANNIDH | INCOME TAX DEPT', 20, 25);
        doc.setFontSize(10);
        doc.text(`A.Y. ${result?.assessment_year || '2024-25'} - Assessment Computation Draft`, 20, 32);

        // Personal Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`ITR-${itrType.slice(-1).toUpperCase()} DRAFT ASSESSMENT`, 20, 55);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`PAN/Client ID: ${clientId || 'DEMO_CLIENT'}`, 20, 65);
        doc.text(`Status: DRAFT READY`, 20, 70);

        // Computation Grid
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 80, 190, 80);
        
        doc.setFont('helvetica', 'bold');
        doc.text('HEADS OF INCOME', 20, 90);
        doc.text('AMOUNT (RS.)', 150, 90);
        doc.line(20, 93, 190, 93);

        doc.setFont('helvetica', 'normal');
        doc.text('Gross Taxable Income', 20, 105);
        doc.text((result?.computation?.net_taxable_income || 0).toLocaleString(), 150, 105);
        
        doc.text('Less: Deductions under Chapter VI-A', 20, 115);
        doc.text('(0)', 150, 115);

        doc.setFont('helvetica', 'bold');
        doc.text('NET TAXABLE INCOME', 20, 125);
        doc.text((result?.computation?.net_taxable_income || 0).toLocaleString(), 150, 125);

        doc.line(20, 130, 190, 130);
        
        doc.setFont('helvetica', 'normal');
        doc.text('Tax at Normal Slab Rates', 20, 140);
        doc.text((result?.computation?.tax_at_slab || 0).toLocaleString(), 150, 140);

        doc.text('Add: Health & Education Cess (4%)', 20, 150);
        doc.text((result?.computation?.health_education_cess || 0).toLocaleString(), 150, 150);

        doc.line(140, 155, 190, 155);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL TAX PAYABLE', 20, 165);
        doc.text(`Rs. ${(result?.computation?.total_tax_liability || 0).toLocaleString()}`, 150, 165);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Assessment Timestamp: ${new Date().toLocaleString()}`, 20, 280);
        doc.text('Sannidh AI Compliance Verification System', 130, 280);

        doc.save(`ITR_${itrType.toUpperCase()}_Draft_${clientId || 'DEMO'}.pdf`);

        toast.success('ITR Draft Downloaded successfully.');
      } catch (err) {
        console.error('PDF Generation Error:', err);
        toast.error('Failed to generate ITR PDF.');
      } finally {
        setExporting(false);
      }
    }, 1500);
  };

  const f = (label: string, key: string, setter: any, form: any) => (
    <div>
      <label className="text-xs text-muted-foreground">{label} (₹)</label>
      <Input type="number" min={0} value={form[key]} onChange={e => setter({ ...form, [key]: e.target.value })} className="mt-1" placeholder="0" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-purple-500/20 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-400" /></div>
        <div>
          <h3 className="font-bold text-lg">ITR Auto-Generator</h3>
          <p className="text-xs text-muted-foreground">ITR-3 (Accounts) & ITR-4 (Presumptive) with real tax slab calculations</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant={itrType === 'itr3' ? 'default' : 'outline'} size="sm" onClick={() => { setItrType('itr3'); setResult(null); }}>ITR-3 (Full Books)</Button>
        <Button variant={itrType === 'itr4' ? 'default' : 'outline'} size="sm" onClick={() => { setItrType('itr4'); setResult(null); }}>ITR-4 (Presumptive)</Button>
      </div>

      {itrType === 'itr3' && (
        <div className="space-y-3">
          {f('Gross Profit', 'gross_profit', setItr3Form, itr3Form)}
          <p className="text-xs font-semibold text-green-400">Allowable Deductions</p>
          <div className="grid grid-cols-2 gap-2">
            {f('Depreciation', 'depreciation', setItr3Form, itr3Form)}
            {f('Rent', 'rent', setItr3Form, itr3Form)}
            {f('Salary', 'salary', setItr3Form, itr3Form)}
            {f('Audit Fees', 'audit_fees', setItr3Form, itr3Form)}
          </div>
          <p className="text-xs font-semibold text-yellow-400">Disallowable Expenditure</p>
          <div className="grid grid-cols-2 gap-2">
            {f('Entertainment (1% disallowed)', 'entertainment', setItr3Form, itr3Form)}
            {f('Foreign Travel (2% disallowed)', 'foreign_travel', setItr3Form, itr3Form)}
          </div>
          <p className="text-xs font-semibold text-blue-400">Taxes Already Paid</p>
          <div className="grid grid-cols-2 gap-2">
            {f('Advance Tax Paid', 'advance_tax', setItr3Form, itr3Form)}
            {f('TDS Deducted', 'tds', setItr3Form, itr3Form)}
          </div>
        </div>
      )}

      {itrType === 'itr4' && (
        <div className="space-y-3">
          {f('Annual Turnover', 'turnover', setItr4Form, itr4Form)}
          <div>
            <label className="text-xs text-muted-foreground">Business Type</label>
            <Select value={itr4Form.business_type} onValueChange={v => setItr4Form({ ...itr4Form, business_type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service (6% presumptive)</SelectItem>
                <SelectItem value="trading">Trading (8% presumptive)</SelectItem>
                <SelectItem value="manufacturing">Manufacturing (8% presumptive)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {f('Advance Tax Paid', 'advance_tax', setItr4Form, itr4Form)}
            {f('TDS Deducted', 'tds', setItr4Form, itr4Form)}
          </div>
        </div>
      )}

      <Button onClick={handleCalculate} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
        Calculate Tax Liability
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {result.alert && <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">{result.alert}</div>}
          <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
            <p className="font-bold text-purple-400 text-sm">{result.summary}</p>
            <p className="text-xs text-muted-foreground mt-1">Assessment Year: {result.assessment_year}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {result.computation && Object.entries({ 'Net Taxable Income': result.computation.net_taxable_income, 'Tax at Slab': result.computation.tax_at_slab, 'Surcharge': result.computation.surcharge, 'Health & Edu Cess (4%)': result.computation.health_education_cess, 'Total Tax Liability': result.computation.total_tax_liability, 'Tax Payable Now': result.computation.tax_payable }).map(([k, v]) => (
              <div key={k} className={`p-2 rounded-lg bg-card/50 border border-border/30 ${k === 'Tax Payable Now' ? 'border-red-500/30 bg-red-500/10' : ''}`}>
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className={`font-bold ${k === 'Tax Payable Now' ? 'text-red-400' : 'text-foreground'}`}>₹{(v as number)?.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={exporting}
            className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 mt-2"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? 'Generating ITR XML...' : 'Export Government PDF'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
