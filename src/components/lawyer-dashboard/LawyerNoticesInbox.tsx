import { motion } from "framer-motion";
import { Bell, Clock, CheckCircle, AlertCircle, MessageSquare, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { LawyerNotice } from "@/hooks/useInhouseLawyerData";

const STATUS_CONFIG = {
  pending:   { label: "Pending",    cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",  icon: AlertCircle },
  responded: { label: "Responded",  cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",    icon: MessageSquare },
  resolved:  { label: "Resolved",   cls: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  escalated: { label: "Escalated",  cls: "bg-red-500/20 text-red-400 border-red-500/30",       icon: XCircle },
};

interface LawyerNoticesInboxProps {
  notices: LawyerNotice[];
  companyId: string;
}

export default function LawyerNoticesInbox({ notices, companyId }: LawyerNoticesInboxProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatus = async (id: string, status: LawyerNotice["status"]) => {
    const { error } = await supabase.from("legal_notices").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notice updated", description: `Status set to ${status}.` });
      queryClient.invalidateQueries({ queryKey: ["lawyer-notices", companyId] });
    }
  };

  const pending = notices.filter(n => n.status === "pending");
  const others = notices.filter(n => n.status !== "pending");

  const renderNotice = (n: LawyerNotice, i: number) => {
    const statusCfg = STATUS_CONFIG[n.status];
    const StatusIcon = statusCfg.icon;
    const daysUntilDue = n.response_due_date
      ? Math.ceil((new Date(n.response_due_date).getTime() - Date.now()) / 86400000)
      : null;
    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
    const isUrgent = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 5;

    return (
      <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
        <Card className="border-0 hover:border hover:border-indigo-500/20 transition-all" style={{ background: "#0D1425" }}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">{n.subject}</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  From: {n.issued_by} · {n.notice_type}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge className={`${statusCfg.cls} border text-xs flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </Badge>
                {n.response_due_date && (
                  <Badge className={`border text-xs ${
                    isOverdue ? "bg-red-500/30 text-red-300 border-red-500/40" :
                    isUrgent ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                    "bg-slate-700 text-slate-400 border-slate-600"
                  }`}>
                    {isOverdue ? `Overdue ${Math.abs(daysUntilDue!)}d` :
                     daysUntilDue === 0 ? "Due today" :
                     `Due in ${daysUntilDue}d`}
                  </Badge>
                )}
              </div>
            </div>

            {n.content && (
              <p className="text-slate-400 text-xs mb-3 line-clamp-2 leading-relaxed">{n.content}</p>
            )}

            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-xs">
                Received: {new Date(n.notice_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {n.response_due_date && ` · Due: ${new Date(n.response_due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
              </p>

              {n.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm"
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs"
                    onClick={() => updateStatus(n.id, "responded")}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Responded
                  </Button>
                  <Button size="sm"
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs"
                    onClick={() => updateStatus(n.id, "escalated")}
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Escalate
                  </Button>
                </div>
              )}
              {n.status === "responded" && (
                <Button size="sm"
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 text-xs"
                  onClick={() => updateStatus(n.id, "resolved")}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Mark Resolved
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {notices.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bell className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">No legal notices</p>
          <p className="text-slate-500 text-xs mt-1">Legal and regulatory notices will appear here</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Requires Action ({pending.length})</p>
              </div>
              <div className="space-y-3">{pending.map((n, i) => renderNotice(n, i))}</div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Resolved / Past ({others.length})</p>
              </div>
              <div className="space-y-3 opacity-70">{others.map((n, i) => renderNotice(n, i))}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
