-- Migration: CA Firm Dashboard — Safe Schema + RLS Security
-- Run this in Supabase SQL Editor. Fully idempotent.

-- ─── Step 1: Create tables with minimal schema if they don't exist ────────────
CREATE TABLE IF NOT EXISTS ca_firm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ca_firm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ca_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ca_firm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ca_firm_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Step 2: Add all columns safely ──────────────────────────────────────────

-- ca_firm_members
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS firm_id UUID;
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS member_name VARCHAR(255);
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS role VARCHAR(100);
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS specialization VARCHAR(200);
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE ca_firm_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ca_firm_clients
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS firm_id UUID;
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS gstin VARCHAR(20);
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS pan VARCHAR(12);
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS primary_ca_id UUID;
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS total_fees_ytd DECIMAL(15,2) DEFAULT 0;
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS last_service_date DATE;
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE ca_firm_clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ca_assignments
ALTER TABLE ca_assignments ADD COLUMN IF NOT EXISTS ca_member_id UUID;
ALTER TABLE ca_assignments ADD COLUMN IF NOT EXISTS firm_client_id UUID;
ALTER TABLE ca_assignments ADD COLUMN IF NOT EXISTS firm_id UUID;
ALTER TABLE ca_assignments ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);
ALTER TABLE ca_assignments ADD COLUMN IF NOT EXISTS assignment_date DATE;
ALTER TABLE ca_assignments ADD COLUMN IF NOT EXISTS completion_date DATE;
ALTER TABLE ca_assignments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE ca_assignments ADD COLUMN IF NOT EXISTS hours_allocated INT DEFAULT 0;
ALTER TABLE ca_assignments ADD COLUMN IF NOT EXISTS hours_utilized INT DEFAULT 0;
ALTER TABLE ca_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ca_firm_invoices
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS firm_id UUID;
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS firm_client_id UUID;
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS invoice_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS invoice_date DATE;
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS payment_received_date DATE;
ALTER TABLE ca_firm_invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ca_firm_documents
ALTER TABLE ca_firm_documents ADD COLUMN IF NOT EXISTS firm_id UUID;
ALTER TABLE ca_firm_documents ADD COLUMN IF NOT EXISTS uploaded_by UUID;
ALTER TABLE ca_firm_documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(500);
ALTER TABLE ca_firm_documents ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE ca_firm_documents ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE ca_firm_documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);
ALTER TABLE ca_firm_documents ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general';
ALTER TABLE ca_firm_documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ca_firm_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ─── Step 3: Performance indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cafm_firm      ON ca_firm_members(firm_id);
CREATE INDEX IF NOT EXISTS idx_cafc_firm      ON ca_firm_clients(firm_id);
CREATE INDEX IF NOT EXISTS idx_cafi_firm      ON ca_firm_invoices(firm_id);
CREATE INDEX IF NOT EXISTS idx_caa_member     ON ca_assignments(ca_member_id);
CREATE INDEX IF NOT EXISTS idx_caa_client     ON ca_assignments(firm_client_id);
CREATE INDEX IF NOT EXISTS idx_cafd_firm      ON ca_firm_documents(firm_id);

-- ─── Step 4: Enable RLS ───────────────────────────────────────────────────────
ALTER TABLE ca_firm_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_firm_clients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_firm_invoices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_firm_documents ENABLE ROW LEVEL SECURITY;

-- ─── Step 5: RLS Policies — firm isolation via firm_id = auth.uid() ──────────
-- Members table
DROP POLICY IF EXISTS "firm_members_own_firm" ON ca_firm_members;
CREATE POLICY "firm_members_own_firm" ON ca_firm_members
  FOR ALL USING (firm_id::text = auth.uid()::text OR user_id = auth.uid());

-- Clients table
DROP POLICY IF EXISTS "firm_clients_own_firm" ON ca_firm_clients;
CREATE POLICY "firm_clients_own_firm" ON ca_firm_clients
  FOR ALL USING (firm_id::text = auth.uid()::text);

-- Assignments table
DROP POLICY IF EXISTS "firm_assignments_own_firm" ON ca_assignments;
CREATE POLICY "firm_assignments_own_firm" ON ca_assignments
  FOR ALL USING (
    firm_id::text = auth.uid()::text
    OR ca_member_id IN (
      SELECT id FROM ca_firm_members WHERE firm_id::text = auth.uid()::text
    )
  );

-- Invoices table
DROP POLICY IF EXISTS "firm_invoices_own_firm" ON ca_firm_invoices;
CREATE POLICY "firm_invoices_own_firm" ON ca_firm_invoices
  FOR ALL USING (firm_id::text = auth.uid()::text);

-- Documents table
DROP POLICY IF EXISTS "firm_documents_own_firm" ON ca_firm_documents;
CREATE POLICY "firm_documents_own_firm" ON ca_firm_documents
  FOR ALL USING (firm_id::text = auth.uid()::text OR uploaded_by = auth.uid());

-- ─── Step 6: Storage bucket for firm documents ───────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ca-firm-documents',
  'ca-firm-documents',
  false,
  52428800,  -- 50MB limit
  ARRAY['application/pdf','image/jpeg','image/png','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DROP POLICY IF EXISTS "firm_docs_upload" ON storage.objects;
CREATE POLICY "firm_docs_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ca-firm-documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "firm_docs_read" ON storage.objects;
CREATE POLICY "firm_docs_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ca-firm-documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "firm_docs_delete" ON storage.objects;
CREATE POLICY "firm_docs_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'ca-firm-documents' AND auth.uid() IS NOT NULL);
