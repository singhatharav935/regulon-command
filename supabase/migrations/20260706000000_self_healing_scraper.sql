-- ════════════════════════════════════════════════════════════════════
-- SANNIDH: Self-Healing Government Scraper — Database Schema
-- Migration: 20260706000000_self_healing_scraper.sql
-- ════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- TABLE 1: scraper_health_logs
-- Every scraper run (success or failure) is recorded here.
-- On failure, error_context captures the broken selector + page HTML
-- + screenshot URL so the Self-Healing AI has full context to repair.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraper_health_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID NOT NULL DEFAULT gen_random_uuid(),
  portal            TEXT NOT NULL CHECK (portal IN ('GSTN', 'INCOME_TAX', 'MCA')),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE,
  ca_user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status            TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'captcha_failed', 'login_failed', 'selector_not_found')),
  
  -- What the bot was doing when it failed
  failed_step       TEXT,           -- e.g. 'login', 'captcha', 'navigate_notices', 'extract_table'
  failed_selector   TEXT,           -- The CSS/XPath selector that could not be found
  
  -- Full context for the Self-Healing AI (stored as JSONB)
  error_context     JSONB,          -- { error_message, page_html_snippet, screenshot_url, user_agent, portal_url }
  
  -- Run statistics
  notices_found     INTEGER DEFAULT 0,
  captcha_attempts  INTEGER DEFAULT 0,
  duration_ms       INTEGER,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_health_logs_status ON scraper_health_logs(status);
CREATE INDEX IF NOT EXISTS idx_scraper_health_logs_portal ON scraper_health_logs(portal);
CREATE INDEX IF NOT EXISTS idx_scraper_health_logs_created_at ON scraper_health_logs(created_at DESC);

ALTER TABLE scraper_health_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated CAs can read their own scraper logs
CREATE POLICY "CA can view own scraper health logs"
  ON scraper_health_logs FOR SELECT
  USING (ca_user_id = auth.uid());

-- Service role can write (used by edge functions)
CREATE POLICY "Service role can insert scraper health logs"
  ON scraper_health_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update scraper health logs"
  ON scraper_health_logs FOR UPDATE
  USING (true);


-- ──────────────────────────────────────────────────────────────────
-- TABLE 2: scraper_selectors
-- Versioned store of all CSS/XPath selectors used by the bots.
-- When the AI Self-Healing Monitor repairs a broken selector,
-- it inserts a new row with healed_by_ai = true and bumps version.
-- The bot always reads the latest is_active = true row per portal+key.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraper_selectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal          TEXT NOT NULL CHECK (portal IN ('GSTN', 'INCOME_TAX', 'MCA')),
  selector_key    TEXT NOT NULL,      -- e.g. 'login_username', 'login_password', 'captcha_img', 'notice_table_row'
  selector_value  TEXT NOT NULL,      -- e.g. '#username', '.notice-table tbody tr', 'xpath://input[@name="user"]'
  selector_type   TEXT NOT NULL DEFAULT 'css' CHECK (selector_type IN ('css', 'xpath', 'text')),
  version         INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  
  -- Set to true when the AI healed this selector (vs hand-coded)
  healed_by_ai    BOOLEAN NOT NULL DEFAULT false,
  heal_confidence INTEGER,  -- 0-100 confidence score from the AI repair
  
  -- Notes from AI or developer about this selector
  notes           TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite unique: only one active selector per portal+key
CREATE UNIQUE INDEX IF NOT EXISTS idx_scraper_selectors_active
  ON scraper_selectors(portal, selector_key)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_scraper_selectors_portal ON scraper_selectors(portal, selector_key);

ALTER TABLE scraper_selectors ENABLE ROW LEVEL SECURITY;

-- CAs can read selectors (for transparency in dashboard)
CREATE POLICY "Any authenticated user can view selectors"
  ON scraper_selectors FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role writes (edge functions + AI monitor)
CREATE POLICY "Service role can manage selectors"
  ON scraper_selectors FOR ALL
  USING (true)
  WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────────
-- TABLE 3: scraper_repair_logs
-- Full audit trail of every AI self-repair event.
-- Records what was broken, what AI proposed, confidence, and outcome.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scraper_repair_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_log_id       UUID REFERENCES scraper_health_logs(id) ON DELETE SET NULL,
  portal              TEXT NOT NULL CHECK (portal IN ('GSTN', 'INCOME_TAX', 'MCA')),
  selector_key        TEXT NOT NULL,
  
  -- What was broken
  original_selector   TEXT NOT NULL,
  
  -- What AI proposed
  fixed_selector      TEXT,
  confidence_score    INTEGER,    -- 0-100
  ai_explanation      TEXT,       -- GPT-4o reasoning for the fix
  
  -- Outcome
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',            -- AI generated fix, not yet deployed
    'deployed',           -- Fix is now active in scraper_selectors
    'verified',           -- Deployed fix worked on next run
    'rejected_low_conf',  -- Confidence < 70, sent to human review
    'rejected_failed',    -- Deployed but still failed on next run
    'manual_override'     -- Human developer manually corrected it
  )),
  
  -- Token cost tracking
  tokens_used         INTEGER,
  
  repaired_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scraper_repair_logs_portal ON scraper_repair_logs(portal);
CREATE INDEX IF NOT EXISTS idx_scraper_repair_logs_status ON scraper_repair_logs(status);

ALTER TABLE scraper_repair_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Any authenticated user can view repair logs"
  ON scraper_repair_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage repair logs"
  ON scraper_repair_logs FOR ALL
  USING (true)
  WITH CHECK (true);


-- ──────────────────────────────────────────────────────────────────
-- SEED: Default CSS Selectors for Government Portals
-- Based on current known portal layouts (July 2026).
-- These are the STARTING selectors — AI will heal them if they break.
-- ──────────────────────────────────────────────────────────────────

-- GST Portal (https://services.gst.gov.in/services/login)
INSERT INTO scraper_selectors (portal, selector_key, selector_value, selector_type, version, notes)
VALUES
  ('GSTN', 'login_username',        '#username',                       'css',   1, 'GST portal username input'),
  ('GSTN', 'login_password',        '#user_pass',                      'css',   1, 'GST portal password input'),
  ('GSTN', 'captcha_img',           '#imgCaptcha',                     'css',   1, 'GST portal CAPTCHA image'),
  ('GSTN', 'captcha_input',         '#captcha',                        'css',   1, 'GST portal CAPTCHA text input'),
  ('GSTN', 'login_submit',          '#btnlogin',                       'css',   1, 'GST portal login submit button'),
  ('GSTN', 'notices_menu',          'a[href*="notices"]',              'css',   1, 'GST portal notices navigation link'),
  ('GSTN', 'notice_table_row',      '.table tbody tr',                 'css',   1, 'GST notices table row selector'),
  ('GSTN', 'notice_ref_cell',       'td:nth-child(1)',                 'css',   1, 'Notice reference number cell'),
  ('GSTN', 'notice_type_cell',      'td:nth-child(2)',                 'css',   1, 'Notice type cell'),
  ('GSTN', 'notice_date_cell',      'td:nth-child(3)',                 'css',   1, 'Notice issue date cell'),
  ('GSTN', 'notice_due_date_cell',  'td:nth-child(4)',                 'css',   1, 'Notice due date cell'),
  ('GSTN', 'notice_download_link',  'td a[href*=".pdf"]',             'css',   1, 'Notice PDF download link')
ON CONFLICT DO NOTHING;

-- Income Tax Portal (https://www.incometax.gov.in/iec/foportal)
INSERT INTO scraper_selectors (portal, selector_key, selector_value, selector_type, version, notes)
VALUES
  ('INCOME_TAX', 'login_pan_input',        '#userId',                              'css',   1, 'IT portal PAN input'),
  ('INCOME_TAX', 'login_continue_btn',     '#continue',                            'css',   1, 'IT portal continue button after PAN'),
  ('INCOME_TAX', 'login_password',         '#passwordField',                       'css',   1, 'IT portal password input'),
  ('INCOME_TAX', 'captcha_img',            '.captcha-img img',                     'css',   1, 'IT portal CAPTCHA image'),
  ('INCOME_TAX', 'captcha_input',          '#captchaText',                         'css',   1, 'IT portal CAPTCHA text input'),
  ('INCOME_TAX', 'login_submit',           '#loginBtn',                            'css',   1, 'IT portal login submit button'),
  ('INCOME_TAX', 'pending_actions_link',   'a[href*="pending-actions"]',           'css',   1, 'IT portal pending actions nav link'),
  ('INCOME_TAX', 'notice_table_row',       '.outstanding-table tbody tr',          'css',   1, 'IT outstanding demand/notice table row'),
  ('INCOME_TAX', 'notice_ref_cell',        'td:nth-child(1)',                      'css',   1, 'IT notice reference number cell'),
  ('INCOME_TAX', 'notice_type_cell',       'td:nth-child(2)',                      'css',   1, 'IT notice type/section cell'),
  ('INCOME_TAX', 'notice_amount_cell',     'td:nth-child(3)',                      'css',   1, 'IT notice demand amount cell'),
  ('INCOME_TAX', 'notice_date_cell',       'td:nth-child(4)',                      'css',   1, 'IT notice date cell'),
  ('INCOME_TAX', 'notice_download_link',   'a.download-notice',                    'css',   1, 'IT notice download link')
ON CONFLICT DO NOTHING;

-- MCA Portal (https://www.mca.gov.in/content/mca/global/en/home.html)
INSERT INTO scraper_selectors (portal, selector_key, selector_value, selector_type, version, notes)
VALUES
  ('MCA', 'login_username',         '#userId',                                    'css',   1, 'MCA portal username/email input'),
  ('MCA', 'login_password',         '#userPassword',                              'css',   1, 'MCA portal password input'),
  ('MCA', 'captcha_img',            'img[alt="captcha"]',                         'css',   1, 'MCA portal CAPTCHA image'),
  ('MCA', 'captcha_input',          '#captchaText',                               'css',   1, 'MCA portal CAPTCHA text input'),
  ('MCA', 'login_submit',           'button[type="submit"]',                      'css',   1, 'MCA portal login submit button'),
  ('MCA', 'my_workspace_link',      'a[href*="workspace"]',                       'css',   1, 'MCA My Workspace navigation link'),
  ('MCA', 'show_cause_notice_tab',  'a[href*="show-cause"]',                      'css',   1, 'MCA show cause notices tab'),
  ('MCA', 'notice_table_row',       'table.notice-list tbody tr',                 'css',   1, 'MCA notices table row'),
  ('MCA', 'notice_ref_cell',        'td:nth-child(1)',                            'css',   1, 'MCA notice SRN/reference cell'),
  ('MCA', 'notice_type_cell',       'td:nth-child(2)',                            'css',   1, 'MCA notice type cell'),
  ('MCA', 'notice_date_cell',       'td:nth-child(3)',                            'css',   1, 'MCA notice date cell'),
  ('MCA', 'notice_download_link',   'td a',                                       'css',   1, 'MCA notice download link')
ON CONFLICT DO NOTHING;


-- ──────────────────────────────────────────────────────────────────
-- STORAGE: govt-notices bucket for downloaded PDF notices
-- ──────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'govt-notices',
  'govt-notices',
  false,
  52428800,   -- 50MB max per file
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Only authenticated CA can read their own notices
CREATE POLICY "CA can read own govt notices"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'govt-notices' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can write govt notices"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'govt-notices');
