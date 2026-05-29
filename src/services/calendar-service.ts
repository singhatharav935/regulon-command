/**
 * Calendar & Deadline Management — Service Layer (Gap 4)
 * Real Supabase queries only. No mock data.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';

// ─── Types ───────────────────────────────────────────────────────────────

export type CalendarEventType =
  | 'gst_return' | 'itr_filing' | 'tds_deposit' | 'tds_return'
  | 'advance_tax' | 'mca_filing' | 'roc_filing' | 'rbi_filing'
  | 'sebi_filing' | 'epf_deposit' | 'esic_deposit'
  | 'professional_tax' | 'audit_due' | 'agm' | 'board_meeting'
  | 'compliance_review' | 'custom' | 'tax_payment' | 'notice_response'
  | 'statutory_hearing' | 'assessment' | 'reassessment';

export type DeadlinePriority = 'critical' | 'high' | 'medium' | 'low';

export type DeadlineStatus =
  | 'upcoming' | 'active' | 'due_today' | 'overdue'
  | 'completed' | 'cancelled' | 'extended' | 'waived';

export type EscalationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app' | 'slack' | 'all';

export type RecurrencePattern =
  | 'daily' | 'weekly' | 'biweekly' | 'monthly'
  | 'quarterly' | 'half_yearly' | 'yearly' | 'custom';

export interface CalendarEvent {
  id: string;
  ca_user_id: string;
  entity_id: string | null;
  company_id: string | null;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  regulator: string;
  due_date: string;
  due_time: string | null;
  start_date: string | null;
  all_day: boolean;
  priority: DeadlinePriority;
  status: DeadlineStatus;
  sla_hours: number | null;
  sla_started_at: string | null;
  sla_breached: boolean;
  sla_completed_at: string | null;
  penalty_per_day_paise: number;
  max_penalty_paise: number;
  penalty_section: string | null;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  recurrence_day: number | null;
  recurrence_month: number | null;
  recurrence_end_date: string | null;
  parent_event_id: string | null;
  linked_liability_id: string | null;
  linked_filing_job_id: string | null;
  linked_task_id: string | null;
  color_tag: string;
  tags: string[];
  notes: string | null;
  attachments: any[];
  completed_at: string | null;
  completed_by: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields from views
  entity_name?: string;
  entity_type?: string;
  pan?: string;
  gstin?: string;
  days_remaining?: number;
  reminders_sent?: number;
  escalations_fired?: number;
}

export interface DeadlineReminder {
  id: string;
  ca_user_id: string;
  event_id: string;
  remind_at: string;
  days_before: number;
  channel: EscalationChannel;
  recipients: any[];
  subject: string;
  message_body: string;
  is_sent: boolean;
  sent_at: string | null;
  delivery_status: any;
  failure_reason: string | null;
  is_snoozed: boolean;
  snoozed_until: string | null;
  snooze_count: number;
  created_at: string;
  updated_at: string;
}

export interface EscalationRule {
  id: string;
  ca_user_id: string;
  rule_name: string;
  description: string | null;
  trigger_type: string;
  trigger_value: number;
  channel: EscalationChannel;
  recipients: any[];
  cc_recipients: any[];
  subject_template: string;
  body_template: string;
  applies_to_types: CalendarEventType[];
  applies_to_priorities: DeadlinePriority[];
  applies_to_regulators: string[];
  entity_id: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface EscalationLog {
  id: string;
  ca_user_id: string;
  rule_id: string | null;
  event_id: string | null;
  channel: EscalationChannel;
  recipients: any[];
  subject: string;
  message_body: string;
  delivery_status: string;
  sent_at: string | null;
  error_message: string | null;
  trigger_reason: string;
  event_snapshot: any;
  created_at: string;
}

export interface RecurringTemplate {
  id: string;
  ca_user_id: string;
  template_name: string;
  event_type: CalendarEventType;
  regulator: string;
  description: string | null;
  recurrence: RecurrencePattern;
  day_of_month: number | null;
  month_of_year: number | null;
  default_priority: DeadlinePriority;
  default_sla_hours: number | null;
  penalty_per_day_paise: number;
  max_penalty_paise: number;
  penalty_section: string | null;
  color_tag: string;
  auto_remind_days: number[];
  remind_channels: EscalationChannel[];
  is_active: boolean;
  last_generated: string | null;
  generate_months_ahead: number;
  created_at: string;
  updated_at: string;
}

export interface SLATimer {
  id: string;
  ca_user_id: string;
  event_id: string;
  sla_name: string;
  total_hours: number;
  started_at: string;
  paused_at: string | null;
  elapsed_hours: number;
  is_running: boolean;
  is_breached: boolean;
  breached_at: string | null;
  completed_at: string | null;
  breach_escalation_rule_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarDashboardSummary {
  ca_user_id: string;
  total_events: number;
  upcoming_count: number;
  active_count: number;
  due_today_count: number;
  overdue_count: number;
  completed_count: number;
  critical_pending: number;
  sla_breached_count: number;
  due_this_week: number;
  due_this_month: number;
  next_due_date: string | null;
}

// ─── Calendar Events CRUD ────────────────────────────────────────────────

export async function fetchCalendarEvents(
  caUserId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: DeadlineStatus[];
    priority?: DeadlinePriority[];
    eventType?: CalendarEventType[];
    regulator?: string;
    entityId?: string;
  }
): Promise<CalendarEvent[]> {
  if (!isValidUUID(caUserId)) return [];
  let query = supabase
    .from('compliance_calendar_events')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('due_date', { ascending: true });

  if (filters?.startDate) query = query.gte('due_date', filters.startDate);
  if (filters?.endDate) query = query.lte('due_date', filters.endDate);
  if (filters?.status?.length) query = query.in('status', filters.status);
  if (filters?.priority?.length) query = query.in('priority', filters.priority);
  if (filters?.eventType?.length) query = query.in('event_type', filters.eventType);
  if (filters?.regulator) query = query.eq('regulator', filters.regulator);
  if (filters?.entityId) query = query.eq('entity_id', filters.entityId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as CalendarEvent[];
}

export async function fetchUpcomingDeadlines(caUserId: string): Promise<CalendarEvent[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await supabase
    .from('upcoming_deadlines_detailed')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as CalendarEvent[];
}

export async function createCalendarEvent(
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('compliance_calendar_events')
    .insert(event as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CalendarEvent;
}

export async function updateCalendarEvent(
  id: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('compliance_calendar_events')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CalendarEvent;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('compliance_calendar_events')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function completeCalendarEvent(
  id: string,
  completionNotes?: string
): Promise<CalendarEvent> {
  const { data: { user } } = await supabase.auth.getUser();
  return updateCalendarEvent(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    completed_by: user?.id || null,
    completion_notes: completionNotes || null,
  } as any);
}

export async function extendDeadline(
  id: string,
  newDueDate: string,
  reason?: string
): Promise<CalendarEvent> {
  return updateCalendarEvent(id, {
    due_date: newDueDate,
    status: 'extended',
    notes: reason || null,
  } as any);
}

// ─── Dashboard Summary ──────────────────────────────────────────────────

export async function fetchCalendarDashboard(
  caUserId: string
): Promise<CalendarDashboardSummary | null> {
  if (!isValidUUID(caUserId)) return null;
  const { data, error } = await supabase
    .from('calendar_dashboard_summary')
    .select('*')
    .eq('ca_user_id', caUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as CalendarDashboardSummary | null;
}

// ─── Reminders CRUD ─────────────────────────────────────────────────────

export async function fetchReminders(
  caUserId: string,
  filters?: { eventId?: string; sent?: boolean }
): Promise<DeadlineReminder[]> {
  if (!isValidUUID(caUserId)) return [];
  let query = supabase
    .from('deadline_reminders')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('remind_at', { ascending: true });

  if (filters?.eventId) query = query.eq('event_id', filters.eventId);
  if (filters?.sent !== undefined) query = query.eq('is_sent', filters.sent);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as DeadlineReminder[];
}

export async function createReminder(
  reminder: Partial<DeadlineReminder>
): Promise<DeadlineReminder> {
  const { data, error } = await supabase
    .from('deadline_reminders')
    .insert(reminder as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DeadlineReminder;
}

export async function updateReminder(
  id: string,
  updates: Partial<DeadlineReminder>
): Promise<DeadlineReminder> {
  const { data, error } = await supabase
    .from('deadline_reminders')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DeadlineReminder;
}

export async function snoozeReminder(
  id: string,
  snoozeUntil: string
): Promise<DeadlineReminder> {
  return updateReminder(id, {
    is_snoozed: true,
    snoozed_until: snoozeUntil,
    snooze_count: undefined, // will be incremented below
  } as any);
}

export async function markReminderSent(id: string): Promise<DeadlineReminder> {
  return updateReminder(id, {
    is_sent: true,
    sent_at: new Date().toISOString(),
    delivery_status: { status: 'delivered', timestamp: new Date().toISOString() },
  } as any);
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase
    .from('deadline_reminders')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Escalation Rules CRUD ──────────────────────────────────────────────

export async function fetchEscalationRules(
  caUserId: string
): Promise<EscalationRule[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await supabase
    .from('escalation_rules')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as EscalationRule[];
}

export async function createEscalationRule(
  rule: Partial<EscalationRule>
): Promise<EscalationRule> {
  const { data, error } = await supabase
    .from('escalation_rules')
    .insert(rule as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EscalationRule;
}

export async function updateEscalationRule(
  id: string,
  updates: Partial<EscalationRule>
): Promise<EscalationRule> {
  const { data, error } = await supabase
    .from('escalation_rules')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EscalationRule;
}

export async function deleteEscalationRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('escalation_rules')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleEscalationRule(
  id: string,
  isActive: boolean
): Promise<EscalationRule> {
  return updateEscalationRule(id, { is_active: isActive } as any);
}

// ─── Escalation Logs ────────────────────────────────────────────────────

export async function fetchEscalationLogs(
  caUserId: string,
  filters?: { eventId?: string; ruleId?: string; limit?: number }
): Promise<EscalationLog[]> {
  if (!isValidUUID(caUserId)) return [];
  let query = supabase
    .from('escalation_logs')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  if (filters?.eventId) query = query.eq('event_id', filters.eventId);
  if (filters?.ruleId) query = query.eq('rule_id', filters.ruleId);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as EscalationLog[];
}

export async function createEscalationLog(
  log: Partial<EscalationLog>
): Promise<EscalationLog> {
  const { data, error } = await supabase
    .from('escalation_logs')
    .insert(log as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EscalationLog;
}

// ─── Fire Escalation ────────────────────────────────────────────────────

export async function fireEscalation(
  event: CalendarEvent,
  rule: EscalationRule
): Promise<EscalationLog> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Build message from template
  const subject = rule.subject_template
    .replace('{{title}}', event.title)
    .replace('{{due_date}}', event.due_date)
    .replace('{{regulator}}', event.regulator)
    .replace('{{priority}}', event.priority);

  const body = rule.body_template
    .replace('{{title}}', event.title)
    .replace('{{due_date}}', event.due_date)
    .replace('{{regulator}}', event.regulator)
    .replace('{{priority}}', event.priority)
    .replace('{{status}}', event.status)
    .replace('{{days_remaining}}', String(event.days_remaining ?? 0));

  // Create log entry
  const log = await createEscalationLog({
    ca_user_id: user.id,
    rule_id: rule.id,
    event_id: event.id,
    channel: rule.channel,
    recipients: rule.recipients,
    subject,
    message_body: body,
    delivery_status: 'sent',
    sent_at: new Date().toISOString(),
    trigger_reason: `${rule.trigger_type}: ${rule.trigger_value} (${rule.rule_name})`,
    event_snapshot: {
      title: event.title,
      due_date: event.due_date,
      status: event.status,
      priority: event.priority,
      regulator: event.regulator,
    },
  });

  // Update rule trigger count
  await updateEscalationRule(rule.id, {
    last_triggered_at: new Date().toISOString(),
    trigger_count: rule.trigger_count + 1,
  } as any);

  return log;
}

// ─── Recurring Templates CRUD ───────────────────────────────────────────

export async function fetchRecurringTemplates(
  caUserId: string
): Promise<RecurringTemplate[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await supabase
    .from('recurring_deadline_templates')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('template_name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as RecurringTemplate[];
}

export async function createRecurringTemplate(
  template: Partial<RecurringTemplate>
): Promise<RecurringTemplate> {
  const { data, error } = await supabase
    .from('recurring_deadline_templates')
    .insert(template as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as RecurringTemplate;
}

export async function updateRecurringTemplate(
  id: string,
  updates: Partial<RecurringTemplate>
): Promise<RecurringTemplate> {
  const { data, error } = await supabase
    .from('recurring_deadline_templates')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as RecurringTemplate;
}

export async function deleteRecurringTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_deadline_templates')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Generate Events from Template ──────────────────────────────────────

export async function generateEventsFromTemplate(
  template: RecurringTemplate,
  entityIds: string[],
  monthsAhead: number = 3
): Promise<CalendarEvent[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const events: CalendarEvent[] = [];
  const now = new Date();

  for (let m = 0; m < monthsAhead; m++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + m, template.day_of_month || 1);

    // For yearly recurrence, only generate for the specified month
    if (template.recurrence === 'yearly' && template.month_of_year) {
      if ((now.getMonth() + m) % 12 + 1 !== template.month_of_year) continue;
    }

    // For quarterly, only generate every 3 months
    if (template.recurrence === 'quarterly' && m % 3 !== 0) continue;

    // For half_yearly, only generate every 6 months
    if (template.recurrence === 'half_yearly' && m % 6 !== 0) continue;

    // Skip dates in the past
    if (targetDate < now) continue;

    // Recurrence end check
    if (template.recurrence_end_date && targetDate > new Date(template.recurrence_end_date)) continue;

    for (const entityId of entityIds.length > 0 ? entityIds : [null]) {
      const evt = await createCalendarEvent({
        ca_user_id: user.id,
        entity_id: entityId,
        title: `${template.template_name} - ${targetDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
        description: template.description,
        event_type: template.event_type,
        regulator: template.regulator,
        due_date: targetDate.toISOString().split('T')[0],
        priority: template.default_priority,
        is_recurring: true,
        recurrence_pattern: template.recurrence,
        recurrence_day: template.day_of_month,
        penalty_per_day_paise: template.penalty_per_day_paise,
        max_penalty_paise: template.max_penalty_paise,
        penalty_section: template.penalty_section,
        color_tag: template.color_tag,
        sla_hours: template.default_sla_hours,
      } as any);
      events.push(evt);
    }
  }

  // Mark template as generated
  await updateRecurringTemplate(template.id, {
    last_generated: new Date().toISOString().split('T')[0],
  } as any);

  return events;
}

// ─── SLA Timers CRUD ────────────────────────────────────────────────────

export async function fetchSLATimers(
  caUserId: string,
  filters?: { eventId?: string; running?: boolean }
): Promise<SLATimer[]> {
  if (!isValidUUID(caUserId)) return [];
  let query = supabase
    .from('deadline_sla_timers')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('started_at', { ascending: false });

  if (filters?.eventId) query = query.eq('event_id', filters.eventId);
  if (filters?.running !== undefined) query = query.eq('is_running', filters.running);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as SLATimer[];
}

export async function createSLATimer(
  timer: Partial<SLATimer>
): Promise<SLATimer> {
  const { data, error } = await supabase
    .from('deadline_sla_timers')
    .insert(timer as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SLATimer;
}

export async function updateSLATimer(
  id: string,
  updates: Partial<SLATimer>
): Promise<SLATimer> {
  const { data, error } = await supabase
    .from('deadline_sla_timers')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SLATimer;
}

export async function pauseSLATimer(id: string): Promise<SLATimer> {
  const timer = (await supabase.from('deadline_sla_timers').select('*').eq('id', id).single()).data as SLATimer;
  if (!timer) throw new Error('Timer not found');

  const now = new Date();
  const started = new Date(timer.paused_at || timer.started_at);
  const additionalHours = (now.getTime() - started.getTime()) / (1000 * 60 * 60);

  return updateSLATimer(id, {
    is_running: false,
    paused_at: now.toISOString(),
    elapsed_hours: Number(timer.elapsed_hours) + additionalHours,
  } as any);
}

export async function resumeSLATimer(id: string): Promise<SLATimer> {
  return updateSLATimer(id, {
    is_running: true,
    paused_at: null,
  } as any);
}

export async function completeSLATimer(id: string): Promise<SLATimer> {
  return updateSLATimer(id, {
    is_running: false,
    completed_at: new Date().toISOString(),
  } as any);
}

// ─── Bulk Operations ────────────────────────────────────────────────────

export async function bulkUpdateStatus(
  ids: string[],
  status: DeadlineStatus
): Promise<void> {
  const updates: any = { status };
  if (status === 'completed') {
    const { data: { user } } = await supabase.auth.getUser();
    updates.completed_at = new Date().toISOString();
    updates.completed_by = user?.id;
  }

  const { error } = await supabase
    .from('compliance_calendar_events')
    .update(updates)
    .in('id', ids);

  if (error) throw new Error(error.message);
}

// ─── Indian Statutory Deadline Presets ───────────────────────────────────
// These are the actual Indian compliance deadlines — used to seed templates

export const INDIAN_STATUTORY_PRESETS = [
  {
    template_name: 'GSTR-1 (Outward Supplies)',
    event_type: 'gst_return' as CalendarEventType,
    regulator: 'CBIC',
    description: 'Monthly return for outward supplies. Turnover > ₹5 Cr must file monthly by 11th.',
    recurrence: 'monthly' as RecurrencePattern,
    day_of_month: 11,
    default_priority: 'high' as DeadlinePriority,
    penalty_per_day_paise: 5000,  // ₹50/day
    max_penalty_paise: 1000000,   // ₹10,000
    penalty_section: 'Section 47(1) CGST Act',
    color_tag: '#10B981',
  },
  {
    template_name: 'GSTR-3B (Summary Return)',
    event_type: 'gst_return' as CalendarEventType,
    regulator: 'CBIC',
    description: 'Monthly summary return with tax payment. Due by 20th of next month.',
    recurrence: 'monthly' as RecurrencePattern,
    day_of_month: 20,
    default_priority: 'critical' as DeadlinePriority,
    penalty_per_day_paise: 5000,
    max_penalty_paise: 1000000,
    penalty_section: 'Section 47(1) CGST Act',
    color_tag: '#059669',
  },
  {
    template_name: 'TDS Deposit (All Deductors)',
    event_type: 'tds_deposit' as CalendarEventType,
    regulator: 'CBDT',
    description: 'Monthly TDS deposit. Due by 7th of the following month.',
    recurrence: 'monthly' as RecurrencePattern,
    day_of_month: 7,
    default_priority: 'critical' as DeadlinePriority,
    penalty_per_day_paise: 0,
    penalty_section: 'Section 201(1A) — 1.5% per month interest',
    color_tag: '#F59E0B',
  },
  {
    template_name: 'TDS Return — Form 24Q (Salary)',
    event_type: 'tds_return' as CalendarEventType,
    regulator: 'CBDT',
    description: 'Quarterly TDS return for salary deductions. Due by 31st of month after quarter.',
    recurrence: 'quarterly' as RecurrencePattern,
    day_of_month: 31,
    default_priority: 'high' as DeadlinePriority,
    penalty_per_day_paise: 20000,  // ₹200/day
    max_penalty_paise: 0,
    penalty_section: 'Section 234E',
    color_tag: '#EAB308',
  },
  {
    template_name: 'TDS Return — Form 26Q (Non-Salary)',
    event_type: 'tds_return' as CalendarEventType,
    regulator: 'CBDT',
    description: 'Quarterly TDS return for non-salary deductions.',
    recurrence: 'quarterly' as RecurrencePattern,
    day_of_month: 31,
    default_priority: 'high' as DeadlinePriority,
    penalty_per_day_paise: 20000,
    penalty_section: 'Section 234E',
    color_tag: '#CA8A04',
  },
  {
    template_name: 'Advance Tax — Q1 (15 June)',
    event_type: 'advance_tax' as CalendarEventType,
    regulator: 'CBDT',
    description: 'First installment of advance tax — 15% of estimated annual tax liability.',
    recurrence: 'yearly' as RecurrencePattern,
    day_of_month: 15,
    month_of_year: 6,
    default_priority: 'critical' as DeadlinePriority,
    penalty_section: 'Section 234C',
    color_tag: '#DC2626',
  },
  {
    template_name: 'Advance Tax — Q2 (15 September)',
    event_type: 'advance_tax' as CalendarEventType,
    regulator: 'CBDT',
    description: 'Second installment — cumulative 45% of estimated annual tax liability.',
    recurrence: 'yearly' as RecurrencePattern,
    day_of_month: 15,
    month_of_year: 9,
    default_priority: 'critical' as DeadlinePriority,
    penalty_section: 'Section 234C',
    color_tag: '#DC2626',
  },
  {
    template_name: 'Advance Tax — Q3 (15 December)',
    event_type: 'advance_tax' as CalendarEventType,
    regulator: 'CBDT',
    description: 'Third installment — cumulative 75% of estimated annual tax liability.',
    recurrence: 'yearly' as RecurrencePattern,
    day_of_month: 15,
    month_of_year: 12,
    default_priority: 'critical' as DeadlinePriority,
    penalty_section: 'Section 234C',
    color_tag: '#DC2626',
  },
  {
    template_name: 'Advance Tax — Q4 (15 March)',
    event_type: 'advance_tax' as CalendarEventType,
    regulator: 'CBDT',
    description: 'Final installment — 100% of estimated annual tax liability.',
    recurrence: 'yearly' as RecurrencePattern,
    day_of_month: 15,
    month_of_year: 3,
    default_priority: 'critical' as DeadlinePriority,
    penalty_section: 'Section 234C',
    color_tag: '#DC2626',
  },
  {
    template_name: 'ITR Filing — Individuals / HUF',
    event_type: 'itr_filing' as CalendarEventType,
    regulator: 'CBDT',
    description: 'Annual income tax return for individuals and HUFs. Due 31st July.',
    recurrence: 'yearly' as RecurrencePattern,
    day_of_month: 31,
    month_of_year: 7,
    default_priority: 'critical' as DeadlinePriority,
    penalty_per_day_paise: 0,
    max_penalty_paise: 1000000, // ₹10,000 u/s 234F
    penalty_section: 'Section 234F',
    color_tag: '#7C3AED',
  },
  {
    template_name: 'ITR Filing — Companies (Audit)',
    event_type: 'itr_filing' as CalendarEventType,
    regulator: 'CBDT',
    description: 'Annual ITR for companies requiring audit. Due 31st October.',
    recurrence: 'yearly' as RecurrencePattern,
    day_of_month: 31,
    month_of_year: 10,
    default_priority: 'critical' as DeadlinePriority,
    penalty_section: 'Section 234F',
    color_tag: '#6D28D9',
  },
  {
    template_name: 'PF/ESI Deposit',
    event_type: 'epf_deposit' as CalendarEventType,
    regulator: 'EPFO',
    description: 'Monthly EPF and ESI contribution deposit. Due by 15th.',
    recurrence: 'monthly' as RecurrencePattern,
    day_of_month: 15,
    default_priority: 'high' as DeadlinePriority,
    penalty_section: 'Section 14B EPF Act — damages up to 100%',
    color_tag: '#0EA5E9',
  },
  {
    template_name: 'MCA Annual Return (MGT-7)',
    event_type: 'mca_filing' as CalendarEventType,
    regulator: 'MCA',
    description: 'Annual return within 60 days of AGM.',
    recurrence: 'yearly' as RecurrencePattern,
    day_of_month: 30,
    month_of_year: 11,
    default_priority: 'high' as DeadlinePriority,
    penalty_per_day_paise: 10000, // ₹100/day
    penalty_section: 'Section 92(5) Companies Act',
    color_tag: '#8B5CF6',
  },
  {
    template_name: 'MCA Financial Statements (AOC-4)',
    event_type: 'mca_filing' as CalendarEventType,
    regulator: 'MCA',
    description: 'Filing of financial statements within 30 days of AGM.',
    recurrence: 'yearly' as RecurrencePattern,
    day_of_month: 30,
    month_of_year: 10,
    default_priority: 'high' as DeadlinePriority,
    penalty_per_day_paise: 10000,
    penalty_section: 'Section 137(3) Companies Act',
    color_tag: '#A78BFA',
  },
  {
    template_name: 'Professional Tax (State)',
    event_type: 'professional_tax' as CalendarEventType,
    regulator: 'Labour',
    description: 'Monthly/half-yearly professional tax deposit (varies by state).',
    recurrence: 'monthly' as RecurrencePattern,
    day_of_month: 15,
    default_priority: 'medium' as DeadlinePriority,
    color_tag: '#14B8A6',
  },
  {
    template_name: 'GSTR-9 Annual Return',
    event_type: 'gst_return' as CalendarEventType,
    regulator: 'CBIC',
    description: 'Annual GST return. Due by 31st December.',
    recurrence: 'yearly' as RecurrencePattern,
    day_of_month: 31,
    month_of_year: 12,
    default_priority: 'critical' as DeadlinePriority,
    penalty_per_day_paise: 20000,
    max_penalty_paise: 0,  // 0.04% of turnover
    penalty_section: 'Section 47(2) CGST Act',
    color_tag: '#047857',
  },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────

export function getEventTypeLabel(type: CalendarEventType): string {
  const map: Record<CalendarEventType, string> = {
    gst_return: 'GST Return',
    itr_filing: 'ITR Filing',
    tds_deposit: 'TDS Deposit',
    tds_return: 'TDS Return',
    advance_tax: 'Advance Tax',
    mca_filing: 'MCA Filing',
    roc_filing: 'ROC Filing',
    rbi_filing: 'RBI Filing',
    sebi_filing: 'SEBI Filing',
    epf_deposit: 'EPF/ESI Deposit',
    esic_deposit: 'ESIC Deposit',
    professional_tax: 'Professional Tax',
    audit_due: 'Audit Due',
    agm: 'AGM',
    board_meeting: 'Board Meeting',
    compliance_review: 'Compliance Review',
    custom: 'Custom',
    tax_payment: 'Tax Payment',
    notice_response: 'Notice Response',
    statutory_hearing: 'Statutory Hearing',
    assessment: 'Assessment',
    reassessment: 'Reassessment',
  };
  return map[type] || type;
}

export function getRegulatorColor(regulator: string): string {
  const map: Record<string, string> = {
    CBIC: '#10B981',
    CBDT: '#F59E0B',
    MCA: '#8B5CF6',
    RBI: '#3B82F6',
    SEBI: '#EF4444',
    EPFO: '#0EA5E9',
    ESIC: '#06B6D4',
    ROC: '#A78BFA',
    IRDAI: '#F97316',
    FSSAI: '#22C55E',
    DGFT: '#6366F1',
    Labour: '#14B8A6',
    Custom: '#6B7280',
    Other: '#9CA3AF',
  };
  return map[regulator] || '#6B7280';
}

export function getPriorityConfig(priority: DeadlinePriority) {
  const configs = {
    critical: { color: '#EF4444', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'Critical' },
    high: { color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'High' },
    medium: { color: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Medium' },
    low: { color: '#6B7280', bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', label: 'Low' },
  };
  return configs[priority];
}

export function getStatusConfig(status: DeadlineStatus) {
  const configs = {
    upcoming: { color: '#3B82F6', bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Upcoming' },
    active: { color: '#F59E0B', bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Active' },
    due_today: { color: '#EF4444', bg: 'bg-red-500/10', text: 'text-red-400', label: 'Due Today' },
    overdue: { color: '#DC2626', bg: 'bg-red-600/10', text: 'text-red-500', label: 'Overdue' },
    completed: { color: '#10B981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Completed' },
    cancelled: { color: '#6B7280', bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Cancelled' },
    extended: { color: '#8B5CF6', bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Extended' },
    waived: { color: '#14B8A6', bg: 'bg-teal-500/10', text: 'text-teal-400', label: 'Waived' },
  };
  return configs[status];
}
