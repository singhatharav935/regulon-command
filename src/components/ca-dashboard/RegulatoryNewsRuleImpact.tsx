/**
 * RegulatoryNewsRuleImpact — Version-Control & Change-Log of Regulatory Text (Gap 5)
 * Full Supabase database integration. No mock data.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CASectionAgentBadge } from '../agents/CASectionAgentBadge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, Calendar, AlertTriangle, FileText, Bell, RefreshCw, ExternalLink,
  Filter, Search, Bot, Zap, Activity, Shield, Building2, Clock, ChevronDown,
  ChevronUp, Bookmark, Share2, Download, TrendingUp, Globe, Gavel, AlertCircle,
  CheckCircle, Info, History, ArrowRight, Save, Plus, ArrowLeftRight, Check, Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

import { useCAIdentity } from '@/hooks/useCAIdentity';
import {
  useRegulatoryNewsList,
  useRegulatoryNewsVersions,
  useCompanyEvaluations
} from '@/hooks/useRegulatoryVersion';

// ─── Input Sanitization ─────────────────────────────────────────────────────
const MAX_SEARCH_LENGTH = 200;
const MAX_TITLE_LENGTH = 300;
const MAX_TEXT_LENGTH = 10000;
const MAX_PAYLOAD_SIZE_BYTES = 16384;

const sanitizeInput = (raw: string, maxLength: number = 500): string => {
  return raw
    .replace(/<[^>]*>/g, '')           // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control chars
    .replace(/javascript:/gi, '')       // Block JS protocol
    .replace(/on\w+\s*=/gi, '')         // Strip inline event handlers
    .trim()
    .slice(0, maxLength);
};

const validateFormPayload = (payload: Record<string, unknown>): { valid: boolean; error?: string } => {
  const json = JSON.stringify(payload);
  if (json.length > MAX_PAYLOAD_SIZE_BYTES) {
    return { valid: false, error: `Payload too large (${json.length} bytes, max ${MAX_PAYLOAD_SIZE_BYTES})` };
  }
  return { valid: true };
};

// ─── Constants & Metadata ───────────────────────────────────────────────────

const GOVERNMENT_PORTALS = [
  { code: 'MCA', name: 'Ministry of Corporate Affairs', url: 'https://www.mca.gov.in', icon: '🏛️' },
  { code: 'GST', name: 'GST Council / CBIC', url: 'https://cbic-gst.gov.in', icon: '💰' },
  { code: 'RBI', name: 'Reserve Bank of India', url: 'https://www.rbi.org.in', icon: '🏦' },
  { code: 'SEBI', name: 'Securities & Exchange Board', url: 'https://www.sebi.gov.in', icon: '📈' },
  { code: 'MEITY', name: 'Ministry of Electronics & IT', url: 'https://www.meity.gov.in', icon: '💻' },
  { code: 'MoF', name: 'Ministry of Finance', url: 'https://finmin.nic.in', icon: '💵' },
  { code: 'EPFO', name: 'Employees PF Organization', url: 'https://www.epfindia.gov.in', icon: '👥' },
  { code: 'ESIC', name: 'ESI Corporation', url: 'https://www.esic.gov.in', icon: '🏥' },
  { code: 'IT', name: 'Income Tax Department', url: 'https://www.incometaxindia.gov.in', icon: '📊' },
  { code: 'CBDT', name: 'Central Board of Direct Taxes', url: 'https://www.incometaxindia.gov.in', icon: '📊' },
  { code: 'ROC', name: 'Registrar of Companies', url: 'https://www.mca.gov.in', icon: '📋' },
  { code: 'LOCAL', name: 'State Commercial Tax Depts', url: 'https://www.gst.gov.in', icon: '🏙️' },
  { code: 'MSME', name: 'Ministry of MSME', url: 'https://msme.gov.in', icon: '🏭' },
];

const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  law_amendment:  { icon: <Gavel className="w-3.5 h-3.5" />, label: 'Law Amendment',  color: 'bg-purple-500/20 text-purple-400' },
  new_regulation: { icon: <Scale className="w-3.5 h-3.5" />, label: 'New Regulation', color: 'bg-blue-500/20 text-blue-400' },
  circular:       { icon: <FileText className="w-3.5 h-3.5" />, label: 'Circular',       color: 'bg-cyan-500/20 text-cyan-400' },
  notification:   { icon: <Bell className="w-3.5 h-3.5" />, label: 'Notification',   color: 'bg-indigo-500/20 text-indigo-400' },
  guideline:      { icon: <Info className="w-3.5 h-3.5" />, label: 'Guideline',      color: 'bg-teal-500/20 text-teal-400' },
  penalty_update: { icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Penalty Update', color: 'bg-red-500/20 text-red-400' },
};

const IMPACT_META: Record<string, { emoji: string; label: string; color: string; border: string }> = {
  critical: { emoji: '🚨', label: 'CRITICAL', color: 'bg-red-500/20 text-red-400', border: 'border-red-500/30' },
  high:     { emoji: '⚠️', label: 'HIGH',     color: 'bg-orange-500/20 text-orange-400', border: 'border-orange-500/30' },
  medium:   { emoji: '🟡', label: 'MEDIUM',   color: 'bg-yellow-500/20 text-yellow-400', border: 'border-yellow-500/30' },
  low:      { emoji: '🟢', label: 'LOW',      color: 'bg-green-500/20 text-green-400', border: 'border-green-500/30' },
};

// ─── Details Tab Component ───────────────────────────────────────────────────

const DetailsTab = ({ item, isRealDashboard }: { item: any; isRealDashboard: boolean }) => {
  const portal = GOVERNMENT_PORTALS.find(p => p.code === item.authorityCode);
  return (
    <div className="space-y-4 pt-3 text-sm">
      <p className="text-muted-foreground leading-relaxed">{item.summary}</p>
      
      {item.full_text && (
        <div className="mt-3 p-3 bg-card/25 border border-border/20 rounded-lg max-h-[160px] overflow-y-auto font-mono text-xs whitespace-pre-wrap text-muted-foreground">
          {item.full_text}
        </div>
      )}

      {isRealDashboard && item.aiImpactAnalysis && (
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Bot className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Impact Analysis</span>
          </div>
          <p className="text-xs leading-relaxed text-purple-200">{item.aiImpactAnalysis}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h5 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Affected Sectors</h5>
          <div className="flex flex-wrap gap-1.5">
            {item.affectedSectors?.map((s: string) => (
              <Badge key={s} variant="outline" className="text-xs py-0.5">{s}</Badge>
            )) || <span className="text-xs text-muted-foreground">All Sectors</span>}
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Company Scope</h5>
          <div className="flex flex-wrap gap-1.5">
            {item.affectedCompanyTypes?.map((c: string) => (
              <Badge key={c} variant="outline" className="text-xs py-0.5">{c}</Badge>
            )) || <span className="text-xs text-muted-foreground">All Company Types</span>}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Required CA Action Checklists</h5>
        <div className="space-y-1">
          {item.requiredActions?.map((act: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <span className="text-green-400 font-bold">✓</span>
              <span>{act}</span>
            </div>
          )) || <span className="text-xs text-muted-foreground">No specific actions required.</span>}
        </div>
      </div>

      {item.penaltyInfo?.maxPenalty && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
            <AlertTriangle className="w-4 h-4" /> Penalty Information
          </div>
          <p><strong>Max Fine:</strong> {item.penaltyInfo.maxPenalty}</p>
          {item.penaltyInfo.lateFilingFee && <p className="mt-1"><strong>Late Filing Fee:</strong> {item.penaltyInfo.lateFilingFee}</p>}
        </div>
      )}
    </div>
  );
};

// ─── Version History & Diffs Tab ─────────────────────────────────────────────

const HistoryTab = ({ newsId, currentItem }: { newsId: string; currentItem: any }) => {
  const { versions, loading } = useRegulatoryNewsVersions(newsId);
  const [selectedPrevVersion, setSelectedPrevVersion] = useState<number | null>(null);

  const prevItem = useMemo(() => {
    if (!selectedPrevVersion || !versions.length) return null;
    return versions.find(v => v.version === selectedPrevVersion);
  }, [selectedPrevVersion, versions]);

  if (loading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-cyan-400" /></div>;
  }

  return (
    <div className="space-y-5 pt-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Version list timeline */}
        <div className="md:col-span-1 border-r border-border/30 pr-4 space-y-3">
          <h5 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Version History Log</h5>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            
            {/* Active Version */}
            <div
              onClick={() => setSelectedPrevVersion(null)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedPrevVersion === null 
                  ? 'border-cyan-500 bg-cyan-500/5' 
                  : 'border-border/30 bg-card/20 hover:bg-card/40'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-cyan-400">Version {currentItem.version} (Active)</span>
                <Badge className="bg-green-500/20 text-green-400 text-[9px]">Active</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{currentItem.change_summary || 'Current active rule'}</p>
            </div>

            {/* Historical versions */}
            {versions.map(v => (
              <div
                key={v.id}
                onClick={() => setSelectedPrevVersion(v.version)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedPrevVersion === v.version 
                    ? 'border-cyan-500 bg-cyan-500/5' 
                    : 'border-border/30 bg-card/20 hover:bg-card/40'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold">Version {v.version}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(v.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{v.change_summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Change diff panel */}
        <div className="md:col-span-2 space-y-4">
          {selectedPrevVersion === null ? (
            <div className="p-8 text-center border border-dashed border-border/20 rounded-xl text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-35 text-cyan-400" />
              <p className="text-xs font-semibold">Select a previous version on the left to compare change logs and text diffs.</p>
            </div>
          ) : prevItem ? (
            <div className="space-y-4">
              <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold">Comparing Version {prevItem.version}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-semibold text-cyan-400">Version {currentItem.version} (Active)</span>
                </div>
              </div>

              {/* Compare attributes */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                {[
                  { field: 'Title', prev: prevItem.title, curr: currentItem.title },
                  { field: 'Effective Date', prev: prevItem.effective_date, curr: currentItem.effective_date },
                  { field: 'Summary', prev: prevItem.summary, curr: currentItem.summary },
                  { field: 'Penalty Max', prev: prevItem.penalty_max || 'None', curr: currentItem.penaltyInfo?.maxPenalty || 'None' },
                  { field: 'Required Actions', prev: prevItem.required_actions?.join(', '), curr: currentItem.requiredActions?.join(', ') }
                ].map(diff => {
                  const hasChanged = diff.prev !== diff.curr;
                  return (
                    <div key={diff.field} className="border border-border/20 rounded-lg overflow-hidden text-xs">
                      <div className={`p-2 font-semibold flex justify-between ${hasChanged ? 'bg-amber-500/10 text-amber-400' : 'bg-card/40 text-muted-foreground'}`}>
                        <span>{diff.field}</span>
                        {hasChanged && <Badge className="bg-amber-500/20 text-amber-400 text-[9px]">Modified</Badge>}
                      </div>
                      
                      <div className="grid grid-cols-2 divide-x divide-border/20 bg-card/10">
                        <div className="p-3 text-red-400 bg-red-950/10 space-y-1">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">Before</p>
                          <p className="leading-relaxed">{diff.prev}</p>
                        </div>
                        <div className="p-3 text-green-400 bg-green-950/10 space-y-1">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">After</p>
                          <p className="leading-relaxed">{diff.curr}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ─── Matched Clients Tab Component ───────────────────────────────────────────

const ClientsTab = ({ newsId }: { newsId: string }) => {
  const { evaluations, loading, changeStatus, notifyClient } = useCompanyEvaluations(newsId);
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  const [evalStatus, setEvalStatus] = useState<'compliant' | 'action_required' | 'non_compliant'>('compliant');
  const [evalNotes, setEvalNotes] = useState('');

  if (loading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return <Badge className="bg-green-500/20 text-green-400">Compliant</Badge>;
      case 'action_required': return <Badge className="bg-orange-500/20 text-orange-400">Action Required</Badge>;
      case 'non_compliant': return <Badge className="bg-red-500/20 text-red-400">Non-Compliant</Badge>;
      default: return <Badge className="bg-gray-500/20 text-gray-400">Pending Review</Badge>;
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedEval) return;
    try {
      await changeStatus(selectedEval.id, evalStatus, evalNotes);
      setSelectedEval(null);
      setEvalNotes('');
    } catch {}
  };

  return (
    <div className="space-y-4 pt-3">
      <div className="flex justify-between items-center mb-1">
        <h5 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Re-evaluated Client Impacts</h5>
        <Badge variant="outline" className="text-[10px]">{evaluations.length} Matched Clients</Badge>
      </div>

      {evaluations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/20 rounded-xl text-muted-foreground bg-card/10">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-25" />
          No client companies matched the industry or company type filters of this rule yet.
        </div>
      ) : (
        <div className="rounded-xl border border-border/30 overflow-hidden bg-card/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-card/50 border-border/40 text-xs">
                <TableHead className="text-muted-foreground">Client Name</TableHead>
                <TableHead className="text-muted-foreground">Sector / Industry</TableHead>
                <TableHead className="text-muted-foreground">Re-evaluation Trigger</TableHead>
                <TableHead className="text-muted-foreground text-center">Compliance Status</TableHead>
                <TableHead className="text-muted-foreground text-center">Notification Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {evaluations.map(ev => (
                <TableRow key={ev.id} className="border-border/20 hover:bg-card/20">
                  <TableCell className="font-semibold py-2.5">{ev.company_name}</TableCell>
                  <TableCell className="py-2.5">{ev.company_industry}</TableCell>
                  <TableCell className="py-2.5 text-muted-foreground max-w-[200px] truncate" title={ev.matched_reason}>
                    {ev.matched_reason}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">{getStatusBadge(ev.evaluation_status)}</TableCell>
                  <TableCell className="py-2.5 text-center">
                    {ev.notification_sent ? (
                      <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 gap-1">
                        <Check className="w-3 h-3" /> Alert Sent
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Unnotified</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => {
                          setSelectedEval(ev);
                          setEvalStatus(ev.evaluation_status === 'pending_review' ? 'compliant' : ev.evaluation_status as any);
                          setEvalNotes(ev.notes || '');
                        }}
                      >
                        Evaluate
                      </Button>
                      
                      {!ev.notification_sent && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-cyan-400 hover:bg-cyan-500/10"
                          onClick={() => notifyClient(ev.id)}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Evaluate Status Dialog */}
      <Dialog open={!!selectedEval} onOpenChange={o => !o && setSelectedEval(null)}>
        <DialogContent className="bg-background border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-indigo-400 flex items-center gap-2 text-sm font-bold">
              <Building2 className="w-4 h-4" /> Evaluate Client Compliance
            </DialogTitle>
          </DialogHeader>
          {selectedEval && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-card/30 border border-border/30 text-xs">
                <p className="font-semibold text-foreground">{selectedEval.company_name}</p>
                <p className="text-muted-foreground mt-0.5">Matched reason: {selectedEval.matched_reason}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Compliance Status *</Label>
                <Select value={evalStatus} onValueChange={v => setEvalStatus(v as any)} name="eval-status-filter" aria-label="Filter by evaluation status">
                  <SelectTrigger className="bg-card/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="compliant">Compliant</SelectItem>
                    <SelectItem value="action_required">Action Required</SelectItem>
                    <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Audit Evaluation Notes</Label>
                <Textarea
                  id="eval-notes"
                  name="eval-notes"
                  aria-label="Audit evaluation notes"
                  value={evalNotes}
                  onChange={e => setEvalNotes(e.target.value)}
                  placeholder="Record specific audit notes or checklist compliance steps..."
                  className="bg-card/50 border-border/50 h-20 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleUpdateStatus}>
                  Save Audit Status
                </Button>
                <Button variant="outline" onClick={() => setSelectedEval(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Amend Circular Tab Component ────────────────────────────────────────────

const AmendTab = ({ item, onUpdateSuccess }: { item: any; onUpdateSuccess: () => void }) => {
  const [form, setForm] = useState({
    title: item.title,
    summary: item.summary,
    full_text: item.full_text || '',
    effective_date: item.effectiveDate,
    published_date: item.publishedDate,
    impact_level: item.impactLevel,
    penalty_max: item.penaltyInfo?.maxPenalty || '',
    penalty_late_fee: item.penaltyInfo?.lateFilingFee || '',
    change_summary: ''
  });
  const [saving, setSaving] = useState(false);
  const { editNews } = useRegulatoryNewsList();

  const handleAmend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.change_summary) {
      toast.error('Change summary log is required for version control audits');
      return;
    }

    setSaving(true);
    try {
      // Sanitize all text inputs before submission
      const sanitizedData = {
        title: sanitizeInput(form.title, MAX_TITLE_LENGTH),
        summary: sanitizeInput(form.summary, 2000),
        full_text: sanitizeInput(form.full_text, MAX_TEXT_LENGTH),
        effective_date: form.effective_date,
        published_date: form.published_date,
        impact_level: form.impact_level,
        penalty_max: sanitizeInput(form.penalty_max, 100),
        penalty_late_fee: sanitizeInput(form.penalty_late_fee, 100)
      };

      const validation = validateFormPayload(sanitizedData as Record<string, unknown>);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid payload');
        setSaving(false);
        return;
      }

      await editNews(item.id, sanitizedData as any, sanitizeInput(form.change_summary, 500));
      
      onUpdateSuccess();
    } catch {}
    setSaving(false);
  };

  return (
    <form onSubmit={handleAmend} className="space-y-4 pt-3 text-xs max-h-[400px] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Circular Title *</Label>
          <Input id="rule-edit-title" name="rule-edit-title" aria-label="Rule title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1 bg-card/50 border-border/50" />
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Effective Date *</Label>
          <Input id="rule-edit-effective-date" name="rule-edit-effective-date" aria-label="Effective date" required type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} className="mt-1 bg-card/50 border-border/50" />
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Published Date *</Label>
          <Input id="rule-edit-published-date" name="rule-edit-published-date" aria-label="Published date" required type="date" value={form.published_date} onChange={e => setForm(f => ({ ...f, published_date: e.target.value }))} className="mt-1 bg-card/50 border-border/50" />
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Impact Level *</Label>
          <Select value={form.impact_level} onValueChange={v => setForm(f => ({ ...f, impact_level: v }))} name="rule-edit-impact" aria-label="Impact level">
            <SelectTrigger className="mt-1 bg-card/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Max Penalty Fine</Label>
          <Input id="rule-edit-penalty" name="rule-edit-penalty" aria-label="Maximum penalty" value={form.penalty_max} onChange={e => setForm(f => ({ ...f, penalty_max: e.target.value }))} placeholder="₹250 Crore" className="mt-1 bg-card/50 border-border/50" />
        </div>

        <div className="col-span-2">
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Change Summary Audit log *</Label>
          <Input
            id="rule-edit-change-summary"
            name="rule-edit-change-summary"
            aria-label="Change summary audit log"
            required
            placeholder="Describe what changed in this version (e.g. rate reduced from 18% to 12% by Council Notification...)"
            value={form.change_summary}
            onChange={e => setForm(f => ({ ...f, change_summary: e.target.value }))}
            className="mt-1 bg-card/50 border-border/50 border-cyan-500/30"
          />
        </div>

        <div className="col-span-2">
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Circular Summary *</Label>
          <Textarea id="rule-edit-summary" name="rule-edit-summary" aria-label="Rule summary" required value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} className="mt-1 bg-card/50 border-border/50 h-16" />
        </div>

        <div className="col-span-2">
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Full Act / Circular Text</Label>
          <Textarea id="rule-edit-fulltext" name="rule-edit-fulltext" aria-label="Full notification text" value={form.full_text} onChange={e => setForm(f => ({ ...f, full_text: e.target.value }))} className="mt-1 bg-card/50 border-border/50 h-24 font-mono" />
        </div>
      </div>

      <Button type="submit" disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white w-full">
        {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Amend Circular (Increments Version & Re-evaluates Clients)
      </Button>
    </form>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

interface RegulatoryNewsRuleImpactProps {
  isRealDashboard?: boolean;
  apiEndpoint?: string;
  aiEnabled?: boolean;
  caId?: string;
}

export default function RegulatoryNewsRuleImpact({
  isRealDashboard = false,
  aiEnabled = true,
  caId = ''
}: RegulatoryNewsRuleImpactProps) {
  
  const { news, loading, refetch, addNews } = useRegulatoryNewsList();
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllNews, setShowAllNews] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, 'details' | 'history' | 'clients' | 'amend'>>({});
  const [showAddNews, setShowAddNews] = useState(false);

  const [filters, setFilters] = useState({
    authority: 'all',
    impactLevel: 'all',
    category: 'all',
  });

  // Add custom news form state
  const [addForm, setAddForm] = useState({
    title: '', summary: '', full_text: '', authority: 'GST Council / CBIC', authority_code: 'GST',
    category: 'circular', effective_date: '', published_date: '', impact_level: 'medium',
    penalty_max: '', penalty_late_fee: '', change_summary: 'Initial release',
    affected_sectors: 'IT Services, E-commerce', affected_companies: 'Private Limited, LLP'
  });

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title || !addForm.summary || !addForm.effective_date) {
      toast.error('Title, Summary, and Effective date are required');
      return;
    }

    try {
      // Sanitize all form inputs before submission
      const sanitizedPayload = {
        title: sanitizeInput(addForm.title, MAX_TITLE_LENGTH),
        summary: sanitizeInput(addForm.summary, 2000),
        full_text: addForm.full_text ? sanitizeInput(addForm.full_text, MAX_TEXT_LENGTH) : null,
        authority: sanitizeInput(addForm.authority, 200),
        authority_code: addForm.authority_code,
        category: addForm.category,
        effective_date: addForm.effective_date,
        published_date: addForm.published_date || addForm.effective_date,
        impact_level: addForm.impact_level as any,
        penalty_max: addForm.penalty_max ? sanitizeInput(addForm.penalty_max, 100) : null,
        penalty_late_fee: addForm.penalty_late_fee ? sanitizeInput(addForm.penalty_late_fee, 100) : null,
        change_summary: sanitizeInput(addForm.change_summary, 500),
        affected_sectors: addForm.affected_sectors.split(',').map(s => sanitizeInput(s, 100)),
        affected_companies: addForm.affected_companies.split(',').map(c => sanitizeInput(c, 100)),
        required_actions: ['Update invoicing systems', 'Transitional return check']
      };

      const validation = validateFormPayload(sanitizedPayload as Record<string, unknown>);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid payload');
        return;
      }

      await addNews(sanitizedPayload);
      setShowAddNews(false);
      refetch();
    } catch {}
  };

  const getDaysUntilEffective = (effectiveDate: string) => {
    const days = Math.ceil(
      (new Date(effectiveDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return isNaN(days) ? 0 : days;
  };

  const filteredNewsList = useMemo(() => {
    return news.filter(item => {
      const matchSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.authority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchAuth = filters.authority === 'all' || item.authority_code === filters.authority;
      const matchImpact = filters.impactLevel === 'all' || item.impact_level === filters.impactLevel;
      const matchCategory = filters.category === 'all' || item.category === filters.category;

      return matchSearch && matchAuth && matchImpact && matchCategory;
    });
  }, [news, searchQuery, filters]);

  const stats = useMemo(() => {
    return [
      {
        label: 'Critical Updates',
        count: filteredNewsList.filter((n) => n.impact_level === 'critical').length,
        icon: <AlertTriangle className="w-4 h-4" />,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
      },
      {
        label: 'High Priority',
        count: filteredNewsList.filter((n) => n.impact_level === 'high').length,
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
      },
      {
        label: 'Coming This Month',
        count: filteredNewsList.filter((n) => getDaysUntilEffective(n.effective_date) <= 30 && getDaysUntilEffective(n.effective_date) > 0).length,
        icon: <Calendar className="w-4 h-4" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
      },
      {
        label: 'Total Active Rules',
        count: filteredNewsList.length,
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
      },
    ];
  }, [filteredNewsList]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Scale className="w-6 h-6 text-cyan-400" />
            📜 Regulatory News & Rule Impact
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Auditable change log and version-control systems tracking CBIC, CBDT, RBI, and MCA regulatory amendments.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={refetch} className="border-border/50">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>

          <Dialog open={showAddNews} onOpenChange={setShowAddNews}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Circular
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border/50 max-w-lg max-h-[85vh] overflow-y-auto pr-1">
              <DialogHeader>
                <DialogTitle className="text-cyan-400 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Publish New Circular
                </DialogTitle>
                <CardDescription>Creates a new regulatory text update and maps it to client scopes.</CardDescription>
              </DialogHeader>
              <form onSubmit={handleCreateNews} className="space-y-4 pt-2 text-xs">
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">Circular Title *</Label>
                  <Input id="rule-add-title" name="rule-add-title" aria-label="New rule title" required value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. GST Council Rate Cut SaaS Products" className="mt-1 bg-card/50 border-border/50" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Authority *</Label>
                    <Input id="rule-add-authority" name="rule-add-authority" aria-label="Issuing authority" required value={addForm.authority} onChange={e => setAddForm(f => ({ ...f, authority: e.target.value }))} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Authority Code *</Label>
                    <Select value={addForm.authority_code} onValueChange={v => setAddForm(f => ({ ...f, authority_code: v }))} name="rule-add-authority-code" aria-label="Authority code">
                      <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        {GOVERNMENT_PORTALS.map(p => <SelectItem key={p.code} value={p.code}>{p.icon} {p.code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Category *</Label>
                    <Select value={addForm.category} onValueChange={v => setAddForm(f => ({ ...f, category: v }))} name="rule-add-category" aria-label="Rule category">
                      <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="law_amendment">⚖️ Law Amendment</SelectItem>
                        <SelectItem value="new_regulation">📜 New Regulation</SelectItem>
                        <SelectItem value="circular">📄 Circular</SelectItem>
                        <SelectItem value="notification">🔔 Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Impact Level *</Label>
                    <Select value={addForm.impact_level} onValueChange={v => setAddForm(f => ({ ...f, impact_level: v }))} name="rule-add-impact" aria-label="Impact level">
                      <SelectTrigger className="mt-1 bg-card/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Effective Date *</Label>
                    <Input id="rule-add-effective-date" name="rule-add-effective-date" aria-label="Effective date" required type="date" value={addForm.effective_date} onChange={e => setAddForm(f => ({ ...f, effective_date: e.target.value }))} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Published Date</Label>
                    <Input id="rule-add-published-date" name="rule-add-published-date" aria-label="Published date" type="date" value={addForm.published_date} onChange={e => setAddForm(f => ({ ...f, published_date: e.target.value }))} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border/20 pt-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Affected Sectors (Comma sep) *</Label>
                    <Input id="rule-add-sectors" name="rule-add-sectors" aria-label="Affected sectors" required value={addForm.affected_sectors} onChange={e => setAddForm(f => ({ ...f, affected_sectors: e.target.value }))} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Company Scope (Comma sep)</Label>
                    <Input id="rule-add-companies" name="rule-add-companies" aria-label="Affected companies" value={addForm.affected_companies} onChange={e => setAddForm(f => ({ ...f, affected_companies: e.target.value }))} className="mt-1 bg-card/50 border-border/50" />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">Summary Brief *</Label>
                  <Textarea id="rule-add-summary" name="rule-add-summary" aria-label="Rule summary" required value={addForm.summary} onChange={e => setAddForm(f => ({ ...f, summary: e.target.value }))} className="mt-1 bg-card/50 border-border/50 h-16" />
                </div>

                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">Full Text Content</Label>
                  <Textarea id="rule-add-fulltext" name="rule-add-fulltext" aria-label="Full text" value={addForm.full_text} onChange={e => setAddForm(f => ({ ...f, full_text: e.target.value }))} className="mt-1 bg-card/50 border-border/50 h-20" />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white w-full">
                    Publish Circular
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Connection Portals Banner */}
      <Card className="bg-card/30 border-border/50">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-sm font-semibold text-foreground">Scraper Sync Engine</span>
              <p className="text-[11px] text-muted-foreground">Scraping RBI Master Directions, CBIC Circulars, and MCA21 Notifications</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {GOVERNMENT_PORTALS.slice(0, 6).map(p => (
              <Badge key={p.code} variant="outline" className="text-[10px] py-0.5 bg-card/50">
                {p.icon} {p.code} <CheckCircle className="w-2.5 h-2.5 ml-1 text-green-400" />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border border-border/40 ${stat.bgColor}`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{stat.label}</span>
                <span className={stat.color}>{Icon}</span>
              </div>
              <p className="text-2xl font-bold text-foreground font-mono">{stat.count}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filter and Search controls */}
      <Card className="bg-card/30 border-border/50">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="regulatory-news-search"
              name="regulatory-news-search"
              aria-label="Search circular title or text"
              placeholder="Search circular title / text..."
              value={searchQuery}
              onChange={e => setSearchQuery(sanitizeInput(e.target.value, MAX_SEARCH_LENGTH))}
              className="pl-9 bg-card/40 border-border/50 text-xs"
            />
          </div>

          <Select value={filters.authority} onValueChange={v => setFilters(f => ({ ...f, authority: v }))} name="news-authority-filter" aria-label="Filter by authority">
            <SelectTrigger className="bg-card/40 border-border/50 text-xs">
              <SelectValue placeholder="Portal Source" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">🏛️ All Portals</SelectItem>
              {GOVERNMENT_PORTALS.map(p => <SelectItem key={p.code} value={p.code}>{p.icon} {p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.impactLevel} onValueChange={v => setFilters(f => ({ ...f, impactLevel: v }))} name="news-impact-filter" aria-label="Filter by impact level">
            <SelectTrigger className="bg-card/40 border-border/50 text-xs">
              <SelectValue placeholder="Impact Level" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">📊 All Impacts</SelectItem>
              {Object.entries(IMPACT_META).map(([v, m]) => <SelectItem key={v} value={v}>{m.emoji} {m.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.category} onValueChange={v => setFilters(f => ({ ...f, category: v }))} name="news-category-filter" aria-label="Filter by category">
            <SelectTrigger className="bg-card/40 border-border/50 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">📋 All Categories</SelectItem>
              {Object.entries(CATEGORY_META).map(([v, m]) => <SelectItem key={v} value={v}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Main rule matching feed */}
      <Card className="bg-card/40 border-border/50">
        <CardHeader className="pb-3 flex flex-row justify-between items-center border-b border-border/30">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Filing Rules & Regulatory Change-Log</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Click any regulatory update card to inspect details, version snapshots, change diffs, and affected clients.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAllNews(!showAllNews)} className="h-8 border-border/50 bg-card/20">
            {showAllNews ? 'Collapse All' : 'Expand All'}
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-cyan-400" /></div>
          ) : filteredNewsList.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/30 rounded-xl text-muted-foreground">
              <Gavel className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="font-semibold">No matching regulatory rules found</p>
              <p className="text-xs">Adjust search filters or publish a new circular above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNewsList.map((item) => {
                const daysUntil = getDaysUntilEffective(item.effective_date);
                const isExpanded = expandedId === item.id || showAllNews;
                const imp = IMPACT_META[item.impact_level] || IMPACT_META.low;
                const cat = CATEGORY_META[item.category] || CATEGORY_META.notification;
                const port = GOVERNMENT_PORTALS.find(p => p.code === item.authority_code);
                
                // Active sub tab inside card
                const activeTab = activeSubTab[item.id] || 'details';
                const setActiveTab = (tab: 'details' | 'history' | 'clients' | 'amend') => {
                  setActiveSubTab(prev => ({ ...prev, [item.id]: tab }));
                };

                return (
                  <motion.div
                    key={item.id}
                    layout
                    className={`rounded-xl border transition-all ${
                      isExpanded 
                        ? 'border-cyan-500 bg-card/40' 
                        : 'border-border/30 bg-card/25 hover:border-border/60'
                    }`}
                  >
                    {/* Header Row - Always visible */}
                    <div
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Side bar color code */}
                        <div className={`w-1.5 h-10 rounded-full shrink-0 ${
                          item.impact_level === 'critical' ? 'bg-red-500' :
                          item.impact_level === 'high' ? 'bg-orange-500' :
                          item.impact_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm leading-tight text-foreground">{item.title}</h4>
                            <Badge variant="outline" className="text-[10px] font-mono py-0 text-cyan-400 border-cyan-500/20">v{item.version}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                            <Badge variant="outline" className={`text-[10px] ${imp.color} ${imp.border}`}>{imp.emoji} {imp.label}</Badge>
                            <span className="flex items-center gap-1">
                              <span>{port?.icon}</span>
                              <span className="font-semibold text-foreground">{item.authority_code}</span>
                            </span>
                            <span>•</span>
                            <span className={daysUntil <= 30 && daysUntil > 0 ? 'text-red-400 font-bold' : ''}>
                              📅 {daysUntil <= 0 ? 'Effective Now' : `Effective in ${daysUntil} days`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(item.source_url || port?.url, '_blank', 'noopener,noreferrer')}
                          className="h-8 text-xs border-border/50 bg-card/30 hover:bg-card/50"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Verify Source
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                        </Button>
                      </div>
                    </div>

                    {/* Collapsible content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-border/20 px-6 pb-6 pt-4 space-y-4"
                        >
                          {/* Inner Tabs buttons */}
                          <div className="flex border-b border-border/20 gap-1 pb-1">
                            {[
                              { id: 'details', label: 'Summary & Actions', icon: FileText },
                              { id: 'history', label: `Change Log (v${item.version})`, icon: History },
                              { id: 'clients', label: 'Affected Client Matches', icon: Building2 },
                              { id: 'amend', label: 'Amend Circular Rule', icon: Scale }
                            ].map(tab => {
                              const Icon = tab.icon;
                              const isActive = activeTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id as any)}
                                  className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    isActive 
                                      ? 'bg-cyan-500/10 text-cyan-400 border-t border-x border-cyan-500/30' 
                                      : 'text-muted-foreground hover:text-foreground hover:bg-card/20'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Inner Tabs Contents */}
                          <div className="pt-2">
                            {activeTab === 'details' && (
                              <DetailsTab item={item} isRealDashboard={isRealDashboard} />
                            )}
                            {activeTab === 'history' && (
                              <HistoryTab newsId={item.id} currentItem={item} />
                            )}
                            {activeTab === 'clients' && (
                              <ClientsTab newsId={item.id} />
                            )}
                            {activeTab === 'amend' && (
                              <AmendTab item={item} onUpdateSuccess={() => {
                                setExpandedId(null);
                                refetch();
                              }} />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
