import { motion } from "framer-motion";
import { Award, CheckCircle2 } from "lucide-react";

const teamMembers = [
  {
    name: "Rajesh Kumar, CA",
    role: "Senior Compliance Partner",
    specialization: "Corporate Law & MCA",
    experience: "15+ years",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
  },
  {
    name: "Priya Sharma, CA",
    role: "Tax Compliance Head",
    specialization: "GST & Income Tax",
    experience: "12+ years",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
  },
  {
    name: "Amit Patel, CA",
    role: "Financial Regulations Lead",
    specialization: "RBI & SEBI Compliance",
    experience: "18+ years",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
  },
  {
    name: "Sunita Reddy, LLB",
    role: "Legal Review Partner",
    specialization: "Contract & Corporate Law",
    experience: "14+ years",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
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
              <div className="relative w-24 h-24 mx-auto mb-4">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full rounded-full object-cover border-2 border-primary/30"
                />
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
