import { motion } from "framer-motion";
import { Award, CheckCircle2 } from "lucide-react";

const teamMembers = [
  {
    name: "CA Arpit Jain",
    role: "Senior Tax Consultant",
    specialization: "Corporate Taxation & Audits",
    experience: "5+ years",
    initials: "AJ"
  },
  {
    name: "CA Sangeeta Gupta",
    role: "GST & Indirect Tax Expert",
    specialization: "GST Compliance & Litigation",
    experience: "4+ years",
    initials: "SG"
  },
  {
    name: "CA Varun Mehta",
    role: "Corporate Governance Lead",
    specialization: "MCA & Secretarial Audits",
    experience: "5+ years",
    initials: "VM"
  },
  {
    name: "CA Anjali Verma",
    role: "Advisory & Regulatory Head",
    specialization: "FEMA & RBI Compliance",
    experience: "3+ years",
    initials: "AV"
  },
];

const TeamSection = () => {
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Verified Professionals</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Compliance Team
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every compliance action is reviewed and executed by licensed Chartered Accountants 
            and Lawyers with decades of regulatory experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card-hover p-6 text-center"
            >
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30 text-primary font-bold text-xl">
                  {member.initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
              <p className="text-sm text-primary mb-2">{member.role}</p>
              <p className="text-xs text-muted-foreground mb-1">{member.specialization}</p>
              <p className="text-xs text-muted-foreground/70">{member.experience}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
