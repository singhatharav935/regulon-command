// ============================================================
// PaymentClassificationReal.tsx
// REAL External CA Dashboard — Payment Classification Engine UI
// Uses REAL data from Supabase (AA feeds / uploaded statements)
// NO mock data here — only real company bank transactions
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Tags, RefreshCw, Download, Edit3, Check, X,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, Filter,
  Search, Sparkles, IndianRupee, BarChart3, Shield,
  Fingerprint, Database, Loader, AlertTriangle, Upload, Landmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  summarizeByCategory,
  getMonthlyTrends,
  parseAATransaction,
  applyOverrides,
  CATEGORY_COLORS,
  type RealTransaction,
  type PaymentCategory,
} from './payment-classification-engine-real';

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
  if (score >= 90) return <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">{score}% AI</Badge>;
  if (score >= 70) return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">{score}% AI</Badge>;
  return <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">{score}% Low</Badge>;
};

// ── Custom Pie tooltip ────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold text-foreground">{payload[0].name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatINR(payload[0].value)}</p>
        <p className="text-xs text-cyan-400">{payload[0].payload.percentageOfTotal}% of total</p>
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

// ── Data source indicator ─────────────────────────────────────
type DataSource = 'aa' | 'statement' | 'none';

interface Props {
  clientId: string;
  clientName: string;
  financialYear: string;
}

export default function PaymentClassificationReal({ clientId, clientName, financialYear }: Props) {
  const [transactions, setTransactions] = useState<RealTransaction[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<PaymentCategory>('Uncategorized');
  const [caUser, setCAUser] = useState<{ id: string; email: string } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // ── Load CA user ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCAUser({ id: data.user.id, email: data.user.email ?? '' });
      }
    });
  }, []);

  // ── Fetch real transactions ───────────────────────────────
  const fetchTransactions = async () => {
    if (!clientId) return;
    setIsLoading(true);

    try {
      // 1. Try AA consent data first
      const { data: aaData, error: aaError } = await supabase
        .from('aa_consent_requests')
        .select('*')
        .eq('company_id', clientId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);

      // 2. Try fetching transaction data tied to the consent
      let rawTxns: RealTransaction[] = [];

      if (!aaError && aaData && aaData.length > 0) {
        // AA data is available — try fetching the actual transactions
        const { data: txnData } = await supabase
          .from('aa_transactions')
          .select('*')
          .eq('company_id', clientId)
          .order('date', { ascending: false })
          .limit(200);

        if (txnData && txnData.length > 0) {
          rawTxns = txnData.map(parseAATransaction);
          setDataSource('aa');
        }
      }

      // 3. If no AA transactions, try uploaded bank statements
      if (rawTxns.length === 0) {
        const { data: stmtData } = await supabase
          .from('client_bank_statements')
          .select('*')
          .eq('company_id', clientId)
          .eq('status', 'parsed')
          .order('created_at', { ascending: false })
          .limit(5);

        if (stmtData && stmtData.length > 0) {
          // Fetch parsed transactions from statement_transactions table
          const statementIds = stmtData.map((s: any) => s.id);
          const { data: parsedTxns } = await supabase
            .from('statement_transactions')
            .select('*')
            .in('statement_id', statementIds)
            .order('date', { ascending: false })
            .limit(200);

          if (parsedTxns && parsedTxns.length > 0) {
            rawTxns = parsedTxns.map((row: any) => parseAATransaction({
              id: row.id,
              narration: row.description || '',
              amount: row.amount,
              type: row.type?.toUpperCase() || 'DEBIT',
              valueDate: row.date,
              bankName: row.bank || 'Uploaded Statement',
              mode: row.reference_no || '',
            }));
            setDataSource('statement');
          }
        }
      }

      if (rawTxns.length === 0) {
        setDataSource('none');
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      // 4. Fetch existing CA overrides from Supabase
      const { data: overrides } = await supabase
        .from('transaction_classifications')
        .select('*')
        .eq('company_id', clientId);

      if (overrides && overrides.length > 0) {
        rawTxns = applyOverrides(rawTxns, overrides.map((o: any) => ({
          txn_id: o.txn_id,
          category: o.category as PaymentCategory,
          override_by: o.override_by,
          override_at: o.override_at,
        })));
      }

      setTransactions(rawTxns);
      setLastRefreshed(new Date());
    } catch (error: any) {
      console.error('Classification fetch error:', error);
      setDataSource('none');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [clientId, financialYear]);

  const summary = useMemo(() => summarizeByCategory(transactions), [transactions]);
  const monthlyTrends = useMemo(() => getMonthlyTrends(transactions), [transactions]);

  const totalDebit = useMemo(() =>
    transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalCredit = useMemo(() =>
    transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0), [transactions]);
  const autoClassified = useMemo(() =>
    transactions.filter(t => !t.caOverride && t.confidence >= 80).length, [transactions]);
  const manualOverrides = useMemo(() =>
    transactions.filter(t => !!t.caOverride).length, [transactions]);

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

  // ── Save override to Supabase ─────────────────────────────
  const handleSaveOverride = async (txn: RealTransaction) => {
    if (!caUser) {
      toast.error('Not authenticated');
      return;
    }
    setIsSavingOverride(true);
    try {
      const { error } = await supabase
        .from('transaction_classifications')
        .upsert({
          txn_id: txn.id,
          company_id: clientId,
          category: overrideCategory,
          override_by: caUser.email,
          override_at: new Date().toISOString(),
          original_category: txn.category,
          confidence: txn.confidence,
        }, { onConflict: 'txn_id' });

      if (error) throw error;

      setTransactions(prev => prev.map(t =>
        t.id === txn.id ? {
          ...t,
          caOverride: overrideCategory,
          overrideBy: caUser.email,
          overrideAt: new Date().toISOString(),
          isManuallyClassified: true,
        } : t
      ));
      setEditingId(null);
      toast.success(`Category updated to "${overrideCategory}"`, {
        description: 'Saved to Supabase audit trail.',
      });
    } catch (err: any) {
      toast.error('Failed to save override', { description: err.message });
    } finally {
      setIsSavingOverride(false);
    }
  };

  const handleExport = () => {
    const rows = ['Date,Description,Amount,Type,Bank,Category,Confidence,CA Override,Override By,Override At'];
    transactions.forEach(tx => {
      rows.push([
        tx.date,
        `"${tx.description}"`,
        tx.amount,
        tx.type,
        tx.bank,
        tx.caOverride ?? tx.category,
        tx.caOverride ? 'Manual' : `${tx.confidence}%`,
        tx.caOverride || '',
        tx.overrideBy || '',
        tx.overrideAt || '',
      ].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payment_Classification_REAL_${clientName.replace(/\s+/g, '_')}_${financialYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Classification report exported as CSV');
  };

  // ── No data state ─────────────────────────────────────────
  if (!isLoading && dataSource === 'none') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10 border border-violet-500/20 rounded-2xl">
          <div className="p-3 bg-violet-500/20 rounded-xl">
            <Tags className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Payment Classification</h2>
            <p className="text-sm text-muted-foreground">Real-time AA bank data categorisation for {clientName}</p>
          </div>
        </div>

        {/* No data message */}
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/30 rounded-2xl bg-card/10 space-y-5">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Database className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-400">No Bank Data Available</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              To classify payments, you need to either:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full">
            <div className="p-4 bg-card/40 border border-indigo-500/20 rounded-xl text-left">
              <div className="flex items-center gap-2 mb-2">
                <Fingerprint className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-300">Option 1: Account Aggregator</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Request consent via AA (Finvu / Onemoney) from the <strong>Client Financial Vault</strong> tab.
                Once approved, real transactions will auto-appear here.
              </p>
            </div>
            <div className="p-4 bg-card/40 border border-blue-500/20 rounded-xl text-left">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Option 2: Upload Statement</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a PDF/CSV bank statement from the <strong>Client Financial Vault</strong> tab.
                Parsed transactions will be classified automatically.
              </p>
            </div>
          </div>
          <Button
            onClick={fetchTransactions}
            variant="outline"
            className="gap-2 mt-2"
          >
            <RefreshCw className="w-4 h-4" /> Check Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Loader className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
          <p className="text-sm text-violet-400 font-medium">Loading real transaction data...</p>
          <p className="text-xs text-muted-foreground">Connecting to Supabase AA feeds for {clientName}</p>
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
              <Badge className={`text-xs ${dataSource === 'aa'
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                {dataSource === 'aa' ? (
                  <><Fingerprint className="w-3 h-3 mr-1" /> AA Live Data</>
                ) : (
                  <><Upload className="w-3 h-3 mr-1" /> Uploaded Statement</>
                )}
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              {transactions.length} real transactions · {clientName} · FY {financialYear}
              <span className="ml-2 text-muted-foreground/50">· Updated {lastRefreshed.toLocaleTimeString()}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchTransactions} className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={handleExport} className="gap-2 bg-violet-600 hover:bg-violet-700 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Outflow', value: formatINR(totalDebit), icon: TrendingDown, color: 'red' },
          { label: 'Total Inflow', value: formatINR(totalCredit), icon: TrendingUp, color: 'green' },
          { label: 'Auto-Classified', value: `${autoClassified}/${transactions.length}`, icon: Sparkles, color: 'violet' },
          { label: 'CA Overrides', value: manualOverrides, icon: Shield, color: 'blue' },
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
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie */}
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
                    <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar */}
              <div className="p-5 bg-card/40 border border-border/40 rounded-2xl">
                <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Monthly Cash Flow
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyTrends} barSize={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="debit" name="Outflow" fill="#ef4444" opacity={0.8} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="credit" name="Inflow" fill="#10b981" opacity={0.8} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category summary */}
            <div className="p-5 bg-card/40 border border-border/40 rounded-2xl">
              <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                <Tags className="w-4 h-4 text-violet-400" /> Category Breakdown
              </h3>
              <div className="space-y-2">
                {summary.map((s) => (
                  <div key={s.category} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-muted-foreground w-40 flex-shrink-0 truncate">{s.category}</span>
                    <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${s.percentageOfTotal}%`, backgroundColor: s.color }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{s.percentageOfTotal}%</span>
                    <span className="text-xs font-mono text-foreground w-28 text-right">{formatINR(s.totalAmount)}</span>
                    <span className="text-xs text-muted-foreground w-16 text-right">{s.count} txns</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div key="transactions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search real transactions..."
                  className="w-full pl-9 pr-4 py-2 bg-card/60 border border-border/40 rounded-lg text-sm focus:border-violet-500/50 outline-none"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {ALL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

            {/* Transaction List */}
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
                      <div className="flex-shrink-0 w-24">
                        <p className="text-xs font-mono text-muted-foreground">{tx.date}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{tx.bank}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 truncate">{tx.narration}</p>
                        {tx.isManuallyClassified && tx.overrideBy && (
                          <p className="text-[10px] text-blue-400/70 mt-0.5">
                            Override by {tx.overrideBy} · {tx.overrideAt ? new Date(tx.overrideAt).toLocaleDateString() : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right w-28">
                        <p className={`text-sm font-mono font-semibold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.type === 'debit' ? '−' : '+'}{formatINR(tx.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">{tx.type}</p>
                      </div>
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
                            <Button
                              size="sm"
                              className="h-7 px-2 bg-green-600 hover:bg-green-700"
                              onClick={() => handleSaveOverride(tx)}
                              disabled={isSavingOverride}
                            >
                              {isSavingOverride ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
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
                              {effectiveCat}
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

      {/* Footer */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 pt-2 border-t border-border/20">
        <Landmark className="w-3 h-3 flex-shrink-0" />
        <span>
          <strong className="text-green-400">Real data mode</strong> — Transactions from{' '}
          {dataSource === 'aa' ? 'Account Aggregator (AA) live feed' : 'uploaded bank statement'} for{' '}
          <strong className="text-violet-400">{clientName}</strong>.
          CA overrides are saved to Supabase with full audit trail.
        </span>
      </div>
    </motion.div>
  );
}
