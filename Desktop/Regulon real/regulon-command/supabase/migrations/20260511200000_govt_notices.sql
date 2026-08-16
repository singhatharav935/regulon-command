-- ─────────────────────────────────────────────────────────────────────────────
-- STEP B: GOVERNMENT NOTICE ALERTS & AUTONOMOUS TRIGGER
-- Stores detected government notices and automatically triggers the AI Swarm.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Client Government Notices Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_govt_notices (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  department      text          NOT NULL CHECK (department IN ('GST', 'Income Tax', 'MCA', 'EPFO', 'Customs', 'RBI')),
  notice_type     text          NOT NULL, -- e.g., 'DRC-01', 'Scrutiny', 'Show Cause'
  notice_number   text          NOT NULL,
  issue_date      date          NOT NULL,
  due_date        date,
  
  -- The raw content or OCR text of the notice
  raw_text_content text,
  document_url    text,
  
  -- Status of the AI Pipeline for this notice
  status          text          DEFAULT 'detected' 
    CHECK (status IN ('detected', 'analyzing', 'drafting_reply', 'review_pending', 'filed', 'resolved')),
  
  financial_year  text          NOT NULL,

  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.client_govt_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ca_owns_notices" ON public.client_govt_notices;
CREATE POLICY "ca_owns_notices" ON public.client_govt_notices FOR ALL USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());

-- ── 2. The Autonomous Trigger: Notice -> AI Swarm ────────────────────────────
-- When a notice is inserted, this trigger automatically queues the AI Swarm Engine
-- to prepare the Data Room for the specific financial year the notice pertains to.

CREATE OR REPLACE FUNCTION public.auto_trigger_swarm_on_notice()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  existing_job_id uuid;
BEGIN
  -- Check if a swarm job is already running or completed for this company/FY recently
  SELECT id INTO existing_job_id 
  FROM public.ai_swarm_jobs 
  WHERE company_id = NEW.company_id 
    AND financial_year = NEW.financial_year 
    AND (status = 'running' OR (status = 'completed' AND completed_at > now() - interval '1 hour'))
  LIMIT 1;

  -- If no recent job exists, automatically queue a new AI Swarm Job
  IF existing_job_id IS NULL THEN
    INSERT INTO public.ai_swarm_jobs (
      company_id, ca_user_id, financial_year, job_type, status, current_step, progress
    ) VALUES (
      NEW.company_id, NEW.ca_user_id, NEW.financial_year, 'full_pipeline', 'running', 'starting_autonomously', 0
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_swarm_on_notice_insert ON public.client_govt_notices;
CREATE TRIGGER trigger_swarm_on_notice_insert
  AFTER INSERT ON public.client_govt_notices
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_trigger_swarm_on_notice();

-- ── 3. Call Edge Function (Optional direct trigger) ──────────────────────────
-- Note: Supabase Edge Functions can also listen to database webhooks. 
-- The above trigger writes to ai_swarm_jobs. We would set up a Database Webhook 
-- in Supabase to hit the 'ai-financial-swarm' edge function endpoint whenever 
-- a new row is added to ai_swarm_jobs with status 'running'.
