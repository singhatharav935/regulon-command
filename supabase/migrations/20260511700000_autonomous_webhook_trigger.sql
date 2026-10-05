-- Enable the pg_net extension to allow PostgreSQL to make HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.trigger_autonomous_drafting()
RETURNS trigger AS $$
DECLARE
  edge_function_url text;
  request_body jsonb;
BEGIN
  -- URL for the ai-drafting-engine in your specific Supabase project
  edge_function_url := 'https://vqomazfvyyfofzdssmaw.supabase.co/functions/v1/ai-drafting-engine';
  
  -- Build the JSON payload to send to the AI Brain
  -- This exactly matches the payload the frontend used to send manually
  request_body := json_build_object(
    'action', 'generate_draft',
    'notice_id', NEW.id,
    'company_id', NEW.company_id,
    'ca_user_id', NEW.ca_user_id,
    'financial_year', NEW.financial_year
  );

  -- Make an asynchronous HTTP POST request directly from the database to the Edge Function
  -- This ensures zero human involvement. The moment the row is inserted, the AI wakes up.
  PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := request_body
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to allow clean migrations
DROP TRIGGER IF EXISTS autonomous_draft_webhook ON public.client_govt_notices;

-- Create the Database Trigger
-- It only fires on INSERT when a notice is 'detected' (which is the exact state the Scraper Bot uses when it drops the PDF)
CREATE TRIGGER autonomous_draft_webhook
AFTER INSERT ON public.client_govt_notices
FOR EACH ROW
WHEN (NEW.status = 'detected')
EXECUTE FUNCTION public.trigger_autonomous_drafting();
