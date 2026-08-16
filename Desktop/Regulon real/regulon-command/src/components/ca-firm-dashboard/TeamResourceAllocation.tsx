import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, Briefcase, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirmMembers, useAddFirmMember, useFirmClients, useCAAssignments, useAssignCA, useUnassignCA } from '@/hooks/personas/useCAFirmData';
import { toast } from 'sonner';

interface Props { firmId: string; }

const ROLE_BADGE: Record<string, string> = {
  partner: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  senior_ca: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  article: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function TeamResourceAllocation({ firmId }: Props) {
  const { data: members, isLoading } = useFirmMembers(firmId);
  const { data: clients } = useFirmClients(firmId);
  const { data: assignments } = useCAAssignments(firmId);
  const addMember = useAddFirmMember();
  const assignCA = useAssignCA();
  const unassignCA = useUnassignCA();

  const [panel, setPanel] = useState(false);
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [selClient, setSelClient] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'manager', specialization: '' });

  const save = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required.'); return; }
    try {
      await addMember.mutateAsync({ firm_id: firmId, name: form.name, email: form.email, role: form.role, specialization: form.specialization });
      toast.success(`${form.name} added to the team!`);
      setForm({ name: '', email: '', role: 'manager', specialization: '' });
      setPanel(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const doAssign = async () => {
    if (!assignFor || !selClient) { toast.error('Select a client first.'); return; }
    const already = (assignments || []).some(a => a.ca_id === assignFor && a.client_id === selClient);
    if (already) { toast.warning('Already assigned.'); return; }
    try {
      await assignCA.mutateAsync({ ca_id: assignFor, client_id: selClient, assigned_date: new Date().toISOString().split('T')[0] });
      toast.success('Client assigned!');
      setAssignFor(null); setSelClient('');
    } catch (e: any) { toast.error(e.message); }
  };

  const memberAssignments = (id: string) => (assignments || []).filter(a => a.ca_id === id);
  const clientName = (id: string) => (clients || []).find(c => c.id === id)?.company_name || 'Client';

  const loadPct = (id: string) => {
    const n = memberAssignments(id).length;
    return Math.min(100, n * 10);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Team & Resource Allocation</h2>
          <p className="text-xs text-slate-500 mt-0.5">{(members || []).length} members · assign clients to team</p>
        </div>
        <Button onClick={() => setPanel(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20">
          <Plus className="w-4 h-4 mr-1.5" /> Add Member
        </Button>
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setAssignFor(null)}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d0d1a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="font-bold text-white mb-1">Assign Client</h3>
              <p className="text-xs text-slate-500 mb-4">Pick a client to assign to this team member.</p>
              {(clients || []).length === 0 ? (
                <p className="text-slate-500 text-sm">No clients found. Add clients first.</p>
              ) : (
                <Select value={selClient} onValueChange={setSelClient}>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.07] text-white rounded-xl">
                    <SelectValue placeholder="Select client…" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d0d1a] border-white/[0.08] text-white">
                    {(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-3 mt-4">
                <Button onClick={doAssign} disabled={assignCA.isPending || !selClient} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {assignCA.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Assign
                </Button>
                <Button variant="outline" onClick={() => setAssignFor(null)} className="border-white/[0.07] text-slate-400">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />)}</div>
      ) : (members || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <Users className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-300 font-medium">No team members yet</p>
          <p className="text-slate-600 text-sm">Add Partners, Managers, and Articles to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(members || []).map((m, i) => {
            const pct = loadPct(m.id);
            const assigns = memberAssignments(m.id);
            return (
              <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-[#0f0f1e] border border-white/[0.06] rounded-2xl p-5 hover:border-indigo-500/20 transition-all">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-sm">
                      {m.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{m.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`border text-[9px] ${ROLE_BADGE[m.role] || ROLE_BADGE.manager}`}>
                          {m.role?.replace('_',' ').toUpperCase()}
                        </Badge>
                        {m.specialization && <span className="text-xs text-slate-500">{m.specialization}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {assigns.map(a => (
                      <div key={a.id} className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1 text-xs text-slate-300">
                        {clientName(a.client_id)}
                        <button onClick={() => unassignCA.mutateAsync(a.id).then(() => toast.success('Removed'))} className="ml-1 text-slate-600 hover:text-rose-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => setAssignFor(m.id)}
                      className="h-7 text-xs border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-full">
                      <Briefcase className="w-3 h-3 mr-1" /> Assign
                    </Button>
                  </div>
                </div>

                {assigns.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/[0.04]">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Workload</span>
                      <span className={pct > 80 ? 'text-rose-400 font-semibold' : pct > 50 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                        {assigns.length} clients
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Member Slide Panel */}
      <AnimatePresence>
        {panel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setPanel(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0d0d1a] border-l border-white/[0.07] z-50 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <h3 className="font-bold text-white">New Team Member</h3>
                <button onClick={() => setPanel(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {[
                  { label: 'Full Name *', key: 'name', placeholder: 'CA Rajesh Kumar' },
                  { label: 'Email *', key: 'email', placeholder: 'rajesh@yourfirm.com', type: 'email' },
                  { label: 'Specialization', key: 'specialization', placeholder: 'GST, Income Tax, Audit…' },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs text-slate-400">{f.label}</Label>
                    <Input type={f.type || 'text'} placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600 rounded-xl focus:border-indigo-500/50" />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Role *</Label>
                  <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.07] text-white rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d0d1a] border-white/[0.08] text-white">
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="senior_ca">Senior CA</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="article">Article Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="px-6 py-5 border-t border-white/[0.06] flex gap-3">
                <Button onClick={save} disabled={addMember.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {addMember.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {addMember.isPending ? 'Adding…' : 'Add Member'}
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
