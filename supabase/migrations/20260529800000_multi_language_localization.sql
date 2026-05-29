-- Migration: Multi-Language & Regional Localization (Gap 13)
-- Created: 2026-05-29
-- Description: Core tables for persisting CA language preferences and indexing translated regional government notices.

-- ── 1. user_language_preferences ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_language_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_language VARCHAR(5) DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'mr', 'ta', 'te', 'bn')),
    is_rtl_layout BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. bilingual_notices ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bilingual_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    notice_title TEXT NOT NULL,
    issuing_authority TEXT NOT NULL CHECK (issuing_authority IN ('GSTIN', 'Income Tax', 'MCA', 'DGFT', 'EPFO', 'ESIC', 'SEBI', 'RBI', 'Customs')),
    source_language VARCHAR(20) NOT NULL CHECK (source_language IN ('Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Kannada', 'Gujarati', 'Malayalam', 'Odia', 'Punjabi')),
    original_text TEXT NOT NULL,              -- OCR text in regional language
    translated_text TEXT NOT NULL,            -- translated English equivalent
    status TEXT DEFAULT 'pending_action' CHECK (status IN ('pending_action', 'action_taken', 'disputed', 'resolved')),
    extracted_action_items JSONB NOT NULL DEFAULT '[]', -- Action items: [{ task_title, due_date, severity }]
    metadata JSONB DEFAULT '{}',
    notice_date DATE NOT NULL,
    due_date DATE,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. Triggers ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_language_preferences_updated_at') THEN
    CREATE TRIGGER update_user_language_preferences_updated_at BEFORE UPDATE ON user_language_preferences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bilingual_notices_updated_at') THEN
    CREATE TRIGGER update_bilingual_notices_updated_at BEFORE UPDATE ON bilingual_notices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

-- ── 4. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_lang_user ON user_language_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_bilingual_notices_ca ON bilingual_notices(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_bilingual_notices_authority ON bilingual_notices(issuing_authority);
CREATE INDEX IF NOT EXISTS idx_bilingual_notices_lang ON bilingual_notices(source_language);
CREATE INDEX IF NOT EXISTS idx_bilingual_notices_status ON bilingual_notices(status);

-- ── 5. Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE user_language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bilingual_notices ENABLE ROW LEVEL SECURITY;

-- Preferences policies
CREATE POLICY "Users can manage own language preferences"
ON user_language_preferences FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Bilingual notices policies
CREATE POLICY "CAs can manage own bilingual notices"
ON bilingual_notices FOR ALL TO authenticated
USING (ca_user_id = auth.uid()) WITH CHECK (ca_user_id = auth.uid());
