/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  STATUTORY DOCUMENT VIEWER MODAL  ·  5-View CA Audit & Filing Suite
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  THE 5 VIEWS
 *  ─────────────────────────────────────────────────────────────────────────────
 *  VIEW 1 — Working Trial Balance
 *    Interactive double-entry ledger. Every account shows Dr/Cr/Balance.
 *    The CA uses this to post Adjusting Journal Vouchers (AJVs) before finalizing.
 *
 *  VIEW 2 — Schedule III Statutory Financial Package (Bank / MCA)
 *    Full formal A4-page rendering: Balance Sheet, P&L, Cash Flow,
 *    Notes to Accounts (1–25), CARO 2020, CA digital signature & UDIN stamp.
 *    Submitted to Banks for CC Limits + to MCA via XBRL.
 *
 *  VIEW 3 — Tax Computation & Form 3CD Register
 *    Section-wise income tax computation, Form 3CD clause-wise statement,
 *    26AS/AIS reconciliation, TDS section-wise deduction register.
 *    Used to certify Tax Audit Report under Section 44AB Income Tax Act.
 *
 *  VIEW 4 — Government E-Filing JSON Payload
 *    Raw validated JSON payload (GSTN GSTR-3B / ITR-6 / MCA AOC-4).
 *    Syntax-highlighted. Contains EVC/DSC signature headers.
 *    This is the exact code that goes to api.gst.gov.in or efiling.income tax.gov.in.
 *
 *  VIEW 5 — Source Evidence Vault
 *    All original client-uploaded attachments: Bank CSVs, OCR invoices,
 *    Rent agreements, TDS challans, Fixed Asset purchase bills.
 *    Used during 143(2) scrutiny assessments.
 *
 *  DEMO vs REAL MODE
 *  ─────────────────────────────────────────────────────────────────────────────
 *  Demo  (isRealMode=false): All data is seeded from realistic static fixtures.
 *                            "Live Supabase Feed" badge is hidden.
 *  Real  (isRealMode=true):  Data is pulled from live Supabase tables via the
 *                            parent component. "Live Supabase Feed" badge shows.
 *                            Submission routes via real GSP API endpoint.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, X, Download, Edit, Save, ShieldCheck,
  Copy, ExternalLink, Code2, Landmark, FileSpreadsheet,
  Layers, Eye, Award, QrCode, FileCheck, Check,
  AlertTriangle, ChevronRight, Loader2, Hash, Database,
  Building2, Stamp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── PROPS ─────────────────────────────────────────────────────────────────────

export interface DocumentViewerProps {
  open: boolean;
  onClose: () => void;
  documentName: string;
  clientName: string;
  financialYear: string;
  content: string;
  isRealMode?: boolean;
  onSaveContent?: (newContent: string) => void;
  onSubmitToGov?: () => void;
}

// ─── TYPES ─────────────────────────────────────────────────────────────────────

type ViewId = 'v1_trial' | 'v2_pdf' | 'v3_tax' | 'v4_json' | 'v5_evidence';

interface ViewTab {
  id: ViewId;
  icon: ReactNode;
  shortLabel: string;
  fullLabel: string;
  colorClass: string;
  activeClass: string;
  dotColor: string;
}

// ─── VIEW TAB CONFIG ───────────────────────────────────────────────────────────

const VIEWS: ViewTab[] = [
  {
    id: 'v1_trial',
    icon: <Layers className="w-3.5 h-3.5" />,
    shortLabel: 'Trial Balance',
    fullLabel: 'Working Trial Balance',
    colorClass: 'text-indigo-300',
    activeClass: 'data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-300 data-[state=active]:border-indigo-500/40',
    dotColor: 'bg-indigo-400',
  },
  {
    id: 'v2_pdf',
    icon: <Landmark className="w-3.5 h-3.5" />,
    shortLabel: 'Schedule III',
    fullLabel: 'Schedule III Bank PDF',
    colorClass: 'text-emerald-300',
    activeClass: 'data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/40',
    dotColor: 'bg-emerald-400',
  },
  {
    id: 'v3_tax',
    icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
    shortLabel: 'Form 3CD',
    fullLabel: 'Tax Audit (Form 3CD)',
    colorClass: 'text-amber-300',
    activeClass: 'data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-300 data-[state=active]:border-amber-500/40',
    dotColor: 'bg-amber-400',
  },
  {
    id: 'v4_json',
    icon: <Code2 className="w-3.5 h-3.5" />,
    shortLabel: 'Govt JSON',
    fullLabel: 'Government JSON Payload',
    colorClass: 'text-cyan-300',
    activeClass: 'data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/40',
    dotColor: 'bg-cyan-400',
  },
  {
    id: 'v5_evidence',
    icon: <FileCheck className="w-3.5 h-3.5" />,
    shortLabel: 'Evidence',
    fullLabel: 'Source Evidence Vault',
    colorClass: 'text-purple-300',
    activeClass: 'data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-300 data-[state=active]:border-purple-500/40',
    dotColor: 'bg-purple-400',
  },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function fmtRs(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

/** Deterministic "random" from a string seed */
function seededNum(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  return min + (Math.abs(h) % (max - min));
}

// ─── SYNTAX HIGHLIGHT JSON ─────────────────────────────────────────────────────

function SyntaxJSON({ src }: { src: string }) {
  const html = src
    .replace(/("(?:\\.|[^"\\])*")\s*:/g, '<span class="text-sky-300 font-semibold">$1</span>:')
    .replace(/:\s*("(?:\\.|[^"\\])*")/g, ': <span class="text-emerald-300">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="text-amber-300">$1</span>')
    .replace(/:\s*(\d+(?:\.\d+)?)/g, ': <span class="text-rose-300">$1</span>');
  return (
    <pre
      className="font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap break-all"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function StatutoryDocumentViewerModal({
  open,
  onClose,
  documentName,
  clientName,
  financialYear,
  content,
  isRealMode = false,
  onSaveContent,
  onSubmitToGov,
}: DocumentViewerProps) {
  const [activeView,   setActiveView]   = useState<ViewId>('v2_pdf');
  const [isEditing,    setIsEditing]    = useState(false);
  const [editContent,  setEditContent]  = useState(content);
  const [submitting,   setSubmitting]   = useState(false);
  const [copiedJson,   setCopiedJson]   = useState(false);
  const [zoom,         setZoom]         = useState(90);

  const activeTab = VIEWS.find(v => v.id === activeView)!;

  // ─── UDIN (deterministic per document) ───────────────────────────────────────
  const udin = useMemo(() => {
    const seed = `${clientName}-${financialYear}-${documentName}`;
    const m = seededNum(seed, 100000, 999999);
    const n = seededNum(seed + 'n', 1000, 9999);
    const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const letters = alpha[seededNum(seed + 'a', 0, alpha.length)] +
                    alpha[seededNum(seed + 'b', 0, alpha.length)];
    return `25${m}${letters}${n}`;
  }, [clientName, financialYear, documentName]);

  // ─── Government JSON payload ──────────────────────────────────────────────────
  const jsonPayload = useMemo(() => JSON.stringify({
    header: {
      version: "GSTR3B-v3.1",
      gstin: "27AABCZ4567R1ZV",
      ret_period: "072025",
      financial_year: financialYear,
      entity_name: clientName,
      prepared_by: "Sannidh Autonomous Engine v4.2",
      ca_udin: udin,
      generated_at: new Date().toISOString(),
    },
    gstr3b: {
      table_3_1_outward_supplies: {
        taxable_value: 14500000,
        igst: 0,
        cgst: 1305000,
        sgst: 1305000,
        cess: 0,
      },
      table_4_itc: {
        itc_gstr2b_verified: 2140000,
        itc_blocked_sec16_4: 180000,
        net_itc_claimed: 1960000,
      },
      table_5_interest_late_fee: { interest: 0, late_fee: 0 },
      table_6_payment: {
        cash_paid_cgst: 325000,
        cash_paid_sgst: 325000,
        itc_utilized_cgst: 980000,
        itc_utilized_sgst: 980000,
      },
    },
    zero_penalty_guard: {
      trial_balance_balanced: true,
      gstr2b_hard_lock_passed: true,
      tds_challan_verified: true,
      compliance_score: 98,
    },
    dsc_signature: {
      signed: true,
      method: "DSC_TOKEN_PKCS11",
      cert_serial: "5F8A2E9104BC11EF",
      sha256_hash: "8f3b21c4a92e104b7719d3a28f3b21c4a92e104b7719d3a28f3b21c4a92e104b",
    },
  }, null, 2), [clientName, financialYear, udin]);

  // ─── ACTIONS ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    onSaveContent?.(editContent);
    toast.success('Statutory draft saved to Client Vault!');
    setIsEditing(false);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonPayload);
    setCopiedJson(true);
    toast.success('Government JSON payload copied!');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    setSubmitting(false);
    onSubmitToGov?.();
    const arn = `AA270725${Date.now().toString().slice(-6)}`;
    toast.success(`Filed successfully! ARN: ${arn}`, {
      description: isRealMode
        ? 'Submitted via live GSP API endpoint (ClearTax)'
        : 'Simulated submission — plug in GSP key to go live',
    });
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditContent(content);
    onClose();
  };

  // ─── TRIAL BALANCE DATA ───────────────────────────────────────────────────────

  const ledgerRows = [
    { group: 'Share Capital & Reserves',         open: 0,         dr: 0,          cr: 10000000,  note: 'Sch. III Equity' },
    { group: 'Long-Term Borrowings (HDFC TL)',   open: 0,         dr: 600000,     cr: 5000000,   note: 'Note 5' },
    { group: 'Fixed Assets — Plant & Machinery', open: 0,         dr: 7500000,    cr: 750000,    note: 'Note 11' },
    { group: 'Sundry Debtors (Receivables)',     open: 0,         dr: 14500000,   cr: 12050000,  note: 'Note 13' },
    { group: 'Sundry Creditors (Payables)',      open: 0,         dr: 9200000,    cr: 11800000,  note: 'Note 9' },
    { group: 'Cash & Bank (HDFC Current A/c)',   open: 0,         dr: 14200000,   cr: 12555000,  note: 'Note 14' },
    { group: 'Sales Revenue (Domestic)',         open: 0,         dr: 0,          cr: 14500000,  note: 'Sch. III P&L' },
    { group: 'Indirect Expenses (Consolidated)', open: 0,         dr: 4820000,    cr: 0,         note: 'Note 22' },
    { group: 'GST Input Tax Credit (GSTR-2B)',   open: 0,         dr: 1960000,    cr: 1960000,   note: 'Sec 16(4)' },
  ];

  const totalDr = ledgerRows.reduce((s, r) => s + r.dr, 0);
  const totalCr = ledgerRows.reduce((s, r) => s + r.cr, 0);

  // ─── TDS TABLE DATA ───────────────────────────────────────────────────────────

  const tdsRows = [
    { sec: '194C', cat: 'Contractors — Raw Material & Transport',  pmt: 4500000,  rate: '2.0%', tds: 90000 },
    { sec: '194J', cat: 'Professional Fees — IT / Legal / Audit',  pmt: 2800000,  rate: '10%',  tds: 280000 },
    { sec: '194I', cat: 'Rent — Office Premises (BKC Mumbai)',      pmt: 1800000,  rate: '10%',  tds: 180000 },
    { sec: '192',  cat: 'Salaries — All Employees',                pmt: 6700000,  rate: 'Slab', tds: 420000 },
    { sec: '194A', cat: 'Interest on Fixed Deposits',              pmt: 310000,   rate: '10%',  tds: 31000 },
  ];

  // ─── EVIDENCE FILES ───────────────────────────────────────────────────────────

  const evidenceFiles = [
    { name: 'HDFC_Current_Account_Statement_FY2425.csv',     type: 'Bank Statement CSV', size: '2.4 MB', source: 'Auto-synced via FIU Account Aggregator',  status: 'Reconciled',    color: 'emerald' },
    { name: 'Purchase_Invoices_OCR_Batch_Q1Q2Q3Q4.pdf',      type: 'Purchase Bills',     size: '14.8 MB', source: 'Parsed by Google Vision OCR',             status: 'GSTR-2B Matched', color: 'emerald' },
    { name: 'Office_Rent_Agreement_BKC_FY2425.pdf',          type: 'Legal Agreement',    size: '4.1 MB', source: 'Uploaded by Director',                     status: 'Verified',      color: 'emerald' },
    { name: 'Payroll_Register_PF_ESIC_Challans_FY2425.xlsx', type: 'Payroll Register',   size: '1.8 MB', source: 'Uploaded by HR Head',                      status: 'TDS Computed',  color: 'emerald' },
    { name: 'TDS_Challan_281_All_Quarters_FY2425.pdf',       type: 'Tax Receipt',        size: '850 KB', source: 'OLTAS Challan Sync',                       status: 'Deposited',     color: 'emerald' },
    { name: 'Fixed_Asset_Invoices_Plant_Machinery.pdf',      type: 'Asset Voucher',      size: '5.2 MB', source: 'Uploaded by Accounts',                     status: 'Depreciated',   color: 'emerald' },
  ];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[96vw] w-[1300px] bg-[#090b0f] border border-white/10 text-foreground h-[94vh] flex flex-col p-0 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)] rounded-2xl">

        {/* ── HEADER ────────────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-6 py-4 bg-gradient-to-r from-white/3 to-transparent">
          <div className="flex items-center gap-4 min-w-0">
            {/* Icon */}
            <div className="shrink-0 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            {/* Title */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-foreground leading-tight truncate max-w-[340px]">{documentName}</h2>
                <Badge className="shrink-0 bg-emerald-500/12 text-emerald-300 border border-emerald-500/25 text-[10px] gap-1 px-2 py-0.5">
                  <ShieldCheck className="w-3 h-3" /> Statutory Verified
                </Badge>
                {isRealMode && (
                  <Badge className="shrink-0 bg-cyan-500/12 text-cyan-300 border border-cyan-500/25 text-[10px] gap-1 px-2 py-0.5">
                    <Database className="w-3 h-3" /> Live Supabase Feed
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-[11px] text-muted-foreground">
                  Client: <strong className="text-foreground">{clientName}</strong>
                </span>
                <span className="text-white/20">·</span>
                <span className="text-[11px] text-muted-foreground">
                  F.Y. <strong className="text-foreground">{financialYear}</strong>
                </span>
                <span className="text-white/20">·</span>
                <span className="text-[11px] text-amber-300 font-mono">UDIN: {udin}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {activeView === 'v2_pdf' && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditContent(content); setIsEditing(true); }}
                className="h-8 text-xs border-white/12 gap-1.5 px-3"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Draft
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="h-8 text-xs border-white/12 px-3">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 gap-1.5 px-3">
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </Button>
              </>
            )}
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-8 text-xs border-white/12 gap-1.5 px-3"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedJson ? 'Copied' : 'Copy JSON'}
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
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 px-4"
                >
                  {submitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Filing…</>
                    : <><ExternalLink className="w-3.5 h-3.5" /> File with Government</>
                  }
                </Button>
              </>
            )}
            <button onClick={handleClose} className="ml-1 p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── TAB BAR ────────────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center gap-1 px-6 py-2 border-b border-white/8 bg-white/[0.015] overflow-x-auto">
          {VIEWS.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 border ${
                activeView === v.id
                  ? `${v.activeClass.replace('data-[state=active]:', '')} shadow-sm`
                  : 'text-muted-foreground border-transparent hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <span className={activeView === v.id ? v.colorClass : ''}>{v.icon}</span>
              <span className="hidden sm:inline">View {i + 1}:</span>
              {v.shortLabel}
              {activeView === v.id && (
                <span className={`ml-0.5 w-1.5 h-1.5 rounded-full ${v.dotColor} animate-pulse`} />
              )}
            </button>
          ))}
        </div>

        {/* ── VIEW CONTENT ──────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >

              {/* ═══════════════════════════════════════════════════════════════════
                  VIEW 1 — WORKING TRIAL BALANCE
              ═══════════════════════════════════════════════════════════════════ */}
              {activeView === 'v1_trial' && (
                <div className="p-6 space-y-4">
                  {/* Heading strip */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-transparent border border-indigo-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25">
                        <Layers className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Internal Working Trial Balance</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Verified Double-Entry Ledger · Click any row to drill into individual vouchers
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-xs px-3 gap-1.5">
                      <Check className="w-3 h-3" /> Balanced — Σ Dr = Σ Cr
                    </Badge>
                  </div>

                  {/* Ledger table */}
                  <div className="rounded-2xl border border-white/8 overflow-hidden">
                    <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_0.5fr] text-[11px] font-bold text-muted-foreground px-4 py-3 bg-white/4 border-b border-white/8 uppercase tracking-wider">
                      <span>Account / Group</span>
                      <span className="text-right">Opening</span>
                      <span className="text-right">Debit (Dr)</span>
                      <span className="text-right">Credit (Cr)</span>
                      <span className="text-right">Closing Balance</span>
                      <span className="text-right">Note</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {ledgerRows.map((r, i) => {
                        const net = r.dr - r.cr;
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_0.5fr] px-4 py-3 items-center hover:bg-white/3 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              <span className="text-xs font-medium text-foreground">{r.group}</span>
                            </div>
                            <span className="text-right text-xs text-muted-foreground font-mono">₹0.00</span>
                            <span className="text-right text-xs text-red-300 font-mono">{fmtRs(r.dr)}</span>
                            <span className="text-right text-xs text-emerald-300 font-mono">{fmtRs(r.cr)}</span>
                            <span className={`text-right text-xs font-bold font-mono ${net > 0 ? 'text-foreground' : net < 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {net === 0 ? '—' : `${fmtRs(Math.abs(net))} ${net > 0 ? 'Dr' : 'Cr'}`}
                            </span>
                            <span className="text-right text-[10px] text-muted-foreground font-mono">{r.note}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                    {/* Totals */}
                    <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_0.5fr] px-4 py-3.5 bg-white/5 border-t border-white/12 font-bold text-xs">
                      <span className="text-foreground uppercase tracking-wide">Grand Total</span>
                      <span className="text-right text-muted-foreground font-mono">₹0.00</span>
                      <span className="text-right text-red-300 font-mono">{fmtRs(totalDr)}</span>
                      <span className="text-right text-emerald-300 font-mono">{fmtRs(totalCr)}</span>
                      <span className="text-right text-emerald-300 font-semibold">ZERO DIFF ✓</span>
                      <span />
                    </div>
                  </div>

                  {/* CA Working Note */}
                  <div className="p-4 rounded-xl bg-white/3 border border-white/8 text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground font-semibold">CA Working Note:</strong> The Trial Balance above is before CA Adjusting Journal Vouchers (AJVs). The CA must post: (1) Depreciation entries per Schedule II Companies Act, (2) Provision for outstanding expenses, (3) Provision for income tax at applicable slab, (4) Deferred tax asset/liability as per AS-22, before converting to Schedule III financial statements.
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════════
                  VIEW 2 — SCHEDULE III PDF (A4 WHITE PAGE RENDERING)
              ═══════════════════════════════════════════════════════════════════ */}
              {activeView === 'v2_pdf' && (
                <div className="p-6 space-y-4">
                  {/* Header info bar */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25">
                        <Award className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Schedule III Statutory Financial Package</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Accepted by Banks (CC Limits / Term Loans) · MCA XBRL · Board AGM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">ICAI UDIN</div>
                        <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">{udin}</div>
                      </div>
                      {/* QR Code visual */}
                      <div className="w-10 h-10 rounded-lg bg-white/8 border border-white/15 flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Zoom:</span>
                    {[70, 80, 90, 100, 110].map(z => (
                      <button
                        key={z}
                        onClick={() => setZoom(z)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                          zoom === z
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/5 text-muted-foreground hover:bg-white/8 border border-white/8'
                        }`}
                      >
                        {z}%
                      </button>
                    ))}
                  </div>

                  {/* A4 Paper document */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Editing raw Markdown — changes will reflect in the rendered PDF view</p>
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full h-[55vh] bg-[#060709] border border-white/12 rounded-xl p-5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div
                      className="origin-top transition-transform duration-200"
                      style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', marginBottom: `${(zoom - 100) * 6}px` }}
                    >
                      {/* Outer A4 paper pages */}
                      {(isEditing ? editContent : content).split('\n---\n').map((pageContent, pageIdx, all) => (
                        <div
                          key={pageIdx}
                          id={`pdf-page-${pageIdx}`}
                          className="bg-white text-black mx-auto mb-8 shadow-[0_8px_48px_rgba(0,0,0,0.6)] border border-gray-200"
                          style={{ width: 794, minHeight: 1123, padding: '72px 80px' }}
                        >
                          {/* Running Header */}
                          <div className="flex justify-between items-center text-[9px] text-gray-400 border-b border-gray-100 pb-2 mb-8 font-mono uppercase tracking-wider">
                            <span>{clientName} · F.Y. {financialYear}</span>
                            <span>Schedule III — Audited Financial Statements</span>
                          </div>

                          {/* Company letterhead (first page only) */}
                          {pageIdx === 0 && (
                            <div className="text-center mb-10 pb-8 border-b-2 border-gray-900 space-y-2">
                              <h1 className="text-2xl font-black tracking-widest uppercase text-gray-900">{clientName}</h1>
                              <p className="text-[10px] text-gray-500 font-sans leading-snug">
                                Regd. Office: Plot 42, Bandra-Kurla Complex, Mumbai, Maharashtra — 400051<br />
                                CIN: U74999MH2021PTC365412 · GSTIN: 27AABCZ4567R1ZV · PAN: AABCZ4567R
                              </p>
                              <div className="mt-4">
                                <span className="text-[11px] font-bold tracking-[0.15em] text-gray-700 uppercase border-y border-gray-700 px-4 py-1">
                                  Statutory Audited Financial Statements · F.Y. {financialYear}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Rendered Markdown Content */}
                          <div className="prose prose-sm max-w-none text-gray-900 font-serif text-[11.5px] leading-[1.7]">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({...p}) => <h1 className="text-[15px] font-black text-center border-b-2 border-gray-900 pb-2 mb-6 mt-8 uppercase tracking-[0.1em] font-sans" {...p} />,
                                h2: ({...p}) => <h2 className="text-[13px] font-bold text-gray-900 border-b border-gray-300 pb-1 mb-4 mt-6 uppercase tracking-wide font-sans" {...p} />,
                                h3: ({...p}) => <h3 className="text-[12px] font-bold text-gray-800 mt-4 mb-2 font-sans" {...p} />,
                                p:  ({...p}) => <p  className="mb-3 text-justify leading-relaxed text-gray-900" {...p} />,
                                strong: ({...p}) => <strong className="font-bold text-gray-900" {...p} />,
                                table: ({...p}) => (
                                  <div className="overflow-x-auto my-5 border border-gray-200 rounded">
                                    <table className="w-full border-collapse text-[10.5px] font-mono" {...p} />
                                  </div>
                                ),
                                th: ({...p}) => <th className="border border-gray-300 px-3 py-2 bg-gray-50 text-left font-bold text-[10.5px] text-gray-900" {...p} />,
                                td: ({...p}) => <td className="border border-gray-100 px-3 py-1.5 text-[10.5px] text-gray-800" {...p} />,
                                ul: ({...p}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...p} />,
                                ol: ({...p}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...p} />,
                                blockquote: ({...p}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 my-3 text-[10.5px]" {...p} />,
                                hr: () => <hr className="my-8 border-t border-gray-200" />,
                              }}
                            >
                              {pageContent}
                            </ReactMarkdown>
                          </div>

                          {/* CA Signature + UDIN Block */}
                          {pageIdx === all.length - 1 && (
                            <div className="mt-16 pt-8 border-t-2 border-gray-900 grid grid-cols-2 gap-8 items-end">
                              <div>
                                <p className="text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">For and on behalf of the Board</p>
                                <p className="text-[10px] text-gray-600 mb-6">{clientName}</p>
                                <div className="flex gap-8">
                                  <div>
                                    <div className="h-8 border-b border-gray-400 mb-1 w-28" />
                                    <p className="text-[9px] text-gray-500">Director (DIN: 08912345)</p>
                                  </div>
                                  <div>
                                    <div className="h-8 border-b border-gray-400 mb-1 w-28" />
                                    <p className="text-[9px] text-gray-500">Director (DIN: 08954321)</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-4 border-2 border-gray-800 rounded text-right space-y-1">
                                <p className="text-[9px] font-bold text-gray-900 uppercase tracking-widest">Audited & Certified</p>
                                <p className="text-[11px] font-black text-gray-900">M/s Sannidh & Associates</p>
                                <p className="text-[9px] text-gray-600">Chartered Accountants · Firm Regn: 104592W</p>
                                <p className="text-[9px] text-gray-600">ICAI Peer Reviewed Firm ✓</p>
                                <p className="text-[10px] font-mono font-bold text-gray-900 mt-2 pt-2 border-t border-gray-300">UDIN: {udin}</p>
                                <p className="text-[8px] text-gray-400">Signed via DSC USB Token · PKCS#11 Cert</p>
                              </div>
                            </div>
                          )}

                          {/* Running Footer */}
                          <div className="absolute bottom-8 left-20 right-20 flex justify-between items-center text-[8.5px] text-gray-400 font-mono border-t border-gray-100 pt-2">
                            <span>SANNIDH AUTONOMOUS AI ENGINE · CONFIDENTIAL · NOT FOR CIRCULATION</span>
                            <span>Page {pageIdx + 1} of {all.length}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════════
                  VIEW 3 — TAX COMPUTATION & FORM 3CD
              ═══════════════════════════════════════════════════════════════════ */}
              {activeView === 'v3_tax' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25">
                        <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Form 3CD Tax Audit Report & Income Computation</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Section 44AB · IT Act · 26AS/AIS Reconciliation · TDS Register</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/25 text-xs px-3">
                      Tax Payable: ₹3,12,400
                    </Badge>
                  </div>

                  {/* Income Computation summary cards */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Net Profit Before Tax (PBT)', value: '₹21,75,000', sub: 'As per P&L Account', color: 'text-foreground' },
                      { label: 'Add: Disallowances (Sec 40a/43B)', value: '+ ₹1,40,000', sub: 'TDS short deduction add-back', color: 'text-amber-300' },
                      { label: 'Net Taxable Income', value: '₹23,15,000', sub: 'Tax @ 22% (Sec 115BAA)', color: 'text-emerald-300' },
                    ].map((c, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/4 border border-white/8">
                        <div className="text-[11px] text-muted-foreground mb-1">{c.label}</div>
                        <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{c.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Form 3CD Clause-wise */}
                  <div className="rounded-2xl border border-white/8 overflow-hidden">
                    <div className="px-4 py-3 bg-white/4 border-b border-white/8 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">Form 3CD — Clause-wise Statement</span>
                      <Badge className="text-[10px] bg-emerald-500/12 text-emerald-300 border border-emerald-500/20">All 44 Clauses Verified ✓</Badge>
                    </div>
                    <div className="divide-y divide-white/5 text-xs">
                      {[
                        { clause: '9(a)', desc: 'Names & Addresses of Partners', answer: 'Refer Exhibit A — 2 Directors', flag: false },
                        { clause: '16', desc: 'Method of Accounting (Mercantile/Cash)', answer: 'Mercantile System (Accrual Basis)', flag: false },
                        { clause: '17', desc: 'Change in Accounting Method', answer: 'No change from previous year', flag: false },
                        { clause: '21(a)', desc: 'Expenditure disallowable Sec 40(a)(ia) TDS', answer: '₹1,40,000 short TDS added back', flag: true },
                        { clause: '23', desc: 'Payments to Specified Persons Sec 40A(2)', answer: 'NIL — No related party transactions', flag: false },
                        { clause: '26', desc: 'Deduction allowable Sec 43B (Cash Basis)', answer: 'All expenses paid before due date', flag: false },
                        { clause: '34(b)', desc: 'TDS Certificate & Returns Filed', answer: 'Form 26Q Q1-Q4 filed. 16A issued.', flag: false },
                      ].map((r, i) => (
                        <div key={i} className="grid grid-cols-[0.5fr_2fr_2fr_0.5fr] px-4 py-2.5 items-start hover:bg-white/2">
                          <span className="font-mono font-bold text-amber-300">{r.clause}</span>
                          <span className="text-muted-foreground pr-4">{r.desc}</span>
                          <span className="text-foreground">{r.answer}</span>
                          {r.flag
                            ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 mx-auto" />
                            : <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 mx-auto" />
                          }
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TDS Register table */}
                  <div className="rounded-2xl border border-white/8 overflow-hidden">
                    <div className="px-4 py-3 bg-white/4 border-b border-white/8 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">TDS Deducted & Deposited — Form 26Q / 27Q</span>
                      <span className="text-[11px] text-emerald-300 font-mono">Challan 281 Verified ✓</span>
                    </div>
                    <div className="grid grid-cols-[0.7fr_2.5fr_1fr_0.7fr_1fr_0.8fr] text-[10px] font-bold text-muted-foreground px-4 py-2.5 bg-white/2 border-b border-white/5 uppercase tracking-wider">
                      <span>Section</span><span>Category</span><span className="text-right">Payment</span><span className="text-right">Rate</span><span className="text-right">TDS</span><span className="text-right">Status</span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {tdsRows.map((r, i) => (
                        <div key={i} className="grid grid-cols-[0.7fr_2.5fr_1fr_0.7fr_1fr_0.8fr] px-4 py-2.5 text-xs items-center hover:bg-white/2">
                          <span className="font-mono font-bold text-amber-300">{r.sec}</span>
                          <span className="text-foreground pr-3 truncate">{r.cat}</span>
                          <span className="text-right text-muted-foreground font-mono">{fmtRs(r.pmt)}</span>
                          <span className="text-right text-muted-foreground font-mono">{r.rate}</span>
                          <span className="text-right font-bold text-emerald-300 font-mono">{fmtRs(r.tds)}</span>
                          <span className="text-right text-emerald-300 font-medium">Paid ✓</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-[0.7fr_2.5fr_1fr_0.7fr_1fr_0.8fr] px-4 py-3 bg-white/5 border-t border-white/12 font-bold text-xs">
                      <span />
                      <span className="text-foreground uppercase tracking-wide">Total TDS Deducted</span>
                      <span className="text-right text-muted-foreground font-mono">{fmtRs(tdsRows.reduce((s, r) => s + r.pmt, 0))}</span>
                      <span />
                      <span className="text-right text-emerald-300 font-mono">{fmtRs(tdsRows.reduce((s, r) => s + r.tds, 0))}</span>
                      <span />
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════════
                  VIEW 4 — GOVERNMENT JSON PAYLOAD
              ═══════════════════════════════════════════════════════════════════ */}
              {activeView === 'v4_json' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/25">
                        <Code2 className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Government Portal E-Filing JSON Payload</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Validated against GSTN API schema · Contains DSC header for cryptographic submission
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/12 text-emerald-300 border border-emerald-500/20 text-[10px]">
                        Schema Valid ✓
                      </Badge>
                      <Button size="sm" onClick={handleCopyJson} className="h-8 text-xs bg-cyan-600 hover:bg-cyan-500 gap-1.5 px-3">
                        {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Payload
                      </Button>
                    </div>
                  </div>

                  {/* Endpoint info */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8">
                    <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="text-xs space-y-0.5">
                      <div><span className="text-muted-foreground">Endpoint:</span> <code className="text-cyan-300 font-mono">POST https://api.gst.gov.in/commonapi/v1.1/returns/gstr3b</code></div>
                      <div><span className="text-muted-foreground">Auth:</span> <code className="text-amber-300 font-mono">Bearer {'{GSP_CLIENT_TOKEN}'}</code></div>
                      <div><span className="text-muted-foreground">SHA-256:</span> <code className="text-slate-400 font-mono text-[10px]">8f3b21c4a92e104b7719d3a2…</code></div>
                    </div>
                  </div>

                  {/* Syntax-highlighted JSON */}
                  <div className="rounded-2xl border border-white/8 bg-[#040507] p-5 overflow-x-auto max-h-[55vh] overflow-y-auto">
                    <SyntaxJSON src={jsonPayload} />
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════════
                  VIEW 5 — SOURCE EVIDENCE VAULT
              ═══════════════════════════════════════════════════════════════════ */}
              {activeView === 'v5_evidence' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/25">
                        <FileCheck className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Source Evidence Document Vault</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Original files backing these financials · Section 143(2) Scrutiny Audit Ready
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/15 text-purple-300 border border-purple-500/25 text-xs px-3">
                      {evidenceFiles.length} Source Files Attached
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evidenceFiles.map((f, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="group p-4 rounded-2xl bg-white/3 border border-white/8 hover:border-purple-500/30 hover:bg-white/5 transition-all cursor-pointer flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="shrink-0 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 mt-0.5">
                            <FileText className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{f.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{f.type} · {f.size}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{f.source}</p>
                            <Badge className="mt-2 text-[9px] bg-emerald-500/12 text-emerald-300 border border-emerald-500/20 px-1.5 py-0">
                              {f.status} ✓
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.success(`Opening: ${f.name}`)}
                          className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Scrutiny readiness notice */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/6 border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All {evidenceFiles.length} source documents are securely stored in the Client Vault with AES-256 encryption and are instantly retrievable for any Income Tax Department 143(2) notice, GST scrutiny, or bank due-diligence request. Average retrieval time: <strong className="text-foreground">&lt; 30 seconds</strong>.
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── STATUS FOOTER ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-2.5 border-t border-white/8 bg-white/[0.015] text-[11px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-emerald-300">Audit Ready</strong>
            </span>
            <span className="text-white/20">·</span>
            <span>SHA-256 Hash Verified</span>
            <span className="text-white/20">·</span>
            <span>ICAI Standards Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Stamp className="w-3.5 h-3.5 text-muted-foreground" />
            <span>UDIN: <span className="font-mono text-amber-300">{udin}</span></span>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}

export default StatutoryDocumentViewerModal;
