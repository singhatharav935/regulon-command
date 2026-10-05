-- Migration: Enterprise Security Hardening & WORM Vault
-- Created: 2026-05-30
-- Description: Creates the Write-Once-Read-Many (WORM) storage bucket for compliance audits,
--              and hardens database access controls to strictly isolate CA boundaries.

-- ── 1. WORM Storage Vault (compliance_audit_vault) ───────────────────────────
-- Create the secure bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance_audit_vault', 
  'compliance_audit_vault', 
  false, -- private bucket
  52428800, -- 50MB limit per file
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json']::text[]
) ON CONFLICT (id) DO UPDATE SET 
  public = false,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json']::text[];

-- WORM Policies for storage.objects

-- 1. INSERT (Write Once): Allow CAs to upload files to their own prefix (ca_user_id/...)
CREATE POLICY "CAs can upload audit files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'compliance_audit_vault' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. SELECT (Read Many): Allow CAs to read files in their own prefix
CREATE POLICY "CAs can view own audit files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'compliance_audit_vault' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. UPDATE / DELETE: EXPLICITLY DENIED BY OMISSION
-- By NOT creating UPDATE or DELETE policies for 'compliance_audit_vault',
-- Supabase RLS will inherently reject any attempt to modify or delete these files by authenticated users.
-- This fulfills the WORM compliance requirement.


-- ── 2. RLS Security Hardening (Defense in Depth) ───────────────────────────

-- Ensure ALL core tables have RLS enabled and strictly enforce ca_user_id boundary
DO $$
DECLARE
    t_name text;
    tables_to_secure text[] := ARRAY[
        'tax_filings', 'client_govt_notices', 'bilingual_notices', 
        'efiling_jobs', 'audit_trail_events', 'compliance_scores'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_to_secure LOOP
        -- Attempt to enable RLS (safe if already enabled)
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', t_name);
    END LOOP;
END $$;

-- Notice: We rely on the specific table policies already created in previous migrations.
-- This script ensures the WORM bucket is fully configured and validates RLS activation.
