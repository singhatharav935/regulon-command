/**
 * CA MULTI-CLIENT STATUTORY HUB — PHASE 5 UI
 * ============================================
 * Premium CA Dashboard component — 5 tabs:
 *  1. Firm Pulse       — Firm-level KPIs, risk distribution, billing summary
 *  2. Client Health    — Per-client compliance health scores (4-quadrant radar)
 *  3. Notice Hub       — All notices across ALL clients in one inbox
 *  4. Billing & WIP    — Engagement billing tracker, invoice status, WIP
 *  5. Due Date Cal     — Statutory calendar across all 20 return types
 *  + AI Tax Assistant tab — Phase 4 StatutoryNoticeModule embedded
 *  + GST & Tax Engine tab — Phase 3 StatutoryTaxModule embedded
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, TrendingUp, AlertTriangle, Clock, CheckCircle2,
  XCircle, FileText, Shield, Landmark, Users, BarChart3,
  CreditCard, Calendar, Gavel, BookOpen, ChevronRight,
  ArrowUpRight, ArrowDownRight, Star, Zap, Eye, Scale,
  Filter, Search, Download, RefreshCw, Activity, Hash,
  AlertCircle, PieChart, Wallet, Receipt, ListChecks,
} from "lucide-react";
import { StatutoryNoticeModule } from "@/components/company-erp/StatutoryNoticeModule";
import { StatutoryTaxModule } from "@/components/company-erp/StatutoryTaxModule";
import type {
  ClientComplianceHealth,
  NoticeEngagementBilling,
  StatutoryDueDate,
  CATeamMember,
  WorkloadAssignment,
  CAClientProfile,
} from "@/lib/accounting/ca-practice-intelligence";
import type {
  StatutoryNotice, LegalDraftResponse, NoticeRiskScore,
} from "@/lib/accounting/statutory-notice-parser";

// Phase 3 demo data
import {
  DEMO_ADVANCE_TAX,
  DEMO_FORM_138_SUMMARY,
  DEMO_FORM_140_SUMMARY,
  DEMO_FORM_143_SUMMARY,
  DEMO_FORM_144_SUMMARY,
  DEMO_GSTR3B_SET_OFF,
  DEMO_GSTR2B_RECONCILIATION,
} from "@/data/demo-statutory-tax-data";

// ─── Props ───────────────────────────────────────────────────────────────────

interface CAMultiClientHubProps {
  clients: CAClientProfile[];
  clientHealthScores: ClientComplianceHealth[];
  billingEntries: NoticeEngagementBilling[];
  statutoryCalendar: StatutoryDueDate[];
  allNotices: StatutoryNotice[];
  legalDrafts: Record<string, LegalDraftResponse>;
  riskScores: Record<string, NoticeRiskScore>;
  noticesDashboardSummary: {
    total_notices: number; critical_notices: number; high_notices: number;
    overdue_notices: number; total_demand: number; total_gst_demand: number;
    total_it_demand: number;
    notices_by_status: { received: number; response_drafted: number; response_filed: number };
  };
  team: CATeamMember[];
  workloadAssignments: WorkloadAssignment[];
  firmSummary: {
    total_clients: number; red_risk_clients: number; amber_risk_clients: number;
    green_risk_clients: number; total_active_notices: number; critical_notices: number;
    total_demand_exposure: number; overdue_deadlines: number; critical_deadlines: number;
    billing_total_billed: number; billing_received: number; billing_outstanding: number;
    billing_wip: number; avg_client_health: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtL(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function getRiskColor(level: "GREEN" | "AMBER" | "RED"): string {
  return level === "RED" ? "text-red-400" : level === "AMBER" ? "text-amber-400" : "text-green-400";
}
function getRiskBg(level: "GREEN" | "AMBER" | "RED"): string {
  return level === "RED" ? "bg-red-500/10 border-red-500/20" : level === "AMBER" ? "bg-amber-500/10 border-amber-500/20" : "bg-green-500/10 border-green-500/20";
}

function HealthBar({ score, max = 25, label }: { score: number; max?: number; label: string }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 80 ? "bg-green-400" : pct >= 60 ? "bg-amber-400" : pct >= 40 ? "bg-orange-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-mono font-bold text-foreground">{score}/{max}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function BillingStatusChip({ status }: { status: NoticeEngagementBilling["status"] }) {
  const map: Record<string, string> = {
    WIP: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    INVOICED: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    PAID: "bg-green-500/15 text-green-300 border-green-500/25",
    WRITTEN_OFF: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  };
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${map[status]}`}>{status.replace("_", " ")}</span>;
}

function UrgencyChip({ urgency, days }: { urgency: StatutoryDueDate["urgency"]; days: number }) {
  if (urgency === "OVERDUE") return <span className="text-[9px] font-bold text-red-300 bg-red-500/15 border border-red-500/25 px-1.5 py-0.5 rounded animate-pulse">OVERDUE</span>;
  if (urgency === "CRITICAL") return <span className="text-[9px] font-bold text-red-300 bg-red-500/15 border border-red-500/25 px-1.5 py-0.5 rounded">{days}d</span>;
  if (urgency === "HIGH") return <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded">{days}d</span>;
  if (urgency === "MEDIUM") return <span className="text-[9px] font-medium text-yellow-300 bg-yellow-500/10 border border-yellow-500/15 px-1.5 py-0.5 rounded">{days}d</span>;
  return <span className="text-[9px] font-medium text-green-300 bg-green-500/10 border border-green-500/15 px-1.5 py-0.5 rounded">{days}d</span>;
}

function CalCategoryIcon({ cat }: { cat: StatutoryDueDate["category"] }) {
  switch (cat) {
    case "GST": return <Shield className="w-3 h-3 text-blue-400" />;
    case "INCOME_TAX": return <Landmark className="w-3 h-3 text-amber-400" />;
    case "TDS": return <ListChecks className="w-3 h-3 text-orange-400" />;
    case "MCA": return <Building2 className="w-3 h-3 text-purple-400" />;
    case "LABOUR": return <Users className="w-3 h-3 text-green-400" />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: FIRM PULSE
// ─────────────────────────────────────────────────────────────────────────────

function FirmPulseTab({ firmSummary: fs }: { firmSummary: CAMultiClientHubProps["firmSummary"] }) {
  return (
    <div className="space-y-4">
      {/* Row 1 — Critical KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Clients", value: fs.total_clients, icon: Building2, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
          { label: "Active Notices", value: fs.total_active_notices, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Critical Notices", value: fs.critical_notices, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
          { label: "Avg Client Health", value: `${fs.avg_client_health}/100`, icon: Activity, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`p-3 rounded-xl border ${bg} flex items-center gap-3`}>
            <div className="p-2 rounded-lg bg-black/20"><Icon className={`w-4 h-4 ${color}`} /></div>
            <div><p className="text-lg font-bold text-foreground">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Row 2 — Risk Distribution + Demand Exposure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Client Risk Distribution */}
        <div className="p-4 rounded-xl border border-white/8 bg-card/40 space-y-3">
          <p className="text-xs font-bold text-foreground flex items-center gap-2"><PieChart className="w-3.5 h-3.5 text-purple-400" /> Client Risk Distribution</p>
          <div className="space-y-2">
            {[
              { label: "RED — High Risk", count: fs.red_risk_clients, total: fs.total_clients, color: "bg-red-400", text: "text-red-300", bg: "bg-red-500/10" },
              { label: "AMBER — Medium Risk", count: fs.amber_risk_clients, total: fs.total_clients, color: "bg-amber-400", text: "text-amber-300", bg: "bg-amber-500/10" },
              { label: "GREEN — Low Risk", count: fs.green_risk_clients, total: fs.total_clients, color: "bg-green-400", text: "text-green-300", bg: "bg-green-500/10" },
            ].map(({ label, count, total, color, text, bg }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className={`font-semibold ${text}`}>{label}</span>
                  <span className="text-muted-foreground font-mono">{count}/{total}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demand Exposure + Deadlines */}
        <div className="p-4 rounded-xl border border-red-500/15 bg-red-500/5 space-y-3">
          <p className="text-xs font-bold text-foreground flex items-center gap-2"><Scale className="w-3.5 h-3.5 text-red-400" /> Demand & Deadline Exposure</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Total Demand Across Clients</p>
              <p className="text-lg font-bold text-red-300 font-mono mt-1">{fmtL(fs.total_demand_exposure)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Overdue Deadlines</p>
              <p className="text-lg font-bold text-amber-300 font-mono mt-1">{fs.overdue_deadlines}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Critical (≤3 days)</p>
              <p className="text-lg font-bold text-red-300 font-mono mt-1">{fs.critical_deadlines}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Billing Outstanding</p>
              <p className="text-lg font-bold text-purple-300 font-mono mt-1">{fmtL(fs.billing_outstanding)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — Billing Summary */}
      <div className="p-4 rounded-xl border border-purple-500/15 bg-purple-500/5 space-y-3">
        <p className="text-xs font-bold text-foreground flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-purple-400" /> Practice Billing Summary</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Billed", value: fmtL(fs.billing_total_billed), color: "text-foreground" },
            { label: "Received", value: fmtL(fs.billing_received), color: "text-green-300" },
            { label: "Outstanding", value: fmtL(fs.billing_outstanding), color: "text-red-300" },
            { label: "WIP (Unbilled)", value: fmtL(fs.billing_wip), color: "text-amber-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className={`text-base font-bold font-mono mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: CLIENT HEALTH
// ─────────────────────────────────────────────────────────────────────────────

function ClientHealthTab({ healthScores, clients }: { healthScores: ClientComplianceHealth[]; clients: CAClientProfile[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const detail = selected ? healthScores.find(h => h.client_id === selected) : null;
  const clientProfile = selected ? clients.find(c => c.client_id === selected) : null;

  return (
    <div className="space-y-4">
      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {healthScores.map(h => (
          <motion.div
            key={h.client_id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${selected === h.client_id ? "border-cyan-500/40 bg-cyan-500/10" : `${getRiskBg(h.risk_level)} hover:border-white/20`}`}
            onClick={() => setSelected(selected === h.client_id ? null : h.client_id)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{h.client_name}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{clients.find(c => c.client_id === h.client_id)?.pan}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-2xl font-bold font-mono ${getRiskColor(h.risk_level)}`}>{h.overall_score}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${h.risk_level === "RED" ? "bg-red-500/15 text-red-300 border-red-500/25" : h.risk_level === "AMBER" ? "bg-amber-500/15 text-amber-300 border-amber-500/25" : "bg-green-500/15 text-green-300 border-green-500/25"}`}>
                  {h.risk_level}
                </span>
              </div>
            </div>

            {/* 4 Health Bars */}
            <div className="space-y-1.5 mb-2">
              <HealthBar score={h.it_health.score} max={25} label="Income Tax" />
              <HealthBar score={h.gst_health.score} max={25} label="GST" />
              <HealthBar score={h.mca_health.score} max={25} label="MCA / Corporate" />
              <HealthBar score={h.labour_health.score} max={25} label="Labour Laws" />
            </div>

            {/* Metrics Row */}
            <div className="flex items-center gap-3 text-[10px]">
              {h.active_notice_count > 0 && (
                <span className="text-amber-300 font-semibold">{h.active_notice_count} Notice{h.active_notice_count > 1 ? "s" : ""}</span>
              )}
              {h.total_demand_exposure > 0 && (
                <span className="text-red-300 font-mono">{fmtL(h.total_demand_exposure)} Demand</span>
              )}
              {h.critical_notice_count > 0 && (
                <span className="text-red-400 font-bold animate-pulse">⚠ {h.critical_notice_count} Critical</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {detail && clientProfile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">{detail.client_name} — Detailed Compliance Health</p>
                <button onClick={() => setSelected(null)} className="text-[10px] text-muted-foreground hover:text-foreground">Close ✕</button>
              </div>

              {/* 4 Quadrant Detail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Income Tax", score: detail.it_health.score, defects: detail.it_health.defects, icon: <Landmark className="w-3 h-3 text-amber-400" /> },
                  { label: "GST", score: detail.gst_health.score, defects: detail.gst_health.defects, icon: <Shield className="w-3 h-3 text-blue-400" /> },
                  { label: "MCA / Corporate Law", score: detail.mca_health.score, defects: detail.mca_health.defects, icon: <Building2 className="w-3 h-3 text-purple-400" /> },
                  { label: "Labour Laws", score: detail.labour_health.score, defects: detail.labour_health.defects, icon: <Users className="w-3 h-3 text-green-400" /> },
                ].map(({ label, score, defects, icon }) => (
                  <div key={label} className="p-3 rounded-lg border border-white/8 bg-card/40">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">{icon}{label}</p>
                      <span className={`text-xs font-bold font-mono ${score >= 20 ? "text-green-300" : score >= 15 ? "text-amber-300" : "text-red-300"}`}>{score}/25</span>
                    </div>
                    {defects.length === 0 ? (
                      <p className="text-[10px] text-green-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> All checks passed</p>
                    ) : (
                      <div className="space-y-1">
                        {defects.map((d, i) => (
                          <p key={i} className="text-[10px] text-red-300 flex items-start gap-1"><span className="shrink-0 mt-0.5">⚠</span>{d}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Client Profile */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                {[
                  { k: "Sector", v: clientProfile.sector.charAt(0).toUpperCase() + clientProfile.sector.slice(1) },
                  { k: "Turnover", v: `₹${clientProfile.turnover_cr} Cr` },
                  { k: "Tax Audit", v: clientProfile.is_audit_applicable ? "Applicable" : "Not Applicable" },
                  { k: "Transfer Pricing", v: clientProfile.is_transfer_pricing_applicable ? "Applicable" : "Not Applicable" },
                ].map(({ k, v }) => (
                  <div key={k} className="p-2 rounded-lg bg-white/3 border border-white/5">
                    <p className="text-muted-foreground">{k}</p>
                    <p className="font-semibold text-foreground mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: ALL-CLIENT NOTICE HUB
// ─────────────────────────────────────────────────────────────────────────────

function AllClientNoticeHubTab({
  notices,
  riskScores,
}: {
  notices: StatutoryNotice[];
  riskScores: Record<string, NoticeRiskScore>;
}) {
  const [filterSev, setFilterSev] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [search, setSearch] = useState("");

  const filtered = notices.filter(n =>
    (filterSev === "ALL" || n.severity === filterSev) &&
    (!search || n.company_name.toLowerCase().includes(search.toLowerCase()) || n.notice_type.toLowerCase().includes(search.toLowerCase()))
  );

  const totalDemand = filtered.reduce((s, n) => s + (n.total_demand || 0), 0);

  function getSevStyle(s: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") {
    return s === "CRITICAL" ? "text-red-300 border-red-500/30 bg-red-500/10"
      : s === "HIGH" ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
      : s === "MEDIUM" ? "text-yellow-300 border-yellow-500/20 bg-yellow-500/5"
      : "text-green-300 border-green-500/20 bg-green-500/5";
  }

  function getAuthIcon(a: string) {
    if (a === "GST_DEPARTMENT") return <Shield className="w-3.5 h-3.5 text-blue-400" />;
    if (a === "INCOME_TAX_DEPARTMENT") return <Landmark className="w-3.5 h-3.5 text-amber-400" />;
    if (a === "MCA_ROC") return <Building2 className="w-3.5 h-3.5 text-purple-400" />;
    return <Users className="w-3.5 h-3.5 text-green-400" />;
  }

  return (
    <div className="space-y-4">
      {/* Summary Strip */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-white/8 bg-card/40 text-xs">
        <span className="text-muted-foreground">Showing <span className="text-foreground font-bold">{filtered.length}</span> notices</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-red-300 font-mono font-bold">Total Demand: {fmtL(totalDemand)}</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-amber-300">{filtered.filter(n => n.days_remaining < 0).length} overdue</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-red-300">{filtered.filter(n => n.days_remaining >= 0 && n.days_remaining <= 7).length} due within 7 days</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by client name or notice type..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/40"
          />
        </div>
        <div className="flex gap-1">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterSev(f)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border whitespace-nowrap ${
                filterSev === f
                  ? f === "CRITICAL" ? "bg-red-500/20 text-red-300 border-red-500/30"
                    : f === "HIGH" ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : f === "ALL" ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/25"
                    : "bg-white/10 text-foreground border-white/15"
                  : "bg-white/3 text-muted-foreground border-white/8 hover:bg-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Table */}
      <div className="rounded-xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8 bg-white/2">
                {["Client", "Notice Type", "Authority", "Severity", "Demand", "Days Left", "Status", "Risk"].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {filtered.map(n => {
                const risk = riskScores[n.id];
                return (
                  <tr key={n.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-foreground truncate max-w-[140px]">{n.company_name}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">{n.company_pan}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-foreground whitespace-nowrap">{n.notice_type}</span>
                      <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[140px]">{n.notice_number}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1">
                        {getAuthIcon(n.issuing_authority)}
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {n.issuing_authority === "GST_DEPARTMENT" ? "GST" : n.issuing_authority === "INCOME_TAX_DEPARTMENT" ? "IT Dept" : n.issuing_authority === "MCA_ROC" ? "MCA" : "EPFO"}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getSevStyle(n.severity)}`}>{n.severity}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold text-red-300 whitespace-nowrap">{n.total_demand ? fmtL(n.total_demand) : "—"}</span>
                    </td>
                    <td className="px-3 py-2">
                      {n.days_remaining < 0
                        ? <span className="text-red-400 font-bold text-[10px]">OVERDUE</span>
                        : <span className={`font-mono font-bold text-[10px] ${n.days_remaining <= 7 ? "text-red-300" : n.days_remaining <= 15 ? "text-amber-300" : "text-green-300"}`}>{n.days_remaining}d</span>
                      }
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">{n.status.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-3 py-2">
                      {risk && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${risk.overall_score >= 75 ? "bg-red-400" : risk.overall_score >= 50 ? "bg-amber-400" : "bg-green-400"}`}
                              style={{ width: `${risk.overall_score}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground">{risk.overall_score}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: BILLING & WIP
// ─────────────────────────────────────────────────────────────────────────────

function BillingWIPTab({ entries }: { entries: NoticeEngagementBilling[] }) {
  const [filter, setFilter] = useState<"ALL" | "WIP" | "INVOICED" | "PAID">("ALL");

  const filtered = entries.filter(e => filter === "ALL" || e.status === filter);
  const total_billed = filtered.reduce((s, e) => s + e.amount_billed, 0);
  const total_received = filtered.reduce((s, e) => s + e.amount_received, 0);

  const modelColor = (m: string) => m === "FIXED_FEE" ? "text-cyan-300" : m === "TIME_BASED" ? "text-blue-300" : m === "SUCCESS_BASED" ? "text-purple-300" : "text-amber-300";

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {[
          { label: "Total Engagement Value", value: fmtL(total_billed), color: "text-foreground", bg: "bg-white/3 border-white/8" },
          { label: "Received", value: fmtL(total_received), color: "text-green-300", bg: "bg-green-500/8 border-green-500/15" },
          { label: "Outstanding", value: fmtL(total_billed - total_received), color: "text-red-300", bg: "bg-red-500/8 border-red-500/15" },
          { label: "Entries Shown", value: filtered.length.toString(), color: "text-cyan-300", bg: "bg-cyan-500/8 border-cyan-500/15" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`p-3 rounded-xl border ${bg}`}>
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className={`text-sm font-bold font-mono mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5">
        {(["ALL", "WIP", "INVOICED", "PAID"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${filter === f ? "bg-purple-500/15 text-purple-300 border-purple-500/25" : "bg-white/3 text-muted-foreground border-white/8 hover:bg-white/5"}`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Billing Cards */}
      <div className="space-y-2">
        {filtered.map(e => (
          <div key={e.id} className="p-3 rounded-xl border border-white/8 bg-card/40 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold text-foreground">{e.notice_type}</span>
                  <BillingStatusChip status={e.status} />
                  <span className={`text-[9px] font-semibold ${modelColor(e.billing_model)}`}>{e.billing_model.replace(/_/g, " ")}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{e.client_name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{e.notice_number}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Assigned: {e.assigned_ca} · Engaged: {e.engagement_date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-purple-300 font-mono">{fmtL(e.amount_billed)}</p>
                <p className="text-[9px] text-muted-foreground">{e.hours_spent}h @ ₹{e.hourly_rate.toLocaleString("en-IN")}/hr</p>
                {e.amount_received > 0 && <p className="text-[9px] text-green-300 font-mono">✓ {fmtL(e.amount_received)} received</p>}
                {e.outstanding > 0 && <p className="text-[9px] text-red-300 font-mono">⊖ {fmtL(e.outstanding)} due</p>}
              </div>
            </div>

            {/* Scope of Work (collapsed) */}
            <div className="text-[10px] text-muted-foreground bg-white/2 rounded-lg p-2 line-clamp-2">{e.scope_of_work}</div>

            {/* Deliverables */}
            <div className="flex flex-wrap gap-1">
              {e.deliverables.slice(0, 4).map((d, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/4 border border-white/8 text-muted-foreground">{d}</span>
              ))}
              {e.deliverables.length > 4 && <span className="text-[9px] text-muted-foreground">+{e.deliverables.length - 4} more</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5: STATUTORY DUE DATE CALENDAR
// ─────────────────────────────────────────────────────────────────────────────

function StatutoryCalendarTab({ calendar }: { calendar: StatutoryDueDate[] }) {
  const [filterCat, setFilterCat] = useState<"ALL" | "GST" | "INCOME_TAX" | "TDS" | "MCA" | "LABOUR">("ALL");

  const filtered = calendar.filter(d => filterCat === "ALL" || d.category === filterCat)
    .sort((a, b) => a.days_remaining - b.days_remaining);

  const overdue = filtered.filter(d => d.urgency === "OVERDUE");
  const upcoming = filtered.filter(d => d.urgency !== "OVERDUE");

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        {(["ALL", "GST", "INCOME_TAX", "TDS", "MCA", "LABOUR"] as const).map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all whitespace-nowrap ${
              filterCat === c
                ? "bg-cyan-500/15 border-cyan-500/25 text-cyan-300"
                : "bg-white/3 border-white/8 text-muted-foreground hover:bg-white/5"
            }`}
          >
            {c !== "ALL" && <CalCategoryIcon cat={c} />}
            {c.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="text-red-300">{overdue.length} Overdue</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-amber-300">{upcoming.filter(d => d.urgency === "HIGH" || d.urgency === "CRITICAL").length} Urgent</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-green-300">{upcoming.filter(d => d.urgency === "LOW" || d.urgency === "MEDIUM").length} Upcoming</span>
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">⚠ Overdue — Immediate Action Required</p>
          {overdue.map(d => (
            <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-red-500/25 bg-red-500/8">
              <CalCategoryIcon cat={d.category} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{d.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{d.section}</p>
                <p className="text-[10px] text-muted-foreground">{d.applicable_to}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-mono text-muted-foreground">{d.due_date}</p>
                <UrgencyChip urgency={d.urgency} days={d.days_remaining} />
                {d.late_fee_per_day && <p className="text-[9px] text-red-400 mt-0.5">₹{d.late_fee_per_day}/day late fee</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Section */}
      <div className="space-y-1.5">
        {overdue.length > 0 && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Upcoming Deadlines</p>}
        {upcoming.map(d => (
          <div key={d.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all hover:bg-white/3 ${
            d.urgency === "CRITICAL" ? "border-red-500/20 bg-red-500/5"
            : d.urgency === "HIGH" ? "border-amber-500/20 bg-amber-500/5"
            : "border-white/6 bg-white/1"
          }`}>
            <CalCategoryIcon cat={d.category} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{d.label}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{d.section}</p>
              <p className="text-[10px] text-muted-foreground">{d.applicable_to}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-mono text-muted-foreground">{d.due_date}</p>
              <UrgencyChip urgency={d.urgency} days={d.days_remaining} />
              {d.late_fee_per_day && <p className="text-[9px] text-amber-400/70 mt-0.5">₹{d.late_fee_per_day}/day</p>}
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

const CA_HUB_TABS = [
  { id: "pulse",     label: "Firm Pulse",         icon: Activity },
  { id: "health",    label: "Client Health",       icon: BarChart3 },
  { id: "notices",   label: "Notice Hub",          icon: AlertTriangle },
  { id: "billing",   label: "Billing & WIP",       icon: CreditCard },
  { id: "calendar",  label: "Due Date Calendar",   icon: Calendar },
  { id: "ai-tax",    label: "AI Tax Assistant",    icon: Gavel },
  { id: "gst-engine",label: "GST & Tax Engine",    icon: Shield },
] as const;

type HubTabId = typeof CA_HUB_TABS[number]["id"];

export function CAMultiClientStatutoryHub(props: CAMultiClientHubProps) {
  const [activeTab, setActiveTab] = useState<HubTabId>("pulse");

  const criticalCount = props.firmSummary.critical_notices;
  const overdueDeadlines = props.firmSummary.overdue_deadlines;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            CA Multi-Client Statutory Intelligence Hub
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {props.firmSummary.total_clients} Clients · {props.firmSummary.total_active_notices} Active Notices · {fmtL(props.firmSummary.total_demand_exposure)} Total Exposure
          </p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/25 text-red-300 font-bold animate-pulse">
              🚨 {criticalCount} Critical Notices
            </span>
          )}
          {overdueDeadlines > 0 && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
              ⏰ {overdueDeadlines} Overdue Deadlines
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-white/5">
        {CA_HUB_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[11px] font-medium whitespace-nowrap transition-all border-b-2 ${
              activeTab === id
                ? "text-cyan-300 border-cyan-400 bg-cyan-500/8"
                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-white/4"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {id === "notices" && criticalCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                {criticalCount}
              </span>
            )}
            {id === "calendar" && overdueDeadlines > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
                {overdueDeadlines}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "pulse" && <FirmPulseTab firmSummary={props.firmSummary} />}
          {activeTab === "health" && <ClientHealthTab healthScores={props.clientHealthScores} clients={props.clients} />}
          {activeTab === "notices" && <AllClientNoticeHubTab notices={props.allNotices} riskScores={props.riskScores} />}
          {activeTab === "billing" && <BillingWIPTab entries={props.billingEntries} />}
          {activeTab === "calendar" && <StatutoryCalendarTab calendar={props.statutoryCalendar} />}
          {activeTab === "ai-tax" && (
            <StatutoryNoticeModule
              mode="demo"
              notices={props.allNotices}
              legalDrafts={props.legalDrafts}
              riskScores={props.riskScores}
              dashboardSummary={props.noticesDashboardSummary}
              companyName="CA Multi-Client Portfolio"
            />
          )}
          {activeTab === "gst-engine" && (
            <StatutoryTaxModule
              mode="demo"
              advanceTax={DEMO_ADVANCE_TAX}
              form138={DEMO_FORM_138_SUMMARY}
              form140={DEMO_FORM_140_SUMMARY}
              form143={DEMO_FORM_143_SUMMARY}
              form144={DEMO_FORM_144_SUMMARY}
              gstr3bSetOff={DEMO_GSTR3B_SET_OFF}
              gstr2bRecon={DEMO_GSTR2B_RECONCILIATION}
              companyName="Sannidh Technologies Pvt. Ltd."
              fiscalYear="FY 2025-26"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
