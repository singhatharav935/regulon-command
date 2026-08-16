import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, X, Search, Mail, Phone, Hash, Loader2,
  CheckCircle2, Trash2, UserCircle, Edit3, Briefcase, Calendar,
  ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  useFirmClients, useAddFirmClient, useDeleteFirmClient,
  useCAAssignments, useFirmMembers
} from '@/hooks/personas/useCAFirmData';
import { toast } from 'sonner';

interface Props { firmId: string; }

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function FirmClientManagement({ firmId }: Props) {
  const { data: clients, isLoading } = useFirmClients(firmId);
  const { data: members } = useFirmMembers(firmId);
  const { data: assignments } = useCAAssignments(firmId);
  const addClient = useAddFirmClient();
  const deleteClient = useDeleteFirmClient();
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
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

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteClient.mutateAsync({ id, firmId });
      toast.success(`${name} removed.`);
      setConfirmDelete(null);
      setSelectedClient(null);
    } catch (e: any) { toast.error(e.message); }
  };

  // Get assigned CAs for a client
  const getAssignedCAs = (clientId: string) => {
    const clientAssignments = (assignments || []).filter(a => a.client_id === clientId);
    return clientAssignments.map(a => {
      const member = (members || []).find(m => m.id === a.ca_id);
      return member ? member.name : 'Unknown CA';
    });
  };

  const filtered = (clients || []).filter(c =>
    !search || [c.company_name, c.email, c.contact_person].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedDetails = useMemo(() => {
    if (!selectedClient) return null;
    return (clients || []).find(c => c.id === selectedClient) || null;
  }, [selectedClient, clients]);

  return (
    <div className="flex h-full">

      {/* List pane */}
      <div className="flex-1 flex flex-col min-w-0 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Client Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{(clients || []).length} clients · {(clients || []).filter(c => c.status === 'active').length} active</p>
          </div>
          <Button onClick={() => setPanel(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20">
            <Plus className="w-4 h-4 mr-1.5" /> Add Client
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
            className="pl-9 bg-background/40 border-border/40 text-foreground placeholder:text-muted-foreground focus:border-indigo-500/50 rounded-xl" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 rounded-2xl bg-card/30 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-card/30 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">{search ? 'No clients match your search' : 'No clients yet'}</p>
            <p className="text-muted-foreground text-sm">Add your first client using the button above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto">
            {filtered.map((c, i) => {
              const assignedCAs = getAssignedCAs(c.id);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedClient(c.id)}
                  className={`bg-card/30 border rounded-2xl p-4 hover:border-indigo-500/30 hover:bg-card/50 transition-all group cursor-pointer ${
                    selectedClient === c.id ? 'border-indigo-500/50 bg-card/50' : 'border-border/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-sm">
                      {c.company_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={`border text-[10px] ${STATUS_STYLE[c.status] || STATUS_STYLE.active}`}>
                        {(c.status || 'active').toUpperCase()}
                      </Badge>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm leading-snug">{c.company_name}</h3>
                  {c.contact_person && <p className="text-xs text-muted-foreground mt-0.5">{c.contact_person}</p>}
                  <div className="mt-3 space-y-1">
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" /> {c.email}
                      </div>
                    )}
                    {c.industry && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Hash className="w-3 h-3" /> {c.industry}
                      </div>
                    )}
                  </div>
                  {/* Assigned CAs */}
                  {assignedCAs.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-border/20">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <UserCircle className="w-3 h-3 text-indigo-400" />
                        {assignedCAs.map((name, idx) => (
                          <Badge key={idx} variant="outline" className="text-[9px] border-indigo-500/30 text-indigo-300">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground/50 mt-3">Added {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Client Detail Drawer */}
      <AnimatePresence>
        {selectedDetails && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="border-l border-border/30 bg-card/40 backdrop-blur-md overflow-hidden shrink-0"
          >
            <div className="w-[380px] h-full flex flex-col overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <h3 className="font-bold text-foreground text-sm">Client Details</h3>
                <button onClick={() => setSelectedClient(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client Avatar + Name */}
              <div className="px-5 py-5 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-lg">
                    {selectedDetails.company_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{selectedDetails.company_name}</h4>
                    <Badge className={`border text-[10px] mt-1 ${STATUS_STYLE[selectedDetails.status] || STATUS_STYLE.active}`}>
                      {(selectedDetails.status || 'active').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Detail Fields */}
              <div className="px-5 py-4 space-y-4 flex-1">
                {[
                  { icon: UserCircle, label: 'Contact Person', value: selectedDetails.contact_person },
                  { icon: Mail, label: 'Email', value: selectedDetails.email },
                  { icon: Hash, label: 'Industry', value: selectedDetails.industry },
                  { icon: Calendar, label: 'Added On', value: selectedDetails.created_at ? new Date(selectedDetails.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                ].map((field, idx) => {
                  const Icon = field.icon;
                  return (
                    <div key={idx} className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{field.label}</p>
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-sm text-foreground">{field.value || '—'}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Assigned CAs Section */}
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Assigned CA(s)</p>
                  {(() => {
                    const cas = getAssignedCAs(selectedDetails.id);
                    if (cas.length === 0) return <p className="text-sm text-muted-foreground">No CA assigned</p>;
                    return (
                      <div className="space-y-1.5">
                        {cas.map((name, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-background/30 border border-border/20">
                            <div className="w-6 h-6 rounded-full bg-indigo-600/30 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                              {name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                            </div>
                            <span className="text-sm text-foreground">{name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 border-t border-border/30 space-y-2">
                <Button
                  onClick={() => { setConfirmDelete(selectedDetails.id); }}
                  variant="outline"
                  className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Remove Client
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="font-bold text-foreground mb-2">Remove Client?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently delete <strong>{(clients || []).find(c => c.id === confirmDelete)?.company_name}</strong> and all their CA assignments. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleDelete(confirmDelete, (clients || []).find(c => c.id === confirmDelete)?.company_name || 'Client')}
                  disabled={deleteClient.isPending}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {deleteClient.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  {deleteClient.isPending ? 'Removing…' : 'Yes, Remove'}
                </Button>
                <Button variant="outline" onClick={() => setConfirmDelete(null)} className="border-border/40 text-muted-foreground">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-in Add Panel */}
      <AnimatePresence>
        {panel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setPanel(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border/40 z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/30">
                <h3 className="font-bold text-foreground text-base">New Client</h3>
                <button onClick={() => setPanel(false)} className="text-muted-foreground hover:text-foreground transition-colors">
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
                    <Label className="text-xs text-muted-foreground font-medium">{f.label}</Label>
                    <Input
                      type={f.type || 'text'}
                      placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={set(f.key)}
                      className="bg-background/40 border-border/40 text-foreground placeholder:text-muted-foreground rounded-xl focus:border-indigo-500/50"
                    />
                  </div>
                ))}
              </div>
              <div className="px-6 py-5 border-t border-border/30 flex gap-3">
                <Button onClick={save} disabled={addClient.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
                  {addClient.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {addClient.isPending ? 'Saving…' : 'Add Client'}
                </Button>
                <Button variant="outline" onClick={() => setPanel(false)} className="border-border/40 text-muted-foreground">Cancel</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
