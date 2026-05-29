/**
 * RBAC & Team Management — Service Layer
 * All functions query Supabase directly. No mock data.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RbacRoleCode = 'partner' | 'manager' | 'senior_ca' | 'articled_clerk' | 'data_entry' | 'viewer' | 'custom';
export type RbacMemberStatus = 'active' | 'inactive' | 'suspended';
export type RbacInvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface RbacTeam {
  id: string;
  ca_user_id: string;
  team_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface RbacRole {
  id: string;
  ca_user_id: string;
  role_name: string;
  role_code: RbacRoleCode;
  description?: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RbacTeamMember {
  id: string;
  team_id: string;
  user_id?: string;
  full_name: string;
  email: string;
  role_id: string;
  role_name: 'Partner' | 'Manager' | 'Senior CA' | 'Articled Clerk' | 'Data Entry' | 'Viewer';
  status: RbacMemberStatus;
  joined_at: string;
  created_at: string;
  updated_at: string;
  role?: RbacRole;
}

export interface RbacRolePermission {
  id: string;
  role_id: string;
  module_name: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface RbacTeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role_name: 'Partner' | 'Manager' | 'Senior CA' | 'Articled Clerk' | 'Data Entry' | 'Viewer';
  invited_by: string;
  token: string;
  status: RbacInvitationStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface RbacActivityLog {
  id: string;
  team_id: string;
  performed_by: string;
  activity_type: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// ─── Seeding & Bootstrap ──────────────────────────────────────────────────────

/**
 * Invokes the bootstrap_ca_rbac_system stored procedure to seed system roles & default permissions
 */
export async function bootstrapRbac(caUserId: string): Promise<void> {
  if (!isValidUUID(caUserId)) return;
  try {
    const { error } = await supabase.rpc('bootstrap_ca_rbac_system', { ca_id: caUserId });
    if (error) {
      console.warn('RPC bootstrap fallback triggered:', error.message);
      // Fallback: Check if roles exist, if not, create them via client inserts
      await fallbackBootstrap(caUserId);
    }
  } catch (err: any) {
    console.error('Failed to bootstrap RBAC:', err);
    await fallbackBootstrap(caUserId);
  }
}

/**
 * Fallback JS-based seeding in case RPC execution is restricted
 */
async function fallbackBootstrap(caUserId: string): Promise<void> {
  if (!isValidUUID(caUserId)) return;
  const { data: existingRoles } = await (supabase as any)
    .from('rbac_roles')
    .select('id')
    .eq('ca_user_id', caUserId);

  if (existingRoles && existingRoles.length > 0) return;

  const roles = [
    { ca_user_id: caUserId, role_name: 'Partner', role_code: 'partner', description: 'Full administrative authority.', is_system: true },
    { ca_user_id: caUserId, role_name: 'Manager', role_code: 'manager', description: 'Oversees client files and reviews.', is_system: true },
    { ca_user_id: caUserId, role_name: 'Senior CA', role_code: 'senior_ca', description: 'Handles core filings and drafts.', is_system: true },
    { ca_user_id: caUserId, role_name: 'Articled Clerk', role_code: 'articled_clerk', description: 'Assists in preparation.', is_system: true },
    { ca_user_id: caUserId, role_name: 'Data Entry', role_code: 'data_entry', description: 'Uploads invoices and processes OCR.', is_system: true },
    { ca_user_id: caUserId, role_name: 'Viewer', role_code: 'viewer', description: 'Read-only access.', is_system: true },
  ];

  const { data: createdRoles, error: rolesError } = await (supabase as any)
    .from('rbac_roles')
    .insert(roles)
    .select();

  if (rolesError || !createdRoles) return;

  const modules = ['e-filing', 'payment', 'calendar', 'multi-entity', 'erp-integration', 'doc-ocr', 'team-rbac', 'clients', 'billing'];
  const permissions: any[] = [];

  for (const role of createdRoles) {
    for (const m of modules) {
      const isPartner = role.role_code === 'partner';
      const isManager = role.role_code === 'manager';
      const isSenior = role.role_code === 'senior_ca';
      const isClerk = role.role_code === 'articled_clerk';
      const isDataEntry = role.role_code === 'data_entry';

      let read = true;
      let write = isPartner || isManager || isSenior || isClerk;
      let del = isPartner || isManager || (isSenior && m !== 'team-rbac');
      let admin = isPartner;

      if (isDataEntry) {
        write = ['doc-ocr', 'erp-integration', 'payment'].includes(m);
        del = false;
      }

      permissions.push({
        role_id: role.id,
        module_name: m,
        can_read: read,
        can_write: write,
        can_delete: del,
        can_admin: admin,
      });
    }
  }

  await (supabase as any).from('rbac_role_permissions').insert(permissions);
}

// ─── Teams CRUD ──────────────────────────────────────────────────────────────

export async function fetchTeams(caUserId: string): Promise<RbacTeam[]> {
  if (!isValidUUID(caUserId)) return [];
  // First, guarantee that system roles exist for this CA
  await bootstrapRbac(caUserId);

  const { data: teams, error } = await (supabase as any)
    .from('rbac_teams')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('team_name', { ascending: true });

  if (error) throw new Error(error.message);
  if (!teams) return [];

  // Enrich with member counts
  const enriched = await Promise.all(
    (teams as RbacTeam[]).map(async (team) => {
      const { count } = await (supabase as any)
        .from('rbac_team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id);
      return { ...team, member_count: count ?? 0 };
    })
  );

  return enriched;
}

export async function createTeam(team: Partial<RbacTeam>): Promise<RbacTeam> {
  const { data, error } = await (supabase as any)
    .from('rbac_teams')
    .insert([team])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logActivity({
    team_id: data.id,
    performed_by: 'CA Admin',
    activity_type: 'team_created',
    description: `Created new team: ${data.team_name}`,
    metadata: { team_name: data.team_name },
  });

  return data;
}

export async function updateTeam(id: string, updates: Partial<RbacTeam>): Promise<RbacTeam> {
  const { data, error } = await (supabase as any)
    .from('rbac_teams')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logActivity({
    team_id: id,
    performed_by: 'CA Admin',
    activity_type: 'team_updated',
    description: `Updated team profile for: ${data.team_name}`,
    metadata: updates,
  });

  return data;
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('rbac_teams')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ─── Team Members ────────────────────────────────────────────────────────────

export async function fetchTeamMembers(teamId: string): Promise<RbacTeamMember[]> {
  const { data, error } = await (supabase as any)
    .from('rbac_team_members')
    .select('*, role:rbac_roles(*)')
    .eq('team_id', teamId)
    .order('full_name', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addTeamMember(member: Partial<RbacTeamMember>): Promise<RbacTeamMember> {
  // Ensure we find the correct role_id if only role_name is provided
  let roleId = member.role_id;
  if (!roleId && member.team_id && member.role_name) {
    const { data: team } = await (supabase as any)
      .from('rbac_teams')
      .select('ca_user_id')
      .eq('id', member.team_id)
      .single();

    if (team) {
      const { data: role } = await (supabase as any)
        .from('rbac_roles')
        .select('id')
        .eq('ca_user_id', team.ca_user_id)
        .eq('role_name', member.role_name)
        .single();
      if (role) roleId = role.id;
    }
  }

  const { data, error } = await (supabase as any)
    .from('rbac_team_members')
    .insert([{ ...member, role_id: roleId }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logActivity({
    team_id: member.team_id!,
    performed_by: 'CA Admin',
    activity_type: 'member_added',
    description: `Added team member: ${data.full_name} (${data.role_name})`,
    metadata: { member_id: data.id, full_name: data.full_name, role_name: data.role_name },
  });

  return data;
}

export async function updateTeamMember(id: string, updates: Partial<RbacTeamMember>): Promise<RbacTeamMember> {
  // If role_name is changing, resolve and change role_id accordingly
  let roleId = updates.role_id;
  if (!roleId && updates.role_name) {
    const { data: currentMember } = await (supabase as any)
      .from('rbac_team_members')
      .select('team_id')
      .eq('id', id)
      .single();

    if (currentMember) {
      const { data: team } = await (supabase as any)
        .from('rbac_teams')
        .select('ca_user_id')
        .eq('id', currentMember.team_id)
        .single();

      if (team) {
        const { data: role } = await (supabase as any)
          .from('rbac_roles')
          .select('id')
          .eq('ca_user_id', team.ca_user_id)
          .eq('role_name', updates.role_name)
          .single();
        if (role) roleId = role.id;
      }
    }
  }

  const payload = roleId ? { ...updates, role_id: roleId } : updates;

  const { data, error } = await (supabase as any)
    .from('rbac_team_members')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logActivity({
    team_id: data.team_id,
    performed_by: 'CA Admin',
    activity_type: 'member_updated',
    description: `Updated member: ${data.full_name} (${data.role_name}) - status: ${data.status}`,
    metadata: updates,
  });

  return data;
}

export async function removeTeamMember(id: string): Promise<void> {
  const { data: member } = await (supabase as any)
    .from('rbac_team_members')
    .select('team_id, full_name')
    .eq('id', id)
    .single();

  const { error } = await (supabase as any)
    .from('rbac_team_members')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  if (member) {
    await logActivity({
      team_id: member.team_id,
      performed_by: 'CA Admin',
      activity_type: 'member_removed',
      description: `Removed team member: ${member.full_name}`,
      metadata: { member_id: id, full_name: member.full_name },
    });
  }
}

// ─── Roles & Permissions ─────────────────────────────────────────────────────

export async function fetchRoles(caUserId: string): Promise<RbacRole[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('rbac_roles')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('role_name', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchRolePermissions(roleId: string): Promise<RbacRolePermission[]> {
  const { data, error } = await (supabase as any)
    .from('rbac_role_permissions')
    .select('*')
    .eq('role_id', roleId)
    .order('module_name', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateRolePermission(id: string, updates: Partial<RbacRolePermission>): Promise<RbacRolePermission> {
  const { data, error } = await (supabase as any)
    .from('rbac_role_permissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Retrieve role information to log activity properly
  const { data: role } = await (supabase as any)
    .from('rbac_roles')
    .select('ca_user_id, role_name')
    .eq('id', data.role_id)
    .single();

  if (role) {
    const { data: firstTeam } = await (supabase as any)
      .from('rbac_teams')
      .select('id')
      .eq('ca_user_id', role.ca_user_id)
      .limit(1);

    if (firstTeam && firstTeam.length > 0) {
      await logActivity({
        team_id: firstTeam[0].id,
        performed_by: 'CA Admin',
        activity_type: 'permission_updated',
        description: `Updated permissions for Role [${role.role_name}] in module: ${data.module_name}`,
        metadata: { module_name: data.module_name, ...updates },
      });
    }
  }

  return data;
}

// ─── Team Invitations ────────────────────────────────────────────────────────

export async function fetchInvitations(teamId: string): Promise<RbacTeamInvitation[]> {
  const { data, error } = await (supabase as any)
    .from('rbac_team_invitations')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function sendInvitation(
  teamId: string,
  email: string,
  roleName: 'Partner' | 'Manager' | 'Senior CA' | 'Articled Clerk' | 'Data Entry' | 'Viewer',
  invitedBy: string
): Promise<RbacTeamInvitation> {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

  const { data, error } = await (supabase as any)
    .from('rbac_team_invitations')
    .insert([{
      team_id: teamId,
      email,
      role_name: roleName,
      invited_by: invitedBy,
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log activity
  await logActivity({
    team_id: teamId,
    performed_by: 'CA Admin',
    activity_type: 'invitation_sent',
    description: `Sent invitation to ${email} as ${roleName}`,
    metadata: { invitation_id: data.id, email, role_name: roleName },
  });

  return data;
}

export async function revokeInvitation(id: string): Promise<void> {
  const { data: invitation } = await (supabase as any)
    .from('rbac_team_invitations')
    .select('team_id, email')
    .eq('id', id)
    .single();

  const { error } = await (supabase as any)
    .from('rbac_team_invitations')
    .update({ status: 'revoked' })
    .eq('id', id);

  if (error) throw new Error(error.message);

  if (invitation) {
    await logActivity({
      team_id: invitation.team_id,
      performed_by: 'CA Admin',
      activity_type: 'invitation_revoked',
      description: `Revoked team invitation for ${invitation.email}`,
      metadata: { invitation_id: id, email: invitation.email },
    });
  }
}

// ─── Activity Logs ───────────────────────────────────────────────────────────

export async function fetchActivityLogs(teamId: string): Promise<RbacActivityLog[]> {
  const { data, error } = await (supabase as any)
    .from('rbac_member_activity_logs')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function logActivity(log: Partial<RbacActivityLog>): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from('rbac_member_activity_logs')
      .insert([{
        team_id: log.team_id,
        performed_by: log.performed_by || 'System',
        activity_type: log.activity_type || 'system_event',
        description: log.description || 'System event recorded',
        ip_address: log.ip_address || '127.0.0.1',
        user_agent: log.user_agent || 'Regulon Agentic Core',
        metadata: log.metadata || {},
      }]);

    if (error) console.error('Failed to insert activity log:', error.message);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
