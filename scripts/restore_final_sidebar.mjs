import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx';
let content = readFileSync(filePath, 'utf8');

// 1. Correct Imports
const neededImports = [
  'import CADashboardSubNav, { CADashboardZone } from "@/components/ca-dashboard/CADashboardSubNav";',
  'import MultiClientMasterHub from "@/components/ca-dashboard/MultiClientMasterHub";',
  'import PracticeBillingPanel from "@/components/ca-dashboard/PracticeBillingPanel";',
  'import SecureFileSharingPanel from "@/components/ca-dashboard/SecureFileSharingPanel";',
  'import StatutoryDeadlineCalendar from "@/components/ca-dashboard/StatutoryDeadlineCalendar";'
];

neededImports.forEach(imp => {
  const base = imp.split('from')[0].trim();
  if (!content.includes(base)) {
     content = content.replace(/import { useNavigate }/, `${imp}\nimport { useNavigate }`);
  }
});

// 2. State & Constants
if (!content.includes('activeZone')) {
  content = content.replace(
    /const \{ caId, caFirmId, isLoading: identityLoading \} = useCAIdentity\(\);/,
    'const { caId, caFirmId, isLoading: identityLoading } = useCAIdentity();\n  const [activeZone, setActiveZone] = useState<CADashboardZone>("command");'
  );
}

// 3. Define the Sidebar + Tabs structure
const sidebarAndTabs = `
          {/* Main Dashboard Layout with Sidebar + Tabs */}
          <div className="flex gap-8 items-start mt-8">
            {/* Sticky Professional Sidebar */}
            <CADashboardSubNav 
              activeZone={activeZone}
              onZoneChange={(zone) => setActiveZone(zone)}
              onOpenDraftingEngine={() => setIsDrawerOpen(true)}
              caName="Professional CA"
            />

            <Tabs value={activeZone} onValueChange={(val: any) => setActiveZone(val)} className="flex-1 min-w-0">
              {/* ZONE 1: COMMAND CENTER (OVERVIEW) */}
              <TabsContent value="command" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-8">
                <CAActionInbox />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <motion.div className="p-6 rounded-2xl border border-border/50 bg-card/30">
                      <h3 className="text-xl font-bold text-foreground mb-4">Control Tower Metrics</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.map((stat) => {
                          const Icon = stat.icon;
                          return (
                            <div key={stat.id} className="p-4 rounded-xl bg-background/50 border border-border/40 hover:border-cyan-500/30 transition-colors">
                               <div className="flex items-center justify-between mb-2">
                                 <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
                                 <Icon className={\`w-4 h-4 \${stat.color}\`} />
                               </div>
                               <p className="text-xl font-bold text-foreground">{stat.value}</p>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                    <DailyGovernanceBrief />
                  </div>
                  <div className="space-y-8">
                    <StatutoryDeadlineCalendar />
                    <RegulatoryNewsRuleImpact
                      isRealDashboard={true}
                      apiEndpoint={\`\${CA_API}/api/v1/ca/regulatory-news\`}
                      aiEnabled={true}
                      caId={caId}
                    />
                  </div>
                </div>
                <ComplianceHealthChangeLog
                  isRealDashboard={true}
                  apiEndpoint={\`\${CA_API}/api/v1/ca\`}
                  caId={caId}
                />
              </TabsContent>

              {/* ZONE 2: CLIENT VAULT */}
              <TabsContent value="clients" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-8">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-transparent border border-indigo-500/20 mb-8">
                  <h2 className="text-2xl font-bold text-indigo-400">Client Portfolio Vault</h2>
                  <p className="text-sm text-muted-foreground">Manage multi-entity compliance status and secure documentation.</p>
                </div>
                <MultiClientMasterHub />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <TaskFilingManagement isRealDashboard={true} apiEndpoint={\`\${CA_API}/api/v1/ca/tasks\`} governmentIntegration={true} />
                  <ClientDependencyTracker isRealDashboard={true} apiEndpoint={\`\${CA_API}/api/v1/ca/dependencies\`} aiEnabled={true} />
                </div>
              </TabsContent>

              {/* ZONE 3: AI SWARM CONTROL */}
              <TabsContent value="ai-swarm" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-8">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 mb-8">
                  <h2 className="text-2xl font-bold text-purple-400">Autonomous AI Swarm</h2>
                  <p className="text-sm text-muted-foreground">Orchestrate background agents and review autonomous compliance actions.</p>
                </div>
                <LiveAIDraftingEngine />
                {/* Full AI Drafting Trigger */}
                <div className="mt-8 p-6 rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center text-center">
                  <Cpu className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-foreground">Advanced Drafting Engine</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">Access the full potential of Regulon AI for complex legal responses and regulatory filings.</p>
                  <Button onClick={() => setIsDrawerOpen(true)} className="bg-purple-600 hover:bg-purple-700">Open Full Drafting Engine</Button>
                </div>
              </TabsContent>

              {/* ZONE 4: FIRM OPERATIONS */}
              <TabsContent value="operations" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-8">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 mb-8">
                  <h2 className="text-2xl font-bold text-emerald-400">Firm Operations & Billing</h2>
                  <p className="text-sm text-muted-foreground">Automated practice management and revenue tracking.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <PracticeBillingPanel />
                  <SecureFileSharingPanel />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <AuditInspectionSupport isRealDashboard={true} caId={caId} />
                  <CAAnalyticsPerformance isRealDashboard={true} caId={caId} />
                </div>
                <CommunicationLogsLive isRealDashboard={true} caId={caId} />
              </TabsContent>
            </Tabs>
          </div>
`;

// Boundary detection
const startTag = '<CACommandCenterHeader />';
const endTag = '</div>\\n      </main>';

const parts = content.split(startTag);
const afterHeader = parts[1].split(endTag);
const mainBody = afterHeader[0];
const remaining = afterHeader.slice(1).join(endTag);

content = parts[0] + startTag + sidebarAndTabs + endTag + remaining;

writeFileSync(filePath, content, 'utf8');
console.log("Successfully restored Sidebar + Tabs structure!");
