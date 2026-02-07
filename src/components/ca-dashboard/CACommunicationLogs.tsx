import { motion } from "framer-motion";
import { MessageSquare, Mail, Bell, ArrowUpRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const demoLogs = [
  {
    type: "message",
    icon: MessageSquare,
    content: "Acme Technologies: Requested clarification on MGT-7 filing requirements",
    timestamp: "2 hours ago",
    status: "unread",
  },
  {
    type: "confirmation",
    icon: Mail,
    content: "Filing Confirmation: GST-3B for DataSync Analytics submitted successfully",
    timestamp: "5 hours ago",
    status: "read",
  },
  {
    type: "reminder",
    icon: Bell,
    content: "Reminder sent to GlobalTrade India for pending bank statements",
    timestamp: "1 day ago",
    status: "read",
  },
  {
    type: "escalation",
    icon: ArrowUpRight,
    content: "Escalation: Director KYC delay for DataSync Analytics escalated to admin",
    timestamp: "2 days ago",
    status: "read",
  },
  {
    type: "message",
    icon: MessageSquare,
    content: "SecurePay Solutions: Approved RBI compliance certificate draft",
    timestamp: "3 days ago",
    status: "read",
  },
];

const typeColors: Record<string, string> = {
  message: "text-blue-400 bg-blue-500/10",
  confirmation: "text-green-400 bg-green-500/10",
  reminder: "text-yellow-400 bg-yellow-500/10",
  escalation: "text-orange-400 bg-orange-500/10",
};

const CACommunicationLogs = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Communication & Logs</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          All compliance-related communication and actions are recorded below.
        </p>
      </div>

      <div className="space-y-3">
        {demoLogs.map((log, index) => {
          const Icon = log.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-border/30 ${
                log.status === "unread" ? "border-l-2 border-l-primary" : ""
              }`}
            >
              <div className={`p-2 rounded-lg ${typeColors[log.type]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{log.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                  {log.status === "unread" && (
                    <Badge className="bg-primary/20 text-primary text-xs">New</Badge>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CACommunicationLogs;
