import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bell, 
  Settings, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Save,
  Camera,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedAuth } from '@/lib/enhanced-auth-context';
import { AccountSecurity } from '@/components/auth/AccountSecurity';

const AccountSettingsPage: React.FC = () => {
  const { user, updateProfile } = useEnhancedAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    company: user?.verification_entity_name || '',
    location: '',
    timezone: 'UTC',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    desktop_notifications: true,
    compliance_alerts: true,
    regulatory_updates: true,
    marketing_emails: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'private',
    data_sharing: false,
    analytics: true,
    third_party_integrations: false,
  });

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      await updateProfile({
        full_name: profileForm.full_name,
        // Add other profile fields as supported by backend
      });
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
      });
      
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'external_ca':
      case 'in_house_ca':
        return 'bg-blue-100 text-blue-800';
      case 'ca_firm':
        return 'bg-purple-100 text-purple-800';
      case 'company_owner':
        return 'bg-green-100 text-green-800';
      case 'in_house_lawyer':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleDisplay = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Not Authenticated</h2>
          <p className="text-gray-600">Please sign in to access your account settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-2">Manage your profile, security, and preferences</p>
          </div>

          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 shadow-sm">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                    <Badge className={getRoleBadgeColor(user.registration_role)}>
                      {formatRoleDisplay(user.registration_role)}
                    </Badge>
                    {user.email_verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mt-1">{user.email}</p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {new Date(user.created_at || Date.now()).getFullYear()}</span>
                    </div>
                    {user.verification_entity_name && (
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span>{user.verification_entity_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Preferences</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Personal Information</CardTitle>
                    <Button
                      onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                      disabled={isSaving}
                      className="flex items-center space-x-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : isEditing ? (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-4 h-4" />
                          <span>Edit Profile</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        disabled={true} // Email changes require verification
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Contact support to change your email address
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        disabled={!isEditing}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        disabled={!isEditing}
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="company">Company/Organization</Label>
                      <Input
                        id="company"
                        value={profileForm.company}
                        onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={profileForm.timezone}
                        onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="America/New_York">Eastern Time (GMT-5)</option>
                        <option value="America/Chicago">Central Time (GMT-6)</option>
                        <option value="America/Denver">Mountain Time (GMT-7)</option>
                        <option value="America/Los_Angeles">Pacific Time (GMT-8)</option>
                        <option value="Europe/London">London (GMT+0)</option>
                        <option value="Asia/Kolkata">India (GMT+5:30)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>
                  
                  {isEditing && (
                    <div className="flex space-x-2 pt-4">
                      <Button onClick={() => setIsEditing(false)} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <AccountSecurity />
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Email Notifications</h3>
                    
                    {Object.entries({
                      email_notifications: 'General email notifications',
                      compliance_alerts: 'Compliance alerts and deadlines',
                      regulatory_updates: 'Regulatory updates and changes',
                      marketing_emails: 'Product updates and newsletters',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={key}>{label}</Label>
                        <Switch
                          id={key}
                          checked={notificationSettings[key as keyof typeof notificationSettings]}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ 
                              ...notificationSettings, 
                              [key]: checked 
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Other Notifications</h3>
                    
                    {Object.entries({
                      sms_notifications: 'SMS notifications for urgent alerts',
                      desktop_notifications: 'Browser push notifications',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={key}>{label}</Label>
                        <Switch
                          id={key}
                          checked={notificationSettings[key as keyof typeof notificationSettings]}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ 
                              ...notificationSettings, 
                              [key]: checked 
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries({
                      data_sharing: 'Allow anonymized data sharing for research',
                      analytics: 'Help improve SANNIDH with usage analytics',
                      third_party_integrations: 'Allow third-party integrations',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={key}>{label}</Label>
                        <Switch
                          id={key}
                          checked={privacySettings[key as keyof typeof privacySettings]}
                          onCheckedChange={(checked) => 
                            setPrivacySettings({ 
                              ...privacySettings, 
                              [key]: checked 
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Export Account Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-orange-600 hover:text-orange-700">
                      Deactivate Account
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                      Delete Account
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Account deletion is permanent and cannot be undone. All your data will be removed.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;