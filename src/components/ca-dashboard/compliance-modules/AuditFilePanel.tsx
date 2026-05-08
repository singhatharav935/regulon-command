import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderCheck, CheckCircle, Clock, RefreshCw, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string);
const API_BASE = `${CA_API}/api/v1/corporate`;

const DOCS = ['balance_sheet','pl_statement','cash_flow','gl_trial_balance','fixed_assets_schedule','debtors_schedule','creditors_schedule','bank_reconciliation','audit_report','board_resolutions','agm_minutes','shareholders_list','management_representation','rpt_disclosure','contingent_liabilities','notes_to_accounts','investments_schedule'];

export default function AuditFilePanel({ clientId, isDemo }: { clientId?: string; isDemo?: boolean }) {
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [available, setAvailable] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const toggle = (docId: string) => setAvailable(prev => ({ ...prev, [docId]: !prev[docId] }));

  const prepare = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        const mandatory = ['balance_sheet','pl_statement','cash_flow','notes_to_accounts','audit_report','gl_trial_balance'];
        const readyCount = Object.keys(available).filter(k => available[k]).length;
        const pendingMandatory = mandatory.filter(m => !available[m]);
        
        setResult({
          summary: {
            total_documents: DOCS.length,
            ready: readyCount,
            pending: DOCS.length - readyCount,
            mandatory_total: mandatory.length,
            mandatory_ready: mandatory.length - pendingMandatory.length,
            completion_percentage: Math.round((readyCount / DOCS.length) * 100),
            is_audit_ready: pendingMandatory.length === 0 && readyCount > DOCS.length * 0.5
          },
          checklist_status: pendingMandatory.length === 0 ? 'Audit Checklist is complete and ready for signature.' : 'Audit Checklist incomplete. Missing mandatory documents.',
          pending_documents: pendingMandatory.map(d => d.replace(/_/g, ' ').toUpperCase())
        });
        toast.success('Audit file checklist generated (Demo)');
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/audit-file/prepare`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, financial_year: financialYear, available_documents: available }) });
      const data = await res.json();
      if (data.success) { setResult(data.data); toast.success('Audit file checklist generated'); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-teal-500/20 rounded-lg"><FolderCheck className="w-5 h-5 text-teal-400" /></div>
        <div>
          <h3 className="font-bold text-lg">Audit File Preparation</h3>
          <p className="text-xs text-muted-foreground">Mark documents as ready — checklist validates completeness for statutory audit</p>
        </div>
      </div>

      <div><label className="text-xs text-muted-foreground">Financial Year</label>
        <Select value={financialYear} onValueChange={setFinancialYear}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{['2024-25','2023-24','2022-23'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="p-3 border border-border/30 rounded-xl space-y-2 max-h-64 overflow-y-auto">
        <p className="text-xs font-bold text-muted-foreground sticky top-0 bg-background pb-1">Mark Documents as Ready</p>
        {DOCS.map(doc => (
          <div key={doc} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${available[doc] ? 'bg-teal-500/10 border border-teal-500/30' : 'hover:bg-card/50 border border-transparent'}`} onClick={() => toggle(doc)}>
            {available[doc] ? <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" /> : <Clock className="w-4 h-4 text-muted-foreground shrink-0" />}
            <span className="text-sm capitalize">{doc.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>

      <Button onClick={prepare} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <FolderCheck className="w-4 h-4 mr-2" />}
        Generate Audit Checklist
      </Button>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className={`p-4 rounded-xl border ${result.summary?.is_audit_ready ? 'bg-teal-500/10 border-teal-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
            <p className="text-sm font-bold">{result.checklist_status}</p>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-bold">{result.summary?.completion_percentage}% ({result.summary?.ready} / {result.summary?.total_documents})</span>
            </div>
            <Progress value={result.summary?.completion_percentage} className="h-2" />
          </div>

          {result.pending_documents?.length > 0 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-xs font-bold text-yellow-400 flex items-center gap-1 mb-2"><FileWarning className="w-3 h-3" />Mandatory Documents Pending ({result.summary?.mandatory_total - result.summary?.mandatory_ready})</p>
              <ul className="space-y-1">{result.pending_documents.map((d: string, i: number) => <li key={i} className="text-xs text-muted-foreground">• {d}</li>)}</ul>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            {[{ label: 'Total Docs', val: result.summary?.total_documents, color: '' }, { label: 'Ready', val: result.summary?.ready, color: 'text-teal-400' }, { label: 'Pending', val: result.summary?.pending, color: 'text-yellow-400' }].map(s => (
              <div key={s.label} className="p-2 bg-card/50 border border-border/30 rounded-lg"><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-xl font-bold ${s.color}`}>{s.val}</p></div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
