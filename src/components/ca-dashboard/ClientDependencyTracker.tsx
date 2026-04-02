import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  User,
  Phone,
  Send,
  Filter,
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  Zap,
  Bot,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Dependency {
  id: string;
  document_name: string;
  client_name: string;
  contact_person: string;
  contact_phone: string;
  request_date: string;
  status: 'pending' | 'received' | 'rejected' | 'in_progress';
  description?: string;
  last_reminder_sent?: string;
  last_reminder_type?: string;
  urgency?: 'critical' | 'high' | 'medium' | 'low';
}

interface ClientDependencyTrackerProps {
  isRealDashboard?: boolean;
  apiEndpoint?: string;
  aiEnabled?: boolean;
}

// Demo data for CA Demo Dashboard
const DEMO_DEPENDENCIES: Dependency[] = [
  {
    id: 'dep-001',
    document_name: '📋 PAN Card Copy',
    client_name: 'ABC Corporation',
    contact_person: 'Rajesh Kumar',
    contact_phone: '+91-9876543210',
    request_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    description: 'Required for opening bank account and compliance filing',
    last_reminder_sent: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    last_reminder_type: 'email',
    urgency: 'high',
  },
  {
    id: 'dep-002',
    document_name: '🏢 Registration Certificate',
    client_name: 'XYZ Pvt Ltd',
    contact_person: 'Priya Sharma',
    contact_phone: '+91-8765432109',
    request_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    description: 'Awaiting certified copy from registrar office',
    last_reminder_sent: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    last_reminder_type: 'sms',
    urgency: 'critical',
  },
  {
    id: 'dep-003',
    document_name: '📊 Balance Sheet (FY 2023-24)',
    client_name: 'Tech Solutions Inc',
    contact_person: 'Amit Patel',
    contact_phone: '+91-7654321098',
    request_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'received',
    description: 'Final audited balance sheet with audit report',
    last_reminder_sent: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    last_reminder_type: 'call',
    urgency: 'medium',
  },
];

export default function ClientDependencyTracker({
  isRealDashboard = false,
  apiEndpoint = 'http://localhost:8001/api/v1/ca/ca-001/dependencies',
  aiEnabled = true,
}: ClientDependencyTrackerProps) {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [filteredDependencies, setFilteredDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<Dependency | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    urgency: 'all',
  });
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  // Load initial data
  useEffect(() => {
    if (isRealDashboard) {
      // Load empty state for real dashboard
      setDependencies([]);
      setFilteredDependencies([]);
    } else {
      // Load demo data for demo dashboard
      setDependencies(DEMO_DEPENDENCIES);
      setFilteredDependencies(DEMO_DEPENDENCIES);
    }
  }, [isRealDashboard]);

  // Fetch live data for real dashboard
  useEffect(() => {
    if (!isRealDashboard) return;

    const fetchDependencies = async () => {
      try {
        setLoading(true);
        setIsAutoSyncing(true);
        const response = await fetch(apiEndpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('ca_token') || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDependencies(data.dependencies || []);
          setFilteredDependencies(data.dependencies || []);
          setLastSync(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch dependencies:', error);
      } finally {
        setLoading(false);
        setIsAutoSyncing(false);
      }
    };

    fetchDependencies();
    const interval = setInterval(fetchDependencies, 60000); // Auto-refresh every 60 seconds
    return () => clearInterval(interval);
  }, [isRealDashboard, apiEndpoint]);

  // Apply filters and search
  useEffect(() => {
    let filtered = dependencies;

    if (searchQuery) {
      filtered = filtered.filter(
        (dep) =>
          dep.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dep.client_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((dep) => dep.status === filters.status);
    }

    if (filters.urgency !== 'all') {
      filtered = filtered.filter((dep) => dep.urgency === filters.urgency);
    }

    setFilteredDependencies(filtered);
  }, [dependencies, searchQuery, filters]);

  const getDaysOverdue = (requestDate: string) => {
    const days = Math.floor(
      (Date.now() - new Date(requestDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { emoji: '⏳', label: 'Pending', color: 'text-yellow-600 bg-yellow-100' },
      in_progress: { emoji: '🔄', label: 'In Progress', color: 'text-blue-600 bg-blue-100' },
      received: { emoji: '✅', label: 'Received', color: 'text-green-600 bg-green-100' },
      rejected: { emoji: '❌', label: 'Rejected', color: 'text-red-600 bg-red-100' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.emoji} {config.label}
      </span>
    );
  };

  const getUrgencyBadge = (daysOverdue: number) => {
    if (daysOverdue > 15) {
      return <span className="text-xs font-bold text-red-600">🚨 CRITICAL</span>;
    } else if (daysOverdue > 10) {
      return <span className="text-xs font-bold text-orange-600">⚠️ HIGH</span>;
    } else if (daysOverdue > 5) {
      return <span className="text-xs font-bold text-yellow-600">🟡 MEDIUM</span>;
    }
    return <span className="text-xs font-bold text-green-600">🟢 LOW</span>;
  };

  const handleSendReminder = async (dependency: Dependency) => {
    try {
      const response = await fetch(
        `${apiEndpoint.replace('/dependencies', '')}/send-reminder/${dependency.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('ca_token') || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reminderType: 'email',
          }),
        }
      );

      if (response.ok) {
        // Refetch to get updated reminder info
        const updatedDep = {
          ...dependency,
          last_reminder_sent: new Date().toISOString(),
          last_reminder_type: 'email',
        };
        setDependencies(
          dependencies.map((d) => (d.id === dependency.id ? updatedDep : d))
        );
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  const stats = [
    {
      label: 'Total Pending',
      count: filteredDependencies.filter((d) => d.status === 'pending').length,
      icon: <Clock className="w-4 h-4" />,
      color: 'text-yellow-600',
    },
    {
      label: 'In Progress',
      count: filteredDependencies.filter((d) => d.status === 'in_progress').length,
      icon: <Activity className="w-4 h-4" />,
      color: 'text-blue-600',
    },
    {
      label: 'Received',
      count: filteredDependencies.filter((d) => d.status === 'received').length,
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-green-600',
    },
    {
      label: 'Critical Items',
      count: filteredDependencies.filter((d) => getDaysOverdue(d.request_date) > 15).length,
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">📦 Client Dependency Tracker</h2>
            {isRealDashboard && (
              <>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-semibold">
                  <Zap className="w-3 h-3" />
                  Live System
                </div>
                {aiEnabled && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-semibold">
                    <Bot className="w-3 h-3" />
                    AI Powered
                  </div>
                )}
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isRealDashboard) {
                setIsAutoSyncing(true);
              }
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Last Sync Info */}
        {isRealDashboard && lastSync && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <motion.div
              animate={{ scale: isAutoSyncing ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 1.5, repeat: isAutoSyncing ? Infinity : 0 }}
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </motion.div>
            Auto-synced {lastSync.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border rounded-lg p-3 text-center"
          >
            <div className={`flex items-center justify-center gap-2 mb-2 ${stat.color}`}>
              {stat.icon}
              <span className="text-xs font-semibold">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.count}</div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filter & Search</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Search documents or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:col-span-2"
          />

          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">⏳ Pending</SelectItem>
              <SelectItem value="in_progress">🔄 In Progress</SelectItem>
              <SelectItem value="received">✅ Received</SelectItem>
              <SelectItem value="rejected">❌ Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.urgency}
            onValueChange={(value) => setFilters({ ...filters, urgency: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              <SelectItem value="critical">🚨 Critical</SelectItem>
              <SelectItem value="high">⚠️ High</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dependencies List */}
      <div className="space-y-3">
        {filteredDependencies.length > 0 ? (
          filteredDependencies.map((dependency) => {
            const daysOverdue = getDaysOverdue(dependency.request_date);
            const isExpanded = selectedDependency?.id === dependency.id;

            return (
              <motion.div
                key={dependency.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  daysOverdue > 15
                    ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                    : daysOverdue > 10
                    ? 'border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10'
                    : daysOverdue > 5
                    ? 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10'
                    : 'border-border/50 hover:border-border'
                }`}
                onClick={() => setSelectedDependency(isExpanded ? null : dependency)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-foreground">{dependency.document_name}</h3>
                      {getStatusBadge(dependency.status)}
                      {getUrgencyBadge(daysOverdue)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{dependency.client_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(dependency.request_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{dependency.contact_person}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{dependency.contact_phone}</span>
                      </div>
                    </div>

                    {dependency.description && (
                      <div className="mt-2 p-2 bg-muted/30 rounded-md border border-border/50 text-sm text-foreground">
                        {dependency.description}
                      </div>
                    )}

                    {dependency.last_reminder_sent && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Reminded: {new Date(dependency.last_reminder_sent).toLocaleString()} (
                        {dependency.last_reminder_type?.toUpperCase()})
                      </div>
                    )}

                    {isRealDashboard && (
                      <div className="text-xs text-green-400 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        AI Auto-Detected
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{daysOverdue}</div>
                      <div className="text-xs text-muted-foreground">days ago</div>
                    </div>
                    <Button
                      size="sm"
                      variant={isExpanded ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendReminder(dependency);
                      }}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Remind
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-border/50 space-y-3"
                  >
                    <div className="text-xs text-muted-foreground space-y-2">
                      <div>
                        <strong>Requested On:</strong>{' '}
                        {new Date(dependency.request_date).toLocaleString()}
                      </div>
                      <div>
                        <strong>Current Status:</strong> {dependency.status.toUpperCase()}
                      </div>
                      <div>
                        <strong>Follow-up Frequency:</strong> Every 3 days
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline">
                        <Send className="w-3 h-3 mr-1" />
                        Send SMS Reminder
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="w-3 h-3 mr-1" />
                        Call Client
                      </Button>
                      <Button size="sm" variant="outline">
                        Mark as Received
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 border rounded-lg border-border/50"
          >
            <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-4" />
            <p className="text-muted-foreground text-sm">
              {isRealDashboard
                ? 'No dependencies yet. They will appear here when you add companies with active compliance obligations.'
                : 'No dependencies found matching your criteria'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
