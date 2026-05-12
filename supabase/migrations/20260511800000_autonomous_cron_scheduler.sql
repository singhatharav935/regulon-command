-- Enable pg_cron to schedule background tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Create a function to trigger the bot for all eligible clients
CREATE OR REPLACE FUNCTION public.schedule_nightly_scraping()
RETURNS void AS $$
DECLARE
  client RECORD;
  edge_function_url text := 'https://vqomazfvyyfofzdssmaw.supabase.co/functions/v1/gst-scraper-bot';
BEGIN
  -- Loop through all companies that have provided their GST credentials
  FOR client IN 
    SELECT c.id FROM public.companies c 
    JOIN public.client_portal_credentials p ON p.company_id = c.id
    WHERE p.portal_type = 'GSTN'
  LOOP
    -- Autonomously fire the Web Scraper Bot for this specific client
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('action', 'daily_scrape', 'company_id', client.id)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the job if it already exists to prevent duplicates during migrations
SELECT cron.unschedule('nightly-gst-scrape');

-- Add the cron job: Runs at 2:00 AM every single day
SELECT cron.schedule(
    'nightly-gst-scrape',
    '0 2 * * *',
    'SELECT public.schedule_nightly_scraping()'
);
