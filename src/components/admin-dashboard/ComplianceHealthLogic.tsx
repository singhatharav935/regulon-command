import { motion } from "framer-motion";
import { Sliders, Scale, AlertTriangle, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const demoWeights = [
  { category: "Filing Compliance", weight: 35, priority: "Critical" },
  { category: "Certificate Validity", weight: 25, priority: "High" },
  { category: "Audit Readiness", weight: 20, priority: "Medium" },
  { category: "Document Completeness", weight: 15, priority: "Medium" },
  { category: "Communication Responsiveness", weight: 5, priority: "Low" },
];

const ComplianceHealthLogic = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Compliance Health Logic Control</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Control how compliance health is calculated and impacted.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoring Weights */}
        <Card className="bg-card/30 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              Scoring Weights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoWeights.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.priority}
                    </Badge>
                    <span className="text-sm font-medium text-primary">{item.weight}%</span>
                  </div>
                </div>
                <Slider
                  defaultValue={[item.weight]}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risk Multipliers & Grace Periods */}
        <div className="space-y-6">
          <Card className="bg-card/30 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Risk Multipliers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="text-sm text-foreground">Critical Overdue</span>
                <span className="text-red-400 font-medium">3.0x</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <span className="text-sm text-foreground">High Priority Delay</span>
                <span className="text-orange-400 font-medium">2.0x</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-sm text-foreground">Medium Priority Delay</span>
                <span className="text-yellow-400 font-medium">1.5x</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Grace Periods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Company Onboarding</span>
                <span className="text-foreground font-medium">30 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">First Offense</span>
                <span className="text-foreground font-medium">7 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Document Resubmission</span>
                <span className="text-foreground font-medium">3 days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ComplianceHealthLogic;
