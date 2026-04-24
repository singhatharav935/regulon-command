import { useState, useEffect, useCallback } from 'react';
import { CASectionAgentBadge } from '../agents/CASectionAgentBadge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Mail,
  Bell,
  ArrowUpRight,
  Clock,
  RefreshCw,
  Bot,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Phone,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  Zap,
  Calendar,
  Building2,
  ExternalLink,
  Archive,
  Star,
  Trash2,
  Reply,
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

// Types
interface CommunicationLog {
  id: string;
  type: 'message' | 'email' | 'reminder' | 'escalation' | 'notification' | 'call' | 'document' | 'system';
  direction: 'incoming' | 'outgoing' | 'system';
  company_id?: string;
  company_name?: string;
  subject: string;
  content: string;
  sender?: string;
  recipient?: string;
  status: 'unread' | 'read' | 'replied' | 'archived' | 'starred';
  priority: 'high' | 'medium' | 'low';
  category: 'compliance' | 'filing' | 'query' | 'reminder' | 'alert' | 'general';
  attachments?: string[];
  related_task_id?: string;
  timestamp: string;
  ai_summary?: string;
}

interface CommunicationLogsProps {
  isRealDashboard?: boolean;
  apiEndpoint?: string;
  caId?: string;
}



// Type icons and colors
const getTypeConfig = (type: string) => {
  const configs: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
    message: { icon: MessageSquare, color: 'text-blue-400', bgColor: 'bg-blue-500/10', label: '💬 Message' },
    email: { icon: Mail, color: 'text-green-400', bgColor: 'bg-green-500/10', label: '📧 Email' },
    reminder: { icon: Bell, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', label: '🔔 Reminder' },
    escalation: { icon: ArrowUpRight, color: 'text-orange-400', bgColor: 'bg-orange-500/10', label: '⬆️ Escalation' },
    notification: { icon: Bell, color: 'text-purple-400', bgColor: 'bg-purple-500/10', label: '📢 Notification' },
    call: { icon: Phone, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', label: '📞 Call' },
    document: { icon: FileText, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', label: '📄 Document' },
    system: { icon: Bot, color: 'text-gray-400', bgColor: 'bg-gray-500/10', label: '🤖 System' },
  };
  return configs[type] || configs.system;
};

// Category badges
const getCategoryBadge = (category: string) => {
  const badges: Record<string, { label: string; className: string }> = {
    compliance: { label: '🛡️ Compliance', className: 'bg-indigo-500/20 text-indigo-400' },
    filing: { label: '📋 Filing', className: 'bg-green-500/20 text-green-400' },
    query: { label: '❓ Query', className: 'bg-blue-500/20 text-blue-400' },
    reminder: { label: '⏰ Reminder', className: 'bg-yellow-500/20 text-yellow-400' },
    alert: { label: '🚨 Alert', className: 'bg-red-500/20 text-red-400' },
    general: { label: '📝 General', className: 'bg-gray-500/20 text-gray-400' },
  };
  const badge = badges[category] || badges.general;
  return <Badge className={`text-xs ${badge.className}`}>{badge.label}</Badge>;
};

// Priority indicator
const getPriorityIndicator = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };
  return colors[priority] || colors.low;
};

export default function CommunicationLogs({
  isRealDashboard = false,
  caId = 'ca-001',
}: CommunicationLogsProps) {
  const apiEndpoint = (import.meta.env.VITE_CA_API_BASE_URL as string) || 'http://localhost:3001';
  const CA_API = `${apiEndpoint}/api/v1/ca`;
  
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    category: 'all',
  });

  // Stats
  const stats = {
    total: filteredLogs.length,
    unread: filteredLogs.filter((l) => l.status === 'unread').length,
    highPriority: filteredLogs.filter((l) => l.priority === 'high').length,
    todayCount: filteredLogs.filter((l) => {
      const logDate = new Date(l.timestamp);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
  };

  // Fetch logs from API
  const fetchLogs = useCallback(async () => {
    if (!isRealDashboard) return;

    setLoading(true);
    setAiAnalyzing(true);
    try {
      const response = await fetch(`${CA_API}/communications/logs?client_id=${caId}`);
      if (response.ok) {
        const json = await response.json();
        if (json.data && json.data.length > 0) {
          setLogs(json.data);
          setFilteredLogs(json.data);
        }
      }
    } catch (error) {
      console.log('API fetch failed, using empty state');
    } finally {
      setLoading(false);
      setLastSync(new Date());
      setTimeout(() => setAiAnalyzing(false), 1500);
    }
  }, [isRealDashboard, CA_API, caId]);

  // Load initial data — always fetch from real API
  useEffect(() => {
    fetchLogs();
  }, [isRealDashboard, fetchLogs]);

  // Apply filters
  useEffect(() => {
    let filtered = logs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.subject.toLowerCase().includes(query) ||
          log.content.toLowerCase().includes(query) ||
          (log.company_name && log.company_name.toLowerCase().includes(query))
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter((log) => log.type === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((log) => log.status === filters.status);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter((log) => log.category === filters.category);
    }

    // Sort by timestamp (newest first), unread first
    filtered = [...filtered].sort((a, b) => {
      if (a.status === 'unread' && b.status !== 'unread') return -1;
      if (a.status !== 'unread' && b.status === 'unread') return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    setFilteredLogs(filtered);
  }, [logs, searchQuery, filters]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border-blue-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  💬 Communication & Logs
                  <CASectionAgentBadge agentId="M2_TRACKER" />
                  {isRealDashboard && (
                    <Badge className="bg-green-500/20 text-green-400 text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      Live System
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRealDashboard
                    ? 'AI-powered communication tracking with smart categorization and alerts'
                    : 'All compliance-related communication and actions are recorded'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRealDashboard && (
                <>
                  {aiAnalyzing && (
                    <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                      <Bot className="w-3 h-3 mr-1 animate-pulse" />
                      AI Processing...
                    </Badge>
                  )}
                  {lastSync && (
                    <span className="text-xs text-muted-foreground">
                      Last sync: {lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="h-8">
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
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Total Messages</span>
              </div>
              <p className="text-xl font-bold text-foreground mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-cyan-500/30">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-muted-foreground">Unread</span>
              </div>
              <p className="text-xl font-bold text-cyan-400 mt-1">{stats.unread}</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-red-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-muted-foreground">High Priority</span>
              </div>
              <p className="text-xl font-bold text-red-400 mt-1">{stats.highPriority}</p>
            </div>
            <div className="p-3 rounded-lg bg-card/50 border border-green-500/30">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
              <p className="text-xl font-bold text-green-400 mt-1">{stats.todayCount}</p>
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
                placeholder="Search messages, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📊 All Types</SelectItem>
                <SelectItem value="message">💬 Messages</SelectItem>
                <SelectItem value="email">📧 Emails</SelectItem>
                <SelectItem value="reminder">🔔 Reminders</SelectItem>
                <SelectItem value="escalation">⬆️ Escalations</SelectItem>
                <SelectItem value="call">📞 Calls</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📋 All Status</SelectItem>
                <SelectItem value="unread">🔵 Unread</SelectItem>
                <SelectItem value="read">✅ Read</SelectItem>
                <SelectItem value="replied">↩️ Replied</SelectItem>
                <SelectItem value="starred">⭐ Starred</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🏷️ All Categories</SelectItem>
                <SelectItem value="compliance">🛡️ Compliance</SelectItem>
                <SelectItem value="filing">📋 Filing</SelectItem>
                <SelectItem value="query">❓ Query</SelectItem>
                <SelectItem value="reminder">⏰ Reminder</SelectItem>
                <SelectItem value="alert">🚨 Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Communication Logs - Collapsible */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowAllLogs(!showAllLogs)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  📨 Message History
                  <Badge variant="outline" className="text-xs">
                    {filteredLogs.length} {filteredLogs.length === 1 ? 'Message' : 'Messages'}
                  </Badge>
                  {stats.unread > 0 && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                      {stats.unread} New
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {showAllLogs ? 'Click to collapse' : 'Click to view all communications'}
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
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredLogs.map((log, index) => {
                      const typeConfig = getTypeConfig(log.type);
                      const Icon = typeConfig.icon;

                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`flex items-start gap-3 p-3 rounded-lg bg-card/30 border transition-all hover:bg-card/50 ${
                            log.status === 'unread'
                              ? 'border-l-2 border-l-cyan-500 border-border/50'
                              : 'border-border/30'
                          }`}
                        >
                          {/* Priority indicator */}
                          <div className={`w-1 h-full min-h-[60px] rounded-full ${getPriorityIndicator(log.priority)}`} />

                          {/* Type icon */}
                          <div className={`p-2 rounded-lg ${typeConfig.bgColor} flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-foreground text-sm truncate">{log.subject}</h4>
                                  {log.status === 'unread' && (
                                    <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">New</Badge>
                                  )}
                                </div>
                                {log.company_name && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Building2 className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{log.company_name}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{log.content}</p>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                {getCategoryBadge(log.category)}
                                <Badge variant="outline" className="text-xs">
                                  {log.direction === 'incoming' ? '📥' : log.direction === 'outgoing' ? '📤' : '🤖'}{' '}
                                  {log.direction}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-6 px-2" title="Reply">
                                  <Reply className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 px-2" title="Star">
                                  <Star className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 px-2" title="Archive">
                                  <Archive className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-lg font-medium text-muted-foreground">
                      {isRealDashboard ? 'No communications yet' : 'No messages matching your filters'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRealDashboard
                        ? 'Communications will appear when you interact with clients.'
                        : 'Try adjusting your filters.'}
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
              {filteredLogs.slice(0, 4).map((log) => {
                const typeConfig = getTypeConfig(log.type);
                const Icon = typeConfig.icon;

                return (
                  <div
                    key={log.id}
                    className={`flex items-center gap-3 p-2 rounded-lg bg-card/30 border ${
                      log.status === 'unread' ? 'border-l-2 border-l-cyan-500 border-border/50' : 'border-border/30'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${typeConfig.bgColor} flex-shrink-0`}>
                      <Icon className={`w-3 h-3 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.company_name || log.sender || log.recipient}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {log.status === 'unread' && (
                        <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      )}
                      <span className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
              {filteredLogs.length > 4 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{filteredLogs.length - 4} more messages...
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
