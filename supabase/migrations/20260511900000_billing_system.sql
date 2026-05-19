-- ─────────────────────────────────────────────────────────────────────────────
-- PRACTICE BILLING & TASK HISTORY
-- Tracks completed tasks and links them to the existing ca_firm_invoices table.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ca_task_history (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  task_name       text          NOT NULL,
  completed_at    timestamptz   NOT NULL DEFAULT now(),
  suggested_fee   numeric       NOT NULL DEFAULT 0.00,
  
  is_billed       boolean       NOT NULL DEFAULT false,
  invoice_id      uuid,         -- Links to ca_firm_invoices when billed
  
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- Foreign key link to existing ca_firm_invoices
ALTER TABLE public.ca_task_history 
  ADD CONSTRAINT fk_task_invoice 
  FOREIGN KEY (invoice_id) REFERENCES public.ca_firm_invoices(id) ON DELETE SET NULL;

-- RLS Policies
ALTER TABLE public.ca_task_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ca_owns_tasks" ON public.ca_task_history;
CREATE POLICY "ca_owns_tasks" 
  ON public.ca_task_history FOR ALL 
  USING (ca_user_id = auth.uid()) 
  WITH CHECK (ca_user_id = auth.uid());
