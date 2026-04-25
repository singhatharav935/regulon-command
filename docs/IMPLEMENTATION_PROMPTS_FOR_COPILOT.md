# Implementation Prompts for Copilot - External CA Dashboard 100% Build

Use these prompts to give to Copilot AI to build each phase. Copy & paste each prompt to Copilot and it will implement the code.

---

## PHASE 1: COMPLETE 19 PROMPTS (Copy & Paste These Prompts to Copilot)

### PROMPT 1.1: Build GSTR-2B Auto-Download & Reconciliation

```
TASK: Build GSTR-2B auto-download and reconciliation feature for External CA Dashboard

REQUIREMENTS:
1. Create GST portal OAuth2 integration module
   - Accept GSTR (username/password for now, future OAuth2)
   - Store credentials encrypted in database (AES-256)
   - Implement GSTR portal login simulation (mock for now)

2. Build GSTR-2B data parser
   - Parse GSTR-2B response: supplier invoices (date, amount, tax, HSN)
   - Extract: Invoice number, supplier GSTIN, date, taxable value, CGST, SGST, IGST
   - Validate: GST calculation (CGST + SGST = 18% OR IGST = 5%)

3. Create reconciliation engine
   - Compare GSTR-2B invoices (what supplier sent) with GSTR-1 (what we sent)
   - Highlight discrepancies: Missing in 1, extra in 2B, amount mismatch, tax mismatch
   - Generate reconciliation report: Summary of matches, discrepancies, action items

4. Build API endpoints
   - POST /api/gstr/2b/sync - Trigger GSTR-2B download
   - GET /api/gstr/2b/data/{client_id} - Get reconciliation report
   - GET /api/gstr/2b/discrepancies/{client_id} - List all discrepancies

5. Frontend components
   - GSTR-2B sync button, loading state, last sync timestamp
   - Reconciliation report display (table with matches/discrepancies)
   - Export report as PDF/Excel

IMPLEMENTATION APPROACH:
- Use existing Supabase schema, add gstr_2b_data table
- Build middleware for encrypted credential storage
- Create comparison algorithm for reconciliation
- Add error handling for failed portal access

TEST WITH:
- 3 real GSTR-2B files with known discrepancies
- Verify accuracy of reconciliation matches
- Test PDF export functionality
```

### PROMPT 1.2: Build Form 16, 24Q, 27Q Generation

```
TASK: Build Form 16 (salary), Form 24Q (TDS), Form 27Q (GST TDS) generation

REQUIREMENTS:
1. Form 16 Generation (Salary Certificate)
   - Input: Employee list with annual salary, TDS deducted, tax regime
   - Output: PDF Form 16 per employee
   - Fields: Employee name, PAN, CA name, TAN, deductee details, certification
   - Validation: PAN format (10 chars), TAN format (10 chars), salary logic
   - Signature block: For CA digital signature

2. Form 24Q Generation (TDS Certificate - Income)
   - Input: Quarterly TDS deposit data (Q1/Q2/Q3/Q4)
   - Fields: Deductee PAN, TAN, quarter, amount deducted, deposited
   - Consolidate: Annual 24Q from 4 quarterly entries
   - Export: PDF, editable Excel

3. Form 27Q Generation (TDS Certificate - GST)
   - Input: GST TDS data (reverse charge, input tax credit)
   - Fields: Deductee GSTIN, TAN, quarter, amount, certificate
   - Validation: GSTIN format, amount logic

IMPLEMENTATION APPROACH:
- Create form template engine using PDFKit or similar
- Build data validation module
- Add form generation routes in backend
- Create signature block for CA

TEST WITH:
- 10 employees for Form 16
- 4 quarters for 24Q/27Q
- Verify PDF is valid, all fields populated
```

### PROMPT 1.3: Build Gratuity Calculation Engine

```
TASK: Build gratuity calculation as per Payment of Gratuity Act, 1972

REQUIREMENTS:
1. Gratuity Eligibility Check
   - Threshold: >=10 employees (manufacturing) OR >=10 employees (other industries)
   - If <10 employees: Gratuity not applicable
   - Show "N/A" for small firms

2. Gratuity Formula Implementation
   - Basic formula: (Basic Salary × Service Years) / 26
   - Service calculation: From joining date to exit date
   - Part month rule: If <6 months in last year, don't count
   - Cap on basic: Maximum 6 months median basic salary

3. Tax Treatment
   - Exemption: Up to ₹10 lakh is tax-free (Section 10(10)(ii))
   - Above ₹10L: Taxable as income
   - Show gratuity as separate line item in financials

4. API Endpoints
   - POST /api/gratuity/calculate - Calculate for an employee
   - GET /api/gratuity/employee/{emp_id} - Get gratuity details
   - POST /api/gratuity/export-ledger - Export journal entries

5. Frontend Component
   - Employee exit form: Employee name, joining date, exit date, salary
   - Calculate button → Display gratuity amount, tax impact
   - Generate ledger entry: Debit gratuity expense, credit payable

IMPLEMENTATION APPROACH:
- Build gratuity service with date calculations
- Create validation for 10-employee threshold
- Generate journal entry for ledger
- Test with various service durations (6 months to 40 years)

DATABASE SCHEMA:
CREATE TABLE gratuity_calculations (
  id UUID PRIMARY KEY,
  client_id UUID,
  employee_id UUID,
  joining_date DATE,
  exit_date DATE,
  basic_salary DECIMAL,
  gratuity_amount DECIMAL,
  tax_free_amount DECIMAL,
  taxable_amount DECIMAL,
  created_at TIMESTAMP
);
```

### PROMPT 1.4: Build Board Resolution Templates

```
TASK: Build 15+ board resolution templates for corporate decisions

REQUIREMENTS:
1. Template Library (Create these templates)
   - Dividend declaration
   - Loan/overdraft approval
   - Related party transaction approval
   - Director/key employee appointment
   - Salary increase approval
   - Asset purchase approval
   - Bank account opening
   - Company seal authorization
   - Board meeting schedule change
   - Compliance officer appointment
   - Audit committee formation
   - Investment decision
   - Contract approval
   - Policy adoption
   - Others as identified

2. Template Features
   - Auto-fill: Company name, board members, dates, amounts
   - WYSIWYG editor: CA can customize resolution text
   - Signature block: For digital signature
   - Export: PDF ready for filing

3. API Endpoints
   - GET /api/board-resolutions/templates - List all templates
   - POST /api/board-resolutions/generate - Generate resolution from template
   - PUT /api/board-resolutions/{id} - Edit resolution

4. Frontend Components
   - Template selection dropdown
   - Form to fill template details (company name, members, amounts, dates)
   - Generated resolution preview
   - Download PDF, print buttons

IMPLEMENTATION APPROACH:
- Create template strings with placeholders {{company_name}}, {{date}}, etc
- Build template engine to replace placeholders
- Add validation for required fields
- Generate PDF with signature blocks

DATABASE SCHEMA:
CREATE TABLE board_resolution_templates (
  id UUID PRIMARY KEY,
  name TEXT,
  category TEXT,
  template_text TEXT,
  required_fields JSONB,
  created_at TIMESTAMP
);

CREATE TABLE board_resolutions (
  id UUID PRIMARY KEY,
  client_id UUID,
  template_id UUID,
  resolution_text TEXT,
  generated_date TIMESTAMP,
  filed_date TIMESTAMP,
  status TEXT
);
```

### PROMPT 1.5: Build AGM Notice & Minutes Generation

```
TASK: Build Annual General Meeting (AGM) notice and minutes generation

REQUIREMENTS:
1. AGM Notice Generation
   - Statutory requirement: 21-day advance notice (per Companies Act)
   - Fields: Registered office address, date, time, agenda items
   - Agenda items: Adoption of accounts, dividend, director appointment, audit, etc
   - Format: Legal format as per MCA guidelines
   - Signature: For director/company secretary

2. AGM Minutes Template
   - Attendance: Chairman, directors present/absent
   - Resolutions: Items discussed and voted on
   - Voting: For/against/abstain counts
   - Actions: Items assigned with owners and deadlines
   - Signature block: For chairman and secretary

3. Compliance Tracking
   - Store: Notice date, meeting date, minutes filing date
   - Status: Draft, approved, filed with MCA
   - Deadline alert: AGM must be within 6 months of FY-end

4. API Endpoints
   - POST /api/agm/notice/generate - Create notice
   - POST /api/agm/minutes/generate - Create minutes template
   - GET /api/agm/{client_id} - Get AGM history
   - POST /api/agm/file-mca - Mark as filed with MCA

5. Frontend Components
   - AGM notice form (date, venue, agenda items)
   - Minutes form (attendance, resolutions, voting)
   - Calendar showing AGM due dates
   - Document preview and download

IMPLEMENTATION APPROACH:
- Create legal templates for notice and minutes
- Build form validation for required fields
- Track AGM calendar per client (FY-end + 6 months deadline)
- Add MCA filing status tracking

DATABASE SCHEMA:
CREATE TABLE agm_notices (
  id UUID PRIMARY KEY,
  client_id UUID,
  notice_date DATE,
  meeting_date DATE,
  venue TEXT,
  agenda JSONB,
  status TEXT,
  mca_filed_date DATE
);

CREATE TABLE agm_minutes (
  id UUID PRIMARY KEY,
  agm_notice_id UUID,
  chairman TEXT,
  attendees JSONB,
  resolutions JSONB,
  voting_details JSONB,
  actions JSONB
);
```

### PROMPT 1.6: Build MCA Form 20-B Generation

```
TASK: Build MCA Form 20-B (Annual Return) auto-generation

REQUIREMENTS:
1. Form 20-B Data Collection
   - Company details: CIN, name, registered office, email
   - Director details: Name, DIN, appointment date, VAT, ITC
   - Shareholder details: Name, shares, voting rights
   - Board meetings: Count held in FY
   - Audit information: Auditor name, appointment date

2. Validation Per MCA Rules 2014
   - Verify: Minimum 4 board meetings per year
   - Check: AGM held within 6 months of FY-end
   - Validate: All directors have valid DIN
   - Confirm: No disqualified directors

3. Form 20-B Generation
   - Auto-populate: All collected data
   - Generate: XML format for MCA e-filing
   - Export: PDF for review before filing
   - Digital signature block: For DSC signing

4. API Endpoints
   - POST /api/mca/form-20b/collect-data - Store company data
   - POST /api/mca/form-20b/generate - Generate form
   - GET /api/mca/form-20b/{client_id} - Get filed forms
   - POST /api/mca/form-20b/file - Mark as filed

5. Frontend Components
   - Data collection forms for all details
   - Validation checklist before generation
   - Form preview
   - Download XML + PDF
   - Filing status tracker

IMPLEMENTATION APPROACH:
- Create XML form builder per MCA specifications
- Build validation engine for MCA rules
- Track filing status and deadlines
- Generate audit trail for compliance

DATABASE SCHEMA:
CREATE TABLE mca_form_20b (
  id UUID PRIMARY KEY,
  client_id UUID,
  cin TEXT UNIQUE,
  company_name TEXT,
  directors JSONB,
  shareholders JSONB,
  board_meetings_count INT,
  form_data JSONB,
  xml_content TEXT,
  status TEXT,
  filed_date TIMESTAMP,
  generated_at TIMESTAMP
);
```

### PROMPT 1.7: Build DIN/TAN Renewal Tracking

```
TASK: Build DIN (Director ID) and TAN (Tax Deductor ID) renewal tracking

REQUIREMENTS:
1. DIN/TAN Master Data
   - Store: DIN/TAN number, issue date, valid till date (usually 10 years)
   - Type: Director DIN vs Company TAN
   - Status: Active, expiring soon, expired
   - Director/Company linked to DIN/TAN

2. Expiry Alerts
   - Calculate: Months until expiry
   - Alert schedule: 90 days, 60 days, 30 days before expiry
   - OVERDUE alert: If expired
   - Auto-alert: Email to CA and director

3. Renewal Process
   - Generate: Renewal form (Form INC-10A for DIN, renewal form for TAN)
   - Track: Renewal application date, renewal status, new DIN/TAN issued
   - Update: New issue date and validity in dashboard

4. API Endpoints
   - POST /api/din-tan/add - Add new DIN/TAN
   - GET /api/din-tan/alerts - Get all expiring DIN/TAN
   - PUT /api/din-tan/{id}/renewal - Mark as renewed
   - GET /api/din-tan/report - Compliance report

5. Frontend Components
   - DIN/TAN list per client
   - Expiry status (color-coded: green/yellow/red)
   - Renewal process workflow
   - Alert configuration
   - Calendar view of renewal dates

IMPLEMENTATION APPROACH:
- Create DIN/TAN master table with validity dates
- Build alert calculation logic
- Integrate with alert system
- Create renewal form generation

DATABASE SCHEMA:
CREATE TABLE din_tan_master (
  id UUID PRIMARY KEY,
  client_id UUID,
  din_tan_number TEXT UNIQUE,
  din_tan_type TEXT, -- 'DIN' or 'TAN'
  issue_date DATE,
  valid_till_date DATE,
  linked_director_id UUID,
  status TEXT, -- 'Active', 'Expiring', 'Expired'
  renewal_date DATE,
  new_din_tan_number TEXT,
  created_at TIMESTAMP
);

CREATE TABLE din_tan_alerts (
  id UUID PRIMARY KEY,
  din_tan_id UUID,
  alert_date DATE,
  alert_type TEXT, -- '90days', '60days', '30days', 'OVERDUE'
  sent BOOLEAN,
  sent_at TIMESTAMP
);
```

---

## PHASE 2: MULTI-CLIENT MANAGEMENT & DEADLINES (Copy & Paste)

### PROMPT 2.1: Build Multi-Client Dashboard Hub

```
TASK: Build multi-client dashboard showing 50-500+ clients with compliance status

REQUIREMENTS:
1. Client Master List View
   - Display: Client name, industry, GSTIN, PAN, compliance score (0-100%)
   - Color-coded status: ✅ Green (Compliant), ⚠️ Yellow (Pending), ❌ Red (Overdue), 🔔 Blue (Alert)
   - Cards: 5-10 per row, paginated (100 clients per page max)
   - Search: By name, GSTIN, PAN, industry
   - Filters: By status, industry, CA assigned, deadline urgency

2. Client Card Information
   - Client name, logo (if available)
   - Industry badge
   - Compliance score bar (0-100%)
   - Next deadline (date + days remaining)
   - Pending documents count
   - Last portal sync timestamp
   - CA assigned, contact phone
   - Quick actions: View details, contact, sync

3. Dashboard Summary
   - Total clients: Count
   - Fully compliant: Count + %
   - Pending compliance: Count
   - Overdue items: Count + days overdue
   - Alerts: Urgent action items
   - This month: Deadlines coming up

4. API Endpoints
   - GET /api/clients - List all clients (with filtering, pagination)
   - GET /api/clients/{id} - Client details page
   - GET /api/dashboard/summary - Summary stats
   - PUT /api/clients/{id}/sync - Trigger portal sync

5. Frontend Components
   - Client dashboard grid/list view toggle
   - Filter sidebar
   - Search bar with autocomplete
   - Status legend
   - Summary cards at top
   - Pagination controls

IMPLEMENTATION APPROACH:
- Create clients table with all required fields
- Build client list API with filters and pagination
- Calculate compliance score based on pending/due items
- Add search index for fast autocomplete
- Implement caching for dashboard summary (update every hour)

PERFORMANCE NOTES:
- With 500 clients, load 50 per page
- Client card loads in <100ms each
- Dashboard summary cached (invalidate on form filing)
- Search uses indexed full-text search on name/GSTIN/PAN
```

### PROMPT 2.2: Build Client Master Database Schema & CRUD

```
TASK: Build comprehensive client master database and CRUD operations

REQUIREMENTS:
1. Client Master Table
   Fields:
   - id, legal_name, business_type (Sole/Partnership/Corp/LLP/HUF/Trust)
   - pan, gstin, registration_number
   - financial_year_end (date, e.g., 31-Mar, 30-June, 31-Dec)
   - industry (Manufacturing/Service/Trading/IT/etc)
   - created_by (user_id), created_date, last_modified
   - status (Active/Inactive/Dormant)

2. Business Details
   - Business nature (Consulting, Manufacturing, Trading, etc)
   - Annual turnover (for GST threshold checking)
   - Accounting software (Tally/QB/Zoho/None)
   - Compliance contacts (Finance, MD, Company Secretary)
   - Bank details (encrypted)

3. Statutory Authority Links (ENCRYPTED)
   - GST portal username/password (encrypted AES-256)
   - Income Tax portal username/password (encrypted)
   - MCA portal (CIN access)
   - EPFO/ESI account numbers
   - Bank account numbers

4. Team Assignment
   - Lead CA (user_id)
   - Junior CA assigned
   - Staff members assigned
   - Email/phone of client contacts

5. CRUD APIs
   - POST /api/clients - Create new client
   - GET /api/clients/{id} - Get client details
   - PUT /api/clients/{id} - Update client (with audit log)
   - DELETE /api/clients/{id} - Deactivate client
   - GET /api/clients - List all (with filters)

6. Database Schema
   ```sql
   CREATE TABLE clients (
     id UUID PRIMARY KEY,
     legal_name TEXT NOT NULL,
     business_type TEXT,
     pan TEXT UNIQUE,
     gstin TEXT UNIQUE,
     fy_end_date TEXT,
     industry TEXT,
     created_by UUID REFERENCES users(id),
     created_at TIMESTAMP,
     status TEXT DEFAULT 'Active'
   );

   CREATE TABLE client_contacts (
     id UUID PRIMARY KEY,
     client_id UUID REFERENCES clients(id),
     contact_name TEXT,
     designation TEXT,
     email TEXT,
     phone TEXT,
     is_primary BOOLEAN
   );

   CREATE TABLE client_credentials (
     id UUID PRIMARY KEY,
     client_id UUID REFERENCES clients(id),
     portal_type TEXT, -- 'GST', 'ITR', 'MCA', etc
     username TEXT,
     password_encrypted TEXT, -- AES-256 encrypted
     encryption_key_version INT,
     last_synced TIMESTAMP
   );

   CREATE TABLE client_team (
     id UUID PRIMARY KEY,
     client_id UUID REFERENCES clients(id),
     user_id UUID REFERENCES users(id),
     role TEXT, -- 'Lead CA', 'Junior CA', 'Staff'
     assigned_date TIMESTAMP
   );
   ```

IMPLEMENTATION APPROACH:
- Build encryption service for credentials storage
- Create Supabase RLS policies (user can only see assigned clients)
- Add audit logging for all client updates
- Implement credential rotation (re-encrypt with new key yearly)
- Create credential management UI with password masking
```

### PROMPT 2.3: Build Statutory Deadline Calendar

```
TASK: Build master statutory deadline calendar for ALL compliance requirements

REQUIREMENTS:
1. Master Deadline List (Create these)
   - GST: 20th (GSTR-1), 10th (GSTR-2B), 20th (GSTR-3B), 10th (e-invoice)
   - Income Tax: Jul 31 (ITR), Jun 15 (Adv Tax Q1), Sep 15 (Q2), Dec 15 (Q3), Mar 15 (Q4)
   - MCA: AGM within 6 months of FY-end, annual return, board minutes
   - EPF: 15th of next month (employee contribution)
   - ESI: Monthly (as per payroll)
   - TDS/TCS: Deposit 7th, reconcile 24Q/27Q by 30th
   - Professional Tax: Quarterly filing (varies by state)
   - Audit: Annual by Dec 31 (if applicable), auditor rotation
   - Insurance: Annual renewal
   - Labor Compliance: PF settlement, contractor registration

2. Deadline Properties
   - Fixed deadlines: GST 20th (every month)
   - Relative deadlines: AGM within 6 months of FY-end
   - Portal-announced deadlines: Extended dates (e.g., ITR extended to Aug 15)
   - State-specific: Professional tax varies
   - Variant rules: ITR extended for certain categories

3. Calendar Database
   CREATE TABLE statutory_deadlines (
     id UUID PRIMARY KEY,
     deadline_name TEXT, -- 'GST-3B filing'
     deadline_type TEXT, -- 'Monthly', 'Quarterly', 'Annual', 'Event'
     frequency TEXT,
     base_deadline TEXT, -- '20th', '31st', '6 months from FY-end'
     description TEXT,
     regulatory_body TEXT, -- 'GST', 'IT', 'MCA', etc
     penalty_for_delay TEXT, -- Description of penalty
     standard_deadline DATE,
     extended_deadline DATE, -- If govt extended
     notification_date DATE,
     created_at TIMESTAMP
   );

4. Calendar View
   - Month view: Show all deadlines in a calendar
   - List view: Sorted by date
   - Alert view: Deadlines in next 30 days
   - Filter: By regulatory body, deadline type, industry

5. API Endpoints
   - GET /api/deadlines - List all deadlines
   - GET /api/deadlines/by-month/{month} - Deadlines in month
   - POST /api/deadlines/extend - Update extended deadline (admin)
   - GET /api/deadlines/upcoming - Next 30 days

IMPLEMENTATION:
- Hardcode master deadline list (update annually with new rules)
- Build calendar display (use library like fullcalendar)
- Add filtering by regulatory body
- Track portal extended dates
- Create admin endpoint to update extended deadlines
```

### PROMPT 2.4: Build Client-Specific Deadline Alerts

```
TASK: Build per-client deadline calculation and alert generation

REQUIREMENTS:
1. Client Deadline Calculation Logic
   - Input: Client FY-end date (e.g., Mar 31)
   - For MONTHLY deadlines: Recurring every month
     - GST-1: 20th every month
     - GST-2B: 10th every month
     - GST-3B: 20th every month
   - For ANNUAL deadlines: Calculated from FY-end
     - ITR: Jul 31 (fixed)
     - MCA AGM: Within 6 months of FY-end (e.g., Sep 30 for Mar 31 FY)
     - Annual Return: Same as AGM deadline
   - For QUARTERLY deadlines: Q1/Q2/Q3/Q4 relative to FY-end

2. Client Deadline Table
   CREATE TABLE client_deadlines (
     id UUID PRIMARY KEY,
     client_id UUID REFERENCES clients(id),
     deadline_id UUID REFERENCES statutory_deadlines(id),
     due_date DATE,
     deadline_name TEXT,
     deadline_type TEXT,
     days_remaining INT,
     status TEXT, -- 'Pending', 'Completed', 'Overdue'
     completed_date DATE,
     alert_sent BOOLEAN,
     next_occurrence DATE,
     created_at TIMESTAMP
   );

3. Alert Schedule Generation
   - When client is added, generate all deadlines for next 2 FY years
   - For monthly: Generate 24 months of deadlines
   - For annual: Generate 2 years
   - Update status when CA marks as completed
   - Skip recurring if marked complete

4. Alert Levels (60, 30, 15, 7, 1 day)
   - 60 days: "Start collecting documents"
   - 30 days: "Deadline coming up, prepare filing"
   - 15 days: "Finalize and review"
   - 7 days: "Ready to file, waiting approval"
   - 1 day: "File today"
   - OVERDUE: "Compliance violation, urgent action needed"

5. API Endpoints
   - POST /api/client-deadlines/generate/{client_id} - Generate all deadlines for client
   - GET /api/client-deadlines/{client_id} - List client deadlines
   - PUT /api/client-deadlines/{id}/complete - Mark deadline complete
   - GET /api/client-deadlines/upcoming - All alerts for next 30 days

IMPLEMENTATION APPROACH:
- Generate deadlines in bulk when client is created (takes <1 second)
- Store all deadline occurrences in DB (no calculation on each query)
- Update status when CA marks complete
- Use simple date comparison for alert level calculation
- Populate next_occurrence for recurring deadlines
```

### PROMPT 2.5: Build Automated Multi-Channel Alert System

```
TASK: Build automated alerts across email, SMS, in-app, Slack channels

REQUIREMENTS:
1. Alert Rules Engine
   - 60 days before: Informational email (collect docs)
   - 30 days before: Email + in-app alert
   - 15 days before: Email + SMS + in-app alert
   - 7 days before: Email + SMS + in-app + Slack
   - 1 day before: Email + SMS + in-app + Slack (critical)
   - OVERDUE: Email + SMS + Slack (escalate to Senior CA)

2. Alert Content
   Format: "Client {name} - {deadline_name} due in {days_remaining} days on {due_date}"
   Personalizations:
   - "ABC Corp - GST-3B due in 7 days on Feb 20, 2025"
   - "XYZ Ltd - ITR due in 1 day on Jul 31, 2025 - URGENT"
   - "[OVERDUE] PQR Inc - MCA Annual Return due 30 days ago - LEGAL VIOLATION"

3. Delivery Channels
   - Email: Via SES or Sendgrid (daily digest or per-alert)
   - SMS: Via Twilio or AWS SNS (only for urgent: 7 days, 1 day, overdue)
   - In-app: Notification center, banner notification
   - Slack: Post to #compliance-alerts channel

4. Alert Management
   - CA can snooze alert (5 mins, 1 hour, 1 day)
   - CA can mark complete (skip remaining alerts)
   - CA can reschedule deadline (if deadline extended)
   - Prevent duplicate alerts (no more than 1 per channel per day)

5. Database Schema
   CREATE TABLE alert_schedule (
     id UUID PRIMARY KEY,
     client_deadline_id UUID REFERENCES client_deadlines(id),
     alert_level INT, -- 60, 30, 15, 7, 1, -1 (overdue)
     alert_date DATE,
     channel TEXT, -- 'email', 'sms', 'in-app', 'slack'
     content TEXT,
     status TEXT, -- 'pending', 'sent', 'snoozed', 'dismissed'
     sent_at TIMESTAMP,
     snoozed_until TIMESTAMP,
     created_at TIMESTAMP
   );

6. API Endpoints
   - POST /api/alerts/send - Trigger alert sending (cron job)
   - GET /api/alerts/{user_id} - User's alerts
   - PUT /api/alerts/{id}/snooze - Snooze alert
   - PUT /api/alerts/{id}/dismiss - Mark as read
   - POST /api/alerts/config - Set alert preferences (email vs SMS frequency)

7. Configuration
   - User preferences: Email digest (daily/weekly), SMS (on/off), Slack (on/off)
   - Team escalation: If overdue, alert Senior CA and Client contact
   - Do-not-disturb: Quiet hours (no SMS after 6pm)

IMPLEMENTATION:
- Use Celery or Node-schedule for cron job
- Send emails in batches (100s per run)
- Integrate with SES/Twilio APIs
- Build in-app notification with database
- Create Slack webhook integration
- Track delivery status and retry failed sends
```

### PROMPT 2.6: Build Client Document Request System

```
TASK: Build system where CA requests documents, client uploads, CA reviews

REQUIREMENTS:
1. Request Creation
   - CA prepares request: List of needed documents
   - Document types: GST invoices CSV, bank statement PDF, expense receipts, payroll data, etc
   - Template requests: "Monthly Compliance Package" (predefined list of docs)
   - Custom requests: CA adds free-text description
   - Due date: When documents needed (default 5 days)

2. Client Portal
   - Client receives email: "ABC Corp needs documents by Feb 20, 2025"
   - Link to portal page: Show requested documents, upload status
   - Upload interface: Drag-drop or file chooser
   - Status for each: ❌ Not uploaded, ✅ Uploaded, 📝 Under review, ✓ Approved, ✗ Rejected
   - Notes: Client can add notes "Invoice file is too large, uploading in 2 parts"

3. CA Review Workflow
   - CA sees uploaded documents in dashboard
   - CA can: ✓ Mark as reviewed, ✗ Reject with reason, 💬 Request revision
   - If rejected: Auto-notify client "Document rejected: Missing invoice date. Please re-upload."
   - If approved: Move to "Ready for filing"

4. Automatic Reminders
   - 3 days before due date: Remind client of pending docs
   - 1 day before: Urgent reminder
   - After due date: Escalation to Senior CA

5. API Endpoints
   - POST /api/doc-requests/create - CA creates request
   - GET /api/doc-requests/{client_id} - List requests for client
   - POST /api/doc-requests/{id}/upload - Client uploads document
   - PUT /api/doc-requests/{id}/review - CA reviews (approve/reject)
   - GET /api/doc-requests/completion-rate - % of docs uploaded on time

6. Database Schema
   CREATE TABLE document_requests (
     id UUID PRIMARY KEY,
     client_id UUID REFERENCES clients(id),
     created_by UUID REFERENCES users(id),
     created_date TIMESTAMP,
     due_date DATE,
     status TEXT, -- 'Pending', 'In Progress', 'Completed', 'Overdue'
     completion_rate INT -- % of documents uploaded
   );

   CREATE TABLE document_request_items (
     id UUID PRIMARY KEY,
     request_id UUID REFERENCES document_requests(id),
     document_type TEXT, -- 'GST Invoice CSV', 'Bank Statement', etc
     description TEXT,
     is_required BOOLEAN,
     status TEXT, -- 'Not uploaded', 'Uploaded', 'Approved', 'Rejected'
     client_notes TEXT,
     ca_feedback TEXT,
     uploaded_file_id TEXT, -- Link to uploaded file
     uploaded_at TIMESTAMP
   );

IMPLEMENTATION:
- Create unique portal link for each request (share via email)
- Build upload progress tracking
- Store files in S3 with client/request folder structure
- Auto-notify both parties on upload/review
- Track completion rates for each client/request type
```

### PROMPT 2.7: Build Secure AES-256 File Sharing System

```
TASK: Build encrypted file sharing between CA and client

REQUIREMENTS:
1. Encryption System
   - Algorithm: AES-256-GCM
   - Each file gets unique random IV (initialization vector)
   - Key: Stored in AWS KMS, never in code
   - On upload: Encrypt file before storing in S3
   - On download: Decrypt on-the-fly, never store plaintext on disk

2. Share Link Generation
   - CA shares file with client via secure link
   - Link: /share/{random_token} (URL-safe random 32 chars)
   - Token stored with: File ID, shared_with (client email), expiry_date, download_count
   - Expiry options: 7 days, 30 days, no expiry
   - Download limit: Unlimited, 5 downloads, 1 download

3. Access Control
   - Before download: Verify link token valid, not expired, not over download limit
   - Log: Who downloaded what, when, from which IP
   - Prevent sharing: Client cannot access other clients' files

4. Virus Scan
   - Before storing: Scan file with ClamAV (free open-source antivirus)
   - If infected: Reject upload, alert CA
   - If clean: Proceed with encryption and storage

5. Audit Trail
   - Log every download: User, file, timestamp, IP, success/failure
   - Log every upload: User, file, timestamp, size, hash
   - Export audit: CA can download audit log for compliance

6. API Endpoints
   - POST /api/file-share/upload - CA uploads and encrypts
   - POST /api/file-share/{file_id}/share - Generate share link
   - GET /api/file-share/{token}/download - Download encrypted file (auto-decrypt)
   - GET /api/file-share/{file_id}/audit - View audit trail

7. Database Schema
   CREATE TABLE shared_files (
     id UUID PRIMARY KEY,
     client_id UUID REFERENCES clients(id),
     uploaded_by UUID REFERENCES users(id),
     file_name TEXT,
     file_size INT,
     s3_key TEXT, -- Path in S3
     file_hash TEXT, -- SHA-256 for integrity check
     virus_scan_status TEXT, -- 'Pending', 'Clean', 'Infected'
     encryption_key_version INT,
     uploaded_at TIMESTAMP
   );

   CREATE TABLE file_shares (
     id UUID PRIMARY KEY,
     file_id UUID REFERENCES shared_files(id),
     share_token TEXT UNIQUE,
     shared_with_email TEXT,
     created_by UUID REFERENCES users(id),
     created_at TIMESTAMP,
     expiry_date TIMESTAMP,
     max_downloads INT,
     downloads_count INT DEFAULT 0
   );

   CREATE TABLE file_audit_log (
     id UUID PRIMARY KEY,
     file_id UUID REFERENCES shared_files(id),
     action TEXT, -- 'upload', 'download', 'share', 'delete'
     user_id UUID,
     ip_address TEXT,
     timestamp TIMESTAMP,
     success BOOLEAN,
     error_message TEXT
   );

IMPLEMENTATION:
- Use AWS KMS for key management (rotate yearly)
- Use S3 for storage with encryption at rest
- Integrate ClamAV for virus scanning
- Create file download route that decrypts on-the-fly
- Log all file access for audit trail
```

### PROMPT 2.8: Build Client Approval Workflow for Filings

```
TASK: Build workflow: CA prepares → Client reviews → Client approves → CA files

REQUIREMENTS:
1. Workflow States
   - DRAFT: CA is preparing the form
   - PENDING_APPROVAL: CA shared with client, waiting for approval
   - APPROVED: Client approved via e-signature
   - REJECTED: Client rejected, needs revision
   - FILED: CA filed with government
   - ACKNOWLEDGED: Government acknowledged filing

2. Client Review Portal
   - Client receives email: "Your GSTR-3B is ready for approval"
   - Link to portal: Shows filled form data
   - Review mode: Can see all values, read-only
   - Comment section: Client can ask questions
   - Buttons: ✓ Approve (with e-signature), ✗ Reject (with reason)

3. E-Signature Integration
   - Use e-sign provider (eSign Genie, Adobe Sign, or DocuSign)
   - Client clicks "Approve" → Opens e-signature modal
   - Client enters OTP (sent to registered phone) OR uses digital signature
   - Signature stored as proof of approval
   - PDF downloaded with signature block

4. Multi-Level Approval
   - For large transactions: Requires multiple approvals
   - E.g., Board resolution needs: CA approves → MD approves → CFO approves → File
   - Track approval chain: Who approved when, in what order

5. Revision Workflow
   - Client rejects: "Interest rate is wrong, should be 8% not 7%"
   - CA revises: Updates the form, re-shares with "REVISED_PENDING_APPROVAL"
   - Client reviews revision, approves
   - Prevents ping-pong: Track # of revisions, alert if >3

6. Deadline Tracking
   - If client hasn't approved in 3 days: Auto-remind
   - If not approved by filing deadline: Escalate to Senior CA + Client Director
   - System can auto-approve if deadline is 1 day away (configurable)

7. API Endpoints
   - POST /api/approval-workflow/{form_id}/send-for-approval - CA initiates approval
   - GET /api/approval-workflow/{form_id}/status - Current approval status
   - POST /api/approval-workflow/{form_id}/approve - Client approves with e-sig
   - POST /api/approval-workflow/{form_id}/reject - Client rejects with reason
   - POST /api/approval-workflow/{form_id}/file - CA files approved form

8. Database Schema
   CREATE TABLE approval_workflows (
     id UUID PRIMARY KEY,
     form_id TEXT,
     client_id UUID REFERENCES clients(id),
     form_type TEXT, -- 'GSTR-3B', 'ITR', 'Board Resolution', etc
     current_state TEXT, -- 'Draft', 'PendingApproval', 'Approved', 'Filed'
     created_at TIMESTAMP,
     approved_at TIMESTAMP,
     filed_at TIMESTAMP
   );

   CREATE TABLE approval_steps (
     id UUID PRIMARY KEY,
     workflow_id UUID REFERENCES approval_workflows(id),
     step_number INT,
     approver_email TEXT,
     approver_role TEXT, -- 'Client', 'MD', 'CFO', 'CA', etc
     status TEXT, -- 'Pending', 'Approved', 'Rejected'
     comments TEXT,
     e_signature_proof TEXT, -- Link to signed PDF
     approved_at TIMESTAMP,
     expires_at TIMESTAMP
   );

IMPLEMENTATION:
- Build form viewing interface (read-only for client)
- Integrate with e-sign provider's API
- Create approval notification emails
- Track approval chain and timing
- Auto-escalate if deadline approaching
```

### PROMPT 2.9: Build Filing Status Tracker

```
TASK: Build form-by-form filing status tracking per client

REQUIREMENTS:
1. Status Workflow
   - DRAFT: CA is preparing
   - READY: Passed validation, ready to file
   - FILED: Submitted to government
   - ACKNOWLEDGED: Government confirmed receipt
   - APPROVED: Final approval/processing complete
   - REJECTED: Government rejected, needs amendment
   - UNDER_REVIEW: Government is reviewing (shows status date)

2. Per-Form Status
   For each client and form type (GSTR-1, GSTR-3B, ITR, etc):
   - Status: Current state
   - Filing date: When filed
   - Acknowledgment date: When government acknowledged
   - Reference number: Government filing reference/portal number
   - Any rejection reason (with error code from govt)
   - Next action: What CA needs to do

3. Portal Links
   - If filed: "View on GST.gov.in" button (links to gov portal)
   - If rejected: "View rejection reason" + "Refile amended version"
   - Track: Portal filing URL so CA can quickly jump to government website

4. Multi-Year Tracking
   - FY 2024-25 forms vs FY 2025-26
   - Group by financial year for easy navigation
   - Show completion %: "FY 2024-25: 10/12 months filed (83%)"

5. API Endpoints
   - POST /api/filing-status/create - Log new filing
   - PUT /api/filing-status/{id} - Update status (after govt acknowledgment)
   - GET /api/filing-status/{client_id} - Get all forms and status
   - GET /api/filing-status/summary/{client_id} - Summary per FY
   - POST /api/filing-status/{id}/portal-link - Store portal link

6. Database Schema
   CREATE TABLE filing_status (
     id UUID PRIMARY KEY,
     client_id UUID REFERENCES clients(id),
     form_type TEXT, -- 'GSTR-1', 'ITR', 'Form 16', etc
     filing_period TEXT, -- 'Feb 2025' for monthly, 'FY 2024-25' for annual
     status TEXT DEFAULT 'Draft',
     filed_date TIMESTAMP,
     acknowledgment_date TIMESTAMP,
     government_reference_no TEXT,
     government_portal_url TEXT,
     rejection_reason TEXT,
     rejection_code TEXT,
     next_action TEXT,
     updated_by UUID REFERENCES users(id),
     updated_at TIMESTAMP
   );

IMPLEMENTATION:
- Update status manually as CA files or govt acknowledges
- Add form view: All client's forms with status badges
- Integration: In Phase 3, auto-update status from government portal
- Color-code status: Draft (gray), Ready (yellow), Filed (blue), Approved (green), Rejected (red)
- Export: Download filing status report per client/FY
```

### PROMPT 2.10: Build Notice Management Dashboard

```
TASK: Build centralized notices dashboard for all government notices (GST, ITR, MCA)

REQUIREMENTS:
1. Notice Capture
   - Manual entry: CA receives notice via email, enters into system
   - Portal auto-import: (Phase 3) Auto-fetch notices from GST.gov.in, ITR portal, MCA
   - Document upload: CA uploads notice PDF, system OCR extracts data

2. Notice Details
   For each notice:
   - Client name
   - Notice type (Demand, Query, Show Cause, Information, Penalty, Refund, etc)
   - Issued by (GST, ITR, MCA, Labor Dept, etc)
   - Issue date, due date for response
   - Amount (if demand/penalty)
   - Notice reference number
   - Description/reason
   - Document attachment (PDF)
   - Priority: Auto-calculate based on amount and due date

3. Notice Classification
   - Auto-tag: "High Priority" if amount >₹10L AND due within 30 days
   - "Medium Priority" if amount <₹10L OR due within 60 days
   - "Low Priority" if low amount AND due >60 days
   - "URGENT" if already overdue

4. Response Tracking
   - Status: Not started, In progress, Drafted, Submitted, Closed, Appeal filed
   - CA notes: What response was submitted, when, reference number
   - Client approval: If needed, require client approval before submitting
   - Document: Store response submission proof (acknowledgment from portal)

5. Notice Calendar
   - Show all notice due dates in calendar view
   - Highlight overdue notices
   - Sort by due date for task priority

6. API Endpoints
   - POST /api/notices - CA manually enters notice
   - GET /api/notices - List all notices (filter by client, status, priority)
   - GET /api/notices/{id} - Notice details
   - PUT /api/notices/{id} - Update status, notes
   - POST /api/notices/{id}/submit-response - Mark response as submitted
   - GET /api/notices/dashboard/summary - Count by status, priority

7. Database Schema
   CREATE TABLE government_notices (
     id UUID PRIMARY KEY,
     client_id UUID REFERENCES clients(id),
     notice_type TEXT, -- 'Demand', 'Query', 'Show Cause', etc
     issued_by TEXT, -- 'GST', 'ITR', 'MCA', 'Labor', etc
     issue_date DATE,
     due_date DATE,
     amount DECIMAL,
     reference_no TEXT,
     description TEXT,
     document_url TEXT, -- Link to uploaded PDF
     priority TEXT, -- 'High', 'Medium', 'Low', 'Urgent'
     status TEXT DEFAULT 'Not started',
     response_status TEXT,
     response_date TIMESTAMP,
     response_document_url TEXT,
     ca_notes TEXT,
     entered_by UUID REFERENCES users(id),
     entered_date TIMESTAMP
   );

8. Frontend Components
   - Notices list: Table with client, type, due date, amount, priority
   - Filter sidebar: By status, priority, issuing authority
   - Notice detail view: Full details + response form
   - Calendar view: Visual deadline tracking
   - Dashboard summary: Urgent count, by-status distribution

IMPLEMENTATION:
- Create notice entry form with OCR pre-fill
- Build notice list with sorting/filtering
- Color-code by priority
- Track response lifecycle
- In Phase 3: Auto-import from portals
```

---

## PHASE 3: GOVERNMENT PORTAL INTEGRATIONS (Copy & Paste)

### PROMPT 3.1: Build GST.gov.in OAuth2 Integration

```
TASK: Build OAuth2 integration with GST portal for GSTR data auto-sync

REQUIREMENTS:
1. GST Portal OAuth2 Flow
   - Register app with GSTN (Goods and Service Tax Network)
   - OAuth2 endpoint: https://api.gst.gov.in/oauth/authorize
   - Redirect URI: https://yourdomain.com/auth/gst-callback
   - Scopes: read:gstr, write:gstr (check GSTN docs for exact scopes)

2. Token Management
   - Store: Access token (expires in 1 hour), refresh token (expires in 6 months)
   - Encryption: Store tokens encrypted in database (AES-256)
   - Auto-refresh: Before each API call, check if token expired. If yes, refresh.
   - Revocation: If client deactivates, revoke token from GSTN

3. GSTR Data Fetch
   - GET /gstr/files/{financial_year} - List filed GSTR (1, 2B, 3B, etc)
   - GET /gstr/summary/{type}/{period} - Get GSTR summary (count, tax, amounts)
   - GET /gstr/details/{type}/{period} - Get itemized details
   - Parse response: Extract invoice count, tax amounts, filing status

4. Data Reconciliation
   - Fetch 2B data: Supplier invoices
   - Compare with 1: What client sent vs what suppliers claim was sent
   - Discrepancy report: Missing invoices, amount mismatches, tax differences

5. Error Handling
   - Invalid credentials: Show "GST credentials expired, please re-authenticate"
   - API rate limit: Queue requests, retry with backoff
   - Network error: Retry after 5 minutes, alert CA if persistent
   - Session timeout: Force re-authentication after token revoked

6. API Endpoints (Backend)
   - GET /api/gst/auth-url - Get OAuth login URL
   - POST /api/gst/auth-callback - Handle OAuth callback
   - POST /api/gst/sync/{client_id} - Trigger data sync
   - GET /api/gst/data/{client_id} - Get synced data
   - GET /api/gst/status/{client_id} - Get sync status

7. Frontend Components
   - GST Login button: "Connect with GST Portal"
   - Sync status: Last synced timestamp, current sync status
   - Data display: GSTR filing status, summary, details
   - Reconciliation report

IMPLEMENTATION:
- Use OAuth2 library (passport.js or similar)
- Build token encryption/decryption middleware
- Create sync service that runs every 6 hours
- Cache responses for 4 hours to avoid API rate limits
- Build error UI for expired credentials, API errors

DATABASE SCHEMA:
CREATE TABLE gst_oauth_tokens (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,
  last_synced TIMESTAMP,
  sync_status TEXT, -- 'Success', 'Failed', 'In Progress'
  encryption_key_version INT
);

CREATE TABLE gstr_data (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  gstr_type TEXT, -- '1', '2B', '3B'
  period TEXT, -- 'Feb-2025'
  filing_status TEXT, -- 'Filed', 'Approved', 'Rejected'
  invoice_count INT,
  taxable_value DECIMAL,
  tax_amount DECIMAL,
  downloaded_at TIMESTAMP
);
```

### PROMPT 3.2: Build GST Notice Auto-Download

```
TASK: Build auto-download of GST notices, demands, and alerts from portal

REQUIREMENTS:
1. Notice API Integration
   - Endpoint: GET /gstr/notices/{financial_year}
   - Parse response: Notice type, issue date, due date, amount, reference number
   - OCR PDF: Extract details if available as PDF link

2. Notice Classification
   - Types: Demand, Query, Show Cause Notice, Information Request, Correction, Refund
   - Auto-extract: Amount, statutory deadline for response, escalation level

3. Storage
   - Store notice in notices table
   - Link to client
   - Mark as "New" in dashboard
   - Auto-alert CA immediately

4. Due Date Extraction
   - Parse: "Response due within 30 days" → Calculate due date
   - Support variations: "14 days", "45 days", "6 months", etc
   - Default: If not specified, assume 30 days per GST Act

5. Automatic Sync
   - Daily sync at 6 AM (low-traffic time)
   - Or on-demand: CA clicks "Sync now" button
   - Prevent duplicates: Check if notice already exists by reference number

6. API Endpoints
   - POST /api/gst/notices/sync/{client_id} - Trigger sync
   - GET /api/gst/notices/{client_id} - List notices
   - GET /api/gst/notices/{id}/details - Full notice details

IMPLEMENTATION:
- Add notice fetch to GST sync job
- Build notice parser for PDF extraction
- Auto-extract due date (rule-based or regex)
- Create immediate alert on new notice
```

### PROMPT 3.3: Build Income Tax Portal Integration (OAuth2 + ITR Status)

```
TASK: Build OAuth2 with incometax.gov.in for ITR filing status + acknowledgment download

REQUIREMENTS:
1. ITR Portal OAuth2
   - Register app with AADHAAR seeding (depends on TAN)
   - Endpoint: https://incometaxindiaefiling.gov.in/oauth/authorize
   - TAN-based authentication (not username/password)
   - Scopes: read:itr, read:notices (check portal docs)

2. ITR Status Fetch
   - GET /itr/status/{assessment_year} - ITR filing status for year
   - Parse: Status (Filed, Under Review, Approved, Pending, Error)
   - Filing date, acknowledgment date, last status update

3. Acknowledgment Download
   - GET /itr/{year}/acknowledgment - Download ITR acknowledgment PDF
   - Save in client's document library (encrypted)
   - Extract: ITR acknowledgment number, filing timestamp

4. Refund Status
   - GET /itr/refund-status/{assessment_year}
   - Show: Refund amount, refund status (Sanctioned, In Progress, Paid)
   - Refund amount, date of sanction, expected payment date

5. Error Handling
   - Invalid TAN: "TAN not registered, please verify"
   - Session expired: "Portal session expired, please re-authenticate"
   - No ITR filed: "No ITR found for this year"

6. API Endpoints
   - GET /api/itr/auth-url - OAuth login URL
   - POST /api/itr/auth-callback - OAuth callback
   - POST /api/itr/sync/{client_id} - Fetch status
   - GET /api/itr/status/{client_id} - Show status + acknowledgment
   - GET /api/itr/refund/{client_id} - Refund status

IMPLEMENTATION:
- Similar OAuth2 pattern as GST integration
- Add TAN authentication layer
- Download and encrypt acknowledgment PDF
- Track ITR history across years
- Daily sync or on-demand

DATABASE SCHEMA:
CREATE TABLE itr_oauth_tokens (
  client_id UUID REFERENCES clients(id),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,
  last_synced TIMESTAMP
);

CREATE TABLE itr_filing_status (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  assessment_year INT,
  filing_status TEXT, -- 'Filed', 'Under Review', 'Approved'
  filed_date TIMESTAMP,
  acknowledgment_date TIMESTAMP,
  acknowledgment_number TEXT,
  acknowledgment_pdf_url TEXT,
  refund_amount DECIMAL,
  refund_status TEXT,
  downloaded_at TIMESTAMP
);
```

### PROMPT 3.4: Build ITR Notice/Demand Auto-Download

```
TASK: Build auto-download of Income Tax notices, demands, and show cause notices

REQUIREMENTS:
1. ITR Notices API
   - Endpoint: GET /itr/notices/{assessment_year}
   - Types: Query (Sec 142), Demand (Sec 143), Show Cause Notice, Reassessment
   - Parse: Notice number, date, amount, due date, attached document

2. Notice Parsing
   - Extract: Notice reference number, amount involved, statutory deadline
   - Show Cause Notice: Usually 30 days response time
   - Demand: Authority determination, allow to appeal/appeal filing window
   - Query: Usually 30 days to respond

3. Auto-Extract Response Deadline
   - "Within 30 days" → +30 days from issue date
   - For Show Cause: Usually 30 days
   - Escalation: If not responded in time, proceedings start

4. Notice Storage & Alert
   - Store in notices table with ITR-specific fields
   - Mark high-priority if demand (large amount, short deadline)
   - Alert CA immediately on new notice

5. Response Workflow
   - CA drafts response
   - Client approves
   - CA files response via portal
   - Track filing status

6. API Endpoints
   - POST /api/itr/notices/sync/{client_id}
   - GET /api/itr/notices/{client_id}
   - POST /api/itr/notices/{id}/file-response

IMPLEMENTATION:
- Fetch notices during ITR sync
- Parse notice types and response deadlines
- Store in notices table with ITR context
- Alert CA on high-risk notices
```

### PROMPT 3.5: Build MCA.gov.in Portal Integration

```
TASK: Build OAuth2 with MCA portal to check company compliance status

REQUIREMENTS:
1. MCA Portal OAuth2
   - Register app with MCA (Ministry of Corporate Affairs)
   - CIN-based authentication
   - Endpoint: https://site.mca.gov.in/cersai/api/oauth
   - Scopes: read:company, read:filings, read:compliance

2. Company Status Fetch
   - GET /company/{cin}/status - Get company status (Active, Suspended, etc)
   - GET /company/{cin}/filings - List all filings and status
   - GET /company/{cin}/annual-return - Annual return filing status
   - GET /company/{cin}/mca-6 - MCA-6 (quarterly return) status

3. Compliance Calendar
   - Calculate: AGM due date (within 6 months of FY-end)
   - Board meetings: Minimum 4 per year (track dates filed)
   - Annual return: Due within 6 months of FY-end
   - Show: What's due, what's completed, what's pending

4. Outstanding Compliance Items
   - List: All pending requirements for company
   - Overdue: Forms that were due but not filed
   - Upcoming: Forms due in next 90 days

5. Data Integration
   - Sync company details (auto-update legal name, RoC/Office details)
   - Track director changes (approved changes vs pending)
   - Monitor for disqualifications

6. API Endpoints
   - GET /api/mca/auth-url - OAuth URL
   - POST /api/mca/sync/{client_id} - Fetch status
   - GET /api/mca/compliance-calendar/{client_id} - Calendar view
   - GET /api/mca/outstanding/{client_id} - Pending items

DATABASE SCHEMA:
CREATE TABLE mca_oauth_tokens (
  client_id UUID REFERENCES clients(id),
  access_token_encrypted TEXT,
  token_expires_at TIMESTAMP,
  last_synced TIMESTAMP
);

CREATE TABLE mca_company_status (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  cin TEXT,
  company_name TEXT,
  company_status TEXT, -- 'Active', 'Suspended', 'Dissolved'
  roc_office TEXT,
  registration_date DATE,
  last_annual_return_date DATE,
  annual_return_due_date DATE,
  mca6_last_filed_date DATE,
  board_meetings_count INT,
  outstanding_compliance JSONB,
  downloaded_at TIMESTAMP
);
```

### PROMPT 3.6: Build EPFO Integration for EPF Verification

```
TASK: Build EPF (Employees' Provident Fund) data fetch from EPFO portal

REQUIREMENTS:
1. EPFO Portal Authentication
   - Username/password (credentials stored encrypted)
   - Endpoint: https://epfo.gov.in (check for API endpoint)
   - For now: Username/password login (OAuth might not be available)

2. Data to Fetch
   - Establishment record: EIN (EPF account number), member count
   - Monthly contribution: Contribution status (deposited, pending, default)
   - Member details: Member names, contributions, balances
   - Outstanding: Any delayed deposits, compliance issues

3. Reconciliation
   - Compare: Uploaded EPF payroll vs portal deposits
   - Flag: If member in payroll but not in EPFO account
   - Flag: If deposit pending more than 15 days
   - Flag: If contribution amount mismatch (calc vs actual)

4. Compliance Alerts
   - Non-compliance: If deposits delayed >15 days, flag for client action
   - Disqualification risk: If major default, director disqualification risk
   - Interest/penalty: Calculate interest on delayed deposits

5. API Endpoints
   - POST /api/epf/connect - Establish EPFO login
   - POST /api/epf/sync/{client_id} - Fetch latest data
   - GET /api/epf/status/{client_id} - Show reconciliation status
   - GET /api/epf/alerts/{client_id} - Compliance issues

IMPLEMENTATION:
- Store credentials encrypted
- Monthly sync (15th of month after payroll)
- Compare with payroll records
- Alert CA if deposits pending
```

### PROMPT 3.7: Build ESI Integration for Compliance Check

```
TASK: Build ESI (Employees' State Insurance) compliance checking

REQUIREMENTS:
1. ESI Portal Data Fetch
   - ESI registration number, establishment name
   - Monthly contribution status (deposit, pending, default)
   - Member enrollment status
   - Outstanding: Claims pending, compliance issues

2. Reconciliation
   - Compare: Payroll ESI vs portal deposits
   - Flag mismatches (member count, contribution amount)
   - Flag: If deposits delayed (should be monthly)

3. Alerts
   - Non-payment: Alert CA if ESI unpaid >30 days
   - Compliance violation: Risk of penalty, member benefit denial

4. API Endpoints
   - POST /api/esi/sync/{client_id}
   - GET /api/esi/status/{client_id}
   - GET /api/esi/compliance/{client_id}

IMPLEMENTATION:
- Similar to EPF integration
- Monthly sync coincides with payroll
- Verify enrollment vs payroll records
```

### PROMPT 3.8: Build TAN Portal Integration for TDS Reconciliation

```
TASK: Build TDS/TAN reconciliation with portal data

REQUIREMENTS:
1. TAN Portal Data Fetch
   - TAN registration, deductor info
   - Monthly TDS deposits (status, date, amount)
   - Quarterly reconciliation (24Q/27Q filing status)
   - Outstanding: Unmatched deposits, reconciliation issues

2. Reconciliation Engine
   - Compare: Form 24Q filed vs actual deposits in portal
   - Match: Deductee details, amounts, dates
   - Flag discrepancies: Under-reported, over-reported, non-matching

3. Alerts
   - Reconciliation mismatch: "TDS deposited ₹5L but 24Q shows ₹4.5L"
   - Late filing: "24Q for Q3 due 30 days ago, not filed yet"

4. API Endpoints
   - POST /api/tan/sync/{client_id}
   - GET /api/tan/reconciliation/{client_id}
   - GET /api/tan/alerts/{client_id}

IMPLEMENTATION:
- Quarterly sync (after 24Q filing deadline)
- Verify TDS deposits match quarterly reconciliation
- Flag for CA attention if mismatch
```

---

## PHASE 4: PRODUCTION & SECURITY (Copy & Paste)

### PROMPT 4.1: Deploy to AWS (Cloud Infrastructure)

```
TASK: Move backend from localhost:3001 to AWS production deployment

REQUIREMENTS:
1. AWS Services Setup
   - EC2: Hosted backend server (t3.medium instance, auto-scaling group)
   - RDS: PostgreSQL database (multi-AZ for high availability)
   - S3: File storage (documents, exports)
   - CloudFront: CDN for static assets
   - Route53: Domain DNS
   - ALB: Application Load Balancer (SSL termination)
   - CloudWatch: Logs and monitoring

2. Docker Setup
   - Dockerfile: Containerize Node.js backend
   - Docker Compose: Local dev environment
   - ECR: Push Docker images to AWS registry

3. Database Migration
   - Export current database (if using local PostgreSQL)
   - Import to RDS PostgreSQL
   - Test: Verify all data migrated correctly
   - Backup: Enable automated daily backups

4. Environment Setup
   - Separate environments: Dev, Staging, Production
   - Environment variables: Store in AWS Secrets Manager
   - Database credentials: No hardcoded values
   - API keys: All in Secrets Manager

5. Deployment Pipeline
   - GitHub Actions: CI/CD pipeline
   - On push to main: Run tests → Build Docker image → Push to ECR → Deploy to ECS
   - Rollback capability: Easy rollback if deployment fails

6. Monitoring & Alerts
   - CloudWatch: Monitor CPU, memory, disk, network
   - Alarms: Page on-call if CPU >80% for 5 mins
   - Error tracking: Sentry integration (catch all errors)
   - Uptime monitoring: UptimeRobot (alert if down >5 mins)

IMPLEMENTATION STEPS:
1. Create AWS account, set up IAM roles
2. Create RDS instance (t3.medium, multi-AZ, encrypted)
3. Create EC2 auto-scaling group
4. Set up ALB with SSL certificate
5. Create GitHub Actions workflow
6. Configure CloudWatch and Sentry
7. Test: Deploy staging, run smoke tests, then production

COST ESTIMATE:
- RDS: ~₹3000/month
- EC2: ~₹2000/month
- S3: ~₹500/month
- Bandwidth: ~₹1000/month
- Total: ~₹6500/month for small production setup
```

### PROMPT 4.2: AES-256 Encryption for Sensitive Data

```
TASK: Implement AES-256-GCM encryption for PAN, GSTIN, passwords, credentials

REQUIREMENTS:
1. Encryption Service
   - Algorithm: AES-256-GCM
   - Key management: AWS KMS (never hardcode keys)
   - Per-row IV: Random initialization vector for each encryption
   - Key rotation: Yearly re-encryption with new key

2. Fields to Encrypt
   - PAN (10 chars)
   - GSTIN (15 chars)
   - Bank account numbers
   - Portal passwords (GST, ITR, MCA)
   - OTP backup codes
   - Officer identity proof numbers

3. Encryption/Decryption Middleware
   - On insert/update: Auto-encrypt sensitive fields
   - On read: Auto-decrypt for authorized users only
   - Encryption key: Fetched from AWS KMS (cached for 1 hour)
   - Failed decryption: Log and alert security team

4. Database Schema Changes
   - Add column: encryption_key_version (track which key version used)
   - Store: Encrypted value + IV (IV is not secret, stored with ciphertext)
   - Mark fields as "sensitive" in schema

5. API Response Handling
   - Never return encrypted value to frontend
   - Decrypt on backend, return decrypted value (only to authorized user)
   - Log: Every access to sensitive field (audit trail)

6. Backward Compatibility
   - Existing data: Gradually re-encrypt with new key on update
   - Or: Batch job to re-encrypt all old data

IMPLEMENTATION:
- Use crypto-js or libsodium for AES-256-GCM
- Use AWS SDK to fetch keys from KMS
- Add middleware to database ORM (Sequelize/TypeORM)
- Add audit logging on sensitive field access

CODE EXAMPLE:
```javascript
const encryptSensitiveField = (plaintext, kmsKey) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', kmsKey, iv);
  const encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    encryptedValue: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

const decryptSensitiveField = (encrypted, iv, authTag, kmsKey) => {
  const decipher = crypto.createDecipheriv('aes-256-gcm', kmsKey, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

DATABASE SCHEMA:
CREATE TABLE client_pan (
  id UUID PRIMARY KEY,
  client_id UUID,
  pan_encrypted TEXT,
  pan_iv TEXT,
  pan_auth_tag TEXT,
  encryption_key_version INT,
  created_at TIMESTAMP
);
```

### PROMPT 4.3: Role-Based Access Control (RBAC)

```
TASK: Implement RBAC with 5+ roles and granular permissions

REQUIREMENTS:
1. Roles Definition
   - Admin: Full system access, manage users, view all clients
   - CA Manager: Manage team, all assigned clients, see team billings
   - Senior CA: Handle complex compliance, review junior work, sign off on filings
   - Junior CA: Assigned clients only, limited filing authority, supervised
   - Staff: Data entry only, no filing authority, no financial data access
   - Client Admin: Access own documents, approve filings, view own compliance

2. Permissions
   - VIEW_CLIENT, VIEW_DOCUMENTS, EDIT_DOCUMENTS
   - PREPARE_FORM, FILE_FORM, APPROVE_FORM
   - VIEW_NOTICES, RESPOND_TO_NOTICE
   - VIEW_FINANCIALS, EDIT_FINANCIALS
   - MANAGE_TEAM, MANAGE_BILLING

3. Role-Permission Matrix
   - Admin: All permissions
   - CA Manager: All + MANAGE_TEAM
   - Senior CA: All except MANAGE_TEAM, MANAGE_BILLING
   - Junior CA: VIEW, PREPARE_FORM, not FILE_FORM (Senior must approve)
   - Staff: VIEW, EDIT_DOCUMENTS, PREPARE_FORM only
   - Client: VIEW_OWN_DOCUMENTS, APPROVE_OWN_FORM

4. Implementation
   - Database: roles table, user_roles table, role_permissions table
   - Middleware: Check user role before allowing action
   - Frontend: Hide UI elements user doesn't have permission for
   - Audit: Log every permission check (especially denials)

5. API Protection
   - Every endpoint checks: Does user have required permission?
   - Example: POST /api/forms/file checks user.role in ['admin', 'ca_manager', 'senior_ca']
   - Example: GET /api/client/{id} checks if user assigned to client OR is admin

DATABASE SCHEMA:
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE, -- 'Admin', 'CA Manager', etc
  description TEXT
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE, -- 'VIEW_CLIENT', 'FILE_FORM'
  description TEXT
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  assigned_scope TEXT, -- 'system' (admin), 'team' (team members), 'client' (specific client)
  assigned_client_id UUID REFERENCES clients(id),
  created_at TIMESTAMP
);

IMPLEMENTATION:
- Create roles and permissions in database
- Add permission check middleware
- Create helper: hasPermission(user, permission)
- Test: Verify each role has correct permissions
```

### PROMPT 4.4: Two-Factor Authentication (2FA)

```
TASK: Implement TOTP-based 2FA for all users

REQUIREMENTS:
1. TOTP (Time-based One-Time Password)
   - Uses apps: Google Authenticator, Authy, Microsoft Authenticator
   - Standard: RFC 6238, 6-digits, refreshes every 30 seconds
   - Setup: User scans QR code, enters 2FA secret in authenticator

2. 2FA Flow
   - On login: Enter username/password → Server checks → If 2FA enabled, ask for OTP
   - User enters 6-digit code from authenticator
   - Server verifies: Is code valid? Is time window correct? (±1 window)
   - Success: Grant session token

3. Backup Codes
   - Generate: 10 backup codes on 2FA setup
   - Show: User must write down and store securely
   - Usage: If phone lost, use backup code (5 digits each)
   - Tracking: Mark code as used, user sees count remaining

4. API Endpoints
   - POST /api/auth/2fa/setup - Start 2FA setup
   - POST /api/auth/2fa/verify - Verify 2FA code on setup
   - POST /api/auth/2fa/disable - Disable 2FA
   - GET /api/auth/2fa/backup-codes - Regenerate backup codes

5. Database Schema
   ```sql
   CREATE TABLE user_2fa (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id) UNIQUE,
     totp_secret TEXT, -- Encrypted
     is_enabled BOOLEAN,
     enabled_at TIMESTAMP,
     backup_codes JSONB, -- Array of backup codes
     created_at TIMESTAMP
   );
   ```

6. Frontend Components
   - 2FA setup modal: Show QR code, verify code, print backup codes
   - 2FA prompt on login: Input field for 6-digit code
   - 2FA management: Disable, regenerate backup codes

IMPLEMENTATION:
- Use speakeasy npm package for TOTP generation
- Use qrcode.js to generate QR code
- Store encrypted TOTP secret in DB
- Verify code on each login (if enabled)
- Test with real authenticator app
```

### PROMPT 4.5: Audit Logging for Compliance

```
TASK: Log all user actions for compliance and security audit

REQUIREMENTS:
1. What to Log
   - User login/logout: Username, timestamp, IP, user agent
   - Form access: User, form type, client, timestamp
   - Form filing: User, form, client, filing date, amount (if applicable)
   - Document access: User, document, download/view, timestamp
   - Sensitive data access: PAN view, GSTIN view, password change
   - Permission denied: User, action, reason
   - Admin actions: User creation, role change, permissions modified

2. Log Format
   ```json
   {
     "timestamp": "2025-02-20T14:30:45Z",
     "user_id": "uuid",
     "action": "form_filed",
     "resource_type": "form",
     "resource_id": "uuid",
     "client_id": "uuid",
     "old_value": null,
     "new_value": { "status": "filed", "amount": 50000 },
     "ip_address": "192.168.1.1",
     "user_agent": "Mozilla/5.0...",
     "success": true,
     "error_message": null
   }
   ```

3. Log Storage
   - Short-term: CloudWatch Logs (1 month retention)
   - Long-term: S3 (7 years, for regulatory compliance)
   - Real-time alerts: CloudWatch alerts on sensitive actions

4. Database Schema
   ```sql
   CREATE TABLE audit_logs (
     id UUID PRIMARY KEY,
     timestamp TIMESTAMP,
     user_id UUID,
     action TEXT,
     resource_type TEXT,
     resource_id TEXT,
     client_id UUID,
     old_value JSONB,
     new_value JSONB,
     ip_address TEXT,
     user_agent TEXT,
     success BOOLEAN,
     error_message TEXT
   );

   CREATE INDEX idx_audit_user_time ON audit_logs(user_id, timestamp);
   CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
   ```

5. API Endpoints
   - GET /api/audit-logs - View logs (admin only)
   - GET /api/audit-logs/export - Export logs as CSV (admin only)
   - GET /api/audit-logs/search - Search by user/action/date

IMPLEMENTATION:
- Add audit middleware to all endpoints
- Log before and after database changes
- Store IP and user agent on login
- Create audit log viewer dashboard
- Automated export to S3 weekly
```

---

## FINAL NOTES

**Total: 49 implementation prompts across 6 phases**

For each prompt:
1. Copy the ENTIRE prompt (from ```TASK:``` to the end)
2. Paste into Copilot
3. Copilot will implement the feature with code
4. Review code, test, then move to next prompt

**Critical Path (DO THESE FIRST):**
- Phase 1: All 7 prompts (form generation)
- Phase 2: Prompts 2.1-2.5 (multi-client dashboard, deadlines, alerts)
- Phase 3: Prompts 3.1, 3.3, 3.5 (GST, ITR, MCA portal integrations)
- Phase 4: Prompts 4.1, 4.2, 4.3, 4.5 (AWS, encryption, RBAC, audit logging)

**Optional First Version (Add Later):**
- Phase 5: Advanced features (OCR, accounting sync, etc)
- Phase 6: Complete testing framework

Good luck! 🚀
