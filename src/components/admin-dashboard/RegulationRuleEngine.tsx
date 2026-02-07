import { motion } from "framer-motion";
import { Scale, Calendar, Building2, Power, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const demoRegulations = [
  {
    name: "DPDP Act 2023",
    industry: "All Industries",
    jurisdiction: "Pan-India",
    effectiveDate: "Apr 01, 2026",
    scoreImpact: "-8% if non-compliant",
    active: true,
    versions: 3,
  },
  {
    name: "GST Amendment 2026",
    industry: "E-Commerce, Retail",
    jurisdiction: "Pan-India",
    effectiveDate: "Mar 01, 2026",
    scoreImpact: "-5% if non-compliant",
    active: true,
    versions: 2,
  },
  {
    name: "RBI Digital Lending Guidelines",
    industry: "NBFC, FinTech",
    jurisdiction: "Pan-India",
    effectiveDate: "Jan 01, 2026",
    scoreImpact: "-10% if non-compliant",
    active: true,
    versions: 4,
  },
  {
    name: "MCA ESG Disclosure",
    industry: "Listed Companies",
    jurisdiction: "Pan-India",
    effectiveDate: "Jul 01, 2026",
    scoreImpact: "-6% if non-compliant",
    active: false,
    versions: 1,
  },
];

const RegulationRuleEngine = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 mb-8"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Regulation & Rule Engine</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage compliance rules applied across industries, jurisdictions, and company types.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-muted-foreground font-semibold">Law / Regulation</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Industry</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Jurisdiction</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Effective Date</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Score Impact</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Active</TableHead>
              <TableHead className="text-muted-foreground font-semibold">History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoRegulations.map((reg, index) => (
              <TableRow 
                key={index}
                className="hover:bg-muted/20 transition-colors"
              >
                <TableCell className="font-medium text-foreground">{reg.name}</TableCell>
                <TableCell className="text-muted-foreground">{reg.industry}</TableCell>
                <TableCell className="text-muted-foreground">{reg.jurisdiction}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {reg.effectiveDate}
                  </div>
                </TableCell>
                <TableCell className="text-red-400 text-sm">{reg.scoreImpact}</TableCell>
                <TableCell>
                  <Switch checked={reg.active} />
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    <History className="w-3 h-3 mr-1" />
                    v{reg.versions}
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

export default RegulationRuleEngine;
