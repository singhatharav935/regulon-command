import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  AlertCircle,
  Calendar,
  MessageSquare,
  TrendingUp,
  Download,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import {
  useContracts,
  useCases,
  useLegalNotices,
  useCaseDocuments,
  useLegalRisks,
  type Contract,
  type Case,
  type LegalNotice,
  type CaseDocument,
  type LegalRisk,
} from '@/hooks/personas/useLawyerData';

// Contract Management Component
const ContractsList = ({ contracts, onAdd }: { contracts: Contract[]; onAdd: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = contracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusConfig = {
    active: { label: 'Active', className: 'bg-green-500/20 text-green-400', icon: CheckCircle },
    pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
    expired: { label: 'Expired', className: 'bg-red-500/20 text-red-400', icon: XCircle },
    archived: { label: 'Archived', className: 'bg-gray-500/20 text-gray-400', icon: FileText },
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search contracts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] bg-slate-800 border-slate-700"
        />
        <Select value={statusFilter || ''} onValueChange={(v) => setStatusFilter(v || null)}>
          <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onAdd} className="bg-red-500 hover:bg-red-600">
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 text-center p-8">
            <p className="text-gray-400">No contracts found</p>
          </Card>
        ) : (
          filtered.map((contract) => {
            const status = statusConfig[contract.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            const daysUntilExpiry = contract.end_date
              ? Math.ceil(
                  (new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{contract.title}</h3>
                        <p className="text-sm text-gray-400">{contract.vendor_name}</p>
                      </div>
                      <Badge className={`${status.className} border-none`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-sm text-gray-300">{contract.contract_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Value</p>
                        <p className="text-sm text-gray-300">
                          {contract.contract_value
                            ? `${contract.currency || 'USD'} ${contract.contract_value.toLocaleString()}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Start Date</p>
                        <p className="text-sm text-gray-300">
                          {new Date(contract.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expires</p>
                        <p className={`text-sm ${daysUntilExpiry && daysUntilExpiry < 30 ? 'text-red-400' : 'text-gray-300'}`}>
                          {new Date(contract.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {contract.key_terms && (
                      <p className="text-sm text-gray-400 mb-4 p-2 bg-slate-700/50 rounded">
                        {contract.key_terms}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className="text-amber-400 hover:bg-amber-500/10">
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Case List Component
const CaseList = ({ cases, onAdd }: { cases: Case[]; onAdd: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = cases.filter((c) => {
    const matchesSearch =
      c.case_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.case_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusConfig = {
    ongoing: { label: 'Ongoing', className: 'bg-blue-500/20 text-blue-400', icon: Clock },
    settled: { label: 'Settled', className: 'bg-green-500/20 text-green-400', icon: CheckCircle },
    completed: { label: 'Completed', className: 'bg-purple-500/20 text-purple-400', icon: CheckCircle },
    dismissed: { label: 'Dismissed', className: 'bg-gray-500/20 text-gray-400', icon: XCircle },
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] bg-slate-800 border-slate-700"
        />
        <Select value={statusFilter || ''} onValueChange={(v) => setStatusFilter(v || null)}>
          <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onAdd} className="bg-red-500 hover:bg-red-600">
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 text-center p-8">
            <p className="text-gray-400">No cases found</p>
          </Card>
        ) : (
          filtered.map((caseItem) => {
            const status = statusConfig[caseItem.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            const daysUntilHearing =
              caseItem.next_hearing || caseItem.hearing_date
                ? Math.ceil(
                    (new Date(caseItem.next_hearing || caseItem.hearing_date || '').getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;

            return (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{caseItem.case_title}</h3>
                        <p className="text-xs text-gray-400">
                          Case #{caseItem.case_number} • {caseItem.court_name}
                        </p>
                      </div>
                      <Badge className={`${status.className} border-none text-xs`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                      <div>
                        <p className="text-gray-500 mb-1">Type</p>
                        <p className="text-gray-300">{caseItem.case_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Assigned To</p>
                        <p className="text-gray-300">{caseItem.assigned_lawyer || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Next Hearing</p>
                        <p className={daysUntilHearing && daysUntilHearing < 14 ? 'text-red-400' : 'text-gray-300'}>
                          {caseItem.next_hearing || caseItem.hearing_date
                            ? new Date(caseItem.next_hearing || caseItem.hearing_date || '').toLocaleDateString()
                            : 'TBD'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      <Button variant="ghost" size="sm" className="text-amber-400 hover:bg-amber-500/10">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Notices Inbox Component
const NoticesInbox = ({ notices, onAdd }: { notices: LegalNotice[]; onAdd: () => void }) => {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filtered = notices.filter((n) => !filterStatus || n.status === filterStatus);

  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-orange-500/20 text-orange-400', icon: AlertCircle },
    responded: { label: 'Responded', className: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
    resolved: { label: 'Resolved', className: 'bg-green-500/20 text-green-400', icon: CheckCircle },
    escalated: { label: 'Escalated', className: 'bg-red-500/20 text-red-400', icon: AlertCircle },
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'responded', 'resolved', 'escalated'].map((status) => (
          <Button
            key={status}
            variant={filterStatus === (status === 'all' ? null : status) ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(status === 'all' ? null : status)}
            className={
              filterStatus === (status === 'all' ? null : status)
                ? 'bg-red-500 hover:bg-red-600'
                : 'border-slate-700 text-gray-400'
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
        <Button onClick={onAdd} className="ml-auto bg-red-500 hover:bg-red-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Notice
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 text-center p-8">
            <p className="text-gray-400">No notices</p>
          </Card>
        ) : (
          filtered.map((notice) => {
            const status = statusConfig[notice.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            const daysUntilDue = notice.response_due_date
              ? Math.ceil(
                  (new Date(notice.response_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{notice.subject}</h3>
                        <p className="text-xs text-gray-400">
                          From: {notice.issued_by} • Type: {notice.notice_type}
                        </p>
                      </div>
                      <Badge className={`${status.className} border-none text-xs`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{notice.content}</p>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                      <div>
                        <p className="text-gray-500 mb-1">Notice Date</p>
                        <p className="text-gray-300">{new Date(notice.notice_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Response Due</p>
                        <p className={daysUntilDue && daysUntilDue < 7 ? 'text-red-400' : 'text-gray-300'}>
                          {notice.response_due_date
                            ? new Date(notice.response_due_date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                        <Eye className="w-4 h-4 mr-1" />
                        View Full
                      </Button>
                      <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/10">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Respond
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Risk Assessment Component
const RiskAssessment = ({ risks, onAdd }: { risks: LegalRisk[]; onAdd: () => void }) => {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filtered = risks.filter((r) => !filterCategory || r.risk_category === filterCategory);

  const probabilityColor: Record<string, string> = {
    low: 'text-green-400 bg-green-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    high: 'text-red-400 bg-red-500/20',
  };

  const statusConfig = {
    identified: { label: 'Identified', className: 'bg-orange-500/20 text-orange-400', icon: AlertCircle },
    mitigating: { label: 'Mitigating', className: 'bg-blue-500/20 text-blue-400', icon: TrendingUp },
    monitored: { label: 'Monitored', className: 'bg-yellow-500/20 text-yellow-400', icon: Eye },
    resolved: { label: 'Resolved', className: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={!filterCategory ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory(null)}
          className={
            !filterCategory ? 'bg-red-500 hover:bg-red-600' : 'border-slate-700 text-gray-400'
          }
        >
          All Risks ({filtered.length})
        </Button>
        <Button onClick={onAdd} className="ml-auto bg-red-500 hover:bg-red-600">
          <Plus className="w-4 h-4 mr-2" />
          Assess Risk
        </Button>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 text-center p-8">
            <p className="text-gray-400">No risks identified</p>
          </Card>
        ) : (
          filtered.map((risk) => {
            const status = statusConfig[risk.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            const riskScore =
              (risk.probability === 'high' ? 3 : risk.probability === 'medium' ? 2 : 1) *
              (risk.impact === 'high' ? 3 : risk.impact === 'medium' ? 2 : 1);

            return (
              <motion.div
                key={risk.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{risk.risk_title}</h3>
                        <p className="text-xs text-gray-400">Category: {risk.risk_category}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-400">{riskScore}/9</div>
                        <p className="text-xs text-gray-400">Risk Score</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-300 mb-3">{risk.risk_description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Probability</p>
                        <Badge className={`${probabilityColor[risk.probability]} border-none text-xs`}>
                          {risk.probability.charAt(0).toUpperCase() + risk.probability.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Impact</p>
                        <Badge className={`${probabilityColor[risk.impact]} border-none text-xs`}>
                          {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Owner</p>
                        <p className="text-xs text-gray-300">{risk.mitigation_owner || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <Badge className={`${status.className} border-none text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>

                    {risk.mitigation_plan && (
                      <div className="bg-slate-700/50 rounded p-3 mb-3">
                        <p className="text-xs text-gray-400 mb-1 font-semibold">Mitigation Plan</p>
                        <p className="text-xs text-gray-300">{risk.mitigation_plan}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                        <Edit2 className="w-4 h-4 mr-1" />
                        Update
                      </Button>
                      <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/10">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Resolved
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Litigation Tracker Component
const LitigationTracker = ({ cases }: { cases: Case[] }) => {
  const ongoingCases = cases.filter((c) => c.status === 'ongoing');
  const upcomingHearings = ongoingCases
    .filter((c) => c.next_hearing || c.hearing_date)
    .sort((a, b) =>
      new Date(a.next_hearing || a.hearing_date || '').getTime() -
      new Date(b.next_hearing || b.hearing_date || '').getTime()
    )
    .slice(0, 5);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-red-400" />
          Upcoming Court Hearings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingHearings.length === 0 ? (
            <p className="text-gray-400 text-sm">No upcoming hearings</p>
          ) : (
            upcomingHearings.map((caseItem) => {
              const daysUntil = Math.ceil(
                (new Date(caseItem.next_hearing || caseItem.hearing_date || '').getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={caseItem.id}
                  className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex items-start justify-between"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">{caseItem.case_title}</p>
                    <p className="text-xs text-gray-400">{caseItem.court_name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      📅 {new Date(caseItem.next_hearing || caseItem.hearing_date || '').toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    className={`${
                      daysUntil < 7
                        ? 'bg-red-500/20 text-red-400'
                        : daysUntil < 14
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                    } border-none`}
                  >
                    {daysUntil}d away
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Case Documents Component
const CaseDocuments = ({ caseDocuments }: { caseDocuments: CaseDocument[] }) => {
  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-gray-500/20 text-gray-400', icon: FileText },
    submitted: { label: 'Submitted', className: 'bg-blue-500/20 text-blue-400', icon: MessageSquare },
    approved: { label: 'Approved', className: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-400" />
            Case Documents
          </span>
          <Button size="sm" className="bg-red-500 hover:bg-red-600">
            <Plus className="w-4 h-4 mr-1" />
            Upload
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {caseDocuments.length === 0 ? (
            <p className="text-gray-400 text-sm">No documents</p>
          ) : (
            caseDocuments.map((doc) => {
              const status = statusConfig[doc.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{doc.document_name}</p>
                      <p className="text-xs text-gray-400">{doc.document_type}</p>
                    </div>
                  </div>
                  <Badge className={`${status.className} border-none text-xs`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                    <Download className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
export const LawyerDashboardFull = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('contracts');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const { data: contracts = [] } = useContracts(user?.id || null);
  const { data: cases = [] } = useCases(user?.id || null);
  const { data: notices = [] } = useLegalNotices(user?.id || null);
  const { data: risks = [] } = useLegalRisks(user?.id || null);
  const { data: caseDocuments = [] } = useCaseDocuments(selectedCaseId);

  const activeContracts = contracts.filter((c) => c.status === 'active').length;
  const ongoingCases = cases.filter((c) => c.status === 'ongoing').length;
  const pendingNotices = notices.filter((n) => n.status === 'pending').length;
  const highRisks = risks.filter((r) => r.probability === 'high' || r.impact === 'high').length;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">In-house Lawyer Dashboard</h1>
          <p className="text-gray-400">Contracts, Litigation & Legal Risk Management</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Contracts', value: activeContracts, icon: FileText, color: 'text-blue-400' },
            { label: 'Ongoing Cases', value: ongoingCases, icon: AlertCircle, color: 'text-orange-400' },
            { label: 'Pending Notices', value: pendingNotices, icon: MessageSquare, color: 'text-yellow-400' },
            { label: 'High Risk Items', value: highRisks, icon: TrendingUp, color: 'text-red-400' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                      </div>
                      <Icon className={`w-8 h-8 ${stat.color} opacity-50`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-800 border border-slate-700 mb-6 w-full">
                <TabsTrigger
                  value="contracts"
                  className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
                >
                  📋 Contracts
                </TabsTrigger>
                <TabsTrigger
                  value="cases"
                  className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
                >
                  ⚖️ Cases
                </TabsTrigger>
                <TabsTrigger
                  value="notices"
                  className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
                >
                  ⚠️ Notices
                </TabsTrigger>
                <TabsTrigger
                  value="risks"
                  className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
                >
                  🎯 Risks
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contracts">
                <ContractsList contracts={contracts} onAdd={() => {}} />
              </TabsContent>

              <TabsContent value="cases">
                <CaseList cases={cases} onAdd={() => {}} />
              </TabsContent>

              <TabsContent value="notices">
                <NoticesInbox notices={notices} onAdd={() => {}} />
              </TabsContent>

              <TabsContent value="risks">
                <RiskAssessment risks={risks} onAdd={() => {}} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <LitigationTracker cases={cases} />
            <CaseDocuments caseDocuments={caseDocuments} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerDashboardFull;
