import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx';
let content = readFileSync(filePath, 'utf8');

// 1. Identify the imports we need
const neededImports = [
  'import { MultiClientMasterHub } from "@/components/ca-dashboard/MultiClientMasterHub";',
  'import { PracticeBillingPanel } from "@/components/ca-dashboard/PracticeBillingPanel";',
  'import { SecureFileSharingPanel } from "@/components/ca-dashboard/SecureFileSharingPanel";',
  'import { StatutoryDeadlineCalendar } from "@/components/ca-dashboard/StatutoryDeadlineCalendar";'
];

neededImports.forEach(imp => {
  if (!content.includes(imp)) {
    content = content.replace(/import { CACommandCenterHeader }/, `${imp}\nimport { CACommandCenterHeader }`);
  }
});

// 2. Define the 4 sections structure
const finalStructure = `
          {/* ========================================================================= */}
          {/* SECTION 1: OVERVIEW (COMMAND CENTER) */}
          {/* ========================================================================= */}
          <section id="overview" className="mb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/20">
                <LayoutDashboard className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Command Center Overview</h2>
                <p className="text-sm text-muted-foreground">Strategic briefing and active agent results</p>
              </div>
            </div>

            <CAActionInbox />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <motion.div className="p-6 rounded-2xl border border-border/50 bg-card/30">
                    <h3 className="text-xl font-bold text-foreground mb-4">Control Tower Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                          <div key={stat.id} className="p-4 rounded-xl bg-background/50 border border-border/40">
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
                  <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                     <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Auto-Pilot Status
                     </h3>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-muted-foreground">Swarm Coordination</span>
                           <span className="text-green-400 font-medium">Optimal</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-muted-foreground">Active Agents</span>
                           <span className="text-cyan-400 font-medium">12/12 online</span>
                        </div>
                        <div className="pt-2 border-t border-border/30">
                           <p className="text-xs text-muted-foreground leading-relaxed">
                              Regulon AI swarm is currently cross-referencing GST portal data with internal filing drafts for all 4 clients.
                           </p>
                        </div>
                     </div>
                  </div>
                  <RegulonAIAgent showMinimal />
               </div>
            </div>
          </section>

          <hr className="my-16 border-border/30" />

          {/* ========================================================================= */}
          {/* SECTION 2: CLIENT VAULT */}
          {/* ========================================================================= */}
          <section id="clients" className="mb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Client Vault & Portfolio</h2>
                <p className="text-sm text-muted-foreground">Multi-client masters portal and filing tracking</p>
              </div>
            </div>

            <MultiClientMasterHub />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <TaskFilingManagement 
                isRealDashboard={true}
                apiEndpoint={\`\${CA_API}/api/v1/ca/tasks\`}
                governmentIntegration={true}
              />
              <ClientDependencyTracker 
                isRealDashboard={true}
                apiEndpoint={\`\${CA_API}/api/v1/ca/dependencies\`}
                aiEnabled={true}
              />
            </div>
          </section>

          <hr className="my-16 border-border/30" />

          {/* ========================================================================= */}
          {/* SECTION 3: FIRM OPERATIONS */}
          {/* ========================================================================= */}
          <section id="operations" className="mb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                <Briefcase className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Firm Operations & Practice Management</h2>
                <p className="text-sm text-muted-foreground">Billing, analytics, and professional audit support</p>
              </div>
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
          </section>

          <hr className="my-16 border-border/30" />

          {/* ========================================================================= */}
          {/* SECTION 4: REGULATORY NEWS & CALENDAR */}
          {/* ========================================================================= */}
          <section id="regulatory" className="mb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/20">
                <Calendar className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Regulatory Intelligence & Calendar</h2>
                <p className="text-sm text-muted-foreground">Cross-department statutory deadlines and rule updates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1">
                  <StatutoryDeadlineCalendar />
               </div>
               <div className="lg:col-span-2 space-y-8">
                  <RegulatoryNewsRuleImpact
                    isRealDashboard={true}
                    apiEndpoint={\`\${CA_API}/api/v1/ca/regulatory-news\`}
                    aiEnabled={true}
                    caId={caId}
                  />
                  <ComplianceHealthChangeLog
                    isRealDashboard={true}
                    apiEndpoint={\`\${CA_API}/api/v1/ca\`}
                    caId={caId}
                  />
               </div>
            </div>
          </section>
`;

// 3. Replace the main content area
// Based on current file structure observed in previous turns
const startMarker = '<CACommandCenterHeader />';
const endMarker = '</div>\n      </main>';

const parts = content.split(startMarker);
const dashboardStart = parts[0] + startMarker;
const dashboardEnd = endMarker + parts[1].split(endMarker).slice(1).join(endMarker);

content = dashboardStart + finalStructure + dashboardEnd;

// 4. Save and finish
writeFileSync(filePath, content, 'utf8');
console.log("Restored the 4-section vertical stack with Billing & Invoices!");
