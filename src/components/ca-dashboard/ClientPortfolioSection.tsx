import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Building2, Clock, Plus, X, ChevronRight, Shield, Send, Loader,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Mail, MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  loadCAClients, type CAClient, type CAClientForm,
  initiateConsentRequest, getPendingConsentRequests, type ConsentRequest,
} from "@/services/ca-supabase-service";
import { validateGSTIN, isGSTINFormatValid } from "@/lib/gstin-validator";

const riskColors: Record<string, string> = {
  Low:    "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  High:   "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusColors: Record<string, string> = {
  "Waiting for CA":     "text-yellow-400",
  "Waiting for Client": "text-orange-400",
  "Filed":              "text-blue-400",
  "Verified":           "text-green-400",
};

const CONSENT_STATUS_CONFIG = {
  pending:  { label: "Awaiting Response", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",  icon: Clock },
  approved: { label: "Authorized",        cls: "bg-green-500/20 text-green-400 border-green-500/30",  icon: CheckCircle },
  rejected: { label: "Declined",          cls: "bg-red-500/20 text-red-400 border-red-500/30",        icon: XCircle },
};

interface ClientPortfolioSectionProps {
  isRealDashboard?: boolean;
  governmentApiEnabled?: boolean;
}

const ClientPortfolioSection = ({
  isRealDashboard = false,
  governmentApiEnabled = false,
}: ClientPortfolioSectionProps) => {
  const [clients, setClients] = useState<CAClient[]>([]);
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [showPending, setShowPending] = useState(true);
  const [onboardForm, setOnboardForm] = useState<CAClientForm>({
    gstin: '', pan: '', cin: '', client_name: '', client_email: '', client_phone: '',
  });

  // ── Government verification state ───────────────────────────────────────
  type VerifyState = null | 'checking' | { ok: boolean; data: Record<string, string> };
  const [gstinVerify, setGstinVerify] = useState<VerifyState>(null);
  const [panVerify,   setPanVerify]   = useState<VerifyState>(null);
  const [cinVerify,   setCinVerify]   = useState<VerifyState>(null);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const VERIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-identifier`;

  const verifyField = useCallback(
    (type: 'gstin' | 'pan' | 'cin', value: string, setter: (s: VerifyState) => void) => {
      clearTimeout(debounceRef.current[type]);
      if (!value || value.length < 10) { setter(null); return; }
      debounceRef.current[type] = setTimeout(async () => {
        setter('checking');
        try {
          const res = await fetch(`${VERIFY_URL}?type=${type}&value=${encodeURIComponent(value)}`);
          const d = await res.json();
          setter({ ok: d.success === true, data: d });
          // Auto-fill company name from GSTIN lookup
          if (type === 'gstin' && d.success && (d.legal_name || d.trade_name)) {
            setOnboardForm(prev =>
              prev.client_name ? prev : { ...prev, client_name: d.legal_name || d.trade_name }
            );
          }
        } catch {
          setter({ ok: false, data: { error: 'Verification service unavailable' } });
        }
      }, 700);
    },
    [VERIFY_URL]
  );

  // GSTIN checksum validation (instant, no network)
  const gstinValidation = onboardForm.gstin
    ? (onboardForm.gstin.length === 15 ? validateGSTIN(onboardForm.gstin) : null)
    : null;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [clientData, consentData] = await Promise.all([
      loadCAClients(),
      getPendingConsentRequests(),
    ]);
    setClients(clientData);
    setConsentRequests(consentData);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll every 30s for consent status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await getPendingConsentRequests();
      setConsentRequests(data);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOnboardClient = async () => {
    if (!onboardForm.gstin && !onboardForm.pan && !onboardForm.cin) {
      toast.error("Identifier Required", { description: "Please enter at least one of: GSTIN, PAN, or CIN." });
      return;
    }
    if (onboardForm.gstin && !gstinValidation?.valid) {
      toast.error("Invalid GSTIN", { description: gstinValidation?.error || "Please check the GSTIN and try again." });
      return;
    }
    if (!onboardForm.client_name.trim()) {
      toast.error("Company Name Required");
      return;
    }
    if (!onboardForm.client_email && !onboardForm.client_phone) {
      toast.error("Contact Required", { description: "Enter client email or phone so we can send the consent request." });
      return;
    }

    setIsOnboarding(true);
    const result = await initiateConsentRequest(onboardForm);
    setIsOnboarding(false);

    if (result.success && result.client) {
      setClients(prev => [result.client!, ...prev]);

      // Build notification status message
      const notifParts: string[] = [];
      if (result.emailSent)     notifParts.push("📧 Email sent");
      if (result.whatsappSent)  notifParts.push("💬 WhatsApp sent");
      const notifMsg = notifParts.length
        ? notifParts.join(" · ")
        : "⚠️ Notifications need API keys — client added to portfolio only";

      toast.success("Client Added & Consent Requested", { description: notifMsg });
      setShowOnboardModal(false);
      setOnboardForm({ gstin: '', pan: '', cin: '', client_name: '', client_email: '', client_phone: '' });
      fetchData(); // Refresh to include the new consent_request row
    } else {
      toast.error("Failed to Add Client", { description: result.error || "Please try again." });
    }
  };

  const pendingCount = consentRequests.filter(r => r.consent_status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 mb-8"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-foreground">Client Portfolio</h2>
            {isRealDashboard && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400">Real Data</span>
                {governmentApiEnabled && <Badge variant="outline" className="text-xs">Gov API Active</Badge>}
              </div>
            )}
            {pendingCount > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 border text-xs">
                {pendingCount} Pending Consent{pendingCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {isRealDashboard
              ? "Live client portfolio with consent-based onboarding. Email & WhatsApp notifications sent automatically."
              : "Clients under your professional responsibility. Unresolved items affect compliance standing."}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          <Button variant="outline" size="sm" onClick={fetchData} className="border-border/50">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
            onClick={() => setShowOnboardModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Pending Consent Requests Panel */}
      {consentRequests.length > 0 && (
        <div className="mb-6 border border-amber-500/20 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowPending(p => !p)}
            className="w-full flex items-center justify-between p-3 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-left"
          >
            <span className="text-amber-400 font-medium text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Consent Requests ({consentRequests.length})
            </span>
            <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform ${showPending ? 'rotate-90' : ''}`} />
          </button>
          {showPending && (
            <div className="divide-y divide-amber-500/10">
              {consentRequests.map(req => {
                const cfg = CONSENT_STATUS_CONFIG[req.consent_status];
                const Icon = cfg.icon;
                return (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-amber-500/5">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{req.client_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {req.client_email && (
                          <span className="flex items-center gap-1 text-slate-500 text-xs">
                            <Mail className="w-3 h-3" />{req.email_sent ? '✓' : '✗'}
                          </span>
                        )}
                        {req.client_phone && (
                          <span className="flex items-center gap-1 text-slate-500 text-xs">
                            <MessageSquare className="w-3 h-3" />{req.whatsapp_sent ? '✓' : '✗'}
                          </span>
                        )}
                        {req.gstin && <span className="text-slate-500 text-xs font-mono">{req.gstin}</span>}
                      </div>
                    </div>
                    <Badge className={`${cfg.cls} border text-xs flex items-center gap-1 ml-3`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Client Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center border border-border/30 rounded-xl">
          <Building2 className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No clients yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Click "Add Client" to onboard your first client</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Industry</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Health</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Risk</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Gaps</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Next Deadline</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.industry} · {client.jurisdiction || 'India'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${client.health}%` }} />
                      </div>
                      <span className="text-sm text-foreground">{client.health}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${riskColors[client.risk]} border`}>{client.risk}</Badge>
                  </TableCell>
                  <TableCell><span className="text-foreground font-medium">{client.gaps}</span></TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{client.deadline}
                    </div>
                  </TableCell>
                  <TableCell className={statusColors[client.status] || 'text-muted-foreground'}>{client.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Client Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showOnboardModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
              onClick={() => setShowOnboardModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Onboard New Client</h3>
                    <p className="text-sm text-muted-foreground">Consent link sent via Email & WhatsApp</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowOnboardModal(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Steps */}
                <div className="flex items-center gap-2 mb-6 text-xs">
                  {["Enter Details", "Client Consent", "Data Fetch", "Health Score"].map((step, i) => (
                    <div key={step} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                      <div className={`flex items-center gap-1 ${i === 0 ? 'text-cyan-400' : 'text-muted-foreground'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${i === 0 ? 'bg-cyan-500/20' : 'bg-muted/20'}`}>{i + 1}</div>
                        <span className="hidden sm:inline">{step}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {/* Company Identifiers */}
                  <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3">Company Identifiers (at least one)</h4>
                    <div className="space-y-3">

                      {/* GSTIN with real-time GST Portal lookup */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">GSTIN</label>
                        <div className="relative">
                          <Input
                            placeholder="e.g., 27AABCA1234C1ZS"
                            value={onboardForm.gstin}
                            onChange={e => {
                              const v = e.target.value.toUpperCase();
                              setOnboardForm(prev => ({ ...prev, gstin: v }));
                              if (v.length === 15 && validateGSTIN(v).valid) {
                                verifyField('gstin', v, setGstinVerify);
                              } else {
                                setGstinVerify(null);
                              }
                            }}
                            className={`bg-card border-border/50 pr-9 font-mono ${
                              gstinValidation?.valid ? 'border-green-500/50' :
                              gstinValidation !== null ? 'border-red-500/50' : ''
                            }`}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {gstinVerify === 'checking'
                              ? <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                              : gstinVerify && typeof gstinVerify === 'object'
                                ? gstinVerify.ok
                                  ? <CheckCircle className="w-4 h-4 text-green-400" />
                                  : <AlertCircle className="w-4 h-4 text-amber-400" />
                                : onboardForm.gstin.length > 0
                                  ? gstinValidation?.valid
                                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                                    : onboardForm.gstin.length === 15
                                      ? <XCircle className="w-4 h-4 text-red-400" />
                                      : <AlertCircle className="w-4 h-4 text-amber-400" />
                                  : null}
                          </div>
                        </div>
                        {/* Verification result badges */}
                        {gstinVerify === 'checking' && (
                          <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
                            <Loader className="w-3 h-3 animate-spin" />
                            Verifying with Government GST Records...
                          </p>
                        )}
                        {gstinVerify && typeof gstinVerify === 'object' && gstinVerify.ok && (
                          <div className="mt-1.5 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs space-y-0.5">
                            <p className="text-green-400 font-semibold">✅ Verified — {gstinVerify.data.legal_name || gstinVerify.data.trade_name}</p>
                            {gstinVerify.data.trade_name && gstinVerify.data.trade_name !== gstinVerify.data.legal_name && (
                              <p className="text-green-300/70">Trade Name: {gstinVerify.data.trade_name}</p>
                            )}
                            <div className="flex gap-3 mt-1 flex-wrap">
                              {gstinVerify.data.status && <span className="text-green-300/70">Status: {gstinVerify.data.status}</span>}
                              {gstinVerify.data.registration_date && <span className="text-green-300/70">Since: {gstinVerify.data.registration_date}</span>}
                              {gstinVerify.data.business_type && <span className="text-green-300/70">{gstinVerify.data.business_type}</span>}
                            </div>
                            {gstinVerify.data.source && <p className="text-green-300/40 text-[10px]">Source: {gstinVerify.data.source}</p>}
                          </div>
                        )}
                        {gstinVerify && typeof gstinVerify === 'object' && !gstinVerify.ok && (
                          <p className="text-xs text-amber-400 mt-1">⚠️ {gstinVerify.data.error || 'Not found in government records'}</p>
                        )}
                        {!gstinVerify && gstinValidation?.valid && (
                          <p className="text-xs text-green-400 mt-1">✓ Format Valid — {gstinValidation.stateName} · PAN: {gstinValidation.pan}</p>
                        )}
                        {gstinValidation && !gstinValidation.valid && (
                          <p className="text-xs text-red-400 mt-1">✗ {gstinValidation.error}</p>
                        )}
                      </div>

                      {/* PAN with entity-type decode */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">PAN</label>
                          <Input
                            placeholder="e.g., AABCA1234C"
                            value={onboardForm.pan}
                            onChange={e => {
                              const v = e.target.value.toUpperCase();
                              setOnboardForm(prev => ({ ...prev, pan: v }));
                              verifyField('pan', v, setPanVerify);
                            }}
                            className={`bg-card border-border/50 font-mono ${
                              panVerify && typeof panVerify === 'object'
                                ? panVerify.ok ? 'border-green-500/50' : 'border-red-500/50'
                                : ''
                            }`}
                          />
                          {panVerify === 'checking' && (
                            <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" />Checking...</p>
                          )}
                          {panVerify && typeof panVerify === 'object' && panVerify.ok && (
                            <p className="text-xs text-green-400 mt-1">✅ {panVerify.data.entity_type}</p>
                          )}
                          {panVerify && typeof panVerify === 'object' && !panVerify.ok && (
                            <p className="text-xs text-red-400 mt-1">✗ Invalid PAN format</p>
                          )}
                        </div>

                        {/* CIN with company metadata decode */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">CIN</label>
                          <Input
                            placeholder="e.g., U74999KA2020PTC..."
                            value={onboardForm.cin}
                            onChange={e => {
                              const v = e.target.value.toUpperCase();
                              setOnboardForm(prev => ({ ...prev, cin: v }));
                              verifyField('cin', v, setCinVerify);
                            }}
                            className={`bg-card border-border/50 font-mono ${
                              cinVerify && typeof cinVerify === 'object'
                                ? cinVerify.ok ? 'border-green-500/50' : 'border-red-500/50'
                                : ''
                            }`}
                          />
                          {cinVerify === 'checking' && (
                            <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" />Checking...</p>
                          )}
                          {cinVerify && typeof cinVerify === 'object' && cinVerify.ok && (
                            <p className="text-xs text-green-400 mt-1">✅ {cinVerify.data.entity_type} · {cinVerify.data.state} · Est. {cinVerify.data.incorporated_year}</p>
                          )}
                          {cinVerify && typeof cinVerify === 'object' && !cinVerify.ok && (
                            <p className="text-xs text-red-400 mt-1">✗ Invalid CIN format</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Contact */}
                  <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <h4 className="text-sm font-semibold text-purple-400 mb-3">Client Contact (for consent notification)</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Company Name *</label>
                        <Input
                          placeholder="e.g., Acme Technologies Pvt. Ltd."
                          value={onboardForm.client_name}
                          onChange={e => setOnboardForm(prev => ({ ...prev, client_name: e.target.value }))}
                          className="bg-card border-border/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1 block">
                            <Mail className="w-3 h-3" /> Email
                          </label>
                          <Input
                            placeholder="finance@company.com"
                            type="email"
                            value={onboardForm.client_email}
                            onChange={e => setOnboardForm(prev => ({ ...prev, client_email: e.target.value }))}
                            className="bg-card border-border/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1 block">
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </label>
                          <Input
                            placeholder="+91 98765 43210"
                            value={onboardForm.client_phone}
                            onChange={e => setOnboardForm(prev => ({ ...prev, client_phone: e.target.value }))}
                            className="bg-card border-border/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 rounded-lg border text-xs bg-blue-500/10 border-blue-500/20 text-blue-300">
                    <p className="flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>A secure consent link is sent via Email & WhatsApp. Data is only fetched after the client authorizes.</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowOnboardModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white border-0"
                      onClick={handleOnboardClient}
                      disabled={isOnboarding}
                    >
                      {isOnboarding
                        ? <><Loader className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                        : <><Send className="w-4 h-4 mr-2" />Send Consent Request</>}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
};

export default ClientPortfolioSection;
