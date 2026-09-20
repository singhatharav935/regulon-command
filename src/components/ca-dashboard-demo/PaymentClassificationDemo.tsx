// ============================================================
// PaymentClassificationDemo.tsx
// DEMO CA Dashboard — Payment Classification Engine UI
// Uses MOCK / SEED data only (demo clients added via Add Client)
// Features: Reason for Tagging | Materiality Lock | Audit Trail
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Tags, RefreshCw, Download, Edit3, Check, X, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, Filter,
  Search, Sparkles, IndianRupee, BarChart3, Eye, Shield, HelpCircle,
  Users, Home, CreditCard, Receipt, Zap, Utensils, Car,
  Briefcase, Building2, ArrowLeftRight, Landmark, Package, Heart,
  Lock, Unlock, Hash, AlertTriangle, Info, CheckSquare, Fingerprint, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  generateMockTransactions,
  summarizeByCategory,
  getMonthlyTrends,
  saveCategoryOverride,
  clearAllOverrides,
  computeLedgerHash,
  saveAuditLock,
  loadAuditLock,
  clearAuditLock,
  CATEGORY_COLORS,
  type DemoTransaction,
  type PaymentCategory,
  type AuditLock,
} from './payment-classification-engine-demo';

// ── Category icon map ─────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Users, Home, CreditCard, Receipt, Zap, Utensils, Car,
  Briefcase, Building2, ArrowLeftRight, Landmark, Package, Heart, HelpCircle,
  TrendingUp,
};

const ALL_CATEGORIES: PaymentCategory[] = [
  'Salary / Payroll', 'Rent / Lease', 'Loan / EMI', 'GST Payments',
  'Utilities', 'Food & Dining', 'Travel', 'Business Expenses',
  'Capital Expenditure', 'Inter-Company Transfer', 'Tax Payments',
  'Vendor / Supplier', 'Insurance', 'Investment / SIP', 'Uncategorized',
];

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const formatMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

// ── Confidence badge ──────────────────────────────────────────
const ConfidenceBadge: React.FC<{ score: number; isOverridden?: boolean }> = ({ score, isOverridden }) => {
  if (isOverridden) {
    return (
      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
        <Shield className="w-3 h-3 mr-1" /> CA Override
      </Badge>
    );
  }
  if (score >= 90) return <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">{score}% Auto</Badge>;
  if (score >= 70) return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">{score}% Auto</Badge>;
  return <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">{score}% Auto</Badge>;
};

// ── Custom Pie tooltip ────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold text-foreground">{payload[0].name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatINR(payload[0].value)}</p>
        <p className="text-xs text-cyan-400">{payload[0].payload.count} transactions</p>
      </div>
    );
  }
  return null;
};

// ── Custom Bar tooltip ────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-xs mt-0.5" style={{ color: p.color }}>
            {p.name}: {formatINR(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Reason-for-Tagging expandable tooltip ─────────────────────
const ReasonBadge: React.FC<{ reason: string }> = ({ reason }) => {
  const [open, setOpen] = useState(false);
  const shortReason = reason.split('·')[0].trim();
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-300 transition-colors group"
        title="Why was this tagged?"
      >
        <Info className="w-3 h-3 flex-shrink-0" />
        <span className="hidden md:inline truncate max-w-[160px]">{shortReason}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute z-50 bottom-full mb-2 left-0 w-80 p-3 bg-zinc-900 border border-amber-500/30 rounded-xl shadow-2xl text-left"
          >
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-amber-300 mb-1">Why this category?</p>
                <p className="text-[10px] text-zinc-300 leading-relaxed">{reason}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Materiality warning badge ─────────────────────────────────
const MaterialityBadge: React.FC<{ amount: number; threshold: number }> = ({ amount, threshold }) => {
  if (amount <= threshold) return null;
  return (
    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[10px] px-1.5 py-0.5">
      <Lock className="w-2.5 h-2.5 mr-1" /> Sign-Off Required
    </Badge>
  );
};

interface Props {
  clientId: string;
  clientName: string;
  financialYear: string;
}

export default function PaymentClassificationDemo({ clientId, clientName, financialYear }: Props) {
  const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'audit'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<PaymentCategory>('Uncategorized');
  const [isLoading, setIsLoading] = useState(true);

  // ── Feature 2: Materiality Threshold ──────────────────────
  const [materialityThreshold, setMaterialityThreshold] = useState<number>(() => {
    if (typeof window === 'undefined') return 20000;
    return parseInt(localStorage.getItem(`materiality_${clientId}`) || '20000', 10);
  });
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(materialityThreshold.toString());

  // ── Feature 3: Audit Trail ─────────────────────────────────
  const [auditLock, setAuditLock] = useState<AuditLock | null>(null);
  const [currentHash, setCurrentHash] = useState<string>('');
  const [isHashing, setIsHashing] = useState(false);
  const [hashTampered, setHashTampered] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const txns = generateMockTransactions(clientId, clientName, financialYear);
      setTransactions(txns);
      setIsLoading(false);
      // Load existing audit lock
      const lock = loadAuditLock(clientId, financialYear);
      setAuditLock(lock);
    }, 600);
  }, [clientId, clientName, financialYear]);

  // Recompute current hash whenever transactions change and a lock exists
  useEffect(() => {
    if (auditLock && transactions.length > 0) {
      computeLedgerHash(transactions).then(h => {
        setCurrentHash(h);
        setHashTampered(h !== auditLock.hash);
      });
    }
  }, [transactions, auditLock]);

  const summary = useMemo(() => summarizeByCategory(transactions), [transactions]);
  const monthlyTrends = useMemo(() => getMonthlyTrends(transactions), [transactions]);

  const totalDebit = useMemo(() =>
    transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalCredit = useMemo(() =>
    transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0), [transactions]);
  const autoClassified = useMemo(() =>
    transactions.filter(t => !t.caOverride && t.confidence >= 80).length, [transactions]);

  // Materiality: count transactions needing sign-off
  const needsSignOff = useMemo(() =>
    transactions.filter(t => t.type === 'debit' && t.amount > materialityThreshold && !t.caOverride).length,
    [transactions, materialityThreshold]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = !searchQuery ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.narration.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = filterCategory === 'all' || (tx.caOverride ?? tx.category) === filterCategory;
      const matchesType = filterType === 'all' || tx.type === filterType;
      return matchesSearch && matchesCat && matchesType;
    });
  }, [transactions, searchQuery, filterCategory, filterType]);

  const handleSaveOverride = (txn: DemoTransaction) => {
    const idx = transactions.findIndex(t => t.id === txn.id);
    if (idx === -1) return;
    saveCategoryOverride(clientId, txn.id, overrideCategory);
    setTransactions(prev => prev.map((t, i) =>
      i === idx ? { ...t, caOverride: overrideCategory } : t
    ));
    setEditingId(null);
    toast.success(`Category updated to "${overrideCategory}"`, { description: 'Saved to your session.' });
  };

  const handleResetOverrides = () => {
    clearAllOverrides(clientId, transactions.length);
    const fresh = generateMockTransactions(clientId, clientName, financialYear);
    setTransactions(fresh);
    toast.success('All CA overrides cleared', { description: 'Reverted to AI classifications.' });
  };

  const handleExport = () => {
    const rows = ['Date,Description,Amount,Type,Category,Confidence,Reason,CA Override'];
    transactions.forEach(tx => {
      rows.push([
        tx.date, `"${tx.description}"`, tx.amount,
        tx.type, tx.caOverride ?? tx.category,
        tx.caOverride ? 'Manual' : `${tx.confidence}%`,
        `"${tx.classificationReason}"`,
        tx.caOverride ? tx.caOverride : ''
      ].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payment_Classification_${clientName.replace(/\s+/g, '_')}_${financialYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Classification report exported as CSV');
  };

  // ── Feature 2: Save materiality threshold ─────────────────
  const handleSaveThreshold = () => {
    const val = parseInt(thresholdInput, 10);
    if (isNaN(val) || val < 0) {
      toast.error('Enter a valid positive amount');
      return;
    }
    setMaterialityThreshold(val);
    localStorage.setItem(`materiality_${clientId}`, val.toString());
    setEditingThreshold(false);
    toast.success(`Materiality threshold set to ${formatINR(val)}`, {
      description: 'Transactions above this amount require CA sign-off.',
    });
  };

  // ── Feature 3: Finalize ledger (compute + store hash) ─────
  const handleFinalizeLedger = async () => {
    if (needsSignOff > 0) {
      toast.error(`${needsSignOff} transaction(s) above ₹${materialityThreshold.toLocaleString('en-IN')} need CA sign-off first`, {
        description: 'Approve or re-categorise high-value transactions before finalising.',
      });
      return;
    }
    setIsHashing(true);
    try {
      const hash = await computeLedgerHash(transactions);
      const lock: AuditLock = {
        hash,
        finalizedAt: new Date().toISOString(),
        transactionCount: transactions.length,
        caUser: 'Demo CA User',
      };
      saveAuditLock(clientId, financialYear, lock);
      setAuditLock(lock);
      setCurrentHash(hash);
      setHashTampered(false);
      setActiveTab('audit');
      toast.success('Ledger finalised — Audit Trail locked', {
        description: `SHA-256 hash recorded. ${transactions.length} transactions sealed.`,
      });
    } catch {
      toast.error('Failed to compute hash');
    } finally {
      setIsHashing(false);
    }
  };

  const handleUnlockAudit = () => {
    clearAuditLock(clientId, financialYear);
    setAuditLock(null);
    setCurrentHash('');
    setHashTampered(false);
    toast('Audit lock removed', { description: 'Ledger is now editable again.' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
          </div>
          <p className="text-sm text-violet-400 font-medium">AI Classification Engine running...</p>
          <p className="text-xs text-muted-foreground">Analysing bank transactions for {clientName}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Audit Tamper Warning Banner ── */}
      <AnimatePresence>
        {hashTampered && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/40 rounded-2xl"
          >
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">⚠️ Audit Trail Compromised</p>
              <p className="text-xs text-red-300/80 mt-0.5">
                Post-verification modifications detected. The current ledger hash does not match
                the sealed hash. Please review changes or unlock and re-finalise.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Feature 2: Materiality Sign-Off Warning ── */}
      <AnimatePresence>
        {needsSignOff > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl"
          >
            <Lock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-300">
                {needsSignOff} transaction{needsSignOff > 1 ? 's' : ''} above {formatINR(materialityThreshold)} — CA Sign-Off Required
              </p>
              <p className="text-xs text-orange-300/70 mt-0.5">
                Per your materiality threshold, high-value debits must be manually reviewed before ledger can be finalised.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-orange-400 underline flex-shrink-0"
            >
              Review
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-5 bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10 border border-violet-500/20 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/20 rounded-xl">
            <Tags className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              Payment Classification
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                <Sparkles className="w-3 h-3 mr-1" /> AI-Powered
              </Badge>
              {auditLock && !hashTampered && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                  <Lock className="w-3 h-3 mr-1" /> Ledger Sealed
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              Auto-categorised bank transactions for {clientName} · FY {financialYear}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleResetOverrides} className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Reset Overrides
          </Button>
          <Button size="sm" onClick={handleExport} className="gap-2 bg-violet-600 hover:bg-violet-700 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          {auditLock ? (
            <Button size="sm" variant="outline" onClick={handleUnlockAudit} className="gap-2 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10">
              <Unlock className="w-3.5 h-3.5" /> Unlock Ledger
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleFinalizeLedger}
              disabled={isHashing}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-xs"
            >
              {isHashing ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Hash className="w-3.5 h-3.5" />}
              Finalise Ledger
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Debits', value: formatINR(totalDebit), icon: TrendingDown, color: 'red' },
          { label: 'Total Credits', value: formatINR(totalCredit), icon: TrendingUp, color: 'green' },
          { label: 'Transactions', value: transactions.length, icon: BarChart3, color: 'blue' },
          { label: 'Auto-Classified', value: `${autoClassified}/${transactions.length}`, icon: CheckCircle, color: 'violet' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`p-4 bg-${color}-500/10 border border-${color}-500/20 rounded-2xl`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 text-${color}-400`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-xl font-bold text-${color}-400`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-border/40 pb-0">
        {(['overview', 'transactions', 'audit'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-all ${
              activeTab === tab
                ? 'bg-violet-500/20 text-violet-300 border border-border/40 border-b-transparent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'transactions' ? '📋 Transactions' : '🔒 Audit Trail'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* ── Feature 2: Materiality Threshold Config ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
              <div className="flex items-center gap-2 flex-1">
                <Settings className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-300">Materiality Threshold</p>
                  <p className="text-[11px] text-muted-foreground">
                    Transactions above this limit auto-require CA sign-off, regardless of AI confidence.
                  </p>
                </div>
              </div>
              {editingThreshold ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">₹</span>
                  <input
                    type="number"
                    value={thresholdInput}
                    onChange={e => setThresholdInput(e.target.value)}
                    className="w-28 px-2 py-1 bg-card/60 border border-orange-500/40 rounded-lg text-sm text-foreground focus:border-orange-400 outline-none"
                    autoFocus
                  />
                  <Button size="sm" className="h-7 px-2 bg-orange-600 hover:bg-orange-700" onClick={handleSaveThreshold}>
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditingThreshold(false); setThresholdInput(materialityThreshold.toString()); }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <span className="text-sm font-mono font-semibold text-orange-300">{formatINR(materialityThreshold)}</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-orange-500/30 text-orange-400" onClick={() => { setEditingThreshold(true); setThresholdInput(materialityThreshold.toString()); }}>
                    <Edit3 className="w-3 h-3" /> Edit
                  </Button>
                </div>
              )}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="p-5 bg-card/40 border border-border/40 rounded-2xl">
                <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-violet-400" />
                  Spending by Category
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={summary}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="totalAmount"
                      nameKey="category"
                    >
                      {summary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart — Monthly */}
              <div className="p-5 bg-card/40 border border-border/40 rounded-2xl">
                <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Monthly Cash Flow
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyTrends} barSize={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                    />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="debit" name="Outflow" fill="#ef4444" opacity={0.8} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="credit" name="Inflow" fill="#10b981" opacity={0.8} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Category Summary Table ── */}
            <div className="p-5 bg-card/40 border border-border/40 rounded-2xl">
              <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                <Tags className="w-4 h-4 text-violet-400" />
                Category Breakdown
              </h3>
              <div className="space-y-2">
                {summary.map((s) => {
                  const pct = totalDebit > 0 ? Math.round((s.totalAmount / totalDebit) * 100) : 0;
                  return (
                    <div key={s.category} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-muted-foreground w-40 flex-shrink-0 truncate">{s.category}</span>
                      <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: s.color }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                      <span className="text-xs font-mono text-foreground w-28 text-right">{formatINR(s.totalAmount)}</span>
                      <span className="text-xs text-muted-foreground w-16 text-right">{s.count} txns</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {activeTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full pl-9 pr-4 py-2 bg-card/60 border border-border/40 rounded-lg text-sm focus:border-violet-500/50 outline-none"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {ALL_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={v => setFilterType(v as any)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="debit">Debit Only</SelectItem>
                  <SelectItem value="credit">Credit Only</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{filteredTransactions.length} of {transactions.length}</span>
            </div>

            {/* ── Transaction List ── */}
            <div className="space-y-2">
              {filteredTransactions.map((tx) => {
                const effectiveCat = tx.caOverride ?? tx.category;
                const catColor = CATEGORY_COLORS[effectiveCat];
                const isEditing = editingId === tx.id;
                const isMaterial = tx.type === 'debit' && tx.amount > materialityThreshold;

                return (
                  <motion.div
                    key={tx.id}
                    layout
                    className={`p-4 bg-card/40 border rounded-xl transition-all ${
                      isMaterial && !tx.caOverride
                        ? 'border-orange-500/40 hover:border-orange-500/60'
                        : 'border-border/40 hover:border-violet-500/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-3">
                      {/* Date + Bank */}
                      <div className="flex-shrink-0 w-24">
                        <p className="text-xs font-mono text-muted-foreground">{tx.date}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{tx.bank}</p>
                      </div>

                      {/* Description + Reason */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 truncate">{tx.narration}</p>
                        {/* Feature 1: Reason for Tagging */}
                        <div className="mt-1">
                          <ReasonBadge reason={tx.classificationReason} />
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex-shrink-0 text-right w-28">
                        <p className={`text-sm font-mono font-semibold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'debit' ? '−' : '+'}{formatINR(tx.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">{tx.type}</p>
                        {/* Feature 2: Materiality badge */}
                        <MaterialityBadge amount={tx.amount} threshold={materialityThreshold} />
                      </div>

                      {/* Category + Edit */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Select
                              value={overrideCategory}
                              onValueChange={v => setOverrideCategory(v as PaymentCategory)}
                            >
                              <SelectTrigger className="w-[160px] h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_CATEGORIES.map(c => (
                                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700"
                              onClick={() => handleSaveOverride(tx)}>
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2"
                              onClick={() => setEditingId(null)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                              style={{
                                backgroundColor: catColor + '20',
                                borderColor: catColor + '40',
                                color: catColor,
                              }}
                            >
                              <span>{effectiveCat}</span>
                            </div>
                            <ConfidenceBadge score={tx.confidence} isOverridden={!!tx.caOverride} />
                            {!auditLock && (
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-violet-400"
                                onClick={() => {
                                  setEditingId(tx.id);
                                  setOverrideCategory(effectiveCat);
                                }}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {filteredTransactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Filter className="w-10 h-10 text-muted-foreground opacity-30 mb-3" />
                  <p className="text-sm text-muted-foreground">No transactions match your filters.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── AUDIT TRAIL TAB ── */}
        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {auditLock ? (
              <>
                {/* Hash status card */}
                <div className={`p-5 border rounded-2xl ${hashTampered ? 'bg-red-500/10 border-red-500/40' : 'bg-green-500/10 border-green-500/30'}`}>
                  <div className="flex items-start gap-3">
                    {hashTampered
                      ? <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                      : <CheckSquare className="w-6 h-6 text-green-400 flex-shrink-0" />
                    }
                    <div>
                      <p className={`font-semibold text-base ${hashTampered ? 'text-red-400' : 'text-green-400'}`}>
                        {hashTampered ? '⚠️ Audit Trail Compromised' : '✅ Audit Trail Intact'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {hashTampered
                          ? 'The current ledger does not match the sealed hash. Post-verification modifications detected.'
                          : 'The current ledger matches the sealed SHA-256 hash. No modifications detected since finalisation.'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lock details */}
                <div className="p-5 bg-card/40 border border-border/40 rounded-2xl space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-violet-400" /> Sealed Ledger Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Finalised At</p>
                      <p className="text-sm font-medium">{new Date(auditLock.finalizedAt).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Transaction Count</p>
                      <p className="text-sm font-medium">{auditLock.transactionCount} transactions sealed</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Financial Year</p>
                      <p className="text-sm font-medium">FY {financialYear}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">CA User</p>
                      <p className="text-sm font-medium">{auditLock.caUser || 'Demo CA User'}</p>
                    </div>
                  </div>

                  {/* Sealed hash */}
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Sealed SHA-256 Hash</p>
                    <div className="p-3 bg-zinc-900 border border-border/30 rounded-xl font-mono text-[11px] text-green-400 break-all leading-relaxed">
                      {auditLock.hash}
                    </div>
                  </div>

                  {/* Current hash */}
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Current Ledger Hash</p>
                    <div className={`p-3 border rounded-xl font-mono text-[11px] break-all leading-relaxed ${
                      hashTampered
                        ? 'bg-red-950/30 border-red-500/30 text-red-400'
                        : 'bg-zinc-900 border-border/30 text-green-400'
                    }`}>
                      {currentHash || 'Computing...'}
                    </div>
                    {hashTampered && (
                      <p className="text-[10px] text-red-400 mt-1.5">
                        ↑ Hash mismatch. Ledger was modified after finalisation.
                      </p>
                    )}
                  </div>
                </div>

                <Button variant="outline" onClick={handleUnlockAudit} className="gap-2 text-sm border-border/40">
                  <Unlock className="w-4 h-4" /> Unlock Ledger to Edit
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-5 border-2 border-dashed border-border/30 rounded-2xl bg-card/10">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Hash className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400">Ledger Not Yet Finalised</h3>
                  <p className="text-sm text-muted-foreground max-w-md mt-2">
                    Once you have reviewed and approved all transactions, click <strong>Finalise Ledger</strong> to seal
                    a SHA-256 cryptographic hash. Any modification after sealing will be detected and flagged.
                  </p>
                </div>
                <Button
                  onClick={handleFinalizeLedger}
                  disabled={isHashing || needsSignOff > 0}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isHashing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
                  {needsSignOff > 0 ? `${needsSignOff} Sign-Off(s) Pending` : 'Finalise Ledger'}
                </Button>
                {needsSignOff > 0 && (
                  <p className="text-xs text-orange-400">
                    Approve {needsSignOff} high-value transaction{needsSignOff > 1 ? 's' : ''} first (above {formatINR(materialityThreshold)})
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer note ── */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 pt-2 border-t border-border/20">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        <span>
          Demo mode: Transactions are AI-generated seed data for <strong className="text-violet-400">{clientName}</strong>.
          Classifications are rule-based. CA overrides and audit locks saved to browser session.
        </span>
      </div>
    </motion.div>
  );
}
