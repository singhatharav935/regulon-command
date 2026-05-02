import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, RefreshCw, CheckCircle, ClipboardList,
  FileSignature, Users2, ChevronRight, ChevronDown, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const API_BASE = `${CA_API}/api/v1/corporate`;

const RESOLUTION_TYPES = [
  { id: 'loan_approval', label: 'Loan / Guarantee Approval' },
  { id: 'asset_purchase', label: 'Asset Purchase Approval' },
  { id: 'director_appointment', label: 'Director Appointment' },
  { id: 'dividend', label: 'Dividend Declaration' },
  { id: 'investment', label: 'Investment Approval (Sec 186)' },
  { id: 'salary_revision', label: 'Salary / Remuneration Revision' },
  { id: 'bank_account', label: 'Bank Account Opening' },
  { id: 'financial_policy', label: 'Financial Policy Update' },
];

type SubTab = 'meeting' | 'resolution' | 'agm' | 'mca';

export default function BoardMeetingsPanel({ clientId, isDemo }: { clientId?: string; isDemo?: boolean }) {
  const [subTab, setSubTab] = useState<SubTab>('meeting');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Meeting form
  const [meetingForm, setMeetingForm] = useState({
    meeting_type: 'board', meeting_date: '', location: '', is_virtual: false, virtual_link: '', agenda: '',
  });
  // Resolution form
  const [resForm, setResForm] = useState({
    resolution_type: 'loan_approval', amount: '', lender: '', purpose: '', director_name: '', din: '', effective_date: '', company_name: '',
  });
  // AGM form
  const [agmForm, setAgmForm] = useState({
    company_name: '', financial_year_end: `${new Date().getFullYear()}-03-31`, proposed_agm_date: '', venue: '',
  });
  // MCA form
  const [mcaForm, setMcaForm] = useState({
    cin: '', company_name: '', share_capital: '', directors_count: '', fy: '2024-25',
  });

  const handleMeeting = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    if (!meetingForm.meeting_date) { toast.error('Meeting date is required'); return; }
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        setResult({
          meeting_date: meetingForm.meeting_date,
          notice_required: 'SS-1: 7 days notice required for Board Meetings.',
          compliance_note: 'Ensure attendance registers are signed physically or via digital signatures for virtual meetings.',
          invite_template: {
            body: `Notice is hereby given that a ${meetingForm.meeting_type} meeting of the Board of Directors will be held on ${new Date(meetingForm.meeting_date).toLocaleString('en-IN')} at ${meetingForm.location || 'Registered Office'}.\n\nAgenda:\n${meetingForm.agenda}`
          }
        });
        toast.success('Meeting scheduled (Demo)');
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const agendaItems = meetingForm.agenda.split('\n').filter(Boolean);
      const res = await fetch(`${API_BASE}/board-meetings/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, ca_firm_id: '', ...meetingForm, agenda: agendaItems }),
      });
      const data = await res.json();
      if (data.success) { setResult(data.data); toast.success('Meeting scheduled'); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  const handleResolution = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        setResult({
          resolution_number: `BR/${new Date().getFullYear()}/001`,
          formal_header: `CERTIFIED TRUE COPY OF THE RESOLUTION PASSED AT THE MEETING OF THE BOARD OF DIRECTORS OF ${resForm.company_name || 'THE COMPANY'} HELD ON ${new Date().toLocaleDateString('en-IN')}`,
          resolution_text: `"RESOLVED THAT pursuant to the applicable provisions of the Companies Act, 2013, approval of the Board be and is hereby accorded for ${resForm.resolution_type.replace(/_/g, ' ')}... (Demo AI Generated Draft)"`,
          signing_instructions: 'Requires signatures from at least two directors or one director and the Company Secretary.'
        });
        toast.success('Resolution drafted (Demo)');
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/resolutions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, ca_firm_id: '', resolution_type: resForm.resolution_type, details: resForm, company_details: { name: resForm.company_name } }),
      });
      const data = await res.json();
      if (data.success) { setResult(data.data); toast.success('Resolution drafted'); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  const handleAGM = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        setResult({
          agm_date: agmForm.proposed_agm_date || '2025-09-30',
          compliance_alert: 'AGM scheduled within statutory limits (Section 96).',
          days_to_deadline: 45,
          notice_must_be_sent_by: '2025-09-08',
          agenda: ['To receive, consider and adopt Audited Financial Statements', 'To appoint a Director in place of retiring director', 'To ratify the appointment of Statutory Auditors']
        });
        toast.success('AGM schedule computed (Demo)');
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/agm/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, ...agmForm }),
      });
      const data = await res.json();
      if (data.success) { setResult(data.data); toast.success('AGM schedule computed'); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  const handleMCA = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    if (!mcaForm.cin) { toast.error('CIN is required'); return; }
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        setResult({
          form_type: 'MGT-7 Annual Return',
          cin: mcaForm.cin,
          filing_due_date: '2025-11-29',
          alert: 'File within 60 days of AGM to avoid penalty of ₹100/day.',
          checklist: [
            { item: 'List of Shareholders', status: 'attached' },
            { item: 'List of Directors', status: 'attached' },
            { item: 'Financial Statements (AOC-4)', status: 'pending' },
            { item: 'MGT-8 Certification (if applicable)', status: 'pending' }
          ]
        });
        toast.success('MGT-7 structure generated (Demo)');
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/mca-annual-return/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, cin: mcaForm.cin, company_details: { name: mcaForm.company_name }, financial_data: { authorized_capital: parseFloat(mcaForm.share_capital || '0'), paid_up_capital: parseFloat(mcaForm.share_capital || '0') } }),
      });
      const data = await res.json();
      if (data.success) { setResult(data.data); toast.success('MGT-7 structure generated'); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  const SUBTABS: { id: SubTab; label: string; icon: any }[] = [
    { id: 'meeting', label: 'Board Meeting', icon: Calendar },
    { id: 'resolution', label: 'Resolution', icon: FileSignature },
    { id: 'agm', label: 'AGM', icon: Users2 },
    { id: 'mca', label: 'MCA Annual Return', icon: ClipboardList },
  ];

  const handleAction = () => ({ meeting: handleMeeting, resolution: handleResolution, agm: handleAGM, mca: handleMCA }[subTab])();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-indigo-500/20 rounded-lg"><Calendar className="w-5 h-5 text-indigo-400" /></div>
        <div>
          <h3 className="font-bold text-lg">Corporate Governance Suite</h3>
          <p className="text-xs text-muted-foreground">Board Meetings • Resolutions • AGM Scheduler • MCA Annual Return (MGT-7)</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-muted/20 rounded-lg">
        {SUBTABS.map(t => (
          <button key={t.id} onClick={() => { setSubTab(t.id); setResult(null); }} className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${subTab === t.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="w-3 h-3" />{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* BOARD MEETING */}
        {subTab === 'meeting' && (
          <motion.div key="meeting" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-muted-foreground">Meeting Type</label>
                <Select value={meetingForm.meeting_type} onValueChange={v => setMeetingForm({...meetingForm, meeting_type: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{[{v:'board',l:'Board Meeting'},{v:'agm',l:'AGM'},{v:'egm',l:'EGM'},{v:'committee',l:'Committee'}].map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs text-muted-foreground">Date & Time</label><Input type="datetime-local" value={meetingForm.meeting_date} onChange={e => setMeetingForm({...meetingForm, meeting_date: e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Location</label><Input value={meetingForm.location} onChange={e => setMeetingForm({...meetingForm, location: e.target.value})} className="mt-1" placeholder="Registered Office / Zoom" /></div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2 mt-5"><input type="checkbox" id="virtual" checked={meetingForm.is_virtual} onChange={e => setMeetingForm({...meetingForm, is_virtual: e.target.checked})} className="w-3 h-3" /><label htmlFor="virtual" className="text-xs">Virtual Meeting</label></div>
              </div>
              {meetingForm.is_virtual && <div className="col-span-2"><label className="text-xs text-muted-foreground">Meeting Link</label><Input value={meetingForm.virtual_link} onChange={e => setMeetingForm({...meetingForm, virtual_link: e.target.value})} className="mt-1" placeholder="https://meet.google.com/..." /></div>}
            </div>
            <div><label className="text-xs text-muted-foreground">Agenda Items (one per line)</label>
              <textarea value={meetingForm.agenda} onChange={e => setMeetingForm({...meetingForm, agenda: e.target.value})} className="w-full h-24 text-xs p-2 rounded-lg bg-card/50 border border-border/30 resize-none mt-1 focus:outline-none" placeholder={"Approval of previous minutes\nGSTR-3B payment authorization\nBank mandate update"} />
            </div>
          </motion.div>
        )}

        {/* RESOLUTION */}
        {subTab === 'resolution' && (
          <motion.div key="resolution" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div><label className="text-xs text-muted-foreground">Resolution Type</label>
              <Select value={resForm.resolution_type} onValueChange={v => setResForm({...resForm, resolution_type: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{RESOLUTION_TYPES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-muted-foreground">Company Name</label><Input value={resForm.company_name} onChange={e => setResForm({...resForm, company_name: e.target.value})} className="mt-1" placeholder="XYZ Private Limited" /></div>
              <div><label className="text-xs text-muted-foreground">Amount (₹)</label><Input type="number" value={resForm.amount} onChange={e => setResForm({...resForm, amount: e.target.value})} className="mt-1" placeholder="0" /></div>
              {resForm.resolution_type === 'loan_approval' && <>
                <div><label className="text-xs text-muted-foreground">Lender Name</label><Input value={resForm.lender} onChange={e => setResForm({...resForm, lender: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs text-muted-foreground">Purpose</label><Input value={resForm.purpose} onChange={e => setResForm({...resForm, purpose: e.target.value})} className="mt-1" /></div>
              </>}
              {resForm.resolution_type === 'director_appointment' && <>
                <div><label className="text-xs text-muted-foreground">Director Name</label><Input value={resForm.director_name} onChange={e => setResForm({...resForm, director_name: e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs text-muted-foreground">DIN</label><Input value={resForm.din} onChange={e => setResForm({...resForm, din: e.target.value})} className="mt-1" /></div>
              </>}
              <div><label className="text-xs text-muted-foreground">Effective Date</label><Input type="date" value={resForm.effective_date} onChange={e => setResForm({...resForm, effective_date: e.target.value})} className="mt-1" /></div>
            </div>
          </motion.div>
        )}

        {/* AGM */}
        {subTab === 'agm' && (
          <motion.div key="agm" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><label className="text-xs text-muted-foreground">Company Name</label><Input value={agmForm.company_name} onChange={e => setAgmForm({...agmForm, company_name: e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Financial Year End</label><Input type="date" value={agmForm.financial_year_end} onChange={e => setAgmForm({...agmForm, financial_year_end: e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Proposed AGM Date</label><Input type="date" value={agmForm.proposed_agm_date} onChange={e => setAgmForm({...agmForm, proposed_agm_date: e.target.value})} className="mt-1" /></div>
              <div className="col-span-2"><label className="text-xs text-muted-foreground">Venue</label><Input value={agmForm.venue} onChange={e => setAgmForm({...agmForm, venue: e.target.value})} className="mt-1" placeholder="Registered Office / Virtual" /></div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">
              ℹ️ AGM must be held within 6 months of financial year end (Section 96). Late AGM attracts ₹1L penalty (Section 99). 21 days advance notice mandatory.
            </div>
          </motion.div>
        )}

        {/* MCA ANNUAL RETURN */}
        {subTab === 'mca' && (
          <motion.div key="mca" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-muted-foreground">Company CIN</label><Input value={mcaForm.cin} onChange={e => setMcaForm({...mcaForm, cin: e.target.value})} className="mt-1" placeholder="U72900MH2010PTC205533" /></div>
              <div><label className="text-xs text-muted-foreground">Company Name</label><Input value={mcaForm.company_name} onChange={e => setMcaForm({...mcaForm, company_name: e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">Paid-up Share Capital (₹)</label><Input type="number" value={mcaForm.share_capital} onChange={e => setMcaForm({...mcaForm, share_capital: e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs text-muted-foreground">No. of Directors</label><Input type="number" value={mcaForm.directors_count} onChange={e => setMcaForm({...mcaForm, directors_count: e.target.value})} className="mt-1" /></div>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-300">
              ⚠️ MGT-7 / Annual Return due by April 30. Late filing penalty: ₹100/day with no max cap.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button onClick={handleAction} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
        {{ meeting: 'Schedule Meeting', resolution: 'Generate Resolution', agm: 'Calculate AGM Deadline', mca: 'Generate MGT-7 Structure' }[subTab]}
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Meeting result */}
          {subTab === 'meeting' && result.meeting_date && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-400" /><span className="font-semibold text-sm">Meeting Scheduled</span></div>
                <p className="text-xs text-muted-foreground mb-1">{new Date(result.meeting_date).toLocaleString('en-IN')}</p>
                <p className="text-xs text-yellow-400 font-medium">{result.notice_required}</p>
                {result.compliance_note && <p className="text-xs text-blue-400 mt-1">{result.compliance_note}</p>}
              </div>
              <div className="p-3 bg-card/30 border border-border/30 rounded-xl">
                <p className="text-xs font-bold mb-2">📧 Invite Template</p>
                <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto">{result.invite_template?.body}</pre>
              </div>
            </div>
          )}
          {/* Resolution result */}
          {subTab === 'resolution' && result.resolution_text && (
            <div className="space-y-2">
              <div className="p-3 bg-card/30 border border-border/30 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold">📜 Board Resolution Draft</p>
                  <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{result.resolution_number}</Badge>
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">{result.formal_header}</p>
                <p className="text-xs leading-relaxed">{result.resolution_text}</p>
                <p className="text-[11px] text-blue-400 mt-3 font-medium">{result.signing_instructions}</p>
              </div>
            </div>
          )}
          {/* AGM result */}
          {subTab === 'agm' && result.agm_date && (
            <div className="space-y-2">
              <div className={`p-3 rounded-xl border ${result.days_to_deadline <= 30 ? 'bg-red-500/10 border-red-500/30' : result.days_to_deadline <= 60 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                <p className="text-sm font-bold mb-1">{result.compliance_alert}</p>
                <p className="text-xs text-muted-foreground">Notice must be sent by: {new Date(result.notice_must_be_sent_by).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="p-3 bg-card/30 border border-border/30 rounded-xl">
                <p className="text-xs font-bold mb-2">Agenda</p>
                {result.agenda?.map((a: string, i: number) => <p key={i} className="text-xs text-muted-foreground">{i+1}. {a}</p>)}
              </div>
            </div>
          )}
          {/* MCA result */}
          {subTab === 'mca' && result.form_type && (
            <div className="space-y-2">
              <div className={`p-3 rounded-xl border ${new Date(result.filing_due_date) < new Date() ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                <p className="text-xs font-bold">{result.form_type} — {result.cin}</p>
                <p className="text-xs text-muted-foreground mt-1">{result.alert}</p>
              </div>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {result.checklist?.map((item: any, i: number) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${item.status === 'attached' ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {item.status === 'attached' ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/50" />}
                    {item.item}
                    <Badge className={`ml-auto text-[10px] ${item.status === 'attached' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>{item.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
