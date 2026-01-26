import { motion } from "framer-motion";
import { useState } from "react";
import { 
  Building2, 
  Receipt, 
  Wallet, 
  Users, 
  Landmark, 
  TrendingUp, 
  FileText,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const capabilities = [
  {
    icon: Building2,
    title: "Corporate & ROC Compliance",
    description: "Annual returns, board resolutions, statutory registers, director filings, and all MCA requirements.",
    backInfo: "Covers 50+ MCA filing types with automated deadline tracking and document generation.",
  },
  {
    icon: Receipt,
    title: "GST & Income Tax Compliance",
    description: "GSTR filings, ITR submissions, TDS/TCS management, advance tax, and assessment handling.",
    backInfo: "End-to-end tax automation with real-time reconciliation and audit-ready reports.",
  },
  {
    icon: Users,
    title: "Labour Law Compliance",
    description: "PF, ESI, professional tax, minimum wages, and employment-related statutory requirements.",
    backInfo: "Multi-state labour law tracking with automated challan generation and filing.",
  },
  {
    icon: Landmark,
    title: "RBI Regulatory Compliance",
    description: "NBFC filings, FinTech compliance, FEMA reporting, and Reserve Bank requirements.",
    backInfo: "Specialized NBFC and FinTech compliance with regulatory change monitoring.",
  },
  {
    icon: TrendingUp,
    title: "SEBI Regulatory Compliance",
    description: "Securities regulations, investment advisory compliance, and capital market requirements.",
    backInfo: "Investment advisory and AIF compliance with automated disclosure management.",
  },
  {
    icon: FileText,
    title: "Contract & Legal Document Reviews",
    description: "AI-powered contract analysis with mandatory lawyer verification and risk identification.",
    backInfo: "AI reviews contracts in minutes, flags risks, and routes to verified lawyers.",
  },
];

interface FlipCardState {
  [key: number]: boolean;
}

const CapabilitiesSection = () => {
  const [flippedCards, setFlippedCards] = useState<FlipCardState>({});

  const handleMouseEnter = (index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: true }));
  };

  const handleMouseLeave = (index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: false }));
  };

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
            What <span className="text-gradient-primary">REGULON</span> Serves
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
              className="perspective-1000"
              style={{ perspective: "1000px" }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
            >
              <div
                className={cn(
                  "relative w-full h-[220px] transition-transform duration-700 ease-out",
                  "transform-style-preserve-3d"
                )}
                style={{
                  transformStyle: "preserve-3d",
                  transform: flippedCards[index] ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 w-full h-full glass-card-hover p-6 group"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
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
                </div>
                
                {/* Back */}
                <div
                  className="absolute inset-0 w-full h-full glass-card p-6 flex flex-col items-center justify-center text-center bg-primary/5 border border-primary/30"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <CheckCircle className="w-10 h-10 text-primary mb-4" />
                  <h4 className="text-lg font-semibold mb-2 text-primary">What You Get</h4>
                  <p className="text-sm text-foreground/80">{capability.backInfo}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CapabilitiesSection;
