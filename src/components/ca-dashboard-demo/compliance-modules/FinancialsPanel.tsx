import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Upload, Download, RefreshCw, AlertTriangle, CheckCircle, FileText, XCircle, BarChart3 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string);
const API_BASE = `${CA_API}/api/v1/compliance`;

export default function FinancialsPanel({ clientId, isDemo }: { clientId?: string; isDemo?: boolean }) {
  const [activeReport, setActiveReport] = useState<'balance-sheet' | 'pl-statement' | 'cash-flow'>('balance-sheet');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [glFile, setGlFile] = useState<File | null>(null);
  const [plForm, setPlForm] = useState({ revenue: '', cogs: '', expenses: '', finance_charges: '', other_income: '', tax_provision: '' });
  const [cfForm, setCfForm] = useState({ pat: '', depreciation: '', debtors_change: '', inventory_change: '', creditors_change: '', asset_purchases: '', asset_sales: '', loans_received: '', loans_repaid: '', dividends_paid: '', opening_cash: '' });

  const handleGenerate = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        if (activeReport === 'balance-sheet') {
          setResult({
            totals: { is_balanced: true, total_assets: 2500000, total_liabilities_equity: 2500000 },
            validation: { message: 'Asset = Liability + Equity (Verified)' },
            balance_sheet: { fixed_assets: { net_book_value: 1500000 }, current_assets: { total: 1000000 } }
          });
        } else if (activeReport === 'pl-statement') {
          const rev = parseFloat(plForm.revenue || '5000000');
          setResult({
            pl_statement: { revenue: rev, gross_profit: rev * 0.4, operating_profit_ebit: rev * 0.25, profit_before_tax: rev * 0.22, profit_after_tax: rev * 0.18 },
            margins: { gross_margin_pct: 40, operating_margin_pct: 25, net_margin_pct: 18 }
          });
        } else {
          setResult({
            dashboard: 'Positive Cash Flow — Strong liquidity position.',
            cash_flow: { operating: { total: 850000 }, investing: { total: -400000 }, financing: { total: -200000 }, net_cash_flow: 250000, closing_cash: 500000 }
          });
        }
        toast.success(`${activeReport.replace('-', ' ')} generated (Demo Mode)`);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const endpoint = `${API_BASE}/${activeReport}/generate`;
      let body: any;

      if (activeReport === 'balance-sheet') {
        const formData = new FormData();
        formData.append('client_id', clientId);
        formData.append('financial_year', financialYear);
        if (glFile) formData.append('gl_csv', glFile);
        const response = await fetch(endpoint, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) { setResult(data.data); toast.success('Balance sheet generated'); } else toast.error(data.error);
        setLoading(false); return;
      }

      if (activeReport === 'pl-statement') {
        body = { client_id: clientId, financial_year: financialYear, revenue: parseFloat(plForm.revenue || '0'), cogs: parseFloat(plForm.cogs || '0'), expenses: { total: parseFloat(plForm.expenses || '0') }, finance_charges: parseFloat(plForm.finance_charges || '0'), other_income: parseFloat(plForm.other_income || '0'), tax_provision: parseFloat(plForm.tax_provision || '0') };
      } else {
        body = { client_id: clientId, financial_year: financialYear, pat: parseFloat(cfForm.pat || '0'), depreciation: parseFloat(cfForm.depreciation || '0'), working_capital_changes: { debtors_change: parseFloat(cfForm.debtors_change || '0'), inventory_change: parseFloat(cfForm.inventory_change || '0'), creditors_change: parseFloat(cfForm.creditors_change || '0') }, investing_activities: { asset_purchases: parseFloat(cfForm.asset_purchases || '0'), asset_sales: parseFloat(cfForm.asset_sales || '0') }, financing_activities: { loans_received: parseFloat(cfForm.loans_received || '0'), loans_repaid: parseFloat(cfForm.loans_repaid || '0'), dividends_paid: parseFloat(cfForm.dividends_paid || '0') }, opening_cash: parseFloat(cfForm.opening_cash || '0') };
      }

      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (data.success) { setResult(data.data); toast.success(`${activeReport.replace('-', ' ')} generated`); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!result) {
      toast.error('Generate the statements first before exporting.');
      return;
    }
    setExporting(true);
    toast.info(`Preparing ${activeReport.replace('-', ' ').toUpperCase()} Document...`, { duration: 1000 });
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(79, 70, 229); // Indigo-600
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('SANNIDH | FINANCIAL REPORTING', 20, 25);
        doc.setFontSize(10);
        doc.text(`Schedule III Compliance - FY ${financialYear}`, 20, 32);

        // Report Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(activeReport.replace('-', ' ').toUpperCase(), 20, 55);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Company/Client ID: ${clientId || 'DEMO_CLIENT'}`, 20, 65);
        doc.text(`Currency: INR (Figures in Absolute)`, 20, 70);

        // Tables
        doc.setDrawColor(230, 230, 230);
        doc.line(20, 80, 190, 80);
        
        let y = 95;
        doc.setFont('helvetica', 'bold');
        doc.text('PARTICULARS', 20, 90);
        doc.text('AMOUNT (RS.)', 150, 90);
        doc.line(20, 92, 190, 92);
        doc.setFont('helvetica', 'normal');

        if (activeReport === 'balance-sheet' && result?.totals) {
          doc.text('I. EQUITY AND LIABILITIES', 20, y);
          y += 10;
          doc.text('   Shareholder Funds', 20, y);
          doc.text((result?.equity_liabilities?.shareholders_funds?.total || 0).toLocaleString(), 150, y);
          y += 10;
          doc.text('   Non-Current Liabilities', 20, y);
          doc.text((result?.equity_liabilities?.non_current_liabilities?.total || 0).toLocaleString(), 150, y);
          y += 10;
          doc.setFont('helvetica', 'bold');
          doc.text('TOTAL EQUITY AND LIABILITIES', 20, y);
          doc.text((result?.totals?.total_liabilities_equity || 0).toLocaleString(), 150, y);
          
          y += 20;
          doc.text('II. ASSETS', 20, y);
          y += 10;
          doc.setFont('helvetica', 'normal');
          doc.text('   Non-Current Assets', 20, y);
          doc.text((result?.assets?.non_current_assets?.total || 0).toLocaleString(), 150, y);
          y += 10;
          doc.text('   Current Assets', 20, y);
          doc.text((result?.assets?.current_assets?.total || 0).toLocaleString(), 150, y);
          y += 10;
          doc.setFont('helvetica', 'bold');
          doc.text('TOTAL ASSETS', 20, y);
          doc.text((result?.totals?.total_assets || 0).toLocaleString(), 150, y);
        } else if (activeReport === 'pl-statement' && result?.pl_statement) {
          doc.text('Revenue from Operations', 20, y);
          doc.text((result?.pl_statement?.revenue || 0).toLocaleString(), 150, y);
          y += 10;
          doc.text('Other Income', 20, y);
          doc.text('0', 150, y);
          y += 10;
          doc.setFont('helvetica', 'bold');
          doc.text('TOTAL INCOME', 20, y);
          doc.text((result?.pl_statement?.revenue || 0).toLocaleString(), 150, y);
          
          y += 20;
          doc.setFont('helvetica', 'normal');
          doc.text('Cost of Materials Consumed', 20, y);
          doc.text((result?.pl_statement?.cost_of_sales || 0).toLocaleString(), 150, y);
          y += 10;
          doc.setFont('helvetica', 'bold');
          doc.text('PROFIT BEFORE TAX (PBT)', 20, y);
          doc.text((result?.pl_statement?.profit_before_tax || 0).toLocaleString(), 150, y);
          y += 10;
          doc.text('PROFIT AFTER TAX (PAT)', 20, y);
          doc.text((result?.pl_statement?.profit_after_tax || 0).toLocaleString(), 150, y);
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Report Generation: ${new Date().toLocaleString()} | Sannidh AI Certified`, 20, 280);

        doc.save(`${activeReport.replace('-', '_')}_${clientId || 'DEMO'}.pdf`);

        toast.success('Financial Statement Downloaded.');
      } catch (err) {
        console.error('PDF Generation Error:', err);
        toast.error('Failed to generate Financials PDF.');
      } finally {
        setExporting(false);
      }
    }, 1500);
  };

  const f = (label: string, key: string, form: any, setter: any) => (
    <div><label className="text-xs text-muted-foreground">{label} (₹)</label><Input type="number" min={0} value={form[key]} onChange={e => setter({...form, [key]: e.target.value})} className="mt-1" placeholder="0" /></div>
  );

  const reportTabs = [{ id: 'balance-sheet', label: 'Balance Sheet' }, { id: 'pl-statement', label: 'P&L Statement' }, { id: 'cash-flow', label: 'Cash Flow' }];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-yellow-500/20 rounded-lg"><BarChart3 className="w-5 h-5 text-yellow-400" /></div>
        <div>
          <h3 className="font-bold text-lg">Financial Statements Generator</h3>
          <p className="text-xs text-muted-foreground">Balance Sheet (A=L+E validated) | P&L with margins | Cash Flow</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {reportTabs.map(t => <Button key={t.id} variant={activeReport === t.id ? 'default' : 'outline'} size="sm" onClick={() => { setActiveReport(t.id as any); setResult(null); }}>{t.label}</Button>)}
      </div>

      <div><label className="text-xs text-muted-foreground">Financial Year</label>
        <Select value={financialYear} onValueChange={setFinancialYear}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['2024-25', '2023-24', '2022-23'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {activeReport === 'balance-sheet' && (
        <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => document.getElementById('gl-file')?.click()}>
          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">{glFile ? glFile.name : 'Upload GL CSV (General Ledger)'}</p>
          <p className="text-xs text-muted-foreground mt-1">Columns: account_name, account_type, account_category, closing_balance, cost (for fixed assets), asset_category</p>
          <input id="gl-file" type="file" accept=".csv" className="hidden" onChange={e => setGlFile(e.target.files?.[0] || null)} />
        </div>
      )}

      {activeReport === 'pl-statement' && (
        <div className="grid grid-cols-2 gap-2">
          {f('Revenue (Turnover)', 'revenue', plForm, setPlForm)}
          {f('Cost of Goods Sold', 'cogs', plForm, setPlForm)}
          {f('Operating Expenses', 'expenses', plForm, setPlForm)}
          {f('Finance Charges', 'finance_charges', plForm, setPlForm)}
          {f('Other Income', 'other_income', plForm, setPlForm)}
          {f('Tax Provision', 'tax_provision', plForm, setPlForm)}
        </div>
      )}

      {activeReport === 'cash-flow' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-green-400">Operating Activities</p>
          <div className="grid grid-cols-2 gap-2">{f('PAT (Net Profit)', 'pat', cfForm, setCfForm)}{f('Depreciation', 'depreciation', cfForm, setCfForm)}{f('Change in Debtors', 'debtors_change', cfForm, setCfForm)}{f('Change in Inventory', 'inventory_change', cfForm, setCfForm)}{f('Change in Creditors', 'creditors_change', cfForm, setCfForm)}</div>
          <p className="text-xs font-semibold text-blue-400">Investing</p>
          <div className="grid grid-cols-2 gap-2">{f('Asset Purchases', 'asset_purchases', cfForm, setCfForm)}{f('Asset Sales', 'asset_sales', cfForm, setCfForm)}</div>
          <p className="text-xs font-semibold text-purple-400">Financing</p>
          <div className="grid grid-cols-2 gap-2">{f('Loans Received', 'loans_received', cfForm, setCfForm)}{f('Loans Repaid', 'loans_repaid', cfForm, setCfForm)}{f('Dividends Paid', 'dividends_paid', cfForm, setCfForm)}{f('Opening Cash', 'opening_cash', cfForm, setCfForm)}</div>
        </div>
      )}

      <Button onClick={handleGenerate} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-700">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
        Generate {reportTabs.find(t => t.id === activeReport)?.label}
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 max-h-80 overflow-y-auto">
          {activeReport === 'balance-sheet' && result.totals && (
            <div className="space-y-2">
              <div className={`p-3 rounded-lg border flex items-center gap-2 ${result.totals.is_balanced ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                {result.totals.is_balanced ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                <p className="text-sm font-bold">{result.validation?.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[['Total Assets', result.totals?.total_assets], ['Total Liabilities + Equity', result.totals?.total_liabilities_equity], ['Fixed Assets (NBV)', result.balance_sheet?.fixed_assets?.net_book_value], ['Current Assets', result.balance_sheet?.current_assets?.total]].map(([l, v]) => (
                  <div key={l as string} className="p-2 bg-card/50 border border-border/30 rounded-lg"><p className="text-xs text-muted-foreground">{l}</p><p className="font-bold">₹{(v as number)?.toLocaleString()}</p></div>
                ))}
              </div>
            </div>
          )}

          {activeReport === 'pl-statement' && result.pl_statement && (
            <div className="space-y-2">
              {[['Revenue', result.pl_statement.revenue, 'text-blue-400'], ['Gross Profit', result.pl_statement.gross_profit, 'text-green-400'], ['Operating Profit', result.pl_statement.operating_profit_ebit, 'text-yellow-400'], ['PBT', result.pl_statement.profit_before_tax, 'text-orange-400'], ['PAT (Net Profit)', result.pl_statement.profit_after_tax, 'text-emerald-400']].map(([l, v, c]) => (
                <div key={l as string} className="flex justify-between items-center p-2 border-b border-border/20"><p className="text-sm text-muted-foreground">{l}</p><p className={`font-bold ${c}`}>₹{(v as number)?.toLocaleString('en-IN')}</p></div>
              ))}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[['Gross Margin', result.margins?.gross_margin_pct + '%'], ['Op. Margin', result.margins?.operating_margin_pct + '%'], ['Net Margin', result.margins?.net_margin_pct + '%']].map(([l, v]) => (
                  <div key={l as string} className="p-2 bg-card/50 border border-border/30 rounded text-center"><p className="text-xs text-muted-foreground">{l}</p><p className="font-bold">{v}</p></div>
                ))}
              </div>
            </div>
          )}

          {activeReport === 'cash-flow' && result.cash_flow && (
            <div className="space-y-2">
              <p className="text-sm font-bold">{result.dashboard}</p>
              {[['Operating CF', result.cash_flow.operating?.total, 'text-green-400'], ['Investing CF', result.cash_flow.investing?.total, 'text-blue-400'], ['Financing CF', result.cash_flow.financing?.total, 'text-purple-400'], ['Net Cash Flow', result.cash_flow.net_cash_flow, 'text-yellow-400'], ['Closing Cash', result.cash_flow.closing_cash, 'text-emerald-400']].map(([l, v, c]) => (
                <div key={l as string} className="flex justify-between items-center p-2 border-b border-border/20"><p className="text-sm text-muted-foreground">{l}</p><p className={`font-bold ${c}`}>₹{(v as number)?.toLocaleString()}</p></div>
              ))}
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={exporting}
            className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 mt-2"
          >
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? 'Generating Document...' : 'Export Government PDF'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
