# Regulon Agent API Reference

## Base URL
```
http://localhost:8787
```

## Endpoints

### 1. GET /health
Health check endpoint to verify agent is running.

**Method:** `GET`

**Parameters:** None

**Response:**
```json
{
  "service": "sannidh-agent",
  "status": "running",
  "scanned_sources": 7
}
```

**Status Codes:**
- `200 OK` - Agent is running

**Example:**
```bash
curl http://localhost:8787/health
```

---

### 2. GET /alerts
Fetch all regulatory alerts from 7 government sources.

**Method:** `GET`

**Parameters:** None

**Response:**
```json
[
  {
    "title": "Advisory regarding confirmation of Tax Liability in GSTR-3B",
    "authority": "GSTN",
    "publish_date": "2026-03-26",
    "effective_date": "2026-04-01",
    "deadline": "2026-06-30",
    "summary": "Detailed summary of the regulation...",
    "sourceUrl": "https://www.gst.gov.in/..."
  },
  ...
]
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Regulatory notice title |
| `authority` | string | Source authority (GSTN, RBI, SEBI, CBIC, INCOMETAX, MCA, EGAZETTE) |
| `publish_date` | string | Publication date (YYYY-MM-DD) |
| `effective_date` | string | Effective date (YYYY-MM-DD) or "Not specified" |
| `deadline` | string | Compliance deadline or "Not specified" |
| `summary` | string | Detailed summary (500+ characters) |
| `sourceUrl` | string | Link to official source |

**Status Codes:**
- `200 OK` - Alerts successfully returned
- `304 Not Modified` - Using cached response

**Response Time:**
- First request: ~60-70 seconds (all sources scraped)
- Subsequent requests: <10ms (cached for 5 minutes)

**Example:**
```bash
# Get all alerts
curl http://localhost:8787/alerts

# Filter by authority using jq
curl http://localhost:8787/alerts | jq '.[] | select(.authority == "GSTN")'

# Count by authority
curl http://localhost:8787/alerts | jq '.[].authority' | sort | uniq -c
```

**Sample Output (GSTN):**
```json
{
  "title": "Advisory regarding confirmation of 'Tax Liability Breakup, As Applicable' in GSTR-3B-reg",
  "authority": "GSTN",
  "publish_date": "2026-03-26",
  "effective_date": "2026-04-01",
  "deadline": "2026-06-30",
  "summary": "1. In terms of the provisions of Section 50 of the Central Goods and Services Tax (CGST) Act, 2017, interest is payable where the tax liability pertaining to a previous tax period is discharged in a subsequent tax period...",
  "sourceUrl": "https://www.gst.gov.in/newsandupdates"
}
```

---

### 3. GET /regulatory-news
Fetch CA-focused regulatory news with compliance action items.

**Method:** `GET`

**Parameters:** None

**Response:**
```json
[
  {
    "id": "news-gst-001",
    "category": "GST Update",
    "title": "Advisory regarding confirmation of Tax Liability in GSTR-3B",
    "summary": "Detailed summary...",
    "authority": "GST Network",
    "impact": "High - Affects all registered businesses",
    "caActionItems": [
      "Review impact on current compliance",
      "Update GST return filings if applicable",
      "Inform clients of new procedures"
    ],
    "date": "2026-03-26",
    "severity": "high"
  },
  ...
]
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique news item identifier |
| `category` | string | News category (GST Update, Income Tax Update, RBI Circular, etc.) |
| `title` | string | News headline |
| `summary` | string | Detailed summary |
| `authority` | string | Source authority name |
| `impact` | string | Business impact description |
| `caActionItems` | string[] | Array of 3-5 action items for CAs |
| `date` | string | Publication date (YYYY-MM-DD) |
| `severity` | string | "high", "medium", or "low" |

**Severity Levels:**
- `high` - Affects all registered businesses or critical compliance matters
- `medium` - Affects specific sectors or specialized compliance
- `low` - General regulatory updates

**Status Codes:**
- `200 OK` - News successfully returned

**Cache:** 5 minutes

**Example:**
```bash
# Get all news items
curl http://localhost:8787/regulatory-news

# Filter by severity
curl http://localhost:8787/regulatory-news | jq '.[] | select(.severity == "high")'

# Filter by category
curl http://localhost:8787/regulatory-news | jq '.[] | select(.category == "GST Update")'

# Count by category
curl http://localhost:8787/regulatory-news | jq '.[].category' | sort | uniq -c
```

**Sample Output (GST):**
```json
{
  "id": "news-gst-abc123",
  "category": "GST Update",
  "title": "Advisory regarding confirmation of 'Tax Liability Breakup, As Applicable' in GSTR-3B",
  "summary": "Updated procedures for confirming tax liability breakup in GSTR-3B...",
  "authority": "GST Network",
  "impact": "High - Affects all registered businesses",
  "caActionItems": [
    "Review impact on current GST compliance procedures",
    "Update GSTR-3B filing procedures if applicable",
    "Communicate new requirements to GST-registered clients"
  ],
  "date": "2026-03-26",
  "severity": "high"
}
```

---

### 4. GET /sources/status
Get real-time monitoring status for all 7 sources.

**Method:** `GET`

**Parameters:** None

**Response:**
```json
{
  "GSTN": {
    "status": "active",
    "last_fetch_at": "2026-03-29T12:00:00.000Z",
    "last_error": null
  },
  "RBI": {
    "status": "active",
    "last_fetch_at": "2026-03-29T12:00:00.000Z",
    "last_error": null
  },
  ...
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | "active" or "awaiting_feed" |
| `last_fetch_at` | string | ISO 8601 timestamp of last fetch |
| `last_error` | string | null or error message |

**Status Values:**
- `active` - Source is being successfully monitored
- `awaiting_feed` - Source is blocked or temporarily unavailable

**Example:**
```bash
# Get all sources status
curl http://localhost:8787/sources/status

# Check specific source
curl http://localhost:8787/sources/status | jq '.GSTN'

# Check for errors
curl http://localhost:8787/sources/status | jq '.[] | select(.last_error != null)'
```

**Sample Output:**
```json
{
  "GSTN": {
    "status": "active",
    "last_fetch_at": "2026-03-29T12:00:15.123Z",
    "last_error": null
  },
  "RBI": {
    "status": "active",
    "last_fetch_at": "2026-03-29T12:00:18.456Z",
    "last_error": null
  },
  "SEBI": {
    "status": "active",
    "last_fetch_at": "2026-03-29T12:00:21.789Z",
    "last_error": null
  },
  "CBIC": {
    "status": "active",
    "last_fetch_at": "2026-03-29T12:00:24.012Z",
    "last_error": null
  },
  "INCOMETAX": {
    "status": "active",
    "last_fetch_at": "2026-03-29T12:00:27.345Z",
    "last_error": null
  },
  "MCA": {
    "status": "active",
    "last_fetch_at": "2026-03-29T12:00:30.678Z",
    "last_error": null
  },
  "EGAZETTE": {
    "status": "active",
    "last_fetch_at": "2026-03-29T12:00:33.901Z",
    "last_error": null
  }
}
```

---

### 5. POST /sync-now
Force an immediate synchronization of all sources (bypasses cache).

**Method:** `POST`

**Parameters:** None

**Request Body:** Empty

**Response:**
```json
{
  "ok": true,
  "count": 66,
  "data": [...]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Success status |
| `count` | number | Number of alerts synced |
| `data` | array | Array of alert objects (same format as /alerts) |

**Status Codes:**
- `200 OK` - Sync completed successfully

**Wait Time:** ~60-70 seconds (all sources scraped)

**Example:**
```bash
# Trigger manual sync
curl -X POST http://localhost:8787/sync-now

# Wait for response (this may take 60-70 seconds)
time curl -X POST http://localhost:8787/sync-now
```

---

## Error Handling

### CORS Headers
All responses include CORS headers for cross-origin requests:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Common Errors

**Agent not running:**
```
curl: (7) Failed to connect to localhost port 8787: Connection refused
```
Solution: `npm run agent:pm2:start`

**Source blocked:**
```json
{
  "status": "awaiting_feed",
  "last_error": "Source blocked or unavailable",
  "last_fetch_at": "2026-03-29T12:00:00.000Z"
}
```
Solution: Check source status, try `/sync-now` endpoint

**Network timeout:**
```
curl: (28) Operation timeout. More details here: http://curl.haxx.se/libcurl/c/libcurl-errors.html
```
Solution: Wait for cache (5 minutes) or try again after initial fetch completes

---

## Performance Characteristics

### Response Times
| Endpoint | First Call | Cached Call |
|----------|-----------|-----------|
| `/health` | <100ms | <10ms |
| `/alerts` | 60-70s | <10ms |
| `/regulatory-news` | 60-70s | <10ms |
| `/sources/status` | 60-70s | <10ms |
| `/sync-now` | 60-70s | 60-70s (always fresh) |

### Data Volume
| Endpoint | Size | Count |
|----------|------|-------|
| `/alerts` | ~500KB | 66+ notices |
| `/regulatory-news` | ~150KB | 8 news items |
| `/sources/status` | <5KB | 7 sources |

### Cache Strategy
- **Duration:** 5 minutes (300,000 ms)
- **Keys:** Based on endpoint
- **Invalidation:** `/sync-now` endpoint forces fresh fetch
- **Strategy:** LRU (Least Recently Used) eviction after 5 minutes

---

## Request Examples

### Using curl
```bash
# Get all alerts
curl -s http://localhost:8787/alerts | jq '.'

# Get CA news
curl -s http://localhost:8787/regulatory-news | jq '.[0]'

# Check source status
curl -s http://localhost:8787/sources/status | jq '.GSTN'

# Manual sync
curl -X POST http://localhost:8787/sync-now
```

### Using fetch (JavaScript/Frontend)
```javascript
// Get alerts
const alerts = await fetch('http://localhost:8787/alerts')
  .then(r => r.json());

// Get regulatory news
const news = await fetch('http://localhost:8787/regulatory-news')
  .then(r => r.json());

// Get sources status
const status = await fetch('http://localhost:8787/sources/status')
  .then(r => r.json());

// Manual sync
const sync = await fetch('http://localhost:8787/sync-now', { method: 'POST' })
  .then(r => r.json());
```

### Using Python
```python
import requests

# Get alerts
response = requests.get('http://localhost:8787/alerts')
alerts = response.json()

# Get regulatory news
response = requests.get('http://localhost:8787/regulatory-news')
news = response.json()

# Get sources status
response = requests.get('http://localhost:8787/sources/status')
status = response.json()
```

---

## Webhook Integration (Future)

Future versions may support webhooks for real-time notifications:
```
POST /webhooks/alerts
POST /webhooks/critical-changes
```

---

## Rate Limiting (Future)

Future versions may implement rate limiting:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1648486800
```

---

**API Version:** 1.0
**Last Updated:** 2026-03-29
**Backend:** Node.js + Express
