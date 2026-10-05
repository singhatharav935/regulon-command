/**
 * DEMO COMPANY CA SYNC PANEL
 * ==========================
 * Two-in-one component for the Company Demo Dashboard:
 *
 *  1. CompanyCASettingsPanel  — Settings tab UI to link the company to a CA
 *     - Shows Company unique code
 *     - Input for CA Code + OTP verification
 *     - Shows linked CA details
 *
 *  2. CompanyCADataSyncCard   — Overview section card
 *     - Shows connection status
 *     - One-click "Send Data to CA" button that fires a demo sync payload
 *     - Animated success confirmation with data receipt summary
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Copy, Check, Building2, ShieldCheck, ArrowRight,
  Loader2, BadgeCheck, AlertCircle, Unlink, Send, Database,
  FileText, TrendingUp, Sparkles, CircleCheck, RefreshCw, Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  getCompanyDemoCode, getCompanyConnection, saveCompanyConnection,
  clearCompanyConnection, saveSyncPayload,
  type DemoCAConnection, type DemoSyncPayload
} from '@/lib/demo-ca-link-store';
import {
  DEMO_COMPANY, DEMO_TASKS, DEMO_DOCUMENTS, DEMO_EXPOSURES
} from '@/data/demo-data';

// ─── Company Settings Panel ────────────────────────────────────────────────────

type Step = 'idle' | 'otp_sent' | 'verifying' | 'linked';

export function CompanyCASettingsPanel() {
  const [companyCode] = useState<string>(getCompanyDemoCode);
  const [copied, setCopied] = useState(false);
  const [caCodeInput, setCaCodeInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [generatedOtp] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [connection, setConnection] = useState<DemoCAConnection | null>(getCompanyConnection);

  useEffect(() => {
    const onLinked = () => setConnection(getCompanyConnection());
    window.addEventListener('demo:company-link-updated', onLinked);
    return () => window.removeEventListener('demo:company-link-updated', onLinked);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(companyCode);
    setCopied(true);
    toast.success('Company Link Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendOtp = () => {
    const trimmed = caCodeInput.trim().toUpperCase();
    if (!trimmed || trimmed.length < 6) {
      toast.error('Enter a valid CA Link Code');
      return;
    }
    setStep('otp_sent');
    toast.info(`🔐 OTP sent to CA for verification`, {
      description: `Demo OTP: ${generatedOtp}`,
      duration: 8000,
    });
  };

  const handleVerifyOtp = () => {
    if (otpInput.trim() !== generatedOtp) {
      toast.error('Incorrect OTP', { description: 'Hint: Check the toast message above.' });
      return;
    }
    setStep('verifying');
    setTimeout(() => {
      const conn: DemoCAConnection = {
        caCode: caCodeInput.trim().toUpperCase(),
        caFirmName: 'Sannidh CA Practice',
        companyCode: companyCode,
        companyName: DEMO_COMPANY.name,
        linkedAt: new Date().toISOString(),
        status: 'linked',
      };
      saveCompanyConnection(conn);
      setConnection(conn);
      setStep('linked');
      toast.success('🎉 CA Successfully Linked!', {
        description: `Your company is now connected to ${conn.caFirmName}.`,
      });
    }, 1500);
  };

  const handleUnlink = () => {
    clearCompanyConnection();
    setConnection(null);
    setStep('idle');
    setCaCodeInput('');
    setOtpInput('');
    toast.info('CA account unlinked from your company');
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[860px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Connect to Your CA
            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">Demo Mode</Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Link your company to your CA's dashboard. Once linked, send all your financial data with one click.
          </p>
        </div>
      </div>

      {/* Company's Own Code */}
      <Card className="bg-card/40 border-indigo-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-300">
            <BadgeCheck className="w-4 h-4" /> Your Company Link Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Share this code with your CA. They enter it in their CA Dashboard Settings to initiate the link.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-background/60 border border-indigo-500/30 rounded-xl px-5 py-4 font-mono text-2xl font-black text-indigo-400 tracking-[0.35em] text-center select-all">
              {companyCode}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-12 px-4 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Currently Linked CA / Link New CA */}
      {connection ? (
        <Card className="bg-emerald-500/5 border-emerald-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-4 h-4" /> Your Linked CA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{connection.caFirmName}</p>
                  <p className="text-xs text-muted-foreground font-mono">CA Code: {connection.caCode}</p>
                  <p className="text-[10px] text-muted-foreground">Linked: {fmtDate(connection.linkedAt)}</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">✓ Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Go to the <strong className="text-foreground">Overview</strong> tab to send your financial data to this CA with one click.
            </p>
            <Button variant="destructive" size="sm" className="w-full" onClick={handleUnlink}>
              <Unlink className="w-4 h-4 mr-2" /> Unlink CA
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-cyan-400" /> Link Your CA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Enter the CA Link Code shared by your chartered accountant. An OTP will be sent to verify.
            </p>
            <AnimatePresence mode="wait">
              {step === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">CA Link Code</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. CAAB12XY"
                        value={caCodeInput}
                        onChange={e => setCaCodeInput(e.target.value.toUpperCase())}
                        className="font-mono tracking-wider text-center text-lg font-bold uppercase"
                        maxLength={10}
                      />
                      <Button onClick={handleSendOtp} className="bg-cyan-600 hover:bg-cyan-500 whitespace-nowrap">
                        Send OTP <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                    In demo mode, use any code (or use the CA Demo Code shown on the CA Dashboard Settings page).
                  </div>
                </motion.div>
              )}
              {step === 'otp_sent' && (
                <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
                    <p className="text-xs text-cyan-300 font-medium mb-1">📱 OTP sent to CA for approval</p>
                    <p className="text-[11px] text-muted-foreground">Enter the OTP shared by your CA to complete verification. (Demo OTP shown in notification above)</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Enter OTP from CA</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="6-digit OTP"
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="font-mono tracking-[0.5em] text-center text-xl font-bold"
                        maxLength={6}
                      />
                      <Button onClick={handleVerifyOtp} className="bg-emerald-600 hover:bg-emerald-500 whitespace-nowrap">
                        Verify OTP
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep('idle')} className="text-muted-foreground text-xs">← Go Back</Button>
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
      <Card className="bg-card/20 border-border/30">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">How it Works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { step: '1', title: 'Share Codes', desc: 'Share your Company Code with CA. Ask them to share their CA Code with you.', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
              { step: '2', title: 'OTP Verification', desc: 'Both sides verify via OTP to confirm ownership — no unauthorized access.', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
              { step: '3', title: 'One-Click Sync', desc: 'From the Overview page, click "Send Data to CA" to sync all financials instantly.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            ].map(s => (
              <div key={s.step} className={`p-3 rounded-xl border ${s.color.split(' ').slice(1).join(' ')}`}>
                <span className={`text-xs font-black ${s.color.split(' ')[0]}`}>Step {s.step}</span>
                <p className="text-xs font-semibold text-foreground mt-1">{s.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Company Overview Sync Card ────────────────────────────────────────────────

type SyncStatus = 'idle' | 'syncing' | 'done';

export function CompanyCADataSyncCard() {
  const [connection, setConnection] = useState<DemoCAConnection | null>(getCompanyConnection);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const onLinked = () => setConnection(getCompanyConnection());
    window.addEventListener('demo:company-link-updated', onLinked);
    return () => window.removeEventListener('demo:company-link-updated', onLinked);
  }, []);

  const handleSendData = () => {
    if (!connection) {
      toast.error('No CA linked', { description: 'Go to Settings → Connect to Your CA first.' });
      return;
    }
    setSyncStatus('syncing');

    setTimeout(() => {
      const payload: DemoSyncPayload = {
        sentAt: new Date().toISOString(),
        companyName: DEMO_COMPANY.name,
        companyCode: getCompanyDemoCode(),
        gstin: DEMO_COMPANY.gstin || '27AABCS1429B1ZD',
        pan: DEMO_COMPANY.pan || 'AABCS1429B',
        financialYear: '2024-25',
        revenue: '₹ 4,82,50,000',
        profitAfterTax: '₹ 72,37,500',
        totalAssets: '₹ 3,86,00,000',
        gstReturns: 'GSTR-1, GSTR-3B (Apr–Mar 2024-25)',
        tdsFilings: 'Form 26Q (Q1–Q4 Filed)',
        complianceScore: DEMO_COMPANY.compliance_score,
        pendingTasks: DEMO_TASKS.filter(t => t.status !== 'completed').length,
        balanceSheet: 'Schedule III Balance Sheet — FY 2024-25',
        profitLoss: 'Schedule III P&L Statement — FY 2024-25',
        trialBalance: 'Working Trial Balance — FY 2024-25',
        documents: DEMO_DOCUMENTS.slice(0, 6).map(d => ({
          name: d.name,
          type: d.file_type,
          status: d.status,
        })),
        notifications: [
          'Financial data synced from SANNIDH Company Dashboard',
          'Compliance score: ' + DEMO_COMPANY.compliance_score + '%',
          'All statutory filings are up to date',
        ],
      };
      saveSyncPayload(payload);
      setSyncStatus('done');
      setLastSyncTime(new Date().toLocaleTimeString('en-IN'));
      toast.success(`✅ Data sent to ${connection.caFirmName}!`, {
        description: 'All financials, filings, and documents have been synced to your CA\'s Client Vault.',
        duration: 6000,
      });
    }, 2500);
  };

  const handleResync = () => {
    setSyncStatus('idle');
  };

  // Not linked
  if (!connection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-dashed border-white/12 bg-card/20 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Connect to Your CA</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Link your company to a CA to enable one-click data sync to their dashboard.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 whitespace-nowrap flex-shrink-0"
          onClick={() => {
            // dispatch to shell to switch to settings tab
            window.dispatchEvent(new CustomEvent('company:switch-tab', { detail: 'ca-settings' }));
          }}
        >
          <Settings2 className="w-4 h-4 mr-2" /> Go to Settings
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 overflow-hidden"
    >
      {/* Header strip */}
      <div className="bg-gradient-to-r from-indigo-500/15 via-cyan-500/8 to-emerald-500/10 border-b border-white/8 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              <Send className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-background animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground">Send Data to CA</h3>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
                <CircleCheck className="w-3 h-3 mr-1" /> Connected
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Linked to <strong className="text-foreground">{connection.caFirmName}</strong>
              {lastSyncTime && (
                <span className="ml-2 text-emerald-400">· Last sync: {lastSyncTime}</span>
              )}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {syncStatus === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                onClick={handleSendData}
                className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white border-0 shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_30px_rgba(99,102,241,0.55)] transition-all duration-300 flex-shrink-0"
              >
                <Send className="w-4 h-4 mr-2" />
                Send All Data to CA
              </Button>
            </motion.div>
          )}
          {syncStatus === 'syncing' && (
            <motion.div key="syncing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button disabled className="bg-indigo-600/50 text-white cursor-not-allowed flex-shrink-0">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing Data...
              </Button>
            </motion.div>
          )}
          {syncStatus === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white flex-shrink-0" disabled>
                <CircleCheck className="w-4 h-4 mr-2" />
                Data Sent!
              </Button>
              <Button variant="outline" size="sm" onClick={handleResync} className="border-white/12 text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Resync
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* What gets sent */}
      <div className="px-6 py-4 bg-card/20">
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">Data Included in Sync</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: FileText, label: 'Financial Statements', sub: 'Balance Sheet, P&L, Trial Balance', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
            { icon: Database, label: 'GST & TDS Filings', sub: 'GSTR-1, 3B, 2B + Form 26Q', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
            { icon: TrendingUp, label: 'ERP Financials', sub: 'Invoices, Bills, Payroll Ledger', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            { icon: ShieldCheck, label: 'Compliance Records', sub: `${DEMO_COMPANY.compliance_score}% score · ${DEMO_TASKS.filter(t => t.status !== 'completed').length} pending`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          ].map(item => (
            <div key={item.label} className={`p-3 rounded-xl border ${item.color.split(' ').slice(1).join(' ')}`}>
              <item.icon className={`w-4 h-4 mb-1.5 ${item.color.split(' ')[0]}`} />
              <p className="text-xs font-semibold text-foreground leading-snug">{item.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Success state expanded */}
      <AnimatePresence>
        {syncStatus === 'done' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-emerald-500/20 px-6 py-4 bg-emerald-500/5"
          >
            <div className="flex items-start gap-3">
              <CircleCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">All data successfully delivered to {connection.caFirmName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your CA can now access the full financial package under{' '}
                  <strong className="text-foreground">Client Vault → {DEMO_COMPANY.name}</strong>.
                  Balance Sheet, P&L, Trial Balance, GST Filings, TDS Records and all documents are now available for review.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
