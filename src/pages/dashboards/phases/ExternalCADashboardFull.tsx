import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  useCAClients,
  useAddClient,
  useCAudits,
  useScheduleAudit,
  useComplianceItems,
  useUpdateComplianceStatus,
  useAuditDocuments,
  useUploadDocument,
  useAuditReports,
  useGenerateAuditReport,
  useBulkScheduleAudits,
  type CAClient,
  type DCAudit,
} from '@/hooks/personas/useExternalCAData';
import { usePersonaAuth } from '@/lib/persona-auth-context';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  ChevronDown,
  Plus,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Search,
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  Loader2,
} from 'lucide-react';

// ClientsList Component
function ClientsList({ clients, loading, onSelectClient, selectedClient }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { data: filteredClients = [] } = useCAClients(searchTerm, statusFilter);

  if (loading) {
    return (
      <Card className="bg-slate-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Client Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-slate-800 border-gray-600">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Client Companies ({filteredClients.length})
            </CardTitle>
            <AddClientForm />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by company name or reg number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-gray-600 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 bg-slate-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-gray-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-400">Company Name</TableHead>
                  <TableHead className="text-gray-400">Reg. Number</TableHead>
                  <TableHead className="text-gray-400">Industry</TableHead>
                  <TableHead className="text-gray-400">Turnover</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Last Audit</TableHead>
                  <TableHead className="text-gray-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="border-gray-600 hover:bg-slate-700/50">
                    <TableCell className="text-white font-medium">{client.company_name}</TableCell>
                    <TableCell className="text-gray-300">{client.registration_number}</TableCell>
                    <TableCell className="text-gray-300">{client.industry}</TableCell>
                    <TableCell className="text-gray-300">
                      ₹{(client.annual_turnover / 1000000).toFixed(1)}M
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={client.status === 'active' ? 'default' : 'secondary'}
                        className={client.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {client.last_audit_date
                        ? new Date(client.last_audit_date).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectClient(client)}
                        className={selectedClient?.id === client.id ? 'bg-blue-600 text-white border-blue-600' : ''}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No clients found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// AddClientForm Component
function AddClientForm() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    industry: '',
    annual_turnover: '',
    employees_count: '',
    status: 'active' as const,
    assigned_date: new Date().toISOString(),
  });

  const addClientMutation = useAddClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addClientMutation.mutateAsync({
      ...formData,
      annual_turnover: parseFloat(formData.annual_turnover),
      employees_count: parseInt(formData.employees_count),
    });
    setOpen(false);
    setFormData({
      company_name: '',
      registration_number: '',
      industry: '',
      annual_turnover: '',
      employees_count: '',
      status: 'active',
      assigned_date: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription className="text-gray-400">
            Register a new client for audit management
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Company Name</label>
            <Input
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="bg-slate-700 border-gray-600 text-white"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Registration Number</label>
            <Input
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              className="bg-slate-700 border-gray-600 text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300">Industry</label>
              <Input
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="bg-slate-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Annual Turnover (₹)</label>
              <Input
                type="number"
                value={formData.annual_turnover}
                onChange={(e) => setFormData({ ...formData, annual_turnover: e.target.value })}
                className="bg-slate-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-300">Employees Count</label>
            <Input
              type="number"
              value={formData.employees_count}
              onChange={(e) => setFormData({ ...formData, employees_count: e.target.value })}
              className="bg-slate-700 border-gray-600 text-white"
            />
          </div>
          <Button
            type="submit"
            disabled={addClientMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {addClientMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Client'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// AuditCalendar Component
function AuditCalendar({ selectedClient }: any) {
  const { data: audits = [], isLoading } = useCAudits(selectedClient?.id || null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [auditFormData, setAuditFormData] = useState({
    audit_type: 'annual',
    scheduled_date: '',
    completion_deadline: '',
  });

  const scheduleAuditMutation = useScheduleAudit();
  const bulkScheduleMutation = useBulkScheduleAudits();

  const handleScheduleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    await scheduleAuditMutation.mutateAsync({
      client_id: selectedClient.id,
      audit_type: auditFormData.audit_type,
      scheduled_date: auditFormData.scheduled_date,
      completion_deadline: auditFormData.completion_deadline,
      status: 'pending',
    } as any);

    setScheduleOpen(false);
    setAuditFormData({ audit_type: 'annual', scheduled_date: '', completion_deadline: '' });
  };

  const statusCounts = useMemo(() => {
    return {
      pending: audits.filter((a) => a.status === 'pending').length,
      in_progress: audits.filter((a) => a.status === 'in_progress').length,
      completed: audits.filter((a) => a.status === 'completed').length,
      overdue: audits.filter((a) => a.status === 'overdue').length,
    };
  }, [audits]);

  if (!selectedClient) {
    return (
      <Card className="bg-slate-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Audit Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-400 py-8 text-center">
          Select a client to view and schedule audits
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-slate-800 border-gray-600">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Audits for {selectedClient.company_name}
            </CardTitle>
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Audit
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-gray-600 text-white">
                <DialogHeader>
                  <DialogTitle>Schedule New Audit</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Create a new audit for {selectedClient.company_name}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleScheduleAudit} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300">Audit Type</label>
                    <Select
                      value={auditFormData.audit_type}
                      onValueChange={(value) =>
                        setAuditFormData({ ...auditFormData, audit_type: value })
                      }
                    >
                      <SelectTrigger className="bg-slate-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-gray-600">
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="interim">Interim</SelectItem>
                        <SelectItem value="special">Special</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Scheduled Date</label>
                    <Input
                      type="date"
                      value={auditFormData.scheduled_date}
                      onChange={(e) =>
                        setAuditFormData({ ...auditFormData, scheduled_date: e.target.value })
                      }
                      className="bg-slate-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Completion Deadline</label>
                    <Input
                      type="date"
                      value={auditFormData.completion_deadline}
                      onChange={(e) =>
                        setAuditFormData({
                          ...auditFormData,
                          completion_deadline: e.target.value,
                        })
                      }
                      className="bg-slate-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={scheduleAuditMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {scheduleAuditMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      'Schedule Audit'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
              <div className="text-blue-400 text-2xl font-bold">{statusCounts.pending}</div>
              <div className="text-blue-300 text-sm mt-1">Pending</div>
            </div>
            <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4">
              <div className="text-yellow-400 text-2xl font-bold">{statusCounts.in_progress}</div>
              <div className="text-yellow-300 text-sm mt-1">In Progress</div>
            </div>
            <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
              <div className="text-green-400 text-2xl font-bold">{statusCounts.completed}</div>
              <div className="text-green-300 text-sm mt-1">Completed</div>
            </div>
            <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
              <div className="text-red-400 text-2xl font-bold">{statusCounts.overdue}</div>
              <div className="text-red-300 text-sm mt-1">Overdue</div>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : audits.length > 0 ? (
              audits.map((audit) => (
                <AuditRow key={audit.id} audit={audit} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No audits scheduled for this client</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// AuditRow Component
function AuditRow({ audit }: { audit: DCAudit }) {
  const statusColor = {
    pending: 'bg-blue-600/20 border-blue-600/30',
    in_progress: 'bg-yellow-600/20 border-yellow-600/30',
    completed: 'bg-green-600/20 border-green-600/30',
    overdue: 'bg-red-600/20 border-red-600/30',
  };

  const statusIcon = {
    pending: Clock,
    in_progress: TrendingUp,
    completed: CheckCircle2,
    overdue: AlertTriangle,
  };

  const Icon = statusIcon[audit.status];

  return (
    <div className={`border ${statusColor[audit.status]} rounded-lg p-4 flex items-start justify-between`}>
      <div className="flex gap-3">
        <Icon className="w-5 h-5 mt-1 text-white" />
        <div>
          <p className="text-white font-medium">{audit.audit_type} Audit</p>
          <p className="text-gray-400 text-sm">
            Scheduled: {new Date(audit.scheduled_date).toLocaleDateString()}
          </p>
          <p className="text-gray-400 text-sm">
            Deadline: {new Date(audit.completion_deadline).toLocaleDateString()}
          </p>
        </div>
      </div>
      <Badge variant="outline" className="capitalize">
        {audit.status}
      </Badge>
    </div>
  );
}

// ComplianceChecklist Component
function ComplianceChecklist({ selectedClient, selectedAudit }: any) {
  const { data: complianceItems = [], isLoading } = useComplianceItems(selectedAudit?.id || null);
  const updateMutation = useUpdateComplianceStatus();

  const handleToggleComplete = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateMutation.mutateAsync({
      itemId,
      status: newStatus as any,
    });
  };

  if (!selectedAudit) {
    return (
      <Card className="bg-slate-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Compliance Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-400 py-8 text-center">
          Select an audit to view compliance requirements
        </CardContent>
      </Card>
    );
  }

  const completedCount = complianceItems.filter((item) => item.status === 'completed').length;
  const completionPercent = complianceItems.length > 0 ? (completedCount / complianceItems.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-slate-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Compliance Checklist ({completedCount}/{complianceItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : complianceItems.length > 0 ? (
            <>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="space-y-2">
                {complianceItems.map((item) => (
                  <ComplianceItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggleComplete(item.id, item.status)}
                    loading={updateMutation.isPending}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No compliance items for this audit</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ComplianceItemRow Component
function ComplianceItemRow({ item, onToggle, loading }: any) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition">
      <button
        onClick={onToggle}
        disabled={loading}
        className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${
          item.status === 'completed'
            ? 'bg-green-600 border-green-600'
            : 'border-gray-500 hover:border-gray-400'
        }`}
      >
        {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-white" />}
      </button>
      <div className="flex-1">
        <p className={item.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}>
          {item.requirement}
        </p>
        <div className="flex gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
          {item.due_date && (
            <span className="text-xs text-gray-400">
              Due: {new Date(item.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <Badge
        variant={item.status === 'completed' ? 'default' : 'secondary'}
        className={
          item.status === 'completed'
            ? 'bg-green-600'
            : item.status === 'overdue'
              ? 'bg-red-600'
              : 'bg-yellow-600'
        }
      >
        {item.status}
      </Badge>
    </div>
  );
}

// DocumentUpload Component
function DocumentUpload({ selectedAudit }: any) {
  const { data: documents = [], isLoading } = useAuditDocuments(selectedAudit?.id || null);
  const uploadMutation = useUploadDocument();
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (!selectedAudit) return;

    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      await uploadMutation.mutateAsync({
        auditId: selectedAudit.id,
        file: files[i],
      });
    }
  };

  if (!selectedAudit) {
    return (
      <Card className="bg-slate-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-400 py-8 text-center">
          Select an audit to upload documents
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="bg-slate-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragActive={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
              dragActive
                ? 'border-blue-400 bg-blue-400/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-white font-medium">Drag & drop documents here</p>
            <p className="text-gray-400 text-sm">or click to select files</p>
            <input
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach((file) => {
                    uploadMutation.mutate({
                      auditId: selectedAudit.id,
                      file,
                    });
                  });
                }
              }}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button asChild className="mt-4 cursor-pointer">
                <span>Browse Files</span>
              </Button>
            </label>
          </div>

          {uploadMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </div>
          )}

          {documents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-medium">Uploaded Documents ({documents.length})</h4>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white text-sm font-medium">{doc.file_name}</p>
                      <p className="text-gray-400 text-xs">
                        {(doc.file_size / 1024).toFixed(2)} KB •{' '}
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {!uploadMutation.isPending && documents.length === 0 && (
            <div className="text-center py-4 text-gray-400">
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// AuditReportViewer Component
function AuditReportViewer({ selectedAudit }: any) {
  const { data: reports = [], isLoading } = useAuditReports(selectedAudit?.id || null);
  const generateMutation = useGenerateAuditReport();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    reportTitle: '',
    executiveSummary: '',
    findings: '',
    recommendations: '',
  });

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAudit) return;

    await generateMutation.mutateAsync({
      auditId: selectedAudit.id,
      ...reportFormData,
    });

    setGenerateOpen(false);
    setReportFormData({
      reportTitle: '',
      executiveSummary: '',
      findings: '',
      recommendations: '',
    });
  };

  if (!selectedAudit) {
    return (
      <Card className="bg-slate-800 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-400 py-8 text-center">
          Select an audit to view reports
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="bg-slate-800 border-gray-600">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit Reports
            </CardTitle>
            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-gray-600 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Generate Audit Report</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Create a comprehensive audit report
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGenerateReport} className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300">Report Title</label>
                    <Input
                      value={reportFormData.reportTitle}
                      onChange={(e) =>
                        setReportFormData({ ...reportFormData, reportTitle: e.target.value })
                      }
                      className="bg-slate-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Executive Summary</label>
                    <textarea
                      value={reportFormData.executiveSummary}
                      onChange={(e) =>
                        setReportFormData({
                          ...reportFormData,
                          executiveSummary: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Findings</label>
                    <textarea
                      value={reportFormData.findings}
                      onChange={(e) =>
                        setReportFormData({ ...reportFormData, findings: e.target.value })
                      }
                      className="w-full bg-slate-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Recommendations</label>
                    <textarea
                      value={reportFormData.recommendations}
                      onChange={(e) =>
                        setReportFormData({
                          ...reportFormData,
                          recommendations: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                      rows={3}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={generateMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Report'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{report.report_title}</p>
                      <p className="text-gray-400 text-sm">
                        Generated: {new Date(report.generated_at).toLocaleDateString()}
                      </p>
                    </div>
                    {report.pdf_url && (
                      <a
                        href={report.pdf_url}
                        download
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                  <div className="text-gray-300 text-sm space-y-2">
                    <div>
                      <p className="font-medium text-gray-400">Summary</p>
                      <p className="text-gray-400">{report.executive_summary}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No reports generated yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Main Dashboard Component
export function ExternalCADashboardFull() {
  const { currentUser, logout } = usePersonaAuth();
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<CAClient | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<DCAudit | null>(null);
  const { data: clients = [], isLoading } = useCAClients();
  const { data: audits = [] } = useCAudits(selectedClient?.id || null);

  if (!currentUser) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-white">External CA Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage multiple client audits and compliance</p>
          </div>
          <Button variant="outline" onClick={logout} className="text-white border-gray-500">
            Switch Role
          </Button>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-slate-800 border-gray-600 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Current Session</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-2">
              <p>Email: {currentUser.email}</p>
              <p>Company: {currentUser.companyName}</p>
              <p>Session ID: {currentUser.id}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <ClientsList
              clients={clients}
              loading={isLoading}
              onSelectClient={setSelectedClient}
              selectedClient={selectedClient}
            />
          </div>

          {selectedClient && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-6"
            >
              <Card className="bg-slate-800 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Selected Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-400">Company</p>
                    <p className="text-white font-medium">{selectedClient.company_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Registration</p>
                    <p className="text-white font-mono text-xs">{selectedClient.registration_number}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-400">Industry</p>
                      <p className="text-white">{selectedClient.industry}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Turnover</p>
                      <p className="text-white">₹{(selectedClient.annual_turnover / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400">Employees</p>
                    <p className="text-white">{selectedClient.employees_count}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Audits</span>
                    <span className="text-white font-bold">{audits.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Completed</span>
                    <span className="text-green-400 font-bold">
                      {audits.filter((a) => a.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Overdue</span>
                    <span className="text-red-400 font-bold">
                      {audits.filter((a) => a.status === 'overdue').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {audits.length > 0 && (
                <Card className="bg-slate-800 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Select Audit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedAudit?.id || ''} onValueChange={(auditId) => {
                      const audit = audits.find((a) => a.id === auditId);
                      setSelectedAudit(audit || null);
                    }}>
                      <SelectTrigger className="bg-slate-700 border-gray-600 text-white">
                        <SelectValue placeholder="Choose an audit..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-gray-600">
                        {audits.map((audit) => (
                          <SelectItem key={audit.id} value={audit.id}>
                            {audit.audit_type} - {new Date(audit.scheduled_date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </div>

        {/* Audit Management Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <AuditCalendar selectedClient={selectedClient} />
          <ComplianceChecklist
            selectedClient={selectedClient}
            selectedAudit={selectedAudit}
          />
        </div>

        {/* Documents and Reports Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <DocumentUpload selectedAudit={selectedAudit} />
          <AuditReportViewer selectedAudit={selectedAudit} />
        </div>
      </div>
    </div>
  );
}
