CREATE TABLE IF NOT EXISTS public.ai_request_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  request_key TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  response_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, request_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_request_idempotency_status_updated
  ON public.ai_request_idempotency(status, updated_at DESC);

ALTER TABLE public.ai_request_idempotency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai idempotency rows"
  ON public.ai_request_idempotency FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ai idempotency rows"
  ON public.ai_request_idempotency FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai idempotency rows"
  ON public.ai_request_idempotency FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage ai idempotency rows"
  ON public.ai_request_idempotency FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_ai_request_idempotency_updated_at ON public.ai_request_idempotency;
CREATE TRIGGER update_ai_request_idempotency_updated_at
  BEFORE UPDATE ON public.ai_request_idempotency
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
