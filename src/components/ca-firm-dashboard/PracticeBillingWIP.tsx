import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Plus, X, Loader2, CheckCircle2, IndianRupee, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirmInvoices, useCreateInvoice, useUpdateInvoiceStatus, useFirmClients } from '@/hooks/personas/useCAFirmData';
import { toast } from 'sonner';

interface Props { firmId: string; }

const STATUS: Record<string, { label: string; style: string }> = {
  draft:   { label: 'DRAFT',   style: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  sent:    { label: 'SENT',    style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  paid:    { label: 'PAID',    style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  overdue: { label: 'OVERDUE', style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  pending: { label: 'PENDING', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

export default function PracticeBillingWIP({ firmId }: Props) {
  const { data: invoices, isLoading } = useFirmInvoices(firmId);
  const { data: clients } = useFirmClients(firmId);
  const createInvoice = useCreateInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const [panel, setPanel] = useState(false);
  const [form, setForm] = useState({ client_id: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'draft' });

  const paid = useMemo(() => (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0), [invoices]);
  const unpaid = useMemo(() => (invoices || []).filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount || 0), 0), [invoices]);
  const overdueAmt = useMemo(() => (invoices || []).filter(i => i.status === 'overdue').reduce((s, i) => s + (i.amount || 0), 0), [invoices]);

  const save = async () => {
    if (!form.client_id || !form.amount) { toast.error('Client and amount required.'); return; }
    try {
      await createInvoice.mutateAsync({ firm_id: firmId, client_id: form.client_id, amount: parseFloat(form.amount), date: form.date, status: form.status });
      toast.success('Invoice created!');
      setForm({ client_id: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'draft' });
      setPanel(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const markPaid = async (id: string) => {
    try { await updateStatus.mutateAsync({ id, status: 'paid', firmId }); toast.success('Marked as paid!'); }
    catch (e: any) { toast.error(e.message); }
  };

  const markOverdue = async (id: string) => {
    try { await updateStatus.mutateAsync({ id, status: 'overdue', firmId }); toast.warning('Marked as overdue.'); }
    catch (e: any) { toast.error(e.message); }
  };

  const clientName = (id: string) => (clients || []).find(c => c.id === id)?.company_name || '—';

  const summaries = [
    { label: 'Revenue Collected', value: `₹${(paid/100000).toFixed(2)}L`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Outstanding WIP', value: `₹${(unpaid/100000).toFixed(2)}L`, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Overdue Amount', value: `₹${(overdueAmt/100000).toFixed(2)}L`, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Total Invoices', value: `${(invoices || []).length}`, icon: Receipt, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Billing & WIP</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track Work-In-Progress, create invoices, manage receivables</p>
        </div>
        <Button onClick={() => setPanel(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20">
          <Plus className="w-4 h-4 mr-1.5" /> New Invoice
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaries.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-[#0f0f1e] border border-white/[0.06] rounded-2xl p-4">
              <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-white">{isLoading ? '—' : s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Invoice Table */}
      <div className="bg-[#0f0f1e] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.05] text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Client</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : (invoices || []).length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No invoices yet</p>
            <p className="text-slate-600 text-xs mt-1">Create your first invoice above.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {(invoices || []).map((inv, i) => {
              const s = STATUS[inv.status] || STATUS.draft;
              return (
                <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-4 font-medium text-sm text-white truncate">{clientName(inv.client_id)}</div>
                  <div className="col-span-2 text-right font-semibold text-white text-sm">
                    ₹{(inv.amount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="col-span-2 text-xs text-slate-500">
                    {inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                  </div>
                  <div className="col-span-2">
                    <Badge className={`border text-[10px] ${s.style}`}>{s.label}</Badge>
                  </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    {inv.status !== 'paid' && (
                      <Button size="sm" variant="outline" onClick={() => markPaid(inv.id)} disabled={updateStatus.isPending}
                        className="h-6 text-[10px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-lg px-2">
                        Paid
                      </Button>
                    )}
                    {(inv.status === 'sent' || inv.status === 'draft') && (
                      <Button size="sm" variant="ghost" onClick={() => markOverdue(inv.id)} disabled={updateStatus.isPending}
                        className="h-6 text-[10px] text-rose-400 hover:bg-rose-500/10 rounded-lg px-2">
                        Overdue
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide Panel */}
      <AnimatePresence>
        {panel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setPanel(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0d0d1a] border-l border-white/[0.07] z-50 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <h3 className="font-bold text-white">New Invoice</h3>
                <button onClick={() => setPanel(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Client *</Label>
                  <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.07] text-white rounded-xl"><SelectValue placeholder="Select client…" /></SelectTrigger>
                    <SelectContent className="bg-[#0d0d1a] border-white/[0.08] text-white">
                      {(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Amount (₹ excl. GST) *</Label>
                  <Input type="number" placeholder="e.g. 25000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600 rounded-xl" />
                  {form.amount && <p className="text-xs text-slate-500">Total incl. 18% GST: ₹{Math.round(parseFloat(form.amount) * 1.18).toLocaleString('en-IN')}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Invoice Date</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.07] text-white rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Initial Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.07] text-white rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0d0d1a] border-white/[0.08] text-white">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent to Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="px-6 py-5 border-t border-white/[0.06] flex gap-3">
                <Button onClick={save} disabled={createInvoice.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  {createInvoice.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {createInvoice.isPending ? 'Creating…' : 'Create Invoice'}
                </Button>
                <Button variant="outline" onClick={() => setPanel(false)} className="border-white/[0.07] text-slate-400">Cancel</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
