-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: AUDIT TRAIL & COMMUNICATION LOGS
-- Tracks all automated AI communications and compliance score history.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.communication_logs (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type            text          NOT NULL CHECK (type IN ('email', 'whatsapp', 'portal_alert', 'system')),
  direction       text          NOT NULL CHECK (direction IN ('outbound', 'inbound', 'internal')),
  recipient       text,
  subject         text,
  content         text          NOT NULL,
  
  -- The AI Agent that initiated this (if any)
  ai_agent_id     text,
  
  status          text          NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
  
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_score_history (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  previous_score  integer       NOT NULL,
  new_score       integer       NOT NULL,
  reason          text,
  
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_score_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ca_owns_comm_logs" ON public.communication_logs;
CREATE POLICY "ca_owns_comm_logs" 
  ON public.communication_logs FOR ALL 
  USING (ca_user_id = auth.uid()) 
  WITH CHECK (ca_user_id = auth.uid());

DROP POLICY IF EXISTS "ca_owns_score_history" ON public.compliance_score_history;
CREATE POLICY "ca_owns_score_history" 
  ON public.compliance_score_history FOR ALL 
  USING (ca_user_id = auth.uid()) 
  WITH CHECK (ca_user_id = auth.uid());
