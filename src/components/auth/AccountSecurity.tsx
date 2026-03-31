import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Clock, 
  MapPin, 
  Monitor, 
  AlertTriangle,
  CheckCircle,
  X,
  MoreVertical,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { enhancedAuth, type AuthSession, type SecurityEvent } from '@/lib/enhanced-auth';
import { SecurePasswordInput } from './PasswordStrengthMeter';

interface AccountSecurityProps {
  className?: string;
}

export const AccountSecurity: React.FC<AccountSecurityProps> = ({ className = '' }) => {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      const [sessionsData, eventsData] = await Promise.all([
        enhancedAuth.getSessions(),
        enhancedAuth.getSecurityEvents(20),
      ]);
      setSessions(sessionsData);
      setSecurityEvents(eventsData);
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load security information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await enhancedAuth.revokeSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast({
        title: 'Session Revoked',
        description: 'The session has been successfully revoked',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke session',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    try {
      await enhancedAuth.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated',
      });
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    }
  };

  const getDeviceIcon = (session: AuthSession) => {
    if (session.device_info.is_mobile) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const getEventIcon = (eventType: SecurityEvent['event_type']) => {
    switch (eventType) {
      case 'login':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed_login':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'password_change':
        return <Key className="w-4 h-4 text-blue-500" />;
      case 'account_locked':
        return <Shield className="w-4 h-4 text-orange-500" />;
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatEventDescription = (event: SecurityEvent) => {
    switch (event.event_type) {
      case 'login':
        return 'Successful login';
      case 'failed_login':
        return 'Failed login attempt';
      case 'password_change':
        return 'Password changed';
      case 'account_locked':
        return 'Account locked due to suspicious activity';
      case 'suspicious_activity':
        return 'Suspicious activity detected';
      default:
        return event.event_type.replace('_', ' ');
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
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
        {/* Password Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Password & Authentication</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-gray-500">Last changed 30 days ago</p>
              </div>
              <Button
                onClick={() => setShowChangePassword(!showChangePassword)}
                variant="outline"
              >
                Change Password
              </Button>
            </div>

            {showChangePassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 p-4 border rounded-lg bg-gray-50"
              >
                <div>
                  <Label>Current Password</Label>
                  <SecurePasswordInput
                    value={passwordForm.currentPassword}
                    onValueChange={(value) => 
                      setPasswordForm({ ...passwordForm, currentPassword: value })
                    }
                    placeholder="Enter current password"
                    showStrengthMeter={false}
                  />
                </div>
                
                <div>
                  <Label>New Password</Label>
                  <SecurePasswordInput
                    value={passwordForm.newPassword}
                    onValueChange={(value) => 
                      setPasswordForm({ ...passwordForm, newPassword: value })
                    }
                    placeholder="Enter new password"
                    showStrengthMeter={true}
                  />
                </div>

                <div>
                  <Label>Confirm New Password</Label>
                  <SecurePasswordInput
                    value={passwordForm.confirmPassword}
                    onValueChange={(value) => 
                      setPasswordForm({ ...passwordForm, confirmPassword: value })
                    }
                    placeholder="Confirm new password"
                    showStrengthMeter={false}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleChangePassword}>
                    Update Password
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowChangePassword(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>
            </div>

            {twoFactorEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Two-factor authentication is enabled</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your account is protected with SMS-based 2FA
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="w-5 h-5" />
              <span>Active Sessions</span>
              <Badge variant="secondary">{sessions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-gray-500">
                      {getDeviceIcon(session)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{session.device_info.device_name}</h3>
                        {session.is_current && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                        {session.device_info.is_trusted && (
                          <Badge variant="secondary" className="text-xs">Trusted</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.device_info.browser} • {session.device_info.os}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{session.ip_address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Last active: {new Date(session.last_activity).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!session.is_current && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => handleRevokeSession(session.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Revoke Session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active sessions found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Recent Security Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-4 p-3 border rounded-lg"
                >
                  <div className="mt-0.5">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{formatEventDescription(event)}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      IP: {event.ip_address}
                    </div>
                    {event.details && (
                      <div className="text-sm text-gray-600 mt-1">
                        {event.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {securityEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent security events</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Security Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-orange-800">Enable Two-Factor Authentication</h3>
                  <p className="text-sm text-orange-700">
                    Add an extra layer of security to your account with 2FA
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800">Review Active Sessions</h3>
                  <p className="text-sm text-blue-700">
                    Regularly check and revoke sessions you don't recognize
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <Key className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800">Strong Password</h3>
                  <p className="text-sm text-green-700">
                    Use a unique, strong password for your REGULON account
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};