import { motion } from "framer-motion";
import { HelpCircle, ChevronDown, Shield, Users, FileCheck, Building2, Scale, Clock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    title: "Why REGULON?",
    icon: HelpCircle,
    faqs: [
      {
        q: "Why does a company need a compliance platform like REGULON?",
        a: "Most companies manage compliance through people, memory, WhatsApp, Excel, and emails. This creates blind spots, missed deadlines, lost documents, and penalties. REGULON converts compliance into a structured, trackable, auditable system owned by the company, not individuals."
      },
      {
        q: "We already work with a Chartered Accountant. Why is REGULON needed?",
        a: "A CA provides professional services, not a compliance system. Companies still lack visibility, audit trails, continuity, and control. REGULON does not replace CAs — it institutionalizes their work so the company is never dependent on one person."
      },
      {
        q: "What is the biggest compliance mistake founders make?",
        a: "Assuming compliance is \"handled\" simply because a CA is appointed. This creates single-point dependency, no internal visibility, and loss of history when people change."
      },
      {
        q: "In simple terms, what problem does REGULON solve?",
        a: "REGULON ensures compliance does not depend on memory, individuals, or luck, but on a controlled and auditable system."
      },
      {
        q: "How is REGULON different from spreadsheets or reminders?",
        a: "Spreadsheets have no access control, no audit trail, and break when people change. REGULON enforces process discipline, accountability, and evidence preservation."
      }
    ]
  },
  {
    title: "Risk & Protection",
    icon: Shield,
    faqs: [
      {
        q: "What happens if a CA or consultant misses a deadline?",
        a: "In most cases, the company pays the penalty, not the CA. REGULON reduces this risk by enforcing system-tracked deadlines, task ownership, approvals, and escalation before deadlines are missed."
      },
      {
        q: "How do companies usually lose money in compliance?",
        a: "Common causes include: Missed statutory deadlines, incorrect or incomplete filings, lost challans or acknowledgements, and delayed responses to regulatory notices. These losses are usually due to process failure, not intent."
      },
      {
        q: "Is compliance failure really that common in India?",
        a: "Yes. Thousands of companies incur penalties every year ranging from thousands to crores of rupees due to late filings, audit lapses, and documentation gaps across MCA, GST, Income Tax, RBI, and SEBI."
      },
      {
        q: "Can REGULON prevent fraud or misuse by consultants?",
        a: "REGULON reduces risk by enforcing documented approvals, professional verification, and immutable audit logs. Any action taken is traceable, timestamped, and attributable, making misuse detectable and provable."
      },
      {
        q: "Does REGULON help avoid director disqualification risks?",
        a: "By tracking statutory filings and deadlines, REGULON significantly reduces the risk of defaults that can lead to director disqualification."
      },
      {
        q: "What does REGULON ultimately protect?",
        a: "REGULON protects the company from: Financial penalties, legal exposure, loss of compliance history, and dependency on individuals."
      }
    ]
  },
  {
    title: "Professional Services",
    icon: Users,
    faqs: [
      {
        q: "Does REGULON provide legal or tax advice?",
        a: "No. All AI outputs are clearly labeled as \"AI-generated drafts\" and require mandatory CA or Lawyer approval. REGULON does not replace professional judgment."
      },
      {
        q: "What happens if our CA, consultant, or finance manager changes?",
        a: "In traditional setups, compliance history is often lost. In REGULON, history remains with the company. New professionals continue from the same system without disruption."
      },
      {
        q: "Does REGULON replace internal finance or legal teams?",
        a: "No. REGULON supports internal teams by removing manual tracking and preserving compliance intelligence so teams focus on decisions, not chasing information."
      },
      {
        q: "Who owns compliance inside REGULON — the company or the professional?",
        a: "The company owns compliance. Professionals execute and approve within the system, but ownership, history, and control stay with the company."
      },
      {
        q: "Can REGULON reduce dependence on WhatsApp and email?",
        a: "Yes. All compliance communication, documents, and approvals are centralized and linked to tasks for clarity and traceability."
      }
    ]
  },
  {
    title: "Audits & Due Diligence",
    icon: FileCheck,
    faqs: [
      {
        q: "How does REGULON help during audits or due diligence?",
        a: "REGULON maintains a complete compliance history including filings, approvals, documents, and timelines. Audits become retrieval of evidence, not reconstruction from emails and chats."
      },
      {
        q: "Can REGULON show proof of compliance to investors or banks?",
        a: "Yes. REGULON provides documented evidence, audit logs, and filing history that can be shared during due diligence, audits, or funding rounds."
      },
      {
        q: "What happens if a filing is done incorrectly?",
        a: "REGULON preserves the entire workflow — drafts, approvals, and submissions — making it clear where an error occurred and enabling faster correction."
      },
      {
        q: "Does REGULON maintain an audit trail?",
        a: "Yes. Every action — AI draft, human edit, approval, and submission — is timestamped and logged."
      },
      {
        q: "Can REGULON help during mergers, acquisitions, or exits?",
        a: "Yes. Clean compliance records significantly reduce friction during due diligence and valuation discussions."
      }
    ]
  },
  {
    title: "Platform Capabilities",
    icon: Building2,
    faqs: [
      {
        q: "Does REGULON submit filings directly to government portals?",
        a: "Filings continue on official government portals. REGULON prepares drafts, tracks approvals, stores acknowledgements, and preserves evidence to ensure correctness and traceability."
      },
      {
        q: "How does REGULON reduce penalties and late fees?",
        a: "Most penalties arise due to forgetting or poor tracking. REGULON replaces memory-based processes with system-enforced deadlines, visibility, and accountability."
      },
      {
        q: "How does REGULON handle multiple regulators?",
        a: "REGULON tracks each regulator independently (MCA, GST, Income Tax, Labour, RBI, SEBI) while providing a single unified view for the company."
      },
      {
        q: "When a regulatory notice is received, what happens?",
        a: "Instead of panic, the notice is logged, deadlines are tracked, professionals are assigned, and responses are documented with full traceability."
      },
      {
        q: "How does REGULON handle document versioning?",
        a: "Each document upload creates a version. Once approved or submitted, documents are locked, ensuring no silent changes or tampering."
      },
      {
        q: "Can REGULON handle multiple companies under one account?",
        a: "Yes. Holding groups, founders, and CFOs can manage multiple entities with separate data isolation and access controls."
      }
    ]
  },
  {
    title: "Getting Started",
    icon: Clock,
    faqs: [
      {
        q: "Is REGULON suitable for small companies or only enterprises?",
        a: "Both. Small companies gain discipline and structure early. Enterprises gain governance, visibility, audit readiness, and control across multiple regulators."
      },
      {
        q: "How long does it take to onboard a company?",
        a: "Initial onboarding captures company basics and applicable regulators. From there, REGULON begins tracking obligations immediately."
      },
      {
        q: "What if our business changes (funding, expansion, hiring)?",
        a: "REGULON updates compliance applicability based on business changes, reducing the risk of silent non-compliance."
      },
      {
        q: "How secure is company data on REGULON?",
        a: "REGULON uses role-based access, company-level data isolation, secure storage, and full access logs. Security and compliance are foundational design principles."
      },
      {
        q: "What is the cost of not using a compliance system?",
        a: "Hidden costs include penalties, interest, legal exposure, lost time during audits, stress during funding rounds, and reputational risk."
      },
      {
        q: "Is REGULON only for India?",
        a: "REGULON is built for Indian regulations but structured in a way that supports future expansion into other jurisdictions."
      },
      {
        q: "Is REGULON useful even if we rarely get notices?",
        a: "Yes. The real value is preventing notices, penalties, and surprises — not just reacting to them."
      },
      {
        q: "What if regulators increase scrutiny in the future?",
        a: "REGULON is designed for increasing enforcement by maintaining evidence-ready compliance and structured accountability."
      }
    ]
  }
];

const FAQSection = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Frequently Asked Questions
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient-primary">Everything</span> You Need to Know
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get answers to common questions about compliance management, 
            regulatory requirements, and how REGULON protects your business.
          </p>
        </motion.div>

        {/* FAQ Categories */}
        <div className="grid md:grid-cols-2 gap-8">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              className="glass-card p-6 rounded-2xl"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {category.title}
                </h3>
              </div>

              {/* Accordion */}
              <Accordion type="single" collapsible className="space-y-2">
                {category.faqs.map((faq, faqIndex) => (
                  <AccordionItem
                    key={faqIndex}
                    value={`${categoryIndex}-${faqIndex}`}
                    className="border border-border/50 rounded-xl px-4 data-[state=open]:bg-accent/30 transition-colors"
                  >
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4 gap-3">
                      <span className="flex-1">{faq.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="glass-card p-8 rounded-2xl inline-block">
            <Scale className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Our compliance experts are ready to help you understand how REGULON can protect your business.
            </p>
            <button className="btn-glow px-6 py-3 rounded-lg font-medium">
              Talk to an Expert
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
