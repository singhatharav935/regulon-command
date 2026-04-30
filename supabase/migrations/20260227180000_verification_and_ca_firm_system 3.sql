-- Verification layer + CA firm workspace

ALTER TABLE public.user_personas DROP CONSTRAINT IF EXISTS user_personas_persona_check;
ALTER TABLE public.user_personas
  ADD CONSTRAINT user_personas_persona_check
  CHECK (persona IN ('external_ca', 'admin', 'company_owner', 'in_house_ca', 'in_house_lawyer', 'ca_firm'));

CREATE TABLE IF NOT EXISTS public.user_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona TEXT NOT NULL CHECK (persona IN ('external_ca', 'admin', 'company_owner', 'in_house_ca', 'in_house_lawyer', 'ca_firm')),
  entity_name TEXT,
  registration_number TEXT,
  license_number TEXT,
  jurisdiction TEXT,
  document_path TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification"
  ON public.user_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification"
  ON public.user_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verification"
  ON public.user_verifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all verifications"
  ON public.user_verifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_user_verifications_updated_at ON public.user_verifications;
CREATE TRIGGER update_user_verifications_updated_at
  BEFORE UPDATE ON public.user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- CA firm domain tables
CREATE TABLE IF NOT EXISTS public.ca_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  jurisdiction TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ca_firm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_firm_id UUID REFERENCES public.ca_firms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'partner', 'manager', 'analyst')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ca_firm_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.ca_firm_ca_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_firm_id UUID REFERENCES public.ca_firms(id) ON DELETE CASCADE NOT NULL,
  ca_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ca_name TEXT NOT NULL,
  license_number TEXT,
  specialty TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ca_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_firm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_firm_ca_directory ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_ca_firm_member(_user_id UUID, _ca_firm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ca_firm_members
    WHERE user_id = _user_id
      AND ca_firm_id = _ca_firm_id
  )
$$;

CREATE POLICY "Members can view own CA firms"
  ON public.ca_firms FOR SELECT
  USING (public.is_ca_firm_member(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners/admin can manage CA firms"
  ON public.ca_firms FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.ca_firm_members m
      WHERE m.ca_firm_id = id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'partner')
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.ca_firm_members m
      WHERE m.ca_firm_id = id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'partner')
    )
  );

CREATE POLICY "Members can view firm members"
  ON public.ca_firm_members FOR SELECT
  USING (public.is_ca_firm_member(auth.uid(), ca_firm_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners/admin can manage firm members"
  ON public.ca_firm_members FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.ca_firm_members m
      WHERE m.ca_firm_id = ca_firm_members.ca_firm_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'partner')
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.ca_firm_members m
      WHERE m.ca_firm_id = ca_firm_members.ca_firm_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'partner')
    )
  );

CREATE POLICY "Members can view CA directory"
  ON public.ca_firm_ca_directory FOR SELECT
  USING (public.is_ca_firm_member(auth.uid(), ca_firm_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners/admin can manage CA directory"
  ON public.ca_firm_ca_directory FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.ca_firm_members m
      WHERE m.ca_firm_id = ca_firm_ca_directory.ca_firm_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'partner', 'manager')
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.ca_firm_members m
      WHERE m.ca_firm_id = ca_firm_ca_directory.ca_firm_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'partner', 'manager')
    )
  );

DROP TRIGGER IF EXISTS update_ca_firms_updated_at ON public.ca_firms;
CREATE TRIGGER update_ca_firms_updated_at
  BEFORE UPDATE ON public.ca_firms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ca_firm_ca_directory_updated_at ON public.ca_firm_ca_directory;
CREATE TRIGGER update_ca_firm_ca_directory_updated_at
  BEFORE UPDATE ON public.ca_firm_ca_directory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_ca_firm_with_owner(_name TEXT, _registration_number TEXT, _jurisdiction TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_firm_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RAISE EXCEPTION 'CA firm name is required';
  END IF;

  IF _registration_number IS NULL OR length(trim(_registration_number)) < 3 THEN
    RAISE EXCEPTION 'CA firm registration number is required';
  END IF;

  INSERT INTO public.ca_firms (name, registration_number, jurisdiction, created_by)
  VALUES (trim(_name), trim(_registration_number), nullif(trim(_jurisdiction), ''), auth.uid())
  RETURNING id INTO new_firm_id;

  INSERT INTO public.ca_firm_members (ca_firm_id, user_id, role)
  VALUES (new_firm_id, auth.uid(), 'owner')
  ON CONFLICT (ca_firm_id, user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'manager')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_personas (user_id, persona)
  VALUES (auth.uid(), 'ca_firm')
  ON CONFLICT (user_id) DO UPDATE SET persona = 'ca_firm', updated_at = now();

  RETURN new_firm_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_ca_firm_with_owner(TEXT, TEXT, TEXT) TO authenticated;

-- Allow CA firm users to view CA work pool (manager runs) for resource planning.
CREATE POLICY "CA firms can view manager draft runs"
  ON public.draft_runs FOR SELECT
  USING (
    public.has_persona(auth.uid(), 'ca_firm') AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = draft_runs.user_id
        AND ur.role = 'manager'
    )
  );

CREATE POLICY "CA firms can view manager draft events"
  ON public.draft_audit_events FOR SELECT
  USING (
    public.has_persona(auth.uid(), 'ca_firm') AND EXISTS (
      SELECT 1
      FROM public.draft_runs dr
      JOIN public.user_roles ur ON ur.user_id = dr.user_id
      WHERE dr.id = draft_audit_events.draft_run_id
        AND ur.role = 'manager'
    )
  );

-- Storage bucket for verification docs
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own verification docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own verification docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can read all verification docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-documents' AND public.has_role(auth.uid(), 'admin')
  );

-- Refresh signup trigger logic to include CA firm persona.
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
  IF registration_role NOT IN ('external_ca', 'admin', 'company_owner', 'in_house_ca', 'in_house_lawyer', 'ca_firm') THEN
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
  ELSIF registration_role = 'ca_firm' THEN
    mapped_role := 'manager';
    mapped_persona := 'ca_firm';
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

  INSERT INTO public.user_verifications (
    user_id,
    persona,
    entity_name,
    registration_number,
    license_number,
    jurisdiction,
    status,
    is_verified
  )
  VALUES (
    NEW.id,
    mapped_persona,
    nullif(NEW.raw_user_meta_data->>'verification_entity_name', ''),
    nullif(NEW.raw_user_meta_data->>'verification_registration_number', ''),
    nullif(NEW.raw_user_meta_data->>'verification_license_number', ''),
    nullif(NEW.raw_user_meta_data->>'verification_jurisdiction', ''),
    'pending',
    false
  )
  ON CONFLICT (user_id) DO NOTHING;

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
