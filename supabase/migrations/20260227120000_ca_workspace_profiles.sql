-- CA workspace profile split: external CA vs Regulon in-house CA

CREATE TABLE public.ca_workspace_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_type TEXT NOT NULL DEFAULT 'external_ca' CHECK (workspace_type IN ('external_ca', 'regulon_ca')),
  firm_name TEXT,
  has_inhouse_legal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ca_workspace_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CA workspace profile"
  ON public.ca_workspace_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CA workspace profile"
  ON public.ca_workspace_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CA workspace profile"
  ON public.ca_workspace_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage CA workspace profiles"
  ON public.ca_workspace_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ca_workspace_profiles_updated_at
  BEFORE UPDATE ON public.ca_workspace_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
