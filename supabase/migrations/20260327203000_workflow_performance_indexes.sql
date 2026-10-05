-- Performance indexes for workflow timeline, SLA, and policy checks.

CREATE INDEX IF NOT EXISTS idx_draft_runs_status_updated_at
  ON public.draft_runs(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_draft_runs_company_status_updated_at
  ON public.draft_runs(company_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_draft_audit_events_run_created
  ON public.draft_audit_events(draft_run_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_draft_audit_events_run_event_created
  ON public.draft_audit_events(draft_run_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_draft_versions_run_created
  ON public.draft_versions(draft_run_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_draft_exports_run_created
  ON public.draft_exports(draft_run_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_draft_filing_checks_run_created
  ON public.draft_filing_checks(draft_run_id, created_at DESC);
