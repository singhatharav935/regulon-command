/**
 * DEMO CA LINKER SETTINGS
 * ========================
 * Settings panel on the CA Dashboard Demo.
 * CA can:
 *  1. See their unique CA Link Code
 *  2. Enter a Company Code to link a client
 *  3. Go through OTP simulation
 *  4. See linked company + their synced financial data
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Copy, Check, RefreshCw, ShieldCheck, Building2,
  Unlink, ArrowRight, Loader2, BadgeCheck, AlertCircle,
  Download, Database, FileText, TrendingUp, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  getCADemoCode, getCAConnection, saveCAConnection,
  clearCAConnection, getCompanyDemoCode, getSyncPayload,
  type DemoCAConnection, type DemoSyncPayload
} from '@/lib/demo-ca-link-store';

type Step = 'idle' | 'otp_sent' | 'verifying' | 'linked';

export default function DemoCALinkerSettings() {
  const [caCode] = useState<string>(getCADemoCode);
  const [copied, setCopied] = useState(false);
  const [companyCodeInput, setCompanyCodeInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [generatedOtp] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [connection, setConnection] = useState<DemoCAConnection | null>(getCAConnection);
  const [syncPayload, setSyncPayload] = useState<DemoSyncPayload | null>(getSyncPayload);
  const [firmName, setFirmName] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sannidh_firm_branding') || '{}').firmName || 'Sannidh CA Practice'; } catch { return 'Sannidh CA Practice'; }
  });

  // Listen for sync events
  useEffect(() => {
    const onSynced = () => setSyncPayload(getSyncPayload());
    const onLinked = () => setConnection(getCAConnection());
    window.addEventListener('demo:data-synced', onSynced);
    window.addEventListener('demo:ca-link-updated', onLinked);
    return () => {
      window.removeEventListener('demo:data-synced', onSynced);
      window.removeEventListener('demo:ca-link-updated', onLinked);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(caCode);
    setCopied(true);
    toast.success('CA Link Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendOtp = () => {
    const trimmed = companyCodeInput.trim().toUpperCase();
    if (!trimmed || trimmed.length < 6) {
      toast.error('Enter a valid Company Link Code');
      return;
    }
    setStep('otp_sent');
    toast.info(`🔐 Demo OTP sent to Company Owner`, {
      description: `For this demo, the OTP is: ${generatedOtp}`,
      duration: 8000,
    });
  };

  const handleVerifyOtp = () => {
    if (otpInput.trim() !== generatedOtp) {
      toast.error('Incorrect OTP. Please try again.', { description: 'Hint: Check the toast notification above.' });
      return;
    }
    setStep('verifying');
    setTimeout(() => {
      const conn: DemoCAConnection = {
        caCode,
        caFirmName: firmName,
        companyCode: companyCodeInput.trim().toUpperCase(),
        companyName: 'Sannidh Precision Machinery Pvt Ltd',
        linkedAt: new Date().toISOString(),
        status: 'linked',
      };
      saveCAConnection(conn);
      setConnection(conn);
      setStep('linked');
      toast.success('🎉 Company Successfully Linked!', {
        description: `${conn.companyName} is now connected to your CA dashboard.`,
      });
    }, 1500);
  };

  const handleUnlink = () => {
    clearCAConnection();
    setConnection(null);
    setStep('idle');
    setCompanyCodeInput('');
    setOtpInput('');
    toast.info('Company unlinked from your CA dashboard');
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[900px]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Company ↔ CA Link Settings
            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">Demo Mode</Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect your CA dashboard to a company using their unique link code + OTP verification.
          </p>
        </div>
      </div>

      {/* Your CA Code */}
      <Card className="bg-card/40 border-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-cyan-300">
            <BadgeCheck className="w-4 h-4" /> Your CA Link Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Share this code with your clients. They enter it in their Company Dashboard Settings to initiate a connection request.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-background/60 border border-cyan-500/30 rounded-xl px-5 py-4 font-mono text-2xl font-black text-cyan-400 tracking-[0.35em] text-center select-all">
              {caCode}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-12 px-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Currently Linked Company */}
      {connection ? (
        <Card className="bg-emerald-500/5 border-emerald-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-4 h-4" /> Linked Company
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{connection.companyName}</p>
                  <p className="text-xs text-muted-foreground font-mono">Code: {connection.companyCode}</p>
                  <p className="text-[10px] text-muted-foreground">Linked: {fmtDate(connection.linkedAt)}</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">✓ Active</Badge>
            </div>

            {/* Synced Data Preview */}
            {syncPayload ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold">
                  <Database className="w-3.5 h-3.5" />
                  Last Synced Data — {fmtDate(syncPayload.sentAt)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Revenue', value: syncPayload.revenue, icon: TrendingUp, color: 'text-green-400' },
                    { label: 'PAT', value: syncPayload.profitAfterTax, icon: TrendingUp, color: 'text-emerald-400' },
                    { label: 'Total Assets', value: syncPayload.totalAssets, icon: Database, color: 'text-blue-400' },
                    { label: 'Compliance Score', value: `${syncPayload.complianceScore}%`, icon: ShieldCheck, color: 'text-cyan-400' },
                  ].map(m => (
                    <div key={m.label} className="bg-background/40 rounded-xl p-3 border border-white/8">
                      <m.icon className={`w-3.5 h-3.5 mb-1 ${m.color}`} />
                      <p className="text-[10px] text-muted-foreground">{m.label}</p>
                      <p className="text-sm font-bold text-foreground">{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
                  <p className="text-xs text-indigo-300 font-medium mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Documents Received ({syncPayload.documents.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {syncPayload.documents.map((doc, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300">
                        {doc.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  📂 This data is now available in Client Vault → {connection.companyName}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/3 border border-white/8 text-center">
                <Sparkles className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  No data synced yet. Ask the company to click "Send Data to CA" from their dashboard.
                </p>
              </div>
            )}

            <Button
              variant="destructive"
              size="sm"
              className="w-full mt-2"
              onClick={handleUnlink}
            >
              <Unlink className="w-4 h-4 mr-2" /> Unlink Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Link a Company */
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400" /> Link a Company Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Enter the Company Link Code provided by your client. An OTP will be sent to the company owner for verification.
            </p>

            <AnimatePresence mode="wait">
              {step === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Company Link Code</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. COAB12XY"
                        value={companyCodeInput}
                        onChange={e => setCompanyCodeInput(e.target.value.toUpperCase())}
                        className="font-mono tracking-wider text-center text-lg font-bold uppercase"
                        maxLength={10}
                      />
                      <Button onClick={handleSendOtp} className="bg-indigo-600 hover:bg-indigo-500 whitespace-nowrap">
                        Send OTP <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                    In demo mode, you can use any code. For a real connection, use the code shown on the Company's Settings page.
                  </div>
                </motion.div>
              )}

              {step === 'otp_sent' && (
                <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
                    <p className="text-xs text-indigo-300 font-medium mb-1">📱 OTP Sent to Company Owner</p>
                    <p className="text-[11px] text-muted-foreground">
                      Company owner will receive an OTP. Ask them to share it with you to verify ownership. (Demo OTP shown in the notification above)
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Enter OTP from Company Owner</label>
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
                  <Button variant="ghost" size="sm" onClick={() => setStep('idle')} className="text-muted-foreground text-xs">
                    ← Go Back
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
      <Card className="bg-card/20 border-border/30">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">How the Connection Works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { step: '1', title: 'CA Shares Code', desc: 'CA copies their unique CA Link Code and shares it with the client company.', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
              { step: '2', title: 'Company Links', desc: 'Company enters CA Code in their Settings + completes OTP verification.', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
              { step: '3', title: 'Data Flows', desc: 'Company clicks "Send Data to CA" → All financials sync instantly into Client Vault.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
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
