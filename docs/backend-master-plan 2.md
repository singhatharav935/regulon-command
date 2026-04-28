# SANNIDH Backend Master Plan (Phase Start)

This is the backend baseline to cover the entire product surface (MCA, GST, Income Tax, RBI, SEBI, Customs, Contract, Custom response, dashboard agent workflows, approvals, audit, and credits).

## What is now added in this phase

1. Autonomous agent data layer (Supabase SQL migration):
- `agent_runs`
- `agent_actions`
- `agent_action_edits`
- `agent_notifications_outbox`
- `agent_portal_events`
- strict RLS policies + indexes + update triggers
- helper function: `public.can_access_company(uuid)`

2. Agent backend edge API:
- Function: `agent-backend`
- Routes:
  - `POST /agent/run` -> create an autonomous run with action items
  - `GET /agent/dashboard` -> list owner runs + actions by scope/company
  - `GET /agent/run/:id` -> run details + actions
  - `POST /agent/action/:id/edit` -> save editable owner change
  - `POST /agent/action/:id/approve` -> owner approval and run status update

## Deployment order

1. Run DB migrations
2. Deploy edge function `agent-backend`
3. Add frontend API wiring to replace localStorage review payload
4. Enable notification sender worker for outbox (email/whatsapp/in-app)
5. Add scheduler/cron for overnight portal polling and run generation

## Next backend blocks to complete

1. Portal ingestion workers
- GST/MCA/IT/RBI/SEBI event collectors -> `agent_portal_events`

2. Policy/Rules engine service
- convert events to deterministic action plans and risk scores

3. Notification dispatch service
- process `agent_notifications_outbox` with retries and delivery receipts

4. Credit ledger + billing service
- usage accounting per generation/recheck/agent-run

5. Evidence/document pipeline
- OCR + parser + citation confidence + source traceability

6. Job orchestration
- run scheduling, retries, dead-letter queue, SLA monitoring

## Security notes

- Current edge function validates user token manually and uses RLS for row access.
- For production hardening, set `verify_jwt = true` and keep route-level authorization checks.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never expose in frontend.
