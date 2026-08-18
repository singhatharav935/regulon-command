/**
 * AuditTrailHub — Gap 12 UI Dashboard
 *
 * Immutable Audit Trail & Compliance Reporting console for CA firms.
 * Real Supabase data only. No mock data.
 *
 * Tabs:
 *  1. Overview        — Live threat-level KPIs and recent event stream
 *  2. Audit Log       — Searchable, filterable immutable event ledger
 *  3. Compliance      — Entity-wise compliance score matrix with trends
 *  4. Reports         — SOC / Board / Regulatory PDF generation
 *  5. Retention       — Data retention policy management per module
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCAIdentity } from '@/hooks/useCAIdentity';
import {
  useAuditDashboard,
  useAuditEvents,
  useComplianceScores,
  useComplianceReports,
  useRetentionPolicies,
  useAuditAlerts,
  MODULE_LABELS,
  REPORT_TYPE_LABELS,
  SEVERITY_COLORS,
  type AuditModule,
  type AuditSeverity,
  type ReportType,
  type ReportFormat,
} from '@/hooks/useAuditTrail';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  FileText,
  Database,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Trash2,
  Eye,
  Download,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Lock,
  FileCheck,
  Archive,
  Info,
  Settings,
  Zap,
  Calendar,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditTab = 'overview' | 'log' | 'compliance' | 'reports' | 'retention';

// ─── Severity Badge ───────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    info:      { bg: 'bg-blue-500/15',   text: 'text-blue-400',   icon: Info },
    warning:   { bg: 'bg-amber-500/15',  text: 'text-amber-400',  icon: AlertTriangle },
    critical:  { bg: 'bg-red-500/15',    text: 'text-red-400',    icon: ShieldAlert },
    emergency: { bg: 'bg-rose-600/20',   text: 'text-rose-300',   icon: XCircle },
  };
  const cfg = colors[severity] ?? colors.info;
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.bg} ${cfg.text} border-none gap-1 text-[10px] capitalize`}>
      <Icon className="w-3 h-3" /> {severity}
    </Badge>
  );
}

function ReportStatusBadge({ status }: { status: string }) {
  const c: Record<string, { bg: string; text: string }> = {
    draft:      { bg: 'bg-zinc-500/15',   text: 'text-zinc-400' },
    generating: { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
    ready:      { bg: 'bg-green-500/15',  text: 'text-green-400' },
    shared:     { bg: 'bg-indigo-500/15', text: 'text-indigo-400' },
    archived:   { bg: 'bg-zinc-500/10',   text: 'text-zinc-500' },
  };
  const cfg = c[status] ?? c.draft;
  return <Badge className={`${cfg.bg} ${cfg.text} border-none text-[10px] capitalize`}>{status}</Badge>;
}

function ScoreMeter({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 85 ? 'text-green-400' : score >= 70 ? 'text-amber-400' : score >= 50 ? 'text-orange-400' : 'text-red-400';
  const barColor = score >= 85 ? 'bg-green-500' : score >= 70 ? 'bg-amber-500' : score >= 50 ? 'bg-orange-500' : 'bg-red-500';
  const textSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-xl';
  return (
    <div className="space-y-1.5">
      <p className={`font-bold tabular-nums ${color} ${textSize}`}>{score}<span className="text-xs font-normal text-muted-foreground ml-0.5">%</span></p>
      <div className="h-1.5 rounded-full bg-border/20 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) return <span className="text-green-400 text-[10px] flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+{delta}</span>;
  if (delta < 0) return <span className="text-red-400 text-[10px] flex items-center gap-0.5"><TrendingDown className="w-3 h-3" />{delta}</span>;
  return <span className="text-zinc-500 text-[10px] flex items-center gap-0.5"><Minus className="w-3 h-3" />0</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AuditTrailHub: React.FC = () => {
  const { caId } = useCAIdentity();
  const [activeTab, setActiveTab] = useState<AuditTab>('overview');

  // ─── Audit Log Filters ────────────────────────────────────────────────────
  const [filterModule, setFilterModule] = useState<AuditModule | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<AuditSeverity | ''>('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // ─── Compliance Score Form ────────────────────────────────────────────────
  const [showAddScore, setShowAddScore] = useState(false);
  const [scoreEntity, setScoreEntity] = useState('');
  const [scoreGst, setScoreGst] = useState('75');
  const [scoreItr, setScoreItr] = useState('75');
  const [scoreTds, setScoreTds] = useState('75');
  const [scoreMca, setScoreMca] = useState('75');
  const [scoreRbi, setScoreRbi] = useState('75');
  const [scoreSebi, setScoreSebi] = useState('75');
  const [scorePending, setScorePending] = useState('0');
  const [scoreOverdue, setScoreOverdue] = useState('0');
  const [scoreNotes, setScoreNotes] = useState('');

  // ─── Report Generation Form ───────────────────────────────────────────────
  const [showGenerateReport, setShowGenerateReport] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState<ReportType>('board_summary');
  const [reportPeriodStart, setReportPeriodStart] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0];
  });
  const [reportPeriodEnd, setReportPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');
  const [reportConfidential, setReportConfidential] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // ─── Hooks ────────────────────────────────────────────────────────────────
  const { dashboard, loading: dashLoading, refetch: refetchDash } = useAuditDashboard(caId);

  const { events, total, loading: eventsLoading, refetch: refetchEvents } = useAuditEvents(caId, {
    module: filterModule || undefined,
    severity: filterSeverity || undefined,
    search: filterSearch || undefined,
    fromDate: filterFromDate || undefined,
    toDate: filterToDate || undefined,
    limit: 150,
  });

  const { scores, loading: scoresLoading, saveScore, removeScore } = useComplianceScores(caId);
  const { reports, loading: reportsLoading, generating, createReport, changeStatus, removeReport } = useComplianceReports(caId);
  const { policies, loading: retentionLoading, editPolicy } = useRetentionPolicies(caId);
  const { alerts, addAlert, toggleAlert, removeAlert } = useAuditAlerts(caId);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveScore = useCallback(async () => {
    if (!scoreEntity.trim()) return;
    try {
      await saveScore({
        ca_user_id: caId!,
        entity_name: scoreEntity.trim(),
        score_date: new Date().toISOString().split('T')[0],
        gst_score: parseInt(scoreGst) || 0,
        itr_score: parseInt(scoreItr) || 0,
        tds_score: parseInt(scoreTds) || 0,
        mca_score: parseInt(scoreMca) || 0,
        rbi_score: parseInt(scoreRbi) || 0,
        sebi_score: parseInt(scoreSebi) || 0,
        pending_filings: parseInt(scorePending) || 0,
        overdue_filings: parseInt(scoreOverdue) || 0,
        pending_payments: 0,
        open_notices: 0,
        unresolved_queries: 0,
        notes: scoreNotes.trim() || undefined,
        computed_by: 'CA Admin',
      });
      setShowAddScore(false);
      setScoreEntity('');
      setScoreNotes('');
    } catch { /* toast shown in hook */ }
  }, [caId, scoreEntity, scoreGst, scoreItr, scoreTds, scoreMca, scoreRbi, scoreSebi, scorePending, scoreOverdue, scoreNotes, saveScore]);

  const handleGenerateReport = useCallback(async () => {
    if (!reportName.trim()) return;
    try {
      await createReport({
        reportName: reportName.trim(),
        reportType,
        periodStart: reportPeriodStart,
        periodEnd: reportPeriodEnd,
        format: reportFormat,
        isConfidential: reportConfidential,
      });
      setShowGenerateReport(false);
      setReportName('');
    } catch { /* toast shown in hook */ }
  }, [reportName, reportType, reportPeriodStart, reportPeriodEnd, reportFormat, reportConfidential, createReport]);

  // Get most recent score per entity for the compliance matrix
  const latestScoresByEntity = Object.values(
    scores.reduce((acc: Record<string, typeof scores[0]>, s) => {
      const key = s.entity_id ?? s.entity_name;
      if (!acc[key] || s.score_date > acc[key].score_date) acc[key] = s;
      return acc;
    }, {})
  );

  const tabs: { id: AuditTab; label: string; icon: React.ElementType; count?: number; alert?: boolean }[] = [
    { id: 'overview',   label: 'Overview',     icon: Activity,      alert: (dashboard?.criticalEvents ?? 0) > 0 },
    { id: 'log',        label: 'Audit Log',    icon: ClipboardList, count: total },
    { id: 'compliance', label: 'Compliance',   icon: ShieldCheck,   count: latestScoresByEntity.length },
    { id: 'reports',    label: 'Reports',      icon: FileText,      count: reports.length },
    { id: 'retention',  label: 'Retention',    icon: Database,      count: policies.length },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-8 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-900/15 via-slate-900/10 to-transparent">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-slate-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-indigo-400">Audit Trail & Compliance Reporting</h2>
              <p className="text-sm text-muted-foreground">
                Immutable regulatory audit log · SOC/Board reports · Compliance score matrix · Data retention governance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            {[
              { label: 'Total Events',     value: dashboard?.totalEvents ?? 0,           color: 'text-indigo-400',  icon: ClipboardList },
              { label: 'Critical Alerts',  value: dashboard?.criticalEvents ?? 0,         color: 'text-red-400',     icon: ShieldAlert,  alert: (dashboard?.criticalEvents ?? 0) > 0 },
              { label: 'Last 24h',         value: dashboard?.eventsLast24h ?? 0,          color: 'text-slate-300',   icon: Clock },
              { label: 'Avg Score',        value: dashboard ? `${dashboard.avgComplianceScore}%` : '—', color: dashboard && dashboard.avgComplianceScore >= 70 ? 'text-green-400' : 'text-red-400', icon: ShieldCheck },
              { label: 'Below Threshold',  value: dashboard?.entitiesBelow70 ?? 0,        color: 'text-amber-400',   icon: AlertTriangle },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`p-4 rounded-xl bg-background/40 border ${('alert' in s && s.alert) ? 'border-red-500/30 animate-pulse' : 'border-border/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Nav ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_12px_-3px_rgba(99,102,241,0.25)]'
                  : 'border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/50'}`}>
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <Badge className={`text-[10px] h-5 ${isActive ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-card/50 text-muted-foreground border-border/30'}`}>
                  {tab.count}
                </Badge>
              )}
              {tab.alert && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* ═════ TAB 1: OVERVIEW ═════ */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Modules */}
            <Card className="border-border/30 bg-card/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-4 h-4 text-indigo-400" /> Most Active Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashLoading ? (
                  <div className="flex justify-center py-4"><RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" /></div>
                ) : (dashboard?.topModules ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
                ) : (
                  (dashboard?.topModules ?? []).map((m) => (
                    <div key={m.module} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground font-medium">{MODULE_LABELS[m.module as keyof typeof MODULE_LABELS] ?? m.module}</span>
                        <span className="text-muted-foreground">{m.count} events</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border/20 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (m.count / (dashboard!.totalEvents || 1)) * 100)}%` }}
                          transition={{ duration: 0.7 }}
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-slate-400"
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top Actors */}
            <Card className="border-border/30 bg-card/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <Activity className="w-4 h-4 text-indigo-400" /> Most Active Actors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashLoading ? (
                  <div className="flex justify-center py-4"><RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" /></div>
                ) : (dashboard?.topActors ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No actors recorded</p>
                ) : (
                  (dashboard?.topActors ?? []).map((a, i) => (
                    <div key={a.actor_name} className="flex items-center justify-between p-2.5 rounded-lg border border-border/20 bg-background/30">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                          {i + 1}
                        </span>
                        <span className="text-xs font-medium text-foreground">{a.actor_name}</span>
                      </div>
                      <Badge className="bg-indigo-500/10 text-indigo-300 border-none text-[10px]">{a.count} actions</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent critical events */}
          {(dashboard?.criticalEvents ?? 0) > 0 && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                  <ShieldAlert className="w-4 h-4" /> Critical Events Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {events
                    .filter((e) => e.severity === 'critical' || e.severity === 'emergency')
                    .slice(0, 5)
                    .map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-red-500/15 bg-background/30 text-xs flex-wrap gap-2">
                        <div>
                          <span className="font-medium text-foreground">{e.actor_name}</span>
                          <span className="text-muted-foreground"> · {e.action} → {e.resource_type}</span>
                          {e.resource_name && <span className="text-muted-foreground"> · {e.resource_name}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={e.severity} />
                          <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* ═════ TAB 2: AUDIT LOG ═════ */}
      {activeTab === 'log' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Search actor, action, resource…"
                className="pl-9 bg-background/50 text-xs h-9" />
            </div>
            <select value={filterModule} onChange={(e) => setFilterModule(e.target.value as any)}
              className="p-2 h-9 rounded-lg border border-border/30 bg-background/50 text-xs text-foreground">
              <option value="">All Modules</option>
              {Object.entries(MODULE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="p-2 h-9 rounded-lg border border-border/30 bg-background/50 text-xs text-foreground">
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="emergency">Emergency</option>
            </select>
            <Input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)}
              className="bg-background/50 text-xs h-9 w-36" />
            <Input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)}
              className="bg-background/50 text-xs h-9 w-36" />
            <Button size="sm" variant="outline" onClick={refetchEvents} className="h-9">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-indigo-400" />
              Immutable ledger — records cannot be modified or deleted
            </span>
            <span>{total.toLocaleString()} total events</span>
          </div>

          {eventsLoading ? (
            <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /></div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No audit events match the current filters</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {events.map((e) => {
                const isExpanded = expandedEventId === e.id;
                const severityCfg = SEVERITY_COLORS[e.severity];
                return (
                  <div key={e.id} className="rounded-xl border border-border/20 bg-card/15 overflow-hidden hover:border-indigo-500/15 transition-colors">
                    <button onClick={() => setExpandedEventId(isExpanded ? null : e.id)}
                      className="w-full p-3.5 flex items-center justify-between gap-3 hover:bg-card/30 transition-colors text-left">
                      <div className="flex items-center gap-3 flex-wrap min-w-0">
                        <SeverityBadge severity={e.severity} />
                        <Badge className="bg-indigo-500/10 text-indigo-300 border-none text-[9px] font-mono">
                          {MODULE_LABELS[e.module] ?? e.module}
                        </Badge>
                        <span className="text-xs text-foreground font-medium">{e.actor_name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          <span className="text-indigo-400">{e.action}</span> → {e.resource_type}
                          {e.resource_name && <span className="text-muted-foreground"> · {e.resource_name}</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString('en-IN')}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-border/15">
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                { label: 'Actor Type', value: e.actor_type },
                                { label: 'Actor IP', value: e.actor_ip ?? '—' },
                                { label: 'Risk Score', value: `${e.risk_score}/100` },
                                { label: 'Sensitive', value: e.is_sensitive ? 'Yes ⚠️' : 'No' },
                              ].map((d) => (
                                <div key={d.label} className="p-2 rounded-lg bg-background/40 border border-border/20">
                                  <p className="text-[9px] text-muted-foreground uppercase">{d.label}</p>
                                  <p className="text-xs font-medium text-foreground mt-0.5">{d.value}</p>
                                </div>
                              ))}
                            </div>
                            {e.metadata && Object.keys(e.metadata).length > 0 && (
                              <pre className="p-3 rounded-lg bg-background/50 border border-border/20 text-[9px] font-mono text-zinc-300 overflow-x-auto">
                                {JSON.stringify(e.metadata, null, 2)}
                              </pre>
                            )}
                            {e.hash && (
                              <p className="text-[9px] text-muted-foreground/50 font-mono truncate">
                                Hash: {e.hash}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ═════ TAB 3: COMPLIANCE SCORES ═════ */}
      {activeTab === 'compliance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground">Entity Compliance Score Matrix</h3>
              <p className="text-xs text-muted-foreground">Regulatory health per entity across GST, ITR, TDS, MCA, RBI, SEBI</p>
            </div>
            <Button size="sm" onClick={() => setShowAddScore(true)}
              className="bg-gradient-to-r from-indigo-600 to-slate-600 text-white gap-1 h-9 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Score
            </Button>
          </div>

          <AnimatePresence>
            {showAddScore && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card className="border-indigo-500/20 bg-card/30">
                  <CardHeader className="pb-2 p-4"><CardTitle className="text-sm text-indigo-400">Record Compliance Score</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase block mb-1">Entity / Client Name</label>
                      <Input value={scoreEntity} onChange={(e) => setScoreEntity(e.target.value)} placeholder="e.g. ABC Manufacturing Pvt Ltd" className="bg-background/60 text-xs h-9" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      {[
                        { label: 'GST Score', val: scoreGst, set: setScoreGst },
                        { label: 'ITR Score', val: scoreItr, set: setScoreItr },
                        { label: 'TDS Score', val: scoreTds, set: setScoreTds },
                        { label: 'MCA Score', val: scoreMca, set: setScoreMca },
                        { label: 'RBI Score', val: scoreRbi, set: setScoreRbi },
                        { label: 'SEBI Score', val: scoreSebi, set: setScoreSebi },
                      ].map((f) => (
                        <div key={f.label}>
                          <label className="text-[10px] text-muted-foreground uppercase block mb-1">{f.label}</label>
                          <Input type="number" min="0" max="100" value={f.val} onChange={(e) => f.set(e.target.value)}
                            className="bg-background/60 text-xs h-9" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Pending Filings</label>
                        <Input type="number" min="0" value={scorePending} onChange={(e) => setScorePending(e.target.value)} className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Overdue Filings</label>
                        <Input type="number" min="0" value={scoreOverdue} onChange={(e) => setScoreOverdue(e.target.value)} className="bg-background/60 text-xs h-9" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase block mb-1">Notes</label>
                      <Input value={scoreNotes} onChange={(e) => setScoreNotes(e.target.value)} placeholder="Optional remarks for board review" className="bg-background/60 text-xs h-9" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveScore} className="bg-indigo-600 hover:bg-indigo-500 text-white">Save Score</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddScore(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {scoresLoading ? (
            <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /></div>
          ) : latestScoresByEntity.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No compliance scores recorded yet</p>
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-border/30 bg-background/20">
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-card/45 border-b border-border/20 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="p-3">Entity</th>
                    <th className="p-3 text-center">Overall</th>
                    <th className="p-3 text-center">GST</th>
                    <th className="p-3 text-center">ITR</th>
                    <th className="p-3 text-center">TDS</th>
                    <th className="p-3 text-center">MCA</th>
                    <th className="p-3 text-center">RBI</th>
                    <th className="p-3 text-center">SEBI</th>
                    <th className="p-3 text-center">Overdue</th>
                    <th className="p-3 text-center">Δ</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {latestScoresByEntity.map((s) => (
                    <tr key={s.id} className="border-b border-border/10 hover:bg-card/15 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold text-foreground">{s.entity_name}</p>
                        <p className="text-[9px] text-muted-foreground">{new Date(s.score_date).toLocaleDateString('en-IN')}</p>
                      </td>
                      <td className="p-3 text-center w-28"><ScoreMeter score={s.overall_score} size="sm" /></td>
                      {[s.gst_score, s.itr_score, s.tds_score, s.mca_score, s.rbi_score, s.sebi_score].map((sc, i) => (
                        <td key={i} className="p-3 text-center">
                          <span className={`font-bold tabular-nums ${sc >= 85 ? 'text-green-400' : sc >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{sc}</span>
                        </td>
                      ))}
                      <td className="p-3 text-center">
                        <span className={`font-bold ${s.overdue_filings > 0 ? 'text-red-400' : 'text-green-400'}`}>{s.overdue_filings}</span>
                      </td>
                      <td className="p-3 text-center"><DeltaBadge delta={s.score_delta} /></td>
                      <td className="p-3 text-right">
                        <Button size="xs" variant="ghost" onClick={() => removeScore(s.id)} className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ═════ TAB 4: REPORTS ═════ */}
      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground">Compliance Reports</h3>
              <p className="text-xs text-muted-foreground">SOC Audit, Board Summaries, Regulatory Submissions — auto-generated from live data</p>
            </div>
            <Button size="sm" onClick={() => setShowGenerateReport(true)} disabled={generating}
              className="bg-gradient-to-r from-indigo-600 to-slate-600 text-white gap-1 h-9 text-xs">
              {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {generating ? 'Generating…' : 'Generate Report'}
            </Button>
          </div>

          <AnimatePresence>
            {showGenerateReport && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card className="border-indigo-500/20 bg-card/30">
                  <CardHeader className="pb-2 p-4"><CardTitle className="text-sm text-indigo-400">Generate Compliance Report</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Report Name</label>
                        <Input value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="Q1 FY26 Board Compliance Summary" className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Report Type</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}
                          className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground">
                          {Object.entries(REPORT_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Period From</label>
                        <Input type="date" value={reportPeriodStart} onChange={(e) => setReportPeriodStart(e.target.value)} className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Period To</label>
                        <Input type="date" value={reportPeriodEnd} onChange={(e) => setReportPeriodEnd(e.target.value)} className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Export Format</label>
                        <select value={reportFormat} onChange={(e) => setReportFormat(e.target.value as ReportFormat)}
                          className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground">
                          <option value="pdf">PDF Document</option>
                          <option value="excel">Excel Workbook</option>
                          <option value="csv">CSV Data</option>
                          <option value="json">JSON Export</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 mt-5">
                        <input type="checkbox" id="confidential" checked={reportConfidential} onChange={(e) => setReportConfidential(e.target.checked)}
                          className="w-4 h-4 rounded border-border/30" />
                        <label htmlFor="confidential" className="text-xs text-foreground">Mark as Confidential</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleGenerateReport} disabled={generating} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                        {generating ? 'Generating…' : 'Generate Now'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowGenerateReport(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {reportsLoading ? (
            <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /></div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No compliance reports generated yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => {
                const isExpanded = expandedReportId === r.id;
                return (
                  <div key={r.id} className="rounded-xl border border-border/30 bg-card/20 overflow-hidden hover:border-indigo-500/15 transition-colors">
                    <button onClick={() => setExpandedReportId(isExpanded ? null : r.id)}
                      className="w-full p-4 flex items-center justify-between gap-3 hover:bg-card/30 transition-colors">
                      <div className="flex items-center gap-3 flex-wrap min-w-0">
                        <ReportStatusBadge status={r.status} />
                        <Badge className="bg-indigo-500/10 text-indigo-300 border-none text-[10px]">
                          {REPORT_TYPE_LABELS[r.report_type]}
                        </Badge>
                        <span className="font-semibold text-sm text-foreground">{r.report_name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(r.period_start).toLocaleDateString('en-IN')} – {new Date(r.period_end).toLocaleDateString('en-IN')}
                        </span>
                        {r.is_confidential && <Badge className="bg-red-500/10 text-red-400 border-none text-[9px]">CONFIDENTIAL</Badge>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.status === 'draft' && (
                          <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); changeStatus(r.id, 'ready'); }}
                            className="text-green-400 hover:bg-green-500/10 text-[10px] px-2 h-7">Approve</Button>
                        )}
                        {r.status === 'ready' && (
                          <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); changeStatus(r.id, 'shared'); }}
                            className="text-indigo-400 hover:bg-indigo-500/10 text-[10px] px-2 h-7">Share</Button>
                        )}
                        <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); removeReport(r.id); }}
                          className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-border/15">
                          <div className="p-5 space-y-4">
                            {/* Summary KPIs */}
                            {r.summary_data?.audit && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                  { label: 'Total Events', value: r.summary_data.audit.total_events },
                                  { label: 'Critical Events', value: r.summary_data.audit.critical_events, alert: r.summary_data.audit.critical_events > 0 },
                                  { label: 'Entities Scored', value: r.summary_data.compliance?.entities_scored },
                                  { label: 'Avg Score', value: `${r.summary_data.compliance?.average_score ?? 0}%` },
                                ].map((d) => (
                                  <div key={d.label} className={`p-3 rounded-lg border text-center ${('alert' in d && d.alert) ? 'border-red-500/20 bg-red-500/5' : 'border-border/20 bg-background/40'}`}>
                                    <p className="text-[9px] text-muted-foreground uppercase">{d.label}</p>
                                    <p className={`text-base font-bold mt-0.5 ${('alert' in d && d.alert) ? 'text-red-400' : 'text-foreground'}`}>{d.value}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Findings */}
                            {r.findings.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Key Findings</p>
                                {r.findings.map((f, i) => (
                                  <div key={i} className={`p-3 rounded-lg border text-xs ${f.severity === 'critical' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                                    <p className={`font-medium ${f.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>{f.finding}</p>
                                    <p className="text-muted-foreground mt-1">↳ {f.recommendation}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ═════ TAB 5: RETENTION POLICIES ═════ */}
      {activeTab === 'retention' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Data Retention Governance</h3>
            <p className="text-xs text-muted-foreground">
              Configure module-level data lifecycle policies. Default: 7-year retention per IT Act 2000 / Companies Act 2013.
            </p>
          </div>

          {retentionLoading ? (
            <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /></div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No retention policies loaded yet — they will be bootstrapped automatically.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-border/30 rounded-xl bg-background/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-card/45 border-b border-border/20 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <th className="p-3">Module</th>
                    <th className="p-3 text-center">Retention (Days)</th>
                    <th className="p-3 text-center">Auto Archive</th>
                    <th className="p-3 text-center">Auto Delete</th>
                    <th className="p-3 text-center">Active</th>
                    <th className="p-3">Legal Basis</th>
                    <th className="p-3 text-center">Last Run</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p) => (
                    <tr key={p.id} className="border-b border-border/10 hover:bg-card/15 transition-colors">
                      <td className="p-3 font-semibold text-foreground capitalize">{p.module.replace('-', ' ')}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="30"
                          max="9999"
                          defaultValue={p.retention_days}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val !== p.retention_days) editPolicy(p.id, { retention_days: val });
                          }}
                          className="w-20 text-center p-1 rounded border border-border/30 bg-background/60 text-xs text-foreground"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => editPolicy(p.id, { auto_archive: !p.auto_archive })}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${p.auto_archive ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-border/30 text-muted-foreground'}`}>
                          {p.auto_archive ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-muted-foreground text-[10px]">
                          {p.auto_delete_after_days ? `${p.auto_delete_after_days}d` : 'Never'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => editPolicy(p.id, { is_active: !p.is_active })}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${p.is_active ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 'border-border/30 text-muted-foreground'}`}>
                          {p.is_active ? 'Active' : 'Off'}
                        </button>
                      </td>
                      <td className="p-3 text-muted-foreground text-[10px] max-w-xs truncate">{p.legal_basis}</td>
                      <td className="p-3 text-center text-[10px] text-muted-foreground">
                        {p.last_run_at ? new Date(p.last_run_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legal Note */}
          <div className="p-4 rounded-xl border border-indigo-500/15 bg-indigo-500/5 flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-indigo-300">Indian Compliance Data Retention Requirements</p>
              <p>Companies Act 2013 (Sec 128, 129): Financial books minimum 8 years · IT Act 2000: Electronic records 5 years · GST Rules: 5 years from due date of annual return · Income Tax Act (Sec 44AA): 6 years from end of assessment year</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AuditTrailHub;
