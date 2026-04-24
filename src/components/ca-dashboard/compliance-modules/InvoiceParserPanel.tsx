import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Upload, RefreshCw, CheckCircle, AlertTriangle, Plus, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
const API_BASE = `${CA_API}/api/v1/corporate`;
const OCR_API = `${CA_API}/api/v1/ocr`;

type SubTab = 'invoice' | 'dintan';

const HEALTH_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  critical: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
};

/**
 * InvoiceParserPanel — OCR invoice upload + DIN/TAN registry
 * Combined as a single panel since both are lightweight operations
 */
export default function InvoiceParserPanel({ clientId }: { clientId?: string }) {
  const [subTab, setSubTab] = useState<SubTab>('invoice');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  // DIN/TAN form
  const [dinForm, setDinForm] = useState({
    registration_type: 'DIN',
    registration_number: '',
    person_name: '',
    pan: '',
    issue_date: '',
    expiry_date: '',
    kyc_due_date: '',
  });
  const [dinList, setDinList] = useState<any[]>([]);
  const [showAddDIN, setShowAddDIN] = useState(false);

  const handleInvoiceParse = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    if (!file) { toast.error('Upload an invoice file first'); return; }
    setLoading(true);
    try {
      // Convert file to base64 for OCR endpoint
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${OCR_API}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_data_base64: base64,
          file_type: file.type,
          document_hint: 'invoice',
          client_id: clientId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        toast.success(`Invoice parsed — ${data.data.document_type || 'document'} detected`);
      } else {
        toast.error(data.error || 'Parse failed');
      }
    } catch {
      toast.error('Backend connection error — ensure OCR service is running');
    } finally {
      setLoading(false);
    }
  };

  const fetchDINList = async () => {
    if (!clientId) { toast.error('Select a client first'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/din-tan/list?client_id=${clientId}`);
      const data = await res.json();
      if (data.success) { setDinList(data.data); toast.success(`Loaded ${data.count} records`); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
    finally { setLoading(false); }
  };

  const addDIN = async () => {
    if (!clientId || !dinForm.registration_number || !dinForm.person_name) {
      toast.error('Registration number and person name required'); return;
    }
    try {
      const res = await fetch(`${API_BASE}/din-tan/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dinForm, client_id: clientId }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`${dinForm.registration_type} added successfully`); setShowAddDIN(false); fetchDINList(); }
      else toast.error(data.error);
    } catch { toast.error('Backend connection error'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-pink-500/20 rounded-lg"><ScanLine className="w-5 h-5 text-pink-400" /></div>
        <div>
          <h3 className="font-bold text-lg">Invoice & Compliance Registry</h3>
          <p className="text-xs text-muted-foreground">OCR Invoice Parse • DIN/TAN Management with expiry alerts</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted/20 rounded-lg">
        {[{ id: 'invoice' as SubTab, label: 'Invoice OCR Parser', icon: ScanLine }, { id: 'dintan' as SubTab, label: 'DIN / TAN Registry', icon: CreditCard }].map(t => (
          <button key={t.id} onClick={() => { setSubTab(t.id); setResult(null); }} className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${subTab === t.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* INVOICE PARSER */}
        {subTab === 'invoice' && (
          <motion.div key="invoice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div
              className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-pink-500/50 transition-colors"
              onClick={() => document.getElementById('invoice-file')?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">{file ? file.name : 'Upload Invoice (PDF or Image)'}</p>
              <p className="text-xs text-muted-foreground mt-1">Supports PDF, JPG, PNG up to 10MB</p>
              {file && <p className="text-xs text-pink-400 mt-2">{(file.size / 1024).toFixed(0)} KB • Ready to parse</p>}
              <input id="invoice-file" type="file" accept="application/pdf,image/*" className="hidden" onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); }} />
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-400">
              <Shield className="w-3.5 h-3.5 inline mr-1.5" />
              <strong>OCR Note:</strong> Set <code className="bg-black/20 px-1 rounded">TEXTRACT_REGION</code> + AWS credentials in backend <code className="bg-black/20 px-1 rounded">.env</code> to enable live extraction. Currently structured for Textract integration.
            </div>

            <Button onClick={handleInvoiceParse} disabled={loading || !file} className="w-full bg-pink-600 hover:bg-pink-700">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <ScanLine className="w-4 h-4 mr-2" />}
              Parse Invoice
            </Button>

            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="p-3 bg-card/30 border border-border/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{result.document_type || result.file_name}</p>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                    {result.confidence ? `${result.confidence}% confidence` : result.status?.replace('_', ' ')}
                  </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{(result.file_size_bytes / 1024).toFixed(0)} KB • {result.file_type}</p>
                  <p className="text-xs text-blue-400">{result.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.extracted || {}).filter(([k]) => !['ocr_ready','ocr_note'].includes(k)).map(([k, v]) => (
                    <div key={k} className="p-2 bg-card/50 border border-border/30 rounded-lg">
                      <p className="text-[10px] text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</p>
                      <p className="text-xs font-medium mt-0.5">{String(v) || '—'}</p>
                    </div>
                  ))}
                </div>
                {result.extracted?.ocr_note && (
                  <p className="text-xs text-yellow-400 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">{result.extracted.ocr_note}</p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* DIN/TAN REGISTRY */}
        {subTab === 'dintan' && (
          <motion.div key="dintan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={fetchDINList} disabled={loading} variant="outline" className="flex-1">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Load Registry
              </Button>
              <Button onClick={() => setShowAddDIN(!showAddDIN)} className="flex-1 bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" />Add DIN / TAN
              </Button>
            </div>

            {showAddDIN && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 border border-border/30 rounded-xl bg-card/20 space-y-2">
                <p className="text-xs font-bold">Add New Registration</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-muted-foreground">Type</label>
                    <Select value={dinForm.registration_type} onValueChange={v => setDinForm({...dinForm, registration_type: v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="DIN">DIN</SelectItem><SelectItem value="TAN">TAN</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-xs text-muted-foreground">Number</label><Input value={dinForm.registration_number} onChange={e => setDinForm({...dinForm, registration_number: e.target.value})} className="mt-1" placeholder="00123456" /></div>
                  <div><label className="text-xs text-muted-foreground">Person / Company Name</label><Input value={dinForm.person_name} onChange={e => setDinForm({...dinForm, person_name: e.target.value})} className="mt-1" /></div>
                  <div><label className="text-xs text-muted-foreground">PAN</label><Input value={dinForm.pan} onChange={e => setDinForm({...dinForm, pan: e.target.value})} className="mt-1" /></div>
                  <div><label className="text-xs text-muted-foreground">Issue Date</label><Input type="date" value={dinForm.issue_date} onChange={e => setDinForm({...dinForm, issue_date: e.target.value})} className="mt-1" /></div>
                  <div><label className="text-xs text-muted-foreground">KYC Due Date</label><Input type="date" value={dinForm.kyc_due_date} onChange={e => setDinForm({...dinForm, kyc_due_date: e.target.value})} className="mt-1" /></div>
                </div>
                <Button onClick={addDIN} size="sm" className="w-full bg-pink-600 hover:bg-pink-700">Save</Button>
              </motion.div>
            )}

            {dinList.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {dinList.map((item, i) => (
                  <div key={i} className={`p-3 border rounded-xl ${item.health === 'expired' ? 'border-red-500/30 bg-red-500/5' : item.health === 'critical' ? 'border-orange-500/30' : item.health === 'warning' ? 'border-yellow-500/30' : 'border-border/30'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{item.person_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.registration_type}: {item.registration_number}</p>
                      </div>
                      <Badge className={`text-[10px] border ${HEALTH_COLORS[item.health] || HEALTH_COLORS.active}`}>{item.health}</Badge>
                    </div>
                    {item.alert && <p className="text-xs text-orange-400 mt-2 font-medium">{item.alert}</p>}
                    <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
                      {item.pan && <span>PAN: {item.pan}</span>}
                      {item.days_to_kyc !== null && <span>KYC in {item.days_to_kyc} days</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No DIN/TAN records yet.</p>
                <p className="text-xs mt-1">Add registrations or click "Load Registry" to fetch from database.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
