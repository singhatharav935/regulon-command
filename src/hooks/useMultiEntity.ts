/**
 * useMultiEntity — React hooks for Multi-Entity & Consolidated Reporting
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  fetchEntityGroups,
  createEntityGroup,
  deleteEntityGroup,
  fetchGroupMembers,
  addEntityToGroup,
  removeEntityFromGroup,
  fetchConsolidatedReports,
  generateConsolidatedReport,
  getGroupComplianceSummary,
  upsertComplianceSnapshot,
  type Entity,
  type EntityGroup,
  type EntityGroupMember,
  type ConsolidatedReport,
  type GroupComplianceSummary,
  type ReportType,
  type RoleInGroup,
} from '@/services/multi-entity-service';

// ─── useEntities ──────────────────────────────────────────────────────────────

export function useEntities(caUserId: string | null) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntities(caUserId);
      setEntities(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const addEntity = useCallback(async (entity: Partial<Entity>) => {
    try {
      const created = await createEntity({ ...entity, ca_user_id: caUserId! });
      setEntities((prev) => [created, ...prev]);
      toast.success(`Entity "${created.entity_name}" added`);
      return created;
    } catch (err: any) {
      toast.error('Failed to add entity', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editEntity = useCallback(async (id: string, updates: Partial<Entity>) => {
    try {
      const updated = await updateEntity(id, updates);
      setEntities((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast.success('Entity updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update entity', { description: err.message });
      throw err;
    }
  }, []);

  const removeEntity = useCallback(async (id: string) => {
    try {
      await deleteEntity(id);
      setEntities((prev) => prev.filter((e) => e.id !== id));
      toast.success('Entity removed');
    } catch (err: any) {
      toast.error('Failed to delete entity', { description: err.message });
      throw err;
    }
  }, []);

  return { entities, loading, error, refetch: load, addEntity, editEntity, removeEntity };
}

// ─── useEntityGroups ──────────────────────────────────────────────────────────

export function useEntityGroups(caUserId: string | null) {
  const [groups, setGroups] = useState<EntityGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntityGroups(caUserId);
      setGroups(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const addGroup = useCallback(async (
    groupName: string,
    groupType: EntityGroup['group_type'],
    description?: string,
    colorTag?: string
  ) => {
    try {
      const created = await createEntityGroup({
        ca_user_id: caUserId!,
        group_name: groupName,
        group_type: groupType,
        description,
        color_tag: colorTag ?? '#06b6d4',
      });
      setGroups((prev) => [{ ...created, member_count: 0 }, ...prev]);
      toast.success(`Group "${created.group_name}" created`);
      return created;
    } catch (err: any) {
      toast.error('Failed to create group', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const removeGroup = useCallback(async (id: string) => {
    try {
      await deleteEntityGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      toast.success('Group deleted');
    } catch (err: any) {
      toast.error('Failed to delete group', { description: err.message });
      throw err;
    }
  }, []);

  return { groups, loading, error, refetch: load, addGroup, removeGroup };
}

// ─── useGroupMembers ──────────────────────────────────────────────────────────

export function useGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<EntityGroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!groupId) { setMembers([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroupMembers(groupId);
      setMembers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const addMember = useCallback(async (
    entityId: string,
    role: RoleInGroup = 'member',
    ownershipPercent?: number
  ) => {
    if (!groupId) return;
    try {
      const m = await addEntityToGroup(groupId, entityId, role, ownershipPercent);
      await load(); // reload to get entity details via join
      toast.success('Entity added to group');
      return m;
    } catch (err: any) {
      if (err.message.includes('unique')) {
        toast.error('Entity already in this group');
      } else {
        toast.error('Failed to add entity to group', { description: err.message });
      }
      throw err;
    }
  }, [groupId, load]);

  const removeMember = useCallback(async (entityId: string) => {
    if (!groupId) return;
    try {
      await removeEntityFromGroup(groupId, entityId);
      setMembers((prev) => prev.filter((m) => m.entity_id !== entityId));
      toast.success('Entity removed from group');
    } catch (err: any) {
      toast.error('Failed to remove entity from group', { description: err.message });
      throw err;
    }
  }, [groupId]);

  return { members, loading, error, refetch: load, addMember, removeMember };
}

// ─── useConsolidatedReports ───────────────────────────────────────────────────

export function useConsolidatedReports(caUserId: string | null) {
  const [reports, setReports] = useState<ConsolidatedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsolidatedReports(caUserId);
      setReports(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const generateReport = useCallback(async (
    groupId: string | null,
    reportType: ReportType,
    periodStart: string,
    periodEnd: string
  ) => {
    if (!caUserId) return;
    setGenerating(true);
    try {
      const report = await generateConsolidatedReport(
        caUserId, groupId, reportType, periodStart, periodEnd
      );
      setReports((prev) => [report, ...prev]);
      toast.success('Report generated', { description: report.report_title });
      return report;
    } catch (err: any) {
      toast.error('Report generation failed', { description: err.message });
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [caUserId]);

  return { reports, loading, generating, error, refetch: load, generateReport };
}

// ─── useComplianceOverview ────────────────────────────────────────────────────

export function useComplianceOverview(groupId: string | null) {
  const [summary, setSummary] = useState<GroupComplianceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!groupId) { setSummary(null); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getGroupComplianceSummary(groupId);
      setSummary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  const refreshSnapshot = useCallback(async (
    entityId: string,
    snapshotData: Parameters<typeof upsertComplianceSnapshot>[1]
  ) => {
    try {
      await upsertComplianceSnapshot(entityId, snapshotData);
      await load();
      toast.success('Compliance snapshot updated');
    } catch (err: any) {
      toast.error('Failed to update snapshot', { description: err.message });
    }
  }, [load]);

  return { summary, loading, error, refresh: load, refreshSnapshot };
}
