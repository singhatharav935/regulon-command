-- ─────────────────────────────────────────────────────────────────────────────
-- CRON JOB: Run regulatory-news-scraper every day at 00:30 UTC (6:00 AM IST)
-- This keeps the regulatory_news_feed table populated with fresh data from
-- all Indian government portals automatically.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pg_cron extension (must be enabled in Supabase dashboard under Extensions)
-- The cron job calls the Edge Function via pg_net HTTP request.

SELECT cron.schedule(
  'regulatory-news-daily-scrape',
  '30 0 * * *', -- Every day at 00:30 UTC = 06:00 AM IST
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/regulatory-news-scraper',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
