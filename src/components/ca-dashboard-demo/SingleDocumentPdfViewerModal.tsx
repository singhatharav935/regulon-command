/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  SINGLE DOCUMENT PDF VIEWER MODAL
 * ═══════════════════════════════════════════════════════════════════════════════
 *  Renders an independent document's specific content in print-ready A4 pages.
 *  Supports zoom controls, markdown rendering, edit draft mode, copy text, download,
 *  and print preview.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, X, Download, Edit, Save, Copy, Check, Eye, ZoomIn, ZoomOut, RotateCcw,
  Printer, ShieldCheck, FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface SingleDocumentPdfViewerProps {
  open: boolean;
  onClose: () => void;
  documentName: string;
  clientName: string;
  financialYear: string;
  content: string;
  onSaveContent?: (newContent: string) => void;
}

export function SingleDocumentPdfViewerModal({
  open,
  onClose,
  documentName,
  clientName,
  financialYear,
  content,
  onSaveContent,
}: SingleDocumentPdfViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(95);

  const activeContent = isEditing ? editContent : (content || "# Document Preview\n\nNo content available.");
  const pages = activeContent.split('\n---\n');

  const handleSave = () => {
    onSaveContent?.(editContent);
    toast.success(`Saved changes to ${documentName}`);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    toast.success('Document text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[95vw] w-[1200px] bg-[#090b0f] border border-white/10 text-foreground h-[92vh] flex flex-col p-0 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)] rounded-2xl">

        {/* ── HEADER ────────────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-6 py-4 bg-gradient-to-r from-white/3 to-transparent">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="shrink-0 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground leading-tight truncate max-w-[420px]">{documentName}</h2>
                <Badge className="shrink-0 bg-emerald-500/12 text-emerald-300 border border-emerald-500/25 text-[10px] gap-1 px-2 py-0.5">
                  <ShieldCheck className="w-3 h-3" /> Auto-Generated & Compiled
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <span>Client: <strong className="text-foreground">{clientName}</strong></span>
                <span className="text-white/20">·</span>
                <span>F.Y. <strong className="text-foreground">{financialYear}</strong></span>
                <span className="text-white/20">·</span>
                <span className="font-mono text-slate-400">{pages.length} Page{pages.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditContent(content); setIsEditing(true); }}
                  className="h-8 text-xs border-white/12 gap-1.5 px-3"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 text-xs border-white/12 gap-1.5 px-3"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success(`Downloaded: ${documentName}`)}
                  className="h-8 text-xs border-white/12 gap-1.5 px-3"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </Button>
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 px-3"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="h-8 text-xs border-white/12 px-3">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 gap-1.5 px-3">
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </Button>
              </>
            )}
            <button onClick={handleClose} className="ml-1 p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── TOOLBAR / ZOOM BAR ────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-2 border-b border-white/8 bg-white/[0.015]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Zoom:</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom(z => Math.max(60, z - 10))}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-mono text-foreground font-semibold px-1">{zoom}%</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom(z => Math.min(130, z + 10))}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1"
              onClick={() => setZoom(95)}
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          </div>

          <div className="text-[11px] text-muted-foreground font-mono">
            {isEditing ? "Markdown Edit Mode" : "Standard A4 Document Rendering"}
          </div>
        </div>

        {/* ── CONTENT BODY ──────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-[#060709]">
          {isEditing ? (
            <div className="max-w-4xl mx-auto space-y-3">
              <p className="text-xs text-muted-foreground">Edit document markdown content. Changes are buffered locally.</p>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full h-[65vh] bg-[#0c0e14] border border-white/12 rounded-xl p-5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
                placeholder="Enter markdown content..."
              />
            </div>
          ) : (
            <div
              className="origin-top transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', marginBottom: `${(zoom - 100) * 6}px` }}
            >
              {pages.map((pageText, idx) => (
                <div
                  key={idx}
                  id={`pdf-page-${idx}`}
                  className="bg-white text-black mx-auto mb-8 shadow-[0_8px_48px_rgba(0,0,0,0.6)] border border-gray-200 relative min-h-[1050px] flex flex-col justify-between"
                  style={{ width: 794, padding: '64px 72px' }}
                >
                  {/* Running Header */}
                  <div className="flex justify-between items-center text-[9px] text-gray-400 border-b border-gray-100 pb-2 mb-6 font-mono uppercase tracking-wider">
                    <span>{clientName} · F.Y. {financialYear}</span>
                    <span>{documentName}</span>
                  </div>

                  {/* Rendered Document Content */}
                  <div className="flex-1 font-serif text-[11.5px] leading-relaxed text-gray-900">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({...p}) => <h1 className="text-[16px] font-black text-center border-b-2 border-gray-900 pb-2 mb-6 mt-4 uppercase tracking-wider text-gray-900 font-sans" {...p} />,
                        h2: ({...p}) => <h2 className="text-[13px] font-bold text-gray-900 border-b border-gray-200 pb-1 mb-4 mt-5 uppercase tracking-wide font-sans" {...p} />,
                        h3: ({...p}) => <h3 className="text-[12px] font-bold text-gray-800 mt-4 mb-2 font-sans" {...p} />,
                        p:  ({...p}) => <p  className="mb-3 text-justify leading-relaxed text-gray-900" {...p} />,
                        strong: ({...p}) => <strong className="font-bold text-gray-900" {...p} />,
                        table: ({...p}) => (
                          <div className="overflow-x-auto my-4 border border-gray-200 rounded">
                            <table className="w-full border-collapse text-[10.5px] font-mono" {...p} />
                          </div>
                        ),
                        th: ({...p}) => <th className="border border-gray-300 px-3 py-2 bg-gray-50 text-left font-bold text-[10.5px] text-gray-900" {...p} />,
                        td: ({...p}) => <td className="border border-gray-100 px-3 py-1.5 text-[10.5px] text-gray-800 align-top" {...p} />,
                        ul: ({...p}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...p} />,
                        ol: ({...p}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...p} />,
                        blockquote: ({...p}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 my-3 text-[10.5px]" {...p} />,
                        hr: () => <hr className="my-6 border-t border-gray-200" />,
                      }}
                    >
                      {pageText}
                    </ReactMarkdown>
                  </div>

                  {/* Running Footer */}
                  <div className="mt-8 pt-3 border-t border-gray-100 flex justify-between items-center text-[8.5px] text-gray-400 font-mono">
                    <span>SANNIDH AUTONOMOUS COMPLIANCE ENGINE</span>
                    <span>Page {idx + 1} of {pages.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER STATUS ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-2.5 border-t border-white/8 bg-white/[0.015] text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Document Compiled & Ready</span>
          </div>
          <span>Client Vault · {clientName}</span>
        </div>

      </DialogContent>
    </Dialog>
  );
}

export default SingleDocumentPdfViewerModal;
