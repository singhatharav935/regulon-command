import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ThumbsUp, ThumbsDown, RotateCcw, FileText, CheckCircle,
  Clock, AlertCircle, Copy, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { LawyerReviewRequest } from "@/hooks/useInhouseLawyerData";
import { useUpdateReviewStatus } from "@/hooks/useInhouseLawyerData";

interface DraftReviewModalProps {
  request: LawyerReviewRequest;
  companyId: string;
  onClose: () => void;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  "gst-reply": "GST Show Cause Reply",
  "income-tax": "Income Tax Notice Reply",
  "show-cause": "Show Cause Notice Reply",
  "contract-review": "Contract Review Opinion",
  "compliance-report": "Compliance Report",
  "advisory": "Legal Advisory",
};

export default function DraftReviewModal({ request, companyId, onClose }: DraftReviewModalProps) {
  const [comment, setComment] = useState(request.lawyer_comments || "");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const updateStatus = useUpdateReviewStatus();

  const isPending = request.review_status === "pending" || request.review_status === "in_review";
  const docLabel = DOC_TYPE_LABELS[request.draft?.document_type || ""] || request.draft?.document_type || "Document";

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
        description: "Decision saved and CA notified.",
      });
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleCopy = () => {
    if (request.draft?.draft_content) {
      navigator.clipboard.writeText(request.draft.draft_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
          style={{ background: "#0A0F1C", border: "1px solid rgba(99,102,241,0.2)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">{docLabel}</h2>
                <p className="text-slate-400 text-xs">
                  Mode: {request.draft?.draft_mode || "—"} ·
                  Submitted {new Date(request.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {request.priority === "urgent" && (
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse text-xs">
                  🔴 URGENT
                </Badge>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Draft Content Panel */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
              {/* CA Notes */}
              {request.ca_notes && (
                <div className="mx-5 mt-4 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <p className="text-indigo-300 text-xs font-semibold mb-1">📝 Note from CA:</p>
                  <p className="text-indigo-200 text-sm italic">{request.ca_notes}</p>
                </div>
              )}

              {/* Draft Text */}
              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Draft Content</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto mx-5 mb-5">
                <div
                  className="text-slate-200 text-sm leading-7 font-mono whitespace-pre-wrap bg-slate-900/60 rounded-xl p-5 border border-slate-700/50 min-h-full"
                  style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                >
                  {request.draft?.draft_content || "No content available."}
                </div>
              </div>
            </div>

            {/* Review Panel */}
            <div className="w-80 flex flex-col bg-slate-900/30">
              <div className="p-5 flex-1 overflow-y-auto space-y-5">
                {/* Current Status */}
                <div>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Status</p>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    request.review_status === "approved" ? "bg-green-500/15 text-green-400" :
                    request.review_status === "rejected" ? "bg-red-500/15 text-red-400" :
                    request.review_status === "changes_requested" ? "bg-amber-500/15 text-amber-400" :
                    "bg-slate-800 text-slate-300"
                  }`}>
                    {request.review_status === "approved" && <CheckCircle className="w-4 h-4" />}
                    {request.review_status === "rejected" && <X className="w-4 h-4" />}
                    {(request.review_status === "pending" || request.review_status === "in_review") && <Clock className="w-4 h-4" />}
                    {request.review_status === "changes_requested" && <AlertCircle className="w-4 h-4" />}
                    {request.review_status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>

                {/* Document Info */}
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Document Details</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Type", value: request.draft?.document_type || "—" },
                      { label: "Mode", value: request.draft?.draft_mode || "—" },
                      { label: "Priority", value: request.priority },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-slate-500">{label}</span>
                        <span className="text-slate-300 capitalize">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Comments */}
                <div className="flex-1">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    {isPending ? "Your Review Comments" : "Review Comments"}
                  </p>
                  {isPending ? (
                    <Textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Add your legal review notes, redlines, or conditions…"
                      className="bg-slate-800 border-slate-700 text-white text-xs resize-none w-full"
                      rows={6}
                    />
                  ) : (
                    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
                      <p className="text-slate-300 text-xs whitespace-pre-wrap">
                        {request.lawyer_comments || "No comments added."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isPending && (
                <div className="p-5 border-t border-slate-800 space-y-2">
                  <Button
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                    onClick={() => handleAction("approved")}
                    disabled={updateStatus.isPending}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve Draft
                  </Button>
                  <Button
                    className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                    onClick={() => handleAction("changes_requested")}
                    disabled={updateStatus.isPending}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                    onClick={() => handleAction("rejected")}
                    disabled={updateStatus.isPending}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Reject Draft
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
