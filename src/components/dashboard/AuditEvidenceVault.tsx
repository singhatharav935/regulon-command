import { motion } from "framer-motion";
import { Shield, FileText, Clock, FileStack, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuditRecord {
  id: string;
  category: "filing" | "timeline" | "evidence";
  title: string;
  regulator: string;
  date: string;
  status: "ready" | "pending";
}

const demoAuditRecords: AuditRecord[] = [
  { id: "1", category: "filing", title: "Certificate of Incorporation", regulator: "MCA", date: "Jan 2024", status: "ready" },
  { id: "2", category: "filing", title: "GST Registration Certificate", regulator: "GST", date: "Jan 2024", status: "ready" },
  { id: "3", category: "timeline", title: "Annual Return Filing Timeline 2025", regulator: "MCA", date: "Dec 2025", status: "ready" },
  { id: "4", category: "timeline", title: "Tax Payment History FY 2025-26", regulator: "Income Tax", date: "Ongoing", status: "ready" },
  { id: "5", category: "evidence", title: "Board Meeting Minutes 2025", regulator: "MCA", date: "Jan 2026", status: "ready" },
  { id: "6", category: "evidence", title: "RBI Compliance Declarations", regulator: "RBI", date: "Dec 2025", status: "ready" },
];

const AuditEvidenceVault = () => {
  const getCategoryIcon = (category: AuditRecord["category"]) => {
    switch (category) {
      case "filing": return <FileText className="w-4 h-4 text-primary" />;
      case "timeline": return <Clock className="w-4 h-4 text-blue-400" />;
      case "evidence": return <FileStack className="w-4 h-4 text-purple-400" />;
    }
  };

  const getCategoryLabel = (category: AuditRecord["category"]) => {
    switch (category) {
      case "filing": return "Filing & Certificate";
      case "timeline": return "Compliance Timeline";
      case "evidence": return "Supporting Evidence";
    }
  };

  const getCategoryBadgeClass = (category: AuditRecord["category"]) => {
    switch (category) {
      case "filing": return "bg-primary/20 text-primary border-primary/30";
      case "timeline": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "evidence": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    }
  };

  const filings = demoAuditRecords.filter(r => r.category === "filing");
  const timelines = demoAuditRecords.filter(r => r.category === "timeline");
  const evidence = demoAuditRecords.filter(r => r.category === "evidence");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6 mb-8"
    >
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Audit & Inspection Ready Records
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your compliance records are organized and ready for audits, inspections, or due diligence.
              Download regulator-ready documents anytime without manual preparation.
            </p>
          </div>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <Download className="w-4 h-4" />
          Download Audit Pack
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-card/30 border border-border/30">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Filings & certificates</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-muted-foreground">Compliance timeline</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FileStack className="w-4 h-4 text-purple-400" />
          <span className="text-muted-foreground">Supporting evidence</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Download className="w-4 h-4 text-green-400" />
          <span className="text-muted-foreground">Download audit pack</span>
        </div>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filings & Certificates */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Filings & Certificates
          </h3>
          {filings.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="p-3 rounded-xl bg-card/30 border border-border/30 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{record.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-card/50 border-border/50 text-xs">
                      {record.regulator}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{record.date}</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Compliance Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Compliance Timeline
          </h3>
          {timelines.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + index * 0.05 }}
              className="p-3 rounded-xl bg-card/30 border border-border/30 hover:border-blue-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{record.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-card/50 border-border/50 text-xs">
                      {record.regulator}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{record.date}</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Supporting Evidence */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FileStack className="w-4 h-4 text-purple-400" />
            Supporting Evidence
          </h3>
          {evidence.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              className="p-3 rounded-xl bg-card/30 border border-border/30 hover:border-purple-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{record.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-card/50 border-border/50 text-xs">
                      {record.regulator}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{record.date}</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AuditEvidenceVault;
