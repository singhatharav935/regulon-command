import { motion } from "framer-motion";
import { Scale, Calendar, AlertTriangle, FileText, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const demoLawImpacts = [
  {
    regulation: "DPDP Act 2023 - Data Principal Rights",
    affectedCompanies: ["Acme Technologies", "DataSync Analytics", "SecurePay Solutions"],
    effectiveDate: "Apr 01, 2026",
    impact: "-8% compliance score",
    caAction: "Update privacy policies, implement consent mechanisms",
  },
  {
    regulation: "MCA Amendment - ESG Disclosure Requirements",
    affectedCompanies: ["GlobalTrade India", "Acme Technologies"],
    effectiveDate: "Jul 01, 2026",
    impact: "-5% compliance score",
    caAction: "Prepare sustainability reports, board attestation",
  },
  {
    regulation: "GST Rate Revision - IT Services",
    affectedCompanies: ["DataSync Analytics"],
    effectiveDate: "Mar 01, 2026",
    impact: "-3% compliance score",
    caAction: "Update invoicing systems, revise contracts",
  },
];

const CALawImpactSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Upcoming Law & Rule Impact</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          New or upcoming regulations affecting one or more of your assigned clients.
        </p>
      </div>

      <div className="space-y-4">
        {demoLawImpacts.map((law, index) => (
          <Card key={index} className="bg-card/30 border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">{law.regulation}</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Effective: {law.effectiveDate}
                    </div>
                    <div className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      {law.impact}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Affected Companies:</p>
                    <div className="flex flex-wrap gap-1">
                      {law.affectedCompanies.map((company) => (
                        <Badge key={company} variant="outline" className="text-xs">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Required CA Action:</p>
                    <p className="text-sm text-foreground">{law.caAction}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Bell className="w-3 h-3 mr-1" />
                    Notify Clients
                  </Button>
                  <Button size="sm">
                    <FileText className="w-3 h-3 mr-1" />
                    Prepare Filing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

export default CALawImpactSection;
