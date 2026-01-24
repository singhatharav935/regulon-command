import { motion } from "framer-motion";
import { 
  Building2, 
  Receipt, 
  Wallet, 
  Users, 
  Landmark, 
  TrendingUp, 
  FileText,
  ArrowRight 
} from "lucide-react";

const capabilities = [
  {
    icon: Building2,
    title: "Corporate & ROC Compliance",
    description: "Annual returns, board resolutions, statutory registers, director filings, and all MCA requirements.",
  },
  {
    icon: Receipt,
    title: "GST & Income Tax Compliance",
    description: "GSTR filings, ITR submissions, TDS/TCS management, advance tax, and assessment handling.",
  },
  {
    icon: Users,
    title: "Labour Law Compliance",
    description: "PF, ESI, professional tax, minimum wages, and employment-related statutory requirements.",
  },
  {
    icon: Landmark,
    title: "RBI Regulatory Compliance",
    description: "NBFC filings, FinTech compliance, FEMA reporting, and Reserve Bank requirements.",
  },
  {
    icon: TrendingUp,
    title: "SEBI Regulatory Compliance",
    description: "Securities regulations, investment advisory compliance, and capital market requirements.",
  },
  {
    icon: FileText,
    title: "Contract & Legal Document Reviews",
    description: "AI-powered contract analysis with mandatory lawyer verification and risk identification.",
  },
];

const CapabilitiesSection = () => {
  return (
    <section className="py-24 relative bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What XYZ AI Serves
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive compliance capabilities powered by AI analysis and verified professional execution.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card-hover p-6 group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4 group-hover:bg-primary/20 transition-colors">
                <capability.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{capability.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{capability.description}</p>
              <button className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors">
                Learn more
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CapabilitiesSection;
