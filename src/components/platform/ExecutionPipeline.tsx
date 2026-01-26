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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How <span className="text-gradient-primary">REGULON</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                {/* Step number */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>

                {/* Content card */}
                <div className={`ml-20 md:ml-0 md:w-[calc(50%-3rem)] glass-card p-6 ${
                  index % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
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
