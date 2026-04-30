import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  Lock,
  UserX,
  Eye,
  Activity,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Search,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { enhancedAuth, type SecurityEvent } from '@/lib/enhanced-auth';
import { useToast } from '@/hooks/use-toast';

interface SecurityAuditProps {
  className?: string;
}

interface SecurityAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  details?: Record<string, any>;
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({ className = '' }) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      const eventsData = await enhancedAuth.getSecurityEvents(100);
      setEvents(eventsData);
      
      // Generate security alerts based on events
      const generatedAlerts = generateSecurityAlerts(eventsData);
      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load security audit data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSecurityAlerts = (events: SecurityEvent[]): SecurityAlert[] => {
    const alerts: SecurityAlert[] = [];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    // Group events by IP address and time
    const ipGroups: Record<string, SecurityEvent[]> = {};
    const recentEvents = events.filter(event => 
      now - new Date(event.timestamp).getTime() < oneDay
    );

    recentEvents.forEach(event => {
      if (!ipGroups[event.ip_address]) {
        ipGroups[event.ip_address] = [];
      }
      ipGroups[event.ip_address].push(event);
    });

    // Check for suspicious patterns
    Object.entries(ipGroups).forEach(([ip, ipEvents]) => {
      const failedLogins = ipEvents.filter(e => e.event_type === 'failed_login');
      const recentFailed = failedLogins.filter(e => 
        now - new Date(e.timestamp).getTime() < oneHour
      );

      // Multiple failed logins from same IP
      if (recentFailed.length >= 3) {
        alerts.push({
          id: `brute-force-${ip}-${Date.now()}`,
          severity: recentFailed.length >= 10 ? 'critical' : 'high',
          type: 'Brute Force Attack',
          message: `${recentFailed.length} failed login attempts from ${ip} in the last hour`,
          timestamp: new Date().toISOString(),
          resolved: false,
          details: { ip, attempts: recentFailed.length, events: recentFailed },
        });
      }

      // Successful login after multiple failures
      const successAfterFail = ipEvents.some((event, index) => {
        if (event.event_type === 'login' && index > 0) {
          const prevEvent = ipEvents[index - 1];
          return prevEvent.event_type === 'failed_login';
        }
        return false;
      });

      if (successAfterFail && failedLogins.length >= 2) {
        alerts.push({
          id: `suspicious-success-${ip}-${Date.now()}`,
          severity: 'medium',
          type: 'Suspicious Login',
          message: `Successful login from ${ip} after multiple failed attempts`,
          timestamp: new Date().toISOString(),
          resolved: false,
          details: { ip, failedAttempts: failedLogins.length },
        });
      }
    });

    // Check for logins from new locations/devices
    const uniqueIPs = [...new Set(events.map(e => e.ip_address))];
    if (uniqueIPs.length > 5) {
      alerts.push({
        id: `multiple-locations-${Date.now()}`,
        severity: 'low',
        type: 'Multiple Locations',
        message: `Account accessed from ${uniqueIPs.length} different IP addresses recently`,
        timestamp: new Date().toISOString(),
        resolved: false,
        details: { ips: uniqueIPs },
      });
    }

    // Check for unusual activity patterns
    const loginEvents = events.filter(e => e.event_type === 'login');
    const loginTimes = loginEvents.map(e => new Date(e.timestamp).getHours());
    const unusualTimes = loginTimes.filter(hour => hour < 6 || hour > 22);
    
    if (unusualTimes.length > 2) {
      alerts.push({
        id: `unusual-hours-${Date.now()}`,
        severity: 'low',
        type: 'Unusual Activity Hours',
        message: `${unusualTimes.length} logins detected outside normal business hours`,
        timestamp: new Date().toISOString(),
        resolved: false,
        details: { hours: unusualTimes },
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return <Shield className="w-4 h-4 text-green-500" />;
      case 'failed_login':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'logout':
        return <UserX className="w-4 h-4 text-gray-500" />;
      case 'password_change':
        return <Lock className="w-4 h-4 text-blue-500" />;
      case 'account_locked':
        return <Lock className="w-4 h-4 text-red-500" />;
      case 'suspicious_activity':
        return <Eye className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.ip_address.includes(searchTerm) ||
      event.event_type.includes(searchTerm) ||
      (event.details && event.details.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || event.event_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    return matchesSeverity;
  });

  const exportAuditData = () => {
    const data = {
      events: filteredEvents,
      alerts: filteredAlerts,
      exportTimestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Security Audit</h2>
            <p className="text-gray-600">Monitor and analyze security events for your account</p>
          </div>
          
          <Button onClick={exportAuditData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Security Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span>Security Alerts</span>
                <Badge variant="secondary">{alerts.length}</Badge>
              </CardTitle>
              
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAlerts.length > 0 ? (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-4 p-4 border rounded-lg"
                  >
                    <div className={`w-3 h-3 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{alert.type}</h3>
                        <Badge className={getSeverityBadge(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">{alert.message}</p>
                      
                      {alert.details && (
                        <div className="text-xs text-gray-500">
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(alert.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    
                    <Button size="sm" variant="outline">
                      Mark Resolved
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No security alerts detected</p>
                <p className="text-sm">Your account security looks good!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Security Event Timeline</span>
                <Badge variant="secondary">{events.length}</Badge>
              </CardTitle>
              
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="failed_login">Failed Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="password_change">Password Change</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEvents.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="mt-1">
                      {getEventIcon(event.event_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-medium text-gray-900 capitalize">
                          {event.event_type.replace('_', ' ')}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.ip_address}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {event.user_agent.includes('Mobile') ? (
                            <Smartphone className="w-3 h-3" />
                          ) : (
                            <Monitor className="w-3 h-3" />
                          )}
                          <span className="truncate max-w-xs">
                            {event.user_agent.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                      
                      {event.details && (
                        <p className="text-xs text-gray-400 mt-1">{event.details}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events match your search criteria</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Successful Logins</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {events.filter(e => e.event_type === 'login').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Failed Attempts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {events.filter(e => e.event_type === 'failed_login').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unique Locations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(events.map(e => e.ip_address)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Risk Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.max(0, 100 - (alerts.length * 10))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};