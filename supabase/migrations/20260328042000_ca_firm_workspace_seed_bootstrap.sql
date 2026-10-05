-- Strengthen CA firm onboarding by seeding the owner's CA directory entry.

CREATE OR REPLACE FUNCTION public.create_ca_firm_with_owner(_name TEXT, _registration_number TEXT, _jurisdiction TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ca_firm_id UUID;
  owner_user_id UUID;
  owner_name TEXT;
  owner_email TEXT;
  owner_license_number TEXT;
BEGIN
  owner_user_id := auth.uid();
  IF owner_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RAISE EXCEPTION 'Firm name is required';
  END IF;

  IF _registration_number IS NULL OR length(trim(_registration_number)) < 2 THEN
    RAISE EXCEPTION 'Firm registration number is required';
  END IF;

  INSERT INTO public.ca_firms (name, registration_number, jurisdiction, created_by)
  VALUES (trim(_name), trim(_registration_number), nullif(trim(_jurisdiction), ''), owner_user_id)
  RETURNING id INTO new_ca_firm_id;

  INSERT INTO public.ca_firm_members (ca_firm_id, user_id, role)
  VALUES (new_ca_firm_id, owner_user_id, 'owner')
  ON CONFLICT (ca_firm_id, user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (owner_user_id, 'manager')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_personas (user_id, persona)
  VALUES (owner_user_id, 'ca_firm')
  ON CONFLICT (user_id) DO UPDATE SET
    persona = EXCLUDED.persona,
    updated_at = now();

  SELECT p.full_name, p.email
  INTO owner_name, owner_email
  FROM public.profiles p
  WHERE p.user_id = owner_user_id
  LIMIT 1;

  SELECT uv.license_number
  INTO owner_license_number
  FROM public.user_verifications uv
  WHERE uv.user_id = owner_user_id
  LIMIT 1;

  INSERT INTO public.ca_firm_ca_directory (
    ca_firm_id,
    ca_user_id,
    ca_name,
    license_number,
    specialty,
    status
  )
  VALUES (
    new_ca_firm_id,
    owner_user_id,
    COALESCE(NULLIF(trim(owner_name), ''), split_part(COALESCE(owner_email, ''), '@', 1), 'Firm Owner'),
    nullif(trim(COALESCE(owner_license_number, '')), ''),
    'Regulatory Advisory',
    'active'
  );

  RETURN new_ca_firm_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_ca_firm_with_owner(TEXT, TEXT, TEXT) TO authenticated;
