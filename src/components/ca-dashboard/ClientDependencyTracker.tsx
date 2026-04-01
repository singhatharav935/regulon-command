/**
 * Client Dependency Tracker - Real CA Dashboard
 * Tracks pending documents and automates reminders
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Clock,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  MessageCircle,
  Send,
  RefreshCw,
  FileText,
  Calendar,
  User,
  Building2,
  Plus,
  Eye,
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';

// API Integration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class DependencyAPI {
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
  
  // Get pending dependencies
  static async getPendingDependencies(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`/ca/dependencies/pending?${queryString}`);
  }
  
  // Send reminder
  static async sendReminder(dependencyId: string, reminderType: string, customMessage?: string) {
    return this.request('/ca/dependencies/send-reminder', {
      method: 'POST',
      body: JSON.stringify({ 
        dependency_id: dependencyId, 
        reminder_type: reminderType,
        custom_message: customMessage
      }),
    });
  }
  
  // Create new dependency
  static async createDependency(dependencyData: any) {
    return this.request('/ca/dependencies', {
      method: 'POST',
      body: JSON.stringify(dependencyData),
    });
  }
  
  // Update dependency status
  static async updateDependencyStatus(dependencyId: string, status: string, notes?: string) {
    return this.request(`/ca/dependencies/${dependencyId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }
  
  // Get dependency details
  static async getDependencyDetails(dependencyId: string) {
    return this.request(`/ca/dependencies/${dependencyId}`);
  }
}

const ClientDependencyTracker: React.FC = () => {
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDependency, setSelectedDependency] = useState<any>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'pending',
    urgency: 'all',
    client: 'all'
  });

  useEffect(() => {
    loadDependencies();
  }, [filters]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const response = await DependencyAPI.getPendingDependencies(filters);
      setDependencies(response.data);
    } catch (error) {
      console.error('Error loading dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (dependencyId: string, reminderType: string) => {
    try {
      setSendingReminder(dependencyId);
      await DependencyAPI.sendReminder(dependencyId, reminderType, customMessage);
      
      // Refresh the list to update last_reminder_sent
      await loadDependencies();
      
      // Show success message
      alert(`${reminderType.toUpperCase()} reminder sent successfully!`);
      setCustomMessage('');
      
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Error sending reminder. Please try again.');
    } finally {
      setSendingReminder(null);
    }
  };

  const getDaysOverdue = (requestDate: string) => {
    const today = new Date();
    const request = new Date(requestDate);
    const diffTime = today.getTime() - request.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyBadge = (daysOverdue: number) => {
    if (daysOverdue <= 2) {
      return <Badge className="bg-green-100 text-green-800">FRESH</Badge>;
    } else if (daysOverdue <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800">MODERATE</Badge>;
    } else if (daysOverdue <= 10) {
      return <Badge className="bg-orange-100 text-orange-800">URGENT</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">CRITICAL</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'received': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'partial': { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      'rejected': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const ReminderPanel = ({ dependency }: { dependency: any }) => {
    const [messageType, setMessageType] = useState('whatsapp');
    
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Send Reminder</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Reminder Type</label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Custom Message (Optional)</label>
            <Textarea
              placeholder="Add a custom message to the reminder..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleSendReminder(dependency.id, messageType)}
              disabled={sendingReminder === dependency.id}
              className="flex-1"
            >
              {sendingReminder === dependency.id ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reminder
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setSelectedDependency(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Client Dependency Tracker
          </CardTitle>
          <div className="flex gap-4 mt-4">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="all">All Status</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.urgency}
              onValueChange={(value) => setFilters({...filters, urgency: value})}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgencies</SelectItem>
                <SelectItem value="critical">Critical (10+ days)</SelectItem>
                <SelectItem value="urgent">Urgent (5-10 days)</SelectItem>
                <SelectItem value="moderate">Moderate (3-5 days)</SelectItem>
                <SelectItem value="fresh">Fresh (0-2 days)</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadDependencies} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2">Loading dependencies...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {dependencies.map((dependency) => {
                const daysOverdue = getDaysOverdue(dependency.request_date);
                const isExpanded = selectedDependency?.id === dependency.id;
                
                return (
                  <motion.div
                    key={dependency.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold">{dependency.document_name}</h3>
                          {getStatusBadge(dependency.status)}
                          {getUrgencyBadge(daysOverdue)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span><strong>Client:</strong> {dependency.client_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span><strong>Requested:</strong> {new Date(dependency.request_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span><strong>Contact:</strong> {dependency.contact_person}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span><strong>Phone:</strong> {dependency.contact_phone}</span>
                          </div>
                        </div>

                        {dependency.description && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-md">
                            <p className="text-sm">{dependency.description}</p>
                          </div>
                        )}

                        {dependency.last_reminder_sent && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Last reminder: {new Date(dependency.last_reminder_sent).toLocaleString()} 
                            ({dependency.last_reminder_type?.toUpperCase()})
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{daysOverdue}</div>
                          <div className="text-xs text-muted-foreground">days overdue</div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant={isExpanded ? "secondary" : "outline"}
                          onClick={() => setSelectedDependency(isExpanded ? null : dependency)}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Remind
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        <ReminderPanel dependency={dependency} />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
              
              {dependencies.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-4" />
                  <p className="text-gray-500">
                    {filters.status === 'pending' 
                      ? 'No pending dependencies found!' 
                      : 'No dependencies found matching your criteria'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {dependencies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {dependencies.filter(d => getDaysOverdue(d.request_date) > 10).length}
              </div>
              <div className="text-sm text-muted-foreground">Critical (10+ days)</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {dependencies.filter(d => {
                  const days = getDaysOverdue(d.request_date);
                  return days >= 5 && days <= 10;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Urgent (5-10 days)</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dependencies.filter(d => d.last_reminder_sent).length}
              </div>
              <div className="text-sm text-muted-foreground">Reminders Sent</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(dependencies.filter(d => getDaysOverdue(d.request_date) <= 5).length / dependencies.length * 100) || 0}%
              </div>
              <div className="text-sm text-muted-foreground">On Track</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClientDependencyTracker;
