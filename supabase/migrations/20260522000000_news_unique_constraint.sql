-- ─────────────────────────────────────────────────────────────────────────────
-- Add unique constraint on (title, authority_code) to prevent duplicate news
-- entries when the regulatory-news-scraper Edge Function runs daily.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.regulatory_news_feed
  ADD CONSTRAINT IF NOT EXISTS regulatory_news_unique_title_authority
  UNIQUE (title, authority_code);
