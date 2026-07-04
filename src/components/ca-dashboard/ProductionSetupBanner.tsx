/**
 * ProductionSetupBanner
 * Shows a dismissible banner inside the Real External CA Dashboard
 * when API keys are not yet configured in Supabase Secrets.
 * 
 * KEY RULES:
 * - Only appears on /real-external-ca-dashboard (never on demo /ca-dashboard)
 * - Dashboard remains FULLY FUNCTIONAL without these keys
 * - Each feature gracefully degrades (shows helpful message, not crash)
 * - Dismissible per session
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle, ExternalLink, Settings, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ─── All secrets required to fully power the Real External CA Dashboard ───────

const CLIENT_SIDE_KEYS = [
  {
    label: 'Supabase URL',
    key: 'VITE_SUPABASE_URL',
    set: !!(SUPABASE_URL && !SUPABASE_URL.includes('your-project')),
    file: '.env',
    usedFor: 'Database, Auth, all Edge Functions',
    priority: 'required' as const,
  },
  {
    label: 'Supabase Anon Key',
    key: 'VITE_SUPABASE_ANON_KEY',
    set: !!(SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 50),
    file: '.env',
    usedFor: 'Database & Auth client access',
    priority: 'required' as const,
  },
];

const SERVER_SIDE_KEYS = [
  {
    label: 'OpenAI API Key',
    secret: 'OPENAI_API_KEY',
    where: 'https://platform.openai.com/api-keys',
    usedFor: 'AI Drafting Engine, AI Swarm Financial Pipeline, Document Vision OCR',
    priority: 'high' as const,
    cmd: 'npx supabase secrets set OPENAI_API_KEY="sk-..." --project-ref vqomazfvyyfofzdssmaw',
  },
  {
    label: 'Setu Client ID',
    secret: 'SETU_CLIENT_ID',
    where: 'https://bridge.setu.co',
    usedFor: 'RBI Account Aggregator — pulls real bank data upon client consent (AA Framework)',
    priority: 'high' as const,
    cmd: 'npx supabase secrets set SETU_CLIENT_ID="your-id" --project-ref vqomazfvyyfofzdssmaw',
  },
  {
    label: 'Setu Secret',
    secret: 'SETU_SECRET',
    where: 'https://bridge.setu.co',
    usedFor: 'RBI Account Aggregator — authentication for bank data fetch',
    priority: 'high' as const,
    cmd: 'npx supabase secrets set SETU_SECRET="your-secret" --project-ref vqomazfvyyfofzdssmaw',
  },
  {
    label: 'GSTN GSP API Key',
    secret: 'GSTN_GSP_API_KEY',
    where: 'https://www.mastergst.com (or GSTZen / ClearTax)',
    usedFor: 'Auto-fetches 2-year GST filing history via client OTP consent (no password stored)',
    priority: 'high' as const,
    cmd: 'npx supabase secrets set GSTN_GSP_API_KEY="your-key" --project-ref vqomazfvyyfofzdssmaw',
  },
  {
    label: 'MCA API Key',
    secret: 'MCA_API_KEY',
    where: 'https://www.mca.gov.in (MCA21 Developer Portal)',
    usedFor: 'Fetching ROC filings, Director data, Company information',
    priority: 'medium' as const,
    cmd: 'npx supabase secrets set MCA_API_KEY="your-key" --project-ref vqomazfvyyfofzdssmaw',
  },
  {
    label: 'Resend API Key',
    secret: 'RESEND_API_KEY',
    where: 'https://resend.com',
    usedFor: 'Client consent emails, OTP emails, Onboarding notifications',
    priority: 'high' as const,
    cmd: 'npx supabase secrets set RESEND_API_KEY="re_..." --project-ref vqomazfvyyfofzdssmaw',
  },
  {
    label: 'Twilio Account SID',
    secret: 'TWILIO_ACCOUNT_SID',
    where: 'https://console.twilio.com',
    usedFor: 'WhatsApp consent messages to clients',
    priority: 'medium' as const,
    cmd: 'npx supabase secrets set TWILIO_ACCOUNT_SID="AC..." --project-ref vqomazfvyyfofzdssmaw',
  },
  {
    label: 'Twilio Auth Token',
    secret: 'TWILIO_AUTH_TOKEN',
    where: 'https://console.twilio.com',
    usedFor: 'WhatsApp consent messages to clients',
    priority: 'medium' as const,
    cmd: 'npx supabase secrets set TWILIO_AUTH_TOKEN="..." --project-ref vqomazfvyyfofzdssmaw',
  },
  {
    label: 'Twilio WhatsApp Number',
    secret: 'TWILIO_WHATSAPP_FROM',
    where: 'https://console.twilio.com → Messaging → WhatsApp',
    usedFor: 'Sending WhatsApp messages from your Twilio sandbox number',
    priority: 'medium' as const,
    cmd: 'npx supabase secrets set TWILIO_WHATSAPP_FROM="whatsapp:+1415..." --project-ref vqomazfvyyfofzdssmaw',
  },
  {
    label: 'Encryption Key (32-char)',
    secret: 'ENCRYPTION_KEY',
    where: 'Generate yourself: run  openssl rand -hex 16  in terminal',
    usedFor: 'Encrypting client portal credentials (GSTIN passwords stored in vault)',
    priority: 'high' as const,
    cmd: 'npx supabase secrets set ENCRYPTION_KEY="$(openssl rand -hex 16)" --project-ref vqomazfvyyfofzdssmaw',
  },
];

const priorityLabel = (p: string) => {
  if (p === 'required') return { text: 'Required', cls: 'text-red-400 border-red-500/30 bg-red-500/10' };
  if (p === 'high') return { text: 'High Priority', cls: 'text-orange-400 border-orange-500/30 bg-orange-500/10' };
  return { text: 'Optional', cls: 'text-slate-400 border-slate-500/30 bg-slate-500/10' };
};

export default function ProductionSetupBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem('prod-banner-dismissed') === 'true') setDismissed(true);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('prod-banner-dismissed', 'true');
    setDismissed(true);
  };

  const copyCmd = (cmd: string, secret: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(secret);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const missingRequired = CLIENT_SIDE_KEYS.filter(k => !k.set);
  const allRequiredOk = missingRequired.length === 0;

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className={`mb-6 rounded-xl border ${
          allRequiredOk
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-red-500/30 bg-red-500/5'
        } p-4`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Key className={`w-5 h-5 shrink-0 mt-0.5 ${allRequiredOk ? 'text-amber-400' : 'text-red-400'}`} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-foreground">
                  {allRequiredOk
                    ? '⚙️ Production Setup — Add API Keys to Go Live'
                    : '🔴 Required Keys Missing — Set in .env to connect database'}
                </p>
                <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-400">
                  Real Dashboard Only
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {allRequiredOk
                  ? `${SERVER_SIDE_KEYS.length} server-side keys need to be set in Supabase Edge Function Secrets to unlock all features.`
                  : `${missingRequired.length} required .env key(s) missing. Fix these first.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 px-2"
              onClick={() => setExpanded(v => !v)}
            >
              <Settings className="w-3 h-3 mr-1" />
              {expanded ? 'Hide' : 'View All Keys'}
            </Button>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4 border-t border-border/30 pt-4">

                {/* .env Keys */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Step 1 — Set in your <code className="text-cyan-400">.env</code> file
                  </p>
                  <div className="space-y-2">
                    {CLIENT_SIDE_KEYS.map(k => (
                      <div key={k.key} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${k.set ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                        {k.set
                          ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                          : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <code className="text-xs font-mono text-foreground">{k.key}</code>
                          <p className="text-xs text-muted-foreground">{k.usedFor}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${k.set ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}`}>
                          {k.set ? 'SET ✓' : 'MISSING'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supabase Secrets */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                    Step 2 — Set in Supabase Edge Function Secrets
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Go to: <span className="text-cyan-400 font-medium">Supabase Dashboard → Edge Functions → Manage Secrets</span>
                    {' '}or run the copy command in your terminal.
                  </p>
                  <div className="space-y-2">
                    {SERVER_SIDE_KEYS.map(k => {
                      const badge = priorityLabel(k.priority);
                      return (
                        <div key={k.secret} className="p-3 rounded-lg border border-border/30 bg-card/20 text-sm space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-amber-300">{k.secret}</code>
                              <Badge variant="outline" className={`text-[10px] border ${badge.cls}`}>
                                {badge.text}
                              </Badge>
                            </div>
                            <a
                              href={k.where.startsWith('http') ? k.where : undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
                            >
                              Get Key <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <p className="text-xs text-muted-foreground">Used for: {k.usedFor}</p>
                          {/* Terminal command */}
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-[10px] font-mono bg-black/40 text-green-400 px-2 py-1 rounded flex-1 overflow-x-auto whitespace-nowrap">
                              {k.cmd}
                            </code>
                            <button
                              onClick={() => copyCmd(k.cmd, k.secret)}
                              className="text-[10px] px-2 py-1 rounded bg-card/50 border border-border/30 hover:bg-card text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                              {copiedCmd === k.secret ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FIU Registration Note */}
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs text-purple-300">
                  <p className="font-semibold mb-1">📋 Legal Requirements Before Going Live (FIU Registration)</p>
                  <ul className="space-y-1 text-purple-300/80">
                    <li>1. Register SANNIDH as a Financial Information User (FIU) under RBI AA framework</li>
                    <li>2. Register with Sahamati Alliance (sahamati.org.in)</li>
                    <li>3. Pass Infosec audit for Supabase infrastructure</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300">
                  💡 <strong>Dashboard works without these keys.</strong> Each feature shows a clear "API key required" message instead of crashing. Add keys one by one as you get them.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
