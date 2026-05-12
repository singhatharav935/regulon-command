import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export function CALedgerOverride({ companyId, financialYear, onMathFinalized }: { companyId: string, financialYear: string, onMathFinalized: () => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [inputs, setInputs] = useState({
    applicable_gst_rate: 18,
    verified_itc_gstr2b: 0,
    sec_80c_deductions: 0,
    sec_80d_deductions: 0,
    advance_tax_paid: 0,
    outward_invoices_count: 0,
    total_receivables: 0,
    receivables_over_90_days: 0,
    gross_block: 0,
    total_employees: 0,
    board_meetings_held: 0,
    agm_date: '',
    tally_sync_status: 'Not Connected'
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLedger();
  }, [companyId]);

  const fetchLedger = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('client_bank_transactions')
      .select('*')
      .eq('company_id', companyId)
      .eq('ca_verified', false)
      .order('transaction_date', { ascending: false });

    if (data) setTransactions(data);
    setLoading(false);
  };

  const updateCategory = async (id: string, newCategory: string) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, ai_category: newCategory } : t));
    await supabase.from('client_bank_transactions').update({ ai_category: newCategory }).eq('id', id);
  };

  const handleFinalize = async () => {
    setProcessing(true);
    try {
      // 1. Mark transactions as CA verified
      if (transactions.length > 0) {
        await supabase
          .from('client_bank_transactions')
          .update({ ca_verified: true })
          .eq('company_id', companyId)
          .eq('ca_verified', false);
      }

      // 2. Save Statutory Inputs
      await supabase.from('client_statutory_inputs').upsert({
        company_id: companyId,
        financial_year: financialYear,
        ...inputs
      });

      // 3. Trigger Swarm Final Math
      const { data: caUser } = await supabase.auth.getUser();
      const { data: edgeRes, error } = await supabase.functions.invoke('ai-financial-swarm', {
        body: {
          action: 'finalize_math',
          company_id: companyId,
          ca_user_id: caUser?.user?.id,
          financial_year: financialYear
        }
      });

      if (error) throw error;

      toast.success("Ledger Verified & Statutory Math Complete!");
      onMathFinalized();

    } catch (err: any) {
      toast.error(err.message || "Failed to finalize math");
    }
    setProcessing(false);
  };

  if (loading) return <div className="p-4 text-center text-blue-400">Loading AI Categorized Ledger...</div>;
  if (transactions.length === 0) return null; // Hide if nothing to verify

  return (
    <Card className="bg-slate-900/50 border-orange-500/30 mb-8 overflow-hidden">
      <CardHeader className="bg-orange-500/10 border-b border-orange-500/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-orange-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              CA Override Required: Ledger Verification
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1">Review the AI's categorizations and provide strict statutory inputs before running the final tax calculations.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        
        {/* Ledger Review */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-300">1. Verify AI Categorization</h3>
          <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Debit (₹)</th>
                  <th className="px-4 py-3 text-right">Credit (₹)</th>
                  <th className="px-4 py-3">AI Prediction (Override)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={t.id || i} className="border-b border-slate-800/50">
                    <td className="px-4 py-3 text-slate-300">{t.transaction_date}</td>
                    <td className="px-4 py-3 text-slate-300 font-medium">{t.description}</td>
                    <td className="px-4 py-3 text-right text-red-400">{t.debit_amount > 0 ? t.debit_amount : '-'}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{t.credit_amount > 0 ? t.credit_amount : '-'}</td>
                    <td className="px-4 py-3">
                      <Select value={t.ai_category} onValueChange={(val) => updateCategory(t.id, val)}>
                        <SelectTrigger className="h-8 bg-slate-800 border-slate-700 w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="salary">Salary/Payroll</SelectItem>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="gst_payment">GST Payment</SelectItem>
                          <SelectItem value="tds_payment">TDS Payment</SelectItem>
                          <SelectItem value="capex">Capital Expenditure</SelectItem>
                          <SelectItem value="utilities">Utilities & Opex</SelectItem>
                          <SelectItem value="uncategorized">Uncategorized</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statutory Inputs */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="font-semibold text-slate-300">2. Tax & Deductions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Applicable GST Rate (%)</label>
              <Input type="number" value={inputs.applicable_gst_rate} onChange={e => setInputs({...inputs, applicable_gst_rate: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Verified ITC from GSTR-2B (₹)</label>
              <Input type="number" value={inputs.verified_itc_gstr2b} onChange={e => setInputs({...inputs, verified_itc_gstr2b: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Advance Tax Paid (₹)</label>
              <Input type="number" value={inputs.advance_tax_paid} onChange={e => setInputs({...inputs, advance_tax_paid: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Section 80C Deductions (₹)</label>
              <Input type="number" value={inputs.sec_80c_deductions} onChange={e => setInputs({...inputs, sec_80c_deductions: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Section 80D Deductions (₹)</label>
              <Input type="number" value={inputs.sec_80d_deductions} onChange={e => setInputs({...inputs, sec_80d_deductions: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
          </div>
        </div>

        {/* Deep Statutory Integrations */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="font-semibold text-slate-300">3. Deep Statutory Integrations (Optional)</h3>
          <p className="text-xs text-slate-400 mb-2">Fill these values to simulate Tally/Payroll sync and unlock calculations for the other 22 compliance modules.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Total Receivables (₹)</label>
              <Input type="number" value={inputs.total_receivables} onChange={e => setInputs({...inputs, total_receivables: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Receivables &gt; 90 Days (₹)</label>
              <Input type="number" value={inputs.receivables_over_90_days} onChange={e => setInputs({...inputs, receivables_over_90_days: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Outward Invoices Count</label>
              <Input type="number" value={inputs.outward_invoices_count} onChange={e => setInputs({...inputs, outward_invoices_count: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Total Employees</label>
              <Input type="number" value={inputs.total_employees} onChange={e => setInputs({...inputs, total_employees: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Gross Block (Assets)</label>
              <Input type="number" value={inputs.gross_block} onChange={e => setInputs({...inputs, gross_block: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Board Meetings Held</label>
              <Input type="number" value={inputs.board_meetings_held} onChange={e => setInputs({...inputs, board_meetings_held: Number(e.target.value)})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">AGM Date</label>
              <Input type="date" value={inputs.agm_date} onChange={e => setInputs({...inputs, agm_date: e.target.value})} className="bg-slate-900 border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Tally Sync Status</label>
              <Select value={inputs.tally_sync_status} onValueChange={(val) => setInputs({...inputs, tally_sync_status: val})}>
                <SelectTrigger className="h-10 bg-slate-900 border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Connected">Not Connected</SelectItem>
                  <SelectItem value="Connected">Connected</SelectItem>
                  <SelectItem value="Sync Failed">Sync Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleFinalize} 
          disabled={processing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-[0_0_15px_rgba(37,99,235,0.4)]"
        >
          {processing ? 'Running Deep Math...' : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Approve Ledger & Calculate Real 26 Modules
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
