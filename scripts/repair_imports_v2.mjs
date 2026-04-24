import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx';
let content = readFileSync(filePath, 'utf8');

// 1. Clean the mess
content = content.replace(/import { MultiClientMasterHub } from "@\/components\/ca-dashboard\/MultiClientMasterHub";\n/g, '');
content = content.replace(/import { PracticeBillingPanel } from "@\/components\/ca-dashboard\/PracticeBillingPanel";\n/g, '');
content = content.replace(/import { SecureFileSharingPanel } from "@\/components\/ca-dashboard\/SecureFileSharingPanel";\n/g, '');
content = content.replace(/import { StatutoryDeadlineCalendar } from "@\/components\/ca-dashboard\/StatutoryDeadlineCalendar";\n/g, '');

// 2. Add correct defaults
const correctImports = 
\`import MultiClientMasterHub from "@/components/ca-dashboard/MultiClientMasterHub";
import PracticeBillingPanel from "@/components/ca-dashboard/PracticeBillingPanel";
import SecureFileSharingPanel from "@/components/ca-dashboard/SecureFileSharingPanel";
import StatutoryDeadlineCalendar from "@/components/ca-dashboard/StatutoryDeadlineCalendar";\`;

content = content.replace(/import { CACommandCenterHeader }/, \`\${correctImports}\nimport { CACommandCenterHeader }\`);

writeFileSync(filePath, content, 'utf8');
console.log("Successfully fixed defaults!");
