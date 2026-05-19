import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Clock, CheckCircle, AlertCircle, MessageSquare,
  ChevronRight, Zap, Eye, ThumbsUp, ThumbsDown, RotateCcw, X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { LawyerReviewRequest } from "@/hooks/useInhouseLawyerData";
import { useUpdateReviewStatus } from "@/hooks/useInhouseLawyerData";
import DraftReviewModal from "./DraftReviewModal";

const PRIORITY_CONFIG = {
  low:    { label: "Low",    cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  normal: { label: "Normal", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  high:   { label: "High",   cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  urgent: { label: "Urgent", cls: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" },
};

const STATUS_CONFIG = {
  pending:           { label: "Pending Review",     cls: "bg-amber-500/20 text-amber-400",  icon: Clock },
  in_review:         { label: "In Review",          cls: "bg-blue-500/20 text-blue-400",    icon: Eye },
  approved:          { label: "Approved",           cls: "bg-green-500/20 text-green-400",  icon: CheckCircle },
  changes_requested: { label: "Changes Requested",  cls: "bg-orange-500/20 text-orange-400",icon: RotateCcw },
  rejected:          { label: "Rejected",           cls: "bg-red-500/20 text-red-400",      icon: X },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  "gst-reply": "GST Reply",
  "income-tax": "Income Tax Notice",
  "show-cause": "Show Cause Notice",
  "contract-review": "Contract Review",
  "compliance-report": "Compliance Report",
  "advisory": "Legal Advisory",
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface ReviewCardProps {
  request: LawyerReviewRequest;
  companyId: string;
}

const ReviewCard = ({ request, companyId }: ReviewCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState(request.lawyer_comments || "");
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const updateStatus = useUpdateReviewStatus();

  const priority = PRIORITY_CONFIG[request.priority];
  const statusCfg = STATUS_CONFIG[request.review_status];
  const StatusIcon = statusCfg.icon;
  const docLabel = DOC_TYPE_LABELS[request.draft?.document_type || ""] || request.draft?.document_type || "Document";
  const isPending = request.review_status === "pending" || request.review_status === "in_review";

  const handleAction = async (status: LawyerReviewRequest["review_status"]) => {
    if (!request.draft_run_id) return;
    try {
      await updateStatus.mutateAsync({
        requestId: request.id,
        draftRunId: request.draft_run_id,
        reviewStatus: status,
        lawyerComments: comment,
        companyId,
      });
      toast({
        title: status === "approved" ? "✅ Draft Approved" :
               status === "rejected" ? "❌ Draft Rejected" : "🔄 Changes Requested",
        description: "The CA has been notified of your decision.",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        layout
      >
        <Card className="bg-[#0D1425] border border-indigo-500/10 hover:border-indigo-500/30 transition-all duration-200">
          <CardContent className="p-5">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-sm truncate">{docLabel}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mode: {request.draft?.draft_mode || "—"} · {timeAgo(request.created_at)}
                  </p>
                  {request.ca_notes && (
                    <p className="text-xs text-indigo-300 mt-1 italic">"{request.ca_notes}"</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge className={`${statusCfg.cls} border text-xs px-2 py-0.5 flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </Badge>
                <Badge className={`${priority.cls} border text-xs px-2 py-0.5`}>
                  {priority.label}
                </Badge>
              </div>
            </div>

            {/* Draft Preview */}
            {request.draft?.draft_content && (
              <div className="bg-slate-800/50 rounded-lg p-3 mb-3 border border-slate-700/50">
                <p className="text-xs text-slate-300 line-clamp-3 font-mono leading-relaxed">
                  {request.draft.draft_content.slice(0, 300)}
                  {request.draft.draft_content.length > 300 && "…"}
                </p>
              </div>
            )}

            {/* Actions Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs"
                onClick={() => setShowModal(true)}
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Full Review
              </Button>

              {isPending && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-400 hover:bg-slate-800 text-xs"
                  onClick={() => setExpanded(!expanded)}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                  Add Comment
                  <ChevronRight className={`w-3.5 h-3.5 ml-1 transition-transform ${expanded ? "rotate-90" : ""}`} />
                </Button>
              )}

              {isPending && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-xs"
                    onClick={() => handleAction("approved")}
                    disabled={updateStatus.isPending}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs"
                    onClick={() => handleAction("changes_requested")}
                    disabled={updateStatus.isPending}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Changes
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs"
                    onClick={() => handleAction("rejected")}
                    disabled={updateStatus.isPending}
                  >
                    <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </div>

            {/* Expandable Comment Box */}
            <AnimatePresence>
              {expanded && isPending && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your review comments for the CA…"
                    className="bg-slate-800 border-slate-700 text-white text-xs resize-none"
                    rows={3}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lawyer comments (read-only if resolved) */}
            {!isPending && request.lawyer_comments && (
              <div className="mt-3 bg-slate-800/50 rounded p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1 font-semibold">Your Review Comments:</p>
                <p className="text-xs text-slate-300">{request.lawyer_comments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {showModal && request.draft && (
        <DraftReviewModal
          request={request}
          companyId={companyId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

interface DraftReviewInboxProps {
  requests: LawyerReviewRequest[];
  companyId: string;
  isLoading: boolean;
}

const DraftReviewInbox = ({ requests, companyId, isLoading }: DraftReviewInboxProps) => {
  const [filter, setFilter] = useState<string>("all");

  const FILTERS = [
    { id: "all",               label: "All",              count: requests.length },
    { id: "pending",           label: "Pending",          count: requests.filter(r => r.review_status === "pending").length },
    { id: "in_review",         label: "In Review",        count: requests.filter(r => r.review_status === "in_review").length },
    { id: "approved",          label: "Approved",         count: requests.filter(r => r.review_status === "approved").length },
    { id: "changes_requested", label: "Changes Req.",     count: requests.filter(r => r.review_status === "changes_requested").length },
    { id: "rejected",          label: "Rejected",         count: requests.filter(r => r.review_status === "rejected").length },
  ];

  const filtered = filter === "all" ? requests : requests.filter(r => r.review_status === filter);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-36 bg-slate-800/50 rounded-xl animate-pulse border border-slate-700/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.id
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === f.id ? "bg-white/20" : "bg-slate-700"
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-indigo-400/50" />
          </div>
          <p className="text-slate-400 text-sm font-medium">No drafts in this category</p>
          <p className="text-slate-500 text-xs mt-1">
            {filter === "pending" ? "All caught up! No pending reviews." : "Nothing here yet."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <ReviewCard key={req.id} request={req} companyId={companyId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftReviewInbox;
