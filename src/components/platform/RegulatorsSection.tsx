import { motion } from "framer-motion";
import { useState } from "react";
import { Building, Landmark, Receipt, CreditCard, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const regulators = [
  {
    id: "MCA",
    name: "MCA",
    fullName: "Ministry of Corporate Affairs",
    description: "Corporate governance, ROC filings, company law compliance",
    backInfo: "50+ filing types covered including Annual Returns, Director Changes, and Charge Registration",
    icon: Building,
    colorClass: "badge-mca",
    bgClass: "bg-[hsl(220,90%,56%)]/10",
    borderClass: "border-[hsl(220,90%,56%)]/30",
  },
  {
    id: "GST",
    name: "GST",
    fullName: "Goods & Services Tax",
    description: "GST returns, input tax credits, compliance filings",
    backInfo: "GSTR-1, GSTR-3B, GSTR-9 with automated reconciliation and ITC optimization",
    icon: Receipt,
    colorClass: "badge-gst",
    bgClass: "bg-[hsl(142,76%,40%)]/10",
    borderClass: "border-[hsl(142,76%,40%)]/30",
  },
  {
    id: "IT",
    name: "Income Tax",
    fullName: "Income Tax Department",
    description: "ITR filings, TDS/TCS, advance tax, assessments",
    backInfo: "All ITR forms, TDS returns, advance tax calculations with assessment support",
    icon: CreditCard,
    colorClass: "badge-it",
    bgClass: "bg-[hsl(45,93%,47%)]/10",
    borderClass: "border-[hsl(45,93%,47%)]/30",
  },
  {
    id: "RBI",
    name: "RBI",
    fullName: "Reserve Bank of India",
    description: "NBFC compliance, FinTech regulations, FEMA",
    backInfo: "NBFC filings, FinTech sandbox compliance, FEMA reporting, and RBI circulars tracking",
    icon: Landmark,
    colorClass: "badge-rbi",
    bgClass: "bg-[hsl(0,84%,60%)]/10",
    borderClass: "border-[hsl(0,84%,60%)]/30",
  },
  {
    id: "SEBI",
    name: "SEBI",
    fullName: "Securities & Exchange Board",
    description: "Securities regulations, investment advisory, market compliance",
    backInfo: "IA registration, AIF compliance, disclosure requirements, and investor protection",
    icon: TrendingUp,
    colorClass: "badge-sebi",
    bgClass: "bg-[hsl(280,85%,60%)]/10",
    borderClass: "border-[hsl(280,85%,60%)]/30",
  },
];

interface FlipCardState {
  [key: number]: boolean;
}

const RegulatorsSection = () => {
  const [flippedCards, setFlippedCards] = useState<FlipCardState>({});
  const [animatingCards, setAnimatingCards] = useState<FlipCardState>({});

  const handleMouseEnter = (index: number) => {
    if (!animatingCards[index]) {
      setAnimatingCards(prev => ({ ...prev, [index]: true }));
      setFlippedCards(prev => ({ ...prev, [index]: true }));
      
      setTimeout(() => {
        setFlippedCards(prev => ({ ...prev, [index]: false }));
        setTimeout(() => {
          setAnimatingCards(prev => ({ ...prev, [index]: false }));
        }, 600);
      }, 1200);
    }
  };

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Compliance Infrastructure Coverage
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete regulatory coverage across India's major compliance bodies.
            Every regulator. Every requirement. One platform.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {regulators.map((regulator, index) => (
            <motion.div
              key={regulator.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-[200px]"
              style={{ perspective: "1000px" }}
              onMouseEnter={() => handleMouseEnter(index)}
            >
              <div
                className={cn(
                  "relative w-full h-full transition-transform duration-700 ease-out"
                )}
                style={{
                  transformStyle: "preserve-3d",
                  transform: flippedCards[index] ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front */}
                <div
                  className={cn(
                    "absolute inset-0 w-full h-full glass-card-hover p-6 text-center",
                    regulator.bgClass,
                    regulator.borderClass
                  )}
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <div className={cn(
                    "inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 border",
                    regulator.bgClass,
                    regulator.borderClass
                  )}>
                    <regulator.icon className="w-7 h-7" style={{ color: `hsl(var(--regulator-${regulator.id.toLowerCase()}))` }} />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{regulator.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{regulator.fullName}</p>
                  <p className="text-xs text-muted-foreground/80">{regulator.description}</p>
                </div>
                
                {/* Back */}
                <div
                  className={cn(
                    "absolute inset-0 w-full h-full glass-card p-4 flex flex-col items-center justify-center text-center",
                    regulator.bgClass,
                    "border-2",
                    regulator.borderClass
                  )}
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <Info className="w-8 h-8 mb-3" style={{ color: `hsl(var(--regulator-${regulator.id.toLowerCase()}))` }} />
                  <h4 className="text-sm font-semibold mb-2">Coverage Details</h4>
                  <p className="text-xs text-foreground/80">{regulator.backInfo}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegulatorsSection;
