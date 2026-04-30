-- Allow self-serve company onboarding and admin observability

CREATE OR REPLACE FUNCTION public.create_company_with_owner(_name TEXT, _industry TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RAISE EXCEPTION 'Company name is required';
  END IF;

  INSERT INTO public.companies (name, industry)
  VALUES (trim(_name), nullif(trim(_industry), ''))
  RETURNING id INTO new_company_id;

  INSERT INTO public.company_members (user_id, company_id, role)
  VALUES (auth.uid(), new_company_id, 'admin')
  ON CONFLICT (user_id, company_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_company_with_owner(TEXT, TEXT) TO authenticated;

-- Platform admin read visibility across tenant data.
CREATE POLICY "Platform admins can view all companies"
  ON public.companies FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can view all company members"
  ON public.company_members FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can view all tasks"
  ON public.compliance_tasks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can view all documents"
  ON public.documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can view all deadlines"
  ON public.deadlines FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can view all exposure"
  ON public.regulatory_exposure FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can view all draft runs"
  ON public.draft_runs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can view all draft events"
  ON public.draft_audit_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.has_persona(_user_id UUID, _persona TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_personas
    WHERE user_id = _user_id
      AND persona = _persona
  )
$$;

CREATE POLICY "In-house lawyers can view all draft runs"
  ON public.draft_runs FOR SELECT
  USING (public.has_persona(auth.uid(), 'in_house_lawyer'));

CREATE POLICY "In-house lawyers can view all draft events"
  ON public.draft_audit_events FOR SELECT
  USING (public.has_persona(auth.uid(), 'in_house_lawyer'));
