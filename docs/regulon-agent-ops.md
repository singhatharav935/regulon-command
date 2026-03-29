# Regulon Agent Production Ops

This runs the live ingestion worker continuously and writes announcements into Supabase.

## 1) Server prerequisites

- Node.js 20+
- Network egress enabled to:
  - `pib.gov.in`
  - `www.gst.gov.in`
  - `www.mca.gov.in`
- Supabase env values

## 2) Environment file

Create `.env.agent` in project root:

```bash
cp .env.agent.example .env.agent
```

Set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALERT_AGENT_PORT` (default `8787`)

## 3) PM2 deployment (recommended)

```bash
npm install
npm install -g pm2
mkdir -p logs
set -a; source .env.agent; set +a
npm run agent:pm2:start
npm run agent:pm2:save
pm2 startup
```

Useful commands:

```bash
npm run agent:pm2:logs
npm run agent:pm2:restart
npm run agent:pm2:stop
```

## 4) systemd deployment (alternative)

1. Copy service file:

```bash
sudo cp deploy/systemd/regulon-agent.service /etc/systemd/system/regulon-agent.service
```

2. Create env file:

```bash
sudo mkdir -p /etc/regulon
sudo cp .env.agent /etc/regulon/regulon-agent.env
```

3. Ensure service paths/user in unit match your server:

- `WorkingDirectory`
- `ExecStart`
- `User` and `Group`

4. Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable regulon-agent
sudo systemctl start regulon-agent
sudo systemctl status regulon-agent
```

## 5) Runtime verification

```bash
curl http://localhost:8787/health
curl -X POST http://localhost:8787/sync-now
curl http://localhost:8787/alerts
```

Expected:

- Health status becomes `success` or `partial_success`
- `/alerts` returns non-empty live records
- Supabase table `government_announcements` gets rows

