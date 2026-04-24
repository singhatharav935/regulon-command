import React from 'react';
import { motion } from 'framer-motion';
import { FileSignature, Download, ExternalLink, BookOpen, UserPlus, Milestone, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CASectionAgentBadge } from '@/components/agents/CASectionAgentBadge';
import { useAICommunication } from '@/store/useAICommunication';

const TEMPLATES = [
  { id: 't1', title: 'Director Appointment', section: 'Sec 161', icon: UserPlus, desc: 'Resolution for appointing an additional director.' },
  { id: 't2', title: 'Bank Account Opening', section: 'Sec 173', icon: Milestone, desc: 'Authorizing signatories for a new corporate bank account.' },
  { id: 't3', title: 'Inter-Corporate Loan', section: 'Sec 186', icon: Briefcase, desc: 'Resolution for extending a loan to a related party/subsidiary.' },
];

export default function BoardResolutionsPanel() {
  const { setActivePrompt, setDrawerOpen } = useAICommunication();

  const handleAIDraft = (template: typeof TEMPLATES[0]) => {
    setActivePrompt(`
SYSTEM DIRECTIVE:
Draft a formal Board Resolution under the Companies Act, 2013.

PARAMETERS:
Resolution Type: ${template.title}
Applicable Section: ${template.section}
Company: [Insert Selected Client Name]

ACTION:
Generate the completely legal text of the resolution including the "RESOLVED THAT" clauses. Make it ready to be copied into a Word Document or PDF.
    `);
    setDrawerOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <FileSignature className="w-6 h-6 text-purple-500" />
            Board Resolution Repository
            <CASectionAgentBadge agentId="D2_REFINER" />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate formatted, compliant Board Resolutions instantly using AI-assisted templates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="p-5 bg-card/30 border border-border/50 rounded-xl hover:border-purple-500/30 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
              <t.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground">{t.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4 h-10">{t.desc}</p>
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-xs font-mono bg-muted/50 px-2 py-1 rounded">{t.section}</span>
              <Button size="sm" variant="ghost" className="h-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10" onClick={() => handleAIDraft(t)}>
                <BookOpen className="w-3.5 h-3.5 mr-1" /> Auto-Draft
              </Button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
