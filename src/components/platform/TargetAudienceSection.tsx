import { motion } from "framer-motion";
import { useState } from "react";
import { Rocket, Building, Landmark, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const audiences = [
  {
    icon: Rocket,
    title: "Startups & MSMEs",
    description: "Focus on building your business while we handle the compliance complexity. From incorporation to ongoing regulatory requirements.",
    backInfo: "Get started with affordable plans, scale as you grow. No compliance expertise needed.",
  },
  {
    icon: Building,
    title: "Enterprises & Corporate Groups",
    description: "Multi-entity compliance management with centralized visibility, automated workflows, and executive reporting.",
    backInfo: "Manage 100+ entities from one dashboard with role-based access and audit trails.",
  },
  {
    icon: Landmark,
    title: "FinTechs & Regulated Entities",
    description: "Specialized RBI and SEBI compliance for NBFCs, payment aggregators, investment advisors, and financial institutions.",
    backInfo: "Stay ahead of regulatory changes with real-time circulars and compliance alerts.",
  },
  {
    icon: Users,
    title: "Founders, CFOs & Compliance Heads",
    description: "Real-time compliance dashboards, deadline tracking, and audit-ready documentation at your fingertips.",
    backInfo: "Executive dashboards with compliance health scores and one-click reporting.",
  },
];

interface FlipCardState {
  [key: number]: boolean;
}

const TargetAudienceSection = () => {
  const [flippedCards, setFlippedCards] = useState<FlipCardState>({});

  const handleMouseEnter = (index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: true }));
  };

  const handleMouseLeave = (index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: false }));
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
            Who This Is For
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            REGULON serves organizations across the spectrum — from early-stage startups 
            to large enterprises navigating complex regulatory environments.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-[180px]"
              style={{ perspective: "1000px" }}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
            >
              <div
                className={cn(
                  "relative w-full h-full transition-transform duration-700 ease-out"
                )}
                style={{
                  transformStyle: "preserve-3d",
                  transform: flippedCards[index] ? "rotateX(180deg)" : "rotateX(0deg)",
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 w-full h-full glass-card-hover p-8 flex gap-6"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                    <audience.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{audience.title}</h3>
                    <p className="text-muted-foreground">{audience.description}</p>
                  </div>
                </div>
                
                {/* Back */}
                <div
                  className="absolute inset-0 w-full h-full glass-card p-8 flex items-center gap-6 bg-primary/5 border border-primary/30"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateX(180deg)",
                  }}
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 shrink-0">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-primary">Why Choose Us</h4>
                    <p className="text-foreground/80">{audience.backInfo}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;
