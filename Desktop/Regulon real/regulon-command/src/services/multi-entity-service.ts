/**
 * Multi-Entity & Consolidated Reporting — Service Layer
 * All functions query Supabase directly in production mode,
 * and fall back to localStorage demo data in ca-dashboard demo mode.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';
import { handleServiceError } from '@/lib/safe-query';
import { tableExists } from '@/lib/table-registry';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isDemoMode = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  // ONLY the dedicated CA demo dashboard is in demo/mock mode.
  // Real external and real inhouse dashboards must NEVER use mock data.
  return path === '/ca-dashboard' || path === '/ca-dashboard/' || path.startsWith('/ca-dashboard/');
};

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
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_clients');
    if (!saved) return [];
    try {
      const clients = JSON.parse(saved);
      return clients.map((c: any) => ({
        id: c.id,
        ca_user_id: caUserId,
        entity_name: c.name || c.client_name,
        entity_type: 'company',
        pan: c.pan || (c.gstin ? c.gstin.substring(2, 12) : 'AABCT1234Q'),
        gstin: c.gstin,
        entity_status: 'active',
        industry: c.industry || 'General',
        incorporation_date: '2020-04-01',
        financial_year_end: '03-31',
        turnover_bracket: '5cr_10cr',
        metadata: {},
        created_at: c.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('entities')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('entity_name', { ascending: true });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function createEntity(entity: Partial<Entity>): Promise<Entity> {
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_clients');
    const clients = saved ? JSON.parse(saved) : [];
    const newId = entity.id || `demo-auto-${Date.now()}`;
    const newClient = {
      id: newId,
      name: entity.entity_name,
      industry: entity.industry || 'General',
      health: 85,
      risk: 'Low',
      gaps: 0,
      deadline: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB'),
      status: 'Verified',
      gstin: entity.gstin || '27AABCT1234Q1Z5',
      pan: entity.pan || 'AABCT1234Q',
      created_at: new Date().toISOString(),
    };
    clients.unshift(newClient);
    localStorage.setItem('demo_clients', JSON.stringify(clients));
    window.dispatchEvent(new CustomEvent('demo-client-added'));
    
    return {
      id: newId,
      ca_user_id: entity.ca_user_id || 'demo-ca',
      entity_name: entity.entity_name!,
      entity_type: (entity.entity_type as any) || 'company',
      pan: newClient.pan,
      gstin: newClient.gstin,
      entity_status: (entity.entity_status as any) || 'active',
      industry: newClient.industry,
      incorporation_date: entity.incorporation_date || '2020-04-01',
      financial_year_end: entity.financial_year_end || '03-31',
      turnover_bracket: (entity.turnover_bracket as any) || '5cr_10cr',
      metadata: {},
      created_at: newClient.created_at,
      updated_at: newClient.created_at,
    };
  }

  const { data, error } = await (supabase as any)
    .from('entities')
    .insert([entity])
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_clients');
    if (saved) {
      const clients = JSON.parse(saved);
      const idx = clients.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        if (updates.entity_name) clients[idx].name = updates.entity_name;
        if (updates.industry) clients[idx].industry = updates.industry;
        if (updates.gstin) clients[idx].gstin = updates.gstin;
        if (updates.pan) clients[idx].pan = updates.pan;
        localStorage.setItem('demo_clients', JSON.stringify(clients));
        window.dispatchEvent(new CustomEvent('demo-client-added'));
      }
    }
    return {
      id,
      ca_user_id: 'demo-ca',
      entity_name: updates.entity_name || 'Updated Entity',
      entity_type: updates.entity_type || 'company',
      pan: updates.pan,
      gstin: updates.gstin,
      entity_status: updates.entity_status || 'active',
      industry: updates.industry,
      incorporation_date: updates.incorporation_date || '2020-04-01',
      financial_year_end: updates.financial_year_end || '03-31',
      turnover_bracket: updates.turnover_bracket || '5cr_10cr',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const { data, error } = await (supabase as any)
    .from('entities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function deleteEntity(id: string): Promise<void> {
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_clients');
    if (saved) {
      const clients = JSON.parse(saved);
      const filtered = clients.filter((c: any) => c.id !== id);
      localStorage.setItem('demo_clients', JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('demo-client-added'));
    }
    // Clean up members too
    const membersSaved = localStorage.getItem('demo_entity_group_members');
    if (membersSaved) {
      const members = JSON.parse(membersSaved);
      const filteredMembers = members.filter((m: any) => m.entity_id !== id);
      localStorage.setItem('demo_entity_group_members', JSON.stringify(filteredMembers));
    }
    return;
  }

  const { error } = await (supabase as any)
    .from('entities')
    .delete()
    .eq('id', id);

  if (error) return handleServiceError(error, []);
}

// ─── Entity Groups ────────────────────────────────────────────────────────────

export async function fetchEntityGroups(caUserId: string): Promise<EntityGroup[]> {
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_entity_groups');
    const groups = saved ? JSON.parse(saved) : [];
    const membersSaved = localStorage.getItem('demo_entity_group_members');
    const members = membersSaved ? JSON.parse(membersSaved) : [];
    
    return groups.map((g: any) => {
      const count = members.filter((m: any) => m.group_id === g.id).length;
      return { ...g, member_count: count };
    });
  }

  if (!isValidUUID(caUserId)) return [];
  const { data: groups, error } = await (supabase as any)
    .from('entity_groups')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('group_name', { ascending: true });

  if (error) return handleServiceError(error, []);
  if (!groups) return [];

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
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_entity_groups');
    const groups = saved ? JSON.parse(saved) : [];
    const newGroup = {
      id: `group-${Date.now()}`,
      ca_user_id: group.ca_user_id,
      group_name: group.group_name,
      group_type: group.group_type,
      description: group.description,
      color_tag: group.color_tag || '#06b6d4',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    groups.unshift(newGroup);
    localStorage.setItem('demo_entity_groups', JSON.stringify(groups));
    return newGroup;
  }

  const { data, error } = await (supabase as any)
    .from('entity_groups')
    .insert([group])
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function deleteEntityGroup(id: string): Promise<void> {
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_entity_groups');
    if (saved) {
      const groups = JSON.parse(saved);
      const filtered = groups.filter((g: any) => g.id !== id);
      localStorage.setItem('demo_entity_groups', JSON.stringify(filtered));
    }
    const membersSaved = localStorage.getItem('demo_entity_group_members');
    if (membersSaved) {
      const members = JSON.parse(membersSaved);
      const filteredMembers = members.filter((m: any) => m.group_id !== id);
      localStorage.setItem('demo_entity_group_members', JSON.stringify(filteredMembers));
    }
    return;
  }

  const { error } = await (supabase as any)
    .from('entity_groups')
    .delete()
    .eq('id', id);

  if (error) return handleServiceError(error, []);
}

// ─── Group Members ────────────────────────────────────────────────────────────

export async function fetchGroupMembers(groupId: string): Promise<EntityGroupMember[]> {
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_entity_group_members');
    const members = saved ? JSON.parse(saved) : [];
    const groupMembers = members.filter((m: any) => m.group_id === groupId);
    const entities = await fetchEntities('demo-ca');
    
    return groupMembers.map((m: any) => {
      const entity = entities.find((e) => e.id === m.entity_id);
      return { ...m, entity };
    });
  }

  const { data, error } = await (supabase as any)
    .from('entity_group_members')
    .select('*, entity:entities(*)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function addEntityToGroup(
  groupId: string,
  entityId: string,
  roleInGroup: RoleInGroup = 'member',
  ownershipPercent?: number
): Promise<EntityGroupMember> {
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_entity_group_members');
    const members = saved ? JSON.parse(saved) : [];
    const newMember = {
      id: `member-${Date.now()}`,
      group_id: groupId,
      entity_id: entityId,
      role_in_group: roleInGroup,
      ownership_percent: ownershipPercent || 100,
      created_at: new Date().toISOString(),
    };
    members.push(newMember);
    localStorage.setItem('demo_entity_group_members', JSON.stringify(members));
    return newMember;
  }

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

  if (error) return handleServiceError(error, []);
  return data;
}

export async function removeEntityFromGroup(groupId: string, entityId: string): Promise<void> {
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_entity_group_members');
    if (saved) {
      const members = JSON.parse(saved);
      const filtered = members.filter((m: any) => !(m.group_id === groupId && m.entity_id === entityId));
      localStorage.setItem('demo_entity_group_members', JSON.stringify(filtered));
    }
    return;
  }

  const { error } = await (supabase as any)
    .from('entity_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('entity_id', entityId);

  if (error) return handleServiceError(error, []);
}

// ─── Compliance Snapshots ─────────────────────────────────────────────────────

export async function fetchLatestSnapshot(entityId: string): Promise<ComplianceSnapshot | null> {
  if (isDemoMode()) {
    const isSwarmDone = localStorage.getItem(`swarm_completed_${entityId}`) === 'true';
    const overallScore = isSwarmDone ? 100 : 75;
    const pendingTasks = isSwarmDone ? 0 : 5;
    
    return {
      id: `snap-${entityId}`,
      entity_id: entityId,
      snapshot_date: new Date().toISOString().split('T')[0],
      gst_status: { health_score: overallScore, status: isSwarmDone ? 'Compliant' : 'Pending Review' },
      itr_status: { health_score: overallScore, status: isSwarmDone ? 'Compliant' : 'Pending Review' },
      tds_status: { health_score: overallScore, status: isSwarmDone ? 'Compliant' : 'Pending Review' },
      mca_status: { health_score: overallScore, status: isSwarmDone ? 'Compliant' : 'Pending Review' },
      roc_status: { health_score: overallScore, status: isSwarmDone ? 'Compliant' : 'Pending Review' },
      overall_health_score: overallScore,
      pending_tasks_count: pendingTasks,
      overdue_tasks_count: isSwarmDone ? 0 : 1,
      upcoming_deadlines: [],
      created_at: new Date().toISOString(),
    };
  }

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

  if (isDemoMode()) {
    return {
      id: `snap-${entityId}`,
      entity_id: entityId,
      snapshot_date: today,
      gst_status: snapshot.gst_status || {},
      itr_status: snapshot.itr_status || {},
      tds_status: snapshot.tds_status || {},
      mca_status: snapshot.mca_status || {},
      roc_status: snapshot.roc_status || {},
      overall_health_score: snapshot.overall_health_score || 100,
      pending_tasks_count: snapshot.pending_tasks_count || 0,
      overdue_tasks_count: snapshot.overdue_tasks_count || 0,
      upcoming_deadlines: snapshot.upcoming_deadlines || [],
      created_at: new Date().toISOString(),
    };
  }

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

  if (error) return handleServiceError(error, []);
  return data;
}

// ─── Group Compliance Summary ─────────────────────────────────────────────────

export async function getGroupComplianceSummary(groupId: string): Promise<GroupComplianceSummary> {
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

export async function fetchConsolidatedReports(caUserId: string): Promise<ConsolidatedReport[]> {
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_consolidated_reports');
    return saved ? JSON.parse(saved) : [];
  }

  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('consolidated_reports')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function generateConsolidatedReport(
  caUserId: string,
  groupId: string | null,
  reportType: ReportType,
  periodStart: string,
  periodEnd: string
): Promise<ConsolidatedReport> {
  if (isDemoMode()) {
    let entityIds: string[] = [];
    if (groupId) {
      const members = await fetchGroupMembers(groupId);
      entityIds = members.map((m) => m.entity_id);
    } else {
      const entities = await fetchEntities(caUserId);
      entityIds = entities.map((e) => e.id);
    }

    const snapshots = await Promise.all(entityIds.map(fetchLatestSnapshot));
    const validSnaps = snapshots.filter(Boolean) as ComplianceSnapshot[];
    
    const avgHealth = validSnaps.length > 0
      ? Math.round(validSnaps.reduce((s, sn) => s + sn.overall_health_score, 0) / validSnaps.length)
      : 0;

    const totalTasks = entityIds.length * 5;
    const completedTasks = validSnaps.reduce((s, sn) => s + (sn.overall_health_score === 100 ? 5 : 0), 0);
    const overdueTasks = validSnaps.reduce((s, sn) => s + sn.overdue_tasks_count, 0);

    const generatedData = {
      summary: {
        total_entities: entityIds.length,
        period_start: periodStart,
        period_end: periodEnd,
        average_health_score: avgHealth,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        total_deadlines: entityIds.length * 2,
        upcoming_deadlines: entityIds.length * 2,
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
      tasks_by_regulator: { GST: entityIds.length, ITR: entityIds.length, MCA: entityIds.length },
      deadlines_by_type: { GST: entityIds.length, ITR: entityIds.length, MCA: entityIds.length },
    };

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

    const saved = localStorage.getItem('demo_consolidated_reports');
    const reports = saved ? JSON.parse(saved) : [];
    const newReport = {
      id: `report-${Date.now()}`,
      ca_user_id: caUserId,
      group_id: groupId || undefined,
      report_type: reportType,
      report_title: reportTitle,
      period_start: periodStart,
      period_end: periodEnd,
      generated_data: generatedData,
      status: 'draft',
      entity_count: entityIds.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    reports.unshift(newReport);
    localStorage.setItem('demo_consolidated_reports', JSON.stringify(reports));
    return newReport as any;
  }

  let entityIds: string[] = [];

  if (groupId) {
    const members = await fetchGroupMembers(groupId);
    entityIds = members.map((m) => m.entity_id);
  } else {
    const entities = await fetchEntities(caUserId);
    entityIds = entities.map((e) => e.id);
  }

  const { data: tasks } = tableExists('compliance_tasks')
    ? await (supabase as any)
      .from('compliance_tasks')
      .select('*')
      .in('company_id', entityIds)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd)
    : { data: [] };

  const { data: deadlines } = await (supabase as any)
    .from('deadlines')
    .select('*')
    .in('company_id', entityIds)
    .gte('due_date', periodStart)
    .lte('due_date', periodEnd);

  const snapshots = await Promise.all(entityIds.map(fetchLatestSnapshot));
  const validSnaps = snapshots.filter(Boolean) as ComplianceSnapshot[];

  const avgHealth =
    validSnaps.length > 0
      ? Math.round(validSnaps.reduce((s, sn) => s + sn.overall_health_score, 0) / validSnaps.length)
      : 0;

  const allTasks = tasks ?? [];
  const allDeadlines = deadlines ?? [];

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

  if (error) return handleServiceError(error, []);
  return data;
}

export async function updateReportStatus(reportId: string, status: ReportStatus): Promise<void> {
  if (isDemoMode()) {
    const saved = localStorage.getItem('demo_consolidated_reports');
    if (saved) {
      const reports = JSON.parse(saved);
      const idx = reports.findIndex((r: any) => r.id === reportId);
      if (idx !== -1) {
        reports[idx].status = status;
        localStorage.setItem('demo_consolidated_reports', JSON.stringify(reports));
      }
    }
    return;
  }

  const { error } = await (supabase as any)
    .from('consolidated_reports')
    .update({ status })
    .eq('id', reportId);

  if (error) return handleServiceError(error, []);
}
