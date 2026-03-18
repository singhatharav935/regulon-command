import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

const statusToneClass = {
  completed: "border-emerald-500/40 text-emerald-300",
  queued: "border-blue-500/40 text-blue-300",
  needs_approval: "border-amber-500/40 text-amber-300",
} as const;

const AgentWorkReview = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dashboardId = params.get("dashboardId") || "demo-ca";
  const reviewStorageKey = `regulon:agent-work-review:${dashboardId}`;
  const approvalStorageKey = `regulon:voice-agent:approval-status:${dashboardId}`;
  const editsStorageKey = `regulon:agent-work-review:edits:${dashboardId}`;

  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [approvalMap, setApprovalMap] = useState<Record<string, "pending" | "approved">>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "queued" | "needs_approval">("all");
  const [portalFilter, setPortalFilter] = useState<string>("all");

  useEffect(() => {
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
  }, [reviewStorageKey, approvalStorageKey, editsStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(approvalStorageKey, JSON.stringify(approvalMap));
  }, [approvalMap, approvalStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(editsStorageKey, JSON.stringify(edits));
  }, [edits, editsStorageKey]);

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
            <Button variant="outline" onClick={() => navigate(-1)}>Back to Dashboard</Button>
          </div>

          {!payload ? (
            <Card className="glass-card border-border/40">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No agent work found for this dashboard yet. Generate or load dashboard actions first.
              </CardContent>
            </Card>
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
