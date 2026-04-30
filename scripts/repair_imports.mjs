import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/atharavsingh/Desktop/SANNIDH_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx';
let content = readFileSync(filePath, 'utf8');

// Use default imports
const neededImports = [
  'import MultiClientMasterHub from "@/components/ca-dashboard/MultiClientMasterHub";',
  'import PracticeBillingPanel from "@/components/ca-dashboard/PracticeBillingPanel";',
  'import SecureFileSharingPanel from "@/components/ca-dashboard/SecureFileSharingPanel";',
  'import StatutoryDeadlineCalendar from "@/components/ca-dashboard/StatutoryDeadlineCalendar";'
];

neededImports.forEach(imp => {
  // Extract component name from import string
  const compName = imp.split(' ')[1];
  // Remove any named import that might already exist for this compName
  content = content.replace(new RegExp(\`import { \\\\b\${compName}\\\\b } from "@\\\\/components\\\\/ca-dashboard\\\\/\${compName}";\`, 'g'), '');
  
  if (!content.includes(imp)) {
    content = content.replace(/import { CACommandCenterHeader }/, \`\${imp}\nimport { CACommandCenterHeader }\`);
  }
});

// Since I already ran the previous script, and it failed to build, 
// I should first REPAIR the named imports I added.
content = content.replace(/import { MultiClientMasterHub } from "@\/components\/ca-dashboard\/MultiClientMasterHub";/g, '');
content = content.replace(/import { PracticeBillingPanel } from "@\/components\/ca-dashboard\/PracticeBillingPanel";/g, '');
content = content.replace(/import { SecureFileSharingPanel } from "@\/components\/ca-dashboard\/SecureFileSharingPanel";/g, '');
content = content.replace(/import { StatutoryDeadlineCalendar } from "@\/components\/ca-dashboard\/StatutoryDeadlineCalendar";/g, '');

writeFileSync(filePath, content, 'utf8');
console.log("Fixed imports in ExternalCADashboardReal.tsx!");
