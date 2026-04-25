# CA Firm Dashboard Phase 5 - Setup Guide

## Quick Start

### 1. File Locations

```
src/
├── hooks/personas/useCAFirmData.ts              # React Query hooks
└── pages/dashboards/phases/CAFirmDashboardFull.tsx    # Main dashboard component
```

### 2. Environment Setup

Ensure your `.env.local` has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### 3. Database Tables

Create the following tables in Supabase:

#### ca_firm_members
```sql
CREATE TABLE ca_firm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firmId UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialization TEXT NOT NULL,
  yearsOfExperience INTEGER,
  hourlyRate DECIMAL(10, 2),
  isAvailable BOOLEAN DEFAULT true,
  utilizationRate DECIMAL(5, 2) DEFAULT 0,
  qualifications TEXT[],
  joinedDate TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_firm_members_firmid ON ca_firm_members(firmId);
CREATE INDEX idx_firm_members_status ON ca_firm_members(status);
```

#### ca_firm_clients
```sql
CREATE TABLE ca_firm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firmId UUID NOT NULL,
  companyName TEXT NOT NULL,
  contactEmail TEXT NOT NULL,
  contactPhone TEXT,
  industry TEXT,
  taxFilingDeadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'onboarding')),
  annualRevenue DECIMAL(15, 2),
  assignedCA UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_firm_clients_firmid ON ca_firm_clients(firmId);
CREATE INDEX idx_firm_clients_status ON ca_firm_clients(status);
```

#### ca_assignments
```sql
CREATE TABLE ca_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firmId UUID NOT NULL,
  caId UUID NOT NULL REFERENCES ca_firm_members(id),
  clientId UUID NOT NULL REFERENCES ca_firm_clients(id),
  assignedDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP,
  hoursPerWeek INTEGER,
  billableRate DECIMAL(10, 2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assignments_firmid ON ca_assignments(firmId);
CREATE INDEX idx_assignments_caid ON ca_assignments(caId);
CREATE INDEX idx_assignments_clientid ON ca_assignments(clientId);
CREATE INDEX idx_assignments_status ON ca_assignments(status);
```

#### ca_firm_invoices
```sql
CREATE TABLE ca_firm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firmId UUID NOT NULL,
  clientId UUID NOT NULL REFERENCES ca_firm_clients(id),
  caId UUID NOT NULL REFERENCES ca_firm_members(id),
  invoiceNumber TEXT NOT NULL UNIQUE,
  amount DECIMAL(12, 2) NOT NULL,
  hoursWorked DECIMAL(8, 2),
  hourlyRate DECIMAL(10, 2),
  issueDate TIMESTAMP NOT NULL,
  dueDate TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_firmid ON ca_firm_invoices(firmId);
CREATE INDEX idx_invoices_clientid ON ca_firm_invoices(clientId);
CREATE INDEX idx_invoices_status ON ca_firm_invoices(status);
```

### 4. Row-Level Security (RLS)

Enable RLS on all tables and create policies:

```sql
-- For ca_firm_members
ALTER TABLE ca_firm_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their firm's members"
  ON ca_firm_members
  FOR SELECT
  USING (firmId = (SELECT company_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "Firm managers can insert members"
  ON ca_firm_members
  FOR INSERT
  WITH CHECK (firmId = (SELECT company_id FROM user_roles WHERE user_id = auth.uid() AND role = 'manager' LIMIT 1));

-- Repeat similar policies for other tables
```

### 5. Import Routes

Add to `src/App.tsx`:

```typescript
import { CAFirmDashboardFull } from "./pages/dashboards/phases/CAFirmDashboardFull";

// In Routes:
<Route
  path="/dashboards/ca-firm/full"
  element={
    <PersonaRoute allowedPersonas={["ca_firm"]}>
      <CAFirmDashboardFull />
    </PersonaRoute>
  }
/>
```

### 6. Test Data

Insert test data for development:

```sql
-- Add test firm
INSERT INTO ca_firm_members (firmId, name, email, specialization, yearsOfExperience, hourlyRate, qualifications, status)
VALUES 
  ('firm-123', 'Alice Smith', 'alice@firm.com', 'Tax', 8, 180, '{"CA","CPA"}', 'active'),
  ('firm-123', 'Bob Johnson', 'bob@firm.com', 'Audit', 5, 150, '{"CA"}', 'active');

INSERT INTO ca_firm_clients (firmId, companyName, contactEmail, industry, taxFilingDeadline, status)
VALUES
  ('firm-123', 'TechCorp Inc', 'contact@techcorp.com', 'Technology', '2024-04-30', 'active'),
  ('firm-123', 'RetailPlus Ltd', 'info@retailplus.com', 'Retail', '2024-03-31', 'active');
```

## Deployment Checklist

- [ ] All Supabase tables created with correct schema
- [ ] RLS policies configured for security
- [ ] Environment variables set in production
- [ ] Components imported in App.tsx routes
- [ ] Build passes without errors (`npm run build`)
- [ ] Test data matches database schema
- [ ] Error handling tested with invalid data
- [ ] Loading states verified
- [ ] Mobile responsiveness checked
- [ ] Toast notifications working
- [ ] Analytics calculations verified

## Common Issues

### "Cannot find module '@/integrations/supabase/client'"
- Ensure Supabase types are generated
- Run: `npm run type:generate` (if available) or regenerate types

### "Table does not exist"
- Verify table names match exactly (case-sensitive)
- Check that tables are created in correct schema (public)
- Ensure Supabase database is initialized

### "RLS policy prevents access"
- Check user role and company_id in user_roles table
- Verify RLS policies allow required operations
- Temporarily disable RLS for testing only

### "Toast notifications not showing"
- Ensure Sonner provider is in root component
- Check that `toast` import is from 'sonner'
- Verify no CSS conflicts with toast styling

## Development Workflow

1. Start dev server: `npm run dev`
2. Open: `http://localhost:5173/dashboards/ca-firm/full`
3. Use PersonaSelector to login as `ca_firm`
4. Test each feature
5. Check browser console for errors
6. Monitor React Query DevTools
7. Test error states by triggering failures

## Production Considerations

1. **Pagination**: Implement for large datasets (>1000 records)
2. **Caching**: Adjust staleTime based on data update frequency
3. **Error Logging**: Send errors to logging service
4. **Analytics**: Track user actions and performance
5. **Backup**: Regular database backups configured
6. **Monitoring**: Set up alerts for failures
7. **Rate Limiting**: Implement API rate limits
8. **Security**: Regular security audits

---

**Ready to Deploy**: ✅
**Version**: 1.0.0
