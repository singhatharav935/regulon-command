import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx';
let content = readFileSync(filePath, 'utf8');

// Use string replace for safety instead of complex regexes
const removeSubNav = `import CADashboardSubNav, { CADashboardZone } from "@/components/ca-dashboard/CADashboardSubNav";`;
content = content.replace(removeSubNav, '');

const removeActiveZoneState = `const [activeZone, setActiveZone] = useState<CADashboardZone>("command");`;
content = content.replace(removeActiveZoneState, '');

content = content.replace(/<CADashboardSubNav[\s\S]*?\/>/, '');

content = content.replace('<div className="flex gap-8 items-start mt-8">', '');
content = content.replace('<Tabs value={activeZone} onValueChange={(val: any) => setActiveZone(val)} className="flex-1 min-w-0">', '');

// Turn TabsContent into unstyled wrapper or remove completely
content = content.replace(/<TabsContent(?:[^>]*)>/g, '<div className="dashboard-section mb-16">');
content = content.replace(/<\/TabsContent>/g, '</div>');

// Remove the Tabs wrapper closing tags
// Wait we had </Tabs>
content = content.replace('</Tabs>', '');

// We had activeZone === "command" checks. To keep those sections visible, drop the condition.
content = content.replace(/\{activeZone === "command" && \(/g, '{true && (');

// Save the flattened version
writeFileSync(filePath, content, 'utf8');
console.log("Dashboard flattened securely!");
