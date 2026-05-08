-- Migration: CA Firm Dashboard — Safe Schema Setup
-- Uses ALTER TABLE ADD COLUMN IF NOT EXISTS throughout.
-- Safe to run even when tables already exist with partial schemas.

-- ─── Create tables only if they don't exist at all ───────────────────────────

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

-- ─── Safely add ALL columns (idempotent - will not fail if column exists) ─────

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

-- ─── Indexes (safe - only created after columns exist above) ─────────────────
CREATE INDEX IF NOT EXISTS idx_ca_firm_members_firm_id  ON ca_firm_members(firm_id);
CREATE INDEX IF NOT EXISTS idx_ca_firm_clients_firm_id  ON ca_firm_clients(firm_id);
CREATE INDEX IF NOT EXISTS idx_ca_firm_invoices_firm_id ON ca_firm_invoices(firm_id);
CREATE INDEX IF NOT EXISTS idx_ca_assignments_member    ON ca_assignments(ca_member_id);
CREATE INDEX IF NOT EXISTS idx_ca_assignments_client    ON ca_assignments(firm_client_id);
