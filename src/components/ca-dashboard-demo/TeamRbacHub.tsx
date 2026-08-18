/**
 * TeamRbacHub — Gap 9 UI Dashboard Component
 *
 * Full Role-Based Access Control and Team Workspace management console for CAs.
 * Real Supabase data only. No mock data.
 *
 * Tabs:
 *  1. Team Workspace — Manage team entities, add/edit/remove members, assign roles
 *  2. Roles & Permissions — Read/Write/Delete/Admin matrix configurations for modules
 *  3. Invitations — Invite new colleagues to a team workspace via secure token validation
 *  4. Activity Logs — Compliance audit trail of all administrative actions in the team
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCAIdentity } from '@/hooks/useCAIdentity';
import { toast } from 'sonner';
import {
  useTeams,
  useTeamMembers,
  useRoles,
  useRolePermissions,
  useInvitations,
  useActivityLogs,
} from '@/hooks/useTeamRbac';
import type { RbacTeam, RbacTeamMember, RbacRole, RbacRolePermission, RbacTeamInvitation } from '@/services/team-rbac-service';
import {
  Building2,
  Users,
  ShieldCheck,
  MailOpen,
  History,
  UserPlus,
  Plus,
  Trash2,
  Edit,
  ShieldAlert,
  Check,
  X,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Key,
  Eye,
  Activity,
  Info,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';

// ─── Tab Type ─────────────────────────────────────────────────────────────────

type RbacTab = 'teams' | 'roles' | 'invitations' | 'audit';

// ─── Status Badges ────────────────────────────────────────────────────────────

function MemberStatusBadge({ status }: { status: string }) {
  const c: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-green-500/15', text: 'text-green-400' },
    inactive: { bg: 'bg-zinc-500/15', text: 'text-zinc-400' },
    suspended: { bg: 'bg-red-500/15', text: 'text-red-400' },
  };
  const cfg = c[status] ?? c.active;
  return <Badge className={`${cfg.bg} ${cfg.text} border-none text-[10px] capitalize`}>{status}</Badge>;
}

function InvitationStatusBadge({ status }: { status: string }) {
  const c: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
    accepted: { bg: 'bg-green-500/15', text: 'text-green-400' },
    expired: { bg: 'bg-red-500/15', text: 'text-red-400' },
    revoked: { bg: 'bg-zinc-500/15', text: 'text-zinc-400' },
  };
  const cfg = c[status] ?? c.pending;
  return <Badge className={`${cfg.bg} ${cfg.text} border-none text-[10px] capitalize`}>{status}</Badge>;
}

function ModuleIcon({ moduleName }: { moduleName: string }) {
  const map: Record<string, string> = {
    'e-filing': '⚡',
    'payment': '💰',
    'calendar': '📅',
    'multi-entity': '🏢',
    'erp-integration': '🔌',
    'doc-ocr': '📄',
    'team-rbac': '🛡️',
    'clients': '👥',
    'billing': '💳',
  };
  return <span className="mr-1 text-sm">{map[moduleName] ?? '⚙️'}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TeamRbacHub: React.FC = () => {
  const { caId, email: caEmail } = useCAIdentity();
  const [activeTab, setActiveTab] = useState<RbacTab>('teams');

  // ─── State Management ────────────────────────────────────────────────────────
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  
  // Modals & Form States
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberFullName, setMemberFullName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'Partner' | 'Manager' | 'Senior CA' | 'Articled Clerk' | 'Data Entry' | 'Viewer'>('Viewer');

  const [showInviteMember, setShowInviteMember] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Partner' | 'Manager' | 'Senior CA' | 'Articled Clerk' | 'Data Entry' | 'Viewer'>('Viewer');

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberRole, setEditMemberRole] = useState<'Partner' | 'Manager' | 'Senior CA' | 'Articled Clerk' | 'Data Entry' | 'Viewer'>('Viewer');
  const [editMemberStatus, setEditMemberStatus] = useState<'active' | 'inactive' | 'suspended'>('active');

  const [searchQuery, setSearchQuery] = useState('');

  // ─── Hooks ──────────────────────────────────────────────────────────────────
  const {
    teams,
    loading: teamsLoading,
    refetch: refetchTeams,
    addTeam,
    editTeam,
    removeTeam,
  } = useTeams(caId);

  const {
    members,
    loading: membersLoading,
    refetch: refetchMembers,
    addMember,
    editMember,
    removeMember,
  } = useTeamMembers(selectedTeamId);

  const {
    roles,
    loading: rolesLoading,
    refetch: refetchRoles,
  } = useRoles(caId);

  const {
    permissions,
    loading: permissionsLoading,
    refetch: refetchPermissions,
    editPermission,
  } = useRolePermissions(selectedRoleId);

  const {
    invitations,
    loading: invitationsLoading,
    refetch: refetchInvitations,
    inviteMember,
    cancelInvitation,
  } = useInvitations(selectedTeamId);

  const {
    logs,
    loading: logsLoading,
    refetch: refetchLogs,
  } = useActivityLogs(selectedTeamId);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateTeamSubmit = useCallback(async () => {
    if (!newTeamName.trim()) {
      toast.error('Team Name is required');
      return;
    }
    try {
      await addTeam(newTeamName.trim(), newTeamDesc.trim() || undefined);
      setShowCreateTeam(false);
      setNewTeamName('');
      setNewTeamDesc('');
    } catch {
      // Toast displayed in hook
    }
  }, [newTeamName, newTeamDesc, addTeam]);

  const handleAddMemberSubmit = useCallback(async () => {
    if (!memberFullName.trim() || !memberEmail.trim()) {
      toast.error('Full Name and Email are required');
      return;
    }
    try {
      await addMember(memberFullName.trim(), memberEmail.trim(), memberRole);
      setShowAddMember(false);
      setMemberFullName('');
      setMemberEmail('');
      setMemberRole('Viewer');
    } catch {
      // Toast displayed in hook
    }
  }, [memberFullName, memberEmail, memberRole, addMember]);

  const handleInviteSubmit = useCallback(async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }
    try {
      await inviteMember(inviteEmail.trim(), inviteRole, caId || '');
      setShowInviteMember(false);
      setInviteEmail('');
      setInviteRole('Viewer');
    } catch {
      // Toast displayed in hook
    }
  }, [inviteEmail, inviteRole, caId, inviteMember]);

  const handleEditMemberSubmit = useCallback(async (memberId: string) => {
    try {
      await editMember(memberId, {
        role_name: editMemberRole,
        status: editMemberStatus,
      });
      setEditingMemberId(null);
    } catch {
      // Toast displayed in hook
    }
  }, [editMemberRole, editMemberStatus, editMember]);

  // Select a team and bootstrap dependencies
  const handleSelectTeam = useCallback((teamId: string) => {
    setSelectedTeamId(teamId);
  }, []);

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role_name.toLowerCase().includes(q)
    );
  });

  // Find selected team and role labels
  const currentTeamName = teams.find((t) => t.id === selectedTeamId)?.team_name ?? 'Select Team';
  const currentRoleName = roles.find((r) => r.id === selectedRoleId)?.role_name ?? 'Select Role';

  // Stats calculation
  const totalTeamsCount = teams.length;
  const totalMembersCount = teams.reduce((acc, t) => acc + (t.member_count ?? 0), 0);
  const activeInvitationsCount = invitations.filter((i) => i.status === 'pending').length;

  const rbacTabs: { id: RbacTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'teams', label: 'Team Workspaces', icon: Building2, count: totalTeamsCount },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck, count: roles.length },
    { id: 'invitations', label: 'Invitations', icon: MailOpen, count: activeInvitationsCount },
    { id: 'audit', label: 'Activity Logs', icon: History, count: logs.length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ─── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-8 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-900/15 via-pink-900/10 to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-rose-400">RBAC & Team Management</h2>
              <p className="text-sm text-muted-foreground">
                Govern granular module access permissions and administer CA firm workspace staff
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Firm Workspaces', value: totalTeamsCount, color: 'text-rose-400', icon: Building2 },
              { label: 'Staff Registered', value: totalMembersCount, color: 'text-pink-400', icon: Users },
              { label: 'Firm Roles Defined', value: roles.length, color: 'text-amber-400', icon: Key },
              { label: 'Pending Invites', value: activeInvitationsCount, color: 'text-rose-300', icon: MailOpen },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-4 rounded-xl bg-background/40 border border-border/30">
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

      {/* ─── Tabs Navigation ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/20">
        {rbacTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${
                  isActive
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_12px_-3px_rgba(244,63,94,0.2)]'
                    : 'border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <Badge
                  className={`text-[10px] h-5 ${
                    isActive
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-card/50 text-muted-foreground border-border/30'
                  }`}
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* ═════ TAB 1: TEAM WORKSPACE ═════ */}
      {activeTab === 'teams' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Workspaces List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Workspace</h3>
                <Button
                  size="xs"
                  onClick={() => setShowCreateTeam(true)}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-[10px]"
                >
                  <Plus className="w-3 h-3 mr-1" /> New Team
                </Button>
              </div>

              {/* Create Team Form Panel */}
              <AnimatePresence>
                {showCreateTeam && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Card className="border-rose-500/20 bg-card/30">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-bold text-rose-400">Initialize Team</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase block mb-1">Team Name</label>
                          <Input
                            size="sm"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            placeholder="e.g. Audit Squad"
                            className="bg-background/40 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase block mb-1">Description</label>
                          <Input
                            size="sm"
                            value={newTeamDesc}
                            onChange={(e) => setNewTeamDesc(e.target.value)}
                            placeholder="Brief function summary"
                            className="bg-background/40 text-xs"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="xs" onClick={handleCreateTeamSubmit} className="bg-rose-600 hover:bg-rose-500 text-white">
                            Create
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setShowCreateTeam(false)}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Teams List */}
              {teamsLoading ? (
                <div className="flex justify-center p-4">
                  <RefreshCw className="w-5 h-5 text-rose-400 animate-spin" />
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-border/30 bg-card/10">
                  <Building2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No workspaces created yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {teams.map((t) => {
                    const isSelected = selectedTeamId === t.id;
                    return (
                      <motion.div
                        key={t.id}
                        onClick={() => handleSelectTeam(t.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left
                          ${
                            isSelected
                              ? 'bg-rose-500/10 border-rose-500/40'
                              : 'bg-card/25 border-border/20 hover:border-rose-500/20'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-xs text-foreground truncate">{t.team_name}</span>
                          <Badge className="bg-background/80 text-muted-foreground text-[9px] border-border/30">
                            {t.member_count ?? 0} members
                          </Badge>
                        </div>
                        {t.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{t.description}</p>
                        )}
                        <div className="flex justify-end gap-1 mt-2.5">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newName = prompt('Enter new team name:', t.team_name);
                              if (newName) editTeam(t.id, { team_name: newName });
                            }}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this workspace? All registered members will be deleted.')) {
                                removeTeam(t.id);
                                if (selectedTeamId === t.id) setSelectedTeamId(null);
                              }
                            }}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Team Members List (Right Side) */}
            <div className="md:col-span-2 space-y-4">
              {!selectedTeamId ? (
                <div className="h-full flex flex-col justify-center items-center py-16 rounded-2xl border border-dashed border-border/30 bg-card/5">
                  <Users className="w-12 h-12 text-muted-foreground/30 mb-4 animate-pulse" />
                  <p className="text-sm text-muted-foreground">Select a team workspace to view and manage registered staff</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-base font-bold text-foreground flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-rose-400" />
                        {currentTeamName}
                      </h4>
                      <p className="text-xs text-muted-foreground">Workspace Roster & Assignable Roles</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative w-48">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          size="sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search roster..."
                          className="pl-8 bg-background/50 text-xs h-8"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowAddMember(true)}
                        className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white gap-1 h-8"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add Staff
                      </Button>
                    </div>
                  </div>

                  {/* Add Member Slider Form */}
                  <AnimatePresence>
                    {showAddMember && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-4"
                      >
                        <h5 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                          <UserPlus className="w-4 h-4" /> Register Staff Direct
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Full Name</label>
                            <Input
                              size="sm"
                              value={memberFullName}
                              onChange={(e) => setMemberFullName(e.target.value)}
                              placeholder="e.g. Atharav Singh"
                              className="bg-background/60"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Email</label>
                            <Input
                              size="sm"
                              value={memberEmail}
                              onChange={(e) => setMemberEmail(e.target.value)}
                              placeholder="colleague@firm.com"
                              className="bg-background/60"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Role</label>
                            <select
                              value={memberRole}
                              onChange={(e) => setMemberRole(e.target.value as any)}
                              className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground"
                            >
                              <option value="Partner">Partner (Admin)</option>
                              <option value="Manager">Manager</option>
                              <option value="Senior CA">Senior CA</option>
                              <option value="Articled Clerk">Articled Clerk</option>
                              <option value="Data Entry">Data Entry</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAddMemberSubmit} className="bg-rose-600 hover:bg-rose-500 text-white">
                            Add Staff Member
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowAddMember(false)}>
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Members Roster Table */}
                  {membersLoading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-12 rounded-xl border border-dashed border-border/30 bg-card/10">
                      <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No active members found in this roster.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden border border-border/30 rounded-xl bg-background/20">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-card/45 border-b border-border/20 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                            <th className="p-3">Staff Name</th>
                            <th className="p-3">Email Address</th>
                            <th className="p-3">Assigned Role</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMembers.map((m) => {
                            const isEditing = editingMemberId === m.id;
                            return (
                              <tr key={m.id} className="border-b border-border/10 hover:bg-card/15 transition-colors">
                                <td className="p-3 font-medium text-foreground">{m.full_name}</td>
                                <td className="p-3 text-muted-foreground">{m.email}</td>
                                <td className="p-3 text-foreground">
                                  {isEditing ? (
                                    <select
                                      value={editMemberRole}
                                      onChange={(e) => setEditMemberRole(e.target.value as any)}
                                      className="p-1 rounded border border-border/30 bg-background text-xs"
                                    >
                                      <option value="Partner">Partner</option>
                                      <option value="Manager">Manager</option>
                                      <option value="Senior CA">Senior CA</option>
                                      <option value="Articled Clerk">Articled Clerk</option>
                                      <option value="Data Entry">Data Entry</option>
                                      <option value="Viewer">Viewer</option>
                                    </select>
                                  ) : (
                                    <Badge className="bg-rose-500/10 text-rose-300 border-none font-mono text-[10px]">
                                      {m.role_name}
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-3">
                                  {isEditing ? (
                                    <select
                                      value={editMemberStatus}
                                      onChange={(e) => setEditMemberStatus(e.target.value as any)}
                                      className="p-1 rounded border border-border/30 bg-background text-xs"
                                    >
                                      <option value="active">Active</option>
                                      <option value="inactive">Inactive</option>
                                      <option value="suspended">Suspended</option>
                                    </select>
                                  ) : (
                                    <MemberStatusBadge status={m.status} />
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    {isEditing ? (
                                      <>
                                        <Button
                                          size="xs"
                                          onClick={() => handleEditMemberSubmit(m.id)}
                                          className="bg-green-600 hover:bg-green-500 text-white h-7 w-7 p-0"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          onClick={() => setEditingMemberId(null)}
                                          className="h-7 w-7 p-0"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingMemberId(m.id);
                                            setEditMemberRole(m.role_name);
                                            setEditMemberStatus(m.status);
                                          }}
                                          className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant="ghost"
                                          onClick={() => {
                                            if (confirm(`Remove ${m.full_name} from this roster?`)) {
                                              removeMember(m.id);
                                            }
                                          }}
                                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ TAB 2: ROLES & PERMISSIONS ═══ */}
      {activeTab === 'roles' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Roles Sidebar */}
            <div className="md:col-span-1 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Staff Role</h3>
              {rolesLoading ? (
                <div className="flex justify-center p-4">
                  <RefreshCw className="w-5 h-5 text-rose-400 animate-spin" />
                </div>
              ) : roles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No roles defined yet.</p>
              ) : (
                <div className="space-y-2">
                  {roles.map((r) => {
                    const isSelected = selectedRoleId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRoleId(r.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left
                          ${
                            isSelected
                              ? 'bg-rose-500/10 border-rose-500/40 shadow-sm'
                              : 'bg-card/25 border-border/20 hover:border-rose-500/20'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground truncate">{r.role_name}</span>
                          {r.is_system && (
                            <Badge className="bg-rose-500/10 text-rose-300 border-none text-[8px] tracking-wide">
                              SYSTEM
                            </Badge>
                          )}
                        </div>
                        {r.description && <p className="text-[10px] text-muted-foreground mt-1">{r.description}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Permissions Matrix */}
            <div className="md:col-span-2 space-y-4">
              {!selectedRoleId ? (
                <div className="h-full flex flex-col justify-center items-center py-16 rounded-2xl border border-dashed border-border/30 bg-card/5">
                  <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mb-4 animate-pulse" />
                  <p className="text-sm text-muted-foreground">Select a role to govern its system permission matrix</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-rose-400" />
                      Role Matrix: {currentRoleName}
                    </h4>
                    <p className="text-xs text-muted-foreground">Granular module execution levels (read, write, delete, admin)</p>
                  </div>

                  {permissionsLoading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
                    </div>
                  ) : permissions.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border border-dashed border-border/30 bg-card/10">
                      <ShieldAlert className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No permissions configured for this role.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden border border-border/30 rounded-xl bg-background/20">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-card/45 border-b border-border/20 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                            <th className="p-3">Compliance Module</th>
                            <th className="p-3 text-center">Read</th>
                            <th className="p-3 text-center">Write</th>
                            <th className="p-3 text-center">Delete</th>
                            <th className="p-3 text-center">Admin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {permissions.map((p) => (
                            <tr key={p.id} className="border-b border-border/10 hover:bg-card/10 transition-colors">
                              <td className="p-3 font-semibold text-foreground flex items-center">
                                <ModuleIcon moduleName={p.module_name} />
                                <span className="capitalize">{p.module_name.replace('-', ' ')}</span>
                              </td>
                              {/* Read Toggle */}
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => editPermission(p.id, { can_read: !p.can_read })}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    p.can_read
                                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                      : 'border-border/30 text-muted-foreground hover:bg-card'
                                  }`}
                                >
                                  {p.can_read ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                              {/* Write Toggle */}
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => editPermission(p.id, { can_write: !p.can_write })}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    p.can_write
                                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                      : 'border-border/30 text-muted-foreground hover:bg-card'
                                  }`}
                                >
                                  {p.can_write ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                              {/* Delete Toggle */}
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => editPermission(p.id, { can_delete: !p.can_delete })}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    p.can_delete
                                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                      : 'border-border/30 text-muted-foreground hover:bg-card'
                                  }`}
                                >
                                  {p.can_delete ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                              {/* Admin Toggle */}
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => editPermission(p.id, { can_admin: !p.can_admin })}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    p.can_admin
                                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-sm'
                                      : 'border-border/30 text-muted-foreground hover:bg-card'
                                  }`}
                                >
                                  {p.can_admin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ TAB 3: INVITATIONS ═══ */}
      {activeTab === 'invitations' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Send Invites</h3>
              <p className="text-xs text-muted-foreground">Secure workspace token invitations to staff members</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedTeamId || ''}
                onChange={(e) => setSelectedTeamId(e.target.value || null)}
                className="p-2 h-9 rounded-lg border border-border/30 bg-background/50 text-xs text-foreground max-w-xs"
              >
                <option value="">Select Team Workspace</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.team_name}</option>
                ))}
              </select>
              {selectedTeamId && (
                <Button
                  size="sm"
                  onClick={() => setShowInviteMember(true)}
                  className="bg-gradient-to-r from-rose-600 to-pink-600 text-white gap-1 h-9 text-xs"
                >
                  <MailOpen className="w-3.5 h-3.5" /> Send Invite
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={refetchInvitations} disabled={!selectedTeamId} className="h-9">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Invitation Dialog Slider */}
          <AnimatePresence>
            {showInviteMember && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-rose-500/20 bg-card/30">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-bold text-rose-400">Generate Invite Token</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Colleague Email</label>
                        <Input
                          size="sm"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="e.g. colleague@ca-firm.com"
                          className="bg-background/40"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Target Role</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as any)}
                          className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/40 text-xs text-foreground"
                        >
                          <option value="Partner">Partner</option>
                          <option value="Manager">Manager</option>
                          <option value="Senior CA">Senior CA</option>
                          <option value="Articled Clerk">Articled Clerk</option>
                          <option value="Data Entry">Data Entry</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleInviteSubmit} className="bg-rose-600 hover:bg-rose-500 text-white">
                        Dispatch Invitation
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowInviteMember(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedTeamId ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <MailOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Select a team workspace to audit secure token invitations</p>
            </div>
          ) : invitationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <MailOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No active invitations dispatched yet</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-border/30 rounded-xl bg-background/20 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-card/45 border-b border-border/20 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                    <th className="p-3">Invited Email</th>
                    <th className="p-3">Role Target</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Expiration Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((i) => (
                    <tr key={i.id} className="border-b border-border/10 hover:bg-card/10 transition-colors">
                      <td className="p-3 font-semibold text-foreground">{i.email}</td>
                      <td className="p-3 text-muted-foreground font-mono">{i.role_name}</td>
                      <td className="p-3">
                        <InvitationStatusBadge status={i.status} />
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(i.expires_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3 text-right">
                        {i.status === 'pending' && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => cancelInvitation(i.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
                          >
                            Revoke Invite
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ TAB 4: ACTIVITY LOGS ═══ */}
      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Compliance Activity Log</h3>
              <p className="text-xs text-muted-foreground">Comprehensive firm-level administrative audit trails</p>
            </div>
            <select
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(e.target.value || null)}
              className="p-2 h-9 rounded-lg border border-border/30 bg-background/50 text-xs text-foreground max-w-xs"
            >
              <option value="">Select Team Workspace</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.team_name}</option>
              ))}
            </select>
          </div>

          {!selectedTeamId ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Select a team workspace to access the compliance audit logs</p>
            </div>
          ) : logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No operations recorded yet in this workspace</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {logs.map((log) => {
                const date = new Date(log.created_at).toLocaleString('en-IN');
                return (
                  <motion.div
                    key={log.id}
                    className="p-4 rounded-xl border border-border/30 bg-card/10 flex items-start gap-3 text-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-4 flex-wrap mb-1">
                        <span className="font-semibold text-foreground">{log.performed_by}</span>
                        <span className="text-[10px] text-muted-foreground">{date}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">{log.description}</p>
                      <div className="flex gap-3 text-[10px] text-muted-foreground/70 mt-2">
                        <span>IP: {log.ip_address}</span>
                        <span>•</span>
                        <span>Type: {log.activity_type.toUpperCase()}</span>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2 group">
                          <summary className="text-[10px] text-rose-400 cursor-pointer select-none font-medium hover:underline flex items-center gap-1">
                            <Info className="w-3 h-3" /> View Event Parameters
                          </summary>
                          <pre className="mt-1.5 p-2 rounded bg-background/50 border border-border/20 text-[9px] font-mono text-zinc-300 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default TeamRbacHub;
