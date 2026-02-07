import { motion } from "framer-motion";
import { Shield, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
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

const demoAuditPacks = [
  {
    company: "Acme Technologies",
    generated: "Jan 25, 2026",
    verification: "Verified",
    missingEvidence: "None",
    qualityFlags: 0,
  },
  {
    company: "GlobalTrade India",
    generated: "Jan 24, 2026",
    verification: "Pending Review",
    missingEvidence: "Bank Statements Q4",
    qualityFlags: 2,
  },
  {
    company: "SecurePay Solutions",
    generated: "Jan 23, 2026",
    verification: "Verified",
    missingEvidence: "None",
    qualityFlags: 0,
  },
  {
    company: "DataSync Analytics",
    generated: "Jan 22, 2026",
    verification: "Rejected",
    missingEvidence: "TDS Certificates",
    qualityFlags: 3,
  },
];

const verificationColors: Record<string, string> = {
  "Verified": "bg-green-500/20 text-green-400 border-green-500/30",
  "Pending Review": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Rejected": "bg-red-500/20 text-red-400 border-red-500/30",
};

const AuditQualityControl = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Audit & Evidence Quality Control</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ensure audit packs meet regulator-ready standards before download.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Company</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Generated</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Verification</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Missing Evidence</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Quality Flags</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoAuditPacks.map((pack, index) => (
              <TableRow 
                key={index}
                className="hover:bg-muted/20 transition-colors"
              >
                <TableCell className="font-medium text-foreground">{pack.company}</TableCell>
                <TableCell className="text-muted-foreground">{pack.generated}</TableCell>
                <TableCell>
                  <Badge className={`${verificationColors[pack.verification]} border`}>
                    {pack.verification}
                  </Badge>
                </TableCell>
                <TableCell className={pack.missingEvidence !== "None" ? "text-red-400" : "text-green-400"}>
                  {pack.missingEvidence}
                </TableCell>
                <TableCell>
                  {pack.qualityFlags > 0 ? (
                    <div className="flex items-center gap-1 text-orange-400">
                      <AlertTriangle className="w-4 h-4" />
                      {pack.qualityFlags}
                    </div>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400">
                      <XCircle className="w-3 h-3 mr-1" />
                      Reject
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

export default AuditQualityControl;
