import { motion } from "framer-motion";
import { Clock, AlertTriangle, Send, ArrowUpRight } from "lucide-react";
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

const demoDependencies = [
  { 
    company: "GlobalTrade India", 
    document: "Bank Statements (Q4)",
    lastReminder: "2 days ago",
    delay: "5 days",
    escalation: "High",
  },
  { 
    company: "DataSync Analytics", 
    document: "Director KYC Documents",
    lastReminder: "1 week ago",
    delay: "12 days",
    escalation: "Critical",
  },
  { 
    company: "Acme Technologies", 
    document: "Board Resolution Copy",
    lastReminder: "3 days ago",
    delay: "3 days",
    escalation: "Medium",
  },
];

const escalationColors: Record<string, string> = {
  Low: "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const ClientDependencyTracker = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground mb-2">Client Dependency Tracker</h2>
        <p className="text-sm text-muted-foreground">
          These tasks are blocked due to missing inputs or confirmations from clients.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Required Document / Input</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Last Reminder</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Delay</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Escalation</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoDependencies.map((dep, index) => (
              <TableRow 
                key={index}
                className="hover:bg-muted/20 transition-colors"
              >
                <TableCell className="font-medium text-foreground">{dep.company}</TableCell>
                <TableCell className="text-foreground">{dep.document}</TableCell>
                <TableCell className="text-muted-foreground">{dep.lastReminder}</TableCell>
                <TableCell className="text-red-400">{dep.delay}</TableCell>
                <TableCell>
                  <Badge className={`${escalationColors[dep.escalation]} border`}>
                    {dep.escalation}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Send className="w-3 h-3 mr-1" />
                      Remind
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-orange-400">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      Escalate
                    </Button>
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

export default ClientDependencyTracker;
