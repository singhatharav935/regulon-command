/**
 * useDemoPaymentStore
 * ──────────────────────────────────────────────────────────
 * When the user is on the CA Demo Dashboard (no real Supabase
 * auth), this hook generates realistic tax-liability data
 * from demo_clients in localStorage and keeps paid/unpaid
 * state persisted in demo_payment_liabilities.
 *
 * It mirrors the shape of useTaxLiabilities + usePaymentDashboard
 * so that PaymentTaxLiability.tsx can swap them in seamlessly.
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { TaxLiability, PaymentDashboardSummary } from '@/services/payment-service';
import { rupeesToP } from '@/services/payment-service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DemoClient {
  id: string;
  name: string;
  industry?: string;
  gstin?: string;
  pan?: string;
  created_at?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LS_KEY = 'demo_payment_liabilities';

function loadFromLS(): TaxLiability[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToLS(data: TaxLiability[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function getDemoClients(): DemoClient[] {
  try {
    return JSON.parse(localStorage.getItem('demo_clients') || '[]');
  } catch {
    return [];
  }
}

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

/**
 * Generate a deterministic set of realistic tax liabilities
 * for each demo client. The liabilities vary by client so
 * the dashboard looks real and different per client.
 */
function generateLiabilitiesForClient(client: DemoClient): TaxLiability[] {
  const now = new Date().toISOString();
  const seed = client.id.charCodeAt(client.id.length - 1) % 10; // 0-9

  // Different amounts per client based on seed
  const turnover = [1500000, 2800000, 4200000, 650000, 9800000, 3100000, 7200000, 550000, 1200000, 5600000][seed];
  const gstRate = 0.18;
  const cgst = Math.round(turnover * 0.09 * 100);   // 9% CGST in paise
  const sgst = Math.round(turnover * 0.09 * 100);   // 9% SGST in paise
  const itcCgst = Math.round(cgst * 0.3);            // 30% ITC credit
  const itcSgst = Math.round(sgst * 0.3);
  const tdsBase = Math.round(turnover * 0.1 * 100);
  const advTax = Math.round(turnover * 0.25 * 100 * 0.25); // Q1 25%
  const ptBase = rupeesToP(seed % 2 === 0 ? 2500 : 1250);  // PT varies

  const netCgst = Math.max(0, cgst - itcCgst);
  const netSgst = Math.max(0, sgst - itcSgst);

  const liabilities: TaxLiability[] = [
    {
      id: `demo-${client.id}-cgst`,
      ca_user_id: 'demo',
      entity_id: client.id,
      entity_name: client.name,
      entity_type: 'company',
      gstin: client.gstin,
      pan: client.pan,
      tax_type: 'gst_cgst',
      tax_label: `GSTR-3B CGST — ${client.name}`,
      period_start: isoDate(-60),
      period_end: isoDate(-31),
      due_date: isoDate(8 + seed),
      gross_liability_paise: cgst,
      itc_available_paise: itcCgst,
      net_liability_paise: netCgst,
      interest_paise: 0,
      penalty_paise: 0,
      late_fee_paise: 0,
      total_due_paise: netCgst,
      amount_paid_paise: 0,
      balance_due_paise: netCgst,
      computation_data: { turnover, rate: 0.09, source: 'GSTR-3B auto-compute' },
      ai_computation: true,
      ai_notes: `Auto-computed from GSTR-2B ITC reconciliation. ITC credit ₹${(itcCgst / 100).toFixed(2)} applied.`,
      is_paid: false,
      is_nil_return: netCgst === 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: `demo-${client.id}-sgst`,
      ca_user_id: 'demo',
      entity_id: client.id,
      entity_name: client.name,
      entity_type: 'company',
      gstin: client.gstin,
      pan: client.pan,
      tax_type: 'gst_sgst',
      tax_label: `GSTR-3B SGST — ${client.name}`,
      period_start: isoDate(-60),
      period_end: isoDate(-31),
      due_date: isoDate(8 + seed),
      gross_liability_paise: sgst,
      itc_available_paise: itcSgst,
      net_liability_paise: netSgst,
      interest_paise: 0,
      penalty_paise: 0,
      late_fee_paise: 0,
      total_due_paise: netSgst,
      amount_paid_paise: 0,
      balance_due_paise: netSgst,
      computation_data: { turnover, rate: 0.09, source: 'GSTR-3B auto-compute' },
      ai_computation: true,
      ai_notes: `Mirror SGST liability matching CGST. ITC credit ₹${(itcSgst / 100).toFixed(2)} applied.`,
      is_paid: false,
      is_nil_return: netSgst === 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: `demo-${client.id}-tds`,
      ca_user_id: 'demo',
      entity_id: client.id,
      entity_name: client.name,
      entity_type: 'company',
      gstin: client.gstin,
      pan: client.pan,
      tax_type: 'tds',
      tax_label: `TDS 194C — Contractor Payments — ${client.name}`,
      period_start: isoDate(-45),
      period_end: isoDate(-16),
      due_date: isoDate(7),
      gross_liability_paise: tdsBase,
      itc_available_paise: 0,
      net_liability_paise: tdsBase,
      interest_paise: 0,
      penalty_paise: 0,
      late_fee_paise: 0,
      total_due_paise: tdsBase,
      amount_paid_paise: 0,
      balance_due_paise: tdsBase,
      computation_data: { section: '194C', rate: 0.10, contractor_payments: turnover },
      ai_computation: false,
      is_paid: false,
      is_nil_return: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: `demo-${client.id}-advtax`,
      ca_user_id: 'demo',
      entity_id: client.id,
      entity_name: client.name,
      entity_type: 'company',
      gstin: client.gstin,
      pan: client.pan,
      tax_type: 'advance_tax',
      tax_label: `Advance Tax Q1 FY 2026-27 — ${client.name}`,
      period_start: isoDate(-90),
      period_end: isoDate(-61),
      due_date: isoDate(15 + seed * 2),
      gross_liability_paise: advTax,
      itc_available_paise: 0,
      net_liability_paise: advTax,
      interest_paise: 0,
      penalty_paise: 0,
      late_fee_paise: 0,
      total_due_paise: advTax,
      amount_paid_paise: 0,
      balance_due_paise: advTax,
      computation_data: { installment: 'Q1', percentage: 25, annual_estimate: advTax * 4 },
      ai_computation: false,
      is_paid: false,
      is_nil_return: false,
      created_at: now,
      updated_at: now,
    },
    {
      id: `demo-${client.id}-pt`,
      ca_user_id: 'demo',
      entity_id: client.id,
      entity_name: client.name,
      entity_type: 'company',
      gstin: client.gstin,
      pan: client.pan,
      tax_type: 'professional_tax',
      tax_label: `Professional Tax (Employer) — ${client.name}`,
      period_start: isoDate(-30),
      period_end: isoDate(-1),
      due_date: isoDate(5),
      gross_liability_paise: ptBase,
      itc_available_paise: 0,
      net_liability_paise: ptBase,
      interest_paise: 0,
      penalty_paise: 0,
      late_fee_paise: 0,
      total_due_paise: ptBase,
      amount_paid_paise: 0,
      balance_due_paise: ptBase,
      computation_data: { employees: 10 + seed, monthly_rate: seed % 2 === 0 ? 250 : 125 },
      ai_computation: false,
      is_paid: false,
      is_nil_return: false,
      created_at: now,
      updated_at: now,
    },
  ];

  return liabilities;
}

/**
 * Merge generated liabilities with any persisted paid-state overrides.
 * If a liability ID exists in localStorage, use the persisted version
 * (so "Pay" button marks it as paid permanently in demo session).
 */
function mergeWithPersisted(generated: TaxLiability[]): TaxLiability[] {
  const persisted = loadFromLS();
  const persistedMap = new Map(persisted.map(l => [l.id, l]));
  return generated.map(l => persistedMap.get(l.id) ?? l);
}

function buildAllLiabilities(): TaxLiability[] {
  const clients = getDemoClients();
  if (clients.length === 0) return [];
  const all = clients.flatMap(c => generateLiabilitiesForClient(c));
  return mergeWithPersisted(all);
}

function computeSummary(liabilities: TaxLiability[]): PaymentDashboardSummary {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);
  return {
    total_liabilities: liabilities.length,
    paid_count: liabilities.filter(l => l.is_paid).length,
    unpaid_count: liabilities.filter(l => !l.is_paid).length,
    overdue_count: liabilities.filter(l => !l.is_paid && new Date(l.due_date) < now).length,
    due_this_week: liabilities.filter(l => !l.is_paid && new Date(l.due_date) <= weekFromNow && new Date(l.due_date) >= now).length,
    total_due_paise: liabilities.reduce((a, l) => a + (l.total_due_paise || 0), 0),
    total_paid_paise: liabilities.filter(l => l.is_paid).reduce((a, l) => a + (l.total_due_paise || 0), 0),
    total_balance_paise: liabilities.filter(l => !l.is_paid).reduce((a, l) => a + (l.balance_due_paise || 0), 0),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDemoPaymentStore() {
  const [liabilities, setLiabilities] = useState<TaxLiability[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    const all = buildAllLiabilities();
    setLiabilities(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    // Listen for new clients being added
    window.addEventListener('demo-client-added', reload);
    window.addEventListener('ca:metrics-updated', reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener('demo-client-added', reload);
      window.removeEventListener('ca:metrics-updated', reload);
      window.removeEventListener('storage', reload);
    };
  }, [reload]);

  // Summary derived from state
  const summary = computeSummary(liabilities);

  // Upcoming = unpaid, sorted by due date, next 30 days
  const upcoming = liabilities
    .filter(l => !l.is_paid)
    .filter(l => {
      const d = new Date(l.due_date);
      const now = new Date();
      return d >= now && d <= new Date(now.getTime() + 30 * 86400000);
    })
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  // ── Actions ────────────────────────────────────────────────────────────────

  const markPaid = useCallback((id: string, amountPaise: number, gateway: string) => {
    setLiabilities(prev => {
      const next = prev.map(l => {
        if (l.id !== id) return l;
        const now = new Date().toISOString();
        return {
          ...l,
          is_paid: true,
          amount_paid_paise: amountPaise,
          balance_due_paise: 0,
          bsr_code: `BSR${Math.floor(Math.random() * 9000000 + 1000000)}`,
          challan_serial_no: `${Math.floor(Math.random() * 9000 + 1000)}`,
          challan_date: now.split('T')[0],
          updated_at: now,
        };
      });
      saveToLS(next);
      return next;
    });
    toast.success('Payment recorded in demo mode', {
      description: `Marked as paid via ${gateway}. Challan BSR code generated.`,
    });
    window.dispatchEvent(new CustomEvent('ca:metrics-updated'));
  }, []);

  const removeLiability = useCallback((id: string) => {
    setLiabilities(prev => {
      const next = prev.filter(l => l.id !== id);
      saveToLS(next);
      return next;
    });
    toast.success('Liability removed');
    window.dispatchEvent(new CustomEvent('ca:metrics-updated'));
  }, []);

  const addLiability = useCallback((partial: Partial<TaxLiability>) => {
    const now = new Date().toISOString();
    const gross = partial.gross_liability_paise ?? 0;
    const itc = partial.itc_available_paise ?? 0;
    const net = Math.max(0, gross - itc);
    const interest = partial.interest_paise ?? 0;
    const penalty = partial.penalty_paise ?? 0;
    const lateFee = partial.late_fee_paise ?? 0;
    const total = net + interest + penalty + lateFee;

    const newL: TaxLiability = {
      id: `demo-manual-${Date.now()}`,
      ca_user_id: 'demo',
      tax_type: partial.tax_type ?? 'other',
      tax_label: partial.tax_label ?? 'Tax Liability',
      period_start: partial.period_start ?? now.split('T')[0],
      period_end: partial.period_end ?? now.split('T')[0],
      due_date: partial.due_date ?? now.split('T')[0],
      gross_liability_paise: gross,
      itc_available_paise: itc,
      net_liability_paise: net,
      interest_paise: interest,
      penalty_paise: penalty,
      late_fee_paise: lateFee,
      total_due_paise: total,
      amount_paid_paise: 0,
      balance_due_paise: total,
      computation_data: {},
      ai_computation: false,
      is_paid: false,
      is_nil_return: total === 0,
      entity_id: partial.entity_id,
      entity_name: partial.entity_name,
      created_at: now,
      updated_at: now,
    };

    setLiabilities(prev => {
      const next = [newL, ...prev];
      saveToLS(next);
      return next;
    });
    toast.success(`Liability "${newL.tax_label}" added`);
    return newL;
  }, []);

  return {
    liabilities,
    upcoming,
    summary,
    loading,
    refetch: reload,
    markPaid,
    removeLiability,
    addLiability,
  };
}
