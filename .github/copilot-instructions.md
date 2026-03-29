# Copilot Instructions for Regulon

## Build & Test Commands

```bash
# Install dependencies
npm install

# Start development server (Vite)
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest run src/lib/workspace-backend.contract.test.ts

# Start the regulatory alert agent
npm run agent:run

# Agent PM2 management
npm run agent:pm2:start
npm run agent:pm2:logs
```

## Architecture

### Frontend (React + Vite + TypeScript)
- **Pages** (`src/pages/`): Route components. Marketing pages use `MarketingOptionPage`, app dashboards are role-specific (`AppDashboard`, `AppCADashboard`, etc.)
- **Components** (`src/components/`): Organized by domain (`auth/`, `ca-dashboard/`, `dashboard/`, `platform/`, `ui/`)
- **Hooks** (`src/hooks/`): Custom hooks including `use-auth.tsx` for auth context
- **UI Library**: shadcn/ui components in `src/components/ui/` — do not modify these directly

### Backend (Supabase Edge Functions)
- **workspace-backend**: Main API edge function with routes for drafting, AI, compliance, and workspace operations
- **ai-draft**: AI document drafting function
- **regulatory-intel-agent**: Regulatory intelligence processing
- **compliance-chat**: Chat-based compliance assistant
- Edge functions are in `supabase/functions/` and use Deno runtime

### Regulatory Alert Agent (`index.js`)
Standalone Express server that scrapes regulatory updates from Indian authorities (CBIC, GST, Income Tax, MCA, SEBI, RBI, eGazette). Runs on port 8787.

### Auth & Access Control
- Supabase Auth with roles (`user`, `manager`, `admin`) and personas (`company_owner`, `external_ca`, `in_house_ca`, `in_house_lawyer`, `ca_firm`, `admin`)
- `ProtectedRoute` component enforces role/persona access on `/app/*` routes
- Verification status tracked separately (`pending`, `approved`, `rejected`)

## Key Conventions

### Path Aliases
Use `@/` for imports from `src/`:
```ts
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
```

### API Response Envelope
Backend responses follow this shape:
```ts
{ ok?: boolean; data?: T; error?: string; error_code?: string; }
```

### Workspace Backend Requests
Use `workspaceBackendRequest` for authenticated API calls — handles token management and retries for AI paths:
```ts
import { workspaceBackendRequest } from "@/lib/workspace-backend";
const result = await workspaceBackendRequest<MyType>("/path", { method: "POST", body: JSON.stringify(data) });
```

### Contract Tests
Files ending in `.contract.test.ts` test API contracts between frontend and backend. Keep these in sync when changing APIs.

### Styling
- Tailwind CSS with `cn()` utility for conditional classes
- Component styling follows shadcn/ui patterns
