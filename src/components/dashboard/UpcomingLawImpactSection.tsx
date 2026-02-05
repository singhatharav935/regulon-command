import { motion } from "framer-motion";
import { Scale, Calendar, AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LawImpact {
  id: string;
  title: string;
  effectiveDate: string;
  scoreImpact: string;
  riskLevel: "high" | "medium" | "low";
  riskDescription: string;
  preparationSteps: string[];
}

const demoLawImpacts: LawImpact[] = [
  {
    id: "1",
    title: "DPDP Act 2023 Compliance Requirements",
    effectiveDate: "Apr 1, 2026",
    scoreImpact: "-12%",
    riskLevel: "high",
    riskDescription: "Heavy penalties for non-compliance with data protection requirements",
    preparationSteps: ["Appoint Data Protection Officer", "Update privacy policies", "Implement consent management"],
  },
  {
    id: "2",
    title: "New GST E-Invoice Threshold Changes",
    effectiveDate: "Mar 1, 2026",
    scoreImpact: "-5%",
    riskLevel: "medium",
    riskDescription: "E-invoicing mandatory for all B2B transactions above new threshold",
    preparationSteps: ["Update invoicing software", "Train accounts team", "Test e-invoice generation"],
  },
  {
    id: "3",
    title: "MCA Form INC-20A Timeline Update",
    effectiveDate: "Feb 28, 2026",
    scoreImpact: "-3%",
    riskLevel: "low",
    riskDescription: "Revised timeline for business commencement declaration",
    preparationSteps: ["Review current filing status", "Prepare required documents"],
  },
];

const UpcomingLawImpactSection = () => {
  const getRiskBadgeClass = (level: LawImpact["riskLevel"]) => {
    switch (level) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 mb-8"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Scale className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Upcoming Regulatory Impact
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            New or upcoming regulations will impact your compliance status if no action is taken.
            These changes apply specifically to your business and location.
            Preparing in advance helps avoid penalties and last-minute compliance pressure.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-card/30 border border-border/30">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Effective date</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-muted-foreground">Impact on compliance score</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <span className="text-muted-foreground">Risk if ignored</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-muted-foreground">Recommended preparation steps</span>
        </div>
      </div>

      {/* Law Impact Items */}
      <div className="space-y-4">
        {demoLawImpacts.map((law, index) => (
          <motion.div
            key={law.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="p-5 rounded-xl bg-card/30 border border-border/30 hover:border-yellow-500/30 transition-all duration-300"
          >
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">{law.title}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{law.effectiveDate}</span>
                  </div>
                  <Badge className={`${getRiskBadgeClass(law.riskLevel)} border`}>
                    {law.riskLevel.charAt(0).toUpperCase() + law.riskLevel.slice(1)} Risk
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Score Impact</p>
                <p className="text-red-400 font-bold text-lg">{law.scoreImpact}</p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 mb-4">
              <div className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-300">{law.riskDescription}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Recommended Preparation</p>
              <div className="flex flex-wrap gap-2">
                {law.preparationSteps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default UpcomingLawImpactSection;
