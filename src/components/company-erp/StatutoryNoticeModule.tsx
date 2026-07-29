/**
 * STATUTORY NOTICE MODULE — PHASE 4 UI
 * ======================================
 * AI Agentic Tax Assistant & Statutory Notice Parsing Engine.
 *
 * Tabs:
 *  1. Notice Inbox        — All notices, severity filter, status tracker, deadline countdown
 *  2. Notice Detail       — Full notice viewer with extracted OCR fields
 *  3. AI Legal Draft      — Auto-generated legal response with case law citations
 *  4. Risk Analyser       — Financial + Time + Legal complexity scoring
 *  5. Case Law Library    — GST + IT + Labour precedent database
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, FileText, Clock, CheckCircle2,
  XCircle, Download, ChevronRight, BookOpen, Gavel,
  Scale, AlertCircle, Eye, Copy, Zap, Search, Filter,
  Building2, Landmark, Package, Users, ArrowRight,
  TrendingUp, BarChart3, Star, Hash, Info,
} from "lucide-react";

import type {
  StatutoryNotice, NoticeRiskScore, LegalDraftResponse,
  NoticeAuthority, NoticeCategory, NoticeSeverity,
} from "@/lib/accounting/statutory-notice-parser";
import { CASE_LAW_DATABASE } from "@/lib/accounting/statutory-notice-parser";

interface StatutoryNoticeModuleProps {
  mode: "demo" | "real";
  notices: StatutoryNotice[];
  legalDrafts: Record<string, LegalDraftResponse>;
  riskScores: Record<string, NoticeRiskScore>;
  dashboardSummary: {
    total_notices: number;
    critical_notices: number;
    high_notices: number;
    overdue_notices: number;
    total_demand: number;
    total_gst_demand: number;
    total_it_demand: number;
    notices_by_status: { received: number; response_drafted: number; response_filed: number };
  };
  companyName: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `₹${Math.abs(n).toLocaleString("en-IN")}`;
}
function fmtL(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return fmt(n);
}

function getSeverityStyle(s: NoticeSeverity): string {
  switch (s) {
    case "CRITICAL": return "bg-red-500/15 text-red-300 border-red-500/30";
    case "HIGH":     return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "MEDIUM":   return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    case "LOW":      return "bg-green-500/15 text-green-300 border-green-500/30";
  }
}

function getStatusStyle(s: StatutoryNotice["status"]): string {
  switch (s) {
    case "RECEIVED":          return "bg-blue-500/15 text-blue-300 border-blue-500/25";
    case "RESPONSE_DRAFTED":  return "bg-purple-500/15 text-purple-300 border-purple-500/25";
    case "RESPONSE_FILED":    return "bg-cyan-500/15 text-cyan-300 border-cyan-500/25";
    case "ADJUDICATED":       return "bg-amber-500/15 text-amber-300 border-amber-500/25";
    case "APPEAL_FILED":      return "bg-orange-500/15 text-orange-300 border-orange-500/25";
    case "CLOSED_FAVORABLE":  return "bg-green-500/15 text-green-300 border-green-500/25";
    case "CLOSED_ADVERSE":    return "bg-red-500/15 text-red-300 border-red-500/25";
    default:                  return "bg-slate-500/15 text-slate-300 border-slate-500/25";
  }
}

function getAuthorityIcon(a: NoticeAuthority) {
  switch (a) {
    case "GST_DEPARTMENT":         return <Shield className="w-3.5 h-3.5 text-blue-400" />;
    case "INCOME_TAX_DEPARTMENT":  return <Landmark className="w-3.5 h-3.5 text-amber-400" />;
    case "MCA_ROC":                return <Building2 className="w-3.5 h-3.5 text-purple-400" />;
    case "EPFO":                   return <Users className="w-3.5 h-3.5 text-green-400" />;
    default:                       return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function getAuthorityLabel(a: NoticeAuthority): string {
  switch (a) {
    case "GST_DEPARTMENT":         return "GST Dept";
    case "INCOME_TAX_DEPARTMENT":  return "Income Tax";
    case "MCA_ROC":                return "MCA / ROC";
    case "EPFO":                   return "EPFO";
    case "ESIC":                   return "ESIC";
    case "PROFESSIONAL_TAX":       return "Prof Tax";
    case "CUSTOMS":                return "Customs";
    case "ENFORCEMENT_DIRECTORATE": return "ED";
    default:                       return a;
  }
}

function DaysChip({ days }: { days: number }) {
  if (days < 0) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
      <XCircle className="w-3 h-3" /> OVERDUE {Math.abs(days)}d
    </span>
  );
  if (days <= 3) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/25 animate-pulse">
      <Clock className="w-3 h-3" /> {days}d left
    </span>
  );
  if (days <= 7) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
      <Clock className="w-3 h-3" /> {days}d left
    </span>
  );
  if (days <= 15) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-300 border border-yellow-500/20">
      <Clock className="w-3 h-3" /> {days}d left
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-300 border border-green-500/20">
      <CheckCircle2 className="w-3 h-3" /> {days}d left
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: NOTICE INBOX
// ─────────────────────────────────────────────────────────────────────────────

function NoticeInboxTab({
  notices,
  riskScores,
  summary,
  onSelect,
}: {
  notices: StatutoryNotice[];
  riskScores: Record<string, NoticeRiskScore>;
  summary: StatutoryNoticeModuleProps["dashboardSummary"];
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [search, setSearch] = useState("");

  const filtered = notices.filter(n => {
    const matchFilter = filter === "ALL" || n.severity === filter;
    const matchSearch = !search || n.notice_type.toLowerCase().includes(search.toLowerCase()) ||
      n.issuing_office.toLowerCase().includes(search.toLowerCase()) ||
      n.notice_number.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-black/20"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
          <div>
            <p className="text-xl font-bold text-red-300">{summary.critical_notices}</p>
            <p className="text-[10px] text-muted-foreground">Critical Notices</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-black/20"><Clock className="w-4 h-4 text-amber-400" /></div>
          <div>
            <p className="text-xl font-bold text-amber-300">{summary.overdue_notices}</p>
            <p className="text-[10px] text-muted-foreground">Overdue Responses</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-black/20"><Shield className="w-4 h-4 text-blue-400" /></div>
          <div>
            <p className="text-lg font-bold text-blue-300 font-mono">{fmtL(summary.total_gst_demand)}</p>
            <p className="text-[10px] text-muted-foreground">Total GST Demand</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-black/20"><Landmark className="w-4 h-4 text-purple-400" /></div>
          <div>
            <p className="text-lg font-bold text-purple-300 font-mono">{fmtL(summary.total_it_demand)}</p>
            <p className="text-[10px] text-muted-foreground">Total IT Demand</p>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by notice type, number, office..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/40"
          />
        </div>
        <div className="flex gap-1">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                filter === f
                  ? f === "ALL" ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/25"
                    : f === "CRITICAL" ? "bg-red-500/20 text-red-300 border-red-500/30"
                    : f === "HIGH" ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : f === "MEDIUM" ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/25"
                    : "bg-green-500/15 text-green-300 border-green-500/25"
                  : "bg-white/3 text-muted-foreground border-white/8 hover:bg-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Cards */}
      <div className="space-y-2">
        {filtered.map(notice => {
          const risk = riskScores[notice.id];
          return (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="group p-3 rounded-xl border border-white/8 bg-card/40 hover:bg-white/5 hover:border-white/15 transition-all cursor-pointer"
              onClick={() => onSelect(notice.id)}
            >
              <div className="flex items-start gap-3">
                {/* Left: Authority Icon */}
                <div className="p-2 rounded-lg bg-white/5 border border-white/8 shrink-0 mt-0.5">
                  {getAuthorityIcon(notice.issuing_authority)}
                </div>

                {/* Center: Notice Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-foreground">{notice.notice_type}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getSeverityStyle(notice.severity)}`}>
                      {notice.severity}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getStatusStyle(notice.status)}`}>
                      {notice.status.replace(/_/g, " ")}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] text-muted-foreground bg-white/4 border border-white/8">
                      {getAuthorityLabel(notice.issuing_authority)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{notice.notice_number}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{notice.issuing_office}</p>
                  {notice.total_demand && notice.total_demand > 0 && (
                    <p className="text-xs font-bold text-red-300 font-mono mt-1">Total Demand: {fmtL(notice.total_demand)}</p>
                  )}
                </div>

                {/* Right: Days + Risk */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <DaysChip days={notice.days_remaining} />
                  {risk && (
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${risk.overall_score >= 75 ? "bg-red-400" : risk.overall_score >= 50 ? "bg-amber-400" : risk.overall_score >= 25 ? "bg-yellow-400" : "bg-green-400"}`}
                          style={{ width: `${risk.overall_score}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{risk.overall_score}/100</span>
                    </div>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: NOTICE DETAIL VIEWER
// ─────────────────────────────────────────────────────────────────────────────

function NoticeDetailTab({ notice, onBack }: { notice: StatutoryNotice; onBack: () => void }) {
  return (
    <div className="space-y-4">
      {/* Back Button + Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all">
          ← Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">{notice.notice_type}</h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityStyle(notice.severity)}`}>{notice.severity}</span>
            <DaysChip days={notice.days_remaining} />
          </div>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{notice.notice_number}</p>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {[
          { label: "Notice Date", value: notice.notice_date },
          { label: "Response Due", value: notice.response_due_date, highlight: true },
          { label: "Issuing Officer", value: notice.issuing_officer },
          { label: "Authority", value: getAuthorityLabel(notice.issuing_authority) },
          { label: "PAN", value: notice.company_pan },
          notice.company_gstin ? { label: "GSTIN", value: notice.company_gstin } : { label: "Assessment Year", value: notice.assessment_year || "—" },
          { label: "Status", value: notice.status.replace(/_/g, " ") },
          { label: "Issuing Office", value: notice.issuing_office },
        ].map((m, i) => (
          <div key={i} className={`p-2.5 rounded-xl border ${m.highlight ? "border-amber-500/25 bg-amber-500/5" : "border-white/8 bg-white/2"}`}>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
            <p className={`font-semibold mt-0.5 font-mono text-[11px] break-all ${m.highlight ? "text-amber-300" : "text-foreground"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Demand Breakdown */}
      {(notice.total_demand || 0) > 0 && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
          <p className="text-xs font-bold text-red-300 mb-2">💰 Financial Demand Breakdown</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground">Tax Demand</p>
              <p className="font-mono font-bold text-foreground">{notice.demand_amount ? fmtL(notice.demand_amount) : "Nil"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Interest</p>
              <p className="font-mono font-bold text-amber-300">{notice.interest_amount ? fmtL(notice.interest_amount) : "Nil"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Penalty</p>
              <p className="font-mono font-bold text-red-400">{notice.penalty_amount ? fmtL(notice.penalty_amount) : "Nil"}</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-red-500/15 flex justify-between">
            <span className="text-xs font-semibold text-muted-foreground">TOTAL DEMAND:</span>
            <span className="text-sm font-bold text-red-300 font-mono">{fmtL(notice.total_demand || 0)}</span>
          </div>
        </div>
      )}

      {/* Extracted OCR Fields */}
      {notice.extracted_fields.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-card/40 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/8 bg-white/2 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-foreground">AI-Extracted Fields (OCR)</span>
          </div>
          <div className="divide-y divide-white/4">
            {notice.extracted_fields.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="text-muted-foreground">{f.field_name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-foreground">{f.value}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${f.confidence === "high" ? "bg-green-500/15 text-green-300" : f.confidence === "medium" ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300"}`}>
                    {f.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal Grounds */}
      <div className="p-3 rounded-xl border border-white/8 bg-card/40">
        <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-purple-400" /> Legal Grounds Invoked</p>
        <div className="flex flex-wrap gap-1.5">
          {notice.legal_grounds.map((g, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-mono">{g}</span>
          ))}
        </div>
      </div>

      {/* Issues Raised */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Issues Raised by Department ({notice.issues_raised.length})</p>
        {notice.issues_raised.map((issue, i) => (
          <div key={issue.issue_id} className="p-3 rounded-xl border border-amber-500/15 bg-amber-500/5 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-bold text-amber-400 font-mono shrink-0">Issue {i + 1}</span>
              <p className="text-xs font-semibold text-foreground">{issue.description}</p>
            </div>
            {issue.amount_involved > 0 && (
              <p className="text-xs text-amber-300 font-mono">Amount Involved: {fmtL(issue.amount_involved)} | Section: {issue.section_invoked}</p>
            )}
            <div className="text-[10px] text-muted-foreground bg-black/20 rounded-lg p-2">
              <p className="font-semibold text-amber-300/80 mb-1">Dept's Contention:</p>
              <p>{issue.department_contention}</p>
            </div>
            <div className="text-[10px] text-muted-foreground bg-green-500/5 border border-green-500/10 rounded-lg p-2">
              <p className="font-semibold text-green-300/80 mb-1">Our Defense:</p>
              <p>{issue.taxpayer_defense}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: AI LEGAL DRAFT RESPONSE
// ─────────────────────────────────────────────────────────────────────────────

function AILegalDraftTab({ notices, drafts, onSelectNotice, selectedId }: {
  notices: StatutoryNotice[];
  drafts: Record<string, LegalDraftResponse>;
  onSelectNotice: (id: string) => void;
  selectedId: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const draft = selectedId ? drafts[selectedId] : null;
  const notice = selectedId ? notices.find(n => n.id === selectedId) : null;

  const handleCopy = () => {
    if (draft) {
      navigator.clipboard.writeText(draft.full_draft_text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Notice Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {notices.map(n => (
          <button
            key={n.id}
            onClick={() => onSelectNotice(n.id)}
            className={`text-left p-2.5 rounded-xl border transition-all text-xs ${
              selectedId === n.id
                ? "bg-cyan-500/15 border-cyan-500/30 text-foreground"
                : "bg-card/40 border-white/8 hover:bg-white/5 text-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {getAuthorityIcon(n.issuing_authority)}
              <span className={`text-[9px] font-bold border px-1 rounded ${getSeverityStyle(n.severity)}`}>{n.severity}</span>
            </div>
            <p className="font-semibold text-[11px] text-foreground line-clamp-1">{n.notice_type}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{n.notice_number}</p>
          </button>
        ))}
      </div>

      {draft && notice ? (
        <div className="space-y-3">
          {/* Draft Header */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-2">
                <Gavel className="w-3.5 h-3.5 text-cyan-400" />
                AI-Generated Legal Response Draft
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{draft.draft_subject}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${copied ? "bg-green-500/15 text-green-300 border-green-500/25" : "bg-cyan-500/15 text-cyan-300 border-cyan-500/25 hover:bg-cyan-500/25"}`}>
                <Copy className="w-3 h-3" />
                {copied ? "Copied!" : "Copy Draft"}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground transition-all">
                <Download className="w-3 h-3" /> Export PDF
              </button>
            </div>
          </div>

          {/* Issue Responses with Case Laws */}
          {draft.issue_responses.map((ir, i) => (
            <div key={ir.issue_id} className="rounded-xl border border-white/8 bg-card/40 overflow-hidden">
              <div className="px-3 py-2 border-b border-white/8 bg-white/2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-400 font-mono">Response to Issue {i + 1}</span>
              </div>
              <div className="p-3 space-y-3">
                <div className="text-xs text-muted-foreground bg-white/2 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                  {ir.response_para.trim()}
                </div>

                {/* Case Laws */}
                {ir.supporting_case_laws.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-purple-300 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" /> Cited Precedents
                    </p>
                    {ir.supporting_case_laws.map((cl, j) => (
                      <div key={j} className="p-2.5 rounded-lg border border-purple-500/15 bg-purple-500/5 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-mono text-[10px] text-purple-300 font-bold">{cl.citation}</p>
                            <p className="font-semibold text-foreground mt-0.5">{cl.case_name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{cl.court} ({cl.year})</p>
                            <p className="text-[10px] text-cyan-300 mt-1 italic">"{cl.ruling_summary}"</p>
                            <p className="text-[10px] text-muted-foreground mt-1">↳ {cl.relevance}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${cl.favorable_to === "TAXPAYER" ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>
                            {cl.favorable_to === "TAXPAYER" ? "✓ For Us" : "Dept"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Documents to Attach */}
                <div>
                  <p className="text-[10px] font-bold text-amber-300 mb-1.5 flex items-center gap-1"><FileText className="w-3 h-3" /> Documents to Attach</p>
                  <div className="flex flex-wrap gap-1">
                    {ir.documents_to_attach.map((d, j) => (
                      <span key={j} className="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 border border-amber-500/15 text-amber-300">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Prayer Section */}
          <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5">
            <p className="text-[10px] font-bold text-green-300 mb-2 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Prayer</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{draft.prayer}</p>
          </div>

          {/* Enclosures */}
          <div className="p-3 rounded-xl border border-white/8 bg-card/40">
            <p className="text-[10px] font-bold text-foreground mb-2">📎 Enclosures</p>
            <div className="space-y-0.5">
              {draft.enclosures.map((e, i) => (
                <p key={i} className="text-[10px] text-muted-foreground">{e}</p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Gavel className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">Select a notice above to view the AI-generated legal draft response</p>
          <p className="text-xs mt-1">All drafts include case law citations, issue-by-issue responses, and document checklists</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: RISK ANALYSER
// ─────────────────────────────────────────────────────────────────────────────

function RiskAnalyserTab({ notices, riskScores }: { notices: StatutoryNotice[]; riskScores: Record<string, NoticeRiskScore> }) {
  const sorted = [...notices].sort((a, b) => (riskScores[b.id]?.overall_score || 0) - (riskScores[a.id]?.overall_score || 0));

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl border border-white/8 bg-card/40">
        <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          Notice Risk Scoring Engine
        </p>
        <p className="text-[10px] text-muted-foreground mb-4">
          Risk score (0–100) is computed from 3 components: Financial Risk (0–40) based on demand amount and severity, Time Risk (0–30) based on days remaining, and Legal Complexity (0–30) based on notice category.
        </p>

        <div className="space-y-3">
          {sorted.map(notice => {
            const risk = riskScores[notice.id];
            if (!risk) return null;
            const bar_color = risk.overall_score >= 75 ? "bg-gradient-to-r from-red-500 to-red-400"
              : risk.overall_score >= 50 ? "bg-gradient-to-r from-amber-500 to-amber-400"
              : risk.overall_score >= 25 ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
              : "bg-gradient-to-r from-green-500 to-green-400";

            return (
              <div key={notice.id} className="p-3 rounded-xl border border-white/8 bg-white/2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getAuthorityIcon(notice.issuing_authority)}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{notice.notice_type}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{notice.notice_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DaysChip days={notice.days_remaining} />
                    <span className={`text-base font-bold font-mono ${risk.risk_label === "CRITICAL" ? "text-red-400" : risk.risk_label === "HIGH" ? "text-amber-400" : risk.risk_label === "MEDIUM" ? "text-yellow-400" : "text-green-400"}`}>
                      {risk.overall_score}
                    </span>
                  </div>
                </div>

                {/* Composite Score Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${risk.overall_score}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className={`h-full rounded-full ${bar_color}`}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="text-center">
                      <p className="text-muted-foreground">Financial Risk</p>
                      <p className="font-bold text-red-300">{risk.financial_risk}/40</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Time Risk</p>
                      <p className="font-bold text-amber-300">{risk.time_risk}/30</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Legal Complexity</p>
                      <p className="font-bold text-purple-300">{risk.legal_complexity}/30</p>
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                {risk.key_risk_factors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {risk.key_risk_factors.map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/10 border border-red-500/15 text-red-300">⚠ {f}</span>
                    ))}
                  </div>
                )}

                {/* Recommended Actions */}
                <div className="flex flex-wrap gap-1">
                  {risk.recommended_actions.map((a, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 border border-cyan-500/15 text-cyan-300">→ {a}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5: CASE LAW LIBRARY
// ─────────────────────────────────────────────────────────────────────────────

function CaseLawLibraryTab() {
  const [activeCategory, setActiveCategory] = useState<string>("GST_SCRUTINY");

  const CATEGORIES: Array<{ id: string; label: string; icon: typeof Shield }> = [
    { id: "GST_SCRUTINY", label: "GST Scrutiny (ASMT-10)", icon: Shield },
    { id: "GST_DEMAND", label: "GST Demand (SCN 73/74)", icon: AlertTriangle },
    { id: "GST_CANCELLATION", label: "GST Cancellation (REG-17)", icon: XCircle },
    { id: "IT_SCRUTINY", label: "IT Scrutiny (Sec 143)", icon: Landmark },
    { id: "IT_REASSESSMENT", label: "IT Reassessment (Sec 148)", icon: BookOpen },
    { id: "IT_TDS_DEFAULT", label: "TDS Default (Sec 201)", icon: Scale },
  ];

  const laws = CASE_LAW_DATABASE[activeCategory] || [];

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveCategory(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all whitespace-nowrap ${
              activeCategory === id
                ? "bg-cyan-500/15 border-cyan-500/25 text-cyan-300"
                : "bg-white/3 border-white/8 text-muted-foreground hover:bg-white/5"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Case Laws */}
      <div className="space-y-3">
        {laws.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No case laws in this category</p>
          </div>
        ) : laws.map((cl, i) => (
          <div key={i} className="p-3 rounded-xl border border-white/8 bg-card/40 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-purple-300 font-bold">{cl.citation}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${cl.favorable_to === "TAXPAYER" ? "bg-green-500/15 text-green-300 border-green-500/25" : "bg-red-500/15 text-red-300 border-red-500/25"}`}>
                    {cl.favorable_to === "TAXPAYER" ? "✓ Taxpayer Wins" : "Dept Wins"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-white/10 text-muted-foreground">{cl.court}</span>
                  <span className="text-[9px] text-muted-foreground">{cl.year}</span>
                </div>
                <p className="text-xs font-bold text-foreground mt-1.5">{cl.case_name}</p>
              </div>
              <Gavel className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            </div>
            <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
              <p className="text-[10px] text-cyan-300 italic">"{cl.ruling_summary}"</p>
            </div>
            <div className="p-2 rounded-lg bg-white/2 border border-white/5">
              <p className="text-[10px] text-muted-foreground"><span className="text-amber-300 font-semibold">When to cite: </span>{cl.relevance}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const NOTICE_TABS = [
  { id: "inbox",    label: "Notice Inbox",      icon: AlertTriangle },
  { id: "detail",   label: "Notice Detail",     icon: Eye },
  { id: "draft",    label: "AI Legal Draft",    icon: Gavel },
  { id: "risk",     label: "Risk Analyser",     icon: BarChart3 },
  { id: "caselaws", label: "Case Law Library",  icon: BookOpen },
] as const;

type NoticeTabId = typeof NOTICE_TABS[number]["id"];

export function StatutoryNoticeModule({
  mode, notices, legalDrafts, riskScores, dashboardSummary, companyName,
}: StatutoryNoticeModuleProps) {
  const [activeTab, setActiveTab] = useState<NoticeTabId>("inbox");
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);

  const handleSelectNotice = (id: string) => {
    setSelectedNoticeId(id);
    setActiveTab("detail");
  };

  const handleSelectForDraft = (id: string) => {
    setSelectedNoticeId(id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Gavel className="w-4 h-4 text-purple-400" />
            AI Tax Assistant & Statutory Notice Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {companyName} · {dashboardSummary.total_notices} Notices · {fmtL(dashboardSummary.total_demand)} Total Demand
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dashboardSummary.critical_notices > 0 && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/25 text-red-300 font-bold animate-pulse">
              🚨 {dashboardSummary.critical_notices} Critical
            </span>
          )}
          {mode === "demo" && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
              Demo Data
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {NOTICE_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
              activeTab === id
                ? "bg-purple-500/15 border border-purple-500/25 text-purple-300"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {id === "inbox" && dashboardSummary.overdue_notices > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                {dashboardSummary.overdue_notices}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (selectedNoticeId || "")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "inbox" && (
            <NoticeInboxTab
              notices={notices}
              riskScores={riskScores}
              summary={dashboardSummary}
              onSelect={handleSelectNotice}
            />
          )}
          {activeTab === "detail" && selectedNoticeId && (
            <NoticeDetailTab
              notice={notices.find(n => n.id === selectedNoticeId)!}
              onBack={() => setActiveTab("inbox")}
            />
          )}
          {activeTab === "detail" && !selectedNoticeId && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Eye className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Click a notice in the Inbox to view details</p>
            </div>
          )}
          {activeTab === "draft" && (
            <AILegalDraftTab
              notices={notices}
              drafts={legalDrafts}
              onSelectNotice={handleSelectForDraft}
              selectedId={selectedNoticeId}
            />
          )}
          {activeTab === "risk" && (
            <RiskAnalyserTab notices={notices} riskScores={riskScores} />
          )}
          {activeTab === "caselaws" && <CaseLawLibraryTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
