import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bell, Plus, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const API_BASE = `${CA_API}/api/v1/corporate`;

const DEPARTMENTS = ['GST', 'Income Tax', 'MCA', 'EPFO', 'ESI', 'Customs', 'Labour', 'RBI', 'SEBI'];

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  received: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Bell },
  reviewing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  responded: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: CheckCircle },
  pending: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
  appealed: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: RefreshCw },
  closed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
};

const TRAFFIC_COLORS: Record<string, string> = {
  red_overdue: 'bg-red-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
};

export default function NoticeTrackerPanel({ clientId }: { clientId?: string }) {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNotice, setNewNotice] = useState({ department: 'GST', notice_type: '', notice_number: '', issue_date: '', response_due_date: '', amount_involved: '', subject: '', severity: 'medium' });

  const fetchNotices = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/notices/list?client_id=${clientId}&ca_firm_id=`);
      const data = await response.json();
      if (data.success) setNotices(data.data);
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  const addNotice = async () => {
    if (!newNotice.department || !newNotice.issue_date || !newNotice.response_due_date || !newNotice.subject) {
      toast.error('Fill in all required fields'); return;
    }
    try {
      const response = await fetch(`${API_BASE}/notices/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newNotice, client_id: clientId, ca_firm_id: '', amount_involved: parseFloat(newNotice.amount_involved || '0') }) });
      const data = await response.json();
      if (data.success) { toast.success('Notice added'); setShowAddForm(false); fetchNotices(); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_BASE}/notices/${id}/update`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      toast.success(`Status updated to ${status}`);
      fetchNotices();
    } catch { toast.error('Update failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500/20 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
          <div>
            <h3 className="font-bold text-lg">Notice Tracking System</h3>
            <p className="text-xs text-muted-foreground">All regulatory notices with deadline alerts across GST, IT, MCA, EPFO, ESI</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchNotices} disabled={loading}><RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-1" />Add Notice</Button>
        </div>
      </div>

      {showAddForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 border border-border/30 rounded-xl bg-card/30 space-y-3">
          <p className="text-sm font-bold">Add New Notice</p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Department</label>
              <Select value={newNotice.department} onValueChange={v => setNewNotice({...newNotice, department: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs text-muted-foreground">Notice Type</label><Input value={newNotice.notice_type} onChange={e => setNewNotice({...newNotice, notice_type: e.target.value})} className="mt-1" placeholder="e.g. Section 143(2) Scrutiny" /></div>
            <div><label className="text-xs text-muted-foreground">Notice Number</label><Input value={newNotice.notice_number} onChange={e => setNewNotice({...newNotice, notice_number: e.target.value})} className="mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Amount Involved (₹)</label><Input type="number" value={newNotice.amount_involved} onChange={e => setNewNotice({...newNotice, amount_involved: e.target.value})} className="mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Issue Date</label><Input type="date" value={newNotice.issue_date} onChange={e => setNewNotice({...newNotice, issue_date: e.target.value})} className="mt-1" /></div>
            <div><label className="text-xs text-muted-foreground">Response Due Date</label><Input type="date" value={newNotice.response_due_date} onChange={e => setNewNotice({...newNotice, response_due_date: e.target.value})} className="mt-1" /></div>
            <div className="col-span-2"><label className="text-xs text-muted-foreground">Subject / Summary</label><Input value={newNotice.subject} onChange={e => setNewNotice({...newNotice, subject: e.target.value})} className="mt-1" placeholder="Brief description of the notice" /></div>
            <div><label className="text-xs text-muted-foreground">Severity</label>
              <Select value={newNotice.severity} onValueChange={v => setNewNotice({...newNotice, severity: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{['low','medium','high','critical'].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addNotice} className="w-full bg-red-600 hover:bg-red-700">Save Notice</Button>
        </motion.div>
      )}

      {notices.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notices.map((notice) => {
            const cfg = STATUS_CONFIG[notice.status] || STATUS_CONFIG.received;
            const StatusIcon = cfg.icon;
            return (
              <div key={notice.id} className={`p-3 border rounded-xl space-y-2 ${notice.traffic_light === 'red_overdue' ? 'border-red-500/40 bg-red-500/5' : notice.traffic_light === 'red' ? 'border-red-400/30' : notice.traffic_light === 'yellow' ? 'border-yellow-400/30' : 'border-border/30'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${TRAFFIC_COLORS[notice.traffic_light] || 'bg-gray-400'}`}></span>
                      <Badge variant="outline" className="text-xs">{notice.department}</Badge>
                      <span className="text-xs font-semibold">{notice.notice_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notice.subject}</p>
                  </div>
                  <Badge className={`shrink-0 text-xs border ${cfg.color}`}><StatusIcon className="w-3 h-3 mr-1" />{notice.status}</Badge>
                </div>
                {notice.alert && <p className="text-xs text-red-400 font-medium">{notice.alert}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Due: {new Date(notice.response_due_date).toLocaleDateString('en-IN')}</span>
                  {notice.amount_involved > 0 && <span>₹{notice.amount_involved.toLocaleString()}</span>}
                  <span>{notice.days_left !== undefined ? (notice.days_left < 0 ? `Overdue by ${Math.abs(notice.days_left)} days` : `${notice.days_left} days left`) : ''}</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {['reviewing','responded','appealed','closed'].filter(s => s !== notice.status).map(s => (
                    <Button key={s} size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => updateStatus(notice.id, s)}>→ {s}</Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No notices tracked yet.</p>
          <p className="text-xs mt-1">Click "Add Notice" to log a regulatory notice, or "Refresh" to load from database.</p>
        </div>
      )}
    </motion.div>
  );
}
