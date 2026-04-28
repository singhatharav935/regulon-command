# Regulatory Compliance News Panel - Feature Documentation

## Overview

The **Regulatory Compliance News Panel** is a CA-focused intelligence dashboard that aggregates regulatory changes from 7 Indian government sources and provides actionable compliance updates with CA-specific guidance.

## Features

### 1. **Multi-Source News Aggregation**
Pulls regulatory updates from:
- **GSTN** (GST Network) - GST updates & compliance changes
- **RBI** (Reserve Bank of India) - Monetary policy & banking circulars
- **SEBI** (Securities Board) - Market regulations & corporate disclosures
- **CBIC** (Customs & Excise) - Import/export regulations
- **Income Tax India** - Tax law amendments & circulars
- **MCA** (Ministry of Corporate Affairs) - Company law & governance
- **eGazette** - Official government notifications

### 2. **CA-Specific Action Items**
Each regulatory change includes actionable items tailored for Chartered Accountants:
- Compliance review steps
- Client notification requirements
- Implementation timelines
- Procedure updates needed

### 3. **Severity-Based Categorization**
- **HIGH** (Red) - Affects all registered businesses or critical tax/corporate matters
- **MEDIUM** (Amber) - Affects specific sectors or specialized compliance
- **LOW** (Blue) - General regulatory updates

### 4. **Expandable News Items**
- Collapsed view: Shows title, date, and number of action items
- Expanded view: Full summary, impact analysis, and detailed CA action items
- Quick expand/collapse for easy navigation

### 5. **Real-time Updates**
- Caches data for 5 minutes to optimize performance
- Auto-refreshes frontend every 30 seconds
- First fetch: ~60-70 seconds (all 7 sources scraped)
- Subsequent requests: <10ms (cached)

## Backend API

### Endpoint: `/regulatory-news`

**Method:** `GET`

**Response Format:**
```json
[
  {
    "id": "news-gst-123",
    "category": "GST Update",
    "title": "Advisory regarding confirmation of Tax Liability in GSTR-3B",
    "summary": "Updated procedures for tax liability confirmation...",
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

### Endpoint: `/alerts`

Returns raw regulatory alerts from all 7 sources (66+ notices).

**Response Format:**
```json
[
  {
    "title": "Regulatory notice title",
    "authority": "GSTN",
    "publish_date": "2026-03-26",
    "effective_date": "2026-04-01",
    "deadline": "2026-06-30",
    "summary": "Summary of the regulation...",
    "sourceUrl": "https://..."
  },
  ...
]
```

### Endpoint: `/sources/status`

Returns monitoring status for all 7 sources.

**Response Format:**
```json
{
  "GSTN": {
    "status": "active",
    "last_fetch_at": "2026-03-29T12:00:00.000Z",
    "last_error": null
  },
  ...
}
```

## Frontend Component

### Component: `RegulatoryNewsPanel`

Located at: `/src/components/dashboard/RegulatoryNewsPanel.tsx`

**Features:**
- Real-time data fetching from `/regulatory-news` endpoint
- Auto-refresh every 30 seconds
- Smooth animations using Framer Motion
- Responsive design (mobile, tablet, desktop)
- Dark theme with color-coded severity levels
- Error handling and loading states

**Usage:**
```tsx
import RegulatoryNewsPanel from "@/components/dashboard/RegulatoryNewsPanel";

export function Dashboard() {
  return (
    <div>
      <RegulatoryNewsPanel />
      {/* Other dashboard components */}
    </div>
  );
}
```

### Integration in Radar System

The `RegulatoryNewsPanel` is integrated into the `RegulatoryIntelligenceCenter` component:
- Positioned **above** the AI Live Agent Status panel
- Displays before the collapsible notices dropdown
- Provides summary view of major regulatory changes
- Allows CAs to quickly understand compliance landscape

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ 7 Government Portals (GSTN, RBI, SEBI, CBIC, IT, MCA, eGazette)
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Agent Server (8787)   │
            │  - Scrape sources      │
            │  - Cache responses     │
            │  - /alerts endpoint    │
            └────────┬───────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
    ┌──────────────┐   ┌──────────────────┐
    │ /alerts      │   │ /regulatory-news │
    │ (Raw alerts) │   │ (CA-focused news)│
    └──────┬───────┘   └──────┬───────────┘
           │                   │
           └──────────┬────────┘
                      ▼
        ┌─────────────────────────┐
        │ Frontend (5173)          │
        │ - RegulatoryNewsPanel   │
        │ - AILiveAgentStatus     │
        │ - NoticesDropdown       │
        └─────────────────────────┘
```

## Backend Implementation

### News Generation Algorithm

1. **Fetch Live Alerts:** Call `fetchLiveUpdates()` to get all alerts from 7 sources
2. **Group by Source:** Organize alerts into source buckets (GSTN, RBI, SEBI, etc.)
3. **Generate News Items:** Create news summaries with:
   - News category (based on source)
   - CA-specific impact analysis
   - Actionable compliance items
   - Severity classification
4. **Cache Result:** Store generated news for 5 minutes
5. **Return to Frontend:** Serve via `/regulatory-news` endpoint

### Sample CA Action Items by Source

**GST Updates:**
- Review impact on current compliance
- Update GST return filings if applicable
- Inform clients of new procedures

**Income Tax Updates:**
- Update tax computation methods
- Review client tax implications
- Plan for implementation timeline

**Company Law Updates:**
- Review impact on current compliance
- Update client governance policies
- Plan implementation timeline

**RBI Circulars:**
- Monitor policy rate implications
- Advise finance clients on changes
- Update treasury policies if needed

**SEBI Regulations:**
- Review impact on listed clients
- Check disclosure requirements
- Update audit procedures if needed

**Customs Updates:**
- Review tariff implications
- Update customs procedures
- Advise trading clients on changes

## Performance Metrics

| Metric | Value |
|--------|-------|
| Initial Agent Startup | 3-5 seconds |
| First `/regulatory-news` Request | ~60-70 seconds |
| Cached `/regulatory-news` Request | <10ms |
| Frontend Auto-Refresh Interval | 30 seconds |
| Cache Duration | 5 minutes |
| Total News Items | 8 (1-2 per source) |
| Total Alerts Available | 66+ notices |

## Configuration

### Environment Variables

```bash
# Agent Configuration
ALERT_AGENT_PORT=8787
MAX_ALERT_ITEM_AGE_DAYS=180
ALLOW_INSECURE_PIB_TLS=true

# Frontend Configuration
VITE_API_URL=http://localhost:8787
```

### Cache Settings

Modify cache duration in `/index.js`:
```javascript
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
```

## Testing the Feature

### 1. Check News Endpoint
```bash
curl http://localhost:8787/regulatory-news | jq '.'
```

### 2. Check Alerts Endpoint
```bash
curl http://localhost:8787/alerts | jq '.[] | .authority' | sort | uniq -c
```

### 3. View in Browser
Navigate to: `http://localhost:5173`

Look for the **"Regulatory Compliance Updates"** panel above the radar system.

### 4. Test Real-time Updates
The panel auto-refreshes every 30 seconds. Watch the "Last Updated" timestamp change.

## Files Modified/Created

### New Files
- `/src/components/dashboard/RegulatoryNewsPanel.tsx` - Main news panel component
- `/docs/regulatory-news-feature.md` - This documentation

### Modified Files
- `/index.js` - Added `/regulatory-news` endpoint
- `/src/components/dashboard/RegulatoryIntelligenceCenter.tsx` - Integrated RegulatoryNewsPanel

## Future Enhancements

1. **Email Alerts** - Notify CAs of critical regulatory changes
2. **Filtering** - Filter news by source, severity, or CA practice area
3. **Export** - Download regulatory updates as PDF briefing
4. **Custom Categories** - Group updates by CA practice area (GST, Audit, Company Law, etc.)
5. **Impact Scoring** - AI-based impact assessment for each CA's specific clients
6. **Document Management** - Link to official regulation documents
7. **Team Collaboration** - Assign compliance action items to team members
8. **Compliance Tracking** - Track completion of CA action items

## Troubleshooting

### News Panel Shows "No data available"
1. Check agent is running: `curl http://localhost:8787/health`
2. Check alerts are being fetched: `curl http://localhost:8787/alerts`
3. Restart agent: `npm run agent:pm2:restart`

### Frontend Shows Loading Spinner
1. Ensure agent is on port 8787
2. Check CORS headers in agent console
3. Check browser console for errors (F12)

### News Items Missing from Some Sources
Sources may not have recent updates. Check:
- Source status: `curl http://localhost:8787/sources/status`
- Sample data is provided if source is blocked/unavailable
- Max alert age: Check `MAX_ITEM_AGE_DAYS` setting

## Support & Resources

- **Agent Logs:** `npm run agent:pm2:logs`
- **Frontend Logs:** Check browser DevTools (F12)
- **API Documentation:** See inline comments in `/index.js`
- **Component Props:** See JSDoc in `RegulatoryNewsPanel.tsx`
