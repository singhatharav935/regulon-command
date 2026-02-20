-- Draft workflow, audit, and practice memory tables
CREATE TYPE public.draft_status AS ENUM (
  'generated',
  'under_review',
  'approved',
  'signed_off'
);

CREATE TABLE public.draft_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  draft_mode TEXT NOT NULL,
  status public.draft_status NOT NULL DEFAULT 'generated',
  notice_input TEXT,
  draft_content TEXT NOT NULL,
  qa JSONB,
  package JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.draft_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_run_id UUID REFERENCES public.draft_runs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (draft_run_id, version_number)
);

CREATE TABLE public.draft_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_run_id UUID REFERENCES public.draft_runs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.practice_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_mode TEXT,
  preferred_document_type TEXT,
  prefer_pii_masking BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.draft_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own draft runs"
  ON public.draft_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own draft versions"
  ON public.draft_versions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own audit events"
  ON public.draft_audit_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON public.practice_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_draft_runs_updated_at
  BEFORE UPDATE ON public.draft_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_practice_preferences_updated_at
  BEFORE UPDATE ON public.practice_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
