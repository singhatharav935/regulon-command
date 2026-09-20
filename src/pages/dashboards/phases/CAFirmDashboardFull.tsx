import React, { useState } from 'react';
import { usePersonaAuth } from '@/lib/persona-auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useFirmMembers,
  useAddFirmMember,
  useFirmClients,
  useAddFirmClient,
  useCAAssignments,
  useAssignCA,
  useUnassignCA,
  useFirmInvoices,
  useCreateInvoice,
  useUpdateInvoiceStatus,
  useFirmAnalytics,
  useTeamUtilization,
} from '@/hooks/personas/useCAFirmData';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, TrendingUp, Users, BarChart3, DollarSign, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Team Management Component
const TeamManagement = ({ firmId }: { firmId: string }) => {
  const { data: members, isLoading, error } = useFirmMembers(firmId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: '',
    yearsOfExperience: 0,
    hourlyRate: 0,
    qualifications: '',
  });
  const addMember = useAddFirmMember(firmId);

  const handleAddMember = async () => {
    if (!formData.name || !formData.email || !formData.specialization) {
      alert('Please fill in all required fields');
      return;
    }

    await addMember.mutateAsync({
      name: formData.name,
      email: formData.email,
      specialization: formData.specialization,
      yearsOfExperience: formData.yearsOfExperience,
      hourlyRate: formData.hourlyRate,
      isAvailable: true,
      utilizationRate: 0,
      qualifications: formData.qualifications.split(',').map((q) => q.trim()),
      status: 'active',
    });

    setFormData({ name: '', email: '', specialization: '', yearsOfExperience: 0, hourlyRate: 0, qualifications: '' });
    setShowAddForm(false);
  };

  if (isLoading) return <div className="text-white">Loading team members...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>Failed to load team members</AlertDescription></Alert>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">👥 Team Members</h3>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-purple-600 hover:bg-purple-700">
          {showAddForm ? 'Cancel' : 'Add Member'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-slate-700 border-gray-600 p-4 space-y-3">
          <Input
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Input
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Input
            placeholder="Specialization"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Input
            placeholder="Years of Experience"
            type="number"
            value={formData.yearsOfExperience}
            onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Input
            placeholder="Hourly Rate ($)"
            type="number"
            value={formData.hourlyRate}
            onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Input
            placeholder="Qualifications (comma-separated)"
            value={formData.qualifications}
            onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Button onClick={handleAddMember} className="w-full bg-green-600 hover:bg-green-700" disabled={addMember.isPending}>
            {addMember.isPending ? 'Adding...' : 'Add Member'}
          </Button>
        </Card>
      )}

      <div className="grid gap-4">
        {(members || []).map((member, idx) => (
          <motion.div key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}>
            <Card className="bg-slate-800 border-gray-600">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{member.name}</h4>
                    <p className="text-gray-400 text-sm">{member.specialization}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {member.yearsOfExperience} yrs exp • ${member.hourlyRate}/hr
                    </p>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {(member.qualifications || []).map((qual, i) => (
                        <span key={i} className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                          {qual}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-400">{member.utilizationRate}%</div>
                    <p className="text-gray-400 text-sm">Utilization</p>
                    <div className="mt-2">
                      {member.isAvailable ? (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Available</span>
                      ) : (
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Busy</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Clients Overview Component
const ClientsOverview = ({ firmId }: { firmId: string }) => {
  const { data: clients, isLoading, error } = useFirmClients(firmId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    industry: '',
    taxFilingDeadline: '',
    annualRevenue: 0,
  });
  const addClient = useAddFirmClient(firmId);

  const handleAddClient = async () => {
    if (!formData.companyName || !formData.contactEmail) {
      alert('Please fill in required fields');
      return;
    }

    await addClient.mutateAsync({
      companyName: formData.companyName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      industry: formData.industry,
      taxFilingDeadline: formData.taxFilingDeadline,
      status: 'active',
      annualRevenue: formData.annualRevenue,
    });

    setFormData({ companyName: '', contactEmail: '', contactPhone: '', industry: '', taxFilingDeadline: '', annualRevenue: 0 });
    setShowAddForm(false);
  };

  if (isLoading) return <div className="text-white">Loading clients...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>Failed to load clients</AlertDescription></Alert>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">🏢 Clients</h3>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-purple-600 hover:bg-purple-700">
          {showAddForm ? 'Cancel' : 'Add Client'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="bg-slate-700 border-gray-600 p-4 space-y-3">
          <Input
            placeholder="Company Name"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Input
            placeholder="Contact Email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Input
            placeholder="Contact Phone"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Input
            placeholder="Industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Input
            placeholder="Tax Filing Deadline"
            type="date"
            value={formData.taxFilingDeadline}
            onChange={(e) => setFormData({ ...formData, taxFilingDeadline: e.target.value })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Input
            placeholder="Annual Revenue"
            type="number"
            value={formData.annualRevenue}
            onChange={(e) => setFormData({ ...formData, annualRevenue: parseFloat(e.target.value) })}
            className="bg-slate-600 text-white border-gray-500"
          />
          <Button onClick={handleAddClient} className="w-full bg-green-600 hover:bg-green-700" disabled={addClient.isPending}>
            {addClient.isPending ? 'Adding...' : 'Add Client'}
          </Button>
        </Card>
      )}

      <div className="grid gap-4">
        {(clients || []).map((client, idx) => (
          <motion.div key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}>
            <Card className="bg-slate-800 border-gray-600">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{client.companyName}</h4>
                    <p className="text-gray-400 text-sm">{client.industry}</p>
                    <p className="text-gray-500 text-xs mt-2">Email: {client.contactEmail}</p>
                    <p className="text-gray-500 text-xs">Phone: {client.contactPhone}</p>
                    <p className="text-gray-500 text-xs">Tax Filing: {new Date(client.taxFilingDeadline).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded">{client.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Team Utilization Component
const TeamUtilization = ({ firmId }: { firmId: string }) => {
  const { data: utilization, isLoading, error } = useTeamUtilization(firmId);

  if (isLoading) return <div className="text-white">Loading utilization data...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>Failed to load utilization data</AlertDescription></Alert>;

  const statusColors = {
    optimal: 'bg-green-600',
    underutilized: 'bg-yellow-600',
    overutilized: 'bg-red-600',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">📊 Team Utilization</h3>
      <div className="grid gap-4">
        {(utilization || []).map((member, idx) => (
          <motion.div key={member.memberId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}>
            <Card className="bg-slate-800 border-gray-600">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-semibold">{member.memberName}</h4>
                      <p className="text-gray-400 text-sm">{member.assignedClients} clients</p>
                    </div>
                    <span className={`${statusColors[member.status]} text-white text-xs px-3 py-1 rounded`}>{member.status}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        member.status === 'optimal'
                          ? 'bg-green-500'
                          : member.status === 'overutilized'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                      }`}
                      style={{ width: `${member.utilizationRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>{member.hoursWorked}h / {member.targetHours}h per week</span>
                    <span className="text-white font-semibold">{member.utilizationRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Analytics Chart Component
const AnalyticsChart = ({ firmId }: { firmId: string }) => {
  const { data: analytics, isLoading, error } = useFirmAnalytics(firmId);

  if (isLoading) return <div className="text-white">Loading analytics...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>Failed to load analytics</AlertDescription></Alert>;

  const stats = [
    { icon: DollarSign, label: 'Total Revenue', value: `$${(analytics?.totalRevenue || 0).toLocaleString()}`, color: 'text-green-400' },
    { icon: Clock, label: 'Hours Billed', value: `${analytics?.totalHoursBilled || 0}h`, color: 'text-blue-400' },
    { icon: Users, label: 'Active CAs', value: analytics?.teamSize || 0, color: 'text-purple-400' },
    { icon: BarChart3, label: 'Avg Utilization', value: `${Math.round(analytics?.averageUtilization || 0)}%`, color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
              <Card className="bg-slate-800 border-gray-600">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                      <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </div>
                    <Icon className={`w-10 h-10 ${stat.color} opacity-50`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {(analytics?.monthlyTrend || []).length > 0 && (
        <Card className="bg-slate-800 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Revenue & Hours Trend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="month" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue ($)" strokeWidth={2} />
                <Line type="monotone" dataKey="hours" stroke="#3b82f6" name="Hours" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Billing Dashboard Component
const BillingDashboard = ({ firmId }: { firmId: string }) => {
  const { data: invoices, isLoading, error } = useFirmInvoices(firmId);
  const updateStatus = useUpdateInvoiceStatus(firmId);
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (isLoading) return <div className="text-white">Loading invoices...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>Failed to load invoices</AlertDescription></Alert>;

  const invoicesByStatus = {
    draft: (invoices || []).filter((i) => i.status === 'draft'),
    sent: (invoices || []).filter((i) => i.status === 'sent'),
    paid: (invoices || []).filter((i) => i.status === 'paid'),
    overdue: (invoices || []).filter((i) => i.status === 'overdue'),
  };

  const statusIcons = {
    draft: XCircle,
    sent: Clock,
    paid: CheckCircle,
    overdue: AlertTriangle,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">💳 Billing</h3>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-purple-600 hover:bg-purple-700">
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(invoicesByStatus).map(([status, items]) => {
          const Icon = statusIcons[status as keyof typeof statusIcons];
          return (
            <Card key={status} className="bg-slate-800 border-gray-600">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm capitalize">{status}</p>
                    <p className="text-2xl font-bold text-white mt-2">{items.length}</p>
                  </div>
                  <Icon className="w-8 h-8 text-gray-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        {(invoices || []).slice(0, 10).map((invoice, idx) => (
          <motion.div key={invoice.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}>
            <Card className="bg-slate-800 border-gray-600">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-semibold">{invoice.invoiceNumber}</h4>
                    <p className="text-gray-400 text-sm">${invoice.amount.toFixed(2)} • {invoice.hoursWorked}h @ ${invoice.hourlyRate}/h</p>
                    <p className="text-gray-500 text-xs">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-white text-xs font-semibold ${
                      invoice.status === 'paid'
                        ? 'bg-green-600'
                        : invoice.status === 'overdue'
                          ? 'bg-red-600'
                          : invoice.status === 'sent'
                            ? 'bg-blue-600'
                            : 'bg-gray-600'
                    }`}>
                      {invoice.status}
                    </span>
                    {invoice.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ invoiceId: invoice.id, status: 'paid' })}
                        disabled={updateStatus.isPending}
                        className="text-xs"
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Main CA Firm Dashboard Full Component
export function CAFirmDashboardFull() {
  const { currentUser, logout } = usePersonaAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!currentUser) {
    navigate('/');
    return null;
  }

  const firmId = currentUser.companyId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">CA Firm Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage Team, Clients & Billing</p>
          </div>
          <Button variant="outline" onClick={logout} className="text-white border-gray-500">
            Logout
          </Button>
        </div>

        <Card className="bg-slate-800 border-gray-600 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Firm Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-2">
            <p>Organization: {currentUser.companyName}</p>
            <p>Manager: {currentUser.email}</p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border-gray-600">
            <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="text-gray-300 data-[state=active]:text-white">
              Team
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-gray-300 data-[state=active]:text-white">
              Clients
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-gray-300 data-[state=active]:text-white">
              Billing
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-gray-300 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AnalyticsChart firmId={firmId} />
            <TeamUtilization firmId={firmId} />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement firmId={firmId} />
          </TabsContent>

          <TabsContent value="clients">
            <ClientsOverview firmId={firmId} />
          </TabsContent>

          <TabsContent value="billing">
            <BillingDashboard firmId={firmId} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsChart firmId={firmId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
