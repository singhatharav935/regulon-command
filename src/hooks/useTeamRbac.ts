/**
 * useTeamRbac — React hooks for RBAC & Team Management
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  fetchTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  fetchRoles,
  fetchRolePermissions,
  updateRolePermission,
  fetchInvitations,
  sendInvitation,
  revokeInvitation,
  fetchActivityLogs,
  logActivity,
  type RbacTeam,
  type RbacRole,
  type RbacTeamMember,
  type RbacRolePermission,
  type RbacTeamInvitation,
  type RbacActivityLog,
} from '@/services/team-rbac-service';

// ─── useTeams ────────────────────────────────────────────────────────────────

export function useTeams(caUserId: string | null) {
  const [teams, setTeams] = useState<RbacTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeams(caUserId);
      setTeams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTeam = useCallback(async (teamName: string, description?: string) => {
    if (!caUserId) return;
    try {
      const created = await createTeam({
        ca_user_id: caUserId,
        team_name: teamName,
        description,
      });
      setTeams((prev) => [...prev, { ...created, member_count: 0 }]);
      toast.success(`Team "${created.team_name}" created successfully`);
      return created;
    } catch (err: any) {
      toast.error('Failed to create team', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editTeam = useCallback(async (id: string, updates: Partial<RbacTeam>) => {
    try {
      const updated = await updateTeam(id, updates);
      setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      toast.success('Team profile updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update team', { description: err.message });
      throw err;
    }
  }, []);

  const removeTeam = useCallback(async (id: string) => {
    try {
      await deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t.id !== id));
      toast.success('Team deleted');
    } catch (err: any) {
      toast.error('Failed to delete team', { description: err.message });
      throw err;
    }
  }, []);

  return { teams, loading, error, refetch: load, addTeam, editTeam, removeTeam };
}

// ─── useTeamMembers ──────────────────────────────────────────────────────────

export function useTeamMembers(teamId: string | null) {
  const [members, setMembers] = useState<RbacTeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeamMembers(teamId);
      setMembers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const addMember = useCallback(async (fullName: string, email: string, roleName: RbacTeamMember['role_name']) => {
    if (!teamId) return;
    try {
      const created = await addTeamMember({
        team_id: teamId,
        full_name: fullName,
        email,
        role_name: roleName,
        status: 'active',
      });
      // Refetch to ensure nested role profiles are fully resolved from DB
      await load();
      toast.success(`Member "${fullName}" added directly to team`);
      return created;
    } catch (err: any) {
      toast.error('Failed to add team member', { description: err.message });
      throw err;
    }
  }, [teamId, load]);

  const editMember = useCallback(async (id: string, updates: Partial<RbacTeamMember>) => {
    try {
      await updateTeamMember(id, updates);
      await load();
      toast.success('Member details updated');
    } catch (err: any) {
      toast.error('Failed to update member details', { description: err.message });
      throw err;
    }
  }, [load]);

  const removeMember = useCallback(async (id: string) => {
    try {
      await removeTeamMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success('Member removed from team');
    } catch (err: any) {
      toast.error('Failed to remove team member', { description: err.message });
      throw err;
    }
  }, []);

  return { members, loading, error, refetch: load, addMember, editMember, removeMember };
}

// ─── useRoles ────────────────────────────────────────────────────────────────

export function useRoles(caUserId: string | null) {
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRoles(caUserId);
      setRoles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    load();
  }, [load]);

  return { roles, loading, error, refetch: load };
}

// ─── useRolePermissions ──────────────────────────────────────────────────────

export function useRolePermissions(roleId: string | null) {
  const [permissions, setPermissions] = useState<RbacRolePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!roleId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRolePermissions(roleId);
      setPermissions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    load();
  }, [load]);

  const editPermission = useCallback(async (id: string, updates: Partial<RbacRolePermission>) => {
    try {
      const updated = await updateRolePermission(id, updates);
      setPermissions((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      toast.success('Module permissions updated successfully');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update module permissions', { description: err.message });
      throw err;
    }
  }, []);

  return { permissions, loading, error, refetch: load, editPermission };
}

// ─── useInvitations ──────────────────────────────────────────────────────────

export function useInvitations(teamId: string | null) {
  const [invitations, setInvitations] = useState<RbacTeamInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInvitations(teamId);
      setInvitations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const inviteMember = useCallback(async (email: string, roleName: RbacTeamInvitation['role_name'], invitedBy: string) => {
    if (!teamId) return;
    try {
      const created = await sendInvitation(teamId, email, roleName, invitedBy);
      setInvitations((prev) => [created, ...prev]);
      toast.success(`Invitation sent to ${email}`);
      return created;
    } catch (err: any) {
      toast.error('Failed to send team invitation', { description: err.message });
      throw err;
    }
  }, [teamId]);

  const cancelInvitation = useCallback(async (id: string) => {
    try {
      await revokeInvitation(id);
      setInvitations((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: 'revoked' } : inv)));
      toast.success('Invitation revoked successfully');
    } catch (err: any) {
      toast.error('Failed to revoke invitation', { description: err.message });
      throw err;
    }
  }, []);

  return { invitations, loading, error, refetch: load, inviteMember, cancelInvitation };
}

// ─── useActivityLogs ─────────────────────────────────────────────────────────

export function useActivityLogs(teamId: string | null) {
  const [logs, setLogs] = useState<RbacActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivityLogs(teamId);
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const logNewActivity = useCallback(async (performedBy: string, activityType: string, description: string, metadata: Record<string, any> = {}) => {
    if (!teamId) return;
    try {
      await logActivity({
        team_id: teamId,
        performed_by: performedBy,
        activity_type: activityType,
        description,
        metadata,
      });
      load();
    } catch (err) {
      console.error('Failed to manually log activity:', err);
    }
  }, [teamId, load]);

  return { logs, loading, error, refetch: load, logNewActivity };
}
