import { motion } from "framer-motion";
import { FileText, AlertTriangle, CheckCircle2, Send, Eye } from "lucide-react";
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

const demoTasks = [
  { 
    company: "Acme Technologies", 
    task: "Annual Return Filing (MGT-7)",
    authority: "MCA",
    dueDate: "Feb 15, 2026",
    penalty: "₹1,00,000",
    dependency: "Complete",
  },
  { 
    company: "GlobalTrade India", 
    task: "GST-3B January Filing",
    authority: "GST",
    dueDate: "Feb 20, 2026",
    penalty: "₹10,000/day",
    dependency: "Awaiting Data",
  },
  { 
    company: "SecurePay Solutions", 
    task: "RBI Annual Certificate",
    authority: "RBI",
    dueDate: "Mar 31, 2026",
    penalty: "License Risk",
    dependency: "Complete",
  },
  { 
    company: "DataSync Analytics", 
    task: "TDS Return Q4",
    authority: "Income Tax",
    dueDate: "Jan 31, 2026",
    penalty: "₹200/day",
    dependency: "Pending Verification",
  },
];

const TaskFilingManagement = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground mb-2">Task & Filing Management</h2>
        <p className="text-sm text-muted-foreground">
          The following compliance obligations require your filing, verification, or approval.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Task / Filing</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Authority</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Due Date</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Penalty</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Dependency</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoTasks.map((task, index) => (
              <TableRow 
                key={index}
                className="hover:bg-muted/20 transition-colors"
              >
                <TableCell className="font-medium text-foreground">{task.company}</TableCell>
                <TableCell className="text-foreground">{task.task}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-card/50 border-border/50">
                    {task.authority}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{task.dueDate}</TableCell>
                <TableCell className="text-red-400 text-sm">{task.penalty}</TableCell>
                <TableCell>
                  <Badge className={
                    task.dependency === "Complete" 
                      ? "bg-green-500/20 text-green-400 border-green-500/30" 
                      : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  }>
                    {task.dependency}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2">
                      <Send className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2">
                      <CheckCircle2 className="w-3 h-3" />
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

export default TaskFilingManagement;
