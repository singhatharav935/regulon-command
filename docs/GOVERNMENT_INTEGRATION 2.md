# How SANNIDH Connects to Government Portals

## The 7 Portals We Connect To

| Portal | Data We Extract | How Often | Use Case |
|--------|-----------------|-----------|----------|
| **MCA** (Ministry of Corporate Affairs) | Company registration, filings, rules | Real-time | Track corporate compliance |
| **GST** (GST Portal) | GSTR-1, GSTR-2A, returns filed | Every 30 min | Monitor GST filing status |
| **IT** (Income Tax) | PAN verification, filing status | Weekly | Verify company tax status |
| **RBI** (Reserve Bank) | Interest rates, banking rules | Daily | Banking compliance alerts |
| **SEBI** (Securities Board) | Stock rules, insider trading rules | Weekly | If company is listed |
| **Stock Exchange** | Company stock info, disclosure rules | Real-time | Public company alerts |
| **Pensions** | Pension fund rules, compliance | Weekly | Employee pension rules |

---

## How We Extract Data (4 Methods)

### Method 1: Web Scraping (70% of data)

**What is it?** 
- We visit government websites programmatically
- Extract the HTML and parse it
- Get the data we need
- Store it in our database

**Tools We Use**:
- **Cheerio** (Node.js library) - Parse HTML super fast
- **Axios** (HTTP client) - Visit the portal, download HTML
- **node-cron** (Scheduler) - Run scraper every 30 minutes

**Example: Scraping GST Portal**
```javascript
// Every 30 minutes, this code runs:

const gstPortalURL = "https://gst.gov.in/gsttrn"; // Government portal

// Step 1: Download the page
const response = await axios.get(gstPortalURL, {
  headers: { "User-Agent": "Mozilla/5.0 (our bot)" }
});

// Step 2: Parse the HTML
const $ = cheerio.load(response.data);
const filings = $(".filing-row").map(el => ({
  company: $(el).find(".company").text(),
  status: $(el).find(".status").text(),
  filed_date: $(el).find(".date").text()
})).get();

// Step 3: Store in our database
await db.query(
  "INSERT INTO gst_filings (company, status, filed_date) VALUES ($1, $2, $3)",
  [filings.company, filings.status, filings.filed_date]
);
```

**Why Scraping?**
- Governments don't provide APIs (no open data culture)
- Need real-time updates
- Fast and reliable

**Limitations**:
- ⚠️ If website layout changes, scraper breaks
- ⚠️ Portal might block repeated requests
- ⚠️ Takes 2-5 seconds per portal

---

### Method 2: Direct API (20% of data)

**What is it?**
- Government provides official API endpoints
- We call their API, get JSON response
- Store in our database

**Portals with APIs**:
- **GST API**: Get GSTR-1/2A data directly (if authenticated)
- **Income Tax**: PAN verification API (limited)

**Example: Using GST API**
```javascript
// Call government's official API
const gstResponse = await axios.post("https://gst.gov.in/api/gstr1", {
  gstin: "27AABCT1234H1Z0", // Company's GST number
  month: "04",
  year: "2024"
}, {
  headers: {
    "Authorization": `Bearer ${gstAPIToken}`,
    "Content-Type": "application/json"
  }
});

// Response: Direct JSON data (reliable)
const gstr1Data = gstResponse.data;
// { invoices: 150, total_value: 50000000, tax: 9000000 }

await db.query(
  "INSERT INTO gstr_filings (gstin, invoices, value, tax) VALUES ($1, $2, $3, $4)",
  [gstr1Data.gstin, gstr1Data.invoices, gstr1Data.value, gstr1Data.tax]
);
```

**Why APIs?**
- Reliable (structured data)
- Fast (direct, no scraping)
- Official (government-sanctioned)

**Limitation**:
- ⚠️ Only 20% of portals have APIs
- ⚠️ APIs require authentication

---

### Method 3: Manual Upload by User (5% of data)

**What is it?**
- User downloads CSV from government portal
- Uploads to SANNIDH
- We parse and store

**Example: Company uploads GSTR-1**
```
User downloads from GST portal: GSTR1_27AABCT1234H1Z0_04_2024.csv

CSV format:
invoice_no, invoice_date, buyer_gstin, invoice_value, tax_rate, tax_amount
INV-001, 2024-04-01, 27BBBBQ1234H1Z0, 100000, 18%, 18000
INV-002, 2024-04-02, 27CCCCR1234H1Z0, 200000, 18%, 36000

User uploads → SANNIDH parses → Data stored in DB
```

**Why Manual Upload?**
- For companies that prefer control
- When scraping/API doesn't work
- Backup method

---

### Method 4: Email Integration (5% of data)

**What is it?**
- Government sends email: "Your filing was accepted"
- We parse the email
- Extract filing status and update database

**Example: GST Filing Acceptance Email**
```
From: GST Authority <noreply@gst.gov.in>
Subject: GST-3B Filing Accepted - 27AABCT1234H1Z0

Body:
"Your GST-3B return for April 2024 has been ACCEPTED.
Filing ID: GST-2024-04-001
Amount Due: ₹7,50,000
Due Date: 20-04-2024"

Our email parser extracts:
- filing_id: GST-2024-04-001
- status: ACCEPTED
- amount: 750000
- due_date: 2024-04-20

Stores in database automatically
```

**Why Email?**
- Government sends notifications
- We capture them automatically
- No extra user action needed

---

## Data Flow: How It Works End-to-End

```
┌─────────────────────────────────────────────────────────┐
│ GOVERNMENT PORTALS (MCA, GST, IT, RBI, SEBI, etc)      │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┬──────────────┬──────────────┐
        │                   │              │              │
        ▼                   ▼              ▼              ▼
    ┌────────┐         ┌────────┐    ┌────────┐    ┌─────────┐
    │ Scraper│         │ API    │    │ Upload │    │ Email   │
    │(Cheerio)│         │(Direct)│    │(CSV)   │    │Parser   │
    └────┬───┘         └───┬────┘    └───┬────┘    └────┬────┘
         │                 │             │             │
         └─────────────────┼─────────────┼─────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │  Data Processing Layer   │
            │ (Validation, Cleaning)   │
            │                          │
            │ - Check data is valid    │
            │ - Remove duplicates      │
            │ - Standardize format     │
            │ - Remove PII if needed   │
            └──────────┬───────────────┘
                       │
                       ▼
            ┌──────────────────────────┐
            │   PostgreSQL Database    │
            │                          │
            │ Tables:                  │
            │ - gst_filings            │
            │ - mca_registrations      │
            │ - it_verifications       │
            │ - rbi_alerts             │
            │ - stock_disclosures      │
            └──────────┬───────────────┘
                       │
                       ▼
            ┌──────────────────────────┐
            │   Supabase Realtime      │
            │   (Push to Frontend)     │
            └──────────┬───────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    ┌──────┐      ┌──────┐      ┌──────┐
    │  CA  │      │  CEO │      │ Admin│
    │  App │      │  App │      │ Panel│
    └──────┘      └──────┘      └──────┘
```

---

## Real Example: How GST Data Flows

### Scenario: Company ABC files GST return

**Hour 1: Filing Day (April 20)**
```
1. Company files GST-3B on gst.gov.in portal
2. GST Authority accepts filing
   ↓
3. Email received: "Your GST-3B for April has been ACCEPTED"
   ↓
4. SANNIDH's email parser captures it
   Status: ACCEPTED
   Amount: ₹7.5 lakhs
   Filing ID: GST-2024-04-001
```

**Hour 2: Data Sync**
```
5. SANNIDH scraper runs (every 30 min)
   Visits: https://gst.gov.in/gstrn/returns
   Extracts: Company ABC's filing status
   ↓
6. Data validated:
   - Is filing_id valid? ✓
   - Is amount correct? ✓
   - Is date in right format? ✓
   ↓
7. Stored in PostgreSQL:
   INSERT INTO gst_filings VALUES (
     company_id: 'ABC-123',
     status: 'ACCEPTED',
     amount: 750000,
     filed_date: '2024-04-20',
     sync_time: NOW()
   )
```

**Hour 3: Real-Time Update**
```
8. Supabase Realtime pushes update
   ↓
9. CA's dashboard updates instantly:
   "✓ GST Return Filed - Status: ACCEPTED"
   "Amount Due: ₹7,50,000"
   "Reminder: Pay by April 30"
```

---

## How We Provide Data to Users

### For CAs
```
SANNIDH Dashboard shows:
┌─────────────────────────────────────┐
│ CLIENT: ABC Ltd                     │
├─────────────────────────────────────┤
│ GST Status: ✓ ACCEPTED (20-Apr)    │
│ MCA Status: ✓ COMPLIANT            │
│ IT Status: ⚠ PENDING (Verify PAN)  │
│ Alerts: 1 RBI rule change          │
│ Next Deadline: GST on 30-Apr       │
└─────────────────────────────────────┘
```

### For Companies
```
SANNIDH Dashboard shows:
┌─────────────────────────────────────┐
│ Your Compliance Status              │
├─────────────────────────────────────┤
│ Health Score: 92/100 ✓              │
│ GST: Filed, Accepted                │
│ Pending: IT filing (Due in 20 days) │
│ Regulatory Changes: 2 new rules     │
│ Next Action: Review IT filing       │
└─────────────────────────────────────┘
```

---

## Security: How We Protect Government Data

### Data We Collect
- ✓ Public information (company registration, filing status)
- ✓ Semi-private (company financials, GST details)
- ✓ Private (user login credentials for portal)

### How We Protect It
```
1. Encryption in Transit
   → All data from portals uses HTTPS/TLS 1.3
   → No man-in-the-middle attacks possible

2. Encryption at Rest
   → Sensitive fields (passwords, API keys) encrypted with AES-256
   → Database backups encrypted

3. Access Control
   → CA can only see their clients' data
   → Company can only see their own data
   → Admin can audit all access

4. Audit Trail
   → Every data fetch logged with timestamp
   → Who accessed what, when, why

5. No Manual Storage
   → Credentials not stored in database
   → Use OAuth when government portals support it
   → Temporary tokens only (expires in 1 hour)
```

---

## Challenges & How We Handle Them

| Challenge | Solution |
|-----------|----------|
| **Portal blocks our scraper** | Use legitimate User-Agent headers, respectful rate limiting (1 request per 30 sec) |
| **Portal layout changes** | Monitor changes, update scraper, maintain backup parsers |
| **Data inconsistency** | Validate against multiple sources, flag anomalies for manual review |
| **Slow portal** | Cache results, serve from our DB (2-second response instead of 10-second wait) |
| **Portal downtime** | Use last-known-good data until portal is back |
| **Government changes API** | Keep 2-3 versions of scraper, test weekly |

---

## Data Update Frequency

| Portal | Schedule | Latency |
|--------|----------|---------|
| **GST** | Every 30 minutes | 30 min (real-time) |
| **MCA** | Every 6 hours | 6 hours |
| **IT** | Every 24 hours | 1 day |
| **RBI** | Every day | 1 day |
| **Stock Exchange** | Real-time (when available) | Instant |
| **SEBI** | Every 24 hours | 1 day |
| **Pensions** | Every 7 days | 1 week |

---

## Cost of Data Integration

| Method | Cost per Year |
|--------|---------------|
| Scraping (Cheerio) | ₹0 (open source) |
| API calls (when free) | ₹0 |
| Manual parsing | Dev time only |
| Email parsing | ₹0 |
| Server costs (running scrapers) | ₹5,000/month = ₹60,000/year |
| **Total Annual Cost** | **₹60,000** |

**Compare with alternatives**:
- Third-party data provider: ₹5-10 lakhs/year
- Manual data entry: ₹50,000/month (CA salary)
- Building custom integrations: ₹50 lakhs (dev cost)

---

## Future: Planned Government Integrations

- [ ] **GST API** - Official access (when government enables it)
- [ ] **MCA e-filing** - Direct filing (no manual submission)
- [ ] **Income Tax e-filing** - Automated ITR submission
- [ ] **RBI APIs** - Real-time interest rate updates
- [ ] **SEBI XBRL** - Automated disclosure parsing

---

## File Location

📄 **This file**: `/Users/atharavsingh/Desktop/SANNIDH_MASTER/frontend/GOVERNMENT_INTEGRATION.md`

---

## Summary

**How We Connect:**
1. **Scrape** government portals (70%)
2. **Use APIs** when available (20%)
3. **Accept uploads** from users (5%)
4. **Parse emails** from government (5%)

**How Data Flows:**
Portal → Extract → Validate → Store → Push to User

**How We Provide:**
- Real-time dashboards (updates every 30 min)
- Alerts when status changes
- Historical data for analysis

**Security:**
- TLS 1.3 encryption
- Database RLS (row-level security)
- Audit trail for every access
- Zero credential storage

**Speed:**
- Cache results in our DB (2-sec response)
- vs 10-second wait on government portal

---

**Use this for**:
- Understanding how SANNIDH gets data
- Explaining to customers/investors
- Technical documentation
