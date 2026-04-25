# Admin Dashboard (Phase 8) - Complete Implementation

## Overview
The Admin Dashboard (Phase 8) is a comprehensive system administration interface built with React, TypeScript, and React Query. It provides complete control over users, companies, roles, audit trails, system settings, and health monitoring.

## Architecture

### Files Created

#### 1. API Layer
**File**: `src/lib/api/personas/admin-api.ts`

Core API client for admin operations using Supabase. Includes interfaces and methods for:
- **Admin Users**: CRUD operations for admin accounts
- **Company Registry**: Company management and registration
- **User Roles**: Role assignment and management
- **Audit Logs**: System activity tracking with filters
- **System Settings**: Configuration management
- **System Health**: Health metrics recording and retrieval

**Exported Types**:
```typescript
- AdminUser
- CompanyRegistryRecord
- UserRoleAssignment
- SystemAuditLog
- SystemSetting
- SystemHealthMetric
```

#### 2. React Query Hooks
**File**: `src/hooks/personas/useAdminData.ts`

Complete set of React Query hooks with automatic caching, error handling, and toast notifications:

**Admin Users**:
- `useAdminUsers()` - List all admin users (5min cache)
- `useAddAdminUser()` - Create new admin user
- `useUpdateAdminUser()` - Update admin user
- `useDeleteAdminUser()` - Delete admin user

**Companies**:
- `useCompanyRegistry()` - List all companies (5min cache)
- `useAddCompany()` - Register new company
- `useUpdateCompany()` - Update company details

**Roles**:
- `useUserRoles(userId?)` - Get role assignments (5min cache)
- `useAssignUserRole()` - Assign role to user
- `useUpdateUserRole()` - Update role assignment
- `useRemoveUserRole()` - Remove role assignment

**Audit Logs**:
- `useAuditLogs(filters?)` - Get audit logs with filters (2min cache)
- `useCreateAuditLog()` - Create new audit log entry

**System Settings**:
- `useSystemSettings()` - Get all settings (10min cache)
- `useSystemSetting(key)` - Get single setting
- `useUpdateSystemSetting()` - Update setting value

**System Health**:
- `useSystemHealth()` - Get health metrics (1min cache, auto-refresh)
- `useHealthMetric(name)` - Get specific health metric
- `useRecordHealthMetric()` - Record new health metric

#### 3. Dashboard Component
**File**: `src/pages/dashboards/AdminDashboardFull.tsx`

Full-featured admin dashboard with 1356 lines of React components:

**Components**:
1. **UserManagement** - Admin user list with CRUD operations
   - Search by email/name
   - Filter by role (Super Admin, Admin, Moderator)
   - Edit and delete users
   - Status management

2. **CompanyManagement** - Company registry
   - Search and filter by status
   - Company registration form
   - Edit company details
   - View detailed company information

3. **RoleAssignment** - User role management
   - View all role assignments
   - Assign roles to users
   - Remove role assignments
   - Expiration date tracking

4. **AuditLog** - System audit trail
   - Filter by resource type and status
   - View 50 most recent logs
   - Track user actions with IP addresses
   - Success/failure status indicators

5. **SystemSettings** - Configuration editor
   - View all system settings
   - Edit setting values
   - Type-aware value management

6. **HealthMonitor** - System health dashboard
   - Real-time health metrics
   - Visual status indicators (healthy, warning, critical)
   - Threshold tracking
   - Auto-refresh every minute

## Features

### User Management
- Create admin accounts with specific roles
- Update user information and status
- Suspend or deactivate users
- Search and filter functionality

### Company Management
- Register new companies with full information
- Track company status (active, inactive, suspended)
- Store regulatory identifiers (CIN, TAN)
- Manage contact information

### Role-Based Access Control
- Assign multiple roles to users
- Track role assignment history
- Support role expiration
- Quick role removal

### Audit Trail
- Log all system activities
- Track user actions with timestamps
- Filter by resource type, status
- Error message tracking
- IP address logging

### System Configuration
- Manage system-wide settings
- Edit configuration values
- Type safety for setting values
- Persistent storage in database

### Health Monitoring
- Real-time system metrics
- Warning/Critical thresholds
- Auto-refreshing data (1-minute interval)
- Visual status indicators

## Usage

### Basic Setup

1. **Import the dashboard**:
```typescript
import { AdminDashboardFull } from '@/pages/dashboards/AdminDashboardFull';
```

2. **Add to routing** (in App.tsx):
```typescript
<Route path="/dashboards/admin" element={<AdminDashboardFull />} />
```

3. **Ensure user is authenticated** as admin persona

### Using Hooks

```typescript
import { useAdminUsers, useAddAdminUser } from '@/hooks/personas/useAdminData';

function MyComponent() {
  const { data: users, isLoading } = useAdminUsers();
  const addUserMutation = useAddAdminUser();

  const handleAddUser = (userData) => {
    addUserMutation.mutate(userData);
  };

  if (isLoading) return <div>Loading...</div>;
  return <div>{users.map(u => u.email)}</div>;
}
```

### Filtering Audit Logs

```typescript
const { data: logs } = useAuditLogs({
  userId: 'user-123',
  resourceType: 'admin_users',
  status: 'failure',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

## Database Schema

The Admin Dashboard expects the following Supabase tables:

### admin_users
```sql
- id (uuid, primary key)
- email (text)
- full_name (text)
- role (enum: super_admin, admin, moderator)
- status (enum: active, suspended, inactive)
- permissions (jsonb array)
- last_login (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

### company_registry
```sql
- id (uuid, primary key)
- company_name (text)
- registration_number (text)
- cin (text, optional)
- tan (text, optional)
- status (enum: active, inactive, suspended)
- industry (text)
- employees_count (integer)
- contact_email (text)
- contact_phone (text)
- address (text)
- registered_date (date)
- created_at (timestamp)
- updated_at (timestamp)
```

### user_role_assignments
```sql
- id (uuid, primary key)
- user_id (uuid)
- role (enum: super_admin, admin, moderator, user)
- assigned_by (text)
- assigned_at (timestamp)
- expires_at (timestamp, optional)
```

### system_audit_logs
```sql
- id (uuid, primary key)
- user_id (uuid)
- action (text)
- resource_type (text)
- resource_id (text)
- changes (jsonb)
- ip_address (inet)
- status (enum: success, failure)
- error_message (text, optional)
- timestamp (timestamp)
```

### system_settings
```sql
- id (uuid, primary key)
- key (text, unique)
- value (text)
- type (enum: string, number, boolean, json)
- description (text)
- is_public (boolean)
- updated_by (text)
- updated_at (timestamp)
```

### system_health_metrics
```sql
- id (uuid, primary key)
- metric_name (text)
- metric_value (numeric)
- threshold_warning (numeric)
- threshold_critical (numeric)
- status (enum: healthy, warning, critical)
- unit (text)
- measured_at (timestamp)
```

## Security Features

1. **Persona Authentication**: Only admin users can access the dashboard
2. **Role-Based Access**: Different permission levels (super_admin, admin, moderator)
3. **Audit Trail**: All changes logged with user identification
4. **User Status Management**: Suspend/deactivate accounts
5. **Error Tracking**: Failed actions recorded with error messages

## Performance Optimizations

1. **React Query Caching**:
   - Admin users: 5 minutes
   - Company registry: 5 minutes
   - User roles: 5 minutes
   - Audit logs: 2 minutes
   - System settings: 10 minutes
   - System health: 1 minute (auto-refresh)

2. **Query Invalidation**: Automatic cache invalidation on mutations

3. **Pagination**: Audit logs limited to 50 most recent entries displayed

4. **Search & Filter**: Client-side filtering for responsive UX

## Styling

- **Theme**: Dark mode (slate-900 to black gradient)
- **Components**: shadcn/ui components with Tailwind CSS
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React icons

## Error Handling

All mutations include:
- Loading state with spinner
- Success toast notifications
- Error toast notifications with messages
- Query cache invalidation on success

## Future Enhancements

1. Batch operations for user management
2. Export audit logs to CSV/PDF
3. Advanced filtering and date range pickers
4. User activity heatmaps
5. System performance analytics
6. Custom alert thresholds
7. Webhook integrations for audit events
8. Role templates and presets
9. Two-factor authentication management
10. API key management for admins

## Dependencies

- `@tanstack/react-query`: ^5.83.0
- `@supabase/supabase-js`: Latest
- React 18+
- TypeScript 4.5+
- Tailwind CSS
- Framer Motion
- shadcn/ui
- Lucide React

## Testing

Example test structure (to be implemented):

```typescript
describe('AdminDashboardFull', () => {
  test('renders admin dashboard with tabs', () => {
    // Test implementation
  });

  test('adds new admin user', () => {
    // Test implementation
  });

  test('filters users by role', () => {
    // Test implementation
  });

  test('displays audit logs with filters', () => {
    // Test implementation
  });
});
```

## Troubleshooting

### No data showing up?
- Verify Supabase tables exist with correct schema
- Check user has admin persona
- Verify network requests in browser DevTools

### Mutations not working?
- Check Supabase RLS policies allow operations
- Verify authentication context is providing user
- Check toast notifications for error messages

### Performance issues?
- Adjust cache times based on data change frequency
- Consider pagination for large datasets
- Monitor React Query DevTools for duplicate queries

## Support

For issues or questions about the Admin Dashboard Phase 8:
1. Check database schema matches expectations
2. Review React Query DevTools for query state
3. Check browser console for error messages
4. Verify Supabase RLS policies are configured
