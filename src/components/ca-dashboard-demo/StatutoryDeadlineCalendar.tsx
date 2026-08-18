/**
 * StatutoryDeadlineCalendar — Full Calendar & Deadline Management UI (Gap 4)
 * Real Supabase backend. No mock data.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Plus, Search, Filter, RefreshCw, Trash2, CheckCircle,
  AlertTriangle, Clock, Play, Pause, BellRing, Network, FileText,
  TrendingUp, Building2, ChevronDown, ChevronRight, X, Save, Calendar,
  Activity, Users, Settings, PlusCircle, ShieldAlert, Sparkles, Send, Info
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import { useCAIdentity } from '@/hooks/useCAIdentity';
import { useEntities } from '@/hooks/useMultiEntity';
import {
  useCalendarEvents,
  useRecurringTemplates,
  useEscalationRules,
  useEscalationLogs,
  useSLATimers,
  useCalendarDashboard
} from '@/hooks/useCalendar';
import {
  type CalendarEvent,
  type RecurringTemplate,
  type EscalationRule,
  type SLATimer,
  type CalendarEventType,
  type DeadlinePriority,
  type DeadlineStatus,
  type EscalationChannel,
  type RecurrencePattern,
  INDIAN_STATUTORY_PRESETS
} from '@/services/calendar-service';

// ─── Constants & Metadata ───────────────────────────────────────────────────

const EVENT_TYPE_META: Record<CalendarEventType, { label: string; color: string; border: string }> = {
  gst_return:         { label: 'GST Return',         color: 'bg-emerald-500/20 text-emerald-400', border: 'border-emerald-500/30' },
  itr_filing:         { label: 'Income Tax Return',  color: 'bg-cyan-500/20 text-cyan-400',       border: 'border-cyan-500/30' },
  tds_deposit:        { label: 'TDS Deposit',        color: 'bg-purple-500/20 text-purple-400',   border: 'border-purple-500/30' },
  tds_return:         { label: 'TDS Return',         color: 'bg-purple-500/20 text-purple-400',   border: 'border-purple-500/30' },
  advance_tax:        { label: 'Advance Tax',        color: 'bg-blue-500/20 text-blue-400',       border: 'border-blue-500/30' },
  mca_filing:         { label: 'MCA Filing',         color: 'bg-indigo-500/20 text-indigo-400',   border: 'border-indigo-500/30' },
  roc_filing:         { label: 'ROC Filing',         color: 'bg-indigo-500/20 text-indigo-400',   border: 'border-indigo-500/30' },
  rbi_filing:         { label: 'RBI Filing',         color: 'bg-yellow-500/20 text-yellow-400',   border: 'border-yellow-500/30' },
  sebi_filing:        { label: 'SEBI Filing',        color: 'bg-amber-500/20 text-amber-400',     border: 'border-amber-500/30' },
  epf_deposit:        { label: 'EPF Deposit',        color: 'bg-pink-500/20 text-pink-400',       border: 'border-pink-500/30' },
  esic_deposit:       { label: 'ESIC Deposit',       color: 'bg-pink-500/20 text-pink-400',       border: 'border-pink-500/30' },
  professional_tax:   { label: 'Professional Tax',   color: 'bg-teal-500/20 text-teal-400',       border: 'border-teal-500/30' },
  audit_due:          { label: 'Audit Due Date',     color: 'bg-rose-500/20 text-rose-400',       border: 'border-rose-500/30' },
  agm:                { label: 'AGM',                color: 'bg-violet-500/20 text-violet-400',   border: 'border-violet-500/30' },
  board_meeting:      { label: 'Board Meeting',      color: 'bg-violet-500/20 text-violet-400',   border: 'border-violet-500/30' },
  compliance_review:  { label: 'Compliance Review',  color: 'bg-teal-500/20 text-teal-400',       border: 'border-teal-500/30' },
  custom:             { label: 'Custom',             color: 'bg-gray-500/20 text-gray-400',       border: 'border-gray-500/30' },
  tax_payment:        { label: 'Tax Payment',        color: 'bg-orange-500/20 text-orange-400',   border: 'border-orange-500/30' },
  notice_response:    { label: 'Notice Response',    color: 'bg-rose-500/20 text-rose-400',       border: 'border-rose-500/30' },
  statutory_hearing:  { label: 'Statutory Hearing',  color: 'bg-red-500/20 text-red-400',         border: 'border-red-500/30' },
  assessment:         { label: 'Assessment',         color: 'bg-red-500/20 text-red-400',         border: 'border-red-500/30' },
  reassessment:       { label: 'Reassessment',       color: 'bg-red-500/20 text-red-400',         border: 'border-red-500/30' }
};

const PRIORITY_META: Record<DeadlinePriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  high:     { label: 'High',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  medium:   { label: 'Medium',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  low:      { label: 'Low',      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
};

const STATUS_META: Record<DeadlineStatus, { label: string; color: string }> = {
  upcoming:   { label: 'Upcoming',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  active:     { label: 'Active',    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  due_today:  { label: 'Due Today', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse' },
  overdue:    { label: 'Overdue',   color: 'bg-red-500/20 text-red-400 border-red-500/30 font-bold' },
  completed:  { label: 'Completed', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  cancelled:  { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  extended:   { label: 'Extended',  color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  waived:     { label: 'Waived',    color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StatutoryDeadlineCalendar() {
  const { caId } = useCAIdentity();
  const { entities } = useEntities(caId);

  // Core Hooks
  const {
    events,
    loading: loadingEvents,
    refetch: refetchEvents,
    addEvent,
    removeEvent,
    completeEvent,
    extendEvent,
    bulkStatusUpdate,
    filters,
    setFilters
  } = useCalendarEvents(caId);

  const {
    templates,
    loading: loadingTemplates,
    refetch: refetchTemplates,
    addTemplate,
    removeTemplate,
    generateEvents
  } = useRecurringTemplates(caId);

  const {
    rules,
    loading: loadingRules,
    refetch: refetchRules,
    addRule,
    removeRule,
    toggleRule
  } = useEscalationRules(caId);

  const {
    logs,
    loading: loadingLogs,
    refetch: refetchLogs
  } = useEscalationLogs(caId);

  const {
    timers,
    loading: loadingTimers,
    refetch: refetchTimers,
    pause: pauseTimer,
    resume: resumeTimer,
    complete: completeTimer
  } = useSLATimers(caId);

  const {
    summary: dashboardSummary,
    loading: loadingSummary,
    refetch: refetchSummary
  } = useCalendarDashboard(caId);

  // Local State
  const [activeTab, setActiveTab] = useState<'calendar' | 'register' | 'rules' | 'templates'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  
  // Dialog Open States
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<CalendarEvent | null>(null);
  const [extendTarget, setExtendTarget] = useState<CalendarEvent | null>(null);
  const [generateTarget, setGenerateTarget] = useState<RecurringTemplate | null>(null);

  // Form states
  const [eventForm, setEventForm] = useState({
    title: '', description: '', event_type: 'gst_return' as CalendarEventType,
    regulator: 'CBIC', due_date: '', due_time: '', entity_id: '',
    priority: 'medium' as DeadlinePriority, sla_hours: '',
    penalty_per_day: '', max_penalty: '', penalty_section: '',
    is_recurring: false, recurrence_pattern: 'monthly' as RecurrencePattern,
    color_tag: '#10B981', notes: ''
  });

  const [ruleForm, setRuleForm] = useState({
    rule_name: '', description: '', trigger_type: 'days_before_due', trigger_value: '3',
    channel: 'email' as EscalationChannel, recipient_name: '', recipient_contact: '',
    applies_to_types: [] as CalendarEventType[], applies_to_priorities: [] as DeadlinePriority[],
    applies_to_regulators: [] as string[], entity_id: ''
  });

  const [templateForm, setTemplateForm] = useState({
    template_name: '', description: '', event_type: 'gst_return' as CalendarEventType,
    regulator: 'CBIC', recurrence: 'monthly' as RecurrencePattern,
    day_of_month: '11', month_of_year: '', default_priority: 'high' as DeadlinePriority,
    default_sla_hours: '', penalty_per_day: '', max_penalty: '',
    penalty_section: '', color_tag: '#10B981', auto_remind_days: '7,3,1'
  });

  const [completeNotes, setCompleteNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [genEntityIds, setGenEntityIds] = useState<string[]>([]);
  const [genMonths, setGenMonths] = useState('3');

  // Trigger loading & preset seeding helper
  const [isSeeding, setIsSeeding] = useState(false);

  const handleRefreshAll = useCallback(() => {
    refetchEvents();
    refetchTemplates();
    refetchRules();
    refetchLogs();
    refetchTimers();
    refetchSummary();
  }, [refetchEvents, refetchTemplates, refetchRules, refetchLogs, refetchTimers, refetchSummary]);

  // Seeding presets
  const seedPresets = async () => {
    if (!caId) return;
    setIsSeeding(true);
    try {
      let count = 0;
      for (const preset of INDIAN_STATUTORY_PRESETS) {
        // check if preset exists
        const exists = templates.some(t => t.template_name === preset.template_name);
        if (!exists) {
          await addTemplate(preset);
          count++;
        }
      }
      if (count > 0) {
        toast.success(`Successfully seeded ${count} Indian compliance templates!`);
        refetchTemplates();
      } else {
        toast.info('Compliance templates are already seeded.');
      }
    } catch (err: any) {
      toast.error('Failed to seed templates', { description: err.message });
    } finally {
      setIsSeeding(false);
    }
  };

  // Monthly calendar math
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentDate]);

  const monthOffset = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay(); // 0 = Sunday, 6 = Saturday
  }, [currentDate]);

  // Calendar Day to Events mapping
  const monthlyEventMap = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    events.forEach(event => {
      const d = new Date(event.due_date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(event);
      }
    });
    return map;
  }, [events, currentDate]);

  const selectedDayEvents = useMemo(() => {
    if (selectedDay === null) return [];
    return monthlyEventMap[selectedDay] || [];
  }, [selectedDay, monthlyEventMap]);

  // Actions
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.due_date) {
      toast.error('Title and Due Date are required');
      return;
    }

    try {
      await addEvent({
        title: eventForm.title,
        description: eventForm.description || null,
        event_type: eventForm.event_type,
        regulator: eventForm.regulator,
        due_date: eventForm.due_date,
        due_time: eventForm.due_time || null,
        entity_id: eventForm.entity_id || null,
        priority: eventForm.priority,
        sla_hours: eventForm.sla_hours ? Number(eventForm.sla_hours) : null,
        penalty_per_day_paise: eventForm.penalty_per_day ? Number(eventForm.penalty_per_day) * 100 : 0,
        max_penalty_paise: eventForm.max_penalty ? Number(eventForm.max_penalty) * 100 : 0,
        penalty_section: eventForm.penalty_section || null,
        is_recurring: eventForm.is_recurring,
        recurrence_pattern: eventForm.is_recurring ? eventForm.recurrence_pattern : null,
        color_tag: eventForm.color_tag,
        notes: eventForm.notes || null,
        status: 'upcoming'
      });
      setShowAddEvent(false);
      refetchSummary();
    } catch {
      // toast is already fired by hook
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.rule_name || !ruleForm.recipient_name || !ruleForm.recipient_contact) {
      toast.error('Rule name and recipient contact details are required');
      return;
    }

    try {
      await addRule({
        rule_name: ruleForm.rule_name,
        description: ruleForm.description || null,
        trigger_type: ruleForm.trigger_type,
        trigger_value: Number(ruleForm.trigger_value) || 0,
        channel: ruleForm.channel,
        recipients: [{ name: ruleForm.recipient_name, contact: ruleForm.recipient_contact }],
        applies_to_types: ruleForm.applies_to_types,
        applies_to_priorities: ruleForm.applies_to_priorities,
        applies_to_regulators: ruleForm.applies_to_regulators,
        entity_id: ruleForm.entity_id || null,
        is_active: true
      });
      setShowAddRule(false);
    } catch {}
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.template_name) {
      toast.error('Template Name is required');
      return;
    }

    try {
      await addTemplate({
        template_name: templateForm.template_name,
        description: templateForm.description || null,
        event_type: templateForm.event_type,
        regulator: templateForm.regulator,
        recurrence: templateForm.recurrence,
        day_of_month: templateForm.day_of_month ? Number(templateForm.day_of_month) : null,
        month_of_year: templateForm.month_of_year ? Number(templateForm.month_of_year) : null,
        default_priority: templateForm.default_priority,
        default_sla_hours: templateForm.default_sla_hours ? Number(templateForm.default_sla_hours) : null,
        penalty_per_day_paise: templateForm.penalty_per_day ? Number(templateForm.penalty_per_day) * 100 : 0,
        max_penalty_paise: templateForm.max_penalty ? Number(templateForm.max_penalty) * 100 : 0,
        penalty_section: templateForm.penalty_section || null,
        color_tag: templateForm.color_tag,
        auto_remind_days: templateForm.auto_remind_days.split(',').map(Number),
        is_active: true
      });
      setShowAddTemplate(false);
    } catch {}
  };

  const handleCompleteDeadline = async () => {
    if (!completeTarget) return;
    try {
      await completeEvent(completeTarget.id, completeNotes);
      setCompleteTarget(null);
      setCompleteNotes('');
      refetchSummary();
    } catch {}
  };

  const handleExtendDeadline = async () => {
    if (!extendTarget || !newDueDate) {
      toast.error('Please specify the new due date');
      return;
    }
    try {
      await extendEvent(extendTarget.id, newDueDate, extendReason);
      setExtendTarget(null);
      setNewDueDate('');
      setExtendReason('');
      refetchSummary();
    } catch {}
  };

  const handleBulkGenerate = async () => {
    if (!generateTarget) return;
    try {
      await generateEvents(generateTarget, genEntityIds, Number(genMonths) || 3);
      setGenerateTarget(null);
      setGenEntityIds([]);
      setGenMonths('3');
      refetchEvents();
      refetchSummary();
    } catch {}
  };

  // Nav helpers
  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const activeDeadlines = useMemo(() => {
    return events.filter(e => e.status !== 'completed' && e.status !== 'cancelled');
  }, [events]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[1400px] mb-12 text-foreground"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-pink-500 animate-pulse" />
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-400 bg-clip-text text-transparent">
              Global Compliance Calendar
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Production-grade live statutory tracking with SLA timers, alert rules, and recurrence automation.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleRefreshAll} className="border-border/50 bg-card/40 hover:bg-card/70">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={seedPresets}
            disabled={isSeeding}
            className="border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10"
          >
            {isSeeding ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Seed Indian Presets
          </Button>

          <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
            <DialogTrigger asChild>
              <Button className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/20">
                <Plus className="w-4 h-4 mr-2" />
                New Deadline
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border/50 max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-pink-400 flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Add Custom Deadline
                </DialogTitle>
                <CardDescription>Create a new single or recurring compliance requirement.</CardDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Deadline Title *</Label>
                  <Input
                    required
                    value={eventForm.title}
                    onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. GSTR-3B Filing July 2026"
                    className="mt-1 bg-card/50 border-border/50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Entity (Optional)</Label>
                    <Select
                      value={eventForm.entity_id}
                      onValueChange={v => setEventForm(f => ({ ...f, entity_id: v }))}
                    >
                      <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                        <SelectValue placeholder="General / Parent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">General / No Entity</SelectItem>
                        {entities.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.entity_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Event Type *</Label>
                    <Select
                      value={eventForm.event_type}
                      onValueChange={v => setEventForm(f => ({ ...f, event_type: v as CalendarEventType }))}
                    >
                      <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EVENT_TYPE_META).map(([type, m]) => (
                          <SelectItem key={type} value={type}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Regulator *</Label>
                    <Select
                      value={eventForm.regulator}
                      onValueChange={v => setEventForm(f => ({ ...f, regulator: v }))}
                    >
                      <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['CBIC','CBDT','MCA','RBI','SEBI','EPFO','ESIC','ROC','Other'].map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Priority *</Label>
                    <Select
                      value={eventForm.priority}
                      onValueChange={v => setEventForm(f => ({ ...f, priority: v as DeadlinePriority }))}
                    >
                      <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_META).map(([p, m]) => (
                          <SelectItem key={p} value={p}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Due Date *</Label>
                    <Input
                      required
                      type="date"
                      value={eventForm.due_date}
                      onChange={e => setEventForm(f => ({ ...f, due_date: e.target.value }))}
                      className="mt-1 bg-card/50 border-border/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">SLA (Hours to complete)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 72"
                      value={eventForm.sla_hours}
                      onChange={e => setEventForm(f => ({ ...f, sla_hours: e.target.value }))}
                      className="mt-1 bg-card/50 border-border/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <Label className="text-xs text-muted-foreground">Late Fee (₹/day)</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={eventForm.penalty_per_day}
                      onChange={e => setEventForm(f => ({ ...f, penalty_per_day: e.target.value }))}
                      className="mt-1 bg-card/50 border-border/50"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs text-muted-foreground">Max Fine (₹)</Label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={eventForm.max_penalty}
                      onChange={e => setEventForm(f => ({ ...f, max_penalty: e.target.value }))}
                      className="mt-1 bg-card/50 border-border/50"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs text-muted-foreground">Fine Act/Section</Label>
                    <Input
                      placeholder="Sec 234F"
                      value={eventForm.penalty_section}
                      onChange={e => setEventForm(f => ({ ...f, penalty_section: e.target.value }))}
                      className="mt-1 bg-card/50 border-border/50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2 border-y border-border/20">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={eventForm.is_recurring}
                    onChange={e => setEventForm(f => ({ ...f, is_recurring: e.target.checked }))}
                    className="w-4 h-4 accent-pink-500 rounded bg-card/50 border-border/50"
                  />
                  <Label htmlFor="is_recurring" className="text-xs text-foreground cursor-pointer">
                    Enable Recurring Schedule
                  </Label>

                  {eventForm.is_recurring && (
                    <Select
                      value={eventForm.recurrence_pattern}
                      onValueChange={v => setEventForm(f => ({ ...f, recurrence_pattern: v as RecurrencePattern }))}
                    >
                      <SelectTrigger className="w-32 ml-auto bg-card/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['daily','weekly','biweekly','monthly','quarterly','yearly'].map(pat => (
                          <SelectItem key={pat} value={pat}>{pat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Detailed Description & Notes</Label>
                  <Textarea
                    placeholder="Provide compliance filing guidelines or specific client requirements..."
                    value={eventForm.description}
                    onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                    className="mt-1 bg-card/50 border-border/50 h-20"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white w-full">
                    Schedule Deadline
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Calendar Items', value: dashboardSummary?.total_events ?? events.length, color: 'indigo', icon: Calendar, sub: 'Filing & meetings' },
          { label: 'Upcoming (Next 30d)', value: dashboardSummary?.due_this_month ?? activeDeadlines.length, color: 'blue', icon: Clock, sub: 'Filing pipeline' },
          { label: 'Due Today', value: dashboardSummary?.due_today_count ?? 0, color: 'rose', icon: AlertTriangle, sub: 'Action required' },
          { label: 'Overdue Deadlines', value: dashboardSummary?.overdue_count ?? 0, color: 'red', icon: ShieldAlert, sub: 'Accruing penalty' },
          { label: 'Active SLA Breaches', value: dashboardSummary?.sla_breached_count ?? 0, color: 'pink', icon: Activity, sub: 'Escalations fired' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border bg-${card.color}-500/5 border-${card.color}-500/20`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{card.label}</span>
                <Icon className={`w-4 h-4 text-${card.color}-400`} />
              </div>
              <p className={`text-2xl font-bold text-${card.color}-400 font-mono`}>
                {loadingSummary ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  card.value
                )}
              </p>
              <span className="text-[10px] text-muted-foreground">{card.sub}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Sub Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-card/40 border border-border/50 p-1 rounded-xl">
          <TabsTrigger value="calendar" className="rounded-lg gap-2 text-xs">
            <CalendarDays className="w-4 h-4" /> Calendar View
          </TabsTrigger>
          <TabsTrigger value="register" className="rounded-lg gap-2 text-xs">
            <FileText className="w-4 h-4" /> Deadline Register
          </TabsTrigger>
          <TabsTrigger value="rules" className="rounded-lg gap-2 text-xs">
            <Network className="w-4 h-4" /> Escalations & SLAs
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg gap-2 text-xs">
            <Settings className="w-4 h-4" /> Recurring Templates
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Calendar View ───────────────────────────────────────── */}
        <TabsContent value="calendar" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Calendar Grid card */}
            <Card className="lg:col-span-3 border-border/50 bg-card/20 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-border/30">
                <CardTitle className="text-md flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-pink-400" />
                  <span>{MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 border-border/50 bg-card/40">Prev</Button>
                  <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 border-border/50 bg-card/40">Next</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                
                {/* 7 columns grid */}
                <div className="grid grid-cols-7 text-center font-semibold text-xs text-muted-foreground mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-2">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {/* Empty Offset cells */}
                  {Array.from({ length: monthOffset }).map((_, i) => (
                    <div key={`offset-${i}`} className="min-h-[85px] rounded-lg bg-card/5 border border-transparent opacity-30" />
                  ))}

                  {/* Days of month */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = selectedDay === day;
                    const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                    
                    const dayEvents = monthlyEventMap[day] || [];
                    const criticalEvents = dayEvents.filter(e => e.priority === 'critical' && e.status !== 'completed');
                    const overdueEvents = dayEvents.filter(e => e.status === 'overdue');

                    return (
                      <div
                        key={`day-${day}`}
                        onClick={() => setSelectedDay(day)}
                        className={`min-h-[85px] p-2 rounded-lg border cursor-pointer flex flex-col justify-between transition-all ${
                          isSelected 
                            ? 'border-pink-500 bg-pink-500/5 shadow-md shadow-pink-500/5' 
                            : 'border-border/30 bg-card/10 hover:bg-card/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-full ${
                            isToday ? 'bg-pink-500 text-white' : 'text-foreground'
                          }`}>
                            {day}
                          </span>

                          <div className="flex gap-1">
                            {overdueEvents.length > 0 && (
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            )}
                            {criticalEvents.length > 0 && overdueEvents.length === 0 && (
                              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            )}
                          </div>
                        </div>

                        {/* Tiny indicators of first 2 events */}
                        <div className="space-y-1 mt-2">
                          {dayEvents.slice(0, 2).map((e, idx) => {
                            const meta = EVENT_TYPE_META[e.event_type] || EVENT_TYPE_META.custom;
                            return (
                              <div
                                key={e.id}
                                className={`text-[9px] px-1.5 py-0.5 rounded truncate border ${
                                  e.status === 'completed' 
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20 line-through' 
                                    : `${meta.color} ${meta.border}`
                                }`}
                              >
                                {e.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[8px] text-muted-foreground text-center font-medium">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected day panel card */}
            <Card className="border-border/50 bg-card/20 backdrop-blur-md flex flex-col">
              <CardHeader className="py-4 border-b border-border/30">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-400" />
                  <span>Day View: {selectedDay ? `${selectedDay} ${MONTH_NAMES[currentDate.getMonth()]}` : 'Select Date'}</span>
                </CardTitle>
                <CardDescription>Compliance timeline scheduled for selected date.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
                {selectedDay === null ? (
                  <div className="text-center py-12 text-xs text-muted-foreground">
                    Click any day in the monthly calendar to display its schedule list.
                  </div>
                ) : selectedDayEvents.length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted-foreground border border-dashed border-border/20 rounded-lg">
                    <Calendar className="w-6 h-6 mx-auto mb-2 opacity-25" />
                    No deadlines scheduled.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayEvents.map(e => {
                      const meta = EVENT_TYPE_META[e.event_type] || EVENT_TYPE_META.custom;
                      const stat = STATUS_META[e.status] || STATUS_META.upcoming;
                      const prio = PRIORITY_META[e.priority] || PRIORITY_META.medium;
                      return (
                        <div
                          key={e.id}
                          className="p-3 rounded-lg border border-border/30 bg-card/30 space-y-2 hover:border-pink-500/40 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-xs leading-relaxed">{e.title}</h4>
                            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${stat.color}`}>
                              {stat.label}
                            </Badge>
                          </div>
                          
                          {e.entity_name && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                              <Building2 className="w-3 h-3 text-indigo-400" />
                              {e.entity_name}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] pt-1">
                            <Badge variant="outline" className={`text-[8px] ${prio.color}`}>{prio.label}</Badge>
                            <span className="text-muted-foreground">{e.regulator}</span>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-border/20">
                            {e.status !== 'completed' && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-6 text-[10px] bg-green-600 hover:bg-green-700 text-white flex-1"
                                  onClick={() => setCompleteTarget(e)}
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] border-border/50 bg-card/20 hover:bg-card/50 flex-1"
                                  onClick={() => {
                                    setExtendTarget(e);
                                    setNewDueDate(e.due_date);
                                  }}
                                >
                                  Extend
                                </Button>
                              </>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-red-400 hover:bg-red-500/10"
                              onClick={() => removeEvent(e.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 2: Deadline Register ───────────────────────────────────── */}
        <TabsContent value="register" className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search deadlines..."
                value={filters.regulator || ''}
                onChange={e => setFilters(f => ({ ...f, regulator: e.target.value || undefined }))}
                className="pl-9 bg-card/40 border-border/50"
              />
            </div>
            
            <Select
              value={filters.priority?.[0] || 'all'}
              onValueChange={v => setFilters(f => ({ ...f, priority: v === 'all' ? undefined : [v as DeadlinePriority] }))}
            >
              <SelectTrigger className="w-36 bg-card/40 border-border/50">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {Object.entries(PRIORITY_META).map(([v, m]) => (
                  <SelectItem key={v} value={v}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status?.[0] || 'all'}
              onValueChange={v => setFilters(f => ({ ...f, status: v === 'all' ? undefined : [v as DeadlineStatus] }))}
            >
              <SelectTrigger className="w-36 bg-card/40 border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_META).map(([v, m]) => (
                  <SelectItem key={v} value={v}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.entityId || 'all'}
              onValueChange={v => setFilters(f => ({ ...f, entityId: v === 'all' ? undefined : v }))}
            >
              <SelectTrigger className="w-48 bg-card/40 border-border/50">
                <SelectValue placeholder="Client Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.entity_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingEvents ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/30 rounded-xl text-muted-foreground bg-card/10">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-25 text-pink-400" />
              <p className="font-semibold text-sm">No scheduled compliance items</p>
              <p className="text-xs mt-1">Add custom deadlines or generate events from recurring templates.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 overflow-hidden bg-card/10">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card/50 border-border/40">
                    <TableHead className="text-muted-foreground">Deadline Task</TableHead>
                    <TableHead className="text-muted-foreground">Entity</TableHead>
                    <TableHead className="text-muted-foreground">Filing Type</TableHead>
                    <TableHead className="text-muted-foreground">Due Date</TableHead>
                    <TableHead className="text-muted-foreground text-center">Priority</TableHead>
                    <TableHead className="text-muted-foreground text-center">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(e => {
                    const meta = EVENT_TYPE_META[e.event_type] || EVENT_TYPE_META.custom;
                    const stat = STATUS_META[e.status] || STATUS_META.upcoming;
                    const prio = PRIORITY_META[e.priority] || PRIORITY_META.medium;
                    return (
                      <TableRow key={e.id} className="border-border/20 hover:bg-card/20">
                        <TableCell className="py-3">
                          <p className="font-semibold text-sm">{e.title}</p>
                          {e.description && <p className="text-xs text-muted-foreground truncate max-w-md">{e.description}</p>}
                        </TableCell>
                        <TableCell className="py-3">
                          {e.entity_name ? (
                            <p className="text-xs font-semibold flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                              {e.entity_name}
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`text-xs ${meta.color} ${meta.border}`}>
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 font-mono text-sm">
                          {new Date(e.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge variant="outline" className={`text-xs ${prio.color}`}>{prio.label}</Badge>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge variant="outline" className={`text-xs ${stat.color}`}>{stat.label}</Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {e.status !== 'completed' && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => setCompleteTarget(e)}
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-border/50 bg-card/20 hover:bg-card/50"
                                  onClick={() => {
                                    setExtendTarget(e);
                                    setNewDueDate(e.due_date);
                                  }}
                                >
                                  Extend
                                </Button>
                              </>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-400 hover:bg-red-500/10"
                              onClick={() => removeEvent(e.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 3: Escalation Rules & SLAs ─────────────────────────────── */}
        <TabsContent value="rules" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Rules list card */}
            <Card className="lg:col-span-2 border-border/50 bg-card/20 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/30">
                <div>
                  <CardTitle className="text-md flex items-center gap-2">
                    <Network className="w-5 h-5 text-purple-400" />
                    <span>Escalation Rules Directory</span>
                  </CardTitle>
                  <CardDescription>Setup alert chains to notify managers or clients via SMS/WhatsApp/Email before or after due date.</CardDescription>
                </div>

                <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-2" /> Add Rule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background border-border/50 max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-purple-400 flex items-center gap-2">
                        <Network className="w-5 h-5" /> Create Escalation Rule
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateRule} className="space-y-4 pt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Rule Name *</Label>
                        <Input
                          required
                          value={ruleForm.rule_name}
                          onChange={e => setRuleForm(f => ({ ...f, rule_name: e.target.value }))}
                          placeholder="e.g. GST Overdue Alert to Senior Partner"
                          className="mt-1 bg-card/50 border-border/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Trigger Type *</Label>
                          <Select
                            value={ruleForm.trigger_type}
                            onValueChange={v => setRuleForm(f => ({ ...f, trigger_type: v }))}
                          >
                            <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="days_before_due">Days Before Due Date</SelectItem>
                              <SelectItem value="days_after_due">Days After Due Date</SelectItem>
                              <SelectItem value="sla_breach">Upon SLA Breach</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Trigger Threshold Value</Label>
                          <Input
                            type="number"
                            value={ruleForm.trigger_value}
                            onChange={e => setRuleForm(f => ({ ...f, trigger_value: e.target.value }))}
                            placeholder="e.g. 3 (days)"
                            className="mt-1 bg-card/50 border-border/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Delivery Channel *</Label>
                          <Select
                            value={ruleForm.channel}
                            onValueChange={v => setRuleForm(f => ({ ...f, channel: v as EscalationChannel }))}
                          >
                            <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email Notification</SelectItem>
                              <SelectItem value="sms">SMS Text Alert</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp Message</SelectItem>
                              <SelectItem value="slack">Slack Channel webhook</SelectItem>
                              <SelectItem value="all">All Channels</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Entity scope (Optional)</Label>
                          <Select
                            value={ruleForm.entity_id}
                            onValueChange={v => setRuleForm(f => ({ ...f, entity_id: v }))}
                          >
                            <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                              <SelectValue placeholder="All Entities" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">All Entities</SelectItem>
                              {entities.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.entity_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Recipient Name *</Label>
                          <Input
                            required
                            value={ruleForm.recipient_name}
                            onChange={e => setRuleForm(f => ({ ...f, recipient_name: e.target.value }))}
                            placeholder="e.g. Suresh Kumar"
                            className="mt-1 bg-card/50 border-border/50"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Recipient Contact (Email/Phone) *</Label>
                          <Input
                            required
                            value={ruleForm.recipient_contact}
                            onChange={e => setRuleForm(f => ({ ...f, recipient_contact: e.target.value }))}
                            placeholder="suresh@firm.com or +9199..."
                            className="mt-1 bg-card/50 border-border/50"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Description / Notes</Label>
                        <Textarea
                          value={ruleForm.description}
                          onChange={e => setRuleForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Provide details about the escalation path or policy rules..."
                          className="mt-1 bg-card/50 border-border/50 h-16"
                        />
                      </div>

                      <DialogFooter className="pt-2">
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                          Create Escalation Rule
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-6">
                {loadingRules ? (
                  <div className="flex justify-center py-10">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                ) : rules.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border/20 rounded-xl">
                    <Network className="w-10 h-10 mx-auto mb-2 opacity-25 text-purple-400" />
                    No escalation rules setup yet. Add one to automate notifications.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rules.map(r => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-card/30"
                      >
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm">{r.rule_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Trigger: <span className="text-purple-300 font-semibold">{r.trigger_type.replace(/_/g, ' ')} ({r.trigger_value})</span>
                            {' • '} Channel: <span className="text-indigo-300 font-medium font-mono">{r.channel}</span>
                          </p>
                          {r.recipients?.[0] && (
                            <p className="text-[10px] text-muted-foreground">
                              Recipient: <span className="text-foreground">{r.recipients[0].name} ({r.recipients[0].contact})</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleRule(r.id, !r.is_active)}
                            className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                              r.is_active ? 'bg-purple-600' : 'bg-gray-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                              r.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-red-400 hover:bg-red-500/10"
                            onClick={() => removeRule(r.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SLA Timers card */}
            <Card className="border-border/50 bg-card/20 backdrop-blur-md flex flex-col">
              <CardHeader className="py-4 border-b border-border/30">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Real-time SLA Monitor</span>
                </CardTitle>
                <CardDescription>Timers track time spent before filing deadlines breach.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
                {loadingTimers ? (
                  <div className="flex justify-center py-10">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  </div>
                ) : timers.length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted-foreground border border-dashed border-border/20 rounded-lg">
                    No SLA timers currently running.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timers.map(t => {
                      const total = t.total_hours || 24;
                      const elapsed = Number(t.elapsed_hours) || 0;
                      const progress = Math.min(100, Math.round((elapsed / total) * 100));
                      const remaining = Math.max(0, Number((total - elapsed).toFixed(1)));
                      
                      return (
                        <div
                          key={t.id}
                          className="p-3 rounded-lg border border-border/30 bg-card/30 space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-semibold text-xs leading-none">{t.sla_name}</h5>
                              <span className="text-[9px] text-muted-foreground mt-1 block">Limit: {total} hrs</span>
                            </div>
                            
                            <Badge
                              variant="outline"
                              className={`text-[8px] ${
                                t.is_breached 
                                  ? 'border-red-500/30 text-red-400 bg-red-500/5' 
                                  : t.is_running 
                                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' 
                                    : 'border-gray-500/30 text-gray-400'
                              }`}
                            >
                              {t.is_breached ? 'Breached' : t.is_running ? 'Active' : 'Completed'}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-muted-foreground">
                              <span>Elapsed: {elapsed.toFixed(1)}h</span>
                              <span className={remaining <= 5 && t.is_running ? 'text-red-400 animate-pulse font-bold' : ''}>
                                {t.is_running ? `${remaining}h remaining` : 'Complete'}
                              </span>
                            </div>
                            <Progress value={progress} className={`h-1.5 ${t.is_breached ? 'bg-red-950' : 'bg-emerald-950'}`} />
                          </div>

                          <div className="flex justify-end gap-1 pt-1.5 border-t border-border/10">
                            {t.is_running ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-yellow-400 hover:bg-yellow-500/10"
                                onClick={() => pauseTimer(t.id)}
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </Button>
                            ) : !t.completed_at ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => resumeTimer(t.id)}
                              >
                                <Play className="w-3.5 h-3.5" />
                              </Button>
                            ) : null}
                            
                            {!t.completed_at && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-green-400 hover:bg-green-500/10"
                                onClick={() => completeTimer(t.id)}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alert trigger logs */}
          <Card className="border-border/50 bg-card/20 backdrop-blur-md">
            <CardHeader className="py-4 border-b border-border/30">
              <CardTitle className="text-sm flex items-center gap-2">
                <BellRing className="w-4 h-4 text-indigo-400" />
                <span>Triggered Alerts Logs</span>
              </CardTitle>
              <CardDescription>Immutable log audits of notifications sent out to client entities.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loadingLogs ? (
                <div className="flex justify-center py-6">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No automated alerts logs recorded.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-3">
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-border/20 bg-card/10 text-xs flex justify-between items-start gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{log.subject}</span>
                          <Badge variant="outline" className="text-[8px] uppercase">{log.channel}</Badge>
                        </div>
                        <p className="text-muted-foreground">{log.message_body}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Reason: <span className="text-purple-300 font-medium">{log.trigger_reason}</span>
                          {log.recipients?.[0] && ` • Sent to: ${log.recipients[0].name} (${log.recipients[0].contact})`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${
                            log.delivery_status === 'success' || log.delivery_status === 'sent'
                              ? 'border-green-500/20 text-green-400 bg-green-500/5'
                              : 'border-red-500/20 text-red-400 bg-red-500/5'
                          }`}
                        >
                          {log.delivery_status}
                        </Badge>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {new Date(log.created_at).toLocaleTimeString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: Recurring Templates ─────────────────────────────────── */}
        <TabsContent value="templates" className="mt-6 space-y-6">
          <Card className="border-border/50 bg-card/20 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/30">
              <div>
                <CardTitle className="text-md flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  <span>Statutory Recurrence Rules</span>
                </CardTitle>
                <CardDescription>Setup patterns like GST filing on 11th every month to auto-generate deadlines.</CardDescription>
              </div>

              <Dialog open={showAddTemplate} onOpenChange={setShowAddTemplate}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Rule Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-border/50 max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-indigo-400 flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Create Recurring Template
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTemplate} className="space-y-4 pt-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Template / Rule Name *</Label>
                      <Input
                        required
                        value={templateForm.template_name}
                        onChange={e => setTemplateForm(f => ({ ...f, template_name: e.target.value }))}
                        placeholder="e.g. GSTR-1 Outward Supply Return"
                        className="mt-1 bg-card/50 border-border/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Event Type *</Label>
                        <Select
                          value={templateForm.event_type}
                          onValueChange={v => setTemplateForm(f => ({ ...f, event_type: v as CalendarEventType }))}
                        >
                          <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(EVENT_TYPE_META).map(([type, m]) => (
                              <SelectItem key={type} value={type}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Regulator *</Label>
                        <Select
                          value={templateForm.regulator}
                          onValueChange={v => setTemplateForm(f => ({ ...f, regulator: v }))}
                        >
                          <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['CBIC','CBDT','MCA','RBI','SEBI','EPFO','ESIC','ROC','Other'].map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Recurrence Pattern *</Label>
                        <Select
                          value={templateForm.recurrence}
                          onValueChange={v => setTemplateForm(f => ({ ...f, recurrence: v as RecurrencePattern }))}
                        >
                          <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['daily','weekly','biweekly','monthly','quarterly','half_yearly','yearly'].map(pat => (
                              <SelectItem key={pat} value={pat}>{pat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Day of Month (1-31)</Label>
                        <Input
                          type="number"
                          value={templateForm.day_of_month}
                          onChange={e => setTemplateForm(f => ({ ...f, day_of_month: e.target.value }))}
                          placeholder="11"
                          className="mt-1 bg-card/50 border-border/50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Month of Year (1-12)</Label>
                        <Input
                          type="number"
                          value={templateForm.month_of_year}
                          onChange={e => setTemplateForm(f => ({ ...f, month_of_year: e.target.value }))}
                          placeholder="e.g. 3 (March)"
                          className="mt-1 bg-card/50 border-border/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Default Priority *</Label>
                        <Select
                          value={templateForm.default_priority}
                          onValueChange={v => setTemplateForm(f => ({ ...f, default_priority: v as DeadlinePriority }))}
                        >
                          <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PRIORITY_META).map(([p, m]) => (
                              <SelectItem key={p} value={p}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Default SLA (hours)</Label>
                        <Input
                          type="number"
                          value={templateForm.default_sla_hours}
                          onChange={e => setTemplateForm(f => ({ ...f, default_sla_hours: e.target.value }))}
                          placeholder="72"
                          className="mt-1 bg-card/50 border-border/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Late Fee (₹/day)</Label>
                        <Input
                          type="number"
                          value={templateForm.penalty_per_day}
                          onChange={e => setTemplateForm(f => ({ ...f, penalty_per_day: e.target.value }))}
                          placeholder="50"
                          className="mt-1 bg-card/50 border-border/50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Max Fine (₹)</Label>
                        <Input
                          type="number"
                          value={templateForm.max_penalty}
                          onChange={e => setTemplateForm(f => ({ ...f, max_penalty: e.target.value }))}
                          placeholder="10000"
                          className="mt-1 bg-card/50 border-border/50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Fine Act Section</Label>
                        <Input
                          value={templateForm.penalty_section}
                          onChange={e => setTemplateForm(f => ({ ...f, penalty_section: e.target.value }))}
                          placeholder="e.g. Sec 47"
                          className="mt-1 bg-card/50 border-border/50"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Textarea
                        value={templateForm.description}
                        onChange={e => setTemplateForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Provide details about compliance filing conditions..."
                        className="mt-1 bg-card/50 border-border/50 h-16"
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                        Create Recurrence Rule Template
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-6">
              {loadingTemplates ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border/20 rounded-xl">
                  <Settings className="w-12 h-12 mx-auto mb-2 opacity-25 text-indigo-400" />
                  No recurring templates defined yet. Seed Indian Presets above to get started quickly.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(t => {
                    const meta = EVENT_TYPE_META[t.event_type] || EVENT_TYPE_META.custom;
                    return (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl border border-border/30 bg-card/30 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-sm leading-snug">{t.template_name}</h4>
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${meta.color} ${meta.border}`}>
                              {meta.label}
                            </Badge>
                          </div>
                          {t.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground pt-1">
                            <span className="font-semibold text-indigo-400 uppercase">Recur: {t.recurrence}</span>
                            {t.day_of_month && <span> • Day: {t.day_of_month}th</span>}
                            <span> • Regulator: {t.regulator}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-border/20">
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 text-xs"
                            onClick={() => {
                              setGenerateTarget(t);
                              setGenMonths('3');
                              setGenEntityIds([]);
                            }}
                          >
                            Generate Events
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-red-400 hover:bg-red-500/10"
                            onClick={() => removeTemplate(t.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── DIALOGS ──────────────────────────────────────────────────────── */}

      {/* Complete Deadline Dialog */}
      <Dialog open={!!completeTarget} onOpenChange={o => !o && setCompleteTarget(null)}>
        <DialogContent className="bg-background border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Complete Compliance Task
            </DialogTitle>
          </DialogHeader>
          {completeTarget && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-sm">
                <p className="font-medium text-foreground">{completeTarget.title}</p>
                <p className="text-xs text-muted-foreground mt-1">Due Date: {new Date(completeTarget.due_date).toLocaleDateString('en-IN')}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Completion Resolution Notes *</Label>
                <Textarea
                  required
                  placeholder="e.g. Filed successfully, receipt ARN reference number GSTN281903..."
                  value={completeNotes}
                  onChange={e => setCompleteNotes(e.target.value)}
                  className="mt-1 bg-card/50 border-border/50 h-24"
                />
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleCompleteDeadline}>
                  Record Complete
                </Button>
                <Button variant="outline" onClick={() => setCompleteTarget(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Extend Deadline Dialog */}
      <Dialog open={!!extendTarget} onOpenChange={o => !o && setExtendTarget(null)}>
        <DialogContent className="bg-background border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-indigo-400 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Extend Compliance Deadline
            </DialogTitle>
          </DialogHeader>
          {extendTarget && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-sm">
                <p className="font-medium text-foreground">{extendTarget.title}</p>
                <p className="text-xs text-muted-foreground mt-1">Current Due: {new Date(extendTarget.due_date).toLocaleDateString('en-IN')}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">New Extended Due Date *</Label>
                <Input
                  required
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="mt-1 bg-card/50 border-border/50"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Extension Reason / Announcement Link</Label>
                <Textarea
                  placeholder="e.g. CBIC Notification No. 12/2026 extends due date due to portal issues..."
                  value={extendReason}
                  onChange={e => setExtendReason(e.target.value)}
                  className="mt-1 bg-card/50 border-border/50 h-20"
                />
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleExtendDeadline}>
                  Save Extension
                </Button>
                <Button variant="outline" onClick={() => setExtendTarget(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Events from Template Dialog */}
      <Dialog open={!!generateTarget} onOpenChange={o => !o && setGenerateTarget(null)}>
        <DialogContent className="bg-background border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-indigo-400 flex items-center gap-2">
              <Settings className="w-5 h-5" /> Generate Calendar Deadlines
            </DialogTitle>
            <CardDescription>Bulk generate actual task deadlines from this recurring rule.</CardDescription>
          </DialogHeader>
          {generateTarget && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-sm">
                <p className="font-medium text-foreground">{generateTarget.template_name}</p>
                <p className="text-xs text-muted-foreground mt-1">Recurrence: {generateTarget.recurrence} on day {generateTarget.day_of_month}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Select Client Entities *</Label>
                <div className="mt-2 border border-border/30 rounded-lg p-3 bg-card/30 max-h-[150px] overflow-y-auto space-y-2">
                  {entities.map(e => (
                    <div key={e.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        id={`gen-ent-${e.id}`}
                        checked={genEntityIds.includes(e.id)}
                        onChange={el => {
                          if (el.target.checked) {
                            setGenEntityIds(prev => [...prev, e.id]);
                          } else {
                            setGenEntityIds(prev => prev.filter(id => id !== e.id));
                          }
                        }}
                        className="accent-indigo-500 rounded bg-card/50 border-border/50 cursor-pointer"
                      />
                      <label htmlFor={`gen-ent-${e.id}`} className="cursor-pointer font-medium">{e.entity_name}</label>
                    </div>
                  ))}
                  {entities.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">No entities found. Create an entity first.</div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Months Ahead to generate *</Label>
                <Select value={genMonths} onValueChange={setGenMonths}>
                  <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month Ahead</SelectItem>
                    <SelectItem value="3">3 Months Ahead</SelectItem>
                    <SelectItem value="6">6 Months Ahead</SelectItem>
                    <SelectItem value="12">12 Months Ahead</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleBulkGenerate}>
                  Generate Deadlines
                </Button>
                <Button variant="outline" onClick={() => setGenerateTarget(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
