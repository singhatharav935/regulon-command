import { motion } from "framer-motion";
import { AlertOctagon, Clock, XCircle, Scale, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const demoIncidents = [
  {
    type: "Missed Deadline",
    description: "GST-3B filing for GlobalTrade India missed by 5 days",
    severity: "Critical",
    company: "GlobalTrade India",
    status: "Open",
  },
  {
    type: "Filing Rejection",
    description: "MCA MGT-7 rejected due to signature mismatch",
    severity: "High",
    company: "DataSync Analytics",
    status: "In Progress",
  },
  {
    type: "Data Inconsistency",
    description: "TDS amounts mismatch between Form 26AS and books",
    severity: "Medium",
    company: "Acme Technologies",
    status: "Under Review",
  },
  {
    type: "Legal Conflict",
    description: "Conflicting compliance requirements between state and central",
    severity: "High",
    company: "SecurePay Solutions",
    status: "Open",
  },
];

const severityColors: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
  High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusColors: Record<string, string> = {
  Open: "text-red-400",
  "In Progress": "text-yellow-400",
  "Under Review": "text-blue-400",
  Resolved: "text-green-400",
};

const typeIcons: Record<string, React.ElementType> = {
  "Missed Deadline": Clock,
  "Filing Rejection": XCircle,
  "Data Inconsistency": AlertOctagon,
  "Legal Conflict": Scale,
};

const IncidentManagement = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-semibold text-foreground">Incident & Exception Management</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Platform-level exceptions requiring manual review.
        </p>
      </div>

      <div className="space-y-4">
        {demoIncidents.map((incident, index) => {
          const Icon = typeIcons[incident.type] || AlertOctagon;
          return (
            <Card key={index} className="bg-card/30 border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <Icon className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{incident.type}</span>
                        <Badge className={`${severityColors[incident.severity]} border text-xs`}>
                          {incident.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Company: {incident.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${statusColors[incident.status]}`}>
                      {incident.status}
                    </span>
                    <Button size="sm" variant="outline">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
};

export default IncidentManagement;
