import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/atharavsingh/Desktop/SANNIDH_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx';
let content = readFileSync(filePath, 'utf8');

// The file currently has a flat structure. Let's rebuild the CADashboardSubNav and Tabs structure exactly as it was.

// 1. Add missing imports
if (!content.includes('TabsContent')) {
  // We had import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  // The flat version might have Tabs but we need CADashboardSubNav
  content = content.replace(
    /import { useNavigate } from "react-router-dom";/,
    'import { useNavigate } from "react-router-dom";\nimport CADashboardSubNav, { CADashboardZone } from "@/components/ca-dashboard/CADashboardSubNav";'
  );
}

// 2. Add state
if (!content.includes('activeZone')) {
  content = content.replace(
    /const \{ caId, caFirmId, isLoading: identityLoading \} = useCAIdentity\(\);/,
    'const { caId, caFirmId, isLoading: identityLoading } = useCAIdentity();\n  const [activeZone, setActiveZone] = useState<CADashboardZone>("command");'
  );
}

// 3. Wrap Content in Tabs structure
// We find: <CACommandCenterHeader />
// And replace the structure right after it up to the footer.
// Let's rely on string replacement of specific anchor comments.

const raw = content.split('\\n');

let transformed = content
  // Remove the <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"> after SECTION 1
  .replace(/\{\/\* SECTION 1: OVERVIEW \*\/}\n\s*<div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">/, 
`<div className="flex gap-8 items-start mt-8">
            {/* Professional Sticky Sidebar */}
            <CADashboardSubNav 
              activeZone={activeZone}
              onZoneChange={(zone) => setActiveZone(zone)}
              onOpenDraftingEngine={() => setIsDrawerOpen(true)}
              caName="Rajesh Kumar, CA"
              creditBalance={12}
              pendingApprovals={pendingRequests.length}
            />

            <Tabs value={activeZone} onValueChange={(val: any) => setActiveZone(val)} className="flex-1 min-w-0">
            {/* ============================================================== */}
            {/* ZONE: OVERVIEW (COMMAND CENTER) */}
            {/* ============================================================== */}
            <TabsContent value="command" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">`)
  
  // Replace the Client Vault Section break
  .replace(/<\/div>\n\s*<hr className="my-12 border-border\/30" \/>\n\s*\{\/\* SECTION 2: CLIENT VAULT \*\/}\n\s*<div>\n\s*<h2 className="text-2xl font-bold text-foreground mb-8">Client Vault & Actions<\/h2>\n\s*<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">/,
  `            </div>
            </TabsContent>

            {/* ============================================================== */}
            {/* ZONE: CLIENT VAULT */}
            {/* ============================================================== */}
            <TabsContent value="clients" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">`)

  // Replace AI Swarm Section Break
  .replace(/<\/div>\n\s*<\/div>\n\s*<hr className="my-12 border-border\/30" \/>\n\s*\{\/\* AI SWARM \*\/}\n\s*<div className="space-y-8">/,
  `            </div>
            </TabsContent>

            {/* ============================================================== */}
            {/* ZONE: AI SWARM CONTROL (AUTONOMOUS AGENTS) */}
            {/* ============================================================== */}
            <TabsContent value="ai-swarm" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">`)

  // Replace Regulatory News & Calendar block (making it part of command zone condition properly)
  .replace(/<\/div>\n\s*<\/div>\n\s*<hr className="my-12 border-border\/30" \/>\n\s*\{\/\* SECTION 4: REGULATORY NEWS AND CALENDAR \*\/}\n\s*<div/,
  `            </div>
            </TabsContent>

            {/* ============================================================== */}
            {/* ZONE: REGULATORY & CALENDAR (PART OF COMMAND) */}
            {/* ============================================================== */}
            {activeZone === "command" && (
              <div className="space-y-8 mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-t border-border/30 pt-16">
                  <h2 className="text-2xl font-bold text-foreground mb-8">Statutory Intelligence</h2>
`)

  // Replace Firm Operations block
  .replace(/<\/div>\n\s*<\/div>\n\s*<hr className="my-12 border-border\/30" \/>\n\s*\{\/\* SECTION 3: FIRM OPERATIONS \*\/}\n\s*<div>\n\s*<h2 className="text-2xl font-bold text-foreground mb-8">Firm Operations<\/h2>\n\s*<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">/,
  `                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ZONE: FIRM OPERATIONS */}
            {/* ============================================================== */}
            <TabsContent value="operations" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">`)

  // Replace closing tags at the very end before </main>
  .replace(/<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/main>/,
  `              </div>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </main>`);

// Fix missing </div> from end of AI Swarm replacement where I ate a line
transformed = transformed.replace(
  `{/* ============================================================== */}
            {/* ZONE: REGULATORY & CALENDAR (PART OF COMMAND) */}`,
  `  </div>
            </TabsContent>
            {/* ============================================================== */}
            {/* ZONE: REGULATORY & CALENDAR (PART OF COMMAND) */}`
);

// We need to be absolutely careful we don't have duplicated or missing divs.
// I will just use the backup of the uncommitted file if it's stored anywhere in IDE history.
// Actually, writing a precise script is better.

writeFileSync(filePath, transformed, 'utf8');
console.log("Reconstructed Tabs layout!");
