import { motion } from "framer-motion";
import { Clock, AlertTriangle, CheckCircle2, Loader2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ComplianceTask {
  id: string;
  title: string;
  regulator: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'under_review' | 'completed' | 'overdue';
  dueDate: string;
}

interface ComplianceTasksTableProps {
  tasks: ComplianceTask[];
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  high: { label: "High", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  medium: { label: "Medium", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  low: { label: "Low", className: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Loader2, className: "text-blue-400" },
  under_review: { label: "Under Review", icon: Eye, className: "text-yellow-400" },
  completed: { label: "Completed", icon: CheckCircle2, className: "text-green-400" },
  overdue: { label: "Overdue", icon: AlertTriangle, className: "text-red-400" },
};

const ComplianceTasksTable = ({ tasks }: ComplianceTasksTableProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Active Compliance Tasks</h2>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          {tasks.length} Active
        </Badge>
      </div>
      
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Task</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Regulator</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Priority</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task, index) => {
              const priority = priorityConfig[task.priority];
              const status = statusConfig[task.status];
              const StatusIcon = status.icon;
              
              return (
                <TableRow 
                  key={task.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <TableCell className="font-medium text-foreground">{task.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-card/50 border-border/50">
                      {task.regulator}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${priority.className} border`}>
                      {priority.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-2 ${status.className}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm">{status.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{task.dueDate}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default ComplianceTasksTable;
