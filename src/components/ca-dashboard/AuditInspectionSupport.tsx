import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Upload,
  CheckCircle2,
  Eye,
  RefreshCw,
  Bot,
  Search,
  Filter,
  Calendar,
  Building2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Zap,
  Users,
  Scale,
  Gavel,
  FileCheck,
  Send,
  MessageSquare,
  Bell,
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
interface AuditRecord {
  id: string;
  company_id: string;
  company_name: string;
  authority: string;
  authority_type: 'income_tax' | 'gst' | 'rbi' | 'sebi' | 'mca' | 'epfo' | 'esic' | 'custom';
  scope: string;
  audit_type: 'statutory_audit' | 'tax_audit' | 'internal_audit' | 'compliance_audit' | 'due_diligence' | 'inspection';
  documents_required: string[];
  documents_submitted: string[];
  status: 'scheduled' | 'documents_requested' | 'under_review' | 'query_raised' | 'completed' | 'closed';
  scheduled_date?: string;
  deadline?: string;
  assigned_ca?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  notes?: string;
  ai_recommendations?: string[];
  created_at: string;
  updated_at: string;
}

interface AuditSupportProps {
  isRealDashboard?: boolean;
  apiEndpoint?: string;
  caId?: string;
}

// Demo data for CA Demo Dashboard
const DEMO_AUDITS: AuditRecord[] = [
  {
    id: 'audit-demo-1',
    company_id: 'acme-001',
    company_name: 'Acme Technologies Pvt Ltd',
    authority: 'Income Tax Department',
    authority_type: 'income_tax',
    scope: 'Assessment Year 2024-25',
    audit_type: 'tax_audit',
    documents_required: ['ITR', 'TDS Returns', 'Books of Accounts', 'Bank Statements'],
    documents_submitted: ['ITR', 'TDS Returns'],
    status: 'documents_requested',
    deadline: '2026-04-30',
    assigned_ca: 'Self',
    priority: 'high',
    notes: 'Notice u/s 143(2) received',
    ai_recommendations: ['Prepare reconciliation statement', 'Verify TDS credits'],
    created_at: '2026-03-15T10:00:00Z',
    updated_at: '2026-04-01T14:30:00Z',
  },
  {
    id: 'audit-demo-2',
    company_id: 'global-001',
    company_name: 'GlobalTrade India Ltd',
    authority: 'GST Audit Team',
    authority_type: 'gst',
    scope: 'FY 2024-25 GST Compliance',
    audit_type: 'compliance_audit',
    documents_required: ['GSTR-1', 'GSTR-3B', 'E-way Bills', 'ITC Register'],
    documents_submitted: ['GSTR-1', 'GSTR-3B', 'E-way Bills', 'ITC Register'],
    status: 'under_review',
    deadline: '2026-05-15',
    assigned_ca: 'Self',
    priority: 'medium',
    ai_recommendations: ['ITC reconciliation pending', 'Check reverse charge entries'],
    created_at: '2026-03-20T09:00:00Z',
    updated_at: '2026-04-02T11:00:00Z',
  },
  {
    id: 'audit-demo-3',
    company_id: 'secure-001',
    company_name: 'SecurePay Solutions',
    authority: 'RBI Inspection Team',
    authority_type: 'rbi',
    scope: 'Annual RBI Inspection',
    audit_type: 'inspection',
    documents_required: ['Compliance Certificates', 'Transaction Logs', 'KYC Records'],
    documents_submitted: [],
    status: 'scheduled',
    scheduled_date: '2026-04-20',
    deadline: '2026-04-25',
    assigned_ca: 'Self',
    priority: 'critical',
    ai_recommendations: ['Prepare compliance matrix', 'Review transaction limits'],
    created_at: '2026-04-01T08:00:00Z',
    updated_at: '2026-04-01T08:00:00Z',
  },
];

// Status badges
const getStatusBadge = (status: string) => {
  const badges: Record<string, { label: string; className: string; icon: string }> = {
    scheduled: { label: '📅 Scheduled', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '📅' },
    documents_requested: { label: '📋 Docs Requested', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '📋' },
    under_review: { label: '🔍 Under Review', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '🔍' },
    query_raised: { label: '❓ Query Raised', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '❓' },
    completed: { label: '✅ Completed', className: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '✅' },
    closed: { label: '🔒 Closed', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: '🔒' },
  };
  const badge = badges[status] || { label: status, className: 'bg-gray-500/20 text-gray-400', icon: '📋' };
  return <Badge variant="outline" className={`text-xs ${badge.className}`}>{badge.label}</Badge>;
};

// Priority badges
const getPriorityBadge = (priority: string) => {
  const badges: Record<string, { label: string; className: string }> = {
    critical: { label: '🚨 Critical', className: 'bg-red-500/20 text-red-400' },
    high: { label: '⚠️ High', className: 'bg-orange-500/20 text-orange-400' },
    medium: { label: '🟡 Medium', className: 'bg-yellow-500/20 text-yellow-400' },
    low: { label: '🟢 Low', className: 'bg-green-500/20 text-green-400' },
  };
  const badge = badges[priority] || { label: priority, className: 'bg-gray-500/20 text-gray-400' };
  return <Badge className={`text-xs ${badge.className}`}>{badge.label}</Badge>;
};

// Authority icons
const getAuthorityIcon = (type: string) => {
  const icons: Record<string, string> = {
    income_tax: '🏛️',
    gst: '📊',
    rbi: '🏦',
    sebi: '📈',
    mca: '🏢',
    epfo: '👥',
    esic: '🏥',
    custom: '📋',
  };
  return icons[type] || '📋';
};

export default function AuditInspectionSupport({
  isRealDashboard = false,
  apiEndpoint = 'http://localhost:8001/api/v1/ca',
  caId = 'ca-001',
}: AuditSupportProps) {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [filteredAudits, setFilteredAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showAllAudits, setShowAllAudits] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    authority: 'all',
  });

  // Stats
  const stats = {
    total: filteredAudits.length,
    pending: filteredAudits.filter((a) => ['scheduled', 'documents_requested', 'under_review', 'query_raised'].includes(a.status)).length,
    critical: filteredAudits.filter((a) => a.priority === 'critical').length,
    thisWeek: filteredAudits.filter((a) => {
      if (!a.deadline) return false;
      const deadline = new Date(a.deadline);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return deadline <= weekFromNow && deadline >= now;
    }).length,
  };

  // Fetch audits from API
  const fetchAudits = useCallback(async () => {
    if (!isRealDashboard) return;

    setLoading(true);
    setAiAnalyzing(true);
    try {
      const response = await fetch(`${apiEndpoint}/${caId}/audits`);
      if (response.ok) {
        const data = await response.json();
        if (data.audits && data.audits.length > 0) {
          setAudits(data.audits);
          setFilteredAudits(data.audits);
        }
      }
    } catch (error) {
      console.log('API fetch failed, using empty state');
    } finally {
      setLoading(false);
      setLastSync(new Date());
      setTimeout(() => setAiAnalyzing(false), 1500);
    }
  }, [isRealDashboard, apiEndpoint, caId]);

  // Load initial data
  useEffect(() => {
    if (isRealDashboard) {
      fetchAudits();
    } else {
      setAudits(DEMO_AUDITS);
      setFilteredAudits(DEMO_AUDITS);
    }
  }, [isRealDashboard, fetchAudits]);

  // Apply filters
  useEffect(() => {
    let filtered = audits;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (audit) =>
          audit.company_name.toLowerCase().includes(query) ||
          audit.authority.toLowerCase().includes(query) ||
          audit.scope.toLowerCase().includes(query)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((audit) => audit.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter((audit) => audit.priority === filters.priority);
    }

    if (filters.authority !== 'all') {
      filtered = filtered.filter((audit) => audit.authority_type === filters.authority);
    }

    // Sort by priority and deadline
    filtered = [...filtered].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    });

    setFilteredAudits(filtered);
  }, [audits, searchQuery, filters]);

  const getDaysUntilDeadline = (deadline: string | undefined) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  🛡️ Audit, Inspection & Due Diligence Support
                  {isRealDashboard && (
                    <Badge className="bg-green-500/20 text-green-400 text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      Live System
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRealDashboard
                    ? 'AI-powered audit tracking with real-time status updates and document management'
                    : 'Track audit, inspection, and due diligence activities for your clients'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRealDashboard && (
                <>
                  {aiAnalyzing && (
                    <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                      <Bot className="w-3 h-3 mr-1 animate-pulse" />
                      AI Monitoring...
                    </Badge>
                  )}
                  {lastSync && (
                    <span className="text-xs text-muted-foreground">
                      Last sync: {lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <Button variant="outline" size="sm" onClick={fetchAudits} disabled={loading} className="h-8">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-card/50 border border-border/30">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-muted-foreground">Total Audits</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <p className="text-xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-red-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Critical</span>
              </div>
              <p className="text-xl font-bold text-red-400 mt-1">{stats.critical}</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-orange-500/30">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-muted-foreground">Due This Week</span>
              </div>
              <p className="text-xl font-bold text-orange-400 mt-1">{stats.thisWeek}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, authority, scope..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📊 All Status</SelectItem>
                <SelectItem value="scheduled">📅 Scheduled</SelectItem>
                <SelectItem value="documents_requested">📋 Docs Requested</SelectItem>
                <SelectItem value="under_review">🔍 Under Review</SelectItem>
                <SelectItem value="query_raised">❓ Query Raised</SelectItem>
                <SelectItem value="completed">✅ Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">⚡ All Priority</SelectItem>
                <SelectItem value="critical">🚨 Critical</SelectItem>
                <SelectItem value="high">⚠️ High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.authority} onValueChange={(value) => setFilters({ ...filters, authority: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Authority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🏛️ All Authorities</SelectItem>
                <SelectItem value="income_tax">🏛️ Income Tax</SelectItem>
                <SelectItem value="gst">📊 GST</SelectItem>
                <SelectItem value="rbi">🏦 RBI</SelectItem>
                <SelectItem value="sebi">📈 SEBI</SelectItem>
                <SelectItem value="mca">🏢 MCA</SelectItem>
                <SelectItem value="epfo">👥 EPFO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Table - Collapsible */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowAllAudits(!showAllAudits)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Gavel className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  📋 Audit Records
                  <Badge variant="outline" className="text-xs">
                    {filteredAudits.length} {filteredAudits.length === 1 ? 'Record' : 'Records'}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {showAllAudits ? 'Click to collapse' : 'Click to view all audit records'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {showAllAudits ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
        </CardHeader>

        <AnimatePresence>
          {showAllAudits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-2">
                {filteredAudits.length > 0 ? (
                  <div className="rounded-xl border border-border/50 overflow-hidden max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
                          <TableHead className="text-muted-foreground font-semibold">Authority</TableHead>
                          <TableHead className="text-muted-foreground font-semibold">Scope</TableHead>
                          <TableHead className="text-muted-foreground font-semibold">Documents</TableHead>
                          <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                          <TableHead className="text-muted-foreground font-semibold">Priority</TableHead>
                          <TableHead className="text-muted-foreground font-semibold">Deadline</TableHead>
                          <TableHead className="text-muted-foreground font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAudits.map((audit) => {
                          const daysUntil = getDaysUntilDeadline(audit.deadline);
                          const docsProgress = audit.documents_required.length > 0
                            ? Math.round((audit.documents_submitted.length / audit.documents_required.length) * 100)
                            : 0;

                          return (
                            <TableRow key={audit.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium text-foreground text-sm">{audit.company_name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <span>{getAuthorityIcon(audit.authority_type)}</span>
                                  <span className="text-sm">{audit.authority}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                                {audit.scope}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${docsProgress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                      style={{ width: `${docsProgress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {audit.documents_submitted.length}/{audit.documents_required.length}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(audit.status)}</TableCell>
                              <TableCell>{getPriorityBadge(audit.priority)}</TableCell>
                              <TableCell>
                                {audit.deadline && (
                                  <span className={`text-xs ${
                                    daysUntil !== null && daysUntil <= 7 ? 'text-red-400 font-bold' : 
                                    daysUntil !== null && daysUntil <= 14 ? 'text-orange-400' : 'text-muted-foreground'
                                  }`}>
                                    {daysUntil !== null && daysUntil > 0 ? `${daysUntil}d left` : daysUntil === 0 ? 'Today' : 'Overdue'}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 px-2" title="Upload Documents">
                                    <Upload className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-2" title="View Details">
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-2" title="Mark Complete">
                                    <CheckCircle2 className="w-3 h-3" />
                                  </Button>
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
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-lg font-medium text-muted-foreground">
                      {isRealDashboard ? 'No audit records yet' : 'No audits matching your filters'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRealDashboard
                        ? 'Audit records will appear when companies have audit/inspection activities.'
                        : 'Try adjusting your filters.'}
                    </p>
                  </div>
                )}

                {/* AI Recommendations */}
                {isRealDashboard && filteredAudits.some(a => a.ai_recommendations && a.ai_recommendations.length > 0) && (
                  <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-400">AI Recommendations</span>
                    </div>
                    <ul className="space-y-1">
                      {filteredAudits
                        .filter(a => a.ai_recommendations && a.ai_recommendations.length > 0)
                        .slice(0, 3)
                        .map((audit, idx) => (
                          <li key={idx} className="text-xs text-foreground">
                            <span className="font-medium">{audit.company_name}:</span>{' '}
                            {audit.ai_recommendations?.[0]}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview when collapsed */}
        {!showAllAudits && filteredAudits.length > 0 && (
          <CardContent className="pt-0 pb-3">
            <div className="space-y-2">
              {filteredAudits.slice(0, 3).map((audit) => {
                const daysUntil = getDaysUntilDeadline(audit.deadline);
                return (
                  <div
                    key={audit.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-card/30 border border-border/30"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                        audit.priority === 'critical' ? 'bg-red-500' :
                        audit.priority === 'high' ? 'bg-orange-500' :
                        audit.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{audit.company_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getAuthorityIcon(audit.authority_type)} {audit.authority}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(audit.status)}
                      {daysUntil !== null && (
                        <span className={`text-xs ${daysUntil <= 7 ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {daysUntil}d
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredAudits.length > 3 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{filteredAudits.length - 3} more audits...
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
