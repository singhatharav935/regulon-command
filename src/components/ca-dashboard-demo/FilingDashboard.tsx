/**
 * Filing Management Component - Real CA Dashboard
 * Handles real filing data with government API integration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Send,
  ArrowUpDown,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';

// API Integration
const API_BASE = import.meta.env.VITE_API_URL || '/api';

class FilingAPI {
  static async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Get filing dashboard data
  static async getFilingDashboard(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/ca/filings/dashboard?${queryString}`);
  }
  
  // Get specific filing details
  static async getFilingDetails(filingId: string) {
    return this.request(`/ca/filings/${filingId}`);
  }
  
  // Update filing status
  static async updateFilingStatus(filingId: string, status: string, notes?: string) {
    return this.request(`/ca/filings/${filingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }
  
  // Create new filing task
  static async createFiling(filingData: any) {
    return this.request('/ca/filings', {
      method: 'POST',
      body: JSON.stringify(filingData),
    });
  }
  
  // Get government filing requirements
  static async getFilingRequirements(clientId: string, filingType: string) {
    return this.request(`/ca/government/filing-requirements`, {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, filing_type: filingType }),
    });
  }
}

// Filing Dashboard Component
const FilingDashboard: React.FC = () => {
  const [filings, setFilings] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    date_range: '30_days'
  });

  useEffect(() => {
    loadFilingData();
  }, [filters]);

  const loadFilingData = async () => {
    try {
      setLoading(true);
      const response = await FilingAPI.getFilingDashboard(filters);
      setFilings(response.data.filings);
      setDashboardStats(response.data.stats);
    } catch (error) {
      console.error('Error loading filing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (filingId: string, newStatus: string) => {
    try {
      await FilingAPI.updateFilingStatus(filingId, newStatus);
      await loadFilingData(); // Refresh data
    } catch (error) {
      console.error('Error updating filing status:', error);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'completed';
    
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'in_progress': { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'cancelled': { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} ${isOverdue ? 'border-2 border-red-500' : ''}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
        {isOverdue && ' (OVERDUE)'}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'critical': 'bg-red-100 text-red-800',
      'high': 'bg-orange-100 text-orange-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  // Dashboard Stats Cards
  const DashboardStats = () => {
    if (!dashboardStats) return null;

    const statCards = [
      {
        title: "This Week Due",
        value: dashboardStats.due_this_week,
        icon: Calendar,
        color: "blue"
      },
      {
        title: "Overdue Filings",
        value: dashboardStats.overdue_filings,
        icon: AlertTriangle,
        color: dashboardStats.overdue_filings > 0 ? "red" : "green"
      },
      {
        title: "Completed (This Month)",
        value: dashboardStats.completed_this_month,
        icon: CheckCircle,
        color: "green"
      },
      {
        title: "Estimated Penalties",
        value: `₹${(dashboardStats.estimated_penalties || 0).toLocaleString()}`,
        icon: DollarSign,
        color: dashboardStats.estimated_penalties > 0 ? "red" : "gray"
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Statistics */}
      <DashboardStats />
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Filing Management Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({...filters, type: value})}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filing type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="gst_return">GST Return</SelectItem>
                <SelectItem value="income_tax">Income Tax</SelectItem>
                <SelectItem value="mca_filing">MCA Filing</SelectItem>
                <SelectItem value="tds_return">TDS Return</SelectItem>
                <SelectItem value="audit_report">Audit Report</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters({...filters, priority: value})}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadFilingData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Filing List */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2">Loading filings...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filings.map((filing) => (
                <Card key={filing.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold">{filing.filing_name}</h3>
                          {getStatusBadge(filing.status, filing.due_date)}
                          {getPriorityBadge(filing.priority)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <strong>Client:</strong> {filing.client_name}
                          </div>
                          <div>
                            <strong>Type:</strong> {filing.filing_type?.replace('_', ' ').toUpperCase()}
                          </div>
                          <div>
                            <strong>Due Date:</strong> {new Date(filing.due_date).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Period:</strong> {filing.period_start} to {filing.period_end}
                          </div>
                        </div>

                        {filing.estimated_penalty > 0 && (
                          <div className="mt-2 p-2 bg-red-50 rounded-md">
                            <div className="text-sm text-red-800">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              Estimated Penalty: ₹{filing.estimated_penalty.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        
                        <Select
                          value={filing.status}
                          onValueChange={(value) => handleStatusUpdate(filing.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filings.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No filings found matching your criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FilingDashboard;