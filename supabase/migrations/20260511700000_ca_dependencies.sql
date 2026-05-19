-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: CA DEPENDENCIES (DOCUMENT VAULT)
-- Tracks documents and inputs requested by the CA from the Client.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ca_dependencies (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  document_name   text          NOT NULL, -- e.g., 'Bank Statement (HDFC)', 'Tally Backup'
  description     text,
  urgency         text          NOT NULL DEFAULT 'medium' CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  status          text          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'verified', 'rejected')),
  
  -- S3 Storage path if uploaded
  file_path       text,
  file_url        text,
  
  -- Deadlines
  due_date        date          NOT NULL,
  
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.ca_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ca_owns_dependencies" ON public.ca_dependencies;
CREATE POLICY "ca_owns_dependencies" 
  ON public.ca_dependencies FOR ALL 
  USING (ca_user_id = auth.uid()) 
  WITH CHECK (ca_user_id = auth.uid());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_ca_dependencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ca_dependencies_updated_at ON public.ca_dependencies;
CREATE TRIGGER trg_ca_dependencies_updated_at
BEFORE UPDATE ON public.ca_dependencies
FOR EACH ROW EXECUTE FUNCTION update_ca_dependencies_updated_at();
