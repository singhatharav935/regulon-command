import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  KeyRound,
  ShieldAlert,
  Play,
  Activity,
  History,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Sparkles,
  Download,
  Terminal,
  Eye,
  FileText,
  FileCheck2,
  Clock,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Bot,
  Scale,
  Send,
  Loader2,
  FileWarning
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getPortalCredentials,
  savePortalCredentials,
  getScraperSelectors,
  getScraperHealthLogs,
  getScraperRepairLogs,
  getDetectedNotices,
  triggerPortalScraper,
  triggerSelfHealingCycle,
  ScraperSelector,
  ScraperHealthLog,
  ScraperRepairLog
} from "@/services/scraper-selector-service";
import { loadCAClients } from "@/services/ca-supabase-service";

export default function GovScraperHub() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  
  // Credentials Vault State
  const [vaultPortal, setVaultPortal] = useState<"GSTN" | "INCOME_TAX" | "MCA">("GSTN");
  const [vaultUsername, setVaultUsername] = useState("");
  const [vaultPassword, setVaultPassword] = useState("");
  const [savedCreds, setSavedCreds] = useState<any[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);

  // Scraper Control State
  const [runningScraper, setRunningScraper] = useState<string | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Health and Healing State
  const [selectors, setSelectors] = useState<ScraperSelector[]>([]);
  const [healthLogs, setHealthLogs] = useState<ScraperHealthLog[]>([]);
  const [repairLogs, setRepairLogs] = useState<ScraperRepairLog[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healingActive, setHealingActive] = useState(false);

  // AI Drafting State
  const [draftingNoticeId, setDraftingNoticeId] = useState<string | null>(null);
  const [activeNotice, setActiveNotice] = useState<any | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [aiCritique, setAiCritique] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  // Load baseline clients, notices, selectors & logs
  const loadData = async () => {
    setLoadingHealth(true);
    try {
      const fetchedClients = await loadCAClients();
      setClients(fetchedClients);
      if (fetchedClients.length > 0 && !selectedClient) {
        setSelectedClient(fetchedClients[0].id);
      }

      const [allNotices, allSelectors, allHealth, allRepairs] = await Promise.all([
        getDetectedNotices(),
        getScraperSelectors(),
        getScraperHealthLogs(20),
        getScraperRepairLogs(20)
      ]);

      setNotices(allNotices);
      setSelectors(allSelectors);
      setHealthLogs(allHealth);
      setRepairLogs(allRepairs);
    } catch (err) {
      console.error("Error loading Gov Scraper Hub data:", err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update saved credentials when client selection changes
  useEffect(() => {
    if (selectedClient) {
      setLoadingCreds(true);
      getPortalCredentials(selectedClient)
        .then(setSavedCreds)
        .finally(() => setLoadingCreds(false));
    }
  }, [selectedClient]);

  const handleSaveCredentials = async () => {
    if (!selectedClient) {
      toast.error("Please select a client first.");
      return;
    }
    if (!vaultUsername || !vaultPassword) {
      toast.error("Username and Password are required.");
      return;
    }

    try {
      const res = await savePortalCredentials(selectedClient, vaultPortal, vaultUsername, vaultPassword);
      if (res.success) {
        toast.success(`Securely saved credentials for ${vaultPortal}`);
        setVaultUsername("");
        setVaultPassword("");
        // Reload credentials
        const updated = await getPortalCredentials(selectedClient);
        setSavedCreds(updated);
      } else {
        toast.error(`Failed to save credentials: ${res.error}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleTriggerScraper = async (portal: "GSTN" | "INCOME_TAX" | "MCA") => {
    if (!selectedClient) {
      toast.error("Please select a client first.");
      return;
    }

    const checkHasCred = savedCreds.find(c => c.portal_type === portal);
    if (!checkHasCred) {
      toast.error(`Please save credentials for ${portal} before running the scraper.`);
      return;
    }

    setRunningScraper(portal);
    toast.info(`Launching headless browser bot for ${portal}...`, {
      description: "Navigating government portal login page, completing CAPTCHA & extracting notices."
    });

    try {
      const res = await triggerPortalScraper(selectedClient, portal);
      if (res.success) {
        toast.success(`Scraper finished successfully! Detected ${res.noticesFound} new notices.`);
        loadData();
      } else {
        toast.error(`Scraper error: ${res.error || "Portal connection timeout."}`);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRunningScraper(null);
    }
  };

  const handleRunSelfHealing = async () => {
    setHealingActive(true);
    toast.info("AI Self-Healing Engine started.", {
      description: "Analyzing recent failure logs, loading DOM structure & generating updated selectors."
    });

    try {
      const res = await triggerSelfHealingCycle();
      if (res.success) {
        const stats = res.stats || { healed: 0, flagged: 0 };
        toast.success("AI Self-Healing cycle finished!", {
          description: `Successfully healed ${stats.healed} selectors. Flagged ${stats.flagged} for manual review.`
        });
        loadData();
      } else {
        toast.error(`Self-healing failed: ${res.error}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setHealingActive(false);
    }
  };

  const handleGenerateReply = async (notice: any) => {
    setDraftingNoticeId(notice.id);
    toast.info("Invoking Multi-Agent AI Drafting Engine...", {
      description: "Compiling client statutory modules, balance sheet books & searching legal vectors for arguments."
    });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-drafting-engine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({
          action: "generate_draft",
          notice_id: notice.id,
          company_id: notice.company_id,
          ca_user_id: notice.ca_user_id,
          financial_year: notice.financial_year || "2024-25"
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      if (data.success) {
        setDraftContent(data.draft);
        setAiCritique(data.critique);
        setActiveNotice(notice);
        setShowDraftModal(true);
        toast.success("AI reply drafted successfully!");
        loadData();
      } else {
        toast.error(`AI drafting error: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Failed to generate draft: ${err.message}`);
    } finally {
      setDraftingNoticeId(null);
    }
  };

  const handleApproveDraft = async () => {
    if (!activeNotice) return;
    setSavingDraft(true);
    try {
      const { error } = await supabase
        .from("client_govt_notices")
        .update({
          draft_content: draftContent,
          status: "resolved" // Marks it as resolved/approved
        })
        .eq("id", activeNotice.id);

      if (error) throw error;
      toast.success("Notice reply approved & saved to client document vault!");
      setShowDraftModal(false);
      loadData();
    } catch (err: any) {
      toast.error(`Failed to save draft: ${err.message}`);
    } finally {
      setSavingDraft(false);
    }
  };

  const getPortalBadge = (portal: string) => {
    switch (portal) {
      case "GSTN": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">GSTN</Badge>;
      case "INCOME_TAX": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">IT Portal</Badge>;
      case "MCA": return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">MCA V3</Badge>;
      default: return <Badge variant="outline">{portal}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Success</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      case "captcha_failed": return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">CAPTCHA Failed</Badge>;
      case "login_failed": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Login Failed</Badge>;
      case "selector_not_found": return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Selector Broken</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-purple-500/5 to-transparent border border-orange-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-orange-400 flex items-center gap-2">
              <Cpu className="w-6 h-6 animate-pulse" />
              Autonomous Gov Scraper Hub
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Multi-portal government notices scrapers with OCR CAPTCHA solving and AI Self-Healing selectors.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              disabled={loadingHealth}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingHealth ? 'animate-spin' : ''}`} />
              Refresh Console
            </Button>
            <Button
              onClick={handleRunSelfHealing}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-medium shadow-[0_0_20px_rgba(249,115,22,0.3)] border-0"
              disabled={healingActive}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {healingActive ? "AI Healing Active..." : "Run AI Self-Heal"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Client Selector & Credentials Vault */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card border-orange-500/20 bg-card/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-orange-300">
                <KeyRound className="w-4 h-4" /> Credentials Vault
              </CardTitle>
              <CardDescription>Securely store client government logins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vault-client">Target Client Company</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger id="vault-client" className="bg-background/40 border-border/40">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/40 text-foreground">
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vault-portal">Government Portal</Label>
                <Select value={vaultPortal} onValueChange={(val: any) => setVaultPortal(val)}>
                  <SelectTrigger id="vault-portal" className="bg-background/40 border-border/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/40">
                    <SelectItem value="GSTN">GST Portal (GSTN)</SelectItem>
                    <SelectItem value="INCOME_TAX">Income Tax e-Filing</SelectItem>
                    <SelectItem value="MCA">Ministry of Corporate Affairs (MCA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vault-user">Username</Label>
                <Input
                  id="vault-user"
                  placeholder="GSTIN, PAN, or MCA ID"
                  value={vaultUsername}
                  onChange={(e) => setVaultUsername(e.target.value)}
                  className="bg-background/40 border-border/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vault-pass">Password</Label>
                <Input
                  id="vault-pass"
                  type="password"
                  placeholder="••••••••"
                  value={vaultPassword}
                  onChange={(e) => setVaultPassword(e.target.value)}
                  className="bg-background/40 border-border/40"
                />
              </div>

              <Button
                onClick={handleSaveCredentials}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white border-0"
              >
                Secure Save
              </Button>

              <div className="pt-4 border-t border-border/30">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stored Credentials</h4>
                {loadingCreds ? (
                  <div className="text-xs text-muted-foreground animate-pulse">Loading vault status...</div>
                ) : savedCreds.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No credentials stored for this client.</div>
                ) : (
                  <div className="space-y-2">
                    {savedCreds.map(c => (
                      <div key={c.portal_type} className="flex items-center justify-between p-2 rounded bg-background/30 border border-border/20 text-xs">
                        <span className="font-semibold text-orange-200">{c.portal_type}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{c.username}</span>
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Control tower & statistics */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="bg-card/40 border border-border/40 grid grid-cols-4 mb-4">
              <TabsTrigger value="status">Portal Status</TabsTrigger>
              <TabsTrigger value="selectors">AI Selectors</TabsTrigger>
              <TabsTrigger value="notices">Detected Notices</TabsTrigger>
              <TabsTrigger value="logs">Scraper Logs</TabsTrigger>
            </TabsList>

            {/* TAB 1: PORTAL STATUS */}
            <TabsContent value="status" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* GST Card */}
                <Card className="glass-card border-green-500/20 bg-gradient-to-b from-green-500/5 to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      GST Portal (GSTN)
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                      Checks GSTR-1, 2B, 3B returns & notices.
                    </div>
                    <Button
                      onClick={() => handleTriggerScraper("GSTN")}
                      disabled={runningScraper !== null}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-white border-0"
                    >
                      {runningScraper === "GSTN" ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 mr-2" />
                          Run GST Bot
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Income Tax Card */}
                <Card className="glass-card border-yellow-500/20 bg-gradient-to-b from-yellow-500/5 to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      Income Tax e-Filing
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                      Checks Outstanding Demands & Section notices.
                    </div>
                    <Button
                      onClick={() => handleTriggerScraper("INCOME_TAX")}
                      disabled={runningScraper !== null}
                      size="sm"
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white border-0"
                    >
                      {runningScraper === "INCOME_TAX" ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 mr-2" />
                          Run IT Bot
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* MCA Card */}
                <Card className="glass-card border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      MCA Portal (V3)
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                      Checks Show Cause Notices & Company Defaults.
                    </div>
                    <Button
                      onClick={() => handleTriggerScraper("MCA")}
                      disabled={runningScraper !== null}
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0"
                    >
                      {runningScraper === "MCA" ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 mr-2" />
                          Run MCA Bot
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* AI Healing Timeline */}
              <Card className="glass-card border-orange-500/20 bg-card/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-orange-300">
                    <Bot className="w-4 h-4" /> AI Self-Healing Activity Log
                  </CardTitle>
                  <CardDescription>Timeline of auto-repair events executed by the monitor.</CardDescription>
                </CardHeader>
                <CardContent>
                  {repairLogs.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4 text-center">No AI healing events logged yet. System running smoothly.</div>
                  ) : (
                    <div className="space-y-4">
                      {repairLogs.map(log => (
                        <div key={log.id} className="relative pl-6 pb-2 border-l border-orange-500/30 last:pb-0">
                          <span className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-orange-500" />
                          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                            <span className="font-semibold text-orange-200">
                              Healed {log.portal} :: {log.selector_key}
                            </span>
                            <Badge variant={log.status === "deployed" || log.status === "verified" ? "default" : "destructive"}>
                              {log.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-red-400 font-mono">Original:</span> "{log.original_selector}" &rarr;{" "}
                            <span className="text-green-400 font-mono">New:</span> "{log.fixed_selector}"
                          </p>
                          <p className="text-[10px] text-muted-foreground/80 mt-1 italic">
                            Confidence: {log.confidence_score}% • {log.ai_explanation}
                          </p>
                          <span className="text-[9px] text-muted-foreground/50 block mt-1">
                            {new Date(log.repaired_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: ACTIVE SELECTORS */}
            <TabsContent value="selectors" className="m-0">
              <Card className="glass-card border-orange-500/20 bg-card/20">
                <CardHeader>
                  <CardTitle className="text-base text-orange-300">Live Scraper CSS Selectors Mapping</CardTitle>
                  <CardDescription>If the portal layout changes, AI updates these selectors at runtime.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-background/40">
                      <TableRow>
                        <TableHead>Portal</TableHead>
                        <TableHead>Selector Key</TableHead>
                        <TableHead>Active Selector Value</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Ver.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {selectors.map(sel => (
                        <TableRow key={sel.id} className="hover:bg-background/20">
                          <TableCell>{getPortalBadge(sel.portal)}</TableCell>
                          <TableCell className="font-mono text-orange-200">{sel.selector_key}</TableCell>
                          <TableCell className="font-mono text-green-400 max-w-[200px] truncate" title={sel.selector_value}>
                            {sel.selector_value}
                          </TableCell>
                          <TableCell>
                            {sel.healed_by_ai ? (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center gap-1 w-fit">
                                <Sparkles className="w-2.5 h-2.5" /> AI Healed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="w-fit text-[10px]">Developer</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">v{sel.version}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: DETECTED NOTICES FEED */}
            <TabsContent value="notices" className="m-0">
              <Card className="glass-card border-orange-500/20 bg-card/20">
                <CardHeader>
                  <CardTitle className="text-base text-orange-300">Scraped Government Notices Feed</CardTitle>
                  <CardDescription>Real-time feed of parsed notices ready for AI Drafting defense.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {notices.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-8 text-center">No notices detected yet. Run scrapers above to scan.</div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-background/40">
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Dept.</TableHead>
                          <TableHead>Ref Number</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {notices.map(n => (
                          <TableRow key={n.id} className="hover:bg-background/20">
                            <TableCell className="font-medium text-foreground">{n.companies?.name || "Unknown Company"}</TableCell>
                            <TableCell>{getPortalBadge(n.department === "GST" ? "GSTN" : n.department === "Income Tax" ? "INCOME_TAX" : "MCA")}</TableCell>
                            <TableCell className="font-mono text-orange-200">{n.notice_number}</TableCell>
                            <TableCell className="max-w-[120px] truncate" title={n.notice_type}>{n.notice_type}</TableCell>
                            <TableCell>{n.issue_date}</TableCell>
                            <TableCell className="text-rose-400 font-semibold">{n.due_date || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {n.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {n.status === "detected" ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleGenerateReply(n)}
                                  disabled={draftingNoticeId !== null}
                                  className="bg-orange-600 hover:bg-orange-700 text-xs px-2.5 py-1 text-white border-0 flex items-center gap-1 ml-auto"
                                >
                                  {draftingNoticeId === n.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3" />
                                  )}
                                  Draft Reply
                                </Button>
                              ) : n.status === "review_pending" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setDraftContent(n.draft_content || "");
                                    setAiCritique(n.ai_summary || "");
                                    setActiveNotice(n);
                                    setShowDraftModal(true);
                                  }}
                                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs px-2.5 py-1 flex items-center gap-1 ml-auto"
                                >
                                  <Eye className="w-3 h-3" />
                                  Review Draft
                                </Button>
                              ) : (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 w-fit ml-auto">
                                  Resolved
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: SCRAPER RUN LOGS */}
            <TabsContent value="logs" className="m-0">
              <Card className="glass-card border-orange-500/20 bg-card/20">
                <CardHeader>
                  <CardTitle className="text-base text-orange-300">Headless Scraper Run Logs</CardTitle>
                  <CardDescription>Audit trails of bot activity for the last 50 execution runs.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-background/40">
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Portal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notices</TableHead>
                        <TableHead>Step Failed</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {healthLogs.map(log => (
                        <TableRow key={log.id} className="hover:bg-background/20">
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">{(log as any).companies?.name || "System Scan"}</TableCell>
                          <TableCell>{getPortalBadge(log.portal)}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="font-bold text-center">{log.notices_found}</TableCell>
                          <TableCell className="font-mono text-red-300">{log.failed_step || "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      </div>

      {/* AI Drafting Modal (Review generated draft & critique side-by-side) */}
      <Dialog open={showDraftModal} onOpenChange={setShowDraftModal}>
        <DialogContent className="max-w-6xl h-[85vh] bg-card border-orange-500/20 text-foreground flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-orange-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              Notice Response Draft Review
            </DialogTitle>
            <DialogDescription>
              Review the AI-generated reply and Senior Partner critique for notice #{activeNotice?.notice_number}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden my-4">
            {/* Left Column: Notice Context & Critique */}
            <div className="md:col-span-1 space-y-4 overflow-y-auto pr-2">
              <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                <h4 className="text-xs font-bold text-orange-300 uppercase mb-2">Notice Context</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-semibold">{activeNotice?.companies?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notice Number:</span>
                    <span className="font-semibold font-mono">{activeNotice?.notice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-semibold">{activeNotice?.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filing Type:</span>
                    <span className="font-semibold">{activeNotice?.notice_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-semibold text-rose-400">{activeNotice?.due_date || "N/A"}</span>
                  </div>
                </div>
              </div>

              {aiCritique && (
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Senior Partner Critique
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {aiCritique}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Draft Editor */}
            <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
              <div className="flex-1 flex flex-col border border-border/30 rounded-lg overflow-hidden bg-background/30">
                <div className="bg-background/80 border-b border-border/30 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-orange-400" /> Draft Content
                  </span>
                  <Badge variant="outline" className="text-[10px] text-green-400 border-green-500/30">
                    Editable
                  </Badge>
                </div>
                <Textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="flex-1 resize-none bg-transparent border-0 p-4 font-mono text-xs focus-visible:ring-0 focus-visible:ring-offset-0 overflow-y-auto leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
            <Button
              variant="outline"
              onClick={() => setShowDraftModal(false)}
              className="border-border hover:bg-background"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveDraft}
              disabled={savingDraft}
              className="bg-green-600 hover:bg-green-700 text-white font-medium border-0 px-6"
            >
              {savingDraft ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve &amp; Save Reply
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
