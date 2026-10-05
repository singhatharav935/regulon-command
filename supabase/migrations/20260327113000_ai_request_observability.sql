ALTER TABLE public.ai_request_idempotency
  ADD COLUMN IF NOT EXISTS response_status INTEGER,
  ADD COLUMN IF NOT EXISTS ai_model_used TEXT,
  ADD COLUMN IF NOT EXISTS ai_fallback_used BOOLEAN,
  ADD COLUMN IF NOT EXISTS ai_attempt_count INTEGER,
  ADD COLUMN IF NOT EXISTS model_router_version TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ai_request_idempotency_user_created
  ON public.ai_request_idempotency(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_request_idempotency_completed_at
  ON public.ai_request_idempotency(completed_at DESC);
