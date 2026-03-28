-- Strengthen company onboarding: create company + owner membership + baseline dashboard dataset.

CREATE OR REPLACE FUNCTION public.create_company_with_owner(_name TEXT, _industry TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
  owner_user_id UUID;
BEGIN
  owner_user_id := auth.uid();
  IF owner_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RAISE EXCEPTION 'Company name is required';
  END IF;

  INSERT INTO public.companies (name, industry)
  VALUES (trim(_name), nullif(trim(_industry), ''))
  RETURNING id INTO new_company_id;

  INSERT INTO public.company_members (user_id, company_id, role)
  VALUES (owner_user_id, new_company_id, 'admin')
  ON CONFLICT (user_id, company_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (owner_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.regulatory_exposure (company_id, regulator, status, notes)
  VALUES
    (new_company_id, 'MCA', 'potential', 'MCA statutory calendar initialized.'),
    (new_company_id, 'GST', 'potential', 'GST monthly return watchlist initialized.'),
    (new_company_id, 'Income Tax', 'potential', 'Income tax assessment workflow initialized.'),
    (new_company_id, 'RBI', 'not_applicable', 'RBI applicability placeholder set.'),
    (new_company_id, 'SEBI', 'not_applicable', 'SEBI applicability placeholder set.')
  ON CONFLICT (company_id, regulator) DO NOTHING;

  INSERT INTO public.deadlines (company_id, title, regulator, due_date, is_recurring)
  VALUES
    (new_company_id, 'Monthly GST Return Filing', 'GST', current_date + interval '7 day', true),
    (new_company_id, 'TDS Compliance Review', 'Income Tax', current_date + interval '12 day', true),
    (new_company_id, 'MCA ROC Form Preparedness', 'MCA', current_date + interval '18 day', true),
    (new_company_id, 'Quarterly Regulatory Exposure Review', 'MCA', current_date + interval '25 day', true);

  INSERT INTO public.compliance_tasks (company_id, title, description, regulator, priority, status, due_date, assigned_to)
  VALUES
    (
      new_company_id,
      'Compile GST supporting invoices and reconciliations',
      'Prepare monthly invoice reconciliation pack for GST filing.',
      'GST',
      'high',
      'pending',
      current_date + interval '6 day',
      owner_user_id
    ),
    (
      new_company_id,
      'Prepare Income Tax advance tax working note',
      'Review payable projections and supporting assumptions.',
      'Income Tax',
      'critical',
      'in_progress',
      current_date + interval '10 day',
      owner_user_id
    ),
    (
      new_company_id,
      'Validate board and statutory records for MCA cycle',
      'Cross-check director registers and statutory filings.',
      'MCA',
      'medium',
      'pending',
      current_date + interval '14 day',
      owner_user_id
    ),
    (
      new_company_id,
      'Review contract compliance exceptions',
      'Check key customer/vendor contracts for compliance triggers.',
      'Contract',
      'medium',
      'under_review',
      current_date + interval '16 day',
      owner_user_id
    );

  INSERT INTO public.documents (company_id, name, file_type, status, regulator, uploaded_by)
  VALUES
    (new_company_id, 'GST Reconciliation Pack', 'xlsx', 'draft', 'GST', owner_user_id),
    (new_company_id, 'Income Tax Working Papers', 'pdf', 'under_review', 'Income Tax', owner_user_id),
    (new_company_id, 'MCA Board Records Summary', 'docx', 'submitted', 'MCA', owner_user_id),
    (new_company_id, 'Contract Compliance Tracker', 'xlsx', 'draft', 'Contract', owner_user_id);

  RETURN new_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_company_with_owner(TEXT, TEXT) TO authenticated;
