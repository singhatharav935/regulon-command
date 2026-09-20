import { motion } from "framer-motion";
import { Users, Building2, FileText, AlertTriangle, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const demoCAs = [
  {
    name: "Priya Sharma",
    activeClients: 8,
    tasksAssigned: 24,
    tasksDelayed: 2,
    riskIncidents: 1,
    billingStatus: "Active",
  },
  {
    name: "Rahul Verma",
    activeClients: 12,
    tasksAssigned: 36,
    tasksDelayed: 5,
    riskIncidents: 3,
    billingStatus: "Active",
  },
  {
    name: "Anita Patel",
    activeClients: 6,
    tasksAssigned: 18,
    tasksDelayed: 0,
    riskIncidents: 0,
    billingStatus: "Active",
  },
  {
    name: "Vijay Kumar",
    activeClients: 10,
    tasksAssigned: 30,
    tasksDelayed: 4,
    riskIncidents: 2,
    billingStatus: "Past Due",
  },
];

const CAManagementSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">CA Management & Governance</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Monitor CA activity, workload distribution, and compliance effectiveness.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">CA Name</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Active Clients</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Tasks Assigned</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Tasks Delayed</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Risk Incidents</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Billing Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoCAs.map((ca, index) => (
              <TableRow 
                key={index}
                className="hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <TableCell className="font-medium text-foreground">{ca.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">{ca.activeClients}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">{ca.tasksAssigned}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={ca.tasksDelayed > 3 ? "text-red-400" : ca.tasksDelayed > 0 ? "text-yellow-400" : "text-green-400"}>
                    {ca.tasksDelayed}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={ca.riskIncidents > 2 ? "text-red-400" : ca.riskIncidents > 0 ? "text-yellow-400" : "text-green-400"}>
                    {ca.riskIncidents}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={
                    ca.billingStatus === "Active" 
                      ? "bg-green-500/20 text-green-400 border-green-500/30" 
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }>
                    {ca.billingStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default CAManagementSection;
