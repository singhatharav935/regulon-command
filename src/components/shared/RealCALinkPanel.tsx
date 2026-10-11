/**
 * REAL CA COMPANY LINK PANEL
 * ===========================
 * Production-grade UI for Company ↔ CA connection.
 * Used in BOTH the real Company Dashboard Settings
 * and the real CA Dashboard Profile Settings.
 *
 * - Real OTP sent to the other user's registered email via Resend
 * - Connection stored in Supabase (ca_company_connections table)
 * - Real financial data sync via Supabase Edge Function
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Copy, Check, ShieldCheck, Building2,
  ArrowRight, Loader2, BadgeCheck, AlertCircle,
  Unlink, CircleCheck, Send, Database,
  FileText, TrendingUp, Mail, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useCACompanyLink } from '@/hooks/useCACompanyLink';

interface RealCALinkPanelProps {
  role: 'ca' | 'company';
  /** Optional company financial snapshot to send (company side only) */
  financialPayload?: {
    companyName: string;
    gstin: string;
    pan: string;
    financialYear: string;
    revenue: string;
    profitAfterTax: string;
    totalAssets: string;
    complianceScore: number;
    pendingTasks: number;
    documents: { name: string; type: string; status: string }[];
  };
}

export default function RealCALinkPanel({ role, financialPayload }: RealCALinkPanelProps) {
  const [copied, setCopied] = useState(false);

  const {
    myCode, codeLoading,
    connection, connectionLoading,
    step, setStep,
    targetCodeInput, setTargetCodeInput,
    otpInput, setOtpInput,
    targetEmailMasked,
    syncPayload, isSyncing, lastSyncTime,
    sendOtp, verifyOtp, disconnect, sendDataToCA,
  } = useCACompanyLink(role);

  const handleCopy = () => {
    if (!myCode) return;
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    toast.success('Link code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendData = () => {
    if (!financialPayload) {
      toast.error('No financial data to sync');
      return;
    }
    sendDataToCA({
      ...financialPayload,
      notifications: [
        'Financial data synced from SANNIDH Company Dashboard',
        `Compliance score: ${financialPayload.complianceScore}%`,
        'All statutory filings are up to date',
      ],
    });
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const roleLabel = role === 'ca' ? 'CA' : 'Company';
  const otherRoleLabel = role === 'ca' ? 'Company' : 'CA';
  const codeColor = role === 'ca' ? 'cyan' : 'indigo';
  const codeColorClasses = role === 'ca'
    ? 'border-cyan-500/30 text-cyan-400 bg-background/60'
    : 'border-indigo-500/30 text-indigo-400 bg-background/60';
  const btnColorClasses = role === 'ca'
    ? 'bg-cyan-600 hover:bg-cyan-500'
    : 'bg-indigo-600 hover:bg-indigo-500';

  if (codeLoading || connectionLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="text-sm text-muted-foreground">Loading connection data...</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role === 'ca' ? 'bg-cyan-500/15' : 'bg-indigo-500/15'}`}>
          <Link2 className={`w-5 h-5 ${role === 'ca' ? 'text-cyan-400' : 'text-indigo-400'}`} />
        </div>
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2">
            Connect {roleLabel} ↔ {otherRoleLabel}
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
              Live · Real OTP
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Link your {roleLabel} dashboard to a {otherRoleLabel}. OTP sent to their registered email.
          </p>
        </div>
      </div>

      {/* Your Link Code */}
      <Card className={`bg-card/40 ${role === 'ca' ? 'border-cyan-500/20' : 'border-indigo-500/20'}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${role === 'ca' ? 'text-cyan-300' : 'text-indigo-300'}`}>
            <BadgeCheck className="w-4 h-4" /> Your {roleLabel} Link Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Share this with your {otherRoleLabel.toLowerCase()}. They enter it in their dashboard Settings to initiate a connection request to you.
          </p>
          <div className="flex items-center gap-3">
            {myCode ? (
              <>
                <div className={`flex-1 border rounded-xl px-5 py-4 font-mono text-2xl font-black tracking-[0.35em] text-center select-all ${codeColorClasses}`}>
                  {myCode}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className={`h-12 px-4 ${role === 'ca' ? 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10' : 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center py-4 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating code...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection State */}
      {connection ? (
        // ── Linked state ─────────────────────────────────────────────────────
        <Card className="bg-emerald-500/5 border-emerald-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-4 h-4" /> Connected {otherRoleLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{connection.other_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> {connection.other_email}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">Code: {connection.other_link_code}</p>
                  <p className="text-[10px] text-muted-foreground">Linked: {fmtDate(connection.linked_at)}</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">✓ Active</Badge>
            </div>

            {/* CA: Show synced data */}
            {role === 'ca' && syncPayload && (
              <div className="space-y-3 pt-2 border-t border-white/8">
                <p className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Last Synced Data — {fmtDate(syncPayload.sentAt || lastSyncTime || '')}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Revenue', value: syncPayload.revenue, icon: TrendingUp, color: 'text-green-400' },
                    { label: 'PAT', value: syncPayload.profitAfterTax, icon: TrendingUp, color: 'text-emerald-400' },
                    { label: 'Total Assets', value: syncPayload.totalAssets, icon: Database, color: 'text-blue-400' },
                    { label: 'Compliance', value: `${syncPayload.complianceScore}%`, icon: ShieldCheck, color: 'text-cyan-400' },
                  ].map(m => (
                    <div key={m.label} className="bg-background/40 rounded-xl p-3 border border-white/8">
                      <m.icon className={`w-3.5 h-3.5 mb-1 ${m.color}`} />
                      <p className="text-[10px] text-muted-foreground">{m.label}</p>
                      <p className="text-sm font-bold text-foreground">{m.value}</p>
                    </div>
                  ))}
                </div>
                {syncPayload.documents?.length > 0 && (
                  <div className="p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
                    <p className="text-xs text-indigo-300 font-medium mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Documents ({syncPayload.documents.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {syncPayload.documents.map((doc, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300">
                          {doc.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Company: Send data button */}
            {role === 'company' && financialPayload && (
              <div className="pt-2 border-t border-white/8">
                <p className="text-xs text-muted-foreground mb-3">
                  Click below to send your complete financial data to <strong className="text-foreground">{connection.other_name}</strong>'s Client Vault.
                </p>
                <Button
                  onClick={handleSendData}
                  disabled={isSyncing}
                  className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white border-0 shadow-lg"
                >
                  {isSyncing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing Data...</>
                  ) : lastSyncTime ? (
                    <><RefreshCw className="w-4 h-4 mr-2" /> Resync All Data to CA</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send All Data to CA</>
                  )}
                </Button>
                {lastSyncTime && (
                  <p className="text-xs text-emerald-400 text-center mt-2 flex items-center justify-center gap-1">
                    <CircleCheck className="w-3.5 h-3.5" /> Last synced: {fmtDate(lastSyncTime)}
                  </p>
                )}
              </div>
            )}

            <Button variant="destructive" size="sm" className="w-full mt-2" onClick={disconnect}>
              <Unlink className="w-4 h-4 mr-2" /> Disconnect
            </Button>
          </CardContent>
        </Card>
      ) : (
        // ── Link flow ─────────────────────────────────────────────────────────
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Link2 className={`w-4 h-4 ${role === 'ca' ? 'text-cyan-400' : 'text-indigo-400'}`} />
              Link a {otherRoleLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Enter the <strong className="text-foreground">{otherRoleLabel} Link Code</strong> shared by your {otherRoleLabel.toLowerCase()}.
              A 6-digit OTP will be emailed to their registered account for security verification.
            </p>

            <AnimatePresence mode="wait">
              {(step === 'idle' || step === 'sending_otp') && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{otherRoleLabel} Link Code</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={role === 'ca' ? 'e.g. COAB12XY' : 'e.g. CAAB12XY'}
                        value={targetCodeInput}
                        onChange={e => setTargetCodeInput(e.target.value.toUpperCase())}
                        className="font-mono tracking-wider text-center text-base font-bold uppercase"
                        maxLength={10}
                        disabled={step === 'sending_otp'}
                      />
                      <Button
                        onClick={sendOtp}
                        disabled={step === 'sending_otp' || !targetCodeInput.trim()}
                        className={`${btnColorClasses} whitespace-nowrap`}
                      >
                        {step === 'sending_otp' ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Sending...</>
                        ) : (
                          <>Send OTP <ArrowRight className="w-4 h-4 ml-1" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
                    <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      A real OTP will be sent to your {otherRoleLabel.toLowerCase()}'s registered email. Ask them to share it with you.
                    </span>
                  </div>
                </motion.div>
              )}

              {step === 'otp_sent' && (
                <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className={`p-4 rounded-xl ${role === 'ca' ? 'bg-cyan-500/10 border-cyan-500/25' : 'bg-indigo-500/10 border-indigo-500/25'} border`}>
                    <p className={`text-xs font-medium mb-1 ${role === 'ca' ? 'text-cyan-300' : 'text-indigo-300'}`}>
                      📧 OTP sent to {targetEmailMasked || `your ${otherRoleLabel.toLowerCase()}'s email`}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Ask your {otherRoleLabel.toLowerCase()} to check their email inbox and share the 6-digit OTP with you.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Enter OTP (shared by {otherRoleLabel})</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter 6-digit OTP"
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="font-mono tracking-[0.5em] text-center text-xl font-bold"
                        maxLength={6}
                      />
                      <Button onClick={verifyOtp} disabled={otpInput.length < 6} className="bg-emerald-600 hover:bg-emerald-500 whitespace-nowrap">
                        Verify
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep('idle')} className="text-muted-foreground text-xs">
                    ← Back
                  </Button>
                </motion.div>
              )}

              {step === 'verifying' && (
                <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8 gap-4">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-sm text-muted-foreground">Establishing secure connection...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { step: '1', title: 'Share Codes', desc: 'Both parties share their unique link codes with each other.', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
          { step: '2', title: 'OTP Verification', desc: 'A real OTP is emailed to the other party\'s registered email. Enter it to verify.', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
          { step: '3', title: 'One-Click Sync', desc: 'Company sends real financial data directly into CA\'s Client Vault.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        ].map(s => (
          <div key={s.step} className={`p-3 rounded-xl border ${s.color.split(' ').slice(1).join(' ')}`}>
            <span className={`text-xs font-black ${s.color.split(' ')[0]}`}>Step {s.step}</span>
            <p className="text-xs font-semibold text-foreground mt-1">{s.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
