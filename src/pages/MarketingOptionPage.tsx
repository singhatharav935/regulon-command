import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Header = ({ title, subtitle, tag }: { title: string; subtitle: string; tag: string }) => (
  <section className="rounded-2xl border border-border/50 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-background/80 p-8">
    <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 mb-3">{tag}</Badge>
    <h1 className="text-3xl md:text-5xl font-bold mb-2">{title}</h1>
    <p className="text-muted-foreground max-w-4xl">{subtitle}</p>
    <div className="flex flex-wrap gap-3 mt-6">
      <Button asChild className="btn-glow">
        <Link to="/auth?mode=signup&role=company_owner">Launch Controlled Onboarding</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/compliance">Open Compliance Center</Link>
      </Button>
    </div>
  </section>
);

const Panel = ({ title, items }: { title: string; items: string[] }) => (
  <Card className="glass-card border-border/40">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => <p key={item}>• {item}</p>)}
    </CardContent>
  </Card>
);

const GridTwo = ({ left, right }: { left: ReactNode; right: ReactNode }) => (
  <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">{left}{right}</section>
);

const PlatformOverviewPage = () => (
  <>
    <Header title="Platform Overview" subtitle="Enterprise compliance AI infrastructure with governed execution, professional review, and operational control." tag="PLATFORM CONTROL PLANE" />
    <GridTwo
      left={<Panel title="Infrastructure Layers" items={["Command dashboards for company, CA, legal, admin", "Workflow engine for drafting, review, and sign-off", "Policy layer with role/persona gate enforcement", "Audit + evidence ledger with immutable events"]} />}
      right={<Panel title="Production Readiness Gates" items={["Security readiness checks before deployment", "Route access matrix with explicit endpoint controls", "Tenant-isolation checks for multi-workspace safety", "Operational SLA monitors and runbook checks"]} />}
    />
  </>
);

const HowItWorksPage = () => (
  <>
    <Header title="How the Platform Works" subtitle="Closed-loop lifecycle from regulatory signal to signed compliance action with traceable accountability." tag="WORKFLOW ORCHESTRATION" />
    <GridTwo
      left={<Panel title="Execution Stages" items={["1) Intake and context normalization", "2) AI drafting and risk annotation", "3) CA/legal correction and validation", "4) Approver sign-off and immutable closure"]} />}
      right={<Panel title="Control Points" items={["Confidence gates on high-risk sections", "No bypass of human approval transitions", "Version lineage stored on each draft mutation", "Audit replay for every filing journey"]} />}
    />
  </>
);

const InfrastructurePage = () => (
  <>
    <Header title="Compliance Infrastructure" subtitle="Backend architecture designed for legal-grade reliability, governance, commercial operations, and incident resilience." tag="BACKEND ARCHITECTURE" />
    <GridTwo
      left={<Panel title="Core Service Domains" items={["Compliance workflows and draft lifecycle services", "Billing/usage metering and invoice operations", "Legal document registry and acceptance tracking", "Operations readiness diagnostics and runbooks"]} />}
      right={<Panel title="Ops Risk Controls" items={["API contract tests across critical routes", "Deployment readiness scorecards", "Synthetic checks and failure logging", "Escalation workflows for blocker remediation"]} />}
    />
  </>
);

const AiHumanReviewPage = () => (
  <>
    <Header title="AI + Human Review Model" subtitle="AI accelerates preparation while licensed professionals retain final authority for regulated outputs." tag="REVIEW GOVERNANCE MODEL" />
    <GridTwo
      left={<Panel title="AI Responsibilities" items={["Draft structure and issue pre-detection", "Evidence gap signaling and confidence hints", "Queue prioritization and execution suggestions"]} />}
      right={<Panel title="Human Responsibilities" items={["Regulatory/legal correctness validation", "Risk-bearing decisions and edits", "Approval and final sign-off accountability"]} />}
    />
  </>
);

const RegulatorsPage = () => (
  <>
    <Header title="Regulatory Coverage" subtitle="Authority-aware workflows across MCA, GST, Income Tax, RBI, SEBI, contract, and customs operations." tag="AUTHORITY COVERAGE" />
    <GridTwo
      left={<Panel title="Authority Lanes" items={["MCA: governance filings and ROC controls", "GST: return cadence + notice defense", "Income Tax: assessment-ready response flow", "RBI/SEBI: elevated review risk lanes"]} />}
      right={<Panel title="Cross-Authority Safeguards" items={["Authority mismatch detection", "Policy version trace on every output", "Risk-tier escalations by regulator", "Comparative performance analytics by lane"]} />}
    />
  </>
);

const AiAssistantPage = () => (
  <>
    <Header title="AI Assistant" subtitle="Operational copilot for queue triage, compliance action recommendations, and reviewer productivity uplift." tag="ASSISTIVE INTELLIGENCE" />
    <GridTwo
      left={<Panel title="Assistant Actions" items={["Priority queue refresh every cycle", "Draft advisories and owner-level reminders", "Risk explanations linked to current workload"]} />}
      right={<Panel title="Autonomy Boundaries" items={["No high-impact closure without approval", "Explainability attached to each suggestion", "Fallback to deterministic path on uncertainty"]} />}
    />
  </>
);

const AuditPage = () => (
  <>
    <Header title="Audit & Traceability" subtitle="Forensic-grade operational history for every draft, edit, decision, and submission." tag="AUDIT ASSURANCE" />
    <GridTwo
      left={<Panel title="Audit Artifacts" items={["Workflow events with actor identity", "Draft version timeline and rollback lineage", "Approval-chain evidence with timestamps"]} />}
      right={<Panel title="Audit Outcomes" items={["Fast inquiry response packs", "Defensible compliance reporting", "Root-cause reconstruction for incidents"]} />}
    />
  </>
);

const SolutionPage = ({ title, subtitle, focus, controls }: { title: string; subtitle: string; focus: string[]; controls: string[] }) => (
  <>
    <Header title={title} subtitle={subtitle} tag="SOLUTION EXECUTION LANE" />
    <GridTwo
      left={<Panel title="Execution Focus" items={focus} />}
      right={<Panel title="Risk Controls" items={controls} />}
    />
  </>
);

const CustomersPage = () => (
  <>
    <Header title="Customers" subtitle="Role-specific operating models for companies, CA firms, legal teams, and platform admins." tag="OPERATING MODELS" />
    <GridTwo
      left={<Panel title="Workspace Models" items={["Company command dashboard", "CA execution dashboard", "In-house legal review dashboard", "Admin governance dashboard"]} />}
      right={<Panel title="Adoption Outcomes" items={["Lower coordination overhead", "Higher filing quality consistency", "Centralized compliance visibility"]} />}
    />
  </>
);

const SecurityPage = () => (
  <>
    <Header title="Security" subtitle="Identity, authorization, tenant isolation, and readiness controls designed for regulated infrastructure." tag="TRUST & SECURITY" />
    <GridTwo
      left={<Panel title="Security Architecture" items={["Role + persona authorization checks", "Protected route and endpoint gates", "Tenant-scoped data access enforcement"]} />}
      right={<Panel title="Assurance Controls" items={["Session integrity checks", "Security readiness pre-release gates", "Operational audit evidence for incidents"]} />}
    />
  </>
);

const ResourcesPage = () => (
  <>
    <Header title="Resources" subtitle="Operational runbooks, legal policies, readiness gates, and compliance references." tag="KNOWLEDGE SYSTEM" />
    <GridTwo
      left={<Panel title="Reference Assets" items={["Backend readiness plans", "AI launch control gates", "Compliance legal policy artifacts"]} />}
      right={<Panel title="Execution Playbooks" items={["Incident response runbooks", "Deployment checklist protocols", "Quality and contract test records"]} />}
    />
  </>
);

const AboutPage = () => (
  <>
    <Header title="About REGULON" subtitle="Compliance execution infrastructure built for high-stakes, large-scale regulated operations." tag="MISSION" />
    <GridTwo
      left={<Panel title="Operating Principles" items={["Execution over presentation", "Human accountability for risk-bearing decisions", "Auditability as a first-class requirement"]} />}
      right={<Panel title="Strategic Direction" items={["Scale across authorities and sectors", "Maintain governance under growth", "Build institutional-grade reliability"]} />}
    />
  </>
);

const bodyByPath: Record<string, ReactNode> = {
  "/platform": <PlatformOverviewPage />,
  "/platform/how-it-works": <HowItWorksPage />,
  "/platform/infrastructure": <InfrastructurePage />,
  "/platform/ai-human-review": <AiHumanReviewPage />,
  "/platform/regulators": <RegulatorsPage />,
  "/platform/ai-assistant": <AiAssistantPage />,
  "/platform/audit": <AuditPage />,
  "/solutions/roc": <SolutionPage title="Corporate & ROC Compliance" subtitle="Entity governance and filing controls with deadline-discipline workflows." focus={["ROC form execution lanes", "Governance evidence synchronization", "Deadline escalation and closure tracking"]} controls={["Director data validation gate", "Submission acknowledgment requirement", "Form-version consistency checks"]} />,
  "/solutions/gst": <SolutionPage title="GST Compliance" subtitle="High-frequency filing and notice workflows with mismatch controls." focus={["Return cadence workflows", "Mismatch triage operations", "Notice response packaging"]} controls={["High-severity mismatch blocker", "Evidence annexure completeness rule", "Deadline breach escalation"]} />,
  "/solutions/income-tax": <SolutionPage title="Income Tax Compliance" subtitle="Assessment and rebuttal workflows designed for defensible submissions." focus={["Notice decomposition and issue mapping", "Response drafting with chronology", "Evidence-backed argument structuring"]} controls={["Section citation validation", "Amount consistency checks", "Mandatory reviewer sign-off"]} />,
  "/solutions/labour-law": <SolutionPage title="Labour Law Compliance" subtitle="Workforce obligation tracking with remediation and audit readiness." focus={["Obligation mapping by workforce model", "Tasking and escalation workflows", "Remediation closure management"]} controls={["Applicability validation", "Missed-obligation escalation", "Evidence retention policy"]} />,
  "/solutions/rbi": <SolutionPage title="RBI Regulatory Compliance" subtitle="Elevated-risk financial compliance workflows and senior review controls." focus={["Circular impact tracking", "Reporting timeline execution", "Senior reviewer governance"]} controls={["High-risk approval tiers", "Circular-version enforcement", "Breach escalation to leadership"]} />,
  "/solutions/sebi": <SolutionPage title="SEBI Regulatory Compliance" subtitle="Disclosure integrity workflow with governance-bound approvals." focus={["Disclosure trigger detection", "Statement drafting and checks", "Governance approval sequencing"]} controls={["Materiality threshold escalations", "Board/legal approval chain", "Publication evidence capture"]} />,
  "/solutions/contracts": <SolutionPage title="Contract Reviews" subtitle="Clause-risk intelligence with policy-controlled legal approval flow." focus={["Clause extraction and risk map", "Negotiation redline workflow", "Exception handling and closure"]} controls={["Critical clause policy checks", "Exception approval requirement", "Final version lock"]} />,
  "/customers": <CustomersPage />,
  "/security": <SecurityPage />,
  "/security/data-residency": <SecurityPage />,
  "/security/encryption-standards": <SecurityPage />,
  "/security/dpdp-2026": <SecurityPage />,
  "/security/soc2-type-ii": <SecurityPage />,
  "/resources": <ResourcesPage />,
  "/about": <AboutPage />,
};

const MarketingOptionPage = () => {
  const location = useLocation();
  const content = bodyByPath[location.pathname] ?? <PlatformOverviewPage />;

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl space-y-6">{content}</div>
      </main>
      <Footer />
    </div>
  );
};

export default MarketingOptionPage;
