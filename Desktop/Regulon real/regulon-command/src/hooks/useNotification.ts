/**
 * useNotification — React hooks for Notification & Alert Engine (Gap 10)
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  testChannel,
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  fetchAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  fetchRecipients,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  dispatchNotification,
  fetchDispatches,
  fetchDeliveryStats,
  fetchNotificationDashboard,
  renderTemplate,
  type NotificationChannel,
  type NotificationTemplate,
  type NotificationAlertRule,
  type NotificationRecipient,
  type NotificationDispatch,
  type NotificationDeliveryStats,
  type NotificationDashboard,
  type ChannelType,
  type TemplateCategory,
  type TriggerEvent,
} from '@/services/notification-service';

// ─── useNotificationChannels ──────────────────────────────────────────────────

export function useNotificationChannels(caUserId: string | null) {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      setChannels(await fetchChannels(caUserId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const addChannel = useCallback(async (channel: Partial<NotificationChannel>) => {
    try {
      const created = await createChannel({ ...channel, ca_user_id: caUserId! });
      setChannels((prev) => [...prev, created]);
      toast.success(`Channel "${created.channel_name}" created`);
      return created;
    } catch (err: any) {
      toast.error('Failed to create channel', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editChannel = useCallback(async (id: string, updates: Partial<NotificationChannel>) => {
    try {
      const updated = await updateChannel(id, updates);
      setChannels((prev) => prev.map((c) => (c.id === id ? updated : c)));
      toast.success('Channel updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update channel', { description: err.message });
      throw err;
    }
  }, []);

  const removeChannel = useCallback(async (id: string) => {
    try {
      await deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
      toast.success('Channel removed');
    } catch (err: any) {
      toast.error('Failed to delete channel', { description: err.message });
    }
  }, []);

  const pingChannel = useCallback(async (id: string) => {
    try {
      const result = await testChannel(id);
      // Refresh to show updated test_status
      await load();
      if (result.success) {
        toast.success('Channel test queued', { description: result.message });
      } else {
        toast.error('Channel test failed', { description: result.message });
      }
      return result;
    } catch (err: any) {
      toast.error('Failed to test channel', { description: err.message });
    }
  }, [load]);

  return { channels, loading, error, refetch: load, addChannel, editChannel, removeChannel, pingChannel };
}

// ─── useNotificationTemplates ─────────────────────────────────────────────────

export function useNotificationTemplates(caUserId: string | null) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      setTemplates(await fetchTemplates(caUserId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const addTemplate = useCallback(async (template: Partial<NotificationTemplate>) => {
    try {
      const created = await createTemplate({ ...template, ca_user_id: caUserId! });
      setTemplates((prev) => [...prev, created]);
      toast.success(`Template "${created.template_name}" created`);
      return created;
    } catch (err: any) {
      toast.error('Failed to create template', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editTemplate = useCallback(async (id: string, updates: Partial<NotificationTemplate>) => {
    try {
      const updated = await updateTemplate(id, updates);
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
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success('Template deleted');
    } catch (err: any) {
      toast.error('Failed to delete template', { description: err.message });
    }
  }, []);

  return { templates, loading, error, refetch: load, addTemplate, editTemplate, removeTemplate };
}

// ─── useAlertRules ─────────────────────────────────────────────────────────────

export function useAlertRules(caUserId: string | null) {
  const [rules, setRules] = useState<NotificationAlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      setRules(await fetchAlertRules(caUserId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const addRule = useCallback(async (rule: Partial<NotificationAlertRule>) => {
    try {
      const created = await createAlertRule({ ...rule, ca_user_id: caUserId! });
      setRules((prev) => [...prev, created]);
      toast.success(`Alert rule "${created.rule_name}" created`);
      return created;
    } catch (err: any) {
      toast.error('Failed to create alert rule', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editRule = useCallback(async (id: string, updates: Partial<NotificationAlertRule>) => {
    try {
      const updated = await updateAlertRule(id, updates);
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      toast.success('Alert rule updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update alert rule', { description: err.message });
      throw err;
    }
  }, []);

  const toggleRule = useCallback(async (id: string, enabled: boolean) => {
    try {
      await updateAlertRule(id, { is_enabled: enabled });
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_enabled: enabled } : r)));
      toast.success(enabled ? 'Alert rule activated' : 'Alert rule deactivated');
    } catch (err: any) {
      toast.error('Failed to toggle alert rule', { description: err.message });
    }
  }, []);

  const removeRule = useCallback(async (id: string) => {
    try {
      await deleteAlertRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast.success('Alert rule deleted');
    } catch (err: any) {
      toast.error('Failed to delete alert rule', { description: err.message });
    }
  }, []);

  return { rules, loading, error, refetch: load, addRule, editRule, toggleRule, removeRule };
}

// ─── useNotificationRecipients ────────────────────────────────────────────────

export function useNotificationRecipients(caUserId: string | null) {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      setRecipients(await fetchRecipients(caUserId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const addRecipient = useCallback(async (recipient: Partial<NotificationRecipient>) => {
    try {
      const created = await createRecipient({ ...recipient, ca_user_id: caUserId! });
      setRecipients((prev) => [...prev, created]);
      toast.success(`Recipient "${created.full_name}" added`);
      return created;
    } catch (err: any) {
      toast.error('Failed to add recipient', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const editRecipient = useCallback(async (id: string, updates: Partial<NotificationRecipient>) => {
    try {
      const updated = await updateRecipient(id, updates);
      setRecipients((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success('Recipient updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update recipient', { description: err.message });
      throw err;
    }
  }, []);

  const removeRecipient = useCallback(async (id: string) => {
    try {
      await deleteRecipient(id);
      setRecipients((prev) => prev.filter((r) => r.id !== id));
      toast.success('Recipient removed');
    } catch (err: any) {
      toast.error('Failed to remove recipient', { description: err.message });
    }
  }, []);

  return { recipients, loading, error, refetch: load, addRecipient, editRecipient, removeRecipient };
}

// ─── useNotificationDispatches ────────────────────────────────────────────────

export function useNotificationDispatches(caUserId: string | null) {
  const [dispatches, setDispatches] = useState<NotificationDispatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      setDispatches(await fetchDispatches(caUserId, 200));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const sendNotification = useCallback(async (
    channelType: ChannelType,
    bodyRendered: string,
    opts: {
      recipientId?: string;
      recipientEmail?: string;
      recipientPhone?: string;
      templateId?: string;
      ruleId?: string;
      channelId?: string;
      subject?: string;
    }
  ) => {
    if (!caUserId) return;
    try {
      const dispatch = await dispatchNotification({
        caUserId,
        channelType,
        bodyRendered,
        ...opts,
      });
      await load();
      toast.success(`Notification dispatched via ${channelType.toUpperCase()}`);
      return dispatch;
    } catch (err: any) {
      toast.error('Failed to dispatch notification', { description: err.message });
      throw err;
    }
  }, [caUserId, load]);

  return { dispatches, loading, error, refetch: load, sendNotification };
}

// ─── useNotificationDashboard ─────────────────────────────────────────────────

export function useNotificationDashboard(caUserId: string | null) {
  const [dashboard, setDashboard] = useState<NotificationDashboard | null>(null);
  const [stats, setStats] = useState<NotificationDeliveryStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    setError(null);
    try {
      const [dash, st] = await Promise.all([
        fetchNotificationDashboard(caUserId),
        fetchDeliveryStats(caUserId, 30),
      ]);
      setDashboard(dash);
      setStats(st);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  return { dashboard, stats, loading, error, refetch: load };
}

// ─── Re-export useful types and helpers ────────────────────────────────────────

export {
  renderTemplate,
  CHANNEL_META,
  TRIGGER_EVENT_LABELS,
  TEMPLATE_CATEGORY_LABELS,
  type NotificationChannel,
  type NotificationTemplate,
  type NotificationAlertRule,
  type NotificationRecipient,
  type NotificationDispatch,
  type NotificationDeliveryStats,
  type NotificationDashboard,
  type ChannelType,
  type TemplateCategory,
  type TriggerEvent,
} from '@/services/notification-service';
