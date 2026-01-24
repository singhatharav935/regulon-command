import { motion } from "framer-motion";
import { Rocket, Building, Landmark, Users } from "lucide-react";

const audiences = [
  {
    icon: Rocket,
    title: "Startups & MSMEs",
    description: "Focus on building your business while we handle the compliance complexity. From incorporation to ongoing regulatory requirements.",
  },
  {
    icon: Building,
    title: "Enterprises & Corporate Groups",
    description: "Multi-entity compliance management with centralized visibility, automated workflows, and executive reporting.",
  },
  {
    icon: Landmark,
    title: "FinTechs & Regulated Entities",
    description: "Specialized RBI and SEBI compliance for NBFCs, payment aggregators, investment advisors, and financial institutions.",
  },
  {
    icon: Users,
    title: "Founders, CFOs & Compliance Heads",
    description: "Real-time compliance dashboards, deadline tracking, and audit-ready documentation at your fingertips.",
  },
];

const TargetAudienceSection = () => {
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
            XYZ AI serves organizations across the spectrum — from early-stage startups 
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
              className="glass-card-hover p-8 flex gap-6"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                <audience.icon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{audience.title}</h3>
                <p className="text-muted-foreground">{audience.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;
