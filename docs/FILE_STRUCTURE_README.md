# REGULON Frontend - Complete File Structure Guide

**File Location**: `/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/FILE_STRUCTURE_README.md`

**Last Updated**: April 2026  
**Purpose**: Understand how the frontend codebase is organized and what each directory does

---

## 📁 Directory Tree Overview

```
frontend/
├── src/                          # Main source code
│   ├── assets/                   # Images, logos, icons
│   ├── components/               # Reusable React components
│   ├── config/                   # Configuration files
│   ├── data/                     # Static data, constants
│   ├── hooks/                    # Custom React hooks
│   ├── integrations/             # Third-party integrations
│   ├── lib/                      # Utility functions
│   ├── pages/                    # Page components (Router)
│   ├── services/                 # API services
│   ├── test/                     # Test files & setup
│   ├── types/                    # TypeScript type definitions
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Entry point
├── public/                       # Static files (HTML, favicon)
├── supabase/                     # Supabase configuration & functions
├── dist/                         # Build output (generated)
├── node_modules/                 # Dependencies (npm)
├── vite.config.ts                # Vite bundler config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Project dependencies
├── tailwind.config.ts            # Tailwind CSS config
└── [READMEs & Docs]              # Documentation files
```

---

## 🗂️ Detailed Directory Structure

### **1. `/src` - Main Source Code**

The heart of the application. Contains all React components, logic, and utilities.

#### **1.1 `/src/components` - React Components**

Organized by feature/domain:

```
components/
├── ui/                           # shadcn/ui components (Button, Card, etc.)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ... (20+ UI components)
│
├── auth/                         # Authentication components
│   ├── LoginForm.tsx             # Login page
│   ├── SignupForm.tsx            # Registration page
│   ├── AuthGuard.tsx             # Protected route wrapper
│   └── ProtectedRoute.tsx
│
├── layout/                       # Layout components
│   ├── Header.tsx                # Top navigation bar
│   ├── Sidebar.tsx               # Left sidebar menu
│   ├── Footer.tsx                # Footer
│   └── MainLayout.tsx            # Main page layout
│
├── dashboard/                    # Universal dashboard (landing area)
│   ├── DashboardTypeNav.tsx      # Dashboard selector
│   ├── DashboardHome.tsx         # Dashboard home page
│   └── ... (15+ components)
│
├── external-ca/                  # External CA Dashboard
│   ├── ExternalCADashboard.tsx   # Main view
│   ├── ClientList.tsx            # Client management
│   ├── GSTTracking.tsx           # GST filing tracker
│   └── ... (5+ components)
│
├── ca-dashboard/                 # In-house CA Dashboard
│   ├── CADashboard.tsx           # Main view
│   ├── ComplianceStatus.tsx      # Compliance tracking
│   ├── FileManagement.tsx        # Document management
│   └── ... (15+ components)
│
├── admin-dashboard/              # Admin Panel
│   ├── AdminDashboard.tsx        # Admin main view
│   ├── UserManagement.tsx        # User management
│   ├── Analytics.tsx             # System analytics
│   └── ... (10+ components)
│
├── agents/                       # AI Agent Components
│   ├── ComplianceAgent.tsx       # AI compliance check
│   ├── DraftingAgent.tsx         # AI document generation
│   ├── ReviewAgent.tsx           # AI review tools
│   └── MonitorAgent.tsx          # AI monitoring
│
├── ai-agent/                     # AI Integration
│   ├── AIChat.tsx                # Chat interface
│   ├── AIResponse.tsx            # Response display
│   └── AgentStatus.tsx           # Agent status indicator
│
├── common/                       # Shared components
│   ├── LoadingSpinner.tsx        # Loading UI
│   ├── ErrorBoundary.tsx         # Error handling
│   └── NotFound.tsx              # 404 page
│
└── voice/                        # Voice/Speech components
    └── VoiceInput.tsx            # Voice input feature
```

**What it does**: Contains all UI components used across the app. Organized by feature to make them easy to find.

---

#### **1.2 `/src/pages` - Page Components**

Pages that correspond to routes:

```
pages/
├── dashboards/                   # Different dashboard pages
│   ├── AdminDashboard.tsx        # Admin dashboard page
│   ├── AdminDashboardFull.tsx    # Admin full view
│   ├── CAFirmDashboard.tsx       # CA Firm dashboard
│   ├── InhouseCADashboard.tsx    # In-house CA dashboard
│   ├── OwnerDashboard.tsx        # Company Owner dashboard
│   ├── LawyerDashboard.tsx       # Lawyer dashboard
│   └── phases/                   # Dashboard implementation phases
│       ├── phase1/
│       ├── phase2/
│       └── ... (8 phases)
│
├── LandingPage.tsx               # Home/landing page
├── NotFound.tsx                  # 404 page
└── ProtectedDashboard.tsx        # Route protection wrapper
```

**What it does**: Each file = one page. Routes navigate to these pages.

---

#### **1.3 `/src/hooks` - Custom React Hooks**

Reusable logic extracted from components:

```
hooks/
├── use-auth.tsx                  # Authentication state & methods
├── use-query.tsx                 # Data fetching (TanStack Query)
├── use-state-management.tsx      # Global state management
├── use-toast.tsx                 # Toast notifications
│
└── personas/                     # User type/role hooks
    ├── use-external-ca.tsx       # External CA persona
    ├── use-inhouse-ca.tsx        # In-house CA persona
    ├── use-ca-firm.tsx           # CA Firm persona
    ├── use-company-owner.tsx     # Company Owner persona
    └── use-admin.tsx             # Admin persona
```

**What it does**: Encapsulates reusable logic so components stay simple and DRY.

**Example**: `useAuth()` handles login, logout, session management.

---

#### **1.4 `/src/integrations` - Third-Party Integrations**

```
integrations/
└── supabase/
    ├── client.ts                 # Supabase client initialization
    ├── types.ts                  # Auto-generated types from Postgres
    ├── queries.ts                # Pre-built database queries
    └── auth.ts                   # Supabase auth methods
```

**What it does**: Connects to Supabase (backend database). Centralizes all backend communication.

**Key file**: `client.ts` - imports this in hooks to query data.

---

#### **1.5 `/src/lib` - Utility Functions**

```
lib/
├── utils.ts                      # Helper functions (cn(), debounce, etc.)
├── constants.ts                  # App constants, enums
├── validators.ts                 # Form validation logic
├── formatters.ts                 # Date, currency, number formatting
├── security.ts                   # Security utilities (encryption, hashing)
│
├── api/                          # API calling functions
│   ├── gst.ts                    # GST API calls
│   ├── compliance.ts             # Compliance API calls
│   ├── analytics.ts              # Analytics API calls
│   └── government.ts             # Government portal APIs
│
├── auth/                         # Auth-related utilities
│   ├── jwt.ts                    # JWT handling
│   ├── permissions.ts            # Role/permission checks
│   └── session.ts                # Session management
│
├── runtime-flags.ts              # Feature flags (preview mode, etc.)
├── local-preview-auth.ts         # Local testing without Supabase
└── persona-auth-context.tsx      # Demo persona management
```

**What it does**: Contains pure functions and utilities used throughout the app. No React logic here.

**Example**: `cn()` combines CSS classes, `formatCurrency()` converts numbers to ₹ format.

---

#### **1.6 `/src/services` - API Services**

```
services/
├── auth-service.ts               # Login, logout, registration
├── gst-service.ts                # GST filing operations
├── compliance-service.ts         # Compliance checking
├── government-service.ts         # Government portal integration
├── analytics-service.ts          # Usage analytics
├── ai-service.ts                 # AI agent operations
└── notification-service.ts       # Email/SMS notifications
```

**What it does**: Wraps API calls and backend logic. Makes components cleaner by hiding HTTP details.

**Example**: Instead of fetch() in component, call `authService.login(email, password)`.

---

#### **1.7 `/src/types` - TypeScript Definitions**

```
types/
├── index.ts                      # Main type exports
├── user.ts                       # User, Persona, Role types
├── compliance.ts                 # Compliance data types
├── gst.ts                        # GST filing types
├── ai.ts                         # AI agent types
└── api.ts                        # API response/request types
```

**What it does**: Defines TypeScript interfaces and types for type safety across the app.

**Example**: 
```typescript
interface User {
  id: string;
  name: string;
  persona: "external_ca" | "inhouse_ca" | "company_owner";
  role: "user" | "manager" | "admin";
}
```

---

#### **1.8 `/src/data` - Static Data**

```
data/
├── menu-items.ts                 # Navigation menu items
├── form-fields.ts                # Form field configurations
├── regulatory-rules.ts           # GST/IT compliance rules
├── compliance-checklist.ts       # Pre-filled checklists
└── mock-data.ts                  # Demo/testing data
```

**What it does**: Static data used to configure UI (menus, dropdowns, etc.).

---

#### **1.9 `/src/config` - Configuration Files**

```
config/
├── routes.ts                     # Route definitions
├── supabase.ts                   # Supabase config
├── auth.ts                       # Auth configuration
└── theme.ts                      # App theme (colors, fonts)
```

**What it does**: Centralizes all configuration in one place. Easier to change without touching code.

---

#### **1.10 `/src/assets` - Static Media**

```
assets/
├── images/                       # PNG, JPG images
├── icons/                        # SVG icons
├── logos/                        # Logo files
└── fonts/                        # Custom fonts (if any)
```

**What it does**: Stores all images and icons. Referenced in components.

---

#### **1.11 `/src/test` - Test Files**

```
test/
├── setup.ts                      # Test environment setup
├── test-utils.ts                 # Testing helpers
├── fixtures/                     # Mock data for tests
└── integration/                  # Integration tests
    ├── auth.test.tsx
    ├── gst.test.tsx
    └── compliance.test.tsx
```

**What it does**: Tests for components, functions, and integrations. Run with `npm run test`.

---

#### **1.12 `/src/App.tsx` - Root Component**

```typescript
// Main app component
// Wraps all providers and routes
// Sets up: Auth, Theme, Router, Global State
```

**What it does**: The root component of the entire app. Sets up all providers and routing.

---

#### **1.13 `/src/main.tsx` - Entry Point**

```typescript
// React app starts here
// Mounts App.tsx to the DOM
// Initializes Sentry, theme, etc.
```

**What it does**: The first file React runs. Mounts the app to `<div id="root">` in index.html.

---

### **2. `/public` - Static Assets**

```
public/
├── index.html                    # Main HTML file
├── favicon.ico                   # Browser tab icon
├── robots.txt                    # SEO for search engines
└── ... (other static files)
```

**What it does**: Files served as-is without processing. Updated by Vite during build.

---

### **3. `/supabase` - Backend Configuration**

```
supabase/
├── functions/                    # Supabase Edge Functions (backend logic)
│   ├── ai-draft/                 # AI drafting function
│   ├── compliance-chat/          # Compliance chatbot function
│   ├── gst-calculator/           # GST calculation function
│   └── ... (15+ functions)
│
├── migrations/                   # Database migrations (schema changes)
├── seed.sql                      # Initial database data
└── config.json                   # Supabase project config
```

**What it does**: Supabase backend configuration. Edge functions run on the server.

---

### **4. Configuration Files (Root Level)**

| File | Purpose |
|------|---------|
| `package.json` | Project dependencies & npm scripts |
| `tsconfig.json` | TypeScript configuration |
| `tsconfig.app.json` | App-specific TS config |
| `vite.config.ts` | Vite bundler (build tool) config |
| `vitest.config.ts` | Vitest testing config |
| `tailwind.config.ts` | Tailwind CSS config |
| `postcss.config.js` | CSS processing config |
| `.env` | Environment variables (secret) |
| `.env.example` | Example env variables (public) |
| `.gitignore` | Files to ignore in Git |
| `eslint.config.js` | Code linting rules |

---

## 🔄 How Files Connect

### **User Login Flow**

```
index.html
    ↓
main.tsx (mount App.tsx)
    ↓
App.tsx (wrap providers)
    ↓
pages/LandingPage.tsx (show login form)
    ↓
components/auth/LoginForm.tsx (render form)
    ↓
lib/api/auth.ts (call login API)
    ↓
services/auth-service.ts (handle auth)
    ↓
integrations/supabase/auth.ts (call Supabase)
    ↓
supabase backend (authenticate user)
    ↓
hooks/use-auth.tsx (store session)
    ↓
pages/dashboards/*/Dashboard.tsx (show dashboard)
```

### **Component Rendering**

```
pages/dashboards/OwnerDashboard.tsx (page)
    ↓
components/dashboard/DashboardHome.tsx (layout)
    ↓
components/dashboard/GSTWidget.tsx (component)
    ↓
hooks/use-query.tsx (fetch data)
    ↓
services/gst-service.ts (format request)
    ↓
integrations/supabase/queries.ts (query database)
    ↓
PostgreSQL database (return data)
    ↓
Back to component (display data)
```

---

## 📊 Component Organization by Feature

### **External CA Dashboard**
- Pages: `pages/dashboards/phases/phase3/ExternalCAFull.tsx`
- Components: `components/external-ca/*`
- Hooks: `hooks/personas/use-external-ca.tsx`
- Services: `services/gst-service.ts`, `services/compliance-service.ts`

### **Company Owner Dashboard**
- Pages: `pages/dashboards/OwnerDashboard.tsx`
- Components: `components/dashboard/*`, `components/agents/*`
- Hooks: `hooks/personas/use-company-owner.tsx`
- Services: `services/analytics-service.ts`, `services/ai-service.ts`

### **In-House CA Dashboard**
- Pages: `pages/dashboards/InhouseCADashboard.tsx`
- Components: `components/ca-dashboard/*`
- Hooks: `hooks/personas/use-inhouse-ca.tsx`
- Services: `services/compliance-service.ts`, `services/file-management.ts`

### **Admin Dashboard**
- Pages: `pages/dashboards/AdminDashboardFull.tsx`
- Components: `components/admin-dashboard/*`
- Hooks: `hooks/personas/use-admin.tsx`
- Services: `services/analytics-service.ts`, `services/user-management.ts`

---

## 🎨 Styling & Theme

**Tailwind CSS**: Utility classes in JSX
```tsx
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Content
</div>
```

**shadcn/ui**: Pre-built components
```tsx
import { Button } from "@/components/ui/button";
<Button onClick={handleClick}>Click me</Button>
```

**Custom CSS**: In `src/assets/` if needed

---

## 🧪 Testing Files

Tests are co-located with source code (same directory):

```
src/
├── lib/
│   ├── utils.ts
│   └── utils.test.ts             ← Tests for utils
│
├── hooks/
│   ├── use-auth.tsx
│   └── use-auth.test.tsx         ← Tests for hook
│
└── test/
    └── integration/              ← Integration tests
        └── gst.test.tsx
```

**Run tests**: `npm run test` or `npm run test:watch`

---

## 📦 Build Output

After running `npm run build`:

```
dist/
├── index.html                    # Minified HTML
├── assets/                       # Bundled JS/CSS/images
│   ├── index-abc123.js          # Main app bundle
│   ├── vendor-xyz789.js         # Dependencies bundle
│   └── style-def456.css         # Styles bundle
└── ... (other generated files)
```

**What it does**: Vite bundles all source code into optimized production files.

---

## 🔐 Environment Variables

**`.env` file** (secret, not committed):
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=xxx
VITE_API_URL=https://api.example.com
```

**`.env.example` file** (public template):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
VITE_API_URL=your_api_url
```

---

## 🚀 Key Scripts

From `package.json`:

```bash
npm run dev           # Start dev server (http://localhost:8000)
npm run build         # Build for production
npm run preview       # Preview production build locally
npm run lint          # Run ESLint to check code quality
npm run test          # Run all tests
npm run test:watch    # Watch mode for development
npm run type-check    # Check TypeScript errors
```

---

## 📝 File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `LoginForm.tsx`, `UserCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.tsx`, `useQuery.tsx` |
| Services | camelCase with `-service` suffix | `auth-service.ts`, `gst-service.ts` |
| Utilities | camelCase | `utils.ts`, `validators.ts` |
| Types | PascalCase with `.ts` | `user.ts`, `compliance.ts` |
| Tests | Original name + `.test.ts` | `utils.test.ts`, `auth.test.tsx` |

---

## 🎯 Quick Navigation

**Want to add a new feature?**
1. Create component in `/src/components/[feature]/`
2. Create page in `/src/pages/` if needed
3. Add route in `/src/config/routes.ts`
4. Add service in `/src/services/[feature]-service.ts`
5. Add hook in `/src/hooks/` if complex logic
6. Add types in `/src/types/[feature].ts`

**Want to add authentication?**
- Modify: `hooks/use-auth.tsx`, `services/auth-service.ts`, `components/auth/*`

**Want to connect to a new API?**
- Create: `services/[api-name]-service.ts`
- Add queries in: `integrations/supabase/queries.ts`
- Call from component via hook

**Want to update styling?**
- Edit: `tailwind.config.ts` for theme changes
- Update components with new Tailwind classes
- Or modify `src/assets/` for custom CSS

---

## 📚 File Size Reference

| Directory | Purpose | Size |
|-----------|---------|------|
| `/src/components` | React components | 500+ KB |
| `/src/pages` | Page routes | 200+ KB |
| `/src/lib` | Utilities | 100+ KB |
| `/src/hooks` | Custom hooks | 50+ KB |
| `/src/services` | API wrappers | 100+ KB |
| `/node_modules` | Dependencies | 500+ MB (installed) |

---

## ✅ File Structure Checklist

- [x] Components organized by feature
- [x] Pages match routes
- [x] Hooks encapsulate logic
- [x] Services wrap API calls
- [x] Types define interfaces
- [x] Utils for shared functions
- [x] Config centralized
- [x] Tests co-located
- [x] Assets organized
- [x] Environment variables in .env

---

## 🎓 Learning Path for New Developers

1. **Read**: This file (you are here!)
2. **Look at**: `/src/App.tsx` to understand app structure
3. **Check**: `/src/main.tsx` to see entry point
4. **Explore**: `/src/pages/dashboards/` to see page examples
5. **Examine**: `/src/components/auth/` for a complete feature
6. **Review**: `/src/hooks/use-auth.tsx` for hook examples
7. **Test**: `npm run dev` and navigate the app
8. **Clone**: Existing component pattern for new features

---

## 🔗 Related Documentation

- **`DEMO_VIDEO_SCRIPT.md`** - What each feature does
- **`COMPREHENSIVE_TECH_README.md`** - Tech stack choices
- **`AI_AGENTS_ARCHITECTURE.md`** - AI agent implementation
- **`TECH_STACK_SIMPLE.md`** - Tech stack by section
- **`GOVERNMENT_INTEGRATION.md`** - Government portal connection

---

## 📞 Quick Answers

**Q: Where do I add a new page?**  
A: Create file in `src/pages/` and add route in `src/config/routes.ts`

**Q: Where do I add a new component?**  
A: Create in `src/components/[feature]/`

**Q: Where do I call an API?**  
A: Create service in `src/services/` and call from hook or component

**Q: Where do I store data?**  
A: Query PostgreSQL via Supabase in `integrations/supabase/queries.ts`

**Q: How do I test?**  
A: Create `.test.ts` or `.test.tsx` file next to source file, run `npm run test`

**Q: Where are constants?**  
A: Store in `src/lib/constants.ts` or `src/data/`

**Q: How do I handle authentication?**  
A: Use `hooks/use-auth.tsx` and `services/auth-service.ts`

**Q: Where do I add environment variables?**  
A: Add to `.env` file, reference in code via `import.meta.env.VITE_*`

---

**Last Updated**: April 2026  
**Maintained By**: Development Team  
**Version**: 1.0
