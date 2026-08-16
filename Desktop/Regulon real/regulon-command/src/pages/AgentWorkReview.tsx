import { useEffect, useMemo, useState } from "react";
import { isCABackendConfigured } from "@/lib/ca-backend-guard";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { workspaceBackendRequest } from "@/lib/workspace-backend";

type ReviewItem = {
  id: string;
  timeLabel: string;
  portal: string;
  action: string;
  status: "completed" | "queued" | "needs_approval";
  approvalTitle?: string;
  generatedWork?: string;
};

type ReviewPayload = {
  dashboardId: string;
  actorName: string;
  roleLabel: string;
  generatedAt: string;
  items: ReviewItem[];
};

type LiveDraftReview = {
  id: string;
  status: "generated" | "under_review" | "approved" | "signed_off";
  document_type: string;
  draft_mode: string;
  draft_content: string;
  created_at: string;
  company_id: string | null;
};

const statusToneClass = {
  completed: "border-emerald-500/40 text-emerald-300",
  queued: "border-blue-500/40 text-blue-300",
  needs_approval: "border-amber-500/40 text-amber-300",
} as const;

const AgentWorkReview = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const dashboardId = params.get("dashboardId") || "demo-ca";
  const draftRunId = params.get("draftRunId");
  const returnPath = params.get("returnPath") || "/app";
  const reviewStorageKey = `sannidh:agent-work-review:${dashboardId}`;
  const approvalStorageKey = `sannidh:voice-agent:approval-status:${dashboardId}`;
  const editsStorageKey = `sannidh:agent-work-review:edits:${dashboardId}`;

  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [approvalMap, setApprovalMap] = useState<Record<string, "pending" | "approved">>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "queued" | "needs_approval">("all");
  const [portalFilter, setPortalFilter] = useState<string>("all");
  const [liveDraft, setLiveDraft] = useState<LiveDraftReview | null>(null);
  const [liveAuditEvents, setLiveAuditEvents] = useState<Array<{ id: string; event_type: string; created_at: string }>>([]);
  const [liveVersions, setLiveVersions] = useState<Array<{ id: string; version_number: number; content: string; created_at: string }>>([]);
  const [loadingLiveDraft, setLoadingLiveDraft] = useState(false);
  const [savingLiveDraft, setSavingLiveDraft] = useState(false);
  const [liveEdit, setLiveEdit] = useState("");
  const isLiveReview = Boolean(draftRunId);
  const [agentLogs, setAgentLogs] = useState<Array<{
    id: string; job_id: string; task_type: string; client_name: string;
    status: string; priority: string; result_summary: string; created_at: string;
  }>>([]);
  const [loadingAgentLogs, setLoadingAgentLogs] = useState(false);

  // Fetch real agent logs from production backend
  const loadAgentLogs = async () => {
    if (!isCABackendConfigured()) {
      setLoadingAgentLogs(false);
      return;
    }
    setLoadingAgentLogs(true);
    try {
      const CA_API = (import.meta.env.VITE_CA_API_BASE_URL as string);
      const token = user?.id ? localStorage.getItem(`sb-${user.id}-auth-token`) : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${CA_API}/api/v1/ca/agent/logs?limit=50`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAgentLogs(data.data || []);
      }
    } catch (e) {
      console.log('Agent logs fetch skipped:', e);
    } finally {
      setLoadingAgentLogs(false);
    }
  };

  const loadLiveDraft = async () => {
    if (!draftRunId) return;
    setLoadingLiveDraft(true);
    try {
      const data = await workspaceBackendRequest<{
        run: LiveDraftReview | null;
        versions: Array<{ id: string; version_number: number; content: string; created_at: string }>;
        events: Array<{ id: string; event_type: string; created_at: string }>;
      }>(`/draft-review/${draftRunId}`);
      setLiveDraft((data?.run ?? null) as LiveDraftReview | null);
      setLiveEdit((data?.run?.draft_content ?? "") as string);
      setLiveVersions((data?.versions ?? []) as Array<{ id: string; version_number: number; content: string; created_at: string }>);
      setLiveAuditEvents((data?.events ?? []) as Array<{ id: string; event_type: string; created_at: string }>);
    } catch (error) {
      setLiveDraft(null);
      setLiveVersions([]);
      setLiveAuditEvents([]);
      toast({
        title: "Failed to load live review",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setLoadingLiveDraft(false);
    }
  };

  const saveLiveReview = async (nextStatus?: LiveDraftReview["status"]) => {
    if (!draftRunId || !liveDraft || !user?.id) return;
    setSavingLiveDraft(true);
    try {
      const targetStatus = nextStatus ?? liveDraft.status;
      const eventType =
        nextStatus === "approved"
          ? "legal_review_approved"
          : nextStatus === "signed_off"
            ? "legal_final_sign_off"
            : "legal_review_saved";
      const data = await workspaceBackendRequest<{
        run: LiveDraftReview | null;
        versions: Array<{ id: string; version_number: number; content: string; created_at: string }>;
        events: Array<{ id: string; event_type: string; created_at: string }>;
      }>(`/draft-review/${draftRunId}/save`, {
        method: "POST",
        body: JSON.stringify({
          content: liveEdit,
          next_status: targetStatus,
          event_type: eventType,
        }),
      });

      toast({
        title: nextStatus ? "Review status updated" : "Review edits saved",
        description: nextStatus ? `Draft moved to ${targetStatus}.` : "A new review version was saved.",
      });
      setLiveDraft((data?.run ?? null) as LiveDraftReview | null);
      setLiveEdit((data?.run?.draft_content ?? "") as string);
      setLiveVersions((data?.versions ?? []) as Array<{ id: string; version_number: number; content: string; created_at: string }>);
      setLiveAuditEvents((data?.events ?? []) as Array<{ id: string; event_type: string; created_at: string }>);
    } catch (error) {
      toast({
        title: "Failed to save live review",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setSavingLiveDraft(false);
    }
  };

  useEffect(() => {
    if (isLiveReview) return;
    if (typeof window === "undefined") return;
    const rawPayload = window.localStorage.getItem(reviewStorageKey);
    if (rawPayload) {
      try {
        setPayload(JSON.parse(rawPayload) as ReviewPayload);
      } catch {
        setPayload(null);
      }
    }
    const rawApproval = window.localStorage.getItem(approvalStorageKey);
    if (rawApproval) {
      try {
        setApprovalMap(JSON.parse(rawApproval) as Record<string, "pending" | "approved">);
      } catch {
        setApprovalMap({});
      }
    }
    const rawEdits = window.localStorage.getItem(editsStorageKey);
    if (rawEdits) {
      try {
        setEdits(JSON.parse(rawEdits) as Record<string, string>);
      } catch {
        setEdits({});
      }
    }
  }, [reviewStorageKey, approvalStorageKey, editsStorageKey, isLiveReview]);

  useEffect(() => {
    if (isLiveReview) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(approvalStorageKey, JSON.stringify(approvalMap));
  }, [approvalMap, approvalStorageKey, isLiveReview]);

  useEffect(() => {
    if (isLiveReview) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(editsStorageKey, JSON.stringify(edits));
  }, [edits, editsStorageKey, isLiveReview]);

  useEffect(() => {
    if (!isLiveReview) return;
    void loadLiveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveReview, draftRunId]);

  // Also load live agent logs if not in live review mode
  useEffect(() => {
    if (!isLiveReview) void loadAgentLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveReview]);

  const portals = useMemo(
    () => Array.from(new Set((payload?.items || []).map((item) => item.portal))).filter(Boolean),
    [payload],
  );
  const filteredItems = useMemo(() => {
    if (!payload) return [];
    return payload.items
      .map((item) => ({
        ...item,
        liveStatus: item.status === "needs_approval" && approvalMap[item.id] === "approved"
          ? "completed"
          : item.status,
      }))
      .filter((item) => (statusFilter === "all" ? true : item.liveStatus === statusFilter))
      .filter((item) => (portalFilter === "all" ? true : item.portal === portalFilter));
  }, [payload, approvalMap, statusFilter, portalFilter]);

  const approveItem = (id: string) => {
    setApprovalMap((prev) => ({ ...prev, [id]: "approved" }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-10">
        <div className="container mx-auto px-4 max-w-6xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">Agent Work Review</h1>
              <p className="text-sm text-muted-foreground">
                Review generated work, edit manually, then approve.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(returnPath)}>Back to Dashboard</Button>
          </div>

          {isLiveReview ? (
            loadingLiveDraft ? (
              <Card className="glass-card border-border/40">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Loading live draft review...
                </CardContent>
              </Card>
            ) : !liveDraft ? (
              <Card className="glass-card border-border/40">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No live draft found for this review request.
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="glass-card border-border/40">
                  <CardHeader>
                    <CardTitle>{liveDraft.document_type} · {liveDraft.draft_mode}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className={statusToneClass[liveDraft.status === "approved" || liveDraft.status === "signed_off" ? "completed" : "needs_approval"]}>
                        {liveDraft.status}
                      </Badge>
                      <span>Created {new Date(liveDraft.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" disabled={savingLiveDraft} onClick={() => void saveLiveReview()}>
                        Save Review Version
                      </Button>
                      <Button
                        variant="outline"
                        disabled={savingLiveDraft || liveDraft.status !== "under_review"}
                        onClick={() => void saveLiveReview("approved")}
                      >
                        Mark Approved
                      </Button>
                      <Button
                        disabled={savingLiveDraft || liveDraft.status !== "approved"}
                        onClick={() => void saveLiveReview("signed_off")}
                      >
                        Final Sign-off
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-border/40">
                  <CardHeader>
                    <CardTitle>Live Draft Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={liveEdit}
                      onChange={(e) => setLiveEdit(e.target.value)}
                      className="min-h-[360px] bg-background/40"
                      placeholder="Edit draft content before approval..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Every save writes a new backend version and audit event for this draft run.
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="glass-card border-border/40">
                    <CardHeader>
                      <CardTitle>Version History</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {liveVersions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No saved versions yet.</p>
                      ) : liveVersions.map((version) => (
                        <div key={version.id} className="flex items-center justify-between gap-2 rounded border border-border/40 p-3">
                          <div className="text-xs text-muted-foreground">
                            <p className="text-foreground font-medium">Version {version.version_number}</p>
                            <p>{new Date(version.created_at).toLocaleString()}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => setLiveEdit(version.content)}>
                            Load
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-border/40">
                    <CardHeader>
                      <CardTitle>Audit Trail</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {liveAuditEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No audit events yet.</p>
                      ) : liveAuditEvents.map((event) => (
                        <div key={event.id} className="rounded border border-border/40 p-3 text-xs text-muted-foreground">
                          <p className="text-foreground font-medium">{event.event_type}</p>
                          <p>{new Date(event.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            )
          ) : !payload ? (
            <div className="space-y-4">
              <Card className="glass-card border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    Live Agent Work Output
                    <Badge variant="outline" className="text-xs border-green-500/40 text-green-400">
                      {loadingAgentLogs ? 'Loading...' : agentLogs.length + ' jobs from backend'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Real-time AI agent activity from the production backend. Review and approve tasks here.
                  </p>
                </CardHeader>
              </Card>
              {loadingAgentLogs ? (
                <Card className="glass-card border-border/40">
                  <CardContent className="p-6 text-sm text-muted-foreground">Loading agent logs from backend...</CardContent>
                </Card>
              ) : agentLogs.length === 0 ? (
                <Card className="glass-card border-border/40">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    No agent jobs found yet. Deploy an AI agent from the CA Dashboard to see work here.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {agentLogs.map((log) => (
                    <Card key={log.id} className="glass-card border-border/40">
                      <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <CardTitle className="text-base">{log.task_type.replace(/_/g, ' ')} · {log.client_name || 'N/A'}</CardTitle>
                          <Badge variant="outline" className={
                            log.status === 'completed' ? 'border-emerald-500/40 text-emerald-300' :
                            log.status === 'queued' ? 'border-blue-500/40 text-blue-300' :
                            'border-amber-500/40 text-amber-300'
                          }>{log.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Job: {log.job_id} · Priority: {log.priority} · {new Date(log.created_at).toLocaleString()}
                        </p>
                      </CardHeader>
                      {log.result_summary && (
                        <CardContent>
                          <p className="text-sm bg-background/40 rounded p-3 border border-border/40">{log.result_summary}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <Card className="glass-card border-border/40">
                <CardHeader>
                  <CardTitle>{payload.actorName} · {payload.roleLabel}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select value={statusFilter} onValueChange={(v: "all" | "completed" | "queued" | "needs_approval") => setStatusFilter(v)}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="needs_approval">Needs Approval</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={portalFilter} onValueChange={setPortalFilter}>
                    <SelectTrigger><SelectValue placeholder="Portal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Portals</SelectItem>
                      {portals.map((portal) => <SelectItem key={portal} value={portal}>{portal}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      const next = { ...approvalMap };
                      (payload.items || []).forEach((item) => {
                        if (item.status === "needs_approval") next[item.id] = "approved";
                      });
                      setApprovalMap(next);
                    }}
                  >
                    Approve All Pending
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const liveStatus = item.status === "needs_approval" && approvalMap[item.id] === "approved" ? "completed" : item.status;
                  const textValue = edits[item.id] ?? item.generatedWork ?? "";
                  return (
                    <Card key={item.id} className="glass-card border-border/40">
                      <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <CardTitle className="text-base">{item.portal} · {item.timeLabel}</CardTitle>
                          <Badge variant="outline" className={statusToneClass[liveStatus]}>{liveStatus.replace("_", " ")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.action}</p>
                        {item.approvalTitle ? <p className="text-sm text-amber-300">{item.approvalTitle}</p> : null}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Textarea
                          value={textValue}
                          onChange={(e) => setEdits((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          className="min-h-[180px] bg-background/40"
                          placeholder="Edit generated work before approval..."
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => setEdits((prev) => ({ ...prev, [item.id]: item.generatedWork || "" }))}>
                            Reset To Agent Version
                          </Button>
                          {liveStatus === "needs_approval" ? (
                            <Button onClick={() => approveItem(item.id)}>Approve This Work</Button>
                          ) : (
                            <Button variant="secondary" disabled>Already Approved/Completed</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AgentWorkReview;
