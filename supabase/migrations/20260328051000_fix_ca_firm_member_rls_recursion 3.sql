-- Fix recursive RLS on ca_firm_members by moving ownership checks into SECURITY DEFINER helpers.

CREATE OR REPLACE FUNCTION public.is_ca_firm_owner_or_partner(_user_id UUID, _ca_firm_id UUID)
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
      AND role IN ('owner', 'partner')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_ca_firm_directory(_user_id UUID, _ca_firm_id UUID)
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
      AND role IN ('owner', 'partner', 'manager')
  )
$$;

DROP POLICY IF EXISTS "Owners/admin can manage CA firms" ON public.ca_firms;
CREATE POLICY "Owners/admin can manage CA firms"
  ON public.ca_firms FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_ca_firm_owner_or_partner(auth.uid(), id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.is_ca_firm_owner_or_partner(auth.uid(), id)
  );

DROP POLICY IF EXISTS "Members can view firm members" ON public.ca_firm_members;
CREATE POLICY "Members can view firm members"
  ON public.ca_firm_members FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_ca_firm_member(auth.uid(), ca_firm_id)
  );

DROP POLICY IF EXISTS "Owners/admin can manage firm members" ON public.ca_firm_members;
CREATE POLICY "Owners/admin can manage firm members"
  ON public.ca_firm_members FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_ca_firm_owner_or_partner(auth.uid(), ca_firm_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.is_ca_firm_owner_or_partner(auth.uid(), ca_firm_id)
  );

DROP POLICY IF EXISTS "Owners/admin can manage CA directory" ON public.ca_firm_ca_directory;
CREATE POLICY "Owners/admin can manage CA directory"
  ON public.ca_firm_ca_directory FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.can_manage_ca_firm_directory(auth.uid(), ca_firm_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.can_manage_ca_firm_directory(auth.uid(), ca_firm_id)
  );
