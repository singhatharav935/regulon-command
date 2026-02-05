import { motion } from "framer-motion";
import { TrendingUp, Shield, FileCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const verdictData = [
  {
    icon: TrendingUp,
    implementation: "Compliance Health Gap Explanation Engine",
    investorValue: "Transforms an abstract score into a monetizable action plan. When a company sees exactly why it's at 72% — missing GST reconciliation, pending director KYC, unsigned board resolution — hesitation disappears. The gap becomes the sale. Companies pay immediately to close visible, quantified risk. This compresses sales cycles, eliminates 'we'll think about it' objections, and converts compliance anxiety into recurring revenue. Investors see a self-qualifying buyer: if they're below 100%, they pay.",
  },
  {
    icon: Shield,
    implementation: "New Rule / Law Impact Prediction on Compliance Health",
    investorValue: "Moves the platform from reactive record-keeping to proactive compliance control. When a new SEBI circular or MCA amendment is announced, showing a company its future compliance health drop before enforcement begins positions REGULON as the virtual General Counsel. This is high-margin, recurring enterprise value. Companies don't just track — they anticipate. Investors recognize this as defensible IP: predictive compliance intelligence that competitors cannot replicate without years of regulatory mapping. It creates switching cost through foresight.",
  },
  {
    icon: FileCheck,
    implementation: "Audit-Ready Downloadable PDF Vault",
    investorValue: "Eliminates the single most stressful business event: audits, inspections, and due diligence. One-click generation of regulator-ready evidence packs — filings, approvals, timelines, acknowledgements — removes weeks of scrambling and consultant fees. This drives near-zero churn. Companies that survive one audit with REGULON never leave. Investors see lifetime value expansion: audit readiness is not a feature, it's insurance. The platform becomes embedded in company operations, creating long-term retention and predictable revenue.",
  },
];

const InvestorVerdictSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Investor Perspective</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The "Final Verdict" Evaluation
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A strategic assessment of platform capabilities from an institutional investor and enterprise buyer lens
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-foreground font-semibold text-base py-6 px-6 w-[35%]">
                  Your Implementation
                </TableHead>
                <TableHead className="text-foreground font-semibold text-base py-6 px-6">
                  Why it Secures the Investment
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verdictData.map((item, index) => (
                <TableRow 
                  key={index} 
                  className="border-border/30 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="py-8 px-6 align-top">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg leading-tight">
                          {item.implementation}
                        </h3>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-8 px-6 align-top">
                    <p className="text-muted-foreground leading-relaxed text-[15px]">
                      {item.investorValue}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>

        {/* Bottom Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="glass-card p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">↑ Conversion</p>
            <p className="text-sm text-muted-foreground">Gap visibility removes buyer hesitation</p>
          </div>
          <div className="glass-card p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">↑ Margin</p>
            <p className="text-sm text-muted-foreground">Predictive intelligence commands premium pricing</p>
          </div>
          <div className="glass-card p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-2">↓ Churn</p>
            <p className="text-sm text-muted-foreground">Audit readiness creates permanent stickiness</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvestorVerdictSection;
