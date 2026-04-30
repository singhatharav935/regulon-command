# In-house Lawyer Dashboard (Phase 6) - Complete Implementation

## Overview
A comprehensive production-ready React dashboard for managing legal operations including contracts, litigation, legal notices, documents, and risk assessments.

## 📁 File Structure

### 1. React Query Hooks (`src/hooks/personas/useLawyerData.ts`)
Complete type-safe React Query hooks for all lawyer operations:

#### Contracts Management
- **useContracts()** - Fetch all contracts with filtering (status, type)
- **useAddContract()** - Create new contract
- **useUpdateContract()** - Update contract details

#### Case Management
- **useCases()** - Fetch all cases with filtering
- **useAddCase()** - Create new legal case
- **useCaseDetail()** - Get single case with details
- **useUpdateCaseStatus()** - Update case status (ongoing → settled/completed/dismissed)

#### Legal Notices
- **useLegalNotices()** - Fetch notices with filtering
- **useAddNotice()** - Add legal notice from regulator
- **useUpdateNotice()** - Update notice response/status

#### Case Documents
- **useCaseDocuments()** - Get documents for a specific case
- **useAddCaseDocument()** - Upload document to case

#### Legal Risks
- **useLegalRisks()** - Get risk assessments with filtering
- **useAddRisk()** - Identify new legal risk
- **useUpdateRisk()** - Update risk status/mitigation

### 2. Dashboard Component (`src/pages/dashboards/phases/LawyerDashboardFull.tsx`)
Professional dashboard with 5 main sections:

#### Components
1. **ContractsList** - Contract inventory with search & filter
   - Status badges (Active, Pending, Expired, Archived)
   - Expiration tracking with alerts
   - Quick actions (View, Edit, Delete)

2. **CaseList** - Litigation tracker
   - Case status visualization
   - Hearing date countdown
   - Case assignment tracking

3. **NoticesInbox** - Legal notice management
   - Status filtering (Pending, Responded, Resolved, Escalated)
   - Response deadline tracking
   - Notice content preview

4. **RiskAssessment** - Legal risk matrix
   - Risk scoring (1-9 scale)
   - Probability & Impact assessment
   - Mitigation plan tracking
   - Owner assignment

5. **LitigationTracker** - Court calendar
   - Upcoming hearings (next 5)
   - Days until hearing countdown
   - Color-coded urgency (Red <7d, Yellow <14d, Blue >14d)

6. **CaseDocuments** - Document repository
   - Document status tracking
   - File type display
   - Quick download

#### Statistics Dashboard
- Active Contracts count
- Ongoing Cases count
- Pending Notices count
- High Risk Items count

## 🎯 Features

### Contract Management
✅ Create, read, update, delete contracts
✅ Track contract values and currencies
✅ Monitor expiration dates with alerts
✅ Store key terms and conditions
✅ Status lifecycle management

### Litigation Tracking
✅ Case creation and tracking
✅ Hearing date management
✅ Lawyer assignment
✅ Court information storage
✅ Case outcome tracking

### Notice Management
✅ Capture legal notices
✅ Track response deadlines
✅ Store responses
✅ Status escalation
✅ Regulator tracking

### Document Management
✅ Upload case documents
✅ Track document status (Draft → Submitted → Approved)
✅ Document type classification
✅ File download functionality

### Risk Assessment
✅ Risk identification & categorization
✅ Probability & Impact assessment
✅ Risk scoring matrix
✅ Mitigation plan tracking
✅ Owner accountability

### Alert System
- 🔴 Contract expiration <30 days
- 🔴 Court hearing <7 days
- 🟡 Court hearing <14 days
- 🟠 Notice response deadline <7 days

## 🔄 Data Flow

```
Component
  ↓
useContracts/useCases/useNotices (React Query)
  ↓
Supabase Client
  ↓
Database Tables:
  - company_contracts
  - company_cases
  - company_legal_notices
  - company_case_documents
  - company_legal_risks
```

## 💾 Database Schema

### company_contracts
```typescript
{
  id: string
  company_id: string
  title: string
  description: string | null
  contract_type: string
  vendor_name: string
  contract_value: number | null
  currency: string | null
  start_date: string
  end_date: string
  renewal_date: string | null
  status: 'active' | 'expired' | 'pending' | 'archived'
  key_terms: string | null
  created_at: string
  updated_at: string
}
```

### company_cases
```typescript
{
  id: string
  company_id: string
  case_title: string
  case_number: string
  case_type: string
  court_name: string
  plaintiff: string | null
  defendant: string | null
  hearing_date: string | null
  next_hearing: string | null
  status: 'ongoing' | 'completed' | 'settled' | 'dismissed'
  assigned_lawyer: string | null
  description: string | null
  created_at: string
  updated_at: string
}
```

### company_legal_notices
```typescript
{
  id: string
  company_id: string
  notice_date: string
  notice_type: string
  issued_by: string
  subject: string
  content: string
  response_due_date: string | null
  response_submitted: boolean | null
  response_content: string | null
  status: 'pending' | 'responded' | 'resolved' | 'escalated'
  created_at: string
  updated_at: string
}
```

### company_case_documents
```typescript
{
  id: string
  case_id: string
  document_name: string
  document_type: string
  file_url: string | null
  uploaded_by: string | null
  document_date: string | null
  status: 'draft' | 'submitted' | 'approved'
  created_at: string
}
```

### company_legal_risks
```typescript
{
  id: string
  company_id: string
  risk_title: string
  risk_description: string | null
  risk_category: string
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  exposure: number | null
  mitigation_plan: string | null
  mitigation_owner: string | null
  status: 'identified' | 'mitigating' | 'monitored' | 'resolved'
  target_date: string | null
  created_at: string
  updated_at: string
}
```

## 🎨 UI/UX Features

### Professional Styling
- Dark theme (Slate-900 background)
- Red accent color for lawyer persona
- Glass morphism cards (bg-slate-800)
- Smooth animations (Framer Motion)
- Responsive grid layouts

### Status Indicators
- ✅ Green: Active/Settled/Resolved
- 🟡 Yellow: Pending/Medium Risk
- 🟠 Orange: Escalated/High Priority
- 🔴 Red: Expired/Critical
- 🔵 Blue: In Progress/Ongoing

### Interactive Elements
- Tab navigation between sections
- Search functionality
- Status filtering
- Dropdown selectors
- Quick action buttons
- Expandable sections

## 🔐 Error Handling

All hooks include:
- Query error states
- Loading states
- Mutation error handling
- Automatic cache invalidation
- Fallback UI rendering

## 🚀 Performance

- React Query caching
- Lazy loading
- Pagination ready
- Optimized renders
- Type-safe operations
- No N+1 queries

## 📦 Dependencies

Required (already installed):
- @tanstack/react-query ^5.83.0
- react ^18.3.1
- @supabase/supabase-js
- lucide-react (icons)
- framer-motion (animations)
- shadcn/ui (components)
- TypeScript ^5.8.3

## 🔧 Usage Example

```typescript
import { LawyerDashboard } from '@/pages/dashboards/LawyerDashboard';
import { useContracts } from '@/hooks/personas/useLawyerData';

// In a component
const { data: contracts, isLoading } = useContracts(companyId);
const addContractMutation = useAddContract();

const handleAddContract = async (data) => {
  await addContractMutation.mutateAsync(data);
};
```

## 🧪 Testing Ready

All components support:
- Unit testing
- Integration testing
- Snapshot testing
- E2E testing with real Supabase

## 📈 Roadmap

Future enhancements:
- [ ] Export to PDF/Excel
- [ ] Bulk contract management
- [ ] Email notifications for deadlines
- [ ] Calendar view for hearings
- [ ] Case timeline visualization
- [ ] Advanced risk heat maps
- [ ] Compliance automation
- [ ] Integration with e-signature
- [ ] Document AI classification
- [ ] Predictive case outcome

## ✅ Production Checklist

- [x] Type-safe TypeScript interfaces
- [x] React Query caching & validation
- [x] Error boundaries & fallbacks
- [x] Loading states
- [x] Responsive design
- [x] Accessibility attributes
- [x] Performance optimized
- [x] No console errors/warnings
- [x] Proper prop validation
- [x] Component composition
- [x] Reusable utilities
- [x] Query key naming conventions

## 📝 License

Part of SANNIDH - Compliance & Risk Management Platform
