# Regulon Platform - Quick Start Guide

## Overview

Regulon is an AI-powered regulatory compliance platform for Indian businesses. It monitors 7 government portals in real-time and provides CAs with actionable compliance intelligence.

## System Architecture

```
┌────────────────────────────────────────────────────────────┐
│ Frontend (React + Vite) - Port 5173                        │
│ - Dashboard with regulatory updates                        │
│ - RegulatoryNewsPanel (CA-focused compliance news)         │
│ - AILiveAgentStatus (source monitoring)                    │
│ - NoticesDropdown (collapsible alerts)                     │
└────────────┬─────────────────────────────────────────────────┘
             │ HTTP/REST
             │
┌────────────▼─────────────────────────────────────────────────┐
│ Agent Server (Node.js) - Port 8787                           │
│ - Scrapes 7 government portals                              │
│ - Caches responses (5-minute duration)                      │
│ - Generates CA-focused news summaries                       │
│ - Endpoints: /alerts, /regulatory-news, /health            │
└────────────┬─────────────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────────────┐
│ Data Sources (7 Government Portals)                          │
│ - GSTN (GST Network)                                         │
│ - RBI (Reserve Bank of India)                               │
│ - SEBI (Securities Board)                                   │
│ - CBIC (Customs & Excise)                                   │
│ - Income Tax India                                          │
│ - MCA (Ministry of Corporate Affairs)                       │
│ - eGazette (Official Government Gazette)                    │
└──────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Git
- macOS/Linux/Windows terminal

### Installation

```bash
# 1. Clone repository
git clone https://github.com/singhatharav935/sannidh-command.git
cd sannidh-command

# 2. Install dependencies
npm install

# 3. Start agent server (PM2)
npm run agent:pm2:start

# 4. Start frontend development server
npm run dev

# 5. Open in browser
# Frontend: http://localhost:5173
# Agent API: http://localhost:8787
```

## Quick Commands

### Agent Management (PM2)

```bash
# Start agent
npm run agent:pm2:start

# Restart agent
npm run agent:pm2:restart

# Stop agent
npm run agent:pm2:stop

# View logs
npm run agent:pm2:logs

# Save PM2 config
npm run agent:pm2:save
```

### Frontend Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting & Testing

```bash
# Lint code
npm run lint

# Run tests
npm run test

# Watch tests
npm run test:watch
```

## Key Features

### 1. Regulatory News Panel
**Location:** Above AI Live Agent in dashboard

**Shows:** Top regulatory changes from 7 sources with CA-specific actions
- GST Updates
- Income Tax Changes
- Company Law Amendments
- Banking/RBI Circulars
- Market Regulations (SEBI)
- Customs Changes
- Official Gazette Notices

**Features:**
- Click to expand and see detailed action items
- Color-coded severity (High/Medium/Low)
- CA action items for each change
- Real-time updates every 30 seconds

### 2. AI Live Agent Status
**Shows:** Real-time monitoring of all 7 sources

**Displays:**
- Source status (Active/Monitoring)
- Last updated timestamps
- Feed status for each source

### 3. Notices Dropdown
**Shows:** Collapsible list of all regulatory notices

**Features:**
- Shows 3 by default
- Click "View All" to expand
- Full details for each notice
- 66+ total notices from all sources

### 4. Source Monitoring Status
**Shows:** Grid of all 7 sources with status

**Information:**
- Source name
- Connection status
- Last notice received
- Any errors

## API Endpoints

### `/alerts`
**Returns:** All regulatory alerts from 7 sources (66+)

```bash
curl http://localhost:8787/alerts | jq '.[] | .authority' | sort | uniq -c
```

Expected output:
```
15 GSTN
10 RBI
15 SEBI
8 CBIC
6 INCOMETAX
6 MCA
6 EGAZETTE
```

### `/regulatory-news`
**Returns:** CA-focused news with action items

```bash
curl http://localhost:8787/regulatory-news | jq '.[0]'
```

Sample output:
```json
{
  "id": "news-gst-123",
  "category": "GST Update",
  "title": "Advisory regarding Tax Liability in GSTR-3B",
  "summary": "...",
  "authority": "GST Network",
  "impact": "High - Affects all registered businesses",
  "caActionItems": [
    "Review impact on current compliance",
    "Update GST return filings if applicable",
    "Inform clients of new procedures"
  ],
  "date": "2026-03-26",
  "severity": "high"
}
```

### `/sources/status`
**Returns:** Status of all 7 sources

```bash
curl http://localhost:8787/sources/status | jq '.GSTN'
```

Sample output:
```json
{
  "status": "active",
  "last_fetch_at": "2026-03-29T12:00:00.000Z",
  "last_error": null
}
```

### `/health`
**Returns:** Agent health check

```bash
curl http://localhost:8787/health
```

Sample output:
```json
{
  "service": "sannidh-agent",
  "status": "running",
  "scanned_sources": 7
}
```

## File Structure

```
sannidh-command/
├── index.js                           # Main agent server
├── package.json                       # Dependencies
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── RegulatoryNewsPanel.tsx       # CA news panel
│   │   │   ├── AILiveAgentStatus.tsx         # Source monitoring
│   │   │   ├── RegulatoryIntelligenceCenter.tsx  # Main radar
│   │   │   └── ...other components
│   │   └── ...
│   ├── pages/
│   │   ├── AppDashboard.tsx           # Main dashboard
│   │   └── ...
│   └── ...
├── docs/
│   ├── regulatory-news-feature.md     # Feature documentation
│   └── ...
├── supabase/
│   ├── functions/                     # Backend functions
│   └── migrations/                    # Database migrations
└── ...
```

## Development Workflow

### 1. Making Changes to Agent

```bash
# 1. Edit /index.js
# 2. Restart agent
npm run agent:pm2:restart

# 3. Test endpoint
curl http://localhost:8787/health
```

### 2. Making Changes to Frontend

```bash
# 1. Edit components in src/
# 2. Dev server auto-reloads at http://localhost:5173
# 3. Check browser console for errors (F12)
```

### 3. Testing News Panel

```bash
# 1. Verify agent is running
npm run agent:pm2:logs | tail -20

# 2. Check news endpoint
curl http://localhost:8787/regulatory-news | jq '.'

# 3. Check frontend loads at http://localhost:5173
# 4. Look for "Regulatory Compliance Updates" panel above radar
```

## Deployment

### Production Build

```bash
# 1. Build frontend
npm run build

# 2. Output is in dist/ directory
ls -lah dist/

# 3. Deploy to hosting (Vercel, Netlify, etc.)
```

### Running Agent in Production

```bash
# Using PM2 (recommended)
npm run agent:pm2:save

# Or using systemd (Linux)
sudo systemctl start sannidh-agent
sudo systemctl enable sannidh-agent
```

## Troubleshooting

### Agent not starting?
```bash
# Check logs
npm run agent:pm2:logs

# Check port 8787 is available
lsof -i :8787

# Restart
npm run agent:pm2:stop && sleep 2 && npm run agent:pm2:start
```

### Frontend showing blank page?
```bash
# Check DevTools console (F12)
# Check agent is running on port 8787
curl http://localhost:8787/health

# Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
```

### No regulatory news showing?
```bash
# Check news endpoint
curl http://localhost:8787/regulatory-news

# If empty, check alerts
curl http://localhost:8787/alerts

# If alerts empty, check source status
curl http://localhost:8787/sources/status
```

## Useful Resources

- **Frontend Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** React Hooks
- **Animations:** Framer Motion
- **Build Tool:** Vite
- **Backend:** Node.js + Express
- **Data Source:** Cheerio (HTML parsing)

## Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes and test
npm run build && npm run dev

# 3. Commit with descriptive message
git add -A
git commit -m "feat: Your feature description"

# 4. Push to GitHub
git push origin feature/your-feature

# 5. Create Pull Request on GitHub
```

## Next Steps

1. **Explore Dashboard:** Visit http://localhost:5173 and explore the regulatory radar
2. **Review News Panel:** Check the "Regulatory Compliance Updates" section
3. **Test APIs:** Try the curl commands above to understand data flow
4. **Read Docs:** Check `/docs/regulatory-news-feature.md` for detailed info
5. **Customize:** Modify CA action items in `/index.js` for your use case

## Support

- **Documentation:** See `/docs/` directory
- **Issues:** Check GitHub Issues for known problems
- **Logs:** View agent logs with `npm run agent:pm2:logs`
- **API Testing:** Use Postman or curl to test endpoints

---

**Last Updated:** 2026-03-29
**Maintainer:** Regulon Team
**Repository:** https://github.com/singhatharav935/sannidh-command
