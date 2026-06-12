/**
 * Payment / Tax-Liability Automation — Service Layer (Gap 3)
 * Real Supabase queries + Razorpay gateway integration.
 * No mock data.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';
import { handleServiceError } from '@/lib/safe-query';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaxType =
  | 'gst_igst' | 'gst_cgst' | 'gst_sgst' | 'gst_cess'
  | 'tds' | 'tcs' | 'advance_tax' | 'self_assessment_tax'
  | 'corporate_tax' | 'professional_tax' | 'pt_employer'
  | 'epf_employee' | 'epf_employer' | 'esic_employee' | 'esic_employer'
  | 'customs_duty' | 'other';

export type PaymentStatus =
  | 'pending' | 'initiated' | 'processing' | 'success' | 'failed'
  | 'refunded' | 'partially_paid' | 'scheduled' | 'cancelled';

export type PaymentGateway =
  | 'razorpay' | 'payu' | 'cashfree' | 'stripe' | 'upi_direct'
  | 'neft' | 'rtgs' | 'cheque' | 'challan_offline' | 'other';

export type ChallanType =
  | 'itns280' | 'itns281' | 'itns282' | 'itns283' | 'itns285'
  | 'gst_pmt06' | 'gst_pmt08' | 'epf_ecr' | 'esic_challan' | 'custom';

export interface TaxLiability {
  id: string;
  ca_user_id: string;
  entity_id?: string;
  // DB column: head_name (not tax_label)
  head_name: string;
  tax_label: string;       // alias for head_name in the UI
  tax_type: string;
  // DB column: assessment_year (not period_start/period_end)
  assessment_year?: string;
  period_start: string;    // mapped from assessment_year in UI
  period_end: string;      // mapped from assessment_year in UI
  due_date?: string;
  gross_liability_paise: number;
  itc_available_paise: number;
  net_liability_paise: number;
  interest_paise: number;
  penalty_paise: number;
  late_fee_paise: number;
  total_due_paise: number;
  // DB uses 'status' text column, not is_paid boolean
  status: string;
  is_paid: boolean;        // derived from status === 'paid'
  amount?: number;         // DB column: amount (numeric)
  notes?: string;
  created_at: string;
  updated_at: string;
  // joined from entities table
  entity_name?: string;
  entity_type?: string;
  gstin?: string;
  pan?: string;
}

export interface PaymentTransaction {
  id: string;
  ca_user_id: string;
  liability_id?: string;
  entity_id?: string;
  company_id?: string;
  gateway: PaymentGateway;
  amount_paise: number;
  currency: string;
  status: PaymentStatus;
  gateway_order_id?: string;
  gateway_payment_id?: string;
  gateway_signature?: string;
  gateway_response: Record<string, unknown>;
  challan_number?: string;
  bank_reference_no?: string;
  payment_mode?: string;
  bank_name?: string;
  payment_date?: string;
  description: string;
  notes: Record<string, unknown>;
  failure_reason?: string;
  initiated_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentReminder {
  id: string;
  ca_user_id: string;
  liability_id?: string;
  entity_id?: string;
  reminder_date: string;
  reminder_type: string;
  message: string;
  recipients: string[];
  is_sent: boolean;
  sent_at?: string;
  delivery_status: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationEntry {
  id: string;
  ca_user_id: string;
  transaction_id?: string;
  liability_id?: string;
  bank_txn_date: string;
  bank_txn_amount_paise: number;
  bank_narration?: string;
  bank_reference?: string;
  is_matched: boolean;
  match_confidence: number;
  match_method: string;
  mismatch_reason?: string;
  reconciled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentDashboardSummary {
  total_liabilities: number;
  paid_count: number;
  unpaid_count: number;
  overdue_count: number;
  due_this_week: number;
  total_due_paise: number;
  total_paid_paise: number;
  total_balance_paise: number;
}

// Helpers
export const pToRupees = (paise: number) => (paise / 100).toFixed(2);
export const rupeesToP = (rupees: number) => Math.round(rupees * 100);
export const formatRupees = (paise: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100);

// ─── Tax Liabilities ──────────────────────────────────────────────────────────

export async function fetchLiabilities(
  caUserId: string,
  filters?: { isPaid?: boolean; entityId?: string; taxType?: TaxType }
): Promise<TaxLiability[]> {
  if (!isValidUUID(caUserId)) return [];
  // Only select columns that actually exist in tax_liability_heads
  let q = (supabase as any)
    .from('tax_liability_heads')
    .select('id, ca_user_id, entity_id, head_name, tax_type, assessment_year, due_date, gross_liability_paise, itc_available_paise, net_liability_paise, interest_paise, penalty_paise, late_fee_paise, total_due_paise, amount, status, notes, created_at, updated_at, entities(entity_name, entity_type, gstin, pan)')
    .eq('ca_user_id', caUserId);

  // tax_liability_heads uses 'status' text column, not 'is_paid' boolean
  if (filters?.isPaid === true) q = q.eq('status', 'paid');
  else if (filters?.isPaid === false) q = q.neq('status', 'paid');
  if (filters?.entityId) q = q.eq('entity_id', filters.entityId);
  if (filters?.taxType) q = q.eq('tax_type', filters.taxType);

  const { data, error } = await q.order('due_date', { ascending: true });
  if (error) return handleServiceError(error, []);

  return (data ?? []).map((row: any) => ({
    ...row,
    // Map DB column names to interface aliases
    tax_label: row.head_name || row.tax_type || 'Tax Liability',
    period_start: row.assessment_year || '',
    period_end: row.assessment_year || '',
    is_paid: row.status === 'paid',
    // Provide zero defaults for paise fields not stored in DB
    amount_paid_paise: row.status === 'paid' ? (row.total_due_paise || 0) : 0,
    balance_due_paise: row.status === 'paid' ? 0 : (row.total_due_paise || 0),
    // Joined entity fields
    entity_name: row.entities?.entity_name,
    entity_type: row.entities?.entity_type,
    gstin: row.entities?.gstin,
    pan: row.entities?.pan,
  }));
}

export async function fetchUpcomingPayments(caUserId: string): Promise<TaxLiability[]> {
  if (!isValidUUID(caUserId)) return [];
  // upcoming_payments view may not exist — try with fallback
  try {
    const { data, error } = await (supabase as any)
      .from('upcoming_payments')
      .select('*')
      .eq('ca_user_id', caUserId);

    if (!error && data) return data;
  } catch { /* view doesn't exist */ }

  // Fallback: query base table for unpaid liabilities
  return fetchLiabilities(caUserId, { isPaid: false });
}

export async function createLiability(
  liability: Omit<TaxLiability, 'id' | 'is_paid' | 'amount_paid_paise' | 'balance_due_paise' | 'created_at' | 'updated_at' | 'entity_name' | 'entity_type' | 'gstin' | 'pan'>
): Promise<TaxLiability> {
  // Auto-compute derived fields
  const net = Math.max(0, (liability.gross_liability_paise || 0) - (liability.itc_available_paise || 0));
  const total = net + (liability.interest_paise || 0) + (liability.penalty_paise || 0) + (liability.late_fee_paise || 0);

  // Map interface fields to actual DB columns
  const dbPayload: any = {
    ca_user_id: liability.ca_user_id,
    entity_id: liability.entity_id,
    head_name: liability.tax_label || liability.head_name || liability.tax_type,
    tax_type: liability.tax_type,
    assessment_year: liability.assessment_year || liability.period_start,
    due_date: liability.due_date,
    gross_liability_paise: liability.gross_liability_paise || 0,
    itc_available_paise: liability.itc_available_paise || 0,
    net_liability_paise: net,
    interest_paise: liability.interest_paise || 0,
    penalty_paise: liability.penalty_paise || 0,
    late_fee_paise: liability.late_fee_paise || 0,
    total_due_paise: total,
    amount: total / 100, // store in rupees in the 'amount' column
    status: liability.status || 'pending',
    notes: liability.notes,
  };

  const { data, error } = await (supabase as any)
    .from('tax_liability_heads')
    .insert([dbPayload])
    .select()
    .single();

  if (error) return handleServiceError(error, {} as TaxLiability);
  return { ...data, tax_label: data.head_name, is_paid: data.status === 'paid', period_start: data.assessment_year || '', period_end: data.assessment_year || '' };
}

export async function updateLiability(
  id: string,
  updates: Partial<TaxLiability>
): Promise<TaxLiability> {
  // Recompute derived fields if amounts change
  if (
    updates.gross_liability_paise !== undefined ||
    updates.itc_available_paise !== undefined ||
    updates.interest_paise !== undefined ||
    updates.penalty_paise !== undefined ||
    updates.late_fee_paise !== undefined
  ) {
    const { data: existing } = await (supabase as any)
      .from('tax_liability_heads')
      .select('gross_liability_paise,itc_available_paise,interest_paise,penalty_paise,late_fee_paise')
      .eq('id', id)
      .single();

    const merged = { ...existing, ...updates };
    const net = Math.max(0, merged.gross_liability_paise - merged.itc_available_paise);
    const total = net + merged.interest_paise + merged.penalty_paise + merged.late_fee_paise;
    updates.net_liability_paise = net;
    updates.total_due_paise = total;
  }

  const { data, error } = await (supabase as any)
    .from('tax_liability_heads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function deleteLiability(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('tax_liability_heads')
    .delete()
    .eq('id', id);
  if (error) return handleServiceError(error, []);
}

/**
 * Auto-compute tax liability using configured rules.
 * Calls the supabase edge function if available, otherwise falls back to rule table.
 */
export async function computeTaxLiability(
  caUserId: string,
  entityId: string,
  taxType: TaxType,
  periodStart: string,
  periodEnd: string,
  inputData: Record<string, unknown>
): Promise<{
  gross_liability_paise: number;
  itc_available_paise: number;
  net_liability_paise: number;
  interest_paise: number;
  penalty_paise: number;
  late_fee_paise: number;
  total_due_paise: number;
  computation_data: Record<string, unknown>;
  ai_notes: string;
}> {
  try {
    // Try edge function first
    const { data, error } = await supabase.functions.invoke('compute-tax-liability', {
      body: { ca_user_id: caUserId, entity_id: entityId, tax_type: taxType, period_start: periodStart, period_end: periodEnd, input_data: inputData },
    });
    if (!error && data?.gross_liability_paise !== undefined) return data;
  } catch {
    // Edge fn not available — compute from rules
  }

  // Fallback: compute from tax_computation_rules
  // Note: table only has ca_user_id, rule_name, tax_type, section, formula, is_active
  const { data: rules } = await (supabase as any)
    .from('tax_computation_rules')
    .select('*')
    .eq('ca_user_id', caUserId)
    .eq('tax_type', taxType)
    .eq('is_active', true);

  const grossTurnover = Number(inputData.turnover ?? inputData.taxable_value ?? 0);
  let gross = 0;

  if (rules && rules.length > 0) {
    const rule = rules[0].rule_definition as any;
    gross = Math.round(grossTurnover * (rule.rate ?? 0) * 100); // in paise
  } else {
    // Generic rate fallback
    const defaultRates: Partial<Record<TaxType, number>> = {
      gst_igst: 0.18, gst_cgst: 0.09, gst_sgst: 0.09,
      tds: 0.10, advance_tax: 0.25, corporate_tax: 0.22,
    };
    const rate = defaultRates[taxType] ?? 0;
    gross = Math.round(grossTurnover * rate * 100);
  }

  // Days overdue for interest/penalty calc
  const dueDate = new Date(periodEnd);
  dueDate.setDate(dueDate.getDate() + 20); // generic 20-day due
  const daysLate = Math.max(0, Math.ceil((Date.now() - dueDate.getTime()) / 86400000));
  const interest = Math.round(gross * 0.18 * (daysLate / 365)); // 18% p.a.
  const lateFee = daysLate > 0 ? Math.min(500000, daysLate * 5000) : 0; // ₹50/day max ₹5000

  const itc = Number(inputData.itc_available ?? 0) * 100;
  const net = Math.max(0, gross - itc);

  return {
    gross_liability_paise: gross,
    itc_available_paise: Math.round(itc),
    net_liability_paise: net,
    interest_paise: interest,
    penalty_paise: 0,
    late_fee_paise: lateFee,
    total_due_paise: net + interest + lateFee,
    computation_data: { turnover: grossTurnover, rate_applied: rules?.[0]?.rule_definition ?? 'default', days_late: daysLate },
    ai_notes: `Computed using ${rules?.length ? 'CA-configured rules' : 'system default rates'}. ${daysLate > 0 ? `${daysLate} days overdue — interest of ₹${(interest/100).toFixed(2)} applied at 18% p.a.` : ''}`,
  };
}

// ─── Payment Transactions ─────────────────────────────────────────────────────

export async function fetchPaymentTransactions(
  caUserId: string,
  filters?: { liabilityId?: string; status?: PaymentStatus; entityId?: string }
): Promise<PaymentTransaction[]> {
  if (!isValidUUID(caUserId)) return [];
  let q = (supabase as any)
    .from('payment_transactions')
    .select('*')
    .eq('ca_user_id', caUserId);

  if (filters?.liabilityId) q = q.eq('liability_id', filters.liabilityId);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.entityId) q = q.eq('entity_id', filters.entityId);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) return handleServiceError(error, []);
  return data ?? [];
}

/**
 * Initiate a Razorpay payment order via edge function.
 * Falls back to recording as 'challan_offline' if edge fn unavailable.
 */
export async function initiateRazorpayPayment(
  caUserId: string,
  liabilityId: string,
  amountPaise: number,
  description: string,
  entityId?: string
): Promise<{ order_id: string; transaction_id: string; key_id: string }> {
  // Create pending transaction record first
  const { data: txn, error: txnErr } = await (supabase as any)
    .from('payment_transactions')
    .insert([{
      ca_user_id: caUserId,
      liability_id: liabilityId,
      entity_id: entityId,
      payment_method: 'razorpay',
      amount_paise: amountPaise,
      status: 'initiated',
      notes: description,
    }])
    .select()
    .single();

  if (txnErr) return handleServiceError(txnErr, []);

  try {
    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: {
        transaction_id: txn.id,
        amount_paise: amountPaise,
        currency: 'INR',
        notes: { liability_id: liabilityId, description },
      },
    });
    if (error) throw error;
    await (supabase as any)
      .from('payment_transactions')
      .update({ gateway_order_id: data.order_id, status: 'processing' })
      .eq('id', txn.id);

    return { order_id: data.order_id, transaction_id: txn.id, key_id: data.key_id };
  } catch {
    // Edge fn not deployed — return transaction id for manual processing
    return { order_id: `manual_${txn.id}`, transaction_id: txn.id, key_id: '' };
  }
}

/**
 * Confirm a payment after gateway callback (called from Razorpay webhook handler).
 */
export async function confirmPayment(
  transactionId: string,
  gatewayPaymentId: string,
  gatewaySignature: string,
  gatewayResponse: Record<string, unknown>
): Promise<PaymentTransaction> {
  const { data, error } = await (supabase as any)
    .from('payment_transactions')
    .update({
      gateway_payment_id: gatewayPaymentId,
      status: 'success',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: gatewaySignature,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

/**
 * Record a manual / offline payment (challan, NEFT, RTGS, cheque).
 */
export async function recordManualPayment(
  caUserId: string,
  liabilityId: string,
  amountPaise: number,
  gateway: PaymentGateway,
  description: string,
  details: {
    challan_number?: string;
    bank_reference_no?: string;
    bank_name?: string;
    payment_mode?: string;
    payment_date?: string;
    bsr_code?: string;
    challan_serial_no?: string;
  },
  entityId?: string
): Promise<PaymentTransaction> {
  // Map to actual payment_transactions columns: payment_method (not gateway), notes (not description)
  const { challan_number, bank_reference_no, bank_name, payment_mode, payment_date, ...rest } = details;
  const { data, error } = await (supabase as any)
    .from('payment_transactions')
    .insert([{
      ca_user_id: caUserId,
      liability_id: liabilityId,
      entity_id: entityId,
      payment_method: gateway,
      amount_paise: amountPaise,
      status: 'success',
      notes: description,
      reference_number: bank_reference_no || challan_number,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();

  if (error) return handleServiceError(error, []);

  return data;
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export async function fetchPaymentDashboardSummary(
  caUserId: string
): Promise<PaymentDashboardSummary> {
  if (!isValidUUID(caUserId)) return {
    total_liabilities: 0, paid_count: 0, unpaid_count: 0,
    overdue_count: 0, due_this_week: 0,
    total_due_paise: 0, total_paid_paise: 0, total_balance_paise: 0,
  };

  // Bypass view query to prevent 400 console error, computing from tax_liability_heads directly
  const liabilities = await fetchLiabilities(caUserId);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);
  return {
    total_liabilities: liabilities.length,
    paid_count: liabilities.filter(l => l.status === 'paid').length,
    unpaid_count: liabilities.filter(l => l.status !== 'paid').length,
    overdue_count: liabilities.filter(l => l.status !== 'paid' && new Date(l.due_date) < now).length,
    due_this_week: liabilities.filter(l => l.status !== 'paid' && new Date(l.due_date) <= weekFromNow && new Date(l.due_date) >= now).length,
    total_due_paise: liabilities.reduce((a, l) => a + (l.total_due_paise || 0), 0),
    total_paid_paise: liabilities.filter(l => l.status === 'paid').reduce((a, l) => a + (l.total_due_paise || 0), 0),
    total_balance_paise: liabilities.filter(l => l.status !== 'paid').reduce((a, l) => a + (l.total_due_paise || 0), 0),
  };
}

// ─── Reminders ────────────────────────────────────────────────────────────────

export async function fetchReminders(caUserId: string): Promise<PaymentReminder[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('payment_reminders')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('remind_at', { ascending: true });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function createReminder(
  caUserId: string,
  liabilityId: string,
  entityId: string,
  reminderDate: string,
  reminderType: string,
  message: string,
  recipients: string[]
): Promise<PaymentReminder> {
  // payment_reminders actual columns: ca_user_id, liability_id, remind_at, channel, is_sent
  const { data, error } = await (supabase as any)
    .from('payment_reminders')
    .insert([{
      ca_user_id: caUserId,
      liability_id: liabilityId,
      remind_at: reminderDate,
      channel: reminderType,
      is_sent: false,
    }])
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('payment_reminders')
    .delete()
    .eq('id', id);
  if (error) return handleServiceError(error, []);
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

export async function fetchReconciliationEntries(
  caUserId: string
): Promise<ReconciliationEntry[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('payment_reconciliation')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('bank_txn_date', { ascending: false });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function addBankTransaction(
  caUserId: string,
  entry: Omit<ReconciliationEntry, 'id' | 'ca_user_id' | 'is_matched' | 'match_confidence' | 'match_method' | 'created_at' | 'updated_at'>
): Promise<ReconciliationEntry> {
  const { data, error } = await (supabase as any)
    .from('payment_reconciliation')
    .insert([{ ...entry, ca_user_id: caUserId }])
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function matchReconciliationEntry(
  entryId: string,
  transactionId: string,
  liabilityId: string,
  caUserId: string,
  method: 'manual' | 'ai' | 'exact' | 'fuzzy' = 'manual',
  confidence = 1.0
): Promise<void> {
  // payment_reconciliation actual columns: transaction_id, liability_id, bank_reference, bank_txn_date, bank_amount, matched_amount, status, notes
  const { error } = await (supabase as any)
    .from('payment_reconciliation')
    .update({
      transaction_id: transactionId,
      liability_id: liabilityId,
      matched_amount: 0,
      status: 'matched',
      notes: JSON.stringify({ match_method: method, match_confidence: confidence, reconciled_by: caUserId }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId);

  if (error) return handleServiceError(error, []);
}
