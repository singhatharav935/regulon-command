// ============================================================
// PaymentClassificationDemo.tsx
// DEMO CA Dashboard — Payment Classification Engine UI
// Uses MOCK / SEED data only (no real Supabase data)
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
  Briefcase, Building2, ArrowLeftRight, Landmark, Package, Heart
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
  CATEGORY_COLORS,
  type DemoTransaction,
  type PaymentCategory,
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

interface Props {
  clientId: string;
  clientName: string;
  financialYear: string;
}

export default function PaymentClassificationDemo({ clientId, clientName, financialYear }: Props) {
  const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<PaymentCategory>('Uncategorized');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const txns = generateMockTransactions(clientId, clientName, financialYear);
      setTransactions(txns);
      setIsLoading(false);
    }, 600);
  }, [clientId, clientName, financialYear]);

  const summary = useMemo(() => summarizeByCategory(transactions), [transactions]);
  const monthlyTrends = useMemo(() => getMonthlyTrends(transactions), [transactions]);

  const totalDebit = useMemo(() =>
    transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalCredit = useMemo(() =>
    transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0), [transactions]);
  const autoClassified = useMemo(() =>
    transactions.filter(t => !t.caOverride && t.confidence >= 80).length, [transactions]);

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
    const rows = ['Date,Description,Amount,Type,Category,Confidence,CA Override'];
    transactions.forEach(tx => {
      rows.push([
        tx.date, `"${tx.description}"`, tx.amount,
        tx.type, tx.caOverride ?? tx.category,
        tx.caOverride ? 'Manual' : `${tx.confidence}%`,
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
            </h2>
            <p className="text-sm text-muted-foreground">
              Auto-categorised bank transactions for {clientName} · FY {financialYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleResetOverrides} className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Reset Overrides
          </Button>
          <Button size="sm" onClick={handleExport} className="gap-2 bg-violet-600 hover:bg-violet-700 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
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
        {(['overview', 'transactions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-all ${
              activeTab === tab
                ? 'bg-violet-500/20 text-violet-300 border border-border/40 border-b-transparent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'overview' ? '📊 Overview' : '📋 Transactions'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
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

                return (
                  <motion.div
                    key={tx.id}
                    layout
                    className="p-4 bg-card/40 border border-border/40 rounded-xl hover:border-violet-500/30 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      {/* Date + Bank */}
                      <div className="flex-shrink-0 w-24">
                        <p className="text-xs font-mono text-muted-foreground">{tx.date}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{tx.bank}</p>
                      </div>

                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 truncate">{tx.narration}</p>
                      </div>

                      {/* Amount */}
                      <div className="flex-shrink-0 text-right w-28">
                        <p className={`text-sm font-mono font-semibold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'debit' ? '−' : '+'}{formatINR(tx.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">{tx.type}</p>
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
      </AnimatePresence>

      {/* ── Footer note ── */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 pt-2 border-t border-border/20">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        <span>
          Demo mode: Transactions are AI-generated seed data for <strong className="text-violet-400">{clientName}</strong>.
          Classifications are rule-based. CA overrides are saved to browser session.
        </span>
      </div>
    </motion.div>
  );
}
