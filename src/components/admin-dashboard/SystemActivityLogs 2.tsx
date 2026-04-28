import { motion } from "framer-motion";
import { History, User, Clock, ArrowRightLeft, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const demoLogs = [
  {
    user: "Priya Sharma",
    role: "CA",
    action: "Filed GST-3B for Acme Technologies",
    timestamp: "Jan 25, 2026 14:32",
    beforeState: "Pending",
    afterState: "Filed",
  },
  {
    user: "Admin System",
    role: "System",
    action: "Auto-reminder sent for overdue TDS return",
    timestamp: "Jan 25, 2026 09:00",
    beforeState: "-",
    afterState: "Reminder Sent",
  },
  {
    user: "Rahul Verma",
    role: "CA",
    action: "Uploaded audit documents for GlobalTrade India",
    timestamp: "Jan 24, 2026 16:45",
    beforeState: "Missing",
    afterState: "Uploaded",
  },
  {
    user: "Super Admin",
    role: "Admin",
    action: "Updated scoring weight for Filing Compliance",
    timestamp: "Jan 24, 2026 11:20",
    beforeState: "30%",
    afterState: "35%",
  },
  {
    user: "Anita Patel",
    role: "CA",
    action: "Marked RBI certificate as verified",
    timestamp: "Jan 23, 2026 15:10",
    beforeState: "Under Review",
    afterState: "Verified",
  },
];

const roleColors: Record<string, string> = {
  CA: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  System: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const SystemActivityLogs = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">System Activity & Immutable Logs</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Track all actions taken across the platform.
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">User</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Role</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Action</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Timestamp</TableHead>
              <TableHead className="text-muted-foreground font-semibold">State Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoLogs.map((log, index) => (
              <TableRow 
                key={index}
                className="hover:bg-muted/20 transition-colors"
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {log.user}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${roleColors[log.role]} border text-xs`}>
                    {log.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground">{log.action}</TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.timestamp}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{log.beforeState}</span>
                    <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                    <span className="text-green-400">{log.afterState}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default SystemActivityLogs;
