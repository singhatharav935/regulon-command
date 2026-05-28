/**
 * Multi-Entity & Consolidated Reporting Component
 * Premium CA Dashboard module — Gap 1 implementation
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  useEntities, useEntityGroups, useGroupMembers,
  useConsolidatedReports, useComplianceOverview,
} from '@/hooks/useMultiEntity';
import type { Entity, EntityGroup, ReportType } from '@/services/multi-entity-service';
import {
  Building2, Plus, Search, Download, RefreshCw, Trash2, Edit3,
  Users, BarChart3, Shield, AlertTriangle, CheckCircle, Clock,
  Layers, Network, FileText, TrendingUp, Activity, Eye, X,
  Save, Loader2, ChevronDown, ChevronRight, DollarSign,
  Hash, Calendar, Globe, Briefcase, Filter, LayoutGrid,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ENTITY_TYPE_LABELS: Record<string, string> = {
  company: 'Company', llp: 'LLP', partnership: 'Partnership',
  proprietorship: 'Proprietorship', trust: 'Trust', huf: 'HUF',
  aop: 'AOP', society: 'Society',
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  company: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  llp: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  partnership: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  proprietorship: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  trust: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  huf: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  aop: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  society: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  dormant: { label: 'Dormant', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  strike_off_pending: { label: 'Strike-Off Pending', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  dissolved: { label: 'Dissolved', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'gst_summary', label: 'GST Summary' },
  { value: 'itr_summary', label: 'ITR Summary' },
  { value: 'tds_summary', label: 'TDS Summary' },
  { value: 'compliance_scorecard', label: 'Compliance Scorecard' },
  { value: 'consolidated_balance_sheet', label: 'Consolidated Balance Sheet' },
  { value: 'inter_company_reconciliation', label: 'Inter-Company Reconciliation' },
  { value: 'deadline_matrix', label: 'Deadline Matrix' },
  { value: 'risk_heatmap', label: 'Risk Heatmap' },
];

const GROUP_TYPE_LABELS: Record<string, string> = {
  holding_subsidiary: 'Holding/Subsidiary',
  family_group: 'Family Group',
  custom: 'Custom',
  industry_cluster: 'Industry Cluster',
};

const GROUP_COLOR_OPTIONS = [
  '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#3b82f6', '#ec4899', '#14b8a6',
];

const REGULATORS = ['GST', 'ITR', 'TDS', 'MCA', 'ROC'];

function healthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function healthBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function heatmapCellColor(score: number | null): string {
  if (score === null) return 'bg-gray-700/40 text-gray-500';
  if (score >= 80) return 'bg-green-500/30 text-green-400 border-green-500/30';
  if (score >= 60) return 'bg-yellow-500/30 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/30 text-red-400 border-red-500/30';
}

// ─── Add Entity Form ──────────────────────────────────────────────────────────

interface EntityFormProps {
  caUserId: string;
  onSave: (data: Partial<Entity>) => Promise<void>;
  initial?: Partial<Entity>;
  onClose: () => void;
}

const EntityForm = ({ caUserId, onSave, initial, onClose }: EntityFormProps) => {
  const [form, setForm] = useState<Partial<Entity>>({
    entity_name: '',
    entity_type: 'company',
    pan: '',
    cin: '',
    gstin: '',
    tan: '',
    incorporation_date: '',
    financial_year_end: '03-31',
    industry: '',
    turnover_bracket: undefined,
    entity_status: 'active',
    ca_user_id: caUserId,
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Entity, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.entity_name?.trim()) { toast.error('Entity name is required'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label className="text-xs text-muted-foreground mb-1">Entity Name *</Label>
          <Input
            value={form.entity_name ?? ''}
            onChange={(e) => set('entity_name', e.target.value)}
            placeholder="e.g. Acme Pvt. Ltd."
            className="bg-card/50 border-border/50"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">Entity Type *</Label>
          <Select value={form.entity_type} onValueChange={(v) => set('entity_type', v)}>
            <SelectTrigger className="bg-card/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ENTITY_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">Status</Label>
          <Select value={form.entity_status} onValueChange={(v) => set('entity_status', v)}>
            <SelectTrigger className="bg-card/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                <SelectItem key={v} value={v}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">PAN</Label>
          <Input
            value={form.pan ?? ''}
            onChange={(e) => set('pan', e.target.value.toUpperCase())}
            placeholder="AAAAA0000A"
            maxLength={10}
            className="bg-card/50 border-border/50 font-mono"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">GSTIN</Label>
          <Input
            value={form.gstin ?? ''}
            onChange={(e) => set('gstin', e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            className="bg-card/50 border-border/50 font-mono"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">CIN (for Companies/LLPs)</Label>
          <Input
            value={form.cin ?? ''}
            onChange={(e) => set('cin', e.target.value.toUpperCase())}
            placeholder="U12345MH2020PTC000000"
            maxLength={21}
            className="bg-card/50 border-border/50 font-mono text-xs"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">TAN</Label>
          <Input
            value={form.tan ?? ''}
            onChange={(e) => set('tan', e.target.value.toUpperCase())}
            placeholder="AAAA00000A"
            maxLength={10}
            className="bg-card/50 border-border/50 font-mono"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">Incorporation Date</Label>
          <Input
            type="date"
            value={form.incorporation_date ?? ''}
            onChange={(e) => set('incorporation_date', e.target.value)}
            className="bg-card/50 border-border/50"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">Industry</Label>
          <Input
            value={form.industry ?? ''}
            onChange={(e) => set('industry', e.target.value)}
            placeholder="e.g. Manufacturing, IT Services"
            className="bg-card/50 border-border/50"
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-xs text-muted-foreground mb-1">Turnover Bracket</Label>
          <Select
            value={form.turnover_bracket ?? ''}
            onValueChange={(v) => set('turnover_bracket', v)}
          >
            <SelectTrigger className="bg-card/50 border-border/50">
              <SelectValue placeholder="Select turnover range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="below_1cr">Below ₹1 Cr</SelectItem>
              <SelectItem value="1cr_5cr">₹1 Cr – ₹5 Cr</SelectItem>
              <SelectItem value="5cr_10cr">₹5 Cr – ₹10 Cr</SelectItem>
              <SelectItem value="10cr_50cr">₹10 Cr – ₹50 Cr</SelectItem>
              <SelectItem value="50cr_250cr">₹50 Cr – ₹250 Cr</SelectItem>
              <SelectItem value="above_250cr">Above ₹250 Cr</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Entity</>}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
};

// ─── Entity Registry Tab ──────────────────────────────────────────────────────

const EntityRegistryTab = ({ caUserId }: { caUserId: string }) => {
  const { entities, loading, refetch, addEntity, editEntity, removeEntity } = useEntities(caUserId);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return entities.filter((e) => {
      const matchSearch =
        search === '' ||
        e.entity_name.toLowerCase().includes(search.toLowerCase()) ||
        (e.pan ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (e.gstin ?? '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || e.entity_type === typeFilter;
      const matchStatus = statusFilter === 'all' || e.entity_status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [entities, search, typeFilter, statusFilter]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await removeEntity(id); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, PAN, GSTIN…"
            className="pl-9 bg-card/50 border-border/50"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-card/50 border-border/50">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(ENTITY_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-card/50 border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <SelectItem key={v} value={v}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          className="border-border/50"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700 ml-auto">
              <Plus className="w-4 h-4 mr-2" /> Add Entity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-background border-border/50">
            <DialogHeader>
              <DialogTitle className="text-cyan-400 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Add New Entity
              </DialogTitle>
            </DialogHeader>
            <EntityForm
              caUserId={caUserId}
              onSave={addEntity}
              onClose={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Entities', value: entities.length, color: 'cyan', icon: Building2 },
          { label: 'Active', value: entities.filter((e) => e.entity_status === 'active').length, color: 'green', icon: CheckCircle },
          { label: 'Dormant', value: entities.filter((e) => e.entity_status === 'dormant').length, color: 'yellow', icon: Clock },
          { label: 'At Risk', value: entities.filter((e) => e.entity_status === 'strike_off_pending').length, color: 'red', icon: AlertTriangle },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border bg-${card.color}-500/5 border-${card.color}-500/20`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <Icon className={`w-4 h-4 text-${card.color}-400`} />
              </div>
              <p className={`text-2xl font-bold text-${card.color}-400`}>{card.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No entities found</p>
          <p className="text-sm mt-1">
            {entities.length === 0
              ? 'Add your first client entity to get started'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-card/50">
                <TableHead className="text-muted-foreground w-6"></TableHead>
                <TableHead className="text-muted-foreground">Entity Name</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">PAN</TableHead>
                <TableHead className="text-muted-foreground">GSTIN</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Industry</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entity, idx) => (
                <>
                  <TableRow
                    key={entity.id}
                    className="border-border/30 hover:bg-card/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === entity.id ? null : entity.id)}
                  >
                    <TableCell className="py-3">
                      <motion.div
                        animate={{ rotate: expandedRow === entity.id ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    </TableCell>
                    <TableCell className="font-medium py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: `linear-gradient(135deg, #06b6d4, #8b5cf6)` }}
                        >
                          {entity.entity_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{entity.entity_name}</p>
                          {entity.incorporation_date && (
                            <p className="text-[10px] text-muted-foreground">
                              Inc. {new Date(entity.incorporation_date).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={`text-xs ${ENTITY_TYPE_COLORS[entity.entity_type]}`}>
                        {ENTITY_TYPE_LABELS[entity.entity_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                      {entity.pan || '—'}
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                      {entity.gstin ? `${entity.gstin.substring(0, 7)}…` : '—'}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={`text-xs ${STATUS_CONFIG[entity.entity_status].cls}`}>
                        {STATUS_CONFIG[entity.entity_status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {entity.industry || '—'}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 text-cyan-400 hover:bg-cyan-500/10"
                          onClick={() => setEditingEntity(entity)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 text-red-400 hover:bg-red-500/10"
                          disabled={deletingId === entity.id}
                          onClick={() => handleDelete(entity.id)}
                        >
                          {deletingId === entity.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Detail Row */}
                  <AnimatePresence>
                    {expandedRow === entity.id && (
                      <tr key={`${entity.id}-expanded`}>
                        <td colSpan={8} className="p-0 border-border/30">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 py-4 bg-card/20 border-t border-border/20">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                {[
                                  { label: 'CIN', value: entity.cin, icon: Hash },
                                  { label: 'TAN', value: entity.tan, icon: Hash },
                                  { label: 'FY End', value: entity.financial_year_end, icon: Calendar },
                                  { label: 'Turnover', value: entity.turnover_bracket?.replace(/_/g, ' '), icon: DollarSign },
                                ].map(({ label, value, icon: Icon }) => (
                                  <div key={label} className="flex items-start gap-2">
                                    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                                      <p className="font-mono text-xs mt-0.5">{value || '—'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingEntity} onOpenChange={(o) => !o && setEditingEntity(null)}>
        <DialogContent className="max-w-2xl bg-background border-border/50">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2">
              <Edit3 className="w-5 h-5" /> Edit Entity
            </DialogTitle>
          </DialogHeader>
          {editingEntity && (
            <EntityForm
              caUserId={caUserId}
              initial={editingEntity}
              onSave={(data) => editEntity(editingEntity.id, data)}
              onClose={() => setEditingEntity(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Entity Groups Tab ────────────────────────────────────────────────────────

const EntityGroupsTab = ({ caUserId }: { caUserId: string }) => {
  const { groups, loading, addGroup, removeGroup } = useEntityGroups(caUserId);
  const { entities } = useEntities(caUserId);
  const [selectedGroup, setSelectedGroup] = useState<EntityGroup | null>(null);
  const { members, loading: membersLoading, addMember, removeMember } = useGroupMembers(selectedGroup?.id ?? null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<EntityGroup['group_type']>('custom');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLOR_OPTIONS[0]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [addingEntityId, setAddingEntityId] = useState('');

  const memberEntityIds = useMemo(() => new Set(members.map((m) => m.entity_id)), [members]);
  const availableEntities = useMemo(
    () => entities.filter((e) => !memberEntityIds.has(e.id)),
    [entities, memberEntityIds]
  );

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) { toast.error('Group name is required'); return; }
    setCreatingGroup(true);
    try {
      await addGroup(newGroupName, newGroupType, newGroupDesc, newGroupColor);
      setNewGroupName(''); setNewGroupType('custom'); setNewGroupDesc('');
      setShowCreateDialog(false);
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Groups List */}
      <div className="lg:col-span-1 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" /> Entity Groups
          </h3>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border/50">
              <DialogHeader>
                <DialogTitle className="text-purple-400">Create Entity Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Group Name *</Label>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Sharma Family Holdings"
                    className="mt-1 bg-card/50 border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Group Type</Label>
                  <Select value={newGroupType} onValueChange={(v: any) => setNewGroupType(v)}>
                    <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GROUP_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Optional description"
                    className="mt-1 bg-card/50 border-border/50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Color Tag</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {GROUP_COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewGroupColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${newGroupColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleCreateGroup}
                  disabled={creatingGroup}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {creatingGroup ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No groups yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedGroup?.id === group.id
                    ? 'border-purple-500/60 bg-purple-500/10'
                    : 'border-border/40 bg-card/20 hover:border-border/60'
                }`}
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color_tag }} />
                    <span className="font-medium text-sm">{group.group_name}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-6 h-6 text-red-400 hover:bg-red-500/10"
                    onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                    {GROUP_TYPE_LABELS[group.group_type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    <Users className="w-3 h-3 inline mr-1" />{group.member_count ?? 0} entities
                  </span>
                </div>
                {group.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{group.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Group Members Panel */}
      <div className="lg:col-span-2">
        {!selectedGroup ? (
          <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed border-border/40 rounded-xl">
            <div className="text-center">
              <Network className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Select a group</p>
              <p className="text-sm mt-1">Click a group on the left to view and manage its entities</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedGroup.color_tag }} />
                  {selectedGroup.group_name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {GROUP_TYPE_LABELS[selectedGroup.group_type]} · {members.length} members
                </p>
              </div>

              {availableEntities.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select value={addingEntityId} onValueChange={setAddingEntityId}>
                    <SelectTrigger className="w-52 bg-card/50 border-border/50 text-sm">
                      <SelectValue placeholder="Add entity…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEntities.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.entity_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700"
                    disabled={!addingEntityId}
                    onClick={() => {
                      if (addingEntityId) {
                        addMember(addingEntityId).then(() => setAddingEntityId(''));
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {membersLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No entities in this group yet</p>
                <p className="text-xs mt-1">Use the dropdown above to add entities</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/20 hover:bg-card/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
                      >
                        {(member.entity?.entity_name ?? '?').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.entity?.entity_name ?? '—'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-[10px] ${ENTITY_TYPE_COLORS[member.entity?.entity_type ?? 'company']}`}>
                            {ENTITY_TYPE_LABELS[member.entity?.entity_type ?? 'company']}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-border/40 capitalize">
                            {member.role_in_group}
                          </Badge>
                          {member.ownership_percent != null && (
                            <span className="text-xs text-muted-foreground">{member.ownership_percent}% ownership</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 text-red-400 hover:bg-red-500/10"
                      onClick={() => removeMember(member.entity_id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Consolidated Reports Tab ─────────────────────────────────────────────────

const ConsolidatedReportsTab = ({ caUserId }: { caUserId: string }) => {
  const { groups } = useEntityGroups(caUserId);
  const { reports, loading, generating, generateReport } = useConsolidatedReports(caUserId);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [reportType, setReportType] = useState<ReportType>('compliance_scorecard');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!periodStart || !periodEnd) { toast.error('Select a date range'); return; }
    await generateReport(
      selectedGroupId === 'all' ? null : selectedGroupId,
      reportType,
      periodStart,
      periodEnd
    );
  };

  const STATUS_REPORT_CONFIG: Record<string, { cls: string; label: string }> = {
    draft: { cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Draft' },
    finalized: { cls: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Finalized' },
    shared: { cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Shared' },
    archived: { cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Archived' },
  };

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border-emerald-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-400 flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5" /> Generate Consolidated Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Entity Group</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="bg-card/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.group_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Report Type</Label>
              <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                <SelectTrigger className="bg-card/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Period Start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="bg-card/50 border-border/50"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Period End</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="bg-card/50 border-border/50"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[160px]"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                : <><BarChart3 className="w-4 h-4 mr-2" />Generate Report</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border/40 rounded-xl">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No reports yet</p>
          <p className="text-sm mt-1">Generate your first consolidated report above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const summary = (report.generated_data as any)?.summary ?? {};
            const isExpanded = expandedReport === report.id;

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/40 bg-card/20 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-card/30 transition-all"
                  onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{report.report_title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[10px] ${STATUS_REPORT_CONFIG[report.status]?.cls}`}>
                          {STATUS_REPORT_CONFIG[report.status]?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {report.entity_count} entities · {new Date(report.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="border-border/40 text-xs gap-1">
                      <Download className="w-3 h-3" /> PDF
                    </Button>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-border/30"
                    >
                      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-card/10">
                        {[
                          { label: 'Entities', value: summary.total_entities ?? 0, color: 'cyan' },
                          { label: 'Avg Health Score', value: `${summary.average_health_score ?? 0}%`, color: 'green' },
                          { label: 'Total Tasks', value: summary.total_tasks ?? 0, color: 'blue' },
                          { label: 'Overdue Tasks', value: summary.overdue_tasks ?? 0, color: 'red' },
                        ].map((m) => (
                          <div key={m.label} className={`p-3 rounded-lg bg-${m.color}-500/5 border border-${m.color}-500/20`}>
                            <p className="text-xs text-muted-foreground">{m.label}</p>
                            <p className={`text-xl font-bold text-${m.color}-400`}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Compliance Heatmap Tab ───────────────────────────────────────────────────

const ComplianceHeatmapTab = ({ caUserId }: { caUserId: string }) => {
  const { entities, loading } = useEntities(caUserId);
  const { groups } = useEntityGroups(caUserId);
  const [groupFilter, setGroupFilter] = useState('all');
  const [snapshots, setSnapshots] = useState<Record<string, any>>({});
  const [loadingSnaps, setLoadingSnaps] = useState(false);

  const loadSnapshots = useCallback(async () => {
    if (entities.length === 0) return;
    setLoadingSnaps(true);
    try {
      const snaps: Record<string, any> = {};
      await Promise.all(
        entities.map(async (e) => {
          const { fetchLatestSnapshot } = await import('@/services/multi-entity-service');
          const snap = await fetchLatestSnapshot(e.id);
          snaps[e.id] = snap;
        })
      );
      setSnapshots(snaps);
    } catch {
      // silent
    } finally {
      setLoadingSnaps(false);
    }
  }, [entities]);

  useEffect(() => { loadSnapshots(); }, [loadSnapshots]);

  const displayedEntities = useMemo(() => {
    if (groupFilter === 'all') return entities;
    // Filter by group — would need group members for full filtering
    return entities;
  }, [entities, groupFilter]);

  const totalEntities = displayedEntities.length;
  const avgHealth = totalEntities > 0
    ? Math.round(displayedEntities.reduce((s, e) => s + (snapshots[e.id]?.overall_health_score ?? 0), 0) / totalEntities)
    : 0;

  const getRegulatorScore = (entityId: string, regulator: string): number | null => {
    const snap = snapshots[entityId];
    if (!snap) return null;
    const key = `${regulator.toLowerCase()}_status`;
    const status = snap[key];
    if (!status || Object.keys(status).length === 0) return null;
    return (status as any).health_score ?? snap.overall_health_score ?? null;
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Overall Compliance Health</h3>
          <p className="text-sm text-muted-foreground">{totalEntities} entities · {REGULATORS.join(', ')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-4xl font-bold ${healthScoreColor(avgHealth)}`}>{avgHealth}%</p>
            <p className="text-xs text-muted-foreground">Avg Health Score</p>
          </div>
          <div className="w-px h-12 bg-border/50" />
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-44 bg-card/50 border-border/50 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.group_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadSnapshots} className="border-border/50">
            <RefreshCw className={`w-4 h-4 ${loadingSnaps ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">Legend:</span>
        {[
          { label: '≥80% Compliant', cls: 'bg-green-500/30 text-green-400' },
          { label: '60–79% Pending', cls: 'bg-yellow-500/30 text-yellow-400' },
          { label: '<60% Overdue', cls: 'bg-red-500/30 text-red-400' },
          { label: 'No Data', cls: 'bg-gray-700/40 text-gray-500' },
        ].map((l) => (
          <span key={l.label} className={`px-2 py-1 rounded text-[10px] ${l.cls}`}>{l.label}</span>
        ))}
      </div>

      {/* Heatmap Grid */}
      {loading || loadingSnaps ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
      ) : displayedEntities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border/40 rounded-xl">
          <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No entities to display</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-card/50">
                <th className="text-left p-3 text-muted-foreground font-medium min-w-[200px]">Entity</th>
                {REGULATORS.map((r) => (
                  <th key={r} className="text-center p-3 text-muted-foreground font-medium min-w-[80px]">{r}</th>
                ))}
                <th className="text-center p-3 text-muted-foreground font-medium min-w-[100px]">Overall</th>
              </tr>
            </thead>
            <tbody>
              {displayedEntities.map((entity, idx) => {
                const snap = snapshots[entity.id];
                const overall = snap?.overall_health_score ?? null;

                return (
                  <motion.tr
                    key={entity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border/20 hover:bg-card/20 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
                        >
                          {entity.entity_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-xs">{entity.entity_name}</p>
                          <p className="text-[10px] text-muted-foreground">{ENTITY_TYPE_LABELS[entity.entity_type]}</p>
                        </div>
                      </div>
                    </td>
                    {REGULATORS.map((reg) => {
                      const score = getRegulatorScore(entity.id, reg);
                      return (
                        <td key={reg} className="p-2 text-center">
                          <div
                            className={`mx-auto w-14 h-10 rounded-lg border flex items-center justify-center text-xs font-semibold ${heatmapCellColor(score)}`}
                            title={score !== null ? `${score}%` : 'No data'}
                          >
                            {score !== null ? `${Math.round(score)}%` : '—'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-sm font-bold ${healthScoreColor(overall ?? 0)}`}>
                          {overall !== null ? `${Math.round(overall)}%` : '—'}
                        </span>
                        {overall !== null && (
                          <div className="w-16 h-1.5 bg-border/40 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${healthBarColor(overall)}`}
                              style={{ width: `${overall}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MultiEntityConsolidatedReporting = () => {
  const [caUserId, setCaUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('registry');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCaUserId(data.user?.id ?? null);
    });
  }, []);

  if (!caUserId) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 border border-cyan-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600">
            <Network className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">Multi-Entity & Consolidated Reporting</h2>
            <p className="text-sm text-muted-foreground">
              Manage all client entities, group hierarchies, and generate consolidated compliance reports
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Entity Registry', 'Group Hierarchy', 'Consolidated Reports', 'Compliance Heatmap'].map((f) => (
            <Badge key={f} variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
              {f}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-12 bg-card/40 border border-border/50">
          <TabsTrigger
            value="registry"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 gap-2"
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Entity Registry</span>
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 gap-2"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Entity Groups</span>
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger
            value="heatmap"
            className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400 gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Heatmap</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="mt-6">
          <EntityRegistryTab caUserId={caUserId} />
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <EntityGroupsTab caUserId={caUserId} />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ConsolidatedReportsTab caUserId={caUserId} />
        </TabsContent>

        <TabsContent value="heatmap" className="mt-6">
          <ComplianceHeatmapTab caUserId={caUserId} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default MultiEntityConsolidatedReporting;
