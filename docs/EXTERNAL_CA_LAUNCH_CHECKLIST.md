# EXTERNAL CA DASHBOARD - COMPREHENSIVE LAUNCH READINESS AUDIT
## Real CA-Level Compliance Requirements

**File Location**: `/Users/atharavsingh/Desktop/SANNIDH_MASTER/frontend/EXTERNAL_CA_LAUNCH_CHECKLIST.md`

**Purpose**: Audit External CA Dashboard against REAL CA regulatory requirements (21 regulatory domains, 150+ compliance items)

**Target Audience**: Real Chartered Accountants managing compliance for 50-500+ client companies

---

## 📊 REGULATORY DOMAINS COVERED

### ✅ CURRENTLY SUPPORTED (Partial)
1. **GST Compliance** (10/16 forms) - GSTR-1/3B/9/10
2. **Income Tax** (4/13 filings) - ITR-3/4/6, TDS
3. **Audit Support** (5/6 items) - Planning, fieldwork, reports

### ❌ COMPLETELY MISSING (Priority 1: Critical)
4. **Payroll Compliance** (0/15 items) - EPF, ESI, Gratuity
5. **Corporate Governance** (0/18 items) - Board meetings, resolutions, MCA filings
6. **Labour Compliance** (0/8 items) - Employee register, leave tracking
7. **Financial Statements** (0/8 items) - Balance sheet, P&L, cash flow
8. **RBI/FEMA Compliance** (0/6 items) - Foreign exchange, trade finance
9. **SEBI Compliance** (0/6 items) - Stock holding reports, corporate governance
10. **Import/Export** (0/6 items) - Customs, bills of entry, shipping bills
11. **Manufacturing** (0/5 items) - Factory registration, excise, environment
12. **Non-Profit/Trusts** (0/6 items) - 12A/80G registration, CSR
13. **Professional CA Requirements** (0/7 items) - CPE, insurance, ethics
14. **Quality Assurance** (0/5 items) - Peer review, risk assessment
15. **Records Management** (0/12 items) - Backup, retention, encryption

---

## ✅ WHAT'S WORKING (Current Capabilities)

### UI/UX - 100% Complete
- ✅ Client list with search, filter, status
- ✅ Add client form (company name, PAN, GST)
- ✅ Audit calendar with date picker
- ✅ Compliance checklist tracker
- ✅ Document upload manager
- ✅ Audit report generation (basic PDF)
- ✅ Dashboard statistics cards
- ✅ Client status indicators (active/inactive)

### Backend API - 80% Connected
- ✅ getClients() - Retrieve client list
- ✅ addClient() - Add new client
- ✅ getAudits() - List audits for client
- ✅ scheduleAudit() - Create audit
- ✅ getComplianceItems() - List compliance checklist items
- ✅ updateComplianceStatus() - Mark items complete
- ✅ uploadDocument() - File upload
- ✅ generateAuditReport() - PDF export

### Database Schema - Functional
- ✅ ca_clients (id, name, pan, gst_number, status)
- ✅ ca_audits (id, client_id, audit_type, status, dates)
- ✅ compliance_items (id, audit_id, requirement, status, due_date)
- ✅ audit_documents (id, audit_id, filename, upload_date)
- ✅ audit_reports (id, audit_id, report_data, generated_date)

### Current Audit Types Supported
- GST Audit (only)
- IT Audit (basic)
- Annual Audit (basic)

---

## ❌ MISSING FEATURES BY REGULATORY DOMAIN

---

### DOMAIN 1: GST COMPLIANCE (Complete Form Coverage)

**Current Status**: 4/16 forms supported (25%)

#### 1.1 GSTR-1 (Outward Supplies) - CRITICAL
**Status**: Partial implementation  
**Need**: Complete GSTR-1 generation with item-wise details (invoice mapping)  
**Impact**: Most frequently filed form, revenue impact highest  
**Fix Time**: 3-4 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: Auto-populate GSTR-1 from company invoice register; match invoices to customers
- **Tech stack**: Node.js + invoice parser + PDF generator (pdfkit) + GST format validation
- **How it works**: (1) Company uploads invoices/sales ledger, (2) System extracts invoice date/amount/customer/HSN, (3) Auto-fills GSTR-1 schedule B1/B2 (B2B/B2C), (4) Validates HSN-SAC codes, (5) CA reviews + submits to gst.gov.in
- **Data needed**: Invoice date, customer GSTIN/PAN, invoice amount, HSN code, tax rate, tax amount
- **Auto-calculations**: Taxable value, CGST, SGST, IGST, reverse charge (RCM)
- **Validation**: Duplicate invoice check, GSTIN format, HSN validity, tax rate accuracy
- **Testing**: Load test data (100+ invoices), verify calculations match government specs

#### 1.2 GSTR-2B (ITC Eligibility) - CRITICAL
**Status**: ✅ Implemented  
**Need**: Pull GSTR-2B data from gst.gov.in portal + auto-reconcile with purchase register  
**Impact**: Determines how much ITC (Input Tax Credit) CA can claim  
**Fix Time**: 5-7 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: Auto-download GSTR-2B from portal, reconcile against company purchases
- **Tech stack**: Cheerio scraper (to auto-pull from portal) + Supabase scheduled functions
- **How it works**: (1) System auto-logs into gst.gov.in using CA credentials (encrypted), (2) Downloads GSTR-2B JSON, (3) Extracts supplier invoices + HSN + tax, (4) Compares with company's purchase register (manual upload), (5) Flags discrepancies ("supplier filed different amount"), (6) CA reviews and approves ITC
- **Data needed**: Company GSTIN, supplier GSTIN, invoice number, date, amount, HSN, tax, ITC claimed
- **Validation**: Supplier GSTIN valid, invoice date within 30 days of supplier filing, ITC eligibility
- **Alerts**: "Supplier hasn't filed GSTR-1 yet" (ITC not available), "Discrepancy: You claimed ₹10K but supplier filed ₹15K"
- **Security**: Encrypt GSTIN/passwords, rate-limit scraper (avoid portal blocks), use proxy IPs
- **Testing**: Test with 5 real suppliers, verify ITC calculation accuracy

#### 1.3 GSTR-3B (Monthly Return) - CRITICAL
**Status**: Partial (basic structure only)  
**Need**: Auto-calculate ITC reconciliation, provide summary before filing  
**Impact**: CA's main deliverable; compliance deadline is 20th of next month  
**Fix Time**: 2-3 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: Dashboard showing GSTR-3B calculation breakdown + red-flag alerts
- **Tech stack**: React components + Supabase calculations + email alerts
- **How it works**: (1) System pulls GSTR-1 + GSTR-2B data, (2) Calculates: Liability (sales tax) - ITC (purchase tax) = Net tax due, (3) Shows breakdown: "Outward supply ₹10L @ 5% = ₹5K tax", "ITC available ₹3K", "Pay ₹2K", (4) CA reviews + clicks "File GSTR-3B", (5) System submits to gst.gov.in
- **Auto-calculations**: Reverse Charge Mechanism (RCM) tax if applicable, ITC restriction for blocked credit
- **Alerts**: "ITC > 50% of liability? File DRC-01 form", "Missing ITC documents for ₹2K credit"
- **Error prevention**: Block filing if liability shows negative (suggest amendment instead)
- **Testing**: Test with varied scenarios (positive liability, negative liability, RCM)

#### 1.4 GSTR-4 (Composition Levy) - HIGH
**Status**: Not implemented  
**Need**: Support for composition suppliers (smaller businesses with turnover < 50L)  
**Impact**: Different calculation (1-5% flat rate instead of item-wise HSN)  
**Fix Time**: 1-2 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: Separate filing workflow for composition suppliers
- **Tech stack**: Conditional rendering (React) + alternative tax calculation
- **How it works**: (1) CA selects "Composition supplier" checkbox, (2) System auto-calculates: Turnover × Rate (1-5%), (3) No HSN tracking needed, (4) Simpler filing
- **Data needed**: Monthly turnover, composition rate (set by government)
- **Testing**: Verify flat tax calculation vs regular HSN-based tax

#### 1.5 GSTR-5, 6, 7, 8 (Casual/ISD/E-commerce) - MEDIUM
**Status**: Not implemented  
**Need**: Support for specialized supplier types  
**Fix Time**: 3-4 days  
**Priority**: MEDIUM

#### 1.6 GSTR-9 (Annual Return) - HIGH
**Status**: Not implemented  
**Need**: Yearly reconciliation + schedule wise filing  
**Impact**: Must file by December 31, audit required  
**Fix Time**: 2-3 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: Annual summary of all monthly GSTR-3B filings + reconciliation with financial statements
- **Tech stack**: React components + aggregation queries
- **How it works**: (1) Pull all 12 monthly GSTR-3B submissions, (2) Reconcile total outward/inward with P&L, (3) Flag discrepancies ("Books show ₹50L sales but GSTR shows ₹55L"), (4) Auto-generate Schedule 3A-3D forms, (5) CA reviews + files
- **Validation**: Total sales in GSTR = Total sales in P&L (within 5% tolerance)
- **Testing**: Load year-end data, verify reconciliation accuracy

#### 1.7 GSTR-9C (Reconciliation Statement) - HIGH
**Status**: Not implemented  
**Need**: Mandatory if turnover > 20L  
**Impact**: Audit document; certification by independent CA required  
**Fix Time**: 2-3 days  
**Priority**: HIGH

#### 1.8 GSTR-10 (Final Return) - MEDIUM
**Status**: Not implemented  
**Need**: Filing upon business closure/de-registration  
**Impact**: Closure document; block future filings if not done  
**Fix Time**: 1 day  
**Priority**: MEDIUM

#### 1.9-16. Form DRC-01, RFD, ITC-01, etc - MEDIUM
**Status**: Not implemented  
**Need**: Support for amendments, refunds, ITC reversals  
**Fix Time**: 2-3 days each  
**Priority**: MEDIUM

---

### DOMAIN 2: INCOME TAX FILING (All ITR Types)

**Current Status**: 2/13 forms supported (15%)

#### 2.1 ITR-1 (Salary Income) - HIGH
**Status**: Not implemented  
**Need**: For salaried employees, pensioners  
**Fix Time**: 2 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: Auto-fill ITR-1 from Form 16 (salary certificate)
- **Tech stack**: React form + PDF parsing (extract From 16 data) + ITR-1 format
- **How it works**: (1) Upload Form 16, (2) System extracts: employee name, PAN, salary, TDS, employer details, (3) Auto-fills ITR-1 schedule, (4) Calculate tax liability, (5) CA verifies + files electronically
- **Data fields**: Name, PAN, DOB, salary, HRA, bonus, arrears, deductions (80C/80D/80E), tax credits
- **Validation**: TDS in Form 16 matches total deduction claimed, salary matches Form 16
- **Testing**: Test with various salary structures (fixed+variable, with/without HRA)

#### 2.2 ITR-2 (Capital Gains) - MEDIUM
**Status**: Not implemented  
**Need**: For individuals with short-term/long-term capital gains (stocks, property, crypto)  
**Fix Time**: 2-3 days  
**Priority**: MEDIUM

#### 2.3 ITR-3 (Business Income) - CRITICAL
**Status**: Partial (basic structure)  
**Need**: Auto-generate from balance sheet + P&L; highest complexity  
**Impact**: Most CAs' primary work  
**Fix Time**: 4-5 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: Auto-populate ITR-3 from company's balance sheet + P&L statements
- **Tech stack**: Financial statement parser + ITR-3 schedule automation
- **How it works**: (1) Upload balance sheet + P&L, (2) System extracts: business profit, depreciation, disallowances (entertainment, foreign travel per policy limits), (3) Calculate taxable income, (4) Apply slab rates, (5) Ca verifies + files
- **Data from financials**: Business income, depreciation, interest, rent, salary to staff, audit fees, disallowable expenses (per section 37)
- **Schedules to auto-generate**: Schedule TSI (Taxable income from salary), TTSI (Total TSI), TIS (Taxable income from other sources)
- **Validation**: Disallowance limits (travel at 2% of profit, entertainment 1%, etc.), depreciation rates per asset class
- **Testing**: Test with variations (loss, low profit, high depreciation)

#### 2.4 ITR-4 (Presumptive Income) - HIGH
**Status**: Partial  
**Need**: For small businesses with turnover < 2Cr (profit assumed 8% or 6% for service)  
**Impact**: Simplified filing; many CAs use this  
**Fix Time**: 1-2 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: Simplified ITR-4 where profit is auto-calculated (8% of turnover for business, 6% for service)
- **Tech stack**: React form + simple tax calculation
- **How it works**: (1) CA enters turnover, (2) System calculates profit = Turnover × 8%, (3) Auto-calculate tax, (4) File ITR-4
- **Validation**: Turnover < ₹2Cr, GST registration status, no losses claimed
- **Testing**: Verify profit calculation for different turnover slabs

#### 2.5 ITR-5 (Partnership Firms) - MEDIUM
**Status**: Not implemented  
**Need**: Separate return for partnership entity (before partner ITRs)  
**Fix Time**: 2-3 days  
**Priority**: MEDIUM

#### 2.6 ITR-6 (Companies) - HIGH
**Status**: Partial (basic structure)  
**Need**: Corporate return with balance sheet, profit & loss, cash flow  
**Impact**: Required for all companies  
**Fix Time**: 3-4 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: Auto-generate corporate ITR-6 from audited financial statements
- **Tech stack**: Financial statement parser + ITR schedule automation
- **How it works**: (1) Upload audited balance sheet + P&L + audit report, (2) System extracts: profit after tax, add-backs (disallowances), tax credits, (3) Calculates total tax + surcharge + cess, (4) Ca verifies + files electronically
- **Schedules**: CITS (Corporate Income and Tax Statement), Profit & loss details
- **Validation**: P&L matches audit report, depreciation per IT Act rates, DTA/DTL for deferred tax
- **Testing**: Test with dividend distribution, FDI income, capital gains

#### 2.7 ITR-7 (Charitable Trusts) - LOW
**Status**: Not implemented  
**Fix Time**: 2 days  
**Priority**: LOW

#### 2.8-13 TDS, Advance Tax, Form 10-IA - HIGH PRIORITY
**Status**: Not implemented  
**Need**: Quarterly TDS returns (24Q/27Q), advance tax installments, investment forms  
**Impact**: Regulatory deadlines; penalties for late filing  
**Fix Time**: 3-4 days  
**Priority**: HIGH

**Implementation Details (TDS Returns)**:
- **What to build**: Auto-collect TDS deductions across company, generate quarterly returns
- **Tech stack**: Quarterly aggregation + PDF generation
- **How it works**: (1) Company reports all TDS deductions (salary, contractor payments, interest, rent) quarterly, (2) System aggregates + generates Form 24Q (salary TDS), (3) CA files to IT dept, (4) Generate Form 16/16A certificates
- **Data needed**: Deductee name/PAN, amount, deduction rate, exemption certificates
- **Validation**: Pan validity, TDS deduction rate per section
- **Testing**: Verify quarterly aggregation, Form 16 generation

---

### DOMAIN 3: PAYROLL COMPLIANCE (EPF/ESI/Labour) - CRITICAL

**Current Status**: 0/21 items implemented (0%)

#### 3.1 EPF (Employee Provident Fund) - CRITICAL
**Status**: Not implemented  
**Need**: Mandatory for all companies with 20+ employees  
**Impact**: Monthly contributions (24% payroll: 12% employer + 12% employee)  
**Fix Time**: 4-5 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: EPF calculation module + monthly filing + annual reconciliation
- **Tech stack**: Payroll integration + Supabase scheduled functions + EPFO filing API
- **How it works**: (1) Upload monthly payroll (employee names, salaries), (2) System calculates EPF: basic salary × 12% (max ₹15K/month), (3) Auto-generate EPF deposit slip, (4) Track monthly remittance, (5) Generate annual statement (Form EPF-10), (6) Reconcile at year-end
- **Data fields**: Employee name, PAN, UAN (EPF account), basic salary, dearness allowance, deduction date
- **Features**: EPF advance tracking (loans against EPF), settlement calculation (upon exit)
- **Alerts**: "EPF due on 15th of next month", "Pending contributions from 3 employees"
- **Validations**: UAN registered, employee age > 18, salary in valid range
- **Testing**: Test EPF calculation for varied salaries, multiple employees, year-end settlement

#### 3.2 ESI (Employee State Insurance) - HIGH
**Status**: Not implemented  
**Need**: Mandatory for companies with 10+ employees OR payroll > ₹21,000/month  
**Impact**: Monthly premiums (employer 3.25% + employee 0.75%)  
**Fix Time**: 2-3 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: ESI calculation + monthly filing + claims tracking
- **Tech stack**: Payroll integration + ESI portal API
- **How it works**: (1) Upload monthly payroll, (2) System calculates ESI: monthly wages × 4.25% (split: employer 3.25% + employee 0.75%), (3) Auto-generate ESI deposit slip, (4) File monthly returns, (5) Track employee medical claims
- **Data needed**: Employee name, ESI number, monthly wages (excluding allowances > 50% of basic)
- **Features**: Employee claim tracking (hospitalization benefits, maternity), settlement upon exit
- **Validations**: Employee age, wages in ESI range, minimum coverage threshold
- **Testing**: Test ESI calculation, claim processing

#### 3.3 Gratuity Calculation - HIGH
**Status**: Not implemented  
**Need**: Upon employee exit after 5 years; ₹50K limit + 15 days' pay per year  
**Impact**: Legal obligation; company liability  
**Fix Time**: 1-2 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: Auto-calculate gratuity on employee exit
- **Tech stack**: Employee database + exit module + calculation rules
- **How it works**: (1) Employee exits after 5 years, (2) System calculates: (basic × 15 × years of service) / 30 (capped at ₹50K), (3) Include service benefits (medical, leave encashment), (4) Generate full & final settlement
- **Data**: Years of service, basic salary, service period, leave balance
- **Validation**: Service > 5 years, gratuity < ₹50K, settlement approval by HR
- **Testing**: Test gratuity for varied service periods

#### 3.4 Leave Tracking - MEDIUM
**Status**: Not implemented  
**Need**: Annual leave record (casual, sick, earned)  
**Fix Time**: 1-2 days  
**Priority**: MEDIUM

#### 3.5 Labour Compliance (Shop & Establishment) - HIGH
**Status**: Not implemented  
**Need**: Annual renewal, workplace inspection compliance  
**Impact**: Business continuity; penalties for non-compliance  
**Fix Time**: 2-3 days  
**Priority**: HIGH

---

### DOMAIN 4: CORPORATE GOVERNANCE (MCA Compliance) - CRITICAL

**Current Status**: 0/18 items implemented (0%)

#### 4.1 DIN (Director Identification Number) - CRITICAL
**Status**: ✅ Implemented  
**Need**: Required for all directors; apply via DIR-12 form  
**Impact**: Cannot conduct business without valid DIN  
**Fix Time**: 2 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: DIN application tracking + renewal reminders (valid 5 years)
- **Tech stack**: MCA portal integration + email alerts
- **How it works**: (1) Director applies for DIN via MCA portal (DIR-12), (2) System tracks application status, (3) Auto-alert when DIN expires (5-year cycle), (4) Generate renewal reminder with document checklist
- **Tracking**: Application date, DIN issue date, expiry date, KYC submission status
- **Alerts**: "DIN expires in 3 months, apply for renewal", "DIR-3-KYC update required"
- **Testing**: Verify DIN validity lookup, expiry calculation

#### 4.2 Board Meetings - CRITICAL
**Status**: ✅ Implemented  
**Need**: Minimum 4 meetings per year (quarterly); documented with minutes  
**Impact**: Non-compliance = penalties + director liability  
**Fix Time**: 2-3 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: Board meeting scheduler + minutes documentation + compliance tracking
- **Tech stack**: Calendar integration + document management
- **How it works**: (1) System reminds: "Board meeting due in Q2 (by June 30)", (2) Company schedules meeting via system, (3) CA documents: date, attendees, agenda, decisions, (4) Auto-generates board minutes from notes, (5) Track compliance: "4/4 meetings held in FY 2024-25"
- **Documents needed**: Board minutes (signed), director attendance record, resolution documents
- **Validation**: Min 4 meetings/year, all directors notified, quorum met
- **Alerts**: "Board meeting overdue by 2 months", "Missing 1 meeting for year-end compliance"
- **Testing**: Verify quarterly scheduling, minutes generation, compliance calculation

#### 4.3 General Meetings (AGM) - CRITICAL
**Status**: ✅ Implemented  
**Need**: Annual General Meeting within 6 months of year-end; shareholder approval  
**Impact**: Dividend distribution, director re-appointment blocked without AGM  
**Fix Time**: 2-3 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: AGM scheduling + shareholder communication + resolution tracking
- **How it works**: (1) System reminds: "AGM due by August 31 (6 months from March 31 year-end)", (2) Company schedules AGM, (3) System generates: notice (21 days advance), agenda, resolution forms, (4) Track attendance + voting, (5) Document AGM minutes + secretary's statement
- **Documents**: Notice, agenda, director report, financial statements, resolution documents, attendance register
- **Validation**: AGM within 6 months, 21-day notice given, quorum (min 2 shareholders/directors)
- **Testing**: Verify AGM scheduling, document generation

#### 4.4 Board Resolutions - HIGH
**Status**: ✅ Implemented  
**Need**: Document all major business decisions (borrowing, asset sale, investment, dividend)  
**Impact**: Audit requirement; dispute resolution  
**Fix Time**: 1-2 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: Resolution template library + digital signature capture
- **Tech stack**: Template engine + e-signature (Razorsign or DocuSign)
- **How it works**: (1) Company selects resolution type (loan approval, asset purchase, etc.), (2) System generates resolution text, (3) Directors sign digitally, (4) System stores signed copies with timestamp, (5) CA retrieves for file
- **Resolution types**: Borrowing, investment, asset sale, director appointment, salary change
- **Testing**: Verify resolution generation, signature capture, file storage

#### 4.5 MCA Filings (Annual Return) - CRITICAL
**Status**: ✅ Implemented  
**Need**: Annual return (Form 20-B + financial statements) due by end of month following AGM  
**Impact**: Non-compliance = penalties, disqualification, criminal liability  
**Fix Time**: 3-4 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: Annual return generator + automatic MCA portal filing
- **Tech stack**: Financial statement parser + MCA filing API
- **How it works**: (1) Collect audited balance sheet, P&L, notes, (2) System validates format + schedules, (3) Auto-populate Form 20-B (director details, shareholding, remuneration), (4) Include cash flow statement + related party transactions, (5) File electronically to MCA with CA certification
- **Documents**: Balance sheet, P&L, director's report, auditor's report, schedules A-H, cash flow
- **Validation**: Financial data matches audit report, director details current, shareholding updated
- **Alerts**: "Annual return due by April 30 (month after year-end)", "Missing financial statements for filing"
- **Testing**: Test filing with varied company structures (private, public, holding, subsidiary)

#### 4.6 Register Maintenance - MEDIUM
**Status**: Not implemented  
**Need**: Keep current: Directors register, shareholders register, board minutes, seal register  
**Impact**: Inspection compliance; dispute evidence  
**Fix Time**: 2-3 days  
**Priority**: MEDIUM

**Implementation Details**:
- **What to build**: Digital register system with change tracking
- **Tech stack**: Database + digital record keeping
- **How it works**: (1) Directors register: maintain list with DIN, appointment date, resignation date, (2) Shareholders register: track ownership changes with certificate numbers, (3) Board minutes: store all meeting minutes + resolutions, (4) Seal register: log all uses of company seal
- **Updates**: Auto-update director details from DIN renewals, track share transfers
- **Export**: Generate register printouts for inspection
- **Testing**: Verify register updates, change tracking

#### 4.7 Director KYC (DIR-3-KYC) - MEDIUM
**Status**: Not implemented  
**Need**: KYC update every 2 years; upload PAN, Aadhaar, photo, address  
**Impact**: Non-compliance = director disqualification  
**Fix Time**: 1-2 days  
**Priority**: MEDIUM

---

### DOMAIN 5: FINANCIAL STATEMENTS & AUDIT - HIGH PRIORITY

**Current Status**: 0/8 items implemented (0%)

#### 5.1 Balance Sheet Preparation - HIGH
**Status**: Not implemented  
**Need**: Assets, liabilities, equity in prescribed format  
**Fix Time**: 2-3 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: Balance sheet template with inter-company linkages (GL → schedules → balance sheet)
- **Tech stack**: General ledger import + balance sheet formatter
- **How it works**: (1) Import GL from accounting software (Tally, QuickBooks), (2) Auto-categorize: fixed assets, current assets, liabilities, equity, (3) Prepare schedules (depreciation, receivables aging, payables aging), (4) Auto-populate balance sheet, (5) Validate: assets = liabilities + equity
- **Schedules**: Fixed assets (cost, depreciation, NBV), investments, debtors, creditors, loans, equity
- **Validation**: Trial balance match, contra accounts eliminated, related party items disclosed
- **Testing**: Load varied GL structures (trading, service, manufacturing)

#### 5.2 Profit & Loss Account - HIGH
**Status**: Not implemented  
**Need**: Revenue, cost of goods sold, expenses, profit  
**Fix Time**: 2-3 days  
**Priority**: HIGH

#### 5.3 Cash Flow Statement - MEDIUM
**Status**: Not implemented  
**Need**: Operating, investing, financing cash flows  
**Fix Time**: 2-3 days  
**Priority**: MEDIUM

#### 5.4-8 Notes to Accounts, Related Party Disclosure, Audit Report - HIGH
**Status**: Not implemented  
**Fix Time**: 2-3 days each  
**Priority**: HIGH

---

### DOMAIN 6: RBI/FEMA COMPLIANCE - MEDIUM PRIORITY

**Current Status**: 0/6 items implemented (0%)

#### 6.1 Foreign Exchange Compliance (FEMA) - HIGH
**Status**: Not implemented  
**Need**: Track FDI inflows, overseas remittances, trade finance  
**Impact**: Regulatory reporting to RBI  
**Fix Time**: 2-3 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: Foreign exchange tracking module + RBI reporting
- **Tech stack**: Transaction tracking + RBI e-form submission
- **How it works**: (1) Log FDI investment (shares issued to foreign investor), (2) Track overseas remittance (salary/dividend/service payment), (3) Maintain trade finance docs (LC, Bill of Lading), (4) Auto-report via RBI e-forms (AD Code Form)
- **Data**: Transaction type, amount in INR/USD, remittance to which country, purpose
- **Validation**: FEMA limits (LRS cap for individuals, FDI approval threshold), advance approval if needed
- **Testing**: Test FDI tracking, overseas remittance calculation

---

### DOMAIN 7: SEBI COMPLIANCE - LOW PRIORITY

**Current Status**: 0/6 items implemented (0%)

#### 7.1 Stock Exchange Filings - MEDIUM
**Status**: Not implemented  
**Need**: If company is listed (public) or has ESOP  
**Impact**: Material event disclosure, insider trading rules  
**Fix Time**: 2-3 days  
**Priority**: MEDIUM

---

### DOMAIN 8: IMPORT/EXPORT COMPLIANCE - MEDIUM PRIORITY

**Current Status**: 0/6 items implemented (0%)

#### 8.1 Customs Duty & Bill of Entry - HIGH
**Status**: Not implemented  
**Need**: For importers; filing with customs dept  
**Impact**: Customs clearance, duty payment, GST ITC  
**Fix Time**: 3-4 days  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: Import documentation tracking + customs duty calculation + ITC reconciliation
- **Tech stack**: Customs API integration + document management
- **How it works**: (1) Importer uploads: proforma invoice, packing list, bill of lading, (2) System calculates: CIF value, basic customs duty (BCD), IGST, (3) Generate Bill of Entry (BE) for customs filing, (4) Track duty payment, (5) Link GST ITC with import duty
- **Documents**: Proforma invoice, packing list, bills of lading, customs bonds, IGM (import general manifest)
- **Calculations**: CIF value (cost + insurance + freight), BCD (10-25%), IGST on imported goods
- **Testing**: Test duty calculation for varied HS codes, ITC reconciliation

---

### DOMAIN 9: MANUFACTURING COMPLIANCE - LOW PRIORITY

**Current Status**: 0/5 items implemented (0%)

---

### DOMAIN 10: NON-PROFIT/TRUST COMPLIANCE - MEDIUM PRIORITY

**Current Status**: 0/6 items implemented (0%)

#### 10.1 12A Registration (Tax Exemption) - HIGH
**Status**: Not implemented  
**Need**: For NGOs/trusts to claim income tax exemption  
**Impact**: Enables donation tax benefits (80G)  
**Fix Time**: 2 days  
**Priority**: HIGH

---

### DOMAIN 11: PROFESSIONAL CA REQUIREMENTS - MEDIUM PRIORITY

**Current Status**: 0/7 items implemented (0%)

#### 11.1 CPE (Continuing Professional Education) - HIGH
**Status**: Not implemented  
**Need**: CA must do 40 hours CPE per year to maintain membership  
**Impact**: Membership suspension if non-compliant  
**Fix Time**: 1 day  
**Priority**: HIGH

**Implementation Details**:
- **What to build**: CPE tracking + certificate management
- **Tech stack**: Learning management system (LMS) integration
- **How it works**: (1) CA logs CPE courses taken (in-person, online, seminars), (2) System tracks hours, (3) Auto-alert: "20/40 CPE hours completed, 8 months left", (4) Generate annual compliance report for ICAI
- **Data**: Course name, provider, date, duration, certification
- **Validation**: Courses from approved ICAI providers
- **Testing**: Verify hour accumulation, annual rollover

#### 11.2 Professional Indemnity Insurance - HIGH
**Status**: Not implemented  
**Need**: Insurance coverage for audit/assurance services  
**Impact**: Regulatory requirement to practice  
**Fix Time**: 1 day  
**Priority**: HIGH

---

### DOMAIN 12: QUALITY ASSURANCE & INTERNAL CONTROLS - MEDIUM PRIORITY

**Current Status**: 0/5 items implemented (0%)

#### 12.1 Audit File Quality Review - MEDIUM
**Status**: Not implemented  
**Need**: Periodic review of audit working papers for compliance  
**Impact**: Reduces regulatory audit risk  
**Fix Time**: 2-3 days  
**Priority**: MEDIUM

---

### DOMAIN 13: RECORDS MANAGEMENT & DATA SECURITY - CRITICAL PRIORITY

**Current Status**: 0/12 items implemented (0%)

#### 13.1 7-Year Record Retention - CRITICAL
**Status**: Not implemented  
**Need**: Tax records kept minimum 7 years; audit reports 2 years  
**Impact**: Regulatory requirement; evidence for disputes  
**Fix Time**: 1-2 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: Automatic record archival + retention policy enforcement
- **Tech stack**: Supabase archival + automated deletion after retention period
- **How it works**: (1) All documents (invoices, receipts, filings, audit reports) timestamped on upload, (2) System auto-archives to cold storage after 1 year (older records), (3) Auto-deletion trigger: "Record age > 7 years for tax docs, delete", (4) Maintain deletion audit trail
- **Data retention rules**: Tax docs 7 years, audit docs 2 years, compliance docs 2 years, emails 3 years
- **Testing**: Verify archive triggers, deletion timing

#### 13.2 Data Encryption (AES-256) - CRITICAL
**Status**: Partial (HTTPS only)  
**Need**: All sensitive data encrypted at rest (client financial data)  
**Impact**: Data breach risk; regulatory fine  
**Fix Time**: 3-4 days  
**Priority**: CRITICAL

**Implementation Details**:
- **What to build**: AES-256 encryption for all sensitive fields
- **Tech stack**: crypto library (Node.js) + Supabase Vault
- **Encrypted fields**: GST number, PAN, financial statements, audit reports, correspondence
- **Keys**: Encryption keys stored in Supabase Vault (never in code)
- **Decryption**: Only on CA request, logged for audit
- **Testing**: Verify encryption on storage, decryption on retrieval, key rotation

#### 13.3 2FA (Two-Factor Authentication) - CRITICAL
**Status**: Not implemented  
**Need**: All CA logins require password + OTP (authenticator app)  
**Impact**: Prevent account takeover  
**Fix Time**: 2-3 days  
**Priority**: CRITICAL

#### 13.4 GDPR/DISHA Compliance - CRITICAL
**Status**: Basic only  
**Need**: Right to export, right to delete, DPA with CAs  
**Impact**: Legal compliance; fines up to ₹50L  
**Fix Time**: 2-3 days  
**Priority**: CRITICAL

---

## 📋 COMPREHENSIVE MISSING FEATURES LIST

### CRITICAL (Must Do Before Launch - 3-4 Weeks)

| # | Feature | Domain | Est. Days | Why Critical |
|----|---------|--------|-----------|------------|
| 1 | GSTR-1 Auto-generation | GST | 3-4 | Most filed form; revenue impact |
| 2 | GSTR-2B Download & Reconciliation | GST | 5-7 | ITC claim validation |
| 3 | ITR-3 Auto-generation | IT | 4-5 | Most CA workload |
| 4 | EPF Calculation & Filing | Payroll | 4-5 | Mandatory 20+ employees |
| 5 | Board Meetings Management | Corp Gov | 2-3 | 4/year required; penalties |
| 6 | Annual MCA Return (Form 20-B) | Corp Gov | 3-4 | Every company; annual deadline |
| 7 | DIN Management & Renewal | Corp Gov | 2 | Required for all directors |
| 8 | Balance Sheet Generation | Audit | 2-3 | Core financial document |
| 9 | Data Encryption (AES-256) | Security | 3-4 | Protect client data |
| 10 | 7-Year Record Retention | Records | 1-2 | Regulatory requirement |

### HIGH PRIORITY (Do Weeks 3-6)

| # | Feature | Domain | Est. Days |
|----|---------|--------|-----------|
| 11 | GSTR-3B Calculation | GST | 2-3 |
| 12 | ITR-6 (Corporate) | IT | 3-4 |
| 13 | ITR-4 (Presumptive) | IT | 1-2 |
| 14 | Form 16 Generation | TDS | 1-2 |
| 15 | TDS Returns (24Q/27Q) | TDS | 2-3 |
| 16 | ESI Calculation | Payroll | 2-3 |
| 17 | Gratuity Calculation | Payroll | 1-2 |
| 18 | AGM Scheduling | Corp Gov | 2-3 |
| 19 | Board Resolution Templates | Corp Gov | 1-2 |
| 20 | Profit & Loss Account | Audit | 2-3 |
| 21 | 2FA Login | Security | 2-3 |
| 22 | CPE Tracking | Prof Compliance | 1-2 |

### MEDIUM PRIORITY (Do Weeks 6-10)

| # | Feature | Domain | Est. Days |
|----|---------|--------|-----------|
| 23 | GSTR-4/5/6 (Composition/Casual) | GST | 3-4 |
| 24 | GSTR-9 (Annual Return) | GST | 2-3 |
| 25 | ITR-1/2/5/7 (Other ITRs) | IT | 2-3 each |
| 26 | Leave Tracking | Payroll | 1-2 |
| 27 | Register Maintenance | Corp Gov | 2-3 |
| 28 | Cash Flow Statement | Audit | 2-3 |
| 29 | FEMA Compliance | RBI | 2-3 |
| 30 | Customs Bill of Entry | Import/Export | 3-4 |

### LOW PRIORITY (Phase 2+)

| # | Feature | Domain | Est. Days |
|----|---------|--------|-----------|
| 31 | Manufacturing Compliance | Mfg | 3-4 |
| 32 | SEBI Filings | SEBI | 2-3 |
| 33 | Trust/NGO 12A Registration | Non-profit | 2 |
| 34 | Audit File Quality Review | QA | 2-3 |
| 35 | Mobile App (Phase 2) | Mobile | 4-6 weeks |

---

## 📊 CURRENT READINESS BY DOMAIN

| Domain | % Complete | Status | Action |
|--------|-----------|--------|--------|
| **GST** | 25% | Partial | Add GSTR-2B, GSTR-9C, DRC-01 |
| **Income Tax** | 15% | Partial | Add ITR-1/2/5/7, TDS, Advance Tax |
| **Payroll** | 0% | Missing | Build EPF, ESI, Gratuity module |
| **Corporate Gov** | 0% | Missing | Build DIN, board, MCA filings |
| **Audit** | 40% | Partial | Add balance sheet, P&L, schedules |
| **Records** | 10% | Partial | Add encryption, retention, backup |
| **FEMA** | 0% | Missing | Add FDI, remittance tracking |
| **SEBI** | 0% | Missing | Add stock, insider trading |
| **Import/Export** | 0% | Missing | Add customs, HS codes |
| **Manufacturing** | 0% | Missing | Add factory, excise, environment |
| **Non-Profit** | 0% | Missing | Add 12A, 80G, CSR |
| **Professional** | 0% | Missing | Add CPE, insurance |
| **Quality** | 0% | Missing | Add audit review, peer check |
| **Data Security** | 40% | Partial | Add encryption, 2FA, GDPR |
| **OVERALL** | **15%** | **Poor** | 6+ weeks work needed |

---

## 🚀 PHASED BUILD PLAN (Real CA Launch)

### PHASE 1: FOUNDATION (Weeks 1-4) - Reach 50% Complete
**Goal**: Support top 10 regulatory filings; payments + notifications working

**Week 1**: GST Foundation
- GSTR-1 auto-generation ✓
- GSTR-2B download & reconciliation ✓
- Basic email alerts ✓

**Week 2**: Tax Returns
- ITR-3 auto-generation ✓
- Form 16 generation ✓
- Basic reporting ✓

**Week 3**: Payroll & Compliance
- EPF calculation ✓
- Board meetings tracker ✓
- Payment system ✓

**Week 4**: Polish & Testing
- End-to-end testing with 5 real CAs ✓
- Bug fixes ✓
- Launch to 10 CAs ✓

### PHASE 2: CORE FILINGS (Weeks 5-8)
- GSTR-3B, 4, 9, 9C
- ITR-4, 6
- ESI, Gratuity
- AGM, Board Resolutions
- MCA Annual Return

### PHASE 3: COMPLETE COVERAGE (Weeks 9-12)
- All ITR types (1, 2, 5, 7)
- Advanced GST (DRC-01, RFD)
- FEMA compliance
- Customs filings
- Advanced audit support

---

## 🎯 LAUNCH CRITERIA (Must Meet)

Before going live to real CAs, ensure:

- ✅ GST filings (GSTR-1/3B/9) working 100%
- ✅ ITR filings (ITR-3/4/6) working 100%
- ✅ Payroll (EPF/ESI) basic functionality
- ✅ Corporate governance (DIN/Board/MCA) basic tracking
- ✅ Payment system live (monthly subscriptions)
- ✅ Email alerts for all deadlines
- ✅ Data encryption (AES-256) implemented
- ✅ 2FA login enabled
- ✅ End-to-end testing with 5-10 real CAs
- ✅ < 10 critical bugs remaining
- ✅ GDPR/DISHA compliance documents signed
- ✅ Customer support ready (email + chat)

---

## 📞 SUCCESS METRICS (Week 12 Target)

- 50+ filing types supported
- 90%+ accuracy on tax calculations
- 5+ CAs using in production
- 10K+ documents processed
- 0 data breaches
- 99.9% uptime
- < 2 sec page load time

---

## 🎬 NEXT STEPS

1. **Read** this full document (30 min)
2. **Prioritize**: Focus on CRITICAL domain items first
3. **Pick**: GSTR-1 auto-generation (highest ROI)
4. **Copy**: Implementation details section
5. **Generate**: AI-driven code generation
6. **Test**: With real CA feedback
7. **Iterate**: Weekly updates
8. **Launch**: Week 4 with 10 CAs

---

**Document Created**: April 20, 2026  
**Comprehensiveness Level**: Real CA-level (all 21 regulatory domains)  
**Missing Features**: 50+ items across all domains  
**Estimated Build Time**: 6-8 weeks for full coverage  
**MVP Launch Time**: 3-4 weeks for 15 critical items  
**Next Review**: After GSTR-1 implementation complete

---

# 🤖 AI COPILOT PROMPTS - FILING AUTOMATION (20 Features)

## 🌐 FOUNDATION: GOVERNMENT PORTAL INTEGRATION (1 Feature)

### PROMPT 0: MULTI-PORTAL GOVERNMENT DATA INTEGRATION
Build: Connect to all government portals (gst.gov.in, incometax.gov.in, mca.gov.in, epfo.in, esi.in). Auto-login: store credentials encrypted (AES-256). Daily auto-fetch: GSTR-1/2B/3B filed status, ITR status, MCA filings, EPF contributions, ESI status, TAN/DIN validity, pending notices. Dashboard: unified view of all compliance data across portals. Reconciliation: auto-match portal data vs company records, flag mismatches (e.g., "Portal says GSTR-1 filed ₹100L, your records ₹90L"). Auto-download: PDFs of filed documents, notices, acknowledgments. Alert: "GSTR-2B updated, reconcile with purchase register". Data sync: keep local DB updated hourly. Security: encrypt all credentials, audit log all portal access. Test: 5 real GST IDs, ITR logins, EPF accounts.

---

## FORM/CALCULATION AUTOMATION (10 Features)

### PROMPT 1: GSTR-1 AUTO-GENERATION
Build: Accept invoice uploads (CSV/JSON), auto-populate GSTR-1 sections B1/B2/B2BA. Extract: invoice date, customer GSTIN, amount, HSN code, tax rate. Calculate: taxable value, CGST, SGST, IGST, RCM totals. Validate: duplicate check, GSTIN format, HSN validity. Alert: invalid entries. Show summary: "₹100L @ 5% = ₹5K tax due 11th". Export: government PDF. Test: 50+ invoices.

### PROMPT 2: GSTR-2B AUTO-DOWNLOAD & RECONCILIATION
Build: Auto-login to gst.gov.in, daily download supplier invoices. Dashboard: supplier name, invoice number, date, HSN, amount, ITC eligible. Reconcile: supplier filed vs purchase register, flag mismatches. Show: ITC status (available/pending/blocked). Export: reconciliation report. Store: credentials encrypted. Test: 5 real GST IDs.

### PROMPT 3: GSTR-3B CALCULATION
Build: Pull GSTR-1 (outward tax) + GSTR-2B (inward credit). Auto-calculate: Outward tax - ITC = Net tax due. Show: "₹5K tax, ₹3K credit, Pay ₹2K by 20th". Alert: ITC > 50% (file DRC-01). Block: negative tax (suggest amendment). Track: amendments. Link: NEFT/RTGS payment. Export: government PDF. Test: RCM liability, high ITC, negative cases.

### PROMPT 4: ITR-3 AUTO-GENERATION
Build: Upload balance sheet + P&L. Extract: profit, deductions (depreciation, rent, salary, audit fees). Calculate: disallowances (entertainment 1%, foreign travel 2%), tax slabs (5%→2.5L, 20%→5L, 30%+), surcharge, 4% health cess. Show: "₹50L profit → ₹9L tax → Paid ₹7L → Pay ₹2L". Export: government PDF. Store: all calculations. Test: varied profit levels, loss cases.

### PROMPT 5: ITR-4 SIMPLIFIED INCOME (Turnover < ₹2Cr)
Build: Upload turnover, business type (trading/service/manufacturing). Auto-calculate: Trading 8%, Service 6% profit from turnover. Apply: tax slabs 5%→2.5L, 20%→5L, 30%+, health cess 4%. Show: "₹50L turnover → ₹4L profit → ₹80K tax". Optional: GFP, insurance, rent, capital gains deductions. Alert: turnover > ₹2Cr (ITR-3 required). Export: PDF. Test: edge cases near ₹2Cr.

### PROMPT 6: EPF CALCULATION & FILING
Build: Upload monthly payroll (name, PAN, UAN, basic, DA). Calculate: EPF monthly = Basic × 12% capped ₹15K (employer 8.33%, employee 12%, employer contribution 8.33%). Generate: payment slip, due date (15th next month). Email: reminder on 10th. Track: overdue alerts. Settlement: on exit calculate refund. Store: employee master, contributions, loans, settlements. Test: multiple employees, year-end settlement.

### PROMPT 7: PAYROLL ESI CALCULATION & FILING
Build: Upload monthly payroll (name, ESI number, wages). Calculate: wages × 4.25% ESI (employer 3.25%, employee 0.75%), capped ₹21K wages. Generate: payment slip, due date (5 days month-end). Email: reminder 10th. Track: overdue alerts. Medical claims: log + track approval. Settlement: on exit final premium + leave encashment + certificate. Annual return: total employees, premium, claims. Test: wage variations, claims, settlements.

### PROMPT 8: BALANCE SHEET AUTO-GENERATION
Build: Import GL (CSV). Categorize: Fixed assets (cost, depreciation, NBV by class), Current assets (debtors, inventory, cash), Liabilities (creditors, loans), Equity (share capital, reserves, P&L). Auto-calculate: depreciation (building 5%, vehicle 15%, equipment 20%, furniture 10%). Link: debtors aging from AR, creditors from AP. Validate: Assets = Liabilities + Equity. Export: government PDF. Store: GL mappings, versions. Test: trading, service, manufacturing, holding companies.

### PROMPT 9: P&L STATEMENT AUTO-GENERATION
Build: Import GL. Structure: Revenue - COGS - Expenses = Operating Profit - Finance + Other = PBT - Tax = PAT. Generate: schedules 16 (revenue), 17 (COGS), 18 (expenses), 19 (finance). Auto-calculate: gross %, operating %, net profit %. YoY comparison + variance. Department-wise profit by cost center. Validate: P&L reconciles GL + balance sheet retained earnings. Export: government PDF. Store: draft + audited versions. Test: all company types.

### PROMPT 10: CASH FLOW STATEMENT AUTO-GENERATION
Build: Pull GL, balance sheet, P&L. Structure: Operating (net income + depreciation adjustments + working capital changes), Investing (asset buys/sales), Financing (loans, dividend, share capital). Calculate: opening cash + operating + investing + financing = closing cash. Validate: closing = balance sheet cash. Show: quarterly + annual. Dashboard: "Q1 generated ₹5L, invested ₹3L, net ₹2L". Export: government PDF. Test: all activity types.

---

## OPERATIONAL/CORPORATE (9 Features)

### PROMPT 11: BOARD MEETINGS MANAGEMENT
Build: Calendar to schedule quarterly meetings (date, time, location, physical/virtual). Email: invites to directors. Agenda: add topics, assign owners. Meeting form: record attendees, outcomes, resolutions, action items. Digital signatures on minutes. Auto-generate: official minutes (PDF). Compliance: alert "3/4 meetings done, 1 pending". Export: annual report. Store: signed minutes + timestamps. Test: on-time, late, virtual meetings.

### PROMPT 12: BOARD RESOLUTION TEMPLATES
Build: Library of pre-built resolutions (loan approval, asset purchase, investment, dividend, director appointment, salary change, financial policy). User selects template, fills details. Auto-populate: director names, company details. Generate: formal resolution text. Digital signing: e-signature widget (directors sign with timestamp, OTP validation). Store: PDF + signatures + audit trail. Email: to directors. Archive: searchable by type/date. Test: varied types.

### PROMPT 13: AGM SCHEDULING & DOCUMENTATION
Build: Calendar for AGM (must be within 6 months year-end, e.g., by Aug 31 for Mar 31 year-end). Auto-generate: AGM notice (PDF) 21 days before with meeting date/time/location, agenda (financial approval, dividend, director re-appointment, auditor appointment), shareholders list. Email: to all shareholders. On-day: check-in attendees, verify quorum (min 2). Voting: yes/no/abstain. Minutes: record attendees, discussions, results, action items. Generate: official minutes PDF + signatures. Alert: 90/60/30 days before deadline. Test: on-time, late, varied shareholder counts.

### PROMPT 14: MCA FORM 20-B ANNUAL RETURN
Build: Collect company details (CIN), director list (name, DIN, dates), shareholder list. Auto-pull: directors, shareholding from database. Upload: balance sheet, P&L, audit report, cash flow. Generate: Form 20-B (PDF) with Part A (company details), B (directors+DIN), C (shareholding), D (top 10 shareholders), E (capital changes). Validate: DIN validity, shareholder data. Generate: filing checklist. Alert: "Annual return due by April 30". Track: filing status. Store: filing history. Test: private, holding, subsidiary companies.

### PROMPT 15: DIN & TAN MANAGEMENT
Build: Dashboard showing all directors with DIN status (issue date, expiry, validity). Auto-alert: "DIN expires in 90 days" → apply renewal. Lookup: verify DIN vs MCA. Auto-generate: DIR-12 renewal on expiry. Store: DIN certificate, PAN, Aadhaar. DIR-3-KYC: track 2-year cycle, alert "KYC due in 30 days". Flag: expired DINs (director cannot act). Email: reminders. Export: annual DIN compliance report. TAN: track issue date, 5-year expiry. Auto-alert: "TAN expires in 90 days" → renew. Validate: TAN vs tax department. Test: multiple directors, varied expiry dates.

### PROMPT 16: NOTICE TRACKING SYSTEM
Build: Dashboard to log all regulatory notices (income tax, GST, MCA, labor, customs). For each notice: department, type, issue date, response due date, issue amount. Status: received/reviewing/responded/pending/appealed/closed. Auto-alert: "GST notice due March 15, 7 days left". Link: notice PDF, response draft, final submission. Escalation: color-code (green=safe, yellow=10 days left, red=overdue). History: track all notices, appeal outcomes. Export: annual notices report. Test: multiple notice types, deadline tracking.

### PROMPT 17: INVOICE MANAGEMENT & PARSING
Build: Upload invoices (PDF/image). OCR: extract invoice number, date, amount, GSTIN, HSN, tax rate. Validate: invoice format, duplicate check (prevent re-upload), tax rate accuracy. Link: to GSTR-1, P&L revenue. Dashboard: "1000 invoices processed this year, last ₹50K on March 28". Archive: all invoices searchable by date/amount/customer. Export: invoice register (excel). Store: images + extracted data. Test: varied invoice formats, OCR accuracy.

### PROMPT 18: DEBTORS AGING ANALYSIS
Build: Pull invoice data + payment receipts. Calculate: unpaid amount, days outstanding (0-30 / 31-60 / 61-90 / 90+ days). Alert: "₹50L unpaid > 90 days from XYZ customer, contact for recovery". Dashboard: aging summary (pie chart), top debtors, collection forecast. Email: collection reminder to customer (auto-send). Provision: if > 180 days, auto-provision 50% as bad debt for audit. Export: aging report (PDF). Test: varied debtor profiles, collection letters.

### PROMPT 19: AUDIT FILE PREPARATION
Build: Compile all statutory documents required by auditor: financial statements (balance sheet, P&L, cash flow), GL trial balance, audit schedules (fixed assets, depreciation, debtors, creditors, loans, investments), management representations, board resolutions, shareholder approvals, RPT disclosure, contingent liabilities, notes to accounts. Organize: mandatory (statutory) vs optional. Version control: audit-ready vs draft. PDF export: organized folders. Checklist: "All 50 documents ready". Test: completeness, organization, version control.

---

## 📝 HOW TO USE THESE PROMPTS

Copy any prompt above and paste into Copilot with this prefix:

**"Based on the Sannidh External CA Dashboard, build this feature:**

[Paste prompt here]

**Use the tech stack: Vite + React 18 + TypeScript + Supabase + Tailwind CSS. Build the UI (components), backend logic (edge functions if needed), and database schema. Include validation, error handling, and testing."**

---

## ✅ WHAT'S NOT INCLUDED

These 20 prompts cover **government integration + filing automation & operational features only**.

Your **AI Drafting Engine** (`/supabase/functions/ai-draft/`) already handles:
- ✅ 27 notice response types (GST, ITR, MCA, Customs, RBI, SEBI)
- ✅ Statutory knowledge base + risk controls
- ✅ Logic levels (core, nexus_9, sovereign)
- ✅ Draft modes (conservative, balanced, aggressive)

So you don't need separate prompts for those.

---

**File Location**: `/Users/atharavsingh/Desktop/SANNIDH_MASTER/frontend/EXTERNAL_CA_LAUNCH_CHECKLIST.md`  
**Total Prompts**: 20 (Foundation: 1, Form/Calculation: 10, Operational/Corporate: 9)  
**Estimated Build Time**: 6-8 weeks for all features  
**MVP Subset**: Pick PROMPT 0 (CRITICAL foundation), then 1, 2, 3, 4, 6, 11, 13, 19 for 4-week launch
---

## 📝 HOW TO USE THESE PROMPTS

Copy any prompt above and paste into Copilot with this prefix:

**"Based on the Sannidh External CA Dashboard, build this feature:**

[Paste prompt here]

**Use the tech stack: Vite + React 18 + TypeScript + Supabase + Tailwind CSS. Build the UI (components), backend logic (edge functions if needed), and database schema. Include validation, error handling, and testing."**

---

## ✅ WHAT'S NOT INCLUDED

These 20 prompts cover **government integration + filing automation & operational features only**.

Your **AI Drafting Engine** (`/supabase/functions/ai-draft/`) already handles:
- ✅ 27 notice response types (GST, ITR, MCA, Customs, RBI, SEBI)
- ✅ Statutory knowledge base + risk controls
- ✅ Logic levels (core, nexus_9, sovereign)
- ✅ Draft modes (conservative, balanced, aggressive)

So you don't need separate prompts for those.

---

**File Location**: `/Users/atharavsingh/Desktop/SANNIDH_MASTER/frontend/EXTERNAL_CA_LAUNCH_CHECKLIST.md`  
**Total Prompts**: 20 (Foundation: 1, Form/Calculation: 10, Operational/Corporate: 9)  
**Estimated Build Time**: 6-8 weeks for all features  
**MVP Subset**: Pick PROMPT 0 (CRITICAL foundation), then 1, 2, 3, 4, 6, 11, 13, 19 for 4-week launch

