import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Play, Square, Volume2, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation, useNavigate } from "react-router-dom";

type VoiceBriefAgentProps = {
  dashboardId: string;
  actorName: string;
  roleLabel: string;
  pendingWork: string[];
  newRules: string[];
  autopilotActions: string[];
  actionLedger?: Array<{
    id: string;
    timeLabel: string;
    portal: string;
    action: string;
    status: "completed" | "queued" | "needs_approval";
    approvalTitle?: string;
  }>;
};

type VoiceOption = {
  name: string;
  lang: string;
};

const clampRate = (value: number) => Math.max(0.8, Math.min(1.2, value));
const statusStoragePrefix = "sannidh:voice-agent:approval-status:";
const statusLabel = {
  completed: "Completed",
  queued: "Queued",
  needs_approval: "Needs Approval",
} as const;
const statusToneClass = {
  completed: "text-emerald-300",
  queued: "text-blue-300",
  needs_approval: "text-amber-300",
} as const;
const portalFromText = (text: string) => {
  if (/gst/i.test(text)) return "GST";
  if (/\bmca\b|companies act|roc/i.test(text)) return "MCA";
  if (/income[\s-]?tax|itd|section\s*143|section\s*194/i.test(text)) return "Income Tax";
  if (/\brbi\b|fema|nbfc/i.test(text)) return "RBI";
  if (/\bsebi\b|lodr|pit|sast/i.test(text)) return "SEBI";
  if (/customs|bill of entry|cth/i.test(text)) return "Customs";
  return "Regulatory";
};

const AIVoiceBriefAgent = ({
  dashboardId,
  actorName,
  roleLabel,
  pendingWork,
  newRules,
  autopilotActions,
  actionLedger = [],
}: VoiceBriefAgentProps) => {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voiceLanguage, setVoiceLanguage] = useState<"en-IN" | "hi-IN">("en-IN");
  const [clarityMode, setClarityMode] = useState<"clear" | "natural">("clear");
  const [selectedVoice, setSelectedVoice] = useState<string>("auto");
  const [speechRate, setSpeechRate] = useState<string>("0.95");
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [approvalStatusMap, setApprovalStatusMap] = useState<Record<string, "pending" | "approved">>({});
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewStatusFilter, setReviewStatusFilter] = useState<"all" | "completed" | "queued" | "needs_approval">("all");
  const [reviewPortalFilter, setReviewPortalFilter] = useState<string>("all");
  const hasAutoplayAttemptedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const storageKey = useMemo(() => `sannidh:voice-agent:${dashboardId}`, [dashboardId]);
  const approvalStorageKey = useMemo(() => `${statusStoragePrefix}${dashboardId}`, [dashboardId]);
  const reviewStorageKey = useMemo(() => `sannidh:agent-work-review:${dashboardId}`, [dashboardId]);
  const normalizedLedger = useMemo(() => {
    if (actionLedger.length > 0) return actionLedger;
    const syntheticActions = autopilotActions.slice(0, 3).map((action, idx) => ({
      id: `auto-done-${idx + 1}`,
      timeLabel: idx === 0 ? "06:10 AM" : idx === 1 ? "05:52 AM" : "05:31 AM",
      portal: portalFromText(action),
      action,
      status: "completed" as const,
    }));
    const syntheticApprovals = pendingWork.slice(0, 2).map((task, idx) => ({
      id: `auto-approval-${idx + 1}`,
      timeLabel: idx === 0 ? "06:28 AM" : "06:35 AM",
      portal: portalFromText(task),
      action: `Prepared review bundle for ${task}.`,
      status: "needs_approval" as const,
      approvalTitle: `Approve outbound communication for ${task}`,
    }));
    return [...syntheticActions, ...syntheticApprovals];
  }, [actionLedger, autopilotActions, pendingWork]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(approvalStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, "pending" | "approved">;
      setApprovalStatusMap(parsed);
    } catch {
      // ignore parsing/storage issues
    }
  }, [approvalStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(approvalStorageKey, JSON.stringify(approvalStatusMap));
  }, [approvalStatusMap, approvalStorageKey]);

  const ledgerNeedsApproval = useMemo(
    () =>
      normalizedLedger.filter(
        (item) => item.status === "needs_approval" && approvalStatusMap[item.id] !== "approved",
      ),
    [normalizedLedger, approvalStatusMap],
  );
  const ledgerCompleted = useMemo(
    () =>
      normalizedLedger.filter(
        (item) => item.status === "completed" || (item.status === "needs_approval" && approvalStatusMap[item.id] === "approved"),
      ),
    [normalizedLedger, approvalStatusMap],
  );
  const handledPortals = useMemo(
    () => Array.from(new Set(ledgerCompleted.map((item) => item.portal))).filter(Boolean),
    [ledgerCompleted],
  );
  const topCompletedActions = useMemo(
    () => ledgerCompleted.slice(0, 3).map((item) => `${item.portal}: ${item.action}`),
    [ledgerCompleted],
  );
  const topApprovals = useMemo(
    () => ledgerNeedsApproval.slice(0, 2).map((item) => item.approvalTitle || item.action),
    [ledgerNeedsApproval],
  );
  const approveItem = (id: string) => {
    setApprovalStatusMap((prev) => ({ ...prev, [id]: "approved" }));
  };
  const approveAllPending = () => {
    const next = { ...approvalStatusMap };
    ledgerNeedsApproval.forEach((item) => {
      next[item.id] = "approved";
    });
    setApprovalStatusMap(next);
  };
  const roleScope = useMemo(() => {
    const role = roleLabel.toLowerCase();
    if (role.includes("firm")) {
      return [
        "Cross-CA workload rebalance for critical notices",
        "Priority lane creation for 24h/48h filing deadlines",
        "Partner-level escalation digest with risk scoring",
      ];
    }
    if (role.includes("company")) {
      return [
        "Entity-level compliance monitoring across regulators",
        "Deadline watch + draft evidence readiness",
        "Management-ready compliance status summary",
      ];
    }
    if (role.includes("admin")) {
      return [
        "Portfolio-wide risk clustering and SLA breach watch",
        "Owner assignment checks and missed-action flags",
        "Consolidated compliance operations intelligence",
      ];
    }
    if (role.includes("legal")) {
      return [
        "Clause-risk extraction and legal issue prioritization",
        "Draft rebuttal quality checks and hearing prep aids",
        "Evidence-to-argument mapping review",
      ];
    }
    if (role.includes("university")) {
      return [
        "Finance-compliance queue tracking and due-date controls",
        "Audit-evidence sequencing and follow-up prompts",
        "Regulatory event digest for institutional owners",
      ];
    }
    return [
      "Notice triage and class-aware draft readiness",
      "Risk and deadline watch with action recommendations",
      "Pending approval queue management before submission",
    ];
  }, [roleLabel]);
  const reviewPortals = useMemo(
    () => Array.from(new Set(normalizedLedger.map((item) => item.portal))).filter(Boolean),
    [normalizedLedger],
  );
  const reviewedLedgerRows = useMemo(() => {
    return normalizedLedger
      .map((item) => {
        const approved = item.status === "needs_approval" && approvalStatusMap[item.id] === "approved";
        const liveStatus = approved ? "completed" : item.status;
        return { ...item, liveStatus };
      })
      .filter((item) => (reviewStatusFilter === "all" ? true : item.liveStatus === reviewStatusFilter))
      .filter((item) => (reviewPortalFilter === "all" ? true : item.portal === reviewPortalFilter));
  }, [normalizedLedger, approvalStatusMap, reviewStatusFilter, reviewPortalFilter]);
  const buildGeneratedWork = (item: { portal: string; action: string; approvalTitle?: string }) => {
    return `Agent Drafted Work Summary

Portal: ${item.portal}
Action Performed: ${item.action}
Owner Approval Need: ${item.approvalTitle || "Not required"}

Draft Notes:
1. Facts extracted and structured for quick owner review.
2. Risk and dependency points tagged for approval workflow.
3. Owner may edit this text before final approval and release.

Owner Editable Section:
[Update legal/factual language here before approval.]`;
  };
  const openReviewPage = () => {
    const base = location.pathname.startsWith("/app/") ? "/app/agent-work-review" : "/agent-work-review";
    navigate(`${base}?dashboardId=${encodeURIComponent(dashboardId)}`);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      dashboardId,
      actorName,
      roleLabel,
      generatedAt: new Date().toISOString(),
      items: normalizedLedger.map((item) => ({
        ...item,
        generatedWork: buildGeneratedWork(item),
      })),
    };
    window.localStorage.setItem(reviewStorageKey, JSON.stringify(payload));
  }, [dashboardId, actorName, roleLabel, normalizedLedger, reviewStorageKey]);

  const scriptEnglish = useMemo(() => {
    const pending = pendingWork.length > 0
      ? `Pending work: ${pendingWork.join(". ")}.`
      : "No critical pending work right now.";
    const rules = newRules.length > 0
      ? `New rules and updates: ${newRules.join(". ")}.`
      : "No high-risk regulatory update flagged yet.";
    const actions = autopilotActions.length > 0
      ? `Autopilot actions done in background: ${autopilotActions.join(". ")}.`
      : "No background autopilot action has been executed yet.";
    const completed = ledgerCompleted.length > 0
      ? `While you were away, I completed ${ledgerCompleted.length} high-priority actions across ${handledPortals.join(", ")}. Completed highlights: ${topCompletedActions.join(". ")}.`
      : "";
    const approvals = ledgerNeedsApproval.length > 0
      ? `You have ${ledgerNeedsApproval.length} approval items pending before external submission. Pending approval highlights: ${topApprovals.join(". ")}.`
      : "No approval-blocked item right now.";

    return `Good morning, ${actorName}. This is your Regulon autonomous brief for ${roleLabel}. ${completed} ${pending} ${rules} ${actions} ${approvals} Please review and approve pending actions so I can execute the final outbound steps.`;
  }, [actorName, roleLabel, pendingWork, newRules, autopilotActions, ledgerCompleted, ledgerNeedsApproval, handledPortals, topCompletedActions, topApprovals]);
  const scriptHindi = useMemo(() => {
    const pending = pendingWork.length > 0
      ? `Pending work: ${pendingWork.join(". ")}.`
      : "Abhi koi critical pending work nahi hai.";
    const rules = newRules.length > 0
      ? `Naye rules updates: ${newRules.join(". ")}.`
      : "Abhi koi high risk regulatory update flag nahi hua hai.";
    const actions = autopilotActions.length > 0
      ? `Autopilot actions complete: ${autopilotActions.join(". ")}.`
      : "Background autopilot action abhi execute nahi hua.";
    const completed = ledgerCompleted.length > 0
      ? `Aapke away hone par maine ${ledgerCompleted.length} high-priority actions complete kiye, portals: ${handledPortals.join(", ")}. Highlights: ${topCompletedActions.join(". ")}.`
      : "";
    const approvals = ledgerNeedsApproval.length > 0
      ? `${ledgerNeedsApproval.length} approval items pending hain. Pending highlights: ${topApprovals.join(". ")}. Submission se pehle confirm karein.`
      : "Is waqt koi approval-blocked item pending nahi hai.";

    return `Namaste ${actorName}. Yeh aapka Regulon autonomous brief hai, role ${roleLabel}. ${completed} ${pending} ${rules} ${actions} ${approvals} Kripya review karke pending approvals approve karein.`;
  }, [actorName, roleLabel, pendingWork, newRules, autopilotActions, ledgerCompleted, ledgerNeedsApproval, handledPortals, topCompletedActions, topApprovals]);
  const script = voiceLanguage === "hi-IN" ? scriptHindi : scriptEnglish;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        voice?: string;
        rate?: string;
        autoplay?: boolean;
        language?: "en-IN" | "hi-IN";
        clarity?: "clear" | "natural";
      };
      if (parsed.voice) setSelectedVoice(parsed.voice);
      if (parsed.rate) setSpeechRate(parsed.rate);
      if (typeof parsed.autoplay === "boolean") setAutoPlayEnabled(parsed.autoplay);
      if (parsed.language) setVoiceLanguage(parsed.language);
      if (parsed.clarity) setClarityMode(parsed.clarity);
    } catch {
      // ignore parsing/storage issues
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify({
      voice: selectedVoice,
      rate: speechRate,
      autoplay: autoPlayEnabled,
      language: voiceLanguage,
      clarity: clarityMode,
    });
    window.localStorage.setItem(storageKey, payload);
  }, [selectedVoice, speechRate, autoPlayEnabled, voiceLanguage, clarityMode, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    const updateVoices = () => {
      const options = synth.getVoices().map((voice) => ({ name: voice.name, lang: voice.lang }));
      const unique = options.filter(
        (voice, idx) => options.findIndex((v) => `${v.name}:${v.lang}` === `${voice.name}:${voice.lang}`) === idx,
      );
      setVoices(unique);
    };

    updateVoices();
    synth.addEventListener("voiceschanged", updateVoices);
    return () => {
      synth.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  const stopSpeaking = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const filteredVoices = useMemo(() => {
    const prefix = voiceLanguage === "hi-IN" ? "hi" : "en";
    const exact = voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
    return exact.length > 0 ? exact : voices;
  }, [voices, voiceLanguage]);

  const resolveAutoVoice = (allVoices: SpeechSynthesisVoice[]) => {
    const prefix = voiceLanguage === "hi-IN" ? "hi" : "en";
    const candidates = allVoices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
    const pool = candidates.length > 0 ? candidates : allVoices;
    if (pool.length === 0) return undefined;
    const ranked = [...pool].sort((a, b) => {
      const rank = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes("google")) return 3;
        if (n.includes("microsoft")) return 2;
        if (n.includes("neural")) return 2;
        return 1;
      };
      return rank(b.name) - rank(a.name);
    });
    return ranked[0];
  };

  const playBrief = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const allVoices = synth.getVoices();
    const autoVoice = resolveAutoVoice(allVoices);
    const explicitVoice = selectedVoice !== "auto"
      ? allVoices.find((voice) => `${voice.name}:${voice.lang}` === selectedVoice)
      : undefined;
    const chosenVoice = explicitVoice || autoVoice;
    const baseRate = clampRate(Number(speechRate));
    const effectiveRate = clarityMode === "clear" ? clampRate(baseRate * 0.95) : baseRate;
    const chunks = script
      .split(/[.?!।]/g)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);

    if (chunks.length === 0) return;
    setIsSpeaking(true);
    chunks.forEach((chunk, idx) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = voiceLanguage;
      utterance.rate = effectiveRate;
      utterance.pitch = clarityMode === "clear" ? 0.95 : 1.0;
      utterance.volume = 1.0;
      if (chosenVoice) utterance.voice = chosenVoice;
      utterance.onend = () => {
        if (idx === chunks.length - 1) {
          setIsSpeaking(false);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);
      synth.speak(utterance);
    });
  };

  useEffect(() => {
    if (!autoPlayEnabled || hasAutoplayAttemptedRef.current) return;
    hasAutoplayAttemptedRef.current = true;
    const timer = window.setTimeout(() => {
      playBrief();
    }, 600);
    return () => window.clearTimeout(timer);
  }, [autoPlayEnabled, script, voiceLanguage, selectedVoice, speechRate, clarityMode]);

  useEffect(() => () => stopSpeaking(), []);

  const availableRates = ["0.85", "0.9", "0.95", "1.0", "1.05", "1.1"];

  return (
    <Card className="glass-card border-cyan-500/30 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-300" />
          Regulon Compliance Partner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-300">{roleLabel}</Badge>
          <Badge variant="outline" className={isSpeaking ? "border-emerald-500/40 text-emerald-300" : "border-border/60 text-muted-foreground"}>
            {isSpeaking ? "Speaking" : "Idle"}
          </Badge>
          <Badge variant="outline" className="border-blue-500/40 text-blue-300">
            Completed: {ledgerCompleted.length}
          </Badge>
          <Badge variant="outline" className={ledgerNeedsApproval.length > 0 ? "border-amber-500/40 text-amber-300" : "border-emerald-500/40 text-emerald-300"}>
            Approval Queue: {ledgerNeedsApproval.length}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Trusted partner brief for <span className="text-foreground font-medium">{actorName}</span>: completed actions, latest rule impacts, and approval-ready work.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={playBrief} className="btn-glow">
            <Play className="w-4 h-4 mr-2" />
            Play Brief
          </Button>
          <Button type="button" variant="outline" onClick={stopSpeaking}>
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsDetailsOpen((prev) => !prev)}>
            <Settings2 className="w-4 h-4 mr-2" />
            {isDetailsOpen ? "Hide Settings" : "Voice Settings"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsReviewOpen(true)}>
            Go Through Review
          </Button>
          <Button type="button" variant="outline" onClick={openReviewPage}>
            Open Review Page
          </Button>
        </div>

        {isDetailsOpen && (
          <div className="p-3 rounded-lg border border-border/50 bg-background/40 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Select value={voiceLanguage} onValueChange={(value: "en-IN" | "hi-IN") => {
                setVoiceLanguage(value);
                setSelectedVoice("auto");
              }}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-IN">English (India)</SelectItem>
                  <SelectItem value="hi-IN">Hindi (India)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto voice</SelectItem>
                  {filteredVoices.map((voice) => (
                    <SelectItem key={`${voice.name}:${voice.lang}`} value={`${voice.name}:${voice.lang}`}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={clarityMode} onValueChange={(value: "clear" | "natural") => setClarityMode(value)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Clarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear">Clear Voice (Recommended)</SelectItem>
                  <SelectItem value="natural">Natural Voice</SelectItem>
                </SelectContent>
              </Select>
              <Select value={speechRate} onValueChange={setSpeechRate}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Rate" />
                </SelectTrigger>
                <SelectContent>
                  {availableRates.map((rate) => (
                    <SelectItem key={rate} value={rate}>
                      {rate}x speed
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <div className="text-sm">
                <p className="text-foreground font-medium flex items-center gap-1">
                  <Volume2 className="w-4 h-4 text-cyan-300" />
                  Autoplay on dashboard open
                </p>
                <p className="text-xs text-muted-foreground">If browser blocks autoplay, click Play Brief once to grant permission.</p>
              </div>
              <Switch checked={autoPlayEnabled} onCheckedChange={setAutoPlayEnabled} />
            </div>
          </div>
        )}

        {normalizedLedger.length > 0 && (
          <div className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">Autonomous Actions While You Were Away</p>
              {ledgerNeedsApproval.length > 0 ? (
                <Button type="button" variant="outline" size="sm" onClick={approveAllPending}>
                  Approve All Pending
                </Button>
              ) : null}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {normalizedLedger.map((item) => {
                const approved = item.status === "needs_approval" && approvalStatusMap[item.id] === "approved";
                const liveStatus = approved ? "completed" : item.status;
                return (
                <div key={item.id} className="rounded border border-border/40 px-2 py-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{item.timeLabel} · {item.portal}</span>
                    <span className={statusToneClass[liveStatus]}>
                      {statusLabel[liveStatus]}
                    </span>
                  </div>
                  <p className="text-foreground mt-1">{item.action}</p>
                  {item.approvalTitle ? (
                    <p className="text-amber-300 mt-1">Approval: {item.approvalTitle}</p>
                  ) : null}
                  {item.status === "needs_approval" && !approved ? (
                    <div className="mt-2 flex gap-2">
                      <Button type="button" size="sm" className="h-7 px-2 text-[11px]" onClick={openReviewPage}>
                        Open Review & Approve
                      </Button>
                    </div>
                  ) : null}
                  {approved ? (
                    <p className="text-emerald-300 mt-2">Approved by CA and marked complete.</p>
                  ) : null}
                </div>
              )})}
            </div>
          </div>
        )}
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agent Work Review</DialogTitle>
              <DialogDescription>
                Review what the autonomous agent executed for this dashboard owner, then approve pending items.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border border-border/50 bg-background/30 p-3">
                <p className="text-sm font-medium text-foreground mb-2">Agent Scope for {roleLabel}</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {roleScope.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Select value={reviewStatusFilter} onValueChange={(value: "all" | "completed" | "queued" | "needs_approval") => setReviewStatusFilter(value)}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Status Filter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="needs_approval">Needs Approval</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reviewPortalFilter} onValueChange={(value) => setReviewPortalFilter(value)}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Portal Filter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Portals</SelectItem>
                    {reviewPortals.map((portal) => (
                      <SelectItem key={portal} value={portal}>{portal}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={approveAllPending} disabled={ledgerNeedsApproval.length === 0}>
                  Approve All Pending ({ledgerNeedsApproval.length})
                </Button>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={openReviewPage}>Open Full Review Page</Button>
              </div>
              <div className="space-y-2">
                {reviewedLedgerRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground rounded border border-border/40 p-3">No actions match current review filters.</p>
                ) : (
                  reviewedLedgerRows.map((item) => (
                    <div key={item.id} className="rounded border border-border/40 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-muted-foreground">{item.timeLabel} · {item.portal}</p>
                        <span className={statusToneClass[item.liveStatus]}>{statusLabel[item.liveStatus]}</span>
                      </div>
                      <p className="text-foreground mt-1">{item.action}</p>
                      {item.approvalTitle ? <p className="text-amber-300 mt-1">Approval: {item.approvalTitle}</p> : null}
                      {item.liveStatus === "needs_approval" ? (
                        <div className="mt-2">
                          <Button type="button" size="sm" onClick={() => approveItem(item.id)}>Approve & Mark Complete</Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AIVoiceBriefAgent;
