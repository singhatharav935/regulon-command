import { motion } from "framer-motion";
import { AlertTriangle, Building2, User, Clock, ArrowUpRight } from "lucide-react";
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

const demoRiskCompanies = [
  {
    name: "GlobalTrade India Ltd.",
    industry: "E-Commerce",
    jurisdiction: "Karnataka",
    health: 62,
    riskReason: "Multiple delayed GST filings",
    assignedCA: "Priya Sharma",
    lastActivity: "2 days ago",
  },
  {
    name: "QuickLoan Finance",
    industry: "NBFC",
    jurisdiction: "Maharashtra",
    health: 55,
    riskReason: "RBI compliance certificate overdue",
    assignedCA: "Rahul Verma",
    lastActivity: "1 week ago",
  },
  {
    name: "DataSync Analytics",
    industry: "IT Services",
    jurisdiction: "Tamil Nadu",
    health: 68,
    riskReason: "TDS return pending verification",
    assignedCA: "Anita Patel",
    lastActivity: "3 days ago",
  },
];

const CompanyRiskOversight = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-semibold text-foreground">Company Risk Oversight</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          These companies show elevated compliance risk and require monitoring or intervention.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Industry</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Health</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Risk Reason</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Assigned CA</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Last Activity</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoRiskCompanies.map((company, index) => (
              <TableRow 
                key={index}
                className="hover:bg-muted/20 transition-colors"
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    {company.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.industry} · {company.jurisdiction}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${company.health}%` }}
                      />
                    </div>
                    <span className="text-sm text-red-400">{company.health}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-red-400 text-sm">{company.riskReason}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">{company.assignedCA}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {company.lastActivity}
                  </div>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-orange-400">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    Escalate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default CompanyRiskOversight;
