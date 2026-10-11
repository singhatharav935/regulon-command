-- Migration: CA Company Link System
-- Creates tables for real Company ↔ CA dashboard connection with OTP

-- Table 1: Link Codes (one per user — CA gets a CA code, Company gets a CO code)
CREATE TABLE IF NOT EXISTS public.ca_company_link_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role         text NOT NULL CHECK (role IN ('ca', 'company')),
  link_code    text NOT NULL UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.ca_company_link_codes ENABLE ROW LEVEL SECURITY;

-- Users can only read their own code
CREATE POLICY "Users read own link code"
  ON public.ca_company_link_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (edge function uses service role)
CREATE POLICY "Service role full access to link codes"
  ON public.ca_company_link_codes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table 2: Connections between CA and Company users
CREATE TABLE IF NOT EXISTS public.ca_company_connections (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_email       text NOT NULL,
  requester_role        text NOT NULL CHECK (requester_role IN ('ca', 'company')),
  requester_link_code   text NOT NULL,
  target_user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_email          text NOT NULL,
  target_role           text NOT NULL CHECK (target_role IN ('ca', 'company')),
  target_link_code      text NOT NULL,
  status                text NOT NULL DEFAULT 'otp_pending' CHECK (status IN ('otp_pending', 'active', 'revoked')),
  otp_hash              text,
  otp_expires_at        timestamptz,
  linked_at             timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_user_id, target_user_id)
);

ALTER TABLE public.ca_company_connections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own connections (as requester or target)
CREATE POLICY "Users see own connections"
  ON public.ca_company_connections FOR SELECT
  USING (auth.uid() = requester_user_id OR auth.uid() = target_user_id);

-- Service role full access (edge function uses service role)
CREATE POLICY "Service role full access to connections"
  ON public.ca_company_connections FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table 3: Synced financial data from Company to CA
CREATE TABLE IF NOT EXISTS public.ca_company_sync_data (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id     uuid NOT NULL REFERENCES public.ca_company_connections(id) ON DELETE CASCADE,
  company_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ca_user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload           jsonb NOT NULL,
  sent_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE(connection_id)
);

ALTER TABLE public.ca_company_sync_data ENABLE ROW LEVEL SECURITY;

-- Company can see their own synced data; CA can see data sent to them
CREATE POLICY "Parties see their own sync data"
  ON public.ca_company_sync_data FOR SELECT
  USING (auth.uid() = company_user_id OR auth.uid() = ca_user_id);

-- Service role full access
CREATE POLICY "Service role full access to sync data"
  ON public.ca_company_sync_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ca_company_link_codes_user_id ON public.ca_company_link_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_ca_company_link_codes_code ON public.ca_company_link_codes(link_code);
CREATE INDEX IF NOT EXISTS idx_ca_company_connections_requester ON public.ca_company_connections(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_ca_company_connections_target ON public.ca_company_connections(target_user_id);
CREATE INDEX IF NOT EXISTS idx_ca_company_connections_status ON public.ca_company_connections(status);
CREATE INDEX IF NOT EXISTS idx_ca_company_sync_data_ca ON public.ca_company_sync_data(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_ca_company_sync_data_company ON public.ca_company_sync_data(company_user_id);
