/**
 * useCalendar — React hooks for Calendar & Deadline Management (Gap 4)
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchCalendarEvents,
  fetchUpcomingDeadlines,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  completeCalendarEvent,
  extendDeadline,
  fetchCalendarDashboard,
  fetchReminders,
  createReminder,
  updateReminder,
  snoozeReminder,
  markReminderSent,
  deleteReminder,
  fetchEscalationRules,
  createEscalationRule,
  updateEscalationRule,
  deleteEscalationRule,
  toggleEscalationRule,
  fetchEscalationLogs,
  fetchRecurringTemplates,
  createRecurringTemplate,
  updateRecurringTemplate,
  deleteRecurringTemplate,
  generateEventsFromTemplate,
  fetchSLATimers,
  createSLATimer,
  updateSLATimer,
  pauseSLATimer,
  resumeSLATimer,
  completeSLATimer,
  bulkUpdateStatus,
  type CalendarEvent,
  type DeadlineReminder,
  type EscalationRule,
  type EscalationLog,
  type RecurringTemplate,
  type SLATimer,
  type CalendarDashboardSummary,
  type DeadlineStatus,
  type CalendarEventType,
  type DeadlinePriority
} from '@/services/calendar-service';

// ─── useCalendarEvents ───────────────────────────────────────────────────────

export function useCalendarEvents(
  caUserId: string | null,
  initialFilters?: {
    startDate?: string;
    endDate?: string;
    status?: DeadlineStatus[];
    priority?: DeadlinePriority[];
    eventType?: CalendarEventType[];
    regulator?: string;
    entityId?: string;
  }
) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters || {});

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCalendarEvents(caUserId, filters);
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId, JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  const addEvent = useCallback(async (event: Partial<CalendarEvent>) => {
    try {
      const created = await createCalendarEvent({ ...event, ca_user_id: caUserId! });
      setEvents((prev) => [created, ...prev]);
      toast.success(`Deadline "${created.title}" added to calendar`);
      return created;
    } catch (err: any) {
      toast.error('Failed to add deadline', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const updated = await updateCalendarEvent(id, updates);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast.success('Deadline updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update deadline', { description: err.message });
      throw err;
    }
  }, []);

  const removeEvent = useCallback(async (id: string) => {
    try {
      await deleteCalendarEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('Deadline removed');
    } catch (err: any) {
      toast.error('Failed to delete deadline', { description: err.message });
      throw err;
    }
  }, []);

  const completeEvent = useCallback(async (id: string, completionNotes?: string) => {
    try {
      const updated = await completeCalendarEvent(id, completionNotes);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast.success('Deadline marked as completed');
      return updated;
    } catch (err: any) {
      toast.error('Failed to complete deadline', { description: err.message });
      throw err;
    }
  }, []);

  const extendEvent = useCallback(async (id: string, newDueDate: string, reason?: string) => {
    try {
      const updated = await extendDeadline(id, newDueDate, reason);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast.success('Deadline extended successfully');
      return updated;
    } catch (err: any) {
      toast.error('Failed to extend deadline', { description: err.message });
      throw err;
    }
  }, []);

  const bulkStatusUpdate = useCallback(async (ids: string[], status: DeadlineStatus) => {
    try {
      await bulkUpdateStatus(ids, status);
      await load();
      toast.success(`Bulk updated ${ids.length} items to ${status}`);
    } catch (err: any) {
      toast.error('Failed to bulk update deadlines', { description: err.message });
      throw err;
    }
  }, [load]);

  return {
    events,
    loading,
    error,
    refetch: load,
    addEvent,
    editEvent,
    removeEvent,
    completeEvent,
    extendEvent,
    bulkStatusUpdate,
    filters,
    setFilters
  };
}

// ─── useUpcomingDeadlines ────────────────────────────────────────────────────

export function useUpcomingDeadlines(caUserId: string | null) {
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUpcomingDeadlines(caUserId);
      setUpcomingDeadlines(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    load();
  }, [load]);

  return { upcomingDeadlines, loading, error, refetch: load };
}

// ─── useCalendarDashboard ────────────────────────────────────────────────────

export function useCalendarDashboard(caUserId: string | null) {
  const [summary, setSummary] = useState<CalendarDashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCalendarDashboard(caUserId);
      setSummary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, loading, error, refetch: load };
}

// ─── useReminders ────────────────────────────────────────────────────────────

export function useReminders(caUserId: string | null, initialFilters?: { eventId?: string; sent?: boolean }) {
  const [reminders, setReminders] = useState<DeadlineReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters || {});

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReminders(caUserId, filters);
      setReminders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId, JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  const addReminder = useCallback(async (reminder: Partial<DeadlineReminder>) => {
    try {
      const created = await createReminder({ ...reminder, ca_user_id: caUserId! });
      setReminders((prev) => [created, ...prev]);
      toast.success('Reminder scheduled');
      return created;
    } catch (err: any) {
      toast.error('Failed to create reminder', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editReminder = useCallback(async (id: string, updates: Partial<DeadlineReminder>) => {
    try {
      const updated = await updateReminder(id, updates);
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success('Reminder updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update reminder', { description: err.message });
      throw err;
    }
  }, []);

  const snooze = useCallback(async (id: string, snoozeUntil: string) => {
    try {
      const updated = await snoozeReminder(id, snoozeUntil);
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success('Reminder snoozed');
      return updated;
    } catch (err: any) {
      toast.error('Failed to snooze reminder', { description: err.message });
      throw err;
    }
  }, []);

  const markSent = useCallback(async (id: string) => {
    try {
      const updated = await markReminderSent(id);
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success('Reminder marked as sent');
      return updated;
    } catch (err: any) {
      toast.error('Failed to mark reminder sent', { description: err.message });
      throw err;
    }
  }, []);

  const removeReminder = useCallback(async (id: string) => {
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success('Reminder deleted');
    } catch (err: any) {
      toast.error('Failed to delete reminder', { description: err.message });
      throw err;
    }
  }, []);

  return {
    reminders,
    loading,
    error,
    refetch: load,
    addReminder,
    editReminder,
    snooze,
    markSent,
    removeReminder,
    filters,
    setFilters
  };
}

// ─── useEscalationRules ──────────────────────────────────────────────────────

export function useEscalationRules(caUserId: string | null) {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEscalationRules(caUserId);
      setRules(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const addRule = useCallback(async (rule: Partial<EscalationRule>) => {
    try {
      const created = await createEscalationRule({ ...rule, ca_user_id: caUserId! });
      setRules((prev) => [created, ...prev]);
      toast.success(`Escalation rule "${created.rule_name}" created`);
      return created;
    } catch (err: any) {
      toast.error('Failed to create escalation rule', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editRule = useCallback(async (id: string, updates: Partial<EscalationRule>) => {
    try {
      const updated = await updateEscalationRule(id, updates);
      setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success('Escalation rule updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update escalation rule', { description: err.message });
      throw err;
    }
  }, []);

  const removeRule = useCallback(async (id: string) => {
    try {
      await deleteEscalationRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast.success('Escalation rule deleted');
    } catch (err: any) {
      toast.error('Failed to delete escalation rule', { description: err.message });
      throw err;
    }
  }, []);

  const toggleRule = useCallback(async (id: string, isActive: boolean) => {
    try {
      const updated = await toggleEscalationRule(id, isActive);
      setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success(isActive ? 'Escalation rule enabled' : 'Escalation rule disabled');
      return updated;
    } catch (err: any) {
      toast.error('Failed to toggle escalation rule', { description: err.message });
      throw err;
    }
  }, []);

  return {
    rules,
    loading,
    error,
    refetch: load,
    addRule,
    editRule,
    removeRule,
    toggleRule
  };
}

// ─── useEscalationLogs ───────────────────────────────────────────────────────

export function useEscalationLogs(caUserId: string | null, initialFilters?: { eventId?: string; ruleId?: string; limit?: number }) {
  const [logs, setLogs] = useState<EscalationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters || {});

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEscalationLogs(caUserId, filters);
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId, JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  return { logs, loading, error, refetch: load, filters, setFilters };
}

// ─── useRecurringTemplates ───────────────────────────────────────────────────

export function useRecurringTemplates(caUserId: string | null) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecurringTemplates(caUserId);
      setTemplates(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTemplate = useCallback(async (template: Partial<RecurringTemplate>) => {
    try {
      const created = await createRecurringTemplate({ ...template, ca_user_id: caUserId! });
      setTemplates((prev) => [created, ...prev]);
      toast.success(`Recurring template "${created.template_name}" created`);
      return created;
    } catch (err: any) {
      toast.error('Failed to create template', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editTemplate = useCallback(async (id: string, updates: Partial<RecurringTemplate>) => {
    try {
      const updated = await updateRecurringTemplate(id, updates);
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success('Template updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update template', { description: err.message });
      throw err;
    }
  }, []);

  const removeTemplate = useCallback(async (id: string) => {
    try {
      await deleteRecurringTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success('Template deleted');
    } catch (err: any) {
      toast.error('Failed to delete template', { description: err.message });
      throw err;
    }
  }, []);

  const generateEvents = useCallback(async (template: RecurringTemplate, entityIds: string[], monthsAhead?: number) => {
    try {
      const generated = await generateEventsFromTemplate(template, entityIds, monthsAhead);
      toast.success(`Generated ${generated.length} calendar events from template`);
      return generated;
    } catch (err: any) {
      toast.error('Failed to generate events', { description: err.message });
      throw err;
    }
  }, []);

  return {
    templates,
    loading,
    error,
    refetch: load,
    addTemplate,
    editTemplate,
    removeTemplate,
    generateEvents
  };
}

// ─── useSLATimers ───────────────────────────────────────────────────────────

export function useSLATimers(caUserId: string | null, initialFilters?: { eventId?: string; running?: boolean }) {
  const [timers, setTimers] = useState<SLATimer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters || {});

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSLATimers(caUserId, filters);
      setTimers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId, JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  const addTimer = useCallback(async (timer: Partial<SLATimer>) => {
    try {
      const created = await createSLATimer({ ...timer, ca_user_id: caUserId! });
      setTimers((prev) => [created, ...prev]);
      toast.success('SLA timer created');
      return created;
    } catch (err: any) {
      toast.error('Failed to create SLA timer', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editTimer = useCallback(async (id: string, updates: Partial<SLATimer>) => {
    try {
      const updated = await updateSLATimer(id, updates);
      setTimers((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success('SLA timer updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update SLA timer', { description: err.message });
      throw err;
    }
  }, []);

  const pause = useCallback(async (id: string) => {
    try {
      const updated = await pauseSLATimer(id);
      setTimers((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success('SLA timer paused');
      return updated;
    } catch (err: any) {
      toast.error('Failed to pause SLA timer', { description: err.message });
      throw err;
    }
  }, []);

  const resume = useCallback(async (id: string) => {
    try {
      const updated = await resumeSLATimer(id);
      setTimers((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success('SLA timer resumed');
      return updated;
    } catch (err: any) {
      toast.error('Failed to resume SLA timer', { description: err.message });
      throw err;
    }
  }, []);

  const complete = useCallback(async (id: string) => {
    try {
      const updated = await completeSLATimer(id);
      setTimers((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success('SLA timer completed');
      return updated;
    } catch (err: any) {
      toast.error('Failed to complete SLA timer', { description: err.message });
      throw err;
    }
  }, []);

  return {
    timers,
    loading,
    error,
    refetch: load,
    addTimer,
    editTimer,
    pause,
    resume,
    complete,
    filters,
    setFilters
  };
}
