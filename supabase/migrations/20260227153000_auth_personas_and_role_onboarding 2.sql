CREATE TABLE IF NOT EXISTS public.user_personas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona TEXT NOT NULL CHECK (persona IN ('external_ca', 'admin', 'company_owner', 'in_house_ca', 'in_house_lawyer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own persona"
  ON public.user_personas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own persona"
  ON public.user_personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own persona"
  ON public.user_personas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage personas"
  ON public.user_personas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_user_personas_updated_at ON public.user_personas;
CREATE TRIGGER update_user_personas_updated_at
  BEFORE UPDATE ON public.user_personas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  registration_role TEXT := lower(coalesce(NEW.raw_user_meta_data->>'registration_role', 'company_owner'));
  mapped_role app_role := 'user';
  mapped_persona TEXT := 'company_owner';
  mapped_workspace TEXT := NULL;
BEGIN
  IF registration_role NOT IN ('external_ca', 'admin', 'company_owner', 'in_house_ca', 'in_house_lawyer') THEN
    registration_role := 'company_owner';
  END IF;

  IF registration_role = 'admin' THEN
    mapped_role := 'admin';
    mapped_persona := 'admin';
  ELSIF registration_role = 'external_ca' THEN
    mapped_role := 'manager';
    mapped_persona := 'external_ca';
    mapped_workspace := 'external_ca';
  ELSIF registration_role = 'in_house_ca' THEN
    mapped_role := 'manager';
    mapped_persona := 'in_house_ca';
    mapped_workspace := 'regulon_ca';
  ELSIF registration_role = 'in_house_lawyer' THEN
    mapped_role := 'manager';
    mapped_persona := 'in_house_lawyer';
  ELSE
    mapped_role := 'user';
    mapped_persona := 'company_owner';
  END IF;

  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, mapped_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_personas (user_id, persona)
  VALUES (NEW.id, mapped_persona)
  ON CONFLICT (user_id) DO UPDATE SET
    persona = EXCLUDED.persona,
    updated_at = now();

  IF mapped_workspace IS NOT NULL THEN
    INSERT INTO public.ca_workspace_profiles (user_id, workspace_type)
    VALUES (NEW.id, mapped_workspace)
    ON CONFLICT (user_id) DO UPDATE SET
      workspace_type = EXCLUDED.workspace_type,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

INSERT INTO public.user_personas (user_id, persona)
SELECT
  u.id,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'admin'
    ) THEN 'admin'
    WHEN EXISTS (
      SELECT 1 FROM public.ca_workspace_profiles cwp
      WHERE cwp.user_id = u.id AND cwp.workspace_type = 'regulon_ca'
    ) THEN 'in_house_ca'
    WHEN EXISTS (
      SELECT 1 FROM public.ca_workspace_profiles cwp
      WHERE cwp.user_id = u.id AND cwp.workspace_type = 'external_ca'
    ) THEN 'external_ca'
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'manager'
    ) THEN 'external_ca'
    ELSE 'company_owner'
  END
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;
