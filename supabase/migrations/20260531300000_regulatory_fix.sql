-- ╔═══════════════════════════════════════════════════════════════════╗
-- ║  PATCH 3: Fix final 4 errors — regulatory & evaluation tables  ║
-- ║  + FK constraint for evaluation→companies join                 ║
-- ╚═══════════════════════════════════════════════════════════════════╝

-- ─── A: regulatory_news_feed — add all missing columns ───────────
-- Table has: id, title, source, url, summary, regulator, category, published_at, scraped_at, is_breaking, created_at
-- Service expects: authority, authority_code, effective_date, published_date, impact_level, full_text,
--   source_url, affected_sectors, affected_companies, required_actions, penalty_max, penalty_late_fee,
--   related_filings, ai_summary, ai_impact_analysis, version, change_summary, updated_by, updated_at

DO $reg$
DECLARE _sql TEXT;
  _stmts TEXT[] := ARRAY[
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS authority TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS authority_code TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS effective_date DATE',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS published_date DATE',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS impact_level TEXT DEFAULT ''medium''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS full_text TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS source_url TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS affected_sectors TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS affected_companies TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS required_actions TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS penalty_max TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS penalty_late_fee TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS related_filings TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS ai_summary TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS ai_impact_analysis TEXT',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS change_summary TEXT DEFAULT ''Initial publication''',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS updated_by UUID',
    'ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()',
    -- Drop the UNIQUE constraint on url if it blocks inserts
    'ALTER TABLE public.regulatory_news_feed DROP CONSTRAINT IF EXISTS regulatory_news_feed_url_key',

    -- ─── B: regulatory_news_versions — add all missing columns ───
    -- Table has: id, news_id, version, content, diff_summary, created_at
    -- Service expects: title, authority, authority_code, category, effective_date,
    --   published_date, summary, full_text, source_url, impact_level, affected_sectors,
    --   affected_companies, required_actions, penalty_max, penalty_late_fee, related_filings,
    --   ai_summary, ai_impact_analysis, change_summary, created_by
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS title TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS authority TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS authority_code TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS category TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS effective_date DATE',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS published_date DATE',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS summary TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS full_text TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS source_url TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS impact_level TEXT DEFAULT ''medium''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS affected_sectors TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS affected_companies TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS required_actions TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS penalty_max TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS penalty_late_fee TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS related_filings TEXT[] DEFAULT ''{}''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS ai_summary TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS ai_impact_analysis TEXT',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS change_summary TEXT DEFAULT ''''',
    'ALTER TABLE public.regulatory_news_versions ADD COLUMN IF NOT EXISTS created_by UUID',

    -- ─── C: company_regulatory_evaluations — add all missing columns ───
    -- Table has: id, company_id, regulator, evaluation_date, result, score, notes, created_at
    -- Service expects: news_id, matched_version, evaluation_status, matched_reason,
    --   notification_sent, notified_at, evaluated_at, updated_at
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS news_id UUID',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS matched_version INTEGER DEFAULT 1',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT ''pending_review''',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS matched_reason TEXT DEFAULT ''''',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ DEFAULT now()',
    'ALTER TABLE public.company_regulatory_evaluations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()'
  ];
BEGIN
  FOREACH _sql IN ARRAY _stmts LOOP
    BEGIN
      EXECUTE _sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skip (OK): %', SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Regulatory columns patched.';
END $reg$;

-- ─── D: FK constraints for PostgREST joins ──────────────────────
-- company_regulatory_evaluations.company_id → companies.id
-- (needed for .select('*, companies:company_id(name, industry)'))
DO $fk$
BEGIN
  ALTER TABLE public.company_regulatory_evaluations
    ADD CONSTRAINT fk_eval_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK skip: %', SQLERRM;
END $fk$;

-- regulatory_news_versions.news_id → regulatory_news_feed.id
DO $fk2$
BEGIN
  ALTER TABLE public.regulatory_news_versions
    ADD CONSTRAINT fk_version_news
    FOREIGN KEY (news_id) REFERENCES public.regulatory_news_feed(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK skip: %', SQLERRM;
END $fk2$;

-- company_regulatory_evaluations.news_id → regulatory_news_feed.id
DO $fk3$
BEGIN
  ALTER TABLE public.company_regulatory_evaluations
    ADD CONSTRAINT fk_eval_news
    FOREIGN KEY (news_id) REFERENCES public.regulatory_news_feed(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK skip: %', SQLERRM;
END $fk3$;

-- ─── E: Backfill published_date from published_at ───────────────
UPDATE public.regulatory_news_feed
  SET published_date = published_at::date
  WHERE published_date IS NULL AND published_at IS NOT NULL;

-- ─── F: Backfill authority from source/regulator ────────────────
UPDATE public.regulatory_news_feed
  SET authority = COALESCE(source, regulator, 'Unknown'),
      authority_code = UPPER(LEFT(COALESCE(regulator, source, 'GEN'), 4))
  WHERE authority IS NULL;

-- ─── G: Permissions ─────────────────────────────────────────────
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
