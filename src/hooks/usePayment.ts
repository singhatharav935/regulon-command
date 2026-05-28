/**
 * usePayment — React hooks for Payment / Tax-Liability Automation (Gap 3)
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchLiabilities, fetchUpcomingPayments,
  createLiability, updateLiability, deleteLiability, computeTaxLiability,
  fetchPaymentTransactions, initiateRazorpayPayment, confirmPayment,
  recordManualPayment,
  fetchPaymentDashboardSummary,
  fetchReminders, createReminder, deleteReminder,
  fetchReconciliationEntries, addBankTransaction, matchReconciliationEntry,
  formatRupees,
  type TaxLiability, type PaymentTransaction, type PaymentReminder,
  type ReconciliationEntry, type PaymentDashboardSummary,
  type TaxType, type PaymentStatus, type PaymentGateway,
} from '@/services/payment-service';

// ─── useTaxLiabilities ────────────────────────────────────────────────────────

export function useTaxLiabilities(
  caUserId: string | null,
  filters?: { isPaid?: boolean; entityId?: string; taxType?: TaxType }
) {
  const [liabilities, setLiabilities] = useState<TaxLiability[]>([]);
  const [upcoming, setUpcoming] = useState<TaxLiability[]>([]);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try {
      const [all, up] = await Promise.all([
        fetchLiabilities(caUserId, filters),
        fetchUpcomingPayments(caUserId),
      ]);
      setLiabilities(all);
      setUpcoming(up);
    } catch (err: any) {
      toast.error('Failed to load liabilities', { description: err.message });
    } finally { setLoading(false); }
  }, [caUserId, JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  const addLiability = useCallback(async (liability: Parameters<typeof createLiability>[0]) => {
    try {
      const created = await createLiability(liability);
      setLiabilities(prev => [created, ...prev]);
      toast.success(`Tax liability "${created.tax_label}" added`);
      return created;
    } catch (err: any) {
      toast.error('Failed to add liability', { description: err.message });
      throw err;
    }
  }, []);

  const editLiability = useCallback(async (id: string, updates: Partial<TaxLiability>) => {
    try {
      const updated = await updateLiability(id, updates);
      setLiabilities(prev => prev.map(l => l.id === id ? updated : l));
      toast.success('Liability updated');
      return updated;
    } catch (err: any) {
      toast.error('Failed to update', { description: err.message });
      throw err;
    }
  }, []);

  const removeLiability = useCallback(async (id: string) => {
    try {
      await deleteLiability(id);
      setLiabilities(prev => prev.filter(l => l.id !== id));
      toast.success('Liability removed');
    } catch (err: any) {
      toast.error('Failed to delete', { description: err.message });
      throw err;
    }
  }, []);

  const computeAndCreate = useCallback(async (
    entityId: string,
    taxType: TaxType,
    periodStart: string,
    periodEnd: string,
    dueDate: string,
    taxLabel: string,
    inputData: Record<string, unknown>
  ) => {
    if (!caUserId) return;
    setComputing(true);
    try {
      const computed = await computeTaxLiability(caUserId, entityId, taxType, periodStart, periodEnd, inputData);
      const created = await createLiability({
        ca_user_id: caUserId,
        entity_id: entityId,
        tax_type: taxType,
        tax_label: taxLabel,
        period_start: periodStart,
        period_end: periodEnd,
        due_date: dueDate,
        ...computed,
        ai_computation: true,
        is_paid: false,
        is_nil_return: computed.total_due_paise === 0,
      });
      setLiabilities(prev => [created, ...prev]);
      toast.success('Tax liability computed & added', {
        description: `Total due: ${formatRupees(computed.total_due_paise)}`,
      });
      return created;
    } catch (err: any) {
      toast.error('Computation failed', { description: err.message });
      throw err;
    } finally { setComputing(false); }
  }, [caUserId]);

  return {
    liabilities, upcoming, loading, computing,
    refetch: load, addLiability, editLiability, removeLiability, computeAndCreate,
  };
}

// ─── usePaymentTransactions ───────────────────────────────────────────────────

export function usePaymentTransactions(
  caUserId: string | null,
  filters?: { liabilityId?: string; status?: PaymentStatus; entityId?: string }
) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [initiating, setInitiating] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try {
      setTransactions(await fetchPaymentTransactions(caUserId, filters));
    } catch (err: any) {
      toast.error('Failed to load transactions', { description: err.message });
    } finally { setLoading(false); }
  }, [caUserId, JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  const initiateOnline = useCallback(async (
    liabilityId: string,
    amountPaise: number,
    description: string,
    entityId?: string
  ) => {
    if (!caUserId) return;
    setInitiating(liabilityId);
    try {
      const result = await initiateRazorpayPayment(caUserId, liabilityId, amountPaise, description, entityId);
      await load();
      return result;
    } catch (err: any) {
      toast.error('Payment initiation failed', { description: err.message });
      throw err;
    } finally { setInitiating(null); }
  }, [caUserId, load]);

  const recordManual = useCallback(async (
    liabilityId: string,
    amountPaise: number,
    gateway: PaymentGateway,
    description: string,
    details: Parameters<typeof recordManualPayment>[6],
    entityId?: string
  ) => {
    if (!caUserId) return;
    setRecording(true);
    try {
      const txn = await recordManualPayment(caUserId, liabilityId, amountPaise, gateway, description, details, entityId);
      setTransactions(prev => [txn, ...prev]);
      toast.success('Payment recorded', { description: formatRupees(amountPaise) + ' marked as paid' });
      return txn;
    } catch (err: any) {
      toast.error('Failed to record payment', { description: err.message });
      throw err;
    } finally { setRecording(false); }
  }, [caUserId]);

  return { transactions, loading, initiating, recording, refetch: load, initiateOnline, recordManual };
}

// ─── usePaymentDashboard ──────────────────────────────────────────────────────

export function usePaymentDashboard(caUserId: string | null) {
  const [summary, setSummary] = useState<PaymentDashboardSummary>({
    total_liabilities: 0, paid_count: 0, unpaid_count: 0,
    overdue_count: 0, due_this_week: 0,
    total_due_paise: 0, total_paid_paise: 0, total_balance_paise: 0,
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try { setSummary(await fetchPaymentDashboardSummary(caUserId)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  return { summary, loading, refetch: load };
}

// ─── useReminders ─────────────────────────────────────────────────────────────

export function useReminders(caUserId: string | null) {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try { setReminders(await fetchReminders(caUserId)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const addReminder = useCallback(async (
    liabilityId: string,
    entityId: string,
    reminderDate: string,
    type: string,
    message: string,
    recipients: string[]
  ) => {
    if (!caUserId) return;
    try {
      const r = await createReminder(caUserId, liabilityId, entityId, reminderDate, type, message, recipients);
      setReminders(prev => [...prev, r].sort((a, b) => a.reminder_date.localeCompare(b.reminder_date)));
      toast.success('Reminder scheduled');
      return r;
    } catch (err: any) {
      toast.error('Failed to schedule reminder', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const removeReminder = useCallback(async (id: string) => {
    try {
      await deleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Reminder deleted');
    } catch (err: any) {
      toast.error('Failed to delete reminder', { description: err.message });
    }
  }, []);

  return { reminders, loading, refetch: load, addReminder, removeReminder };
}

// ─── useReconciliation ────────────────────────────────────────────────────────

export function useReconciliation(caUserId: string | null) {
  const [entries, setEntries] = useState<ReconciliationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try { setEntries(await fetchReconciliationEntries(caUserId)); }
    catch { /* silent */ }
    finally { setLoading(false); }
  }, [caUserId]);

  useEffect(() => { load(); }, [load]);

  const importBankRow = useCallback(async (
    entry: Omit<ReconciliationEntry, 'id' | 'ca_user_id' | 'is_matched' | 'match_confidence' | 'match_method' | 'created_at' | 'updated_at'>
  ) => {
    if (!caUserId) return;
    try {
      const created = await addBankTransaction(caUserId, entry);
      setEntries(prev => [created, ...prev]);
      toast.success('Bank transaction imported');
      return created;
    } catch (err: any) {
      toast.error('Failed to import', { description: err.message });
      throw err;
    }
  }, [caUserId]);

  const matchEntry = useCallback(async (
    entryId: string,
    transactionId: string,
    liabilityId: string
  ) => {
    if (!caUserId) return;
    setMatching(entryId);
    try {
      await matchReconciliationEntry(entryId, transactionId, liabilityId, caUserId, 'manual', 1.0);
      setEntries(prev => prev.map(e =>
        e.id === entryId
          ? { ...e, is_matched: true, match_confidence: 1.0, match_method: 'manual' }
          : e
      ));
      toast.success('Bank transaction matched to payment');
    } catch (err: any) {
      toast.error('Failed to match', { description: err.message });
    } finally { setMatching(null); }
  }, [caUserId]);

  return { entries, loading, matching, refetch: load, importBankRow, matchEntry };
}
