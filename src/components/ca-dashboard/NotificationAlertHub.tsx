/**
 * NotificationAlertHub — Gap 10 UI Dashboard
 *
 * Multi-channel Notification & Alert Engine for CA firms.
 * Real Supabase data only. No mock data.
 *
 * Tabs:
 *  1. Overview      — KPI stats, delivery analytics, recent dispatches
 *  2. Channels      — Configure SMS / Email / WhatsApp providers
 *  3. Templates     — Handlebars-style message templates with preview
 *  4. Alert Rules   — Automated trigger rules for compliance events
 *  5. Recipients    — Manage contact list & consent preferences
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCAIdentity } from '@/hooks/useCAIdentity';
import {
  useNotificationChannels,
  useNotificationTemplates,
  useAlertRules,
  useNotificationRecipients,
  useNotificationDispatches,
  useNotificationDashboard,
  CHANNEL_META,
  TRIGGER_EVENT_LABELS,
  TEMPLATE_CATEGORY_LABELS,
  renderTemplate,
  type ChannelType,
  type TemplateCategory,
  type TriggerEvent,
} from '@/hooks/useNotification';
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Zap,
  Settings,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Users,
  FileText,
  AlertTriangle,
  BellRing,
  ToggleLeft,
  ToggleRight,
  X,
  Search,
  Filter,
  Activity,
  Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifTab = 'overview' | 'channels' | 'templates' | 'rules' | 'recipients';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ChannelBadge({ type }: { type: string }) {
  const meta: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    email:    { bg: 'bg-blue-500/15',    text: 'text-blue-400',    icon: Mail },
    sms:      { bg: 'bg-green-500/15',   text: 'text-green-400',   icon: Phone },
    whatsapp: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: MessageSquare },
    push:     { bg: 'bg-purple-500/15',  text: 'text-purple-400',  icon: Bell },
    in_app:   { bg: 'bg-orange-500/15',  text: 'text-orange-400',  icon: BellRing },
  };
  const cfg = meta[type] ?? meta.in_app;
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.bg} ${cfg.text} border-none gap-1 text-[10px]`}>
      <Icon className="w-3 h-3" /> {type.toUpperCase()}
    </Badge>
  );
}

function DispatchStatusBadge({ status }: { status: string }) {
  const c: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    queued:       { bg: 'bg-zinc-500/15',    text: 'text-zinc-400',    icon: Clock },
    sending:      { bg: 'bg-blue-500/15',    text: 'text-blue-400',    icon: RefreshCw },
    delivered:    { bg: 'bg-green-500/15',   text: 'text-green-400',   icon: CheckCircle },
    failed:       { bg: 'bg-red-500/15',     text: 'text-red-400',     icon: XCircle },
    bounced:      { bg: 'bg-yellow-500/15',  text: 'text-yellow-400',  icon: AlertTriangle },
    unsubscribed: { bg: 'bg-zinc-500/15',    text: 'text-zinc-400',    icon: X },
  };
  const cfg = c[status] ?? c.queued;
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.bg} ${cfg.text} border-none gap-1 text-[10px]`}>
      <Icon className={`w-3 h-3 ${status === 'sending' ? 'animate-spin' : ''}`} />
      {status}
    </Badge>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const NotificationAlertHub: React.FC = () => {
  const { caId } = useCAIdentity();
  const [activeTab, setActiveTab] = useState<NotifTab>('overview');

  // ─── Hooks ─────────────────────────────────────────────────────────────────
  const { dashboard, stats, loading: dashLoading, refetch: refetchDash } = useNotificationDashboard(caId);
  const { channels, loading: chLoading, addChannel, removeChannel, editChannel, pingChannel } = useNotificationChannels(caId);
  const { templates, loading: tplLoading, addTemplate, editTemplate, removeTemplate } = useNotificationTemplates(caId);
  const { rules, loading: rulesLoading, addRule, toggleRule, removeRule } = useAlertRules(caId);
  const { recipients, loading: recLoading, addRecipient, removeRecipient } = useNotificationRecipients(caId);
  const { dispatches, loading: dispLoading, refetch: refetchDisp, sendNotification } = useNotificationDispatches(caId);

  // ─── Channel Form State ─────────────────────────────────────────────────────
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChType, setNewChType] = useState<ChannelType>('email');
  const [newChName, setNewChName] = useState('');
  const [newChConfig, setNewChConfig] = useState('{}');

  // ─── Template Form State ────────────────────────────────────────────────────
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplChannel, setTplChannel] = useState<ChannelType>('email');
  const [tplCategory, setTplCategory] = useState<TemplateCategory>('deadline_reminder');
  const [tplSubject, setTplSubject] = useState('');
  const [tplBody, setTplBody] = useState('');
  const [tplPreviewVars, setTplPreviewVars] = useState<Record<string, string>>({
    client_name: 'ABC Pvt Ltd', due_date: '31 May 2026', form_name: 'GSTR-3B', amount: '₹45,000',
  });
  const [expandedTplId, setExpandedTplId] = useState<string | null>(null);

  // ─── Alert Rule Form State ──────────────────────────────────────────────────
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState<TriggerEvent>('deadline_approaching');
  const [ruleAdvanceDays, setRuleAdvanceDays] = useState('7');
  const [ruleTemplateId, setRuleTemplateId] = useState('');
  const [ruleRepeat, setRuleRepeat] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');

  // ─── Recipient Form State ───────────────────────────────────────────────────
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [recName, setRecName] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recWhatsapp, setRecWhatsapp] = useState('');
  const [recCompany, setRecCompany] = useState('');

  // ─── Quick Send State ───────────────────────────────────────────────────────
  const [showQuickSend, setShowQuickSend] = useState(false);
  const [qsChannelType, setQsChannelType] = useState<ChannelType>('email');
  const [qsRecipientEmail, setQsRecipientEmail] = useState('');
  const [qsRecipientPhone, setQsRecipientPhone] = useState('');
  const [qsSubject, setQsSubject] = useState('');
  const [qsBody, setQsBody] = useState('');
  const [qsSending, setQsSending] = useState(false);

  const [searchRecipient, setSearchRecipient] = useState('');

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAddChannel = useCallback(async () => {
    if (!newChName.trim()) return;
    try {
      JSON.parse(newChConfig); // Validate JSON
    } catch {
      return;
    }
    try {
      await addChannel({ channel_type: newChType, channel_name: newChName.trim(), config: JSON.parse(newChConfig) });
      setShowAddChannel(false);
      setNewChName('');
      setNewChConfig('{}');
    } catch { /* toast shown in hook */ }
  }, [newChType, newChName, newChConfig, addChannel]);

  const handleAddTemplate = useCallback(async () => {
    if (!tplName.trim() || !tplBody.trim()) return;
    const variables = [...tplBody.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    try {
      await addTemplate({
        template_name: tplName.trim(),
        channel_type: tplChannel,
        category: tplCategory,
        subject: tplSubject.trim() || undefined,
        body: tplBody.trim(),
        variables,
      });
      setShowAddTemplate(false);
      setTplName('');
      setTplBody('');
      setTplSubject('');
    } catch { /* toast shown in hook */ }
  }, [tplName, tplChannel, tplCategory, tplSubject, tplBody, addTemplate]);

  const handleAddRule = useCallback(async () => {
    if (!ruleName.trim()) return;
    try {
      await addRule({
        rule_name: ruleName.trim(),
        trigger_event: ruleTrigger,
        advance_days: parseInt(ruleAdvanceDays) || 7,
        template_id: ruleTemplateId || undefined,
        repeat_interval: ruleRepeat,
        is_enabled: true,
        scope: 'all_clients',
      });
      setShowAddRule(false);
      setRuleName('');
      setRuleTemplateId('');
    } catch { /* toast shown in hook */ }
  }, [ruleName, ruleTrigger, ruleAdvanceDays, ruleTemplateId, ruleRepeat, addRule]);

  const handleAddRecipient = useCallback(async () => {
    if (!recName.trim()) return;
    try {
      await addRecipient({
        full_name: recName.trim(),
        email: recEmail.trim() || undefined,
        phone: recPhone.trim() || undefined,
        whatsapp_number: recWhatsapp.trim() || undefined,
        company_name: recCompany.trim() || undefined,
      });
      setShowAddRecipient(false);
      setRecName('');
      setRecEmail('');
      setRecPhone('');
      setRecWhatsapp('');
      setRecCompany('');
    } catch { /* toast shown in hook */ }
  }, [recName, recEmail, recPhone, recWhatsapp, recCompany, addRecipient]);

  const handleQuickSend = useCallback(async () => {
    if (!qsBody.trim()) return;
    setQsSending(true);
    try {
      await sendNotification(qsChannelType, qsBody.trim(), {
        recipientEmail: qsRecipientEmail.trim() || undefined,
        recipientPhone: qsRecipientPhone.trim() || undefined,
        subject: qsSubject.trim() || undefined,
      });
      setShowQuickSend(false);
      setQsBody('');
      setQsSubject('');
      setQsRecipientEmail('');
    } catch { /* toast shown in hook */ }
    finally { setQsSending(false); }
  }, [qsChannelType, qsBody, qsRecipientEmail, qsRecipientPhone, qsSubject, sendNotification]);

  const filteredRecipients = recipients.filter((r) => {
    if (!searchRecipient) return true;
    const q = searchRecipient.toLowerCase();
    return r.full_name.toLowerCase().includes(q) || (r.email ?? '').toLowerCase().includes(q);
  });

  const tabs: { id: NotifTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'overview',   label: 'Overview',    icon: BarChart3,     count: dashboard?.dispatchesLast7Days },
    { id: 'channels',   label: 'Channels',    icon: Settings,      count: channels.length },
    { id: 'templates',  label: 'Templates',   icon: FileText,      count: templates.length },
    { id: 'rules',      label: 'Alert Rules', icon: Zap,           count: rules.filter((r) => r.is_enabled).length },
    { id: 'recipients', label: 'Recipients',  icon: Users,         count: recipients.length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-8 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-900/15 via-amber-900/10 to-transparent">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
              <BellRing className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-orange-400">Notification & Alert Engine</h2>
              <p className="text-sm text-muted-foreground">
                Multi-channel SMS, Email & WhatsApp dispatch with intelligent compliance triggers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            {[
              { label: 'Active Channels', value: dashboard?.enabledChannels ?? channels.filter(c => c.is_enabled).length, color: 'text-orange-400',  icon: Settings },
              { label: 'Templates',       value: dashboard?.totalTemplates ?? templates.length,                            color: 'text-amber-400',   icon: FileText },
              { label: 'Alert Rules',     value: dashboard?.activeRules ?? rules.filter(r => r.is_enabled).length,        color: 'text-yellow-400',  icon: Zap },
              { label: 'Recipients',      value: dashboard?.totalRecipients ?? recipients.length,                          color: 'text-orange-300',  icon: Users },
              {
                label: '7-Day Delivery',
                value: dashboard ? `${dashboard.deliveryRate}%` : '—',
                sub: `${dashboard?.dispatchesLast7Days ?? 0} sent`,
                color: 'text-green-400',
                icon: CheckCircle,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-4 rounded-xl bg-background/40 border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  {'sub' in s && s.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Nav ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_12px_-3px_rgba(249,115,22,0.2)]'
                    : 'border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/50'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge className={`text-[10px] h-5 ${isActive ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-card/50 text-muted-foreground border-border/30'}`}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Send Button */}
        <Button
          onClick={() => setShowQuickSend(true)}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white gap-2 shrink-0"
        >
          <Send className="w-4 h-4" /> Quick Send
        </Button>
      </div>

      {/* Quick Send Modal */}
      <AnimatePresence>
        {showQuickSend && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-orange-400 flex items-center gap-2"><Send className="w-4 h-4" /> Quick Send Notification</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowQuickSend(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-1">Channel</label>
                <select value={qsChannelType} onChange={(e) => setQsChannelType(e.target.value as ChannelType)}
                  className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground">
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="in_app">In-App</option>
                </select>
              </div>
              {(qsChannelType === 'email') && (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase block mb-1">Recipient Email</label>
                    <Input value={qsRecipientEmail} onChange={(e) => setQsRecipientEmail(e.target.value)} placeholder="client@company.com" className="bg-background/60 text-xs h-9" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase block mb-1">Subject</label>
                    <Input value={qsSubject} onChange={(e) => setQsSubject(e.target.value)} placeholder="Reminder: GST filing due" className="bg-background/60 text-xs h-9" />
                  </div>
                </>
              )}
              {(qsChannelType === 'sms' || qsChannelType === 'whatsapp') && (
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-1">Phone Number</label>
                  <Input value={qsRecipientPhone} onChange={(e) => setQsRecipientPhone(e.target.value)} placeholder="+919876543210" className="bg-background/60 text-xs h-9" />
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">Message Body</label>
              <textarea
                value={qsBody}
                onChange={(e) => setQsBody(e.target.value)}
                placeholder="Dear {{client_name}}, your {{form_name}} is due on {{due_date}}..."
                rows={3}
                className="w-full p-3 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleQuickSend} disabled={qsSending || !qsBody.trim()}
                className="bg-orange-600 hover:bg-orange-500 text-white gap-2">
                {qsSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Dispatch Now
              </Button>
              <Button variant="ghost" onClick={() => setShowQuickSend(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════ TAB 1: OVERVIEW ═════ */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Channel Delivery Breakdown */}
          {dashboard && dashboard.channelBreakdown.length > 0 && (
            <Card className="border-border/30 bg-card/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Activity className="w-4 h-4 text-orange-400" /> Channel Delivery (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.channelBreakdown.map((cb) => {
                    const rate = cb.count > 0 ? Math.round((cb.delivered / cb.count) * 100) : 0;
                    return (
                      <div key={cb.channel_type} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <ChannelBadge type={cb.channel_type} />
                          <span className="text-muted-foreground">{cb.delivered}/{cb.count} delivered ({rate}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-border/20 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${rate}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Dispatches */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent Dispatches</h3>
            <Button size="sm" variant="outline" onClick={refetchDisp} className="gap-1 text-xs h-8">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>

          {dispLoading ? (
            <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 text-orange-400 animate-spin" /></div>
          ) : dispatches.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications dispatched yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Use Quick Send or configure Alert Rules to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dispatches.slice(0, 20).map((d) => (
                <motion.div key={d.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/20 bg-card/15 hover:border-orange-500/15 transition-colors flex-wrap">
                  <div className="flex items-center gap-3">
                    <ChannelBadge type={d.channel_type} />
                    <div>
                      <p className="text-xs font-medium text-foreground truncate max-w-xs">
                        {d.subject ?? d.body_rendered.slice(0, 60) + (d.body_rendered.length > 60 ? '…' : '')}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {d.recipient_email ?? d.recipient_phone ?? 'Unknown recipient'} · {new Date(d.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <DispatchStatusBadge status={d.status} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═════ TAB 2: CHANNELS ═════ */}
      {activeTab === 'channels' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Delivery Channels</h3>
            <Button size="sm" onClick={() => setShowAddChannel(true)}
              className="bg-gradient-to-r from-orange-600 to-amber-600 text-white gap-1 h-8 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Channel
            </Button>
          </div>

          <AnimatePresence>
            {showAddChannel && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card className="border-orange-500/20 bg-card/30">
                  <CardHeader className="pb-2 p-4"><CardTitle className="text-sm text-orange-400">Configure New Channel</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Channel Type</label>
                        <select value={newChType} onChange={(e) => setNewChType(e.target.value as ChannelType)}
                          className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground">
                          <option value="email">Email (SMTP)</option>
                          <option value="sms">SMS (Twilio / MSG91 / Kaleyra)</option>
                          <option value="whatsapp">WhatsApp (Meta / WATI)</option>
                          <option value="push">Push Notification</option>
                          <option value="in_app">In-App Notification</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Channel Name</label>
                        <Input value={newChName} onChange={(e) => setNewChName(e.target.value)} placeholder="e.g. Primary Email, Twilio SMS" className="bg-background/60 text-xs h-9" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase block mb-1">
                        Config JSON (provider keys, sender ID, etc.)
                      </label>
                      <textarea
                        value={newChConfig}
                        onChange={(e) => setNewChConfig(e.target.value)}
                        rows={4}
                        placeholder={newChType === 'email'
                          ? '{"from_email":"ca@firm.com","smtp_host":"smtp.gmail.com","smtp_port":587}'
                          : newChType === 'sms'
                          ? '{"provider":"msg91","api_key_encrypted":"...","sender_id":"REGULON"}'
                          : '{"provider":"meta","phone_number_id":"...","access_token_encrypted":"..."}'}
                        className="w-full p-3 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground font-mono resize-none focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddChannel} className="bg-orange-600 hover:bg-orange-500 text-white">Save Channel</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddChannel(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {chLoading ? (
            <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 text-orange-400 animate-spin" /></div>
          ) : channels.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Settings className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No channels configured yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((ch) => (
                <motion.div key={ch.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-xl border border-border/30 bg-card/20 hover:border-orange-500/20 transition-all space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ChannelBadge type={ch.channel_type} />
                        <span className={`text-[10px] ${ch.is_enabled ? 'text-green-400' : 'text-zinc-500'}`}>
                          {ch.is_enabled ? '● Active' : '○ Disabled'}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{ch.channel_name}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="xs" variant="ghost" onClick={() => pingChannel(ch.id)}
                        className="text-orange-400 hover:bg-orange-500/10 text-[10px] px-2 h-7">
                        Test Ping
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => editChannel(ch.id, { is_enabled: !ch.is_enabled })}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                        {ch.is_enabled ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => removeChannel(ch.id)}
                        className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="p-2 rounded-lg bg-background/40 border border-border/20 text-center">
                      <p className="text-muted-foreground">Sent</p>
                      <p className="font-bold text-foreground">{ch.total_sent.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background/40 border border-border/20 text-center">
                      <p className="text-muted-foreground">Hourly Limit</p>
                      <p className="font-bold text-foreground">{ch.rate_limit_per_hour}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background/40 border border-border/20 text-center">
                      <p className="text-muted-foreground">Test Status</p>
                      <p className={`font-bold ${ch.test_status === 'pass' ? 'text-green-400' : ch.test_status === 'fail' ? 'text-red-400' : 'text-zinc-400'}`}>
                        {ch.test_status ?? '—'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═════ TAB 3: TEMPLATES ═════ */}
      {activeTab === 'templates' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Message Templates</h3>
            <Button size="sm" onClick={() => setShowAddTemplate(true)}
              className="bg-gradient-to-r from-orange-600 to-amber-600 text-white gap-1 h-8 text-xs">
              <Plus className="w-3.5 h-3.5" /> New Template
            </Button>
          </div>

          <AnimatePresence>
            {showAddTemplate && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card className="border-orange-500/20 bg-card/30">
                  <CardHeader className="pb-2 p-4"><CardTitle className="text-sm text-orange-400">Create Template</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Template Name</label>
                        <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="GST Due Reminder" className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Channel</label>
                        <select value={tplChannel} onChange={(e) => setTplChannel(e.target.value as ChannelType)}
                          className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground">
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="in_app">In-App</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Category</label>
                        <select value={tplCategory} onChange={(e) => setTplCategory(e.target.value as TemplateCategory)}
                          className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground">
                          {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {tplChannel === 'email' && (
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Email Subject</label>
                        <Input value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} placeholder="Action Required: {{form_name}} due {{due_date}}" className="bg-background/60 text-xs h-9" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Message Body (use {'{{variable}}'} for placeholders)</label>
                        <textarea
                          value={tplBody}
                          onChange={(e) => setTplBody(e.target.value)}
                          rows={5}
                          placeholder="Dear {{client_name}},&#10;Your {{form_name}} filing is due on {{due_date}}.&#10;Amount: {{amount}}&#10;Please ensure timely submission.&#10;— {{ca_name}}"
                          className="w-full p-3 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground font-mono resize-none focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Live Preview</label>
                        <div className="p-3 rounded-lg border border-orange-500/20 bg-orange-500/5 min-h-[120px] text-xs text-foreground whitespace-pre-wrap font-mono">
                          {tplBody ? renderTemplate(tplBody, tplPreviewVars) : <span className="text-muted-foreground/50 italic">Start typing to preview…</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddTemplate} className="bg-orange-600 hover:bg-orange-500 text-white">Save Template</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddTemplate(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {tplLoading ? (
            <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 text-orange-400 animate-spin" /></div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No templates created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => {
                const isExpanded = expandedTplId === t.id;
                return (
                  <div key={t.id} className="rounded-xl border border-border/30 bg-card/20 overflow-hidden hover:border-orange-500/20 transition-colors">
                    <button onClick={() => setExpandedTplId(isExpanded ? null : t.id)}
                      className="w-full p-4 flex items-center justify-between gap-4 hover:bg-card/30 transition-colors">
                      <div className="flex items-center gap-3 flex-wrap min-w-0">
                        <ChannelBadge type={t.channel_type} />
                        <Badge className="bg-amber-500/10 text-amber-300 border-none text-[10px]">
                          {TEMPLATE_CATEGORY_LABELS[t.category]}
                        </Badge>
                        <span className="font-semibold text-sm text-foreground truncate">{t.template_name}</span>
                        <span className="text-[10px] text-muted-foreground">{t.use_count} uses</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); removeTemplate(t.id); }}
                          className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border/20">
                          <div className="p-4 space-y-3">
                            {t.subject && <p className="text-xs text-muted-foreground"><strong>Subject:</strong> {t.subject}</p>}
                            <p className="text-xs text-foreground font-mono whitespace-pre-wrap bg-background/40 p-3 rounded-lg border border-border/20">{t.body}</p>
                            {t.variables.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] text-muted-foreground">Variables:</span>
                                {t.variables.map((v) => (
                                  <Badge key={v} className="bg-orange-500/10 text-orange-300 border-none text-[9px] font-mono">{'{{' + v + '}}'}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ═════ TAB 4: ALERT RULES ═════ */}
      {activeTab === 'rules' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Automated Alert Rules</h3>
            <Button size="sm" onClick={() => setShowAddRule(true)}
              className="bg-gradient-to-r from-orange-600 to-amber-600 text-white gap-1 h-8 text-xs">
              <Plus className="w-3.5 h-3.5" /> New Rule
            </Button>
          </div>

          <AnimatePresence>
            {showAddRule && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card className="border-orange-500/20 bg-card/30">
                  <CardHeader className="pb-2 p-4"><CardTitle className="text-sm text-orange-400">Configure Alert Rule</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Rule Name</label>
                        <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="GST 7-Day Advance Alert" className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Trigger Event</label>
                        <select value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value as TriggerEvent)}
                          className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground">
                          {Object.entries(TRIGGER_EVENT_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Advance Days</label>
                        <Input type="number" value={ruleAdvanceDays} onChange={(e) => setRuleAdvanceDays(e.target.value)} min="1" max="90" className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Repeat</label>
                        <select value={ruleRepeat} onChange={(e) => setRuleRepeat(e.target.value as any)}
                          className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground">
                          <option value="once">Once</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Template (optional)</label>
                        <select value={ruleTemplateId} onChange={(e) => setRuleTemplateId(e.target.value)}
                          className="w-full p-2 h-9 rounded-lg border border-border/30 bg-background/60 text-xs text-foreground">
                          <option value="">— No Template (custom message) —</option>
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>{t.template_name} [{t.channel_type}]</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddRule} className="bg-orange-600 hover:bg-orange-500 text-white">Create Rule</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddRule(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {rulesLoading ? (
            <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 text-orange-400 animate-spin" /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No alert rules configured yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <motion.div key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-5 rounded-xl border border-border/30 bg-card/20 hover:border-orange-500/15 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{rule.rule_name}</span>
                        <Badge className={`text-[10px] border-none ${rule.is_enabled ? 'bg-green-500/15 text-green-400' : 'bg-zinc-500/15 text-zinc-400'}`}>
                          {rule.is_enabled ? '● Active' : '○ Paused'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> {TRIGGER_EVENT_LABELS[rule.trigger_event]}</span>
                        <span>·</span>
                        <span>{rule.advance_days}d advance</span>
                        <span>·</span>
                        <span>{rule.repeat_interval}</span>
                        {rule.trigger_count > 0 && <><span>·</span><span>{rule.trigger_count} triggers</span></>}
                        {rule.template && <><span>·</span><Badge className="bg-amber-500/10 text-amber-300 border-none text-[9px]">{rule.template.template_name}</Badge></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="xs" variant="ghost" onClick={() => toggleRule(rule.id, !rule.is_enabled)}
                        className={`h-8 px-3 text-xs ${rule.is_enabled ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>
                        {rule.is_enabled ? 'Pause' : 'Activate'}
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => removeRule(rule.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ═════ TAB 5: RECIPIENTS ═════ */}
      {activeTab === 'recipients' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={searchRecipient} onChange={(e) => setSearchRecipient(e.target.value)} placeholder="Search recipients…" className="pl-9 bg-background/50 text-xs h-9" />
              </div>
            </div>
            <Button size="sm" onClick={() => setShowAddRecipient(true)}
              className="bg-gradient-to-r from-orange-600 to-amber-600 text-white gap-1 h-9 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Recipient
            </Button>
          </div>

          <AnimatePresence>
            {showAddRecipient && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Card className="border-orange-500/20 bg-card/30">
                  <CardHeader className="pb-2 p-4"><CardTitle className="text-sm text-orange-400">Add Recipient</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Full Name *</label>
                        <Input value={recName} onChange={(e) => setRecName(e.target.value)} placeholder="ABC Pvt Ltd / Ramesh Sharma" className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Email</label>
                        <Input value={recEmail} onChange={(e) => setRecEmail(e.target.value)} placeholder="client@company.com" className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Mobile / SMS</label>
                        <Input value={recPhone} onChange={(e) => setRecPhone(e.target.value)} placeholder="+919876543210" className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">WhatsApp Number</label>
                        <Input value={recWhatsapp} onChange={(e) => setRecWhatsapp(e.target.value)} placeholder="+919876543210" className="bg-background/60 text-xs h-9" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase block mb-1">Company</label>
                        <Input value={recCompany} onChange={(e) => setRecCompany(e.target.value)} placeholder="Company Name" className="bg-background/60 text-xs h-9" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddRecipient} className="bg-orange-600 hover:bg-orange-500 text-white">Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddRecipient(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {recLoading ? (
            <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 text-orange-400 animate-spin" /></div>
          ) : filteredRecipients.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-border/40 bg-card/10">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{searchRecipient ? 'No recipients match your search' : 'No recipients added yet'}</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-border/30 rounded-xl bg-background/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-card/45 border-b border-border/20 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Channels</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipients.map((r) => (
                    <tr key={r.id} className="border-b border-border/10 hover:bg-card/15 transition-colors">
                      <td className="p-3">
                        <p className="font-medium text-foreground">{r.full_name}</p>
                        {r.company_name && <p className="text-[10px] text-muted-foreground">{r.company_name}</p>}
                      </td>
                      <td className="p-3 text-muted-foreground">{r.email ?? '—'}</td>
                      <td className="p-3 text-muted-foreground">{r.phone ?? r.whatsapp_number ?? '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {r.is_opted_in_email && <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px]">Email</Badge>}
                          {r.is_opted_in_sms && <Badge className="bg-green-500/10 text-green-400 border-none text-[8px]">SMS</Badge>}
                          {r.is_opted_in_whatsapp && <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px]">WA</Badge>}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Button size="xs" variant="ghost" onClick={() => removeRecipient(r.id)}
                          className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default NotificationAlertHub;
