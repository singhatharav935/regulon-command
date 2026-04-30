import sys

path = '/Users/atharavsingh/Desktop/SANNIDH_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx'
with open(path, 'r') as f:
    content = f.read()

lines = content.split('\n')

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '<div className="flex gap-6 items-start">' in line:
        start_idx = i
    if start_idx != -1 and i > start_idx and '</div>{/* end workspace layout */}' in line:
        end_idx = i
        break

if start_idx == -1 or end_idx == -1:
    print("Could not find bounds")
    sys.exit(1)

replacement = """          {/* ─── NEW MINIMAL HUB & SPOKE COMMAND CENTER ─── */}
          <div className="w-full">
            {activeZone === "command" && (
              <motion.div
                key="command"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex flex-col xl:flex-row gap-6 items-start">
                  
                  {/* Primary Left Column: Active Command Engine */}
                  <div className="flex-1 min-w-0 space-y-8">
                    {/* AI Action Inbox — pending approvals & actual agent results */}
                    <CAActionInbox />

                    {/* Control Tower - Live Metrics */}
                    <motion.div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">Control Tower</h2>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <p className="text-sm text-muted-foreground mr-1">Real-time metrics and status overview</p>
                            <div className="flex flex-wrap items-center gap-2 border-l border-border/50 pl-3">
                               <div className="flex items-center gap-1.5">
                                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                 <span className="text-xs text-green-400 font-medium">Auto-Pilot Active</span>
                               </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading} className="h-8">
                             <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
                             Sync Analytics
                          </Button>
                          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white">
                            Export Report
                          </Button>
                        </div>
                      </div>

                      {/* Dashboard Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {stats.map((stat, i) => {
                          const Icon = stat.icon;
                          return (
                            <motion.div 
                              key={stat.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="bg-card/40 border border-border/50 hover:border-blue-500/30 transition-all rounded-xl p-3 flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                              </div>
                              <div className="flex items-end">
                                <h3 className="text-2xl font-bold text-foreground">
                                  {stat.value === "--" ? <span className="animate-pulse opacity-50">--</span> : stat.value}
                                </h3>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>

                    {/* Daily AI Governance Brief */}
                    <DailyGovernanceBrief />

                    {/* Deep Dive Zones Section replacing the unified massive scroll */}
                    <motion.div className="space-y-4 pt-6 mt-6 border-t border-border/30">
                       <h2 className="text-xl font-bold text-foreground mb-4">Workspace Deep Dives</h2>
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Deep Dive 1: Actionable Client Vault */}
                          <Card className="hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left group">
                             <button onClick={() => setActiveZone('clients')} className="w-full h-full text-left p-5 flex flex-col justify-between group">
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all">
                                      <Users className="w-6 h-6" />
                                    </div>
                                    <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">Portfolio Hub</Badge>
                                  </div>
                                  <h3 className="font-bold text-lg text-foreground mb-1">Client Vault</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">Manage clients, onboard via secure channels, & track precise compliance status globally.</p>
                                </div>
                                <div className="mt-6 flex items-center text-sm font-medium text-indigo-400">
                                   Launch Module <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-all" />
                                </div>
                             </button>
                          </Card>

                          {/* Deep Dive 2: AI Control Settings (External Route) */}
                          <Card className="hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left">
                             <button onClick={() => window.location.href = '/settings/agent-control-center'} className="w-full h-full text-left p-5 flex flex-col justify-between group">
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg group-hover:bg-purple-500/20 group-hover:scale-110 transition-all">
                                      <Bot className="w-6 h-6" />
                                    </div>
                                    <CASectionAgentBadge agentId="GLOBAL_SWARM" className="scale-90 origin-right" />
                                  </div>
                                  <h3 className="font-bold text-lg text-foreground mb-1">AI Swarm Settings</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">Configure autonomy constraints, review orchestrations, and adjust the global engine parameters.</p>
                                </div>
                                <div className="mt-6 flex items-center text-sm font-medium text-purple-400">
                                   Open System Settings <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-all" />
                                </div>
                             </button>
                          </Card>

                          {/* Deep Dive 3: Firm Operations & Billing */}
                          <Card className="hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left">
                             <button onClick={() => setActiveZone('operations')} className="w-full h-full text-left p-5 flex flex-col justify-between group">
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                                      <CreditCard className="w-6 h-6" />
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Analytics</Badge>
                                  </div>
                                  <h3 className="font-bold text-lg text-foreground mb-1">Firm Operations</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">Practice revenue management, automated billing sweeps, and audit support tools.</p>
                                </div>
                                <div className="mt-6 flex items-center text-sm font-medium text-emerald-400">
                                   Launch Module <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-all" />
                                </div>
                             </button>
                          </Card>
                       </div>
                    </motion.div>

                  </div>{/* /Left Column */}

                  {/* Secondary Right Column: Calendars & Live Alerts */}
                  <div className="w-full xl:w-[400px] flex-shrink-0 space-y-6">
                     <StatutoryDeadlineCalendar />
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                       <RegulatoryNewsRuleImpact isRealDashboard={true} apiEndpoint={`${CA_API}/api/v1/regulatory/news`} aiEnabled={true} caId={caId} />
                     </motion.div>
                  </div>{/* /Right Column */}

                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════
                DEEP DIVE: CLIENT VAULT 
                ════════════════════════════════════════════ */}
            {activeZone === "clients" && (
              <motion.div
                key="clients"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 pb-12"
              >
                <div className="flex items-center gap-4 mb-6">
                   <Button variant="ghost" onClick={() => setActiveZone('command')} className="h-9 px-3 gap-2">
                      <ArrowRight className="w-4 h-4 rotate-180" /> Back to Command Center
                   </Button>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-indigo-400 mb-2">Client Vault</h2>
                  <p className="text-sm text-muted-foreground">Manage clients, onboarding, real-time tasks, and compliance health.</p>
                </div>

                <MultiClientMasterHub />
                <TaskFilingManagement isRealDashboard={true} apiEndpoint={`${CA_API}/api/v1/compliance/tasks`} governmentIntegration={true} />
                <ClientDependencyTracker isRealDashboard={true} apiEndpoint={`${CA_API}/api/v1/ca/${caId}/dependencies`} aiEnabled={true} />
              </motion.div>
            )}

            {/* ════════════════════════════════════════════
                DEEP DIVE: FIRM OPERATIONS 
                ════════════════════════════════════════════ */}
            {activeZone === "operations" && (
              <motion.div
                key="operations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 pb-12"
              >
                <div className="flex items-center gap-4 mb-6">
                   <Button variant="ghost" onClick={() => setActiveZone('command')} className="h-9 px-3 gap-2">
                      <ArrowRight className="w-4 h-4 rotate-180" /> Back to Command Center
                   </Button>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-emerald-400 mb-2">Firm Operations</h2>
                  <p className="text-sm text-muted-foreground">Billing, analytics, audit support, and communication logs.</p>
                </div>

                <PracticeBillingPanel />
                <SecureFileSharingPanel />
                <CAAnalyticsPerformance isRealDashboard={true} caId={caId} />
                <Suspense fallback={<div className="h-48 flex items-center justify-center bg-card/10 rounded-xl border animate-pulse text-muted-foreground">Loading Audit Module...</div>}>
                  <AuditInspectionSupport isRealDashboard={true} caId={caId} />
                </Suspense>
              </motion.div>
            )}
          </div>{/* end workspace layout */}"""

lines = lines[:start_idx] + [replacement] + lines[end_idx+1:]

new_content = '\n'.join(lines)
if 'ArrowRight' not in new_content:
    new_content = new_content.replace('import {', 'import {\n  ArrowRight,\n', 1)

with open(path, 'w') as f:
    f.write(new_content)

print("Replaced!")
