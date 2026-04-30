import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/src/pages/ExternalCADashboardReal.tsx';
let content = readFileSync(filePath, 'utf8');

content = content.replace(/apiEndpoint=`\$\{CA_API\}\/api\/v1\/ca\/tasks`/g, 'apiEndpoint={`\\${CA_API}/api/v1/ca/tasks`}');
content = content.replace(/apiEndpoint=`\$\{CA_API\}\/api\/v1\/ca\/dependencies`/g, 'apiEndpoint={`\\${CA_API}/api/v1/ca/dependencies`}');
content = content.replace(/apiEndpoint=`\$\{CA_API\}\/api\/v1\/ca\/regulatory-news`/g, 'apiEndpoint={`\\${CA_API}/api/v1/ca/regulatory-news`}');
content = content.replace(/apiEndpoint=`\$\{CA_API\}\/api\/v1\/ca`/g, 'apiEndpoint={`\\${CA_API}/api/v1/ca`}');

writeFileSync(filePath, content, 'utf8');
console.log("Fixed JSX template literal braces!");
