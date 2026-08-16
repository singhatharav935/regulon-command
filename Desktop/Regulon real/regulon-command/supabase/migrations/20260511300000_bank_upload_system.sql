-- ── 1. Bank Statement Uploads Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_bank_statements (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  file_name       text          NOT NULL,
  file_path       text          NOT NULL, -- Storage bucket path
  file_type       text          CHECK (file_type IN ('pdf', 'csv', 'xlsx')),
  
  status          text          DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Metadata from the parser
  bank_name       text,
  account_number  text,
  period_start    date,
  period_end      date,
  
  parsed_data     jsonb,        -- The actual rows extracted from the file
  error_log       text,

  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- ── 2. Account Aggregator (AA) Consent Requests ────────────────────────────────
-- Tracks the legal "Consent" flow for automatic bank data fetch.
CREATE TABLE IF NOT EXISTS public.aa_consent_requests (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_user_id      uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  aa_provider     text          DEFAULT 'finvu', -- e.g., 'finvu', 'onemoney'
  aa_handle       text          NOT NULL, -- The user's AA handle (e.g., user@finvu)
  consent_id      text,          -- The external ID from the AA provider
  
  status          text          DEFAULT 'pending'
    CHECK (status IN ('pending', 'requested', 'approved', 'rejected', 'expired')),
  
  consent_start   timestamptz,
  consent_end     timestamptz,
  data_fetch_frequency text     DEFAULT 'daily',

  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- ── 3. AA Linked Accounts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aa_linked_accounts (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id      text          NOT NULL,
  company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  fip_id          text          NOT NULL, -- Financial Information Provider (e.g., 'HDFC')
  account_type    text,          -- SAVINGS, CURRENT, etc.
  masked_account_number text,
  
  last_synced_at  timestamptz,
  
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.client_bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aa_consent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aa_linked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ca_manages_statements" ON public.client_bank_statements FOR ALL USING (ca_user_id = auth.uid());
CREATE POLICY "ca_manages_consent" ON public.aa_consent_requests FOR ALL USING (ca_user_id = auth.uid());
CREATE POLICY "ca_views_linked_accounts" ON public.aa_linked_accounts FOR SELECT USING (true);
