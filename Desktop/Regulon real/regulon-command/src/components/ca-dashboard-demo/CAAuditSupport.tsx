import { motion } from "framer-motion";
import { Shield, Upload, CheckCircle2, Eye } from "lucide-react";
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

const demoAudits = [
  {
    company: "Acme Technologies",
    authority: "Income Tax Department",
    scope: "Assessment Year 2024-25",
    documents: "ITR, TDS Returns, Books of Accounts",
    status: "Documents Requested",
  },
  {
    company: "GlobalTrade India",
    authority: "GST Audit Team",
    scope: "FY 2024-25 GST Compliance",
    documents: "GSTR-1, GSTR-3B, E-way Bills",
    status: "Under Review",
  },
  {
    company: "SecurePay Solutions",
    authority: "RBI Inspection Team",
    scope: "Annual RBI Inspection",
    documents: "Compliance Certificates, Transaction Logs",
    status: "Scheduled",
  },
];

const statusColors: Record<string, string> = {
  "Documents Requested": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Under Review": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Scheduled": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Completed": "bg-green-500/20 text-green-400 border-green-500/30",
};

const CAAuditSupport = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Audit, Inspection & Due Diligence Support</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          These companies have audit, inspection, or due diligence activity.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Authority / Auditor</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Scope</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Documents</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoAudits.map((audit, index) => (
              <TableRow 
                key={index}
                className="hover:bg-muted/20 transition-colors"
              >
                <TableCell className="font-medium text-foreground">{audit.company}</TableCell>
                <TableCell className="text-foreground">{audit.authority}</TableCell>
                <TableCell className="text-muted-foreground">{audit.scope}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{audit.documents}</TableCell>
                <TableCell>
                  <Badge className={`${statusColors[audit.status]} border`}>
                    {audit.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2">
                      <Upload className="w-3 h-3" />
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

export default CAAuditSupport;
