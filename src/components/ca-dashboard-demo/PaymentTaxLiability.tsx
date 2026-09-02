/**
 * PaymentTaxLiability — Full UI Component (Gap 3)
 * Payment / Tax-Liability Automation
 * Uses Supabase when authenticated; falls back to demo localStorage store.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDemoPaymentStore } from '@/hooks/useDemoPaymentStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEntities } from '@/hooks/useMultiEntity';
import {
  useTaxLiabilities, usePaymentTransactions,
  usePaymentDashboard, useReminders, useReconciliation,
} from '@/hooks/usePayment';
import { formatRupees, rupeesToP, pToRupees, confirmPayment, type TaxType, type PaymentGateway, type TaxLiability } from '@/services/payment-service';
import { useCAAgentOrchestrator } from '@/components/agents-demo/CAAgentOrchestrator';
import {
  IndianRupee, Plus, RefreshCw, Trash2, CheckCircle, AlertTriangle,
  Clock, Loader2, CreditCard, ChevronDown, ChevronRight, X, Save,
  Calendar, Bell, BarChart3, Shield, TrendingUp, TrendingDown,
  Search, Filter, Zap, Calculator, FileText, Building2, Activity,
  ArrowUpRight, ArrowDownRight, Landmark, CircleDollarSign, Banknote,
  ReceiptText, ScanLine, LayoutGrid,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const TAX_TYPE_META: Record<string, { label: string; color: string; category: string }> = {
  gst_igst:          { label: 'IGST',              color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',  category: 'GST' },
  gst_cgst:          { label: 'CGST',              color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',  category: 'GST' },
  gst_sgst:          { label: 'SGST',              color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',  category: 'GST' },
  gst_cess:          { label: 'GST Cess',          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',  category: 'GST' },
  tds:               { label: 'TDS',               color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',  category: 'TDS/TCS' },
  tcs:               { label: 'TCS',               color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',  category: 'TDS/TCS' },
  advance_tax:       { label: 'Advance Tax',       color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',        category: 'Income Tax' },
  self_assessment_tax:{ label: 'Self Assess. Tax', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',        category: 'Income Tax' },
  corporate_tax:     { label: 'Corporate Tax',     color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', category: 'Income Tax' },
  professional_tax:  { label: 'Professional Tax',  color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',        category: 'State' },
  pt_employer:       { label: 'PT (Employer)',      color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',        category: 'State' },
  epf_employee:      { label: 'EPF (Employee)',     color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',        category: 'PF/ESI' },
  epf_employer:      { label: 'EPF (Employer)',     color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',        category: 'PF/ESI' },
  esic_employee:     { label: 'ESIC (Employee)',    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',        category: 'PF/ESI' },
  esic_employer:     { label: 'ESIC (Employer)',    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',        category: 'PF/ESI' },
  customs_duty:      { label: 'Customs Duty',      color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',        category: 'Customs' },
  other:             { label: 'Other',             color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',        category: 'Other' },
};

const GATEWAY_META: Record<string, { label: string; icon: string }> = {
  razorpay:         { label: 'Razorpay',        icon: '💳' },
  payu:             { label: 'PayU',            icon: '💳' },
  cashfree:         { label: 'Cashfree',        icon: '💳' },
  upi_direct:       { label: 'UPI Direct',      icon: '📱' },
  neft:             { label: 'NEFT',            icon: '🏦' },
  rtgs:             { label: 'RTGS',            icon: '🏦' },
  cheque:           { label: 'Cheque',          icon: '📄' },
  challan_offline:  { label: 'Challan (Offline)',icon: '🧾' },
  other:            { label: 'Other',           icon: '💰' },
};

function daysUntilDue(dueDate: string): { days: number; color: string; label: string } {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { days: diff, color: 'text-red-400', label: `${Math.abs(diff)}d overdue` };
  if (diff === 0) return { days: 0, color: 'text-red-400', label: 'Due today' };
  if (diff <= 3) return { days: diff, color: 'text-orange-400', label: `${diff}d left` };
  if (diff <= 7) return { days: diff, color: 'text-yellow-400', label: `${diff}d left` };
  return { days: diff, color: 'text-green-400', label: `${diff}d left` };
}

const useSafeSwarmState = () => {
  const [isAutoMode, setIsAutoMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sannidh:dashboard-mode') === 'auto';
  });
  const [localRunning, setLocalRunning] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sannidh:ca-swarm-running') === 'true';
  });
  
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAutoMode(localStorage.getItem('sannidh:dashboard-mode') === 'auto');
      setLocalRunning(localStorage.getItem('sannidh:ca-swarm-running') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  let isRunning = localRunning;
  try {
    const orch = useCAAgentOrchestrator();
    isRunning = orch.isRunning;
  } catch (e) {
    // fallback
  }

  return { isRunning, isAutoMode };
};

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

const DashboardTab = ({ caUserId, isDemoMode }: { caUserId: string; isDemoMode?: boolean }) => {
  const demo = useDemoPaymentStore();
  const realDashboard = usePaymentDashboard(isDemoMode ? null : caUserId);
  const realLiabilities = useTaxLiabilities(isDemoMode ? null : caUserId);

  const summary = isDemoMode ? demo.summary : realDashboard.summary;
  const loading = isDemoMode ? demo.loading : realDashboard.loading;
  const refetch = isDemoMode ? demo.refetch : realDashboard.refetch;
  const upcoming = isDemoMode ? demo.upcoming : realLiabilities.upcoming;
  const refetchLiabilities = isDemoMode ? demo.refetch : realLiabilities.refetch;

  useEffect(() => {
    const handleReload = () => {
      refetch();
      refetchLiabilities();
    };
    window.addEventListener('swarm-completed-event', handleReload);
    window.addEventListener('swarm-status-changed', handleReload);
    window.addEventListener('ca:metrics-updated', handleReload);
    window.addEventListener('sannidh:history-updated', handleReload);
    window.addEventListener('storage', handleReload);
    return () => {
      window.removeEventListener('swarm-completed-event', handleReload);
      window.removeEventListener('swarm-status-changed', handleReload);
      window.removeEventListener('ca:metrics-updated', handleReload);
      window.removeEventListener('sannidh:history-updated', handleReload);
      window.removeEventListener('storage', handleReload);
    };
  }, [refetch, refetchLiabilities]);

  const collectionRate = summary.total_due_paise > 0
    ? Math.round((summary.total_paid_paise / summary.total_due_paise) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Payment Overview</h3>
        <Button variant="outline" size="sm" onClick={refetch} className="border-border/50">
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Balance Due', value: formatRupees(summary.total_balance_paise), color: 'red', icon: IndianRupee, sub: `${summary.unpaid_count} liabilities` },
          { label: 'Overdue', value: summary.overdue_count.toString(), color: 'red', icon: AlertTriangle, sub: 'Past due date' },
          { label: 'Due This Week', value: summary.due_this_week.toString(), color: 'orange', icon: Clock, sub: 'Next 7 days' },
          { label: 'Collection Rate', value: `${collectionRate}%`, color: collectionRate >= 80 ? 'green' : 'yellow', icon: TrendingUp, sub: `${summary.paid_count}/${summary.total_liabilities} paid` },
        ].map(card => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-xl border bg-${card.color}-500/5 border-${card.color}-500/20`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <Icon className={`w-4 h-4 text-${card.color}-400`} />
              </div>
              <p className={`text-2xl font-bold text-${card.color}-400`}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Amount Progress Bar */}
      <Card className="border-border/50 bg-card/20">
        <CardContent className="p-5">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm font-medium">Payment Progress</span>
            <span className="text-xs text-muted-foreground">
              {formatRupees(summary.total_paid_paise)} paid of {formatRupees(summary.total_due_paise)}
            </span>
          </div>
          <Progress value={collectionRate} className="h-3 bg-border/40" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="text-green-400">{formatRupees(summary.total_paid_paise)} collected</span>
            <span className="text-red-400">{formatRupees(summary.total_balance_paise)} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      {upcoming.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Upcoming Payments (Next 30 Days)
          </h4>
          <div className="space-y-2">
            {upcoming.slice(0, 8).map(l => {
              const due = daysUntilDue(l.due_date);
              const m = TAX_TYPE_META[l.tax_type];
              return (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-card/20 hover:bg-card/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${m?.color.split(' ')[0]}`}>
                      <IndianRupee className={`w-4 h-4 ${m?.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{l.tax_label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {l.entity_name && <span className="text-xs text-muted-foreground">{l.entity_name}</span>}
                        <Badge variant="outline" className={`text-[10px] ${m?.color}`}>{m?.label}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatRupees(l.balance_due_paise)}</p>
                    <p className={`text-xs font-medium ${due.color}`}>{due.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tax Liabilities Tab ──────────────────────────────────────────────────────

const LiabilitiesTab = ({ caUserId, isDemoMode }: { caUserId: string; isDemoMode?: boolean }) => {
  const demo = useDemoPaymentStore();
  const real = useTaxLiabilities(isDemoMode ? null : caUserId);
  const { entities } = useEntities(isDemoMode ? null : caUserId);
  const { initiateOnline, recordManual, initiating, recording } = usePaymentTransactions(isDemoMode ? null : caUserId);

  const liabilities = isDemoMode ? demo.liabilities : real.liabilities;
  const loading = isDemoMode ? demo.loading : real.loading;
  const computing = isDemoMode ? false : real.computing;
  const refetch = isDemoMode ? demo.refetch : real.refetch;

  const addLiability = isDemoMode
    ? (l: any) => { demo.addLiability(l); return Promise.resolve(); }
    : real.addLiability;
  const removeLiability = isDemoMode
    ? (id: string) => { demo.removeLiability(id); return Promise.resolve(); }
    : real.removeLiability;
  const computeAndCreate = isDemoMode ? async () => {} : real.computeAndCreate;

  const navigate = useNavigate();

  const handleViewReceipt = (l: TaxLiability) => {
    localStorage.setItem('payment_pdf_liability', JSON.stringify(l));
    navigate('/ca-dashboard/payment-challan-pdf');
  };

  const { isRunning, isAutoMode } = useSafeSwarmState();

  useEffect(() => {
    const handleReload = () => {
      refetch();
    };
    window.addEventListener('swarm-completed-event', handleReload);
    window.addEventListener('swarm-status-changed', handleReload);
    window.addEventListener('ca:metrics-updated', handleReload);
    window.addEventListener('sannidh:history-updated', handleReload);
    window.addEventListener('storage', handleReload);
    return () => {
      window.removeEventListener('swarm-completed-event', handleReload);
      window.removeEventListener('swarm-status-changed', handleReload);
      window.removeEventListener('ca:metrics-updated', handleReload);
      window.removeEventListener('sannidh:history-updated', handleReload);
      window.removeEventListener('storage', handleReload);
    };
  }, [refetch]);

  // Autonomous Swarm Auto-Payment Agent Loop
  useEffect(() => {
    if (!isRunning || !isAutoMode || liabilities.length === 0) return;

    // Find first unpaid tax liability with balance due
    const unpaid = liabilities.find(l => !l.is_paid && l.balance_due_paise > 0);
    if (!unpaid) return;

    const timer = setTimeout(async () => {
      try {
        toast.info(`[Swarm Agent] Paying liability: ${unpaid.tax_label}...`, {
          description: `Autonomous auto-payment of ${formatRupees(unpaid.balance_due_paise)} via NetBanking simulation.`,
        });
        
        await initiateOnline(unpaid.id, unpaid.balance_due_paise, `[Auto Swarm] ${unpaid.tax_label}`, unpaid.entity_id);
        
        toast.success(`[Swarm Agent] Successfully paid ${unpaid.tax_label}!`, {
          description: 'Consensus engine verified challan receipt & settled tax head.',
        });
        
        // Dispatch global sync events
        window.dispatchEvent(new CustomEvent('ca:metrics-updated'));
        window.dispatchEvent(new CustomEvent('swarm-completed-event'));
        window.dispatchEvent(new CustomEvent('sannidh:history-updated'));
        window.dispatchEvent(new CustomEvent('storage'));
        
        refetch();
      } catch (err: any) {
        console.error('Autonomous payment agent error:', err);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [isRunning, isAutoMode, liabilities, initiateOnline, refetch]);

  const [showAdd, setShowAdd] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState<TaxLiability | null>(null);
  const [showComputeDialog, setShowComputeDialog] = useState(false);
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Add form state
  const [form, setForm] = useState({
    entity_id: '', tax_type: 'gst_cgst' as TaxType, tax_label: '',
    period_start: '', period_end: '', due_date: '',
    gross_liability: '', itc_available: '', interest: '0', penalty: '0', late_fee: '0',
  });

  // Compute form
  const [cForm, setCForm] = useState({
    entity_id: '', tax_type: 'gst_cgst' as TaxType, tax_label: '',
    period_start: '', period_end: '', due_date: '',
    turnover: '', itc_available: '',
  });

  // Pay form state
  const [payForm, setPayForm] = useState({
    gateway: 'challan_offline' as PaymentGateway,
    amount: '',
    challan_number: '',
    bank_reference_no: '',
    bank_name: '',
    payment_mode: 'net_banking',
    payment_date: new Date().toISOString().split('T')[0],
    bsr_code: '',
    challan_serial_no: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const setC = (k: string, v: string) => setCForm(f => ({ ...f, [k]: v }));
  const setP = (k: string, v: string) => setPayForm(f => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    return liabilities.filter(l => {
      const matchPaid = filterPaid === 'all' || (filterPaid === 'paid' ? l.is_paid : !l.is_paid);
      const matchType = filterType === 'all' || l.tax_type === filterType;
      const matchSearch = search === '' || l.tax_label.toLowerCase().includes(search.toLowerCase()) || (l.entity_name ?? '').toLowerCase().includes(search.toLowerCase());
      return matchPaid && matchType && matchSearch;
    });
  }, [liabilities, filterPaid, filterType, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tax_label || !form.period_start || !form.due_date) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await addLiability({
        ca_user_id: caUserId,
        entity_id: form.entity_id || undefined,
        tax_type: form.tax_type,
        tax_label: form.tax_label,
        period_start: form.period_start,
        period_end: form.period_end || form.period_start,
        due_date: form.due_date,
        gross_liability_paise: rupeesToP(Number(form.gross_liability) || 0),
        itc_available_paise: rupeesToP(Number(form.itc_available) || 0),
        net_liability_paise: 0,
        interest_paise: rupeesToP(Number(form.interest) || 0),
        penalty_paise: rupeesToP(Number(form.penalty) || 0),
        late_fee_paise: rupeesToP(Number(form.late_fee) || 0),
        total_due_paise: 0,
        amount_paid_paise: 0,
        computation_data: {},
        ai_computation: false,
        is_paid: false,
        is_nil_return: false,
      });
      setShowAdd(false);
    } finally { setSaving(false); }
  };

  const handleCompute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cForm.entity_id || !cForm.period_start || !cForm.due_date) { toast.error('Fill all fields'); return; }
    await computeAndCreate(
      cForm.entity_id,
      cForm.tax_type,
      cForm.period_start,
      cForm.period_end || cForm.period_start,
      cForm.due_date,
      cForm.tax_label || `${TAX_TYPE_META[cForm.tax_type]?.label} — ${new Date(cForm.period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`,
      { turnover: Number(cForm.turnover) || 0, itc_available: Number(cForm.itc_available) || 0 }
    );
    setShowComputeDialog(false);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayDialog) return;
    const amountPaise = rupeesToP(Number(payForm.amount) || Number(pToRupees(showPayDialog.balance_due_paise)));
    if (amountPaise <= 0) { toast.error('Enter valid amount'); return; }

    // ── Demo mode: mark paid locally ──────────────────────────────────────
    if (isDemoMode) {
      demo.markPaid(showPayDialog.id, amountPaise, payForm.gateway);
      setShowPayDialog(null);
      return;
    }

    if (payForm.gateway === 'razorpay') {
      const result = await initiateOnline(showPayDialog.id, amountPaise, showPayDialog.tax_label, showPayDialog.entity_id);
      if (result?.order_id && result.key_id) {
        // Razorpay SDK integration
        const options = {
          key: result.key_id,
          amount: amountPaise,
          currency: 'INR',
          name: 'SANNIDH Tax Payment',
          description: showPayDialog.tax_label,
          order_id: result.order_id,
          handler: async (response: any) => {
            await confirmPayment(result.transaction_id, response.razorpay_payment_id, response.razorpay_signature, response);
            toast.success('Payment successful!');
            refetch();
          },
        };
        if ((window as any).Razorpay) {
          new (window as any).Razorpay(options).open();
        } else {
          toast.info('Razorpay SDK not loaded — payment recorded as initiated', { description: 'Please verify payment in your Razorpay dashboard.' });
        }
        setShowPayDialog(null);
        return;
      }
    }

    // Manual / offline payment
    await recordManual(
      showPayDialog.id, amountPaise, payForm.gateway, showPayDialog.tax_label,
      {
        challan_number: payForm.challan_number || undefined,
        bank_reference_no: payForm.bank_reference_no || undefined,
        bank_name: payForm.bank_name || undefined,
        payment_mode: payForm.payment_mode,
        payment_date: payForm.payment_date,
        bsr_code: payForm.bsr_code || undefined,
        challan_serial_no: payForm.challan_serial_no || undefined,
      },
      showPayDialog.entity_id
    );
    setShowPayDialog(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search liabilities…" className="pl-9 bg-card/50 border-border/50" />
        </div>
        <Select value={filterPaid} onValueChange={v => setFilterPaid(v as any)}>
          <SelectTrigger className="w-32 bg-card/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 bg-card/50 border-border/50">
            <SelectValue placeholder="Tax Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TAX_TYPE_META).map(([v, m]) => (
              <SelectItem key={v} value={v}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={refetch} className="border-border/50">
          <RefreshCw className="w-4 h-4" />
        </Button>

        <div className="ml-auto flex gap-2">
          {/* Auto-Compute */}
          <Dialog open={showComputeDialog} onOpenChange={setShowComputeDialog}>
            <DialogTrigger asChild>
              <Button disabled={!isRunning} variant="outline" className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10">
                <Zap className="w-4 h-4 mr-2" /> Auto-Compute
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border/50">
              <DialogHeader>
                <DialogTitle className="text-purple-400 flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Auto-Compute Tax Liability
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCompute} className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Entity *</Label>
                  <Select value={cForm.entity_id} onValueChange={v => setC('entity_id', v)}>
                    <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map(e => <SelectItem key={e.id} value={e.id}>{e.entity_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tax Type *</Label>
                    <Select value={cForm.tax_type} onValueChange={v => setC('tax_type', v)}>
                      <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TAX_TYPE_META).map(([v, m]) => (
                          <SelectItem key={v} value={v}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Due Date *</Label>
                    <Input type="date" value={cForm.due_date} onChange={e => setC('due_date', e.target.value)} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Period Start *</Label>
                    <Input type="date" value={cForm.period_start} onChange={e => setC('period_start', e.target.value)} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Period End *</Label>
                    <Input type="date" value={cForm.period_end} onChange={e => setC('period_end', e.target.value)} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Taxable Turnover (₹)</Label>
                    <Input type="number" value={cForm.turnover} onChange={e => setC('turnover', e.target.value)} placeholder="0.00" className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">ITC Available (₹)</Label>
                    <Input type="number" value={cForm.itc_available} onChange={e => setC('itc_available', e.target.value)} placeholder="0.00" className="mt-1 bg-card/50 border-border/50" />
                  </div>
                </div>
                <Button type="submit" disabled={computing} className="w-full bg-purple-600 hover:bg-purple-700">
                  {computing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Computing…</> : <><Zap className="w-4 h-4 mr-2" />Compute & Add</>}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Manual Add */}
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button disabled={!isRunning} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" /> Add Liability
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border/50 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-green-400 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" /> Add Tax Liability
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Label *</Label>
                  <Input value={form.tax_label} onChange={e => set('tax_label', e.target.value)} placeholder="e.g. GSTR-3B CGST July 2026" className="mt-1 bg-card/50 border-border/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Entity</Label>
                    <Select value={form.entity_id} onValueChange={v => set('entity_id', v)}>
                      <SelectTrigger className="mt-1 bg-card/50 border-border/50"><SelectValue placeholder="Select entity" /></SelectTrigger>
                      <SelectContent>{entities.map(e => <SelectItem key={e.id} value={e.id}>{e.entity_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tax Type *</Label>
                    <Select value={form.tax_type} onValueChange={v => set('tax_type', v)}>
                      <SelectTrigger className="mt-1 bg-card/50 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(TAX_TYPE_META).map(([v, m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Period Start *</Label>
                    <Input type="date" value={form.period_start} onChange={e => set('period_start', e.target.value)} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Period End</Label>
                    <Input type="date" value={form.period_end} onChange={e => set('period_end', e.target.value)} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Due Date *</Label>
                    <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Gross Liability (₹) *</Label>
                    <Input type="number" value={form.gross_liability} onChange={e => set('gross_liability', e.target.value)} placeholder="0.00" className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">ITC Available (₹)</Label>
                    <Input type="number" value={form.itc_available} onChange={e => set('itc_available', e.target.value)} placeholder="0.00" className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Interest (₹)</Label>
                    <Input type="number" value={form.interest} onChange={e => set('interest', e.target.value)} placeholder="0.00" className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Late Fee (₹)</Label>
                    <Input type="number" value={form.late_fee} onChange={e => set('late_fee', e.target.value)} placeholder="0.00" className="mt-1 bg-card/50 border-border/50" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Liabilities Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/40 rounded-xl text-muted-foreground">
          <IndianRupee className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">{liabilities.length === 0 ? 'No liabilities yet' : 'No liabilities match filter'}</p>
          <p className="text-sm mt-1">Add a liability manually or use Auto-Compute</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-card/50">
                <TableHead className="w-5"></TableHead>
                <TableHead className="text-muted-foreground">Label / Entity</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Due Date</TableHead>
                <TableHead className="text-muted-foreground text-right">Total Due</TableHead>
                <TableHead className="text-muted-foreground text-right">Balance</TableHead>
                <TableHead className="text-muted-foreground text-center">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l, idx) => {
                const due = daysUntilDue(l.due_date);
                const m = TAX_TYPE_META[l.tax_type];
                const isExpanded = expandedRow === l.id;
                return (
                  <>
                    <TableRow
                      key={l.id}
                      className="border-border/20 hover:bg-card/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(isExpanded ? null : l.id)}
                    >
                      <TableCell className="py-3">
                        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="font-medium text-sm">{l.tax_label}</p>
                        {l.entity_name && <p className="text-xs text-muted-foreground">{l.entity_name}</p>}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={`text-xs ${m?.color}`}>{m?.label}</Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div>
                          <p className="text-sm">{new Date(l.due_date).toLocaleDateString('en-IN')}</p>
                          {!l.is_paid && <p className={`text-xs font-medium ${due.color}`}>{due.label}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-sm">{formatRupees(l.total_due_paise)}</TableCell>
                      <TableCell className="py-3 text-right">
                        <span className={`font-mono text-sm font-semibold ${l.is_paid ? 'text-green-400' : 'text-red-400'}`}>
                          {l.is_paid ? '—' : formatRupees(l.balance_due_paise)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        {l.is_paid ? (
                          <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
                        ) : l.is_nil_return ? (
                          <Badge variant="outline" className="border-gray-500/30 text-gray-400 text-xs">Nil Return</Badge>
                        ) : (
                          <Badge variant="outline" className={`text-xs ${due.days < 0 ? 'border-red-500/30 text-red-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                            {due.days < 0 ? 'Overdue' : 'Pending'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          {l.is_paid ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs h-7 gap-1"
                              onClick={() => handleViewReceipt(l)}
                            >
                              <FileText className="w-3.5 h-3.5" /> Receipt
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-xs h-7"
                              disabled={isDemoMode ? false : !isRunning}
                              onClick={() => { setShowPayDialog(l); setPayForm(f => ({ ...f, amount: pToRupees(l.balance_due_paise) })); }}
                            >
                              <CreditCard className="w-3 h-3 mr-1" />Pay
                            </Button>
                          )}
                          <Button disabled={!isRunning} size="icon" variant="ghost" className="w-7 h-7 text-red-400 hover:bg-red-500/10" onClick={() => removeLiability(l.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr key={`${l.id}-exp`}>
                          <td colSpan={8} className="p-0 border-border/20">
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="px-6 py-4 bg-card/10 border-t border-border/20">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                  {[
                                    { label: 'Gross Liability', value: formatRupees(l.gross_liability_paise) },
                                    { label: 'ITC Available', value: formatRupees(l.itc_available_paise), cls: 'text-green-400' },
                                    { label: 'Net Liability', value: formatRupees(l.net_liability_paise) },
                                    { label: 'Interest', value: formatRupees(l.interest_paise), cls: l.interest_paise > 0 ? 'text-red-400' : '' },
                                    { label: 'Late Fee', value: formatRupees(l.late_fee_paise), cls: l.late_fee_paise > 0 ? 'text-red-400' : '' },
                                  ].map(item => (
                                    <div key={item.label}>
                                      <p className="text-xs text-muted-foreground">{item.label}</p>
                                      <p className={`font-mono font-semibold ${item.cls ?? ''}`}>{item.value}</p>
                                    </div>
                                  ))}
                                </div>
                                {l.ai_notes && (
                                  <div className="mt-3 p-3 rounded bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                                    <span className="font-semibold">AI Notes: </span>{l.ai_notes}
                                  </div>
                                )}
                                {l.bsr_code && (
                                  <div className="mt-3 p-3 rounded bg-green-500/10 border border-green-500/20 text-xs text-green-300 grid grid-cols-3 gap-2">
                                    <div><span className="text-muted-foreground">BSR Code: </span>{l.bsr_code}</div>
                                    <div><span className="text-muted-foreground">Challan S/N: </span>{l.challan_serial_no}</div>
                                    <div><span className="text-muted-foreground">Challan Date: </span>{l.challan_date}</div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={!!showPayDialog} onOpenChange={o => !o && setShowPayDialog(null)}>
        <DialogContent className="bg-background border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Record Payment
            </DialogTitle>
          </DialogHeader>
          {showPayDialog && (
            <form onSubmit={handlePay} className="space-y-4">
              <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-sm">
                <p className="font-medium">{showPayDialog.tax_label}</p>
                <p className="text-muted-foreground text-xs mt-1">Balance due: <span className="text-red-400 font-semibold">{formatRupees(showPayDialog.balance_due_paise)}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Payment Mode *</Label>
                  <Select value={payForm.gateway} onValueChange={v => setP('gateway', v)}>
                    <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GATEWAY_META).map(([v, m]) => (
                        <SelectItem key={v} value={v}>{m.icon} {m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Amount (₹) *</Label>
                  <Input type="number" value={payForm.amount} onChange={e => setP('amount', e.target.value)} placeholder={pToRupees(showPayDialog.balance_due_paise)} className="mt-1 bg-card/50 border-border/50" />
                </div>
                {payForm.gateway !== 'razorpay' && (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">Payment Date</Label>
                      <Input type="date" value={payForm.payment_date} onChange={e => setP('payment_date', e.target.value)} className="mt-1 bg-card/50 border-border/50" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Bank / UTR Ref</Label>
                      <Input value={payForm.bank_reference_no} onChange={e => setP('bank_reference_no', e.target.value)} placeholder="Bank reference / UTR" className="mt-1 bg-card/50 border-border/50" />
                    </div>
                    {['challan_offline', 'neft', 'rtgs'].includes(payForm.gateway) && (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground">Challan Number</Label>
                          <Input value={payForm.challan_number} onChange={e => setP('challan_number', e.target.value)} className="mt-1 bg-card/50 border-border/50" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">BSR Code</Label>
                          <Input value={payForm.bsr_code} onChange={e => setP('bsr_code', e.target.value)} maxLength={7} className="mt-1 bg-card/50 border-border/50 font-mono" />
                        </div>
                      </>
                    )}
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Bank Name</Label>
                      <Input value={payForm.bank_name} onChange={e => setP('bank_name', e.target.value)} className="mt-1 bg-card/50 border-border/50" />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={recording || (initiating === showPayDialog.id)} className="flex-1 bg-green-600 hover:bg-green-700">
                  {(recording || initiating === showPayDialog.id)
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <CreditCard className="w-4 h-4 mr-2" />}
                  {payForm.gateway === 'razorpay' ? 'Pay Online' : 'Record Payment'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowPayDialog(null)}>Cancel</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Transactions Tab ─────────────────────────────────────────────────────────

const TransactionsTab = ({ caUserId }: { caUserId: string }) => {
  const { transactions, loading, refetch } = usePaymentTransactions(caUserId);
  const { liabilities } = useTaxLiabilities(caUserId);
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  const handleViewReceiptFromTxn = (t: any) => {
    const l = liabilities.find(liab => liab.id === t.liability_id);
    if (l) {
      localStorage.setItem('payment_pdf_liability', JSON.stringify({
        ...l,
        amount_paid_paise: t.amount_paise,
        payment_date: t.payment_date || t.created_at,
        bank_reference_no: t.bank_reference_no || t.gateway_payment_id,
        challan_number: t.challan_number,
      }));
    } else {
      localStorage.setItem('payment_pdf_liability', JSON.stringify({
        id: t.liability_id || t.id,
        tax_label: t.description,
        tax_type: 'other',
        total_due_paise: t.amount_paise,
        amount_paid_paise: t.amount_paise,
        balance_due_paise: 0,
        is_paid: true,
        payment_date: t.payment_date || t.created_at,
        bank_reference_no: t.bank_reference_no || t.gateway_payment_id,
        challan_number: t.challan_number,
      }));
    }
    navigate('/ca-dashboard/payment-challan-pdf');
  };

  useEffect(() => {
    const handleReload = () => {
      refetch();
    };
    window.addEventListener('swarm-completed-event', handleReload);
    window.addEventListener('swarm-status-changed', handleReload);
    window.addEventListener('ca:metrics-updated', handleReload);
    window.addEventListener('sannidh:history-updated', handleReload);
    window.addEventListener('storage', handleReload);
    return () => {
      window.removeEventListener('swarm-completed-event', handleReload);
      window.removeEventListener('swarm-status-changed', handleReload);
      window.removeEventListener('ca:metrics-updated', handleReload);
      window.removeEventListener('sannidh:history-updated', handleReload);
      window.removeEventListener('storage', handleReload);
    };
  }, [refetch]);

  const STATUS_TXNMETA: Record<string, { label: string; color: string }> = {
    pending:        { label: 'Pending',    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    initiated:      { label: 'Initiated',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    processing:     { label: 'Processing', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    success:        { label: 'Success',    color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    failed:         { label: 'Failed',     color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    refunded:       { label: 'Refunded',   color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    partially_paid: { label: 'Partial',    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    cancelled:      { label: 'Cancelled',  color: 'bg-gray-600/20 text-gray-500 border-gray-600/30' },
  };

  const filtered = transactions.filter(t =>
    search === '' || t.description.toLowerCase().includes(search.toLowerCase()) || (t.challan_number ?? '').includes(search) || (t.bank_reference_no ?? '').includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions…" className="pl-9 bg-card/50 border-border/50" />
        </div>
        <Button variant="outline" size="icon" onClick={refetch}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/40 rounded-xl text-muted-foreground">
          <ReceiptText className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No transactions yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-card/50 border-border/40">
                <TableHead className="text-muted-foreground">Description</TableHead>
                <TableHead className="text-muted-foreground">Gateway</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground">Ref / Challan</TableHead>
                <TableHead className="text-muted-foreground text-center">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(txn => {
                const gw = GATEWAY_META[txn.gateway];
                const sm = STATUS_TXNMETA[txn.status];
                return (
                  <TableRow key={txn.id} className="border-border/20 hover:bg-card/20">
                    <TableCell className="py-3 text-sm max-w-[200px] truncate">{txn.description}</TableCell>
                    <TableCell className="py-3 text-sm">{gw?.icon} {gw?.label}</TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      {txn.payment_date ? new Date(txn.payment_date).toLocaleDateString('en-IN') : new Date(txn.created_at).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono font-semibold text-sm">{formatRupees(txn.amount_paise)}</TableCell>
                    <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                      {txn.challan_number ?? txn.bank_reference_no ?? txn.gateway_payment_id ?? '—'}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Badge variant="outline" className={`text-xs ${sm?.color}`}>{sm?.label}</Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      {txn.status === 'success' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10 text-xs h-7 gap-1"
                          onClick={() => handleViewReceiptFromTxn(txn)}
                        >
                          <FileText className="w-3.5 h-3.5" /> Receipt
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// ─── Reconciliation Tab ───────────────────────────────────────────────────────

const ReconciliationTab = ({ caUserId }: { caUserId: string }) => {
  const { entries, loading, matching, importBankRow, matchEntry, refetch } = useReconciliation(caUserId);
  const { transactions } = usePaymentTransactions(caUserId, { status: 'success' });
  const { liabilities } = useTaxLiabilities(caUserId);

  const { isRunning, isAutoMode } = useSafeSwarmState();

  useEffect(() => {
    const handleReload = () => {
      refetch();
    };
    window.addEventListener('swarm-completed-event', handleReload);
    window.addEventListener('swarm-status-changed', handleReload);
    window.addEventListener('ca:metrics-updated', handleReload);
    window.addEventListener('sannidh:history-updated', handleReload);
    window.addEventListener('storage', handleReload);
    return () => {
      window.removeEventListener('swarm-completed-event', handleReload);
      window.removeEventListener('swarm-status-changed', handleReload);
      window.removeEventListener('ca:metrics-updated', handleReload);
      window.removeEventListener('sannidh:history-updated', handleReload);
      window.removeEventListener('storage', handleReload);
    };
  }, [refetch]);

  // Autonomous Swarm Auto-Reconciliation Agent Loop
  useEffect(() => {
    const unmatchedList = entries.filter(e => !e.is_matched);
    if (!isRunning || !isAutoMode || unmatchedList.length === 0) return;

    // Find high confidence unmatched entry (>= 80%) with a liability_id mapping
    const entryToMatch = unmatchedList.find(e => (e.match_confidence ?? 0) >= 0.80 && e.liability_id);
    if (!entryToMatch) return;

    // Find a matching successful transaction and target liability
    const matchingTxn = transactions.find(t => t.liability_id === entryToMatch.liability_id && t.status === 'success');
    const matchingLiab = liabilities.find(l => l.id === entryToMatch.liability_id);

    if (!matchingTxn || !matchingLiab) return;

    const timer = setTimeout(async () => {
      try {
        toast.info(`[Swarm Agent] Reconciling bank txn: ₹${(entryToMatch.bank_txn_amount_paise / 100).toLocaleString('en-IN')}...`, {
          description: `Auto-matching with ledger transaction: ${matchingTxn.description}`,
        });

        await matchEntry(entryToMatch.id, matchingTxn.id, matchingLiab.id);

        toast.success(`[Swarm Agent] Successfully reconciled bank statement row!`, {
          description: `Matched & locked to ${matchingLiab.tax_label}.`,
        });

        // Dispatch global sync events
        window.dispatchEvent(new CustomEvent('ca:metrics-updated'));
        window.dispatchEvent(new CustomEvent('swarm-completed-event'));
        window.dispatchEvent(new CustomEvent('sannidh:history-updated'));
        window.dispatchEvent(new CustomEvent('storage'));

        refetch();
      } catch (err: any) {
        console.error('Autonomous reconciliation agent error:', err);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isRunning, isAutoMode, entries, transactions, liabilities, matchEntry, refetch]);

  const [showImport, setShowImport] = useState(false);
  const [importForm, setImportForm] = useState({ bank_txn_date: '', bank_txn_amount: '', bank_narration: '', bank_reference: '' });
  const [saving, setSaving] = useState(false);
  const [matchingId, setMatchingId] = useState('');
  const [matchTxnId, setMatchTxnId] = useState('');
  const [matchLiabId, setMatchLiabId] = useState('');

  const unmatched = entries.filter(e => !e.is_matched);
  const matched = entries.filter(e => e.is_matched);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.bank_txn_date || !importForm.bank_txn_amount) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await importBankRow({
        bank_txn_date: importForm.bank_txn_date,
        bank_txn_amount_paise: rupeesToP(Number(importForm.bank_txn_amount)),
        bank_narration: importForm.bank_narration || undefined,
        bank_reference: importForm.bank_reference || undefined,
      } as any);
      setShowImport(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Bank Reconciliation</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Match bank transactions with recorded tax payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refetch}><RefreshCw className="w-4 h-4" /></Button>
          <Dialog open={showImport} onOpenChange={setShowImport}>
            <DialogTrigger asChild>
              <Button disabled={!isRunning} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" /> Import Bank Row</Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border/50">
              <DialogHeader>
                <DialogTitle className="text-blue-400 flex items-center gap-2"><Landmark className="w-5 h-5" />Import Bank Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleImport} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Date *</Label>
                    <Input type="date" value={importForm.bank_txn_date} onChange={e => setImportForm(f => ({ ...f, bank_txn_date: e.target.value }))} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount (₹) *</Label>
                    <Input type="number" value={importForm.bank_txn_amount} onChange={e => setImportForm(f => ({ ...f, bank_txn_amount: e.target.value }))} placeholder="0.00" className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Bank Narration</Label>
                    <Input value={importForm.bank_narration} onChange={e => setImportForm(f => ({ ...f, bank_narration: e.target.value }))} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Bank Reference</Label>
                    <Input value={importForm.bank_reference} onChange={e => setImportForm(f => ({ ...f, bank_reference: e.target.value }))} className="mt-1 bg-card/50 border-border/50 font-mono" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanLine className="w-4 h-4 mr-2" />}Import
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Imported', value: entries.length, color: 'blue' },
          { label: 'Matched', value: matched.length, color: 'green' },
          { label: 'Unmatched', value: unmatched.length, color: 'red' },
        ].map(c => (
          <div key={c.label} className={`p-4 rounded-xl border bg-${c.color}-500/5 border-${c.color}-500/20 text-center`}>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-3xl font-bold text-${c.color}-400`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Unmatched entries */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : unmatched.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/40 rounded-xl text-muted-foreground">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
          <p className="font-medium">All transactions matched!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Unmatched Bank Transactions</h4>
          {unmatched.map(entry => (
            <div key={entry.id} className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">{formatRupees(entry.bank_txn_amount_paise)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(entry.bank_txn_date).toLocaleDateString('en-IN')} · {entry.bank_narration ?? entry.bank_reference ?? 'No narration'}</p>
                </div>
                <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-xs">Unmatched</Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={matchingId === entry.id ? matchTxnId : ''} onValueChange={setMatchTxnId}>
                  <SelectTrigger className="w-52 bg-card/50 border-border/50 text-xs h-8">
                    <SelectValue placeholder="Select transaction…" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactions.map(t => (
                      <SelectItem key={t.id} value={t.id}>{formatRupees(t.amount_paise)} · {t.description.substring(0, 30)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={matchingId === entry.id ? matchLiabId : ''} onValueChange={setMatchLiabId}>
                  <SelectTrigger className="w-52 bg-card/50 border-border/50 text-xs h-8">
                    <SelectValue placeholder="Select liability…" />
                  </SelectTrigger>
                  <SelectContent>
                    {liabilities.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.tax_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!matchTxnId || !matchLiabId || matching === entry.id || !isRunning}
                  onClick={() => {
                    setMatchingId(entry.id);
                    matchEntry(entry.id, matchTxnId, matchLiabId).then(() => {
                      setMatchTxnId(''); setMatchLiabId(''); setMatchingId('');
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                >
                  {matching === entry.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                  Match
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PaymentTaxLiability = () => {
  const [caUserId, setCaUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Detect demo mode — the /ca-dashboard route never has a real Supabase session
  const isDemoMode = typeof window !== 'undefined' &&
    (window.location.pathname === '/ca-dashboard' ||
     window.location.pathname.startsWith('/ca-dashboard/'));

  useEffect(() => {
    if (isDemoMode) {
      // Use a stable demo ID so hooks don't keep re-fetching
      setCaUserId('demo-mode');
    } else {
      supabase.auth.getUser().then(({ data }) => setCaUserId(data.user?.id ?? null));
    }
  }, [isDemoMode]);

  const { isRunning, isAutoMode } = useSafeSwarmState();

  if (!caUserId) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-green-400" /></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10 border border-green-500/20">
        <div className="flex items-center gap-3 mb-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-400">Payment & Tax-Liability Automation</h2>
              <p className="text-sm text-muted-foreground">
                Auto-compute GST, TDS, Income Tax, EPF liabilities — pay online or record manual — reconcile bank statements
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Swarm Status Indicator */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tracking-wide ${
              isRunning 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              SWARM: {isRunning ? 'ONLINE' : 'OFFLINE'}
            </div>

            {/* Automation Mode Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-xs font-semibold tracking-wide">
              <Zap className="w-3.5 h-3.5" />
              MODE: {isAutoMode ? 'AUTOMATIC' : 'MANUAL'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {['GST Auto-Compute', 'TDS/TCS', 'Advance Tax', 'Razorpay Integration', 'Bank Reconciliation', 'Smart Reminders'].map(f => (
            <Badge key={f} variant="outline" className="border-green-500/30 text-green-400 text-xs">{f}</Badge>
          ))}
        </div>
      </div>

      {/* Swarm Offline Warning Banner */}
      {!isRunning && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 shadow-lg backdrop-blur-md">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-rose-400">AI Swarm Engine Offline</h4>
            <p className="text-xs text-muted-foreground mt-1">
              All automated tax liability calculations, online challan/Razorpay dispatch, and bank transaction reconciliations are paused. 
              Please turn on the <strong>AI Swarm Engine</strong> in your profile settings to resume background auto-settlement.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-12 bg-card/40 border border-border/50">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 gap-2">
            <BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="liabilities" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 gap-2">
            <IndianRupee className="w-4 h-4" /><span className="hidden sm:inline">Liabilities</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 gap-2">
            <ReceiptText className="w-4 h-4" /><span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 gap-2">
            <ScanLine className="w-4 h-4" /><span className="hidden sm:inline">Reconciliation</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6"><DashboardTab caUserId={caUserId} isDemoMode={isDemoMode} /></TabsContent>
        <TabsContent value="liabilities" className="mt-6"><LiabilitiesTab caUserId={caUserId} isDemoMode={isDemoMode} /></TabsContent>
        <TabsContent value="transactions" className="mt-6"><TransactionsTab caUserId={isDemoMode ? null : caUserId} /></TabsContent>
        <TabsContent value="reconciliation" className="mt-6"><ReconciliationTab caUserId={isDemoMode ? null : caUserId} /></TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default PaymentTaxLiability;
