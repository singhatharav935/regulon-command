import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const demoChangeLogs = [
  {
    company: "Acme Technologies",
    previousScore: 82,
    currentScore: 87,
    change: "+5%",
    reason: "Annual return filed successfully",
    actionBy: "CA",
  },
  {
    company: "GlobalTrade India",
    previousScore: 68,
    currentScore: 62,
    change: "-6%",
    reason: "GST filing delayed beyond due date",
    actionBy: "Client Delay",
  },
  {
    company: "SecurePay Solutions",
    previousScore: 91,
    currentScore: 91,
    change: "0%",
    reason: "No changes in compliance status",
    actionBy: "-",
  },
  {
    company: "DataSync Analytics",
    previousScore: 70,
    currentScore: 74,
    change: "+4%",
    reason: "TDS return verification completed",
    actionBy: "CA",
  },
];

const ComplianceChangeLog = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground mb-2">Compliance Health Change Log</h2>
        <p className="text-sm text-muted-foreground">
          Track how compliance health changed due to actions taken or delays.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Previous</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Current</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Change</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Reason</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Action By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoChangeLogs.map((log, index) => {
              const isPositive = log.currentScore > log.previousScore;
              const isNegative = log.currentScore < log.previousScore;
              
              return (
                <TableRow 
                  key={index}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">{log.company}</TableCell>
                  <TableCell className="text-muted-foreground">{log.previousScore}%</TableCell>
                  <TableCell className="text-foreground font-medium">{log.currentScore}%</TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${
                      isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-muted-foreground"
                    }`}>
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : 
                       isNegative ? <TrendingDown className="w-4 h-4" /> : 
                       <Minus className="w-4 h-4" />}
                      {log.change}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      log.actionBy === "CA" 
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : log.actionBy === "Client Delay"
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : "bg-muted"
                    }>
                      {log.actionBy}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default ComplianceChangeLog;
