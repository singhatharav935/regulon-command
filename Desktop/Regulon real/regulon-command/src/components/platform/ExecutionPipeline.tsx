import { motion } from "framer-motion";
import { 
  FileInput, 
  Cpu, 
  UserCheck, 
  Scale, 
  CheckCircle2, 
  ClipboardList,
  ArrowDown
} from "lucide-react";

const steps = [
  {
    icon: FileInput,
    title: "Compliance Received",
    description: "Documents and requirements submitted through secure portal",
  },
  {
    icon: Cpu,
    title: "AI Analysis & Drafting",
    description: "Automated analysis, risk identification, and draft preparation",
  },
  {
    icon: UserCheck,
    title: "Mandatory CA Review",
    description: "Licensed Chartered Accountant verification of all financial matters",
  },
  {
    icon: Scale,
    title: "Mandatory Lawyer Review",
    description: "Legal professional verification of regulatory and legal compliance",
  },
  {
    icon: CheckCircle2,
    title: "Final Approval & Submission",
    description: "Authorized submission to regulatory authorities",
  },
  {
    icon: ClipboardList,
    title: "Audit Logs & Traceability",
    description: "Complete audit trail of all actions and decisions",
  },
];

const ExecutionPipeline = () => {
  return (
    <section className="py-24 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            How <span className="text-gradient-primary drop-shadow-sm">SANNIDH</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            A rigorous execution pipeline ensuring every compliance action is AI-analyzed 
            and professionally verified before submission.
          </p>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent md:-translate-x-px" />

          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex items-center gap-6 md:gap-12 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Step number glow node */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-background border border-primary/50 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(var(--primary),0.3)] shadow-primary/30">
                  <span className="text-sm font-extrabold text-primary">{index + 1}</span>
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20" />
                </div>

                {/* Content card */}
                <div className={`ml-20 md:ml-0 md:w-[calc(50%-3rem)] bento-card p-6 border-white/5 shadow-lg group hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 ${
                  index % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
                }`}>
                  <div className="flex items-start gap-5">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 shrink-0 group-hover:scale-110 transition-transform duration-500">
                      <step.icon className="w-6 h-6 text-primary drop-shadow-sm" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                      <p className="text-sm text-muted-foreground/90 font-light leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExecutionPipeline;
