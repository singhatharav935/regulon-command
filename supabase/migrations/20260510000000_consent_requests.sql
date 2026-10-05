-- ─────────────────────────────────────────────────
-- CONSENT REQUESTS TABLE
-- Tracks CA→Client consent for data access authorization.
-- Email & WhatsApp notifications use the consent_token URL.
-- ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.consent_requests (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id            uuid        REFERENCES public.companies(id) ON DELETE SET NULL,
  client_name           text        NOT NULL,
  client_email          text,
  client_phone          text,
  gstin                 text,
  pan                   text,
  cin                   text,
  ca_name               text,
  ca_firm_name          text,
  consent_status        text        NOT NULL DEFAULT 'pending'
                                    CHECK (consent_status IN ('pending', 'approved', 'rejected')),
  consent_token         text        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  notification_sent_at  timestamptz,
  responded_at          timestamptz,
  email_sent            boolean     NOT NULL DEFAULT false,
  whatsapp_sent         boolean     NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_consent_requests_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER consent_requests_updated_at
  BEFORE UPDATE ON public.consent_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_consent_requests_updated_at();

-- RLS
ALTER TABLE public.consent_requests ENABLE ROW LEVEL SECURITY;

-- CA can fully manage their own rows
CREATE POLICY "ca_owns_consent_requests"
  ON public.consent_requests FOR ALL
  USING (ca_user_id = auth.uid())
  WITH CHECK (ca_user_id = auth.uid());

-- Public can SELECT any row (consent page reads by token without auth)
CREATE POLICY "public_read_consent_by_token"
  ON public.consent_requests FOR SELECT
  USING (true);

-- Index for fast token lookups (used by consent page + edge function)
CREATE INDEX IF NOT EXISTS idx_consent_requests_token
  ON public.consent_requests (consent_token);

CREATE INDEX IF NOT EXISTS idx_consent_requests_ca_user
  ON public.consent_requests (ca_user_id, created_at DESC);
