import { useState, useEffect, useCallback } from 'react';
import { CASectionAgentBadge } from '../agents/CASectionAgentBadge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Bot,
  Search,
  Filter,
  Calendar,
  Building2,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Zap,
  Shield,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types
interface ComplianceChangeLog {
  id: string;
  company_id: string;
  company_name: string;
  previous_score: number;
  current_score: number;
  change_percentage: number;
  change_type: 'increase' | 'decrease' | 'no_change';
  reason: string;
  reason_category: 'filing_completed' | 'filing_delayed' | 'penalty_paid' | 'document_updated' | 'audit_completed' | 'deadline_missed' | 'compliance_restored' | 'system_update';
  action_by: 'CA' | 'Client' | 'System' | 'Government';
  affected_compliance: string[];
  timestamp: string;
  ai_analysis?: string;
  risk_impact?: 'high' | 'medium' | 'low' | 'none';
}

interface ComplianceHealthChangeLogProps {
  isRealDashboard?: boolean;
  apiEndpoint?: string;
  caId?: string;
}



// Reason category badges
const getReasonCategoryBadge = (category: string) => {
  const badges: Record<string, { label: string; className: string; icon: string }> = {
    filing_completed: { label: 'Filing Done', className: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '✅' },
    filing_delayed: { label: 'Filing Delayed', className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '⏰' },
    penalty_paid: { label: 'Penalty Paid', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '💰' },
    document_updated: { label: 'Doc Updated', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '📄' },
    audit_completed: { label: 'Audit Done', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '🔍' },
    deadline_missed: { label: 'Deadline Missed', className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '❌' },
    compliance_restored: { label: 'Restored', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: '🔄' },
    system_update: { label: 'System Update', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: '⚙️' },
  };
  const badge = badges[category] || { label: category, className: 'bg-gray-500/20 text-gray-400', icon: '📋' };
  return (
    <Badge variant="outline" className={`text-xs ${badge.className}`}>
      {badge.icon} {badge.label}
    </Badge>
  );
};

// Action by badges
const getActionByBadge = (actionBy: string) => {
  const badges: Record<string, { className: string; icon: string }> = {
    CA: { className: 'bg-green-500/10 text-green-400 border-green-500/30', icon: '👨‍💼' },
    Client: { className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', icon: '🏢' },
    System: { className: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: '🤖' },
    Government: { className: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: '🏛️' },
  };
  const badge = badges[actionBy] || { className: 'bg-gray-500/10 text-gray-400', icon: '📋' };
  return (
    <Badge variant="outline" className={badge.className}>
      {badge.icon} {actionBy}
    </Badge>
  );
};

// Risk impact badges
const getRiskImpactBadge = (risk: string | undefined) => {
  if (!risk) return null;
  const badges: Record<string, { label: string; className: string }> = {
    high: { label: '🚨 High Risk', className: 'bg-red-500/20 text-red-400' },
    medium: { label: '⚠️ Medium Risk', className: 'bg-orange-500/20 text-orange-400' },
    low: { label: '🟢 Low Risk', className: 'bg-green-500/20 text-green-400' },
    none: { label: '✅ No Risk', className: 'bg-gray-500/20 text-gray-400' },
  };
  const badge = badges[risk] || { label: risk, className: 'bg-gray-500/20 text-gray-400' };
  return <Badge className={`text-xs ${badge.className}`}>{badge.label}</Badge>;
};

export default function ComplianceHealthChangeLog({
  isRealDashboard = false,
  apiEndpoint = `${(import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001'}/api/v1/ca`,
  caId = 'ca-001',
}: ComplianceHealthChangeLogProps) {
  const [changeLogs, setChangeLogs] = useState<ComplianceChangeLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ComplianceChangeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [filters, setFilters] = useState({
    changeType: 'all',
    actionBy: 'all',
    riskImpact: 'all',
    timeRange: 'all',
  });

  // Stats
  const stats = {
    totalChanges: filteredLogs.length,
    improvements: filteredLogs.filter((l) => l.change_type === 'increase').length,
    declines: filteredLogs.filter((l) => l.change_type === 'decrease').length,
    avgChange:
      filteredLogs.length > 0
        ? (filteredLogs.reduce((sum, l) => sum + l.change_percentage, 0) / filteredLogs.length).toFixed(1)
        : '0',
    highRiskChanges: filteredLogs.filter((l) => l.risk_impact === 'high').length,
  };

  // Fetch change logs from API (for real dashboard)
  const fetchChangeLogs = useCallback(async () => {
    if (!isRealDashboard) return;

    setLoading(true);
    setAiAnalyzing(true);
    try {
      const response = await fetch(`${apiEndpoint}/${caId}/compliance-changelog`);
      if (response.ok) {
        const data = await response.json();
        if (data.logs && data.logs.length > 0) {
          setChangeLogs(data.logs);
          setFilteredLogs(data.logs);
        }
      }
    } catch (error) {
      console.log('API fetch failed, using AI-generated data');
    } finally {
      setLoading(false);
      setLastSync(new Date());
      setTimeout(() => setAiAnalyzing(false), 1500);
    }
  }, [isRealDashboard, apiEndpoint, caId]);

  // Load initial data
  useEffect(() => {
    // Always fetch from real API — no mock fallback for the real dashboard
    fetchChangeLogs();
  }, [isRealDashboard, fetchChangeLogs]);

  // Apply filters
  useEffect(() => {
    let filtered = changeLogs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.company_name.toLowerCase().includes(query) ||
          log.reason.toLowerCase().includes(query) ||
          log.affected_compliance.some((c) => c.toLowerCase().includes(query))
      );
    }

    if (filters.changeType !== 'all') {
      filtered = filtered.filter((log) => log.change_type === filters.changeType);
    }

    if (filters.actionBy !== 'all') {
      filtered = filtered.filter((log) => log.action_by === filters.actionBy);
    }

    if (filters.riskImpact !== 'all') {
      filtered = filtered.filter((log) => log.risk_impact === filters.riskImpact);
    }

    if (filters.timeRange !== 'all') {
      const now = new Date();
      const ranges: Record<string, number> = {
        today: 1,
        week: 7,
        month: 30,
        quarter: 90,
      };
      const days = ranges[filters.timeRange] || 0;
      if (days > 0) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((log) => new Date(log.timestamp) >= cutoff);
      }
    }

    // Sort by timestamp (newest first)
    filtered = [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredLogs(filtered);
  }, [changeLogs, searchQuery, filters]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-cyan-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20">
                <Activity className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  📊 Compliance Health Change Log
                  {isRealDashboard && (
                    <>
                      <CASectionAgentBadge agentId="A2_CROSS" />
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Live System
                      </Badge>
                    </>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRealDashboard
                    ? 'AI-powered tracking of compliance score changes with real-time analysis'
                    : 'Track how compliance health changed due to actions taken or delays'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRealDashboard && (
                <>
                  {aiAnalyzing && (
                    <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                      <Bot className="w-3 h-3 mr-1 animate-pulse" />
                      AI Analyzing...
                    </Badge>
                  )}
                  {lastSync && (
                    <span className="text-xs text-muted-foreground">
                      Last sync: {lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchChangeLogs}
                    disabled={loading}
                    className="h-8"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Stats Row */}
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-lg bg-card/50 border border-border/30">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Total Changes</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1">{stats.totalChanges}</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-green-500/30">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Improvements</span>
              </div>
              <p className="text-xl font-bold text-green-400 mt-1">{stats.improvements}</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-red-500/30">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Declines</span>
              </div>
              <p className="text-xl font-bold text-red-400 mt-1">{stats.declines}</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-border/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-muted-foreground">Avg Change</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1">{stats.avgChange}%</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-orange-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-muted-foreground">High Risk</span>
              </div>
              <p className="text-xl font-bold text-orange-400 mt-1">{stats.highRiskChanges}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, reason, compliance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            {/* Filters */}
            <Select value={filters.changeType} onValueChange={(value) => setFilters({ ...filters, changeType: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Change Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📊 All Changes</SelectItem>
                <SelectItem value="increase">📈 Improvements</SelectItem>
                <SelectItem value="decrease">📉 Declines</SelectItem>
                <SelectItem value="no_change">➖ No Change</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.actionBy} onValueChange={(value) => setFilters({ ...filters, actionBy: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Action By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 All Actions</SelectItem>
                <SelectItem value="CA">👨‍💼 CA Action</SelectItem>
                <SelectItem value="Client">🏢 Client</SelectItem>
                <SelectItem value="System">🤖 System</SelectItem>
                <SelectItem value="Government">🏛️ Government</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.timeRange} onValueChange={(value) => setFilters({ ...filters, timeRange: value })}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📅 All Time</SelectItem>
                <SelectItem value="today">🕐 Today</SelectItem>
                <SelectItem value="week">📆 This Week</SelectItem>
                <SelectItem value="month">📆 This Month</SelectItem>
                <SelectItem value="quarter">📆 This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Change Log Table - Collapsible */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowAllLogs(!showAllLogs)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  📋 Change History
                  <Badge variant="outline" className="text-xs">
                    {filteredLogs.length} {filteredLogs.length === 1 ? 'Entry' : 'Entries'}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {showAllLogs ? 'Click to collapse' : 'Click to view full change history'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {showAllLogs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showAllLogs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-2">
                {filteredLogs.length > 0 ? (
                  <div className="rounded-xl border border-border/50 overflow-hidden max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
                          <TableHead className="text-muted-foreground font-semibold text-center">Previous</TableHead>
                          <TableHead className="text-muted-foreground font-semibold text-center">Current</TableHead>
                          <TableHead className="text-muted-foreground font-semibold text-center">Change</TableHead>
                          <TableHead className="text-muted-foreground font-semibold">Reason</TableHead>
                          <TableHead className="text-muted-foreground font-semibold">Action By</TableHead>
                          <TableHead className="text-muted-foreground font-semibold">Risk</TableHead>
                          <TableHead className="text-muted-foreground font-semibold text-right">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => {
                          const isPositive = log.change_type === 'increase';
                          const isNegative = log.change_type === 'decrease';

                          return (
                            <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-foreground text-sm">{log.company_name}</p>
                                    <div className="flex gap-1 mt-0.5">
                                      {log.affected_compliance.slice(0, 2).map((comp) => (
                                        <Badge key={comp} variant="outline" className="text-xs py-0">
                                          {comp}
                                        </Badge>
                                      ))}
                                      {log.affected_compliance.length > 2 && (
                                        <Badge variant="outline" className="text-xs py-0">
                                          +{log.affected_compliance.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-muted-foreground">{log.previous_score}%</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-bold text-foreground">{log.current_score}%</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <div
                                  className={`flex items-center justify-center gap-1 font-semibold ${
                                    isPositive
                                      ? 'text-green-400'
                                      : isNegative
                                      ? 'text-red-400'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {isPositive ? (
                                    <TrendingUp className="w-4 h-4" />
                                  ) : isNegative ? (
                                    <TrendingDown className="w-4 h-4" />
                                  ) : (
                                    <Minus className="w-4 h-4" />
                                  )}
                                  {isPositive ? '+' : ''}
                                  {log.change_percentage}%
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[250px]">
                                  <p className="text-sm text-foreground truncate">{log.reason}</p>
                                  <div className="mt-1">{getReasonCategoryBadge(log.reason_category)}</div>
                                  {isRealDashboard && log.ai_analysis && (
                                    <div className="mt-1 p-1.5 rounded bg-purple-500/10 border border-purple-500/20">
                                      <p className="text-xs text-purple-300 flex items-start gap-1">
                                        <Bot className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        {log.ai_analysis}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{getActionByBadge(log.action_by)}</TableCell>
                              <TableCell>{getRiskImpactBadge(log.risk_impact)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {formatTimestamp(log.timestamp)}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-lg font-medium text-muted-foreground">
                      {isRealDashboard ? 'No compliance changes yet' : 'No changes matching your filters'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRealDashboard
                        ? 'Changes will be logged automatically when companies are added and compliance actions occur.'
                        : 'Try adjusting your filters to see more results.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview when collapsed */}
        {!showAllLogs && filteredLogs.length > 0 && (
          <CardContent className="pt-0 pb-3">
            <div className="space-y-2">
              {filteredLogs.slice(0, 3).map((log) => {
                const isPositive = log.change_type === 'increase';
                const isNegative = log.change_type === 'decrease';
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-card/30 border border-border/30"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                          isPositive ? 'bg-green-500' : isNegative ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.company_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{log.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-sm font-semibold ${
                          isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-muted-foreground'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {log.change_percentage}%
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
              {filteredLogs.length > 3 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{filteredLogs.length - 3} more changes...
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
