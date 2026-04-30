import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx';
let content = readFileSync(filePath, 'utf8');

// 1. Fix the provider import
content = content.replace(/CAAgentOrchestratorProvider/g, 'CAAgentProvider');

// 2. Add useCAIdentity hook import if it doesn't exist
if (!content.includes('useCAIdentity')) {
  // Find the first hook import layout and insert it
  content = content.replace(
    /import { useNavigate } from "react-router-dom";/,
    'import { useNavigate } from "react-router-dom";\nimport { useCAIdentity } from "@/hooks/useCAIdentity";'
  );
}

// 3. Inject useCAIdentity into the component body and replace 'ca-001' strings
// The component is `const ExternalCADashboardReal = () => {`
// Let's insert the hook inside the component
if (!content.includes('const { caId, caFirmId, isLoading: identityLoading } = useCAIdentity();')) {
  content = content.replace(
    /const ExternalCADashboardReal = \(\) => {/,
    `const ExternalCADashboardReal = () => {\n  const { caId, caFirmId, isLoading: identityLoading } = useCAIdentity();`
  );
  
  // Replace caId="ca-001" with caId={caId}
  content = content.replace(/caId="ca-001"/g, 'caId={caId}');
  content = content.replace(/caId=\{'ca-001'\}/g, 'caId={caId}');
  // Update hardcoded API urls to use caId template vars
  content = content.replace(/http:\/\/localhost:8001\/api\/v1\/ca\/ca-001\/tasks/g, '`${CA_API}/api/v1/ca/tasks`');
  content = content.replace(/http:\/\/localhost:8001\/api\/v1\/ca\/ca-001\/dependencies/g, '`${CA_API}/api/v1/ca/dependencies`');
  
  // Update Regulatory News url
  content = content.replace(/"http:\/\/localhost:8001\/api\/v1\/regulatory\/news"/g, '`${CA_API}/api/v1/ca/regulatory-news`');
  
  // Replace direct compliance CA calls 
  content = content.replace(/"http:\/\/localhost:8001\/api\/v1\/ca"/g, '`${CA_API}/api/v1/ca`');
}

writeFileSync(filePath, content, 'utf8');
console.log("Restored ExternalCADashboardReal to Head and patched identities");
