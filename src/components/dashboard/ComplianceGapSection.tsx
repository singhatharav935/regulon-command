import { motion } from "framer-motion";
import { AlertCircle, XCircle, Clock, CheckCircle, FileX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GapItem {
  id: string;
  type: "missing" | "expired" | "pending";
  title: string;
  regulator: string;
  impact: string;
  timeToClose: string;
}

const demoGaps: GapItem[] = [
  { id: "1", type: "missing", title: "DIR-3 KYC for Directors", regulator: "MCA", impact: "+5%", timeToClose: "2-3 days" },
  { id: "2", type: "expired", title: "GST Registration Certificate Renewal", regulator: "GST", impact: "+3%", timeToClose: "5-7 days" },
  { id: "3", type: "pending", title: "Board Resolution for FY Approval", regulator: "MCA", impact: "+4%", timeToClose: "1-2 days" },
  { id: "4", type: "missing", title: "TDS Return Q3 Filing", regulator: "Income Tax", impact: "+3%", timeToClose: "1 day" },
  { id: "5", type: "pending", title: "RBI Foreign Liabilities Return", regulator: "RBI", impact: "+2%", timeToClose: "3-4 days" },
];

const ComplianceGapSection = () => {
  const getTypeIcon = (type: GapItem["type"]) => {
    switch (type) {
      case "missing": return <FileX className="w-4 h-4 text-red-400" />;
      case "expired": return <XCircle className="w-4 h-4 text-orange-400" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getTypeLabel = (type: GapItem["type"]) => {
    switch (type) {
      case "missing": return "Missing Filing";
      case "expired": return "Expired Approval";
      case "pending": return "Pending Action";
    }
  };

  const getTypeBadgeClass = (type: GapItem["type"]) => {
    switch (type) {
      case "missing": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "expired": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 mb-8"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Why Your Compliance Is Incomplete
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your compliance score is below 100% due to specific pending requirements.
            These items are mandatory for your business category.
            Completing them will directly improve your compliance status and reduce regulatory risk.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-card/30 border border-border/30">
        <div className="flex items-center gap-2 text-sm">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-muted-foreground">Missing filings</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <XCircle className="w-4 h-4 text-orange-400" />
          <span className="text-muted-foreground">Expired approvals</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-muted-foreground">Pending actions</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-muted-foreground">What will improve the score</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Expected time to close each gap</span>
        </div>
      </div>

      {/* Gap Items */}
      <div className="space-y-3">
        {demoGaps.map((gap, index) => (
          <motion.div
            key={gap.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="p-4 rounded-xl bg-card/30 border border-border/30 hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {getTypeIcon(gap.type)}
                <div>
                  <h3 className="font-medium text-foreground">{gap.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-card/50 border-border/50 text-xs">
                      {gap.regulator}
                    </Badge>
                    <Badge className={`${getTypeBadgeClass(gap.type)} border text-xs`}>
                      {getTypeLabel(gap.type)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Score Impact</p>
                  <p className="text-green-400 font-semibold">{gap.impact}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Time to Close</p>
                  <p className="text-primary font-medium">{gap.timeToClose}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ComplianceGapSection;
