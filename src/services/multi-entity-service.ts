/**
 * Multi-Entity & Consolidated Reporting — Service Layer
 * All functions query Supabase directly. No mock data.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EntityType =
  | 'company' | 'llp' | 'partnership' | 'proprietorship'
  | 'trust' | 'huf' | 'aop' | 'society';

export type EntityStatus = 'active' | 'dormant' | 'strike_off_pending' | 'dissolved';

export type TurnoverBracket =
  | 'below_1cr' | '1cr_5cr' | '5cr_10cr'
  | '10cr_50cr' | '50cr_250cr' | 'above_250cr';

export type GroupType =
  | 'holding_subsidiary' | 'family_group' | 'custom' | 'industry_cluster';

export type RoleInGroup = 'parent' | 'subsidiary' | 'associate' | 'member';

export type ReportType =
  | 'gst_summary' | 'itr_summary' | 'tds_summary'
  | 'compliance_scorecard' | 'consolidated_balance_sheet'
  | 'inter_company_reconciliation' | 'deadline_matrix' | 'risk_heatmap';

export type ReportStatus = 'draft' | 'finalized' | 'shared' | 'archived';

export interface Entity {
  id: string;
  ca_user_id: string;
  company_id?: string;
  entity_name: string;
  entity_type: EntityType;
  pan?: string;
  cin?: string;
  gstin?: string;
  tan?: string;
  incorporation_date?: string;
  financial_year_end: string;
  industry?: string;
  turnover_bracket?: TurnoverBracket;
  entity_status: EntityStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EntityGroup {
  id: string;
  ca_user_id: string;
  group_name: string;
  group_type: GroupType;
  parent_entity_id?: string;
  description?: string;
  color_tag: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface EntityGroupMember {
  id: string;
  group_id: string;
  entity_id: string;
  role_in_group: RoleInGroup;
  ownership_percent?: number;
  created_at: string;
  entity?: Entity;
}

export interface ConsolidatedReport {
  id: string;
  ca_user_id: string;
  group_id?: string;
  report_type: ReportType;
  report_title: string;
  period_start: string;
  period_end: string;
  generated_data: Record<string, unknown>;
  status: ReportStatus;
  shared_with: string[];
  pdf_url?: string;
  entity_count: number;
  ai_insights?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceSnapshot {
  id: string;
  entity_id: string;
  snapshot_date: string;
  gst_status: Record<string, unknown>;
  itr_status: Record<string, unknown>;
  tds_status: Record<string, unknown>;
  mca_status: Record<string, unknown>;
  roc_status: Record<string, unknown>;
  overall_health_score: number;
  pending_tasks_count: number;
  overdue_tasks_count: number;
  upcoming_deadlines: unknown[];
  created_at: string;
}

export interface GroupComplianceSummary {
  totalEntities: number;
  avgHealthScore: number;
  totalPendingTasks: number;
  totalOverdueTasks: number;
  entityBreakdown: Array<{
    entity_id: string;
    entity_name: string;
    entity_type: string;
    overall_health_score: number;
    pending_tasks_count: number;
    overdue_tasks_count: number;
  }>;
}

// ─── Entity CRUD ─────────────────────────────────────────────────────────────

export async function fetchEntities(caUserId: string): Promise<Entity[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('entities')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('entity_name', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createEntity(entity: Partial<Entity>): Promise<Entity> {
  const { data, error } = await (supabase as any)
    .from('entities')
    .insert([entity])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
  const { data, error } = await (supabase as any)
    .from('entities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteEntity(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('entities')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ─── Entity Groups ────────────────────────────────────────────────────────────

export async function fetchEntityGroups(caUserId: string): Promise<EntityGroup[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data: groups, error } = await (supabase as any)
    .from('entity_groups')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('group_name', { ascending: true });

  if (error) throw new Error(error.message);
  if (!groups) return [];

  // Enrich with member counts
  const enriched = await Promise.all(
    (groups as EntityGroup[]).map(async (group) => {
      const { count } = await (supabase as any)
        .from('entity_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);
      return { ...group, member_count: count ?? 0 };
    })
  );

  return enriched;
}

export async function createEntityGroup(
  group: Pick<EntityGroup, 'ca_user_id' | 'group_name' | 'group_type'> &
    Partial<Pick<EntityGroup, 'parent_entity_id' | 'description' | 'color_tag'>>
): Promise<EntityGroup> {
  const { data, error } = await (supabase as any)
    .from('entity_groups')
    .insert([group])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteEntityGroup(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('entity_groups')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ─── Group Members ────────────────────────────────────────────────────────────

export async function fetchGroupMembers(
  groupId: string
): Promise<EntityGroupMember[]> {
  const { data, error } = await (supabase as any)
    .from('entity_group_members')
    .select('*, entity:entities(*)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addEntityToGroup(
  groupId: string,
  entityId: string,
  roleInGroup: RoleInGroup = 'member',
  ownershipPercent?: number
): Promise<EntityGroupMember> {
  const { data, error } = await (supabase as any)
    .from('entity_group_members')
    .insert([{
      group_id: groupId,
      entity_id: entityId,
      role_in_group: roleInGroup,
      ownership_percent: ownershipPercent,
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function removeEntityFromGroup(
  groupId: string,
  entityId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('entity_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('entity_id', entityId);

  if (error) throw new Error(error.message);
}

// ─── Compliance Snapshots ─────────────────────────────────────────────────────

export async function fetchLatestSnapshot(
  entityId: string
): Promise<ComplianceSnapshot | null> {
  const { data, error } = await (supabase as any)
    .from('entity_compliance_snapshot')
    .select('*')
    .eq('entity_id', entityId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data ?? null;
}

export async function upsertComplianceSnapshot(
  entityId: string,
  snapshot: Partial<Omit<ComplianceSnapshot, 'id' | 'entity_id' | 'created_at'>>
): Promise<ComplianceSnapshot> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await (supabase as any)
    .from('entity_compliance_snapshot')
    .upsert(
      [{
        entity_id: entityId,
        snapshot_date: today,
        ...snapshot,
      }],
      { onConflict: 'entity_id,snapshot_date' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── Group Compliance Summary ─────────────────────────────────────────────────

export async function getGroupComplianceSummary(
  groupId: string
): Promise<GroupComplianceSummary> {
  const members = await fetchGroupMembers(groupId);

  const breakdown = await Promise.all(
    members.map(async (m) => {
      const snap = await fetchLatestSnapshot(m.entity_id);
      return {
        entity_id: m.entity_id,
        entity_name: m.entity?.entity_name ?? 'Unknown',
        entity_type: m.entity?.entity_type ?? 'company',
        overall_health_score: snap?.overall_health_score ?? 0,
        pending_tasks_count: snap?.pending_tasks_count ?? 0,
        overdue_tasks_count: snap?.overdue_tasks_count ?? 0,
      };
    })
  );

  const totalEntities = breakdown.length;
  const avgHealthScore =
    totalEntities > 0
      ? breakdown.reduce((s, e) => s + e.overall_health_score, 0) / totalEntities
      : 0;
  const totalPendingTasks = breakdown.reduce((s, e) => s + e.pending_tasks_count, 0);
  const totalOverdueTasks = breakdown.reduce((s, e) => s + e.overdue_tasks_count, 0);

  return { totalEntities, avgHealthScore, totalPendingTasks, totalOverdueTasks, entityBreakdown: breakdown };
}

// ─── Consolidated Reports ─────────────────────────────────────────────────────

export async function fetchConsolidatedReports(
  caUserId: string
): Promise<ConsolidatedReport[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('consolidated_reports')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Generate a consolidated report. Aggregates real data from Supabase.
 */
export async function generateConsolidatedReport(
  caUserId: string,
  groupId: string | null,
  reportType: ReportType,
  periodStart: string,
  periodEnd: string
): Promise<ConsolidatedReport> {
  // 1. Determine which entity ids to aggregate
  let entityIds: string[] = [];

  if (groupId) {
    const members = await fetchGroupMembers(groupId);
    entityIds = members.map((m) => m.entity_id);
  } else {
    const entities = await fetchEntities(caUserId);
    entityIds = entities.map((e) => e.id);
  }

  // 2. Fetch compliance tasks for those entities in the period
  const { data: tasks } = await (supabase as any)
    .from('compliance_tasks')
    .select('*')
    .in('company_id', entityIds)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  // 3. Fetch deadlines in the period
  const { data: deadlines } = await (supabase as any)
    .from('deadlines')
    .select('*')
    .in('company_id', entityIds)
    .gte('due_date', periodStart)
    .lte('due_date', periodEnd);

  // 4. Aggregate snapshots for health scores
  const snapshots = await Promise.all(entityIds.map(fetchLatestSnapshot));
  const validSnaps = snapshots.filter(Boolean) as ComplianceSnapshot[];

  const avgHealth =
    validSnaps.length > 0
      ? Math.round(validSnaps.reduce((s, sn) => s + sn.overall_health_score, 0) / validSnaps.length)
      : 0;

  const allTasks = tasks ?? [];
  const allDeadlines = deadlines ?? [];

  // 5. Build generated_data JSONB based on report type
  const generatedData: Record<string, unknown> = {
    summary: {
      total_entities: entityIds.length,
      period_start: periodStart,
      period_end: periodEnd,
      average_health_score: avgHealth,
      total_tasks: allTasks.length,
      completed_tasks: allTasks.filter((t: any) => t.status === 'completed').length,
      overdue_tasks: allTasks.filter((t: any) => t.status === 'overdue').length,
      total_deadlines: allDeadlines.length,
      upcoming_deadlines: allDeadlines.filter(
        (d: any) => new Date(d.due_date) > new Date()
      ).length,
    },
    entities_detail: validSnaps.map((s) => ({
      entity_id: s.entity_id,
      health_score: s.overall_health_score,
      pending: s.pending_tasks_count,
      overdue: s.overdue_tasks_count,
      gst_status: s.gst_status,
      itr_status: s.itr_status,
      tds_status: s.tds_status,
      mca_status: s.mca_status,
    })),
    tasks_by_regulator: allTasks.reduce((acc: Record<string, number>, t: any) => {
      acc[t.regulator] = (acc[t.regulator] ?? 0) + 1;
      return acc;
    }, {}),
    deadlines_by_type: allDeadlines.reduce((acc: Record<string, number>, d: any) => {
      acc[d.regulator] = (acc[d.regulator] ?? 0) + 1;
      return acc;
    }, {}),
  };

  // 6. Build report title
  const reportTypeLabels: Record<ReportType, string> = {
    gst_summary: 'GST Summary Report',
    itr_summary: 'ITR Summary Report',
    tds_summary: 'TDS Summary Report',
    compliance_scorecard: 'Compliance Scorecard',
    consolidated_balance_sheet: 'Consolidated Balance Sheet',
    inter_company_reconciliation: 'Inter-Company Reconciliation',
    deadline_matrix: 'Deadline Matrix',
    risk_heatmap: 'Risk Heatmap',
  };

  const reportTitle = `${reportTypeLabels[reportType]} — ${new Date(periodStart).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} to ${new Date(periodEnd).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;

  // 7. Insert the report
  const { data, error } = await (supabase as any)
    .from('consolidated_reports')
    .insert([{
      ca_user_id: caUserId,
      group_id: groupId,
      report_type: reportType,
      report_title: reportTitle,
      period_start: periodStart,
      period_end: periodEnd,
      generated_data: generatedData,
      status: 'draft',
      entity_count: entityIds.length,
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<void> {
  const { error } = await (supabase as any)
    .from('consolidated_reports')
    .update({ status })
    .eq('id', reportId);

  if (error) throw new Error(error.message);
}
