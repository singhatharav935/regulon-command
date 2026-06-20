/**
 * DocumentOcrHub — Gap 8 UI Dashboard
 *
 * Full Document Management & OCR console for legacy docs.
 * Real Supabase data only. No mock data.
 *
 * Tabs:
 *  1. Document Vault — Upload, browse, filter, download, verify documents
 *  2. OCR Processing — Trigger OCR, monitor jobs, view extracted data
 *  3. Version History — Track document revisions
 *  4. Extracted Data — View structured data extracted from OCR
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  useDocumentVault,
  useDocumentVersions,
  useOcrJobs,
  useOcrResults,
} from '@/hooks/useDocumentOcr';
import { DOCUMENT_CATEGORIES, OCR_ENGINES, formatFileSize } from '@/services/document-ocr-service';
import type { DocumentCategory, ComplianceDomain, OcrEngine } from '@/services/document-ocr-service';
import { useCAIdentity } from '@/hooks/useCAIdentity';
import {
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Upload,
  Download,
  Search,
  Eye,
  Shield,
  Archive,
  ScanLine,
  FileSearch,
  Layers,
  ChevronRight,
  ChevronDown,
  Activity,
  Tag,
  Filter,
  X,
  File,
  Image,
  FileSpreadsheet,
  Verified,
  History,
  Braces,
  Table2,
} from 'lucide-react';

// ─── Tab Type ─────────────────────────────────────────────────────────────────

type DocTab = 'vault' | 'ocr' | 'versions' | 'extracted';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function OcrStatusBadge({ status }: { status: string }) {
  const c: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    queued: { bg: 'bg-zinc-500/15', text: 'text-zinc-400', icon: Clock },
    processing: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: RefreshCw },
    completed: { bg: 'bg-green-500/15', text: 'text-green-400', icon: CheckCircle },
    failed: { bg: 'bg-red-500/15', text: 'text-red-400', icon: XCircle },
    cancelled: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', icon: X },
  };
  const cfg = c[status] ?? c.queued;
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.bg} ${cfg.text} border-none gap-1`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} /> {status}
    </Badge>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  const c: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-green-500/15', text: 'text-green-400' },
    archived: { bg: 'bg-zinc-500/15', text: 'text-zinc-400' },
    processing: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    deleted: { bg: 'bg-red-500/15', text: 'text-red-400' },
  };
  const cfg = c[status] ?? c.active;
  return <Badge className={`${cfg.bg} ${cfg.text} border-none text-[9px]`}>{status}</Badge>;
}

function FileIcon({ ext }: { ext: string }) {
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  const isSpreadsheet = ['xlsx', 'xls', 'csv', 'ods'].includes(ext);
  const isPdf = ext === 'pdf';
  if (isImage) return <Image className="w-5 h-5 text-pink-400" />;
  if (isSpreadsheet) return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
  if (isPdf) return <FileText className="w-5 h-5 text-red-400" />;
  return <File className="w-5 h-5 text-blue-400" />;
}

function getCategoryLabel(cat: string): string {
  return DOCUMENT_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;
}

function getCategoryIcon(cat: string): string {
  return DOCUMENT_CATEGORIES.find((c) => c.id === cat)?.icon ?? '📁';
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DocumentOcrHub: React.FC = () => {
  const { caId } = useCAIdentity();
  const [activeTab, setActiveTab] = useState<DocTab>('vault');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | ''>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Hooks ────────────────────────────────────────────────────────────────
  const {
    documents,
    dashboard,
    loading: docsLoading,
    refetch: refetchDocs,
    upload,
    remove: removeDoc,
    archive: archiveDoc,
    verify: verifyDoc,
    download: downloadDoc,
  } = useDocumentVault(caId || '');

  const {
    versions,
    loading: versionsLoading,
    refetch: refetchVersions,
  } = useDocumentVersions(selectedDocId);

  const {
    jobs: ocrJobs,
    loading: ocrJobsLoading,
    refetch: refetchOcrJobs,
    trigger: triggerOcr,
    cancel: cancelOcr,
  } = useOcrJobs(caId || '', selectedDocId);

  const {
    results: ocrResults,
    loading: ocrResultsLoading,
    refetch: refetchOcrResults,
  } = useOcrResults(selectedJobId, selectedDocId);

  // ─── Upload State ──────────────────────────────────────────────────────────
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('general');
  const [uploadDomain, setUploadDomain] = useState<ComplianceDomain | ''>('');
  const [uploadFY, setUploadFY] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ─── OCR Trigger State ─────────────────────────────────────────────────────
  const [ocrEngine, setOcrEngine] = useState<OcrEngine>('google_vision');

  // ─── Expanded rows ─────────────────────────────────────────────────────────
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async () => {
    if (!uploadFile) { toast.error('Please select a file'); return; }
    if (!uploadTitle.trim()) { toast.error('Title is required'); return; }
    setIsUploading(true);
    try {
      await upload(uploadFile, {
        title: uploadTitle.trim(),
        category: uploadCategory,
        compliance_domain: uploadDomain || undefined,
        financial_year: uploadFY || undefined,
        tags: uploadTags ? uploadTags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      });
      setShowUpload(false);
      setUploadTitle('');
      setUploadFile(null);
      setUploadTags('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // toast shown by hook
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile, uploadTitle, uploadCategory, uploadDomain, uploadFY, uploadTags, upload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  }, [uploadTitle]);

  // ─── Filtered Docs ─────────────────────────────────────────────────────────
  const filteredDocs = documents.filter((d) => {
    if (filterCategory && d.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return d.title.toLowerCase().includes(q) || d.file_name.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalDocs = documents.length;
  const ocrProcessed = documents.filter((d) => d.is_ocr_processed).length;
  const verifiedDocs = documents.filter((d) => d.is_verified).length;
  const totalSize = documents.reduce((s, d) => s + d.file_size_bytes, 0);

  // ─── Tab Config ─────────────────────────────────────────────────────────────
  const tabs: { id: DocTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'vault', label: 'Document Vault', icon: FileText, count: totalDocs },
    { id: 'ocr', label: 'OCR Processing', icon: ScanLine },
    { id: 'versions', label: 'Versions', icon: History },
    { id: 'extracted', label: 'Extracted Data', icon: Braces },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-8 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-900/15 via-indigo-900/10 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/5 to-transparent rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center">
              <FileSearch className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-violet-400">Document Management & OCR</h2>
              <p className="text-sm text-muted-foreground">Upload, organize, and extract data from legacy documents</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            {[
              { label: 'Documents', value: totalDocs, color: 'text-violet-400', icon: FileText },
              { label: 'OCR Processed', value: ocrProcessed, sub: totalDocs > 0 ? `${Math.round(ocrProcessed / totalDocs * 100)}%` : '0%', color: 'text-cyan-400', icon: ScanLine },
              { label: 'Verified', value: verifiedDocs, color: 'text-green-400', icon: Verified },
              { label: 'Total Size', value: formatFileSize(totalSize), color: 'text-blue-400', icon: Layers },
              { label: 'OCR Jobs', value: ocrJobs.length, color: 'text-orange-400', icon: Activity },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-4 rounded-xl bg-background/40 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  {'sub' in s && s.sub && <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Nav ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-[0_0_12px_-3px_rgba(139,92,246,0.2)]'
                  : 'border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/50'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <Badge className={`text-[10px] h-5 ${isActive ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-card/50 text-muted-foreground border-border/30'}`}>
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB 1: DOCUMENT VAULT ═══ */}
      {activeTab === 'vault' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="doc-search"
                  name="doc-search"
                  aria-label="Search documents"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-9 bg-background/50"
                />
              </div>
              <select
                id="doc-filter-category"
                name="doc-filter-category"
                aria-label="Filter by document category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as DocumentCategory | '')}
                className="p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
              >
                <option value="">All Categories</option>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => setShowUpload(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white gap-2">
              <Upload className="w-4 h-4" /> Upload Document
            </Button>
          </div>

          {/* Upload Form */}
          <AnimatePresence>
            {showUpload && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card className="border-violet-500/20 bg-card/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-violet-400 flex items-center gap-2">
                      <Upload className="w-5 h-5" /> Upload New Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* File Picker */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative border-2 border-dashed border-violet-500/30 rounded-xl p-8 text-center hover:border-violet-500/50 transition-colors cursor-pointer bg-violet-500/5"
                    >
                      <input ref={fileInputRef} type="file" id="doc-file-upload" name="doc-file-upload" aria-label="Upload document file" onChange={handleFileSelect} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,.tiff,.bmp" />
                      {uploadFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileIcon ext={uploadFile.name.split('.').pop()?.toLowerCase() ?? ''} />
                          <div className="text-left">
                            <p className="text-sm font-medium text-foreground">{uploadFile.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-violet-400/40 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Click to select or drag & drop a file</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">PDF, Images, Excel, Word, CSV — up to 50 MB</p>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="doc-upload-title" className="text-xs text-muted-foreground mb-1 block">Title *</label>
                        <Input id="doc-upload-title" name="doc-upload-title" aria-label="Document title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Document title" className="bg-background/50" />
                      </div>
                      <div>
                        <label htmlFor="doc-upload-category" className="text-xs text-muted-foreground mb-1 block">Category *</label>
                        <select
                          id="doc-upload-category"
                          name="doc-upload-category"
                          aria-label="Document category"
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                          className="w-full p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
                        >
                          {DOCUMENT_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="doc-upload-domain" className="text-xs text-muted-foreground mb-1 block">Compliance Domain</label>
                        <select
                          id="doc-upload-domain"
                          name="doc-upload-domain"
                          aria-label="Compliance domain"
                          value={uploadDomain}
                          onChange={(e) => setUploadDomain(e.target.value as ComplianceDomain | '')}
                          className="w-full p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
                        >
                          <option value="">None</option>
                          <option value="gst">GST</option>
                          <option value="income_tax">Income Tax</option>
                          <option value="mca">MCA</option>
                          <option value="rbi">RBI</option>
                          <option value="sebi">SEBI</option>
                          <option value="customs">Customs</option>
                          <option value="labour">Labour</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="doc-upload-fy" className="text-xs text-muted-foreground mb-1 block">Financial Year</label>
                        <Input id="doc-upload-fy" name="doc-upload-fy" aria-label="Financial year" value={uploadFY} onChange={(e) => setUploadFY(e.target.value)} placeholder="e.g. 2025-26" className="bg-background/50" />
                      </div>
                      <div>
                        <label htmlFor="doc-upload-tags" className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
                        <Input id="doc-upload-tags" name="doc-upload-tags" aria-label="Document tags" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="e.g. q1, audit, important" className="bg-background/50" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button onClick={handleUpload} disabled={isUploading || !uploadFile || !uploadTitle.trim()} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                        {isUploading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload
                      </Button>
                      <Button variant="ghost" onClick={() => setShowUpload(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Document List */}
          {docsLoading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 text-violet-400 animate-spin" /></div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{searchQuery || filterCategory ? 'No documents match your filters' : 'No documents uploaded yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-border/30 bg-card/20 hover:border-violet-500/20 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-background/60 border border-border/30 flex items-center justify-center shrink-0">
                        <FileIcon ext={doc.file_extension} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm text-foreground truncate">{doc.title}</span>
                          <DocStatusBadge status={doc.status} />
                          {doc.is_ocr_processed && <Badge className="text-[9px] bg-cyan-500/15 text-cyan-400 border-none gap-1"><ScanLine className="w-2.5 h-2.5" />OCR</Badge>}
                          {doc.is_verified && <Badge className="text-[9px] bg-green-500/15 text-green-400 border-none gap-1"><Verified className="w-2.5 h-2.5" />Verified</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>{getCategoryIcon(doc.category)} {getCategoryLabel(doc.category)}</span>
                          <span>•</span>
                          <span>{doc.file_name}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size_bytes)}</span>
                          {doc.financial_year && <><span>•</span><span>FY {doc.financial_year}</span></>}
                          <span>•</span>
                          <span>v{doc.current_version}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        {doc.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <Tag className="w-3 h-3 text-muted-foreground/50" />
                            {doc.tags.map((t) => (
                              <Badge key={t} className="text-[9px] bg-violet-500/10 text-violet-300 border-violet-500/20">{t}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => downloadDoc(doc)} className="text-xs text-blue-400 hover:bg-blue-500/10">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedDocId(doc.id); triggerOcr(doc.id, { ocr_engine: 'google_vision' }); }} className="text-xs text-cyan-400 hover:bg-cyan-500/10" title="Run OCR">
                        <ScanLine className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => verifyDoc(doc.id)} className="text-xs text-green-400 hover:bg-green-500/10" disabled={doc.is_verified} title="Verify">
                        <Shield className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedDocId(doc.id); setActiveTab('versions'); }} className="text-xs text-muted-foreground hover:text-foreground" title="Versions">
                        <History className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => archiveDoc(doc.id)} className="text-xs text-yellow-400 hover:bg-yellow-500/10" title="Archive">
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeDoc(doc.id)} className="text-xs text-red-400 hover:bg-red-500/10" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ TAB 2: OCR PROCESSING ═══ */}
      {activeTab === 'ocr' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-semibold text-foreground">OCR Jobs</h3>
            <div className="flex items-center gap-3">
              <select
                id="ocr-filter-doc"
                name="ocr-filter-doc"
                aria-label="Filter by document"
                value={selectedDocId || ''}
                onChange={(e) => setSelectedDocId(e.target.value || null)}
                className="p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground max-w-xs"
              >
                <option value="">All Documents</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
              <select
                id="ocr-engine-select"
                name="ocr-engine-select"
                aria-label="Select OCR engine"
                value={ocrEngine}
                onChange={(e) => setOcrEngine(e.target.value as OcrEngine)}
                className="p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground"
              >
                {OCR_ENGINES.map((eng) => (
                  <option key={eng.id} value={eng.id}>{eng.name}</option>
                ))}
              </select>
              {selectedDocId && (
                <Button
                  size="sm"
                  onClick={() => triggerOcr(selectedDocId, { ocr_engine: ocrEngine })}
                  className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white gap-1"
                >
                  <ScanLine className="w-3.5 h-3.5" /> Trigger OCR
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={refetchOcrJobs}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {ocrJobsLoading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 text-violet-400 animate-spin" /></div>
          ) : ocrJobs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <ScanLine className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No OCR jobs yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Select a document and trigger OCR to extract text and data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ocrJobs.map((job) => {
                const doc = documents.find((d) => d.id === job.document_id);
                const isExpanded = expandedJobId === job.id;
                return (
                  <motion.div key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border/30 bg-card/20 overflow-hidden">
                    <button
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      className="w-full p-4 flex items-center justify-between gap-4 hover:bg-card/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-wrap">
                        <OcrStatusBadge status={job.status} />
                        <Badge className="text-[10px] bg-card/50 text-foreground border-border/30 font-mono">{job.ocr_engine.replace('_', ' ')}</Badge>
                        {doc && <span className="text-xs text-muted-foreground truncate">{doc.title}</span>}
                        {job.status === 'processing' && (
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={job.progress_pct} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-muted-foreground">{job.progress_pct}%</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {job.confidence_score && <span className="text-[10px] text-green-400">{(job.confidence_score * 100).toFixed(1)}%</span>}
                        {job.word_count > 0 && <span className="text-[10px] text-muted-foreground">{job.word_count} words</span>}
                        {job.duration_ms && <span className="text-[10px] text-muted-foreground">{(job.duration_ms / 1000).toFixed(1)}s</span>}
                        <span className="text-[10px] text-muted-foreground">{new Date(job.created_at).toLocaleString('en-IN')}</span>
                        {(job.status === 'queued' || job.status === 'processing') && (
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); cancelOcr(job.id); }} className="text-xs text-red-400 hover:bg-red-500/10">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {job.status === 'completed' && (
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedJobId(job.id); setActiveTab('extracted'); }} className="text-xs text-cyan-400">
                            <Eye className="w-3.5 h-3.5 mr-1" /> Results
                          </Button>
                        )}
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border/20">
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                { label: 'Pages Processed', value: `${job.pages_processed}/${job.total_pages}`, color: 'text-blue-400' },
                                { label: 'Confidence', value: job.confidence_score ? `${(job.confidence_score * 100).toFixed(1)}%` : '—', color: 'text-green-400' },
                                { label: 'Word Count', value: job.word_count.toLocaleString(), color: 'text-foreground' },
                                { label: 'Retries', value: `${job.retry_count}/${job.max_retries}`, color: 'text-orange-400' },
                              ].map((s) => (
                                <div key={s.label} className="p-2 rounded-lg bg-background/40 border border-border/20 text-center">
                                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                                  <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                                </div>
                              ))}
                            </div>
                            {job.error_message && (
                              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Error</p>
                                <p className="text-xs text-red-300">{job.error_message}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ TAB 3: VERSIONS ═══ */}
      {activeTab === 'versions' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-semibold text-foreground">Version History</h3>
            <select
              id="version-doc-select"
              name="version-doc-select"
              aria-label="Select document for version history"
              value={selectedDocId || ''}
              onChange={(e) => setSelectedDocId(e.target.value || null)}
              className="p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground max-w-xs"
            >
              <option value="">Select Document</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>{d.title} (v{d.current_version})</option>
              ))}
            </select>
          </div>

          {!selectedDocId ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Select a document to view its version history</p>
            </div>
          ) : versionsLoading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 text-violet-400 animate-spin" /></div>
          ) : versions.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No version history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-card/20"
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-violet-400">v{v.version_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{v.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{formatFileSize(v.file_size_bytes)}</span>
                      <span>•</span>
                      <span>{v.change_summary || 'No description'}</span>
                      <span>•</span>
                      <span>{new Date(v.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  {i === 0 && <Badge className="text-[9px] bg-violet-500/15 text-violet-400 border-none">Latest</Badge>}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ TAB 4: EXTRACTED DATA ═══ */}
      {activeTab === 'extracted' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-semibold text-foreground">Extracted OCR Data</h3>
            <div className="flex items-center gap-3">
              <select
                id="extracted-doc-select"
                name="extracted-doc-select"
                aria-label="Select document for extracted data"
                value={selectedDocId || ''}
                onChange={(e) => { setSelectedDocId(e.target.value || null); setSelectedJobId(null); }}
                className="p-2 rounded-lg border border-border/30 bg-background/50 text-sm text-foreground max-w-xs"
              >
                <option value="">Select Document</option>
                {documents.filter((d) => d.is_ocr_processed).map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={refetchOcrResults} disabled={!selectedDocId && !selectedJobId}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!selectedDocId && !selectedJobId ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Braces className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Select an OCR-processed document to view extracted data</p>
            </div>
          ) : ocrResultsLoading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 text-violet-400 animate-spin" /></div>
          ) : ocrResults.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Braces className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No OCR results available for this document</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ocrResults.map((r) => (
                <Card key={r.id} className="border-border/30 bg-card/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-foreground">
                      <FileText className="w-4 h-4 text-violet-400" />
                      Page {r.page_number}
                      {r.raw_text_confidence && (
                        <Badge className="text-[9px] bg-green-500/15 text-green-400 border-none ml-2">
                          {(r.raw_text_confidence * 100).toFixed(1)}% confidence
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Extracted Fields */}
                    {Object.keys(r.extracted_fields).length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Braces className="w-3 h-3" /> Extracted Fields</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(r.extracted_fields).map(([key, value]) => (
                            <div key={key} className="p-2 rounded-lg bg-background/40 border border-border/20">
                              <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                              <p className="text-sm font-medium text-foreground">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detected Entities */}
                    {Object.keys(r.detected_entities).length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Detected Entities</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(r.detected_entities).map(([type, values]) =>
                            (values as string[]).map((v, i) => (
                              <Badge key={`${type}-${i}`} className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-xs gap-1">
                                <span className="text-[9px] uppercase text-cyan-400/60">{type}</span> {v}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tables */}
                    {r.extracted_tables.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><Table2 className="w-3 h-3" /> Extracted Tables</p>
                        {r.extracted_tables.map((table, ti) => (
                          <div key={ti} className="rounded-lg border border-border/20 overflow-hidden mb-2">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-card/30 border-b border-border/20">
                                  {table.headers.map((h: string, hi: number) => (
                                    <th key={hi} className="p-2 text-left text-muted-foreground font-medium">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {table.rows.map((row: string[], ri: number) => (
                                  <tr key={ri} className="border-b border-border/10">
                                    {row.map((cell: string, ci: number) => (
                                      <td key={ci} className="p-2 text-foreground">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Raw Text */}
                    {r.raw_text && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Raw Text</p>
                        <pre className="text-xs font-mono p-3 rounded-lg bg-background/60 border border-border/20 overflow-x-auto max-h-48 whitespace-pre-wrap">
                          {r.raw_text}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default DocumentOcrHub;
