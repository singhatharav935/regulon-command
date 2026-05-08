import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, X, Search, Mail, Phone, Hash, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useFirmClients, useAddFirmClient } from '@/hooks/personas/useCAFirmData';
import { toast } from 'sonner';

interface Props { firmId: string; }

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function FirmClientManagement({ firmId }: Props) {
  const { data: clients, isLoading } = useFirmClients(firmId);
  const addClient = useAddFirmClient();
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState(false);
  const [form, setForm] = useState({ company_name: '', contact_person: '', email: '', phone: '', gstin: '', pan: '', industry: '', status: 'active' });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.company_name || !form.email) { toast.error('Company name and email are required.'); return; }
    try {
      await addClient.mutateAsync({ firm_id: firmId, ...form });
      toast.success(`${form.company_name} added!`);
      setForm({ company_name: '', contact_person: '', email: '', phone: '', gstin: '', pan: '', industry: '', status: 'active' });
      setPanel(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = (clients || []).filter(c =>
    !search || [c.company_name, c.email, c.contact_person].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-full">

      {/* List pane */}
      <div className="flex-1 flex flex-col min-w-0 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Client Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">{(clients || []).length} clients · {(clients || []).filter(c => c.status === 'active').length} active</p>
          </div>
          <Button onClick={() => setPanel(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20">
            <Plus className="w-4 h-4 mr-1.5" /> Add Client
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
            className="pl-9 bg-[#0f0f1e] border-white/[0.07] text-white placeholder:text-slate-600 focus:border-indigo-500/50 rounded-xl" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 rounded-2xl bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <Building2 className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-300 font-medium">{search ? 'No clients match your search' : 'No clients yet'}</p>
            <p className="text-slate-600 text-sm">Add your first client using the button above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto">
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-[#0f0f1e] border border-white/[0.06] rounded-2xl p-4 hover:border-indigo-500/30 hover:bg-[#111128] transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-sm">
                    {c.company_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <Badge className={`border text-[10px] ${STATUS_STYLE[c.status] || STATUS_STYLE.active}`}>
                    {(c.status || 'active').toUpperCase()}
                  </Badge>
                </div>
                <h3 className="font-semibold text-white text-sm leading-snug">{c.company_name}</h3>
                {c.contact_person && <p className="text-xs text-slate-400 mt-0.5">{c.contact_person}</p>}
                <div className="mt-3 space-y-1">
                  {c.email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="w-3 h-3" /> {c.email}
                    </div>
                  )}
                  {c.industry && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Hash className="w-3 h-3" /> {c.industry}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-700 mt-3">Added {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-in Add Panel */}
      <AnimatePresence>
        {panel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setPanel(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0d0d1a] border-l border-white/[0.07] z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <h3 className="font-bold text-white text-base">New Client</h3>
                <button onClick={() => setPanel(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {[
                  { label: 'Company / Client Name *', key: 'company_name', placeholder: 'Acme Technologies Pvt Ltd' },
                  { label: 'Contact Person', key: 'contact_person', placeholder: 'Mr. Suresh Mehta' },
                  { label: 'Email *', key: 'email', placeholder: 'contact@company.com', type: 'email' },
                  { label: 'Phone', key: 'phone', placeholder: '+91 98765 43210', type: 'tel' },
                  { label: 'GSTIN', key: 'gstin', placeholder: '27AABCU9603R1ZX' },
                  { label: 'PAN', key: 'pan', placeholder: 'AABCU9603R' },
                  { label: 'Industry / Sector', key: 'industry', placeholder: 'IT Services, Manufacturing…' },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs text-slate-400 font-medium">{f.label}</Label>
                    <Input
                      type={f.type || 'text'}
                      placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={set(f.key)}
                      className="bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600 rounded-xl focus:border-indigo-500/50"
                    />
                  </div>
                ))}
              </div>
              <div className="px-6 py-5 border-t border-white/[0.06] flex gap-3">
                <Button onClick={save} disabled={addClient.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
                  {addClient.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {addClient.isPending ? 'Saving…' : 'Add Client'}
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
