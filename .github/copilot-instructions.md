# Copilot Instructions for Sannidh

## Quick Reference

```bash
npm run dev          # Start dev server on port 8000
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all tests
npm run test:watch   # Watch mode

# Single test file:
npx vitest run src/lib/security.test.ts
npx vitest run src/test/auth.test.tsx
```

## Architecture Overview

**Stack**: Vite + React 18 + TypeScript + Supabase + Tailwind + shadcn/ui

### Authentication Layers

The app uses three nested auth providers in `App.tsx`:
1. `AuthProvider` (`src/hooks/use-auth.tsx`) - Supabase session & role management
2. `EnhancedAuthProvider` - Extended auth context
3. `PersonaAuthProvider` (`src/lib/persona-auth-context.tsx`) - Demo/testing personas

**Personas** (user types): `external_ca`, `inhouse_ca`, `ca_firm`, `inhouse_lawyer`, `company_owner`, `admin`  
**Roles** (database): `user`, `manager`, `admin`

Route protection uses both:
- `ProtectedRoute` - checks roles + personas + verification status
- `PersonaRoute` - checks persona only

### Routing

Each persona has a dedicated dashboard under `/dashboards/*`:
- `/dashboards/external-ca/full`, `/dashboards/inhouse-ca`, `/dashboards/ca-firm`, etc.

Legacy routes: `/dashboard`, `/ca-dashboard`, `/admin-dashboard` still exist.

### Supabase Integration

- Client: `@/integrations/supabase/client`
- Types: `@/integrations/supabase/types`
- Edge Functions: `supabase/functions/` (ai-draft, compliance-chat, etc.)

Environment variables required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Preview/Demo Mode

When `VITE_PREVIEW_BYPASS=true`, the app allows local testing without Supabase auth.
See `src/lib/runtime-flags.ts` and `src/lib/local-preview-auth.ts`.

## Key Conventions

### Path Aliases

Always use `@/` prefix for imports:
```typescript
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
```

### Component Styling

Use the `cn()` utility from `@/lib/utils` for conditional classes:
```typescript
import { cn } from "@/lib/utils";
<div className={cn("base-class", isActive && "active-class")} />
```

### UI Components

shadcn/ui components live in `src/components/ui/`. Add new ones via:
```bash
npx shadcn@latest add [component-name]
```

### Tests

- Vitest + React Testing Library + jsdom
- Setup file: `src/test/setup.ts`
- Pattern: `*.test.ts` or `*.test.tsx`
- Contract tests: `*.contract.test.ts` (verify interface contracts)

### Lazy Loading

Pages use React.lazy() for code splitting:
```typescript
const Dashboard = lazy(() => import("./pages/Dashboard"));
```

### Error Tracking

Sentry is initialized in `main.tsx` via `initSentry()`.
