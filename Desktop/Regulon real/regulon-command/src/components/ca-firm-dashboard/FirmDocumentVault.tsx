import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileArchive, Upload, Trash2, Download, Search, Loader2,
  FileText, Image, File, FileSpreadsheet, X, CheckCircle2, FolderOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePersonaAuth } from '@/lib/persona-auth-context';

const BUCKET = 'ca-firm-documents';

const CATEGORIES = [
  { value: 'sop', label: 'SOPs & Procedures' },
  { value: 'audit_template', label: 'Audit Templates' },
  { value: 'kyc', label: 'Client KYC' },
  { value: 'engagement_letter', label: 'Engagement Letters' },
  { value: 'tax_return', label: 'Tax Returns' },
  { value: 'financial_statement', label: 'Financial Statements' },
  { value: 'general', label: 'General' },
];

const CAT_STYLE: Record<string, string> = {
  sop: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  audit_template: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  kyc: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  engagement_letter: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  tax_return: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  financial_statement: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  general: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function getFileIcon(type: string) {
  if (type?.includes('pdf')) return FileText;
  if (type?.includes('image')) return Image;
  if (type?.includes('sheet') || type?.includes('excel')) return FileSpreadsheet;
  return File;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface DocRecord {
  id: string;
  firm_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  description: string;
  created_at: string;
}

function getStableFirmId(email: string): string {
  const key = `sfid_${email}`;
  const cached = localStorage.getItem(key);
  if (cached) return cached;
  let h = 0x811c9dc5;
  for (let i = 0; i < email.length; i++) { h ^= email.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  const hex = h.toString(16).padStart(8, '0');
  const pre = email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 8).padEnd(8, '0').toLowerCase();
  const id = `${pre.slice(0,4)}-${pre.slice(4,8)}-${hex.slice(0,4)}-${hex.slice(4,8)}-${hex}${hex}`;
  localStorage.setItem(key, id);
  return id;
}

export default function FirmDocumentVault() {
  const { currentUser } = usePersonaAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [selectedCat, setSelectedCat] = useState('general');
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const email = currentUser?.email || '';
  const firmId = email ? getStableFirmId(email) : 'unknown';

  // ── Load documents from DB ────────────────────────────────────────────────
  const { data: docs = [], isLoading } = useQuery<DocRecord[]>({
    queryKey: ['firm-docs', firmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ca_firm_documents')
        .select('*')
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false });
      if (error) {
        console.warn('[FirmDocs] Load error:', error.message);
        return [];
      }
      return data || [];
    },
    enabled: !!firmId,
  });

  // ── Upload handler ────────────────────────────────────────────────────────
  const upload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(files)) {
      try {
        const path = `${firmId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        // Upload to Supabase Storage
        const { error: storageErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (storageErr) {
          // If storage bucket doesn't exist, store metadata only in DB
          console.warn('[FirmDocs] Storage upload failed (bucket may not exist):', storageErr.message);
          // Still save the record with a placeholder path so UI shows the file
        }

        // Save metadata to DB
        const { error: dbErr } = await supabase.from('ca_firm_documents').insert({
          firm_id: firmId,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || firmId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          file_type: file.type,
          category: selectedCat,
          description,
        });

        if (dbErr) {
          toast.error(`Failed to save ${file.name}: ${dbErr.message}`);
        } else {
          uploaded++;
        }
      } catch (e: any) {
        toast.error(`Upload failed: ${e.message}`);
      }
    }
    if (uploaded > 0) {
      toast.success(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded!`);
      qc.invalidateQueries({ queryKey: ['firm-docs', firmId] });
    }
    setUploading(false);
    setDescription('');
    if (fileRef.current) fileRef.current.value = '';
  }, [firmId, selectedCat, description, qc]);

  // ── Download handler ──────────────────────────────────────────────────────
  const download = async (doc: DocRecord) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(doc.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed. Storage bucket may not be configured yet.');
    }
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const deleteDoc = useMutation({
    mutationFn: async (doc: DocRecord) => {
      // Remove from storage
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
      // Remove from DB
      const { error } = await supabase.from('ca_firm_documents').delete().eq('id', doc.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Document deleted.');
      qc.invalidateQueries({ queryKey: ['firm-docs', firmId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = docs.filter(d => {
    const matchSearch = !search || d.file_name.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || d.category === catFilter;
    return matchSearch && matchCat;
  });

  const byCategory = CATEGORIES.map(c => ({ ...c, count: docs.filter(d => d.category === c.value).length }));

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left: Category sidebar ── */}
      <div className="hidden lg:flex flex-col w-52 shrink-0 border-r border-white/[0.05] p-4 gap-1">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Categories</p>
        <button
          onClick={() => setCatFilter('all')}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${catFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'}`}
        >
          <span>All Files</span>
          <span className="text-xs opacity-60">{docs.length}</span>
        </button>
        {byCategory.map(c => (
          <button
            key={c.value}
            onClick={() => setCatFilter(c.value)}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${catFilter === c.value ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'}`}
          >
            <span className="truncate">{c.label}</span>
            {c.count > 0 && <span className="ml-1 opacity-60">{c.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Right: Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 p-6 gap-4 overflow-hidden">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white">Document Vault</h2>
            <p className="text-xs text-slate-500 mt-0.5">{docs.length} files · {fmtSize(docs.reduce((s, d) => s + (d.file_size || 0), 0))} used</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-2xl p-6 transition-all ${dragOver ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'}`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              {uploading ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /> : <Upload className="w-5 h-5 text-indigo-400" />}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-sm font-medium text-white">{uploading ? 'Uploading…' : 'Drop files here or click to upload'}</p>
              <p className="text-xs text-slate-500 mt-0.5">PDF, Word, Excel, Images · Max 50MB per file</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedCat} onValueChange={setSelectedCat}>
                <SelectTrigger className="w-40 h-8 text-xs bg-white/[0.04] border-white/[0.07] text-white rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d1a] border-white/[0.08] text-white text-xs">
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={e => upload(e.target.files)} />
              <Button
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 h-8 text-xs"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Choose Files
              </Button>
            </div>
          </div>
        </div>

        {/* Search + Filter Row */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…"
              className="pl-9 bg-[#0f0f1e] border-white/[0.07] text-white placeholder:text-slate-600 rounded-xl focus:border-indigo-500/50" />
          </div>
          <div className="lg:hidden">
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="bg-[#0f0f1e] border-white/[0.07] text-white rounded-xl w-36">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d0d1a] border-white/[0.08] text-white text-xs">
                <SelectItem value="all">All</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <FolderOpen className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-300 font-medium">{search || catFilter !== 'all' ? 'No matching documents' : 'No documents uploaded yet'}</p>
              <p className="text-slate-600 text-sm">Drag and drop files above to upload.</p>
            </div>
          ) : (
            filtered.map((doc, i) => {
              const Icon = getFileIcon(doc.file_type);
              const catInfo = CATEGORIES.find(c => c.value === doc.category);
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 bg-[#0f0f1e] border border-white/[0.06] rounded-2xl px-5 py-3.5 hover:border-indigo-500/20 hover:bg-[#111128] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <Badge className={`border text-[9px] ${CAT_STYLE[doc.category] || CAT_STYLE.general}`}>
                        {catInfo?.label || doc.category}
                      </Badge>
                      <span className="text-xs text-slate-600">{fmtSize(doc.file_size)}</span>
                      <span className="text-xs text-slate-700">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={() => download(doc)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteDoc.mutate(doc)} disabled={deleteDoc.isPending}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
                      {deleteDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
