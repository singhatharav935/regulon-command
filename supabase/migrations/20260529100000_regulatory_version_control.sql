-- ============================================================
-- Version-Control & Change-Log of Regulatory Text — Gap 5
-- Migration: 20260529100000
-- Purpose: Audit trails, version history, change diffing, and
--          automatic client company re-evaluation.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Upgrade regulatory_news_feed
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS change_summary TEXT DEFAULT 'Initial release';
ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.regulatory_news_feed ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ────────────────────────────────────────────────────────────
-- 2. History table: regulatory_news_versions
-- Stores immutable historical snapshots of each regulatory update
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.regulatory_news_versions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id             UUID NOT NULL REFERENCES public.regulatory_news_feed(id) ON DELETE CASCADE,
  version             INTEGER NOT NULL,
  
  title               TEXT NOT NULL,
  authority           TEXT NOT NULL,
  authority_code      TEXT NOT NULL,
  category            TEXT NOT NULL,
  
  effective_date      DATE NOT NULL,
  published_date      DATE NOT NULL,
  
  summary             TEXT NOT NULL,
  full_text           TEXT,
  source_url          TEXT,
  
  impact_level        TEXT NOT NULL,
  affected_sectors    TEXT[] DEFAULT '{}',
  affected_companies  TEXT[] DEFAULT '{}',
  required_actions    TEXT[] DEFAULT '{}',
  
  penalty_max         TEXT,
  penalty_late_fee    TEXT,
  related_filings     TEXT[] DEFAULT '{}',
  
  ai_summary          TEXT,
  ai_impact_analysis  TEXT,
  
  change_summary      TEXT NOT NULL,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(news_id, version)
);

CREATE INDEX IF NOT EXISTS idx_rnv_news     ON public.regulatory_news_versions (news_id);
CREATE INDEX IF NOT EXISTS idx_rnv_version  ON public.regulatory_news_versions (version);

ALTER TABLE public.regulatory_news_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rnv_select ON public.regulatory_news_versions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY rnv_insert ON public.regulatory_news_versions FOR INSERT WITH CHECK (TRUE); -- populated via DB trigger

-- ────────────────────────────────────────────────────────────
-- 3. Evaluation table: company_regulatory_evaluations
-- Matches regulatory rules to client companies and tracks compliance
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_regulatory_evaluations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id             UUID NOT NULL REFERENCES public.regulatory_news_feed(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  matched_version     INTEGER NOT NULL,
  evaluation_status   TEXT NOT NULL DEFAULT 'pending_review'
                        CHECK (evaluation_status IN ('pending_review', 'compliant', 'action_required', 'non_compliant')),
  matched_reason      TEXT NOT NULL,
  
  notification_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  notified_at         TIMESTAMPTZ,
  notes               TEXT,
  
  evaluated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(news_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_cre_news     ON public.company_regulatory_evaluations (news_id);
CREATE INDEX IF NOT EXISTS idx_cre_company  ON public.company_regulatory_evaluations (company_id);
CREATE INDEX IF NOT EXISTS idx_cre_status   ON public.company_regulatory_evaluations (evaluation_status);

ALTER TABLE public.company_regulatory_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY cre_all ON public.company_regulatory_evaluations FOR ALL USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- 4. Trigger: Version snapshoting
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.snapshot_regulatory_news_version()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Insert the historical version record
  INSERT INTO public.regulatory_news_versions (
    news_id, version, title, authority, authority_code, category,
    effective_date, published_date, summary, full_text, source_url,
    impact_level, affected_sectors, affected_companies, required_actions,
    penalty_max, penalty_late_fee, related_filings, ai_summary,
    ai_impact_analysis, change_summary, created_by, created_at
  ) VALUES (
    NEW.id, NEW.version, NEW.title, NEW.authority, NEW.authority_code, NEW.category,
    NEW.effective_date, NEW.published_date, NEW.summary, NEW.full_text, NEW.source_url,
    NEW.impact_level, NEW.affected_sectors, NEW.affected_companies, NEW.required_actions,
    NEW.penalty_max, NEW.penalty_late_fee, NEW.related_filings, NEW.ai_summary,
    NEW.ai_impact_analysis, NEW.change_summary, NEW.updated_by, now()
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_regulatory_news_snapshot ON public.regulatory_news_feed;
CREATE TRIGGER trg_regulatory_news_snapshot
  AFTER INSERT OR UPDATE OF version ON public.regulatory_news_feed
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_regulatory_news_version();

-- ────────────────────────────────────────────────────────────
-- 5. Trigger: Automatically Re-evaluate affected companies
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reevaluate_affected_companies()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  comp RECORD;
  match_res TEXT;
BEGIN
  -- Find all client companies whose industry matches any of the affected sectors
  FOR comp IN 
    SELECT c.id, c.name, c.industry 
    FROM public.companies c
  LOOP
    match_res := NULL;
    
    -- Check sector match (case-insensitive)
    IF NEW.affected_sectors IS NOT NULL AND array_length(NEW.affected_sectors, 1) > 0 THEN
      IF EXISTS (
        SELECT 1 
        FROM unnest(NEW.affected_sectors) s 
        WHERE lower(trim(s)) = lower(trim(comp.industry))
      ) THEN
        match_res := 'Company industry "' || comp.industry || '" matches affected sector list';
      END IF;
    END IF;
    
    -- Check company specific keyword match
    IF match_res IS NULL AND NEW.affected_companies IS NOT NULL AND array_length(NEW.affected_companies, 1) > 0 THEN
      IF EXISTS (
        SELECT 1 
        FROM unnest(NEW.affected_companies) ctype
        WHERE lower(comp.name) LIKE '%' || lower(trim(ctype)) || '%'
      ) THEN
        match_res := 'Company matches keyword in affected companies list';
      END IF;
    END IF;
    
    -- If there's a match, upsert into Evaluations table
    IF match_res IS NOT NULL THEN
      INSERT INTO public.company_regulatory_evaluations (
        news_id, company_id, matched_version, evaluation_status, matched_reason, evaluated_at, updated_at
      ) VALUES (
        NEW.id, comp.id, NEW.version, 'pending_review', match_res, now(), now()
      )
      ON CONFLICT (news_id, company_id) DO UPDATE SET
        matched_version = NEW.version,
        evaluation_status = 'pending_review', -- reset to pending review on rule update!
        matched_reason = match_res,
        updated_at = now();
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_regulatory_news_reevaluation ON public.regulatory_news_feed;
CREATE TRIGGER trg_regulatory_news_reevaluation
  AFTER INSERT OR UPDATE OF version ON public.regulatory_news_feed
  FOR EACH ROW
  EXECUTE FUNCTION public.reevaluate_affected_companies();

-- ────────────────────────────────────────────────────────────
-- 6. Helper: Bump version trigger
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_bump_regulatory_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Bump version counter when critical text fields are updated
  IF (OLD.title IS DISTINCT FROM NEW.title OR
      OLD.summary IS DISTINCT FROM NEW.summary OR
      OLD.full_text IS DISTINCT FROM NEW.full_text OR
      OLD.impact_level IS DISTINCT FROM NEW.impact_level OR
      OLD.affected_sectors IS DISTINCT FROM NEW.affected_sectors OR
      OLD.penalty_max IS DISTINCT FROM NEW.penalty_max) THEN
      
      NEW.version := OLD.version + 1;
      NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_regulatory_news_autobump ON public.regulatory_news_feed;
CREATE TRIGGER trg_regulatory_news_autobump
  BEFORE UPDATE ON public.regulatory_news_feed
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_bump_regulatory_version();
