import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, CheckCircle2, Edit2, Save, X, BookOpen, Star, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface Props { firmId: string; }

const SQC_POLICIES = [
  'Leadership Responsibilities for Quality on Audits',
  'Ethical Requirements (Independence & Integrity)',
  'Acceptance & Continuance of Client Relationships',
  'Human Resources — Competency & Training',
  'Engagement Performance Standards',
  'Monitoring & Remediation Processes',
];

const STATUS_CYCLE: Array<'compliant' | 'review_needed' | 'non_compliant'> = ['compliant', 'review_needed', 'non_compliant'];
const STATUS_STYLE: Record<string, string> = {
  compliant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  review_needed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  non_compliant: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

interface PeerReview { cert: string; last: string; next: string; status: string; }
interface CPEEntry { id: string; name: string; done: number; required: number; }
interface SQCPolicy { label: string; status: 'compliant' | 'review_needed' | 'non_compliant'; }

function loadState(firmId: string) {
  try {
    const raw = localStorage.getItem(`iqc_${firmId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    peerReview: { cert: '', last: '', next: '', status: 'pending' } as PeerReview,
    cpe: [] as CPEEntry[],
    sqc: SQC_POLICIES.map(label => ({ label, status: 'compliant' as const })) as SQCPolicy[],
  };
}

export default function ICAIQualityControl({ firmId }: Props) {
  const [state, setState] = useState(() => loadState(firmId));
  const [editPR, setEditPR] = useState(false);
  const [prDraft, setPRDraft] = useState(state.peerReview);
  const [addCPE, setAddCPE] = useState(false);
  const [cpeDraft, setCPEDraft] = useState({ name: '', done: '', required: '20' });

  const save = (next: typeof state) => {
    setState(next);
    localStorage.setItem(`iqc_${firmId}`, JSON.stringify(next));
  };

  const savePR = () => { save({ ...state, peerReview: prDraft }); setEditPR(false); toast.success('Peer Review saved.'); };
  const toggleSQC = (i: number) => {
    const curr = state.sqc[i].status;
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(curr) + 1) % STATUS_CYCLE.length];
    const sqc = state.sqc.map((p: SQCPolicy, idx: number) => idx === i ? { ...p, status: next } : p);
    save({ ...state, sqc });
    toast.info(`Policy updated: ${next.replace('_', ' ')}`);
  };
  const addCPEEntry = () => {
    if (!cpeDraft.name || !cpeDraft.done) { toast.error('Name and hours required.'); return; }
    const entry: CPEEntry = { id: Date.now().toString(), name: cpeDraft.name, done: parseFloat(cpeDraft.done), required: parseInt(cpeDraft.required) };
    save({ ...state, cpe: [...state.cpe, entry] });
    setCPEDraft({ name: '', done: '', required: '20' });
    setAddCPE(false);
    toast.success('CPE record added.');
  };
  const removeCPE = (id: string) => save({ ...state, cpe: state.cpe.filter((e: CPEEntry) => e.id !== id) });

  const compliantCount = state.sqc.filter((p: SQCPolicy) => p.status === 'compliant').length;
  const prStatus = state.peerReview.status;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">ICAI Quality Control — SQC 1</h2>
        <p className="text-xs text-slate-500 mt-0.5">Track Peer Review status, CPE hours, and SQC 1 policy adherence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Peer Review Card */}
        <div className="bg-[#0f0f1e] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">ICAI Peer Review</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`border text-[10px] ${prStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : prStatus === 'expired' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                {prStatus.toUpperCase()}
              </Badge>
              <button onClick={() => { setPRDraft(state.peerReview); setEditPR(!editPR); }} className="text-slate-500 hover:text-white transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="px-5 py-4 space-y-4">
            {editPR ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Certificate Number</Label>
                  <Input value={prDraft.cert} onChange={e => setPRDraft(p => ({ ...p, cert: e.target.value }))} placeholder="PR/2024/XXXXX"
                    className="bg-white/[0.04] border-white/[0.07] text-white font-mono rounded-xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Last Review</Label>
                    <Input type="date" value={prDraft.last} onChange={e => setPRDraft(p => ({ ...p, last: e.target.value }))}
                      className="bg-white/[0.04] border-white/[0.07] text-white rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-400">Next Due</Label>
                    <Input type="date" value={prDraft.next} onChange={e => setPRDraft(p => ({ ...p, next: e.target.value }))}
                      className="bg-white/[0.04] border-white/[0.07] text-white rounded-xl text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Status</Label>
                  <select value={prDraft.status} onChange={e => setPRDraft(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.07] text-white rounded-xl text-sm px-3 py-2 outline-none">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={savePR} className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs">
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditPR(false)} className="text-slate-400 h-7 text-xs">Cancel</Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Certificate</p>
                  <p className="font-mono text-white text-sm bg-white/[0.04] px-3 py-2 rounded-lg border border-white/[0.05]">
                    {state.peerReview.cert || <span className="text-slate-600 font-sans italic">Not set — click ✏ to add</span>}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Last Review</p>
                    <p className="text-sm text-white">{state.peerReview.last ? new Date(state.peerReview.last).toLocaleDateString('en-IN') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Next Due</p>
                    <p className="text-sm text-amber-400">{state.peerReview.next ? new Date(state.peerReview.next).toLocaleDateString('en-IN') : '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CPE Tracking */}
        <div className="bg-[#0f0f1e] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">CPE Hours Tracker</h3>
            </div>
            <button onClick={() => setAddCPE(!addCPE)} className="text-slate-500 hover:text-indigo-400 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 py-4 space-y-3">
            {addCPE && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2 mb-3">
                <Input placeholder="Partner / Member Name" value={cpeDraft.name} onChange={e => setCPEDraft(p => ({ ...p, name: e.target.value }))}
                  className="bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600 rounded-lg h-8 text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Completed Hrs" value={cpeDraft.done} onChange={e => setCPEDraft(p => ({ ...p, done: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600 rounded-lg h-8 text-xs" />
                  <Input type="number" placeholder="Required Hrs" value={cpeDraft.required} onChange={e => setCPEDraft(p => ({ ...p, required: e.target.value }))}
                    className="bg-white/[0.04] border-white/[0.07] text-white placeholder:text-slate-600 rounded-lg h-8 text-xs" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCPEEntry} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white h-7 text-xs">Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddCPE(false)} className="text-slate-400 h-7 text-xs">Cancel</Button>
                </div>
              </div>
            )}
            {state.cpe.length === 0 ? (
              <p className="text-slate-600 text-xs text-center py-6">No CPE records yet. Click + to add partner hours.</p>
            ) : (
              <div className="space-y-3 max-h-52 overflow-y-auto">
                {state.cpe.map((e: CPEEntry) => {
                  const pct = Math.min(100, (e.done / e.required) * 100);
                  return (
                    <div key={e.id}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-300 font-medium">{e.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={pct >= 100 ? 'text-emerald-400' : 'text-amber-400'}>{e.done}/{e.required} hrs</span>
                          <button onClick={() => removeCPE(e.id)} className="text-slate-700 hover:text-rose-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SQC 1 Policies */}
      <div className="bg-[#0f0f1e] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">SQC 1 Policy Adherence</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-semibold">{compliantCount}/{state.sqc.length} Compliant</span>
            <p className="text-[10px] text-slate-600">Click to toggle</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/[0.04]">
          {state.sqc.map((p: SQCPolicy, i: number) => (
            <motion.button
              key={i}
              onClick={() => toggleSQC(i)}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              whileTap={{ scale: 0.99 }}
              className="flex items-start gap-3 p-4 text-left w-full transition-colors border-b border-white/[0.03] last:border-0"
            >
              {p.status === 'compliant'
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                : <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${p.status === 'non_compliant' ? 'text-rose-400' : 'text-amber-400'}`} />
              }
              <div>
                <p className="text-sm text-slate-200 leading-snug">{p.label}</p>
                <Badge className={`border text-[9px] mt-1.5 ${STATUS_STYLE[p.status]}`}>
                  {p.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
