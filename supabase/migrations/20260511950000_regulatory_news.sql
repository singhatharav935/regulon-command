-- ─────────────────────────────────────────────────────────────────────────────
-- REGULATORY NEWS FEED
-- Stores live scraped updates from government portals (GSTN, MCA, RBI, etc.)
-- Populated by the regulatory-news Edge Function cron job.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.regulatory_news_feed (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title               text          NOT NULL,
  authority           text          NOT NULL, -- e.g., 'Ministry of Corporate Affairs'
  authority_code      text          NOT NULL, -- e.g., 'MCA', 'GST', 'RBI'
  category            text          NOT NULL, -- e.g., 'law_amendment', 'circular'
  
  effective_date      date          NOT NULL,
  published_date      date          NOT NULL,
  
  summary             text          NOT NULL,
  full_text           text,
  source_url          text,
  
  impact_level        text          NOT NULL CHECK (impact_level IN ('critical', 'high', 'medium', 'low')),
  affected_sectors    text[]        DEFAULT '{}',
  affected_companies  text[]        DEFAULT '{}',
  required_actions    text[]        DEFAULT '{}',
  
  penalty_max         text,
  penalty_late_fee    text,
  related_filings     text[]        DEFAULT '{}',
  
  ai_summary          text,
  ai_impact_analysis  text,
  
  created_at          timestamptz   NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.regulatory_news_feed ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated CA users to read the news feed
DROP POLICY IF EXISTS "ca_can_read_news" ON public.regulatory_news_feed;
CREATE POLICY "ca_can_read_news" 
  ON public.regulatory_news_feed FOR SELECT 
  USING (auth.role() = 'authenticated');
