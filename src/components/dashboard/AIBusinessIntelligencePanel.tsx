import { useMemo, useState } from "react";
import { Brain, Compass, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type ExposureItem = {
  regulator: string;
  status: string;
};

type TaskItem = {
  title: string;
  regulator: string;
  priority: string;
  status: string;
};

type DeadlineItem = {
  title: string;
  regulator: string;
  daysLeft: number;
};

type Props = {
  companyName: string;
  industry: string;
  complianceHealth: number;
  exposures: ExposureItem[];
  tasks: TaskItem[];
  deadlines: DeadlineItem[];
};

type Report = {
  businessReadiness: number;
  marketPositionScore: number;
  operationalRisk: number;
  growthMomentum: number;
  confidence: number;
  outlook: "strong" | "watch" | "critical";
  strengths: string[];
  gaps: string[];
  whereNeededMost: string;
  howToAcquirePosition: string[];
  immediateActions: string[];
};

const INDUSTRY_OUTLOOK: Record<string, { demand: number; competition: number; headwind: number; hotspots: string[] }> = {
  fintech: { demand: 86, competition: 82, headwind: 58, hotspots: ["SME credit infrastructure", "RegTech automation", "Embedded finance"] },
  payments: { demand: 84, competition: 80, headwind: 60, hotspots: ["Merchant onboarding ops", "Fraud intelligence", "Cross-border rails"] },
  "it services": { demand: 78, competition: 76, headwind: 49, hotspots: ["Compliance-as-a-service", "AI operations", "Data governance"] },
  healthcare: { demand: 82, competition: 64, headwind: 55, hotspots: ["Digital patient workflows", "Provider compliance systems", "Health analytics"] },
  ecommerce: { demand: 80, competition: 85, headwind: 62, hotspots: ["Supply-chain intelligence", "Returns optimization", "B2B commerce"] },
  default: { demand: 74, competition: 70, headwind: 50, hotspots: ["Process automation", "Risk reduction services", "Compliance-linked growth"] },
};

const normalizeIndustryKey = (industry: string) => {
  const k = (industry || "").toLowerCase();
  if (k.includes("fintech")) return "fintech";
  if (k.includes("payment")) return "payments";
  if (k.includes("it")) return "it services";
  if (k.includes("health")) return "healthcare";
  if (k.includes("commerce")) return "ecommerce";
  return "default";
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const computeBusinessReport = ({
  industry,
  complianceHealth,
  exposures,
  tasks,
  deadlines,
}: Omit<Props, "companyName">): Report => {
  const outlook = INDUSTRY_OUTLOOK[normalizeIndustryKey(industry)];

  const pendingTasks = tasks.filter((task) => !/completed|done|closed/i.test(task.status)).length;
  const overdueTasks = tasks.filter((task) => /overdue|delayed|blocked/i.test(task.status)).length;
  const criticalTasks = tasks.filter((task) => /critical|high/i.test(task.priority)).length;
  const potentialExposures = exposures.filter((e) => /potential|watch|open/i.test(e.status)).length;
  const nearDeadlines = deadlines.filter((d) => d.daysLeft <= 10).length;

  const operationalRisk = clamp(
    20 +
      overdueTasks * 12 +
      criticalTasks * 4 +
      potentialExposures * 7 +
      nearDeadlines * 5 -
      Math.round(complianceHealth * 0.25),
  );

  const businessReadiness = clamp(
    Math.round(
      complianceHealth * 0.45 +
        (100 - operationalRisk) * 0.35 +
        outlook.demand * 0.20,
    ),
  );

  const marketPositionScore = clamp(
    Math.round(
      businessReadiness * 0.42 +
        outlook.demand * 0.28 -
        outlook.competition * 0.18 -
        outlook.headwind * 0.12,
    ),
  );

  const growthMomentum = clamp(
    Math.round(
      outlook.demand * 0.40 +
        (100 - operationalRisk) * 0.35 +
        (100 - pendingTasks * 5) * 0.25,
    ),
  );

  const confidence = clamp(
    64 +
      Math.round(complianceHealth * 0.12) -
      overdueTasks * 2 -
      potentialExposures * 2,
    40,
    96,
  );

  const reportOutlook: Report["outlook"] =
    marketPositionScore >= 75 ? "strong" : marketPositionScore >= 55 ? "watch" : "critical";

  const strengths = [
    complianceHealth >= 75 ? "Compliance health is supporting market trust and client credibility." : "Core compliance capability exists and can be strengthened quickly.",
    `Industry demand signal is ${outlook.demand}/100 with opportunities in ${outlook.hotspots[0]}.`,
    pendingTasks <= 6 ? "Execution bandwidth is manageable for focused growth initiatives." : "There is enough active pipeline to prioritize high-impact market moves.",
  ];

  const gaps = [
    overdueTasks > 0
      ? `${overdueTasks} overdue/blocked item(s) may reduce execution confidence and client conversion speed.`
      : "No major execution backlog detected.",
    potentialExposures > 0
      ? `${potentialExposures} regulatory exposure(s) should be closed to improve market positioning.`
      : "Regulatory exposure profile is relatively stable.",
    criticalTasks > 4
      ? "High critical workload concentration indicates a delivery fragility risk."
      : "Critical workload is not heavily concentrated.",
  ];

  const whereNeededMost =
    `Highest market-fit zone: ${outlook.hotspots.join(" -> ")}. Focus first on ${outlook.hotspots[0]} where demand is high and compliance-led differentiation is strongest.`;

  const howToAcquirePosition = [
    "Build a 90-day compliance-led growth narrative: show risk control, delivery consistency, and measurable SLA outcomes.",
    "Prioritize top 3 critical workstreams and convert them into client-visible proof points (turnaround time, reduction in notices, filing accuracy).",
    "Create a targeted offering around your best-fit hotspot with a clear ROI promise and operational guarantee.",
    "Run weekly AI-assisted workload balancing so execution quality stays high while growth expands.",
  ];

  const immediateActions = [
    nearDeadlines > 0
      ? `Create a 10-day deadline war-room for ${nearDeadlines} near-term filing(s).`
      : "Maintain weekly deadline forecast discipline.",
    overdueTasks > 0
      ? `Clear overdue/blocked queue (${overdueTasks}) before starting new expansion commitments.`
      : "Use spare execution bandwidth to launch one strategic growth initiative.",
    "Publish a monthly business health scorecard with compliance, delivery, and market metrics for leadership decisions.",
  ];

  return {
    businessReadiness,
    marketPositionScore,
    operationalRisk,
    growthMomentum,
    confidence,
    outlook: reportOutlook,
    strengths,
    gaps,
    whereNeededMost,
    howToAcquirePosition,
    immediateActions,
  };
};

const AIBusinessIntelligencePanel = ({
  companyName,
  industry,
  complianceHealth,
  exposures,
  tasks,
  deadlines,
}: Props) => {
  const [showBusinessIntel, setShowBusinessIntel] = useState(false);
  const [showMarketPosition, setShowMarketPosition] = useState(false);

  const report = useMemo(
    () => computeBusinessReport({ industry, complianceHealth, exposures, tasks, deadlines }),
    [industry, complianceHealth, exposures, tasks, deadlines],
  );

  const outlookStyle =
    report.outlook === "strong"
      ? "border-emerald-500/40 text-emerald-300"
      : report.outlook === "watch"
        ? "border-amber-500/40 text-amber-300"
        : "border-rose-500/40 text-rose-300";

  return (
    <Card className="glass-card border-border/40 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-300" />
          AI Business Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowBusinessIntel((prev) => !prev)}
        >
          <Compass className="w-4 h-4 mr-2" />
          {showBusinessIntel ? "Hide Know Your Business" : "Know Your Business / Explore Your Business"}
        </Button>

        {showBusinessIntel && (
          <div className="space-y-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-sm text-cyan-100">
              AI summary for <span className="font-medium">{companyName}</span>: Business readiness is{" "}
              <span className="font-medium">{report.businessReadiness}/100</span> with confidence{" "}
              <span className="font-medium">{report.confidence}%</span>. Current best-fit market zone is driven by{" "}
              <span className="font-medium">{industry || "your operating sector"}</span>.
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowMarketPosition((prev) => !prev)}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {showMarketPosition
                ? "Hide Market Position Analysis"
                : "According to current market condition, am I in a good position?"}
            </Button>

            {showMarketPosition && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={outlookStyle}>
                    Market Outlook: {report.outlook.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">AI Confidence: {report.confidence}%</Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border/40 p-3 bg-background/30">
                    <p className="text-xs text-muted-foreground mb-1">Market Position Score</p>
                    <p className="font-medium">{report.marketPositionScore}/100</p>
                    <Progress className="mt-2" value={report.marketPositionScore} />
                  </div>
                  <div className="rounded-lg border border-border/40 p-3 bg-background/30">
                    <p className="text-xs text-muted-foreground mb-1">Growth Momentum</p>
                    <p className="font-medium">{report.growthMomentum}/100</p>
                    <Progress className="mt-2" value={report.growthMomentum} />
                  </div>
                  <div className="rounded-lg border border-border/40 p-3 bg-background/30">
                    <p className="text-xs text-muted-foreground mb-1">Business Readiness</p>
                    <p className="font-medium">{report.businessReadiness}/100</p>
                    <Progress className="mt-2" value={report.businessReadiness} />
                  </div>
                  <div className="rounded-lg border border-border/40 p-3 bg-background/30">
                    <p className="text-xs text-muted-foreground mb-1">Operational Risk</p>
                    <p className="font-medium">{report.operationalRisk}/100</p>
                    <Progress className="mt-2" value={100 - report.operationalRisk} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="font-medium text-emerald-300 mb-2">What Is Good</p>
                    <ul className="list-disc pl-4 space-y-1 text-emerald-100/90">
                      {report.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="font-medium text-amber-300 mb-2">What Is Needed</p>
                    <ul className="list-disc pl-4 space-y-1 text-amber-100/90">
                      {report.gaps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm">
                  <p className="font-medium text-cyan-200 mb-1">Where Your Business Is Needed Most</p>
                  <p className="text-cyan-100/90">{report.whereNeededMost}</p>
                </div>

                <div className="rounded-lg border border-border/40 p-3 bg-background/30 text-sm">
                  <p className="font-medium mb-2">How To Acquire Stronger Market Position</p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    {report.howToAcquirePosition.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-border/40 p-3 bg-background/30 text-sm">
                  <p className="font-medium mb-2">Immediate AI Action Plan</p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    {report.immediateActions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIBusinessIntelligencePanel;

