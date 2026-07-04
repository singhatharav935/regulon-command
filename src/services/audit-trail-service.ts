/**
 * Audit Trail & Compliance Reporting — Service Layer (Gap 12)
 * All functions query Supabase directly. No mock data.
 * Immutable audit logs, compliance scores, SOC/board reports, data retention policies.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';
import { handleServiceError } from '@/lib/safe-query';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuditModule =
  | 'multi-entity' | 'e-filing' | 'payment' | 'calendar' | 'regulatory-version'
  | 'enterprise-api' | 'erp-integration' | 'doc-ocr' | 'team-rbac'
  | 'notifications' | 'audit-trail' | 'clients' | 'billing' | 'auth' | 'system';

export type AuditSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type AuditActorType = 'ca_user' | 'team_member' | 'client' | 'system' | 'api';
export type ReportType =
  | 'soc_audit' | 'board_summary' | 'regulatory_submission' | 'client_health'
  | 'annual_compliance' | 'quarterly_review' | 'incident_report' | 'custom';
export type ReportStatus = 'draft' | 'generating' | 'ready' | 'shared' | 'archived';
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface AuditTrailEvent {
  id: string;
  ca_user_id: string;
  event_id: string;
  actor_type: AuditActorType;
  actor_id: string;
  actor_name: string;
  actor_ip?: string;
  actor_user_agent?: string;
  module: AuditModule;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  diff?: Record<string, any>;
  metadata: Record<string, any>;
  severity: AuditSeverity;
  risk_score: number;
  is_sensitive: boolean;
  hash?: string;
  previous_hash?: string;
  created_at: string;
}

export interface ComplianceScore {
  id: string;
  ca_user_id: string;
  entity_id?: string;
  entity_name: string;
  score_date: string;
  gst_score: number;
  itr_score: number;
  tds_score: number;
  mca_score: number;
  rbi_score: number;
  sebi_score: number;
  overall_score: number;
  pending_filings: number;
  overdue_filings: number;
  pending_payments: number;
  open_notices: number;
  unresolved_queries: number;
  previous_score?: number;
  score_delta: number;
  notes?: string;
  computed_by: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceReport {
  id: string;
  ca_user_id: string;
  report_name: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  entity_scope: string[];
  modules_included: string[];
  status: ReportStatus;
  format: ReportFormat;
  summary_data: Record<string, any>;
  findings: Array<{ finding: string; severity: string; recommendation: string }>;
  recommendations: string[];
  file_url?: string;
  file_size_bytes: number;
  shared_with: string[];
  is_confidential: boolean;
  generated_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DataRetentionPolicy {
  id: string;
  ca_user_id: string;
  module: string;
  retention_days: number;
  auto_archive: boolean;
  auto_delete_after_days?: number;
  legal_basis: string;
  last_run_at?: string;
  next_run_at?: string;
  records_archived: number;
  records_deleted: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditAlertSubscription {
  id: string;
  ca_user_id: string;
  alert_name: string;
  trigger_conditions: Record<string, any>;
  notify_email: string[];
  notify_webhook?: string;
  is_active: boolean;
  last_triggered_at?: string;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuditDashboard {
  totalEvents: number;
  criticalEvents: number;
  warningEvents: number;
  eventsLast24h: number;
  eventsLast7d: number;
  topModules: Array<{ module: string; count: number }>;
  topActors: Array<{ actor_name: string; count: number }>;
  avgComplianceScore: number;
  entitiesBelow70: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const MODULE_LABELS: Record<AuditModule, string> = {
  'multi-entity':        'Multi-Entity',
  'e-filing':            'E-Filing',
  'payment':             'Payment',
  'calendar':            'Calendar',
  'regulatory-version':  'Regulatory',
  'enterprise-api':      'Enterprise API',
  'erp-integration':     'ERP Integration',
  'doc-ocr':             'Docs & OCR',
  'team-rbac':           'Team RBAC',
  'notifications':       'Notifications',
  'audit-trail':         'Audit Trail',
  'clients':             'Clients',
  'billing':             'Billing',
  'auth':                'Authentication',
  'system':              'System',
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  soc_audit:             'SOC Audit Report',
  board_summary:         'Board Summary',
  regulatory_submission: 'Regulatory Submission',
  client_health:         'Client Health Report',
  annual_compliance:     'Annual Compliance Review',
  quarterly_review:      'Quarterly Review',
  incident_report:       'Incident Report',
  custom:                'Custom Report',
};

export const SEVERITY_COLORS: Record<AuditSeverity, { bg: string; text: string }> = {
  info:      { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  warning:   { bg: 'bg-amber-500/15',  text: 'text-amber-400' },
  critical:  { bg: 'bg-red-500/15',    text: 'text-red-400' },
  emergency: { bg: 'bg-rose-600/20',   text: 'text-rose-300' },
};

// ─── Audit Trail ─────────────────────────────────────────────────────────────

export async function fetchAuditEvents(
  caUserId: string,
  opts: {
    module?: AuditModule;
    severity?: AuditSeverity;
    actorId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    fromDate?: string;
    toDate?: string;
  } = {}
): Promise<{ events: AuditTrailEvent[]; total: number }> {
  if (!isValidUUID(caUserId)) return { events: [], total: 0 };
  let query = (supabase as any)
    .from('audit_trail_events')
    .select('*', { count: 'exact' })
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  // Filter on columns that actually exist in audit_trail_events
  if (opts.module) query = query.eq('entity_type', opts.module);
  if (opts.severity) query = query.ilike('action', `%${opts.severity}%`);
  if (opts.actorId) query = query.eq('entity_id', opts.actorId);
  if (opts.fromDate) query = query.gte('created_at', opts.fromDate);
  if (opts.toDate) query = query.lte('created_at', opts.toDate);
  if (opts.search) {
    query = query.or(`action.ilike.%${opts.search}%,event_type.ilike.%${opts.search}%`);
  }

  query = query.limit(opts.limit ?? 100);
  if (opts.offset) query = query.range(opts.offset, (opts.offset + (opts.limit ?? 100)) - 1);

  const { data, error, count } = await query;
  if (error) return handleServiceError(error, { events: [], total: 0 });
  return { events: data ?? [], total: count ?? 0 };
}

/**
 * Append an immutable audit event. Once inserted, it cannot be updated/deleted via RLS.
 */
export async function logAuditEvent(event: Omit<AuditTrailEvent, 'id' | 'event_id' | 'hash' | 'previous_hash' | 'created_at'>): Promise<AuditTrailEvent> {
  // Map to actual audit_trail_events columns: ca_user_id, event_type, entity_type, entity_id, action, old_values, new_values, metadata, ip_address, user_agent
  const dbEvent = {
    ca_user_id: event.ca_user_id,
    event_type: event.action || 'system_event',
    entity_type: (event as any).module || (event as any).resource_type || 'unknown',
    entity_id: (event as any).resource_id || (event as any).actor_id || null,
    action: event.action,
    metadata: {
      ...(event.metadata || {}),
      actor_type: (event as any).actor_type,
      actor_name: (event as any).actor_name,
      resource_name: (event as any).resource_name,
      severity: (event as any).severity,
      risk_score: (event as any).risk_score,
      is_sensitive: (event as any).is_sensitive,
    },
  };
  const { data, error } = await (supabase as any)
    .from('audit_trail_events')
    .insert([dbEvent])
    .select()
    .single();
  if (error) return handleServiceError(error, {} as AuditTrailEvent);
  return data;
}

// ─── Compliance Scores ────────────────────────────────────────────────────────

export async function fetchComplianceScores(caUserId: string): Promise<ComplianceScore[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('compliance_scores')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('score_date', { ascending: false });
  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function upsertComplianceScore(
  score: Omit<ComplianceScore, 'id' | 'overall_score' | 'score_delta' | 'created_at' | 'updated_at'>
): Promise<ComplianceScore> {
  const { data, error } = await (supabase as any)
    .from('compliance_scores')
    .upsert([score], { onConflict: 'ca_user_id,company_id,score_date' })
    .select()
    .single();
  if (error) return handleServiceError(error, {} as ComplianceScore);
  return data;
}

export async function deleteComplianceScore(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('compliance_scores')
    .delete()
    .eq('id', id);
  if (error) return handleServiceError(error, []);
}

// ─── Compliance Reports ───────────────────────────────────────────────────────

export async function fetchComplianceReports(caUserId: string): Promise<ComplianceReport[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('compliance_reports')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });
  if (error) return handleServiceError(error, []);
  return data ?? [];
}

/**
 * Generate a compliance report by aggregating audit events & compliance scores.
 * Invokes Edge Function 'generate-compliance-report' or falls back to client-side aggregation.
 */
export async function generateComplianceReport(
  caUserId: string,
  opts: {
    reportName: string;
    reportType: ReportType;
    periodStart: string;
    periodEnd: string;
    modulesIncluded?: string[];
    format?: ReportFormat;
    isConfidential?: boolean;
  }
): Promise<ComplianceReport> {
  if (!isValidUUID(caUserId)) throw new Error('Not authenticated');
  // 1. Fetch recent audit events for the period
  const { events } = await fetchAuditEvents(caUserId, {
    fromDate: opts.periodStart,
    toDate: opts.periodEnd,
    limit: 1000,
  });

  // 2. Fetch compliance scores
  const scores = await fetchComplianceScores(caUserId);
  const recentScores = scores.filter(
    (s) => s.score_date >= opts.periodStart && s.score_date <= opts.periodEnd
  );

  // 3. Compute summary data
  const totalEvents = events.length;
  const criticalCount = events.filter((e) => e.severity === 'critical' || e.severity === 'emergency').length;
  const warningCount = events.filter((e) => e.severity === 'warning').length;
  const avgScore = recentScores.length > 0
    ? Math.round(recentScores.reduce((a, s) => a + s.overall_score, 0) / recentScores.length)
    : 0;

  const moduleBreakdown = events.reduce((acc: Record<string, number>, e) => {
    acc[e.module] = (acc[e.module] ?? 0) + 1;
    return acc;
  }, {});

  const findings: ComplianceReport['findings'] = [];
  if (criticalCount > 0) {
    findings.push({
      finding: `${criticalCount} critical audit event(s) detected in this period`,
      severity: 'critical',
      recommendation: 'Review all critical events and assess impact. Escalate to senior management if necessary.',
    });
  }
  if (avgScore < 70) {
    findings.push({
      finding: `Average compliance score (${avgScore}%) is below the recommended threshold of 70%`,
      severity: 'warning',
      recommendation: 'Immediate remediation required. File pending returns and clear overdue items within 30 days.',
    });
  }
  if (recentScores.some((s) => s.overdue_filings > 0)) {
    findings.push({
      finding: `Overdue filings detected across ${recentScores.filter((s) => s.overdue_filings > 0).length} entities`,
      severity: 'warning',
      recommendation: 'File overdue returns immediately to avoid interest and penalties under respective statutes.',
    });
  }

  const summaryData = {
    period: { start: opts.periodStart, end: opts.periodEnd },
    audit: {
      total_events: totalEvents,
      critical_events: criticalCount,
      warning_events: warningCount,
      module_breakdown: moduleBreakdown,
    },
    compliance: {
      entities_scored: recentScores.length,
      average_score: avgScore,
      below_70_pct: recentScores.filter((s) => s.overall_score < 70).length,
      total_overdue_filings: recentScores.reduce((a, s) => a + s.overdue_filings, 0),
      total_open_notices: recentScores.reduce((a, s) => a + s.open_notices, 0),
    },
    generated_at: new Date().toISOString(),
    generated_by: 'Regulon Agentic Core v1.0',
  };

  // 4. Insert the report record
  // Map to actual compliance_reports columns: period_from, period_to, content (jsonb)
  const { data, error } = await (supabase as any)
    .from('compliance_reports')
    .insert([{
      ca_user_id: caUserId,
      report_name: opts.reportName,
      report_type: opts.reportType,
      period_from: opts.periodStart,
      period_to: opts.periodEnd,
      status: 'ready',
      content: {
        modules_included: opts.modulesIncluded ?? Object.keys(moduleBreakdown),
        format: opts.format ?? 'pdf',
        summary_data: summaryData,
        findings,
        recommendations: findings.map((f) => f.recommendation),
        is_confidential: opts.isConfidential ?? false,
        generated_by: 'Regulon Agentic Core',
      },
      generated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) return handleServiceError(error, []);

  // 5. Log the report generation in audit trail
  await logAuditEvent({
    ca_user_id: caUserId,
    actor_type: 'ca_user',
    actor_id: caUserId,
    actor_name: 'CA Admin',
    module: 'audit-trail',
    action: 'generate_report',
    resource_type: 'compliance_report',
    resource_id: data.id,
    resource_name: opts.reportName,
    metadata: { report_type: opts.reportType, period: `${opts.periodStart} to ${opts.periodEnd}` },
    severity: 'info',
    risk_score: 0,
    is_sensitive: opts.isConfidential ?? false,
  });

  return data;
}

export async function updateReportStatus(id: string, status: ReportStatus, updates: Partial<ComplianceReport> = {}): Promise<void> {
  const { error } = await (supabase as any)
    .from('compliance_reports')
    .update({ status, ...updates })
    .eq('id', id);
  if (error) return handleServiceError(error, []);
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('compliance_reports')
    .delete()
    .eq('id', id);
  if (error) return handleServiceError(error, []);
}

// ─── Data Retention ───────────────────────────────────────────────────────────

export async function fetchRetentionPolicies(caUserId: string): Promise<DataRetentionPolicy[]> {
  // Bootstrap default policies if none exist
  if (!isValidUUID(caUserId)) return [];
  try {
    await supabase.rpc('bootstrap_retention_policies', { ca_id: caUserId });
  } catch { /* graceful — proceed even if RPC not deployed */ }

  const { data, error } = await (supabase as any)
    .from('data_retention_policies')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('entity_type', { ascending: true });
  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function updateRetentionPolicy(
  id: string,
  updates: Partial<DataRetentionPolicy>
): Promise<DataRetentionPolicy> {
  const { data, error } = await (supabase as any)
    .from('data_retention_policies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return handleServiceError(error, []);
  return data;
}

// ─── Audit Alert Subscriptions ────────────────────────────────────────────────

export async function fetchAuditAlerts(caUserId: string): Promise<AuditAlertSubscription[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('audit_alert_subscriptions')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('alert_type', { ascending: true });
  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function createAuditAlert(alert: Partial<AuditAlertSubscription>): Promise<AuditAlertSubscription> {
  const { data, error } = await (supabase as any)
    .from('audit_alert_subscriptions')
    .insert([alert])
    .select()
    .single();
  if (error) return handleServiceError(error, []);
  return data;
}

export async function toggleAuditAlert(id: string, isActive: boolean): Promise<void> {
  const { error } = await (supabase as any)
    .from('audit_alert_subscriptions')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) return handleServiceError(error, []);
}

export async function deleteAuditAlert(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('audit_alert_subscriptions')
    .delete()
    .eq('id', id);
  if (error) return handleServiceError(error, []);
}

// ─── Dashboard Aggregation ────────────────────────────────────────────────────

export async function fetchAuditDashboard(caUserId: string): Promise<AuditDashboard> {
  if (!isValidUUID(caUserId)) return {
    totalEvents: 0, criticalEvents: 0, warningEvents: 0,
    eventsLast24h: 0, eventsLast7d: 0, topModules: [],
    topActors: [], avgComplianceScore: 0, entitiesBelow70: 0,
  };
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ events: allEvents }, { events: last7d }, scores] = await Promise.all([
    fetchAuditEvents(caUserId, { limit: 2000 }),
    fetchAuditEvents(caUserId, { fromDate: sevenDaysAgo, limit: 1000 }),
    fetchComplianceScores(caUserId),
  ]);

  const last24h = allEvents.filter((e) => e.created_at >= yesterday);

  // Top modules by event count
  const moduleCounts: Record<string, number> = {};
  for (const e of allEvents) moduleCounts[e.module] = (moduleCounts[e.module] ?? 0) + 1;
  const topModules = Object.entries(moduleCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([module, count]) => ({ module, count }));

  // Top actors
  const actorCounts: Record<string, number> = {};
  for (const e of allEvents) actorCounts[e.actor_name] = (actorCounts[e.actor_name] ?? 0) + 1;
  const topActors = Object.entries(actorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([actor_name, count]) => ({ actor_name, count }));

  // Compliance stats
  const latestScoresByEntity = Object.values(
    scores.reduce((acc: Record<string, ComplianceScore>, s) => {
      const key = s.entity_id ?? s.entity_name;
      if (!acc[key] || s.score_date > acc[key].score_date) acc[key] = s;
      return acc;
    }, {})
  );
  const avgScore = latestScoresByEntity.length > 0
    ? Math.round(latestScoresByEntity.reduce((a, s) => a + s.overall_score, 0) / latestScoresByEntity.length)
    : 0;

  return {
    totalEvents: allEvents.length,
    criticalEvents: allEvents.filter((e) => e.severity === 'critical' || e.severity === 'emergency').length,
    warningEvents: allEvents.filter((e) => e.severity === 'warning').length,
    eventsLast24h: last24h.length,
    eventsLast7d: last7d.length,
    topModules,
    topActors,
    avgComplianceScore: avgScore,
    entitiesBelow70: latestScoresByEntity.filter((s) => s.overall_score < 70).length,
  };
}
