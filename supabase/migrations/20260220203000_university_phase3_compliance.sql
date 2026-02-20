-- Phase 3: university compliance engine (filings, tasks, evidence)

CREATE TYPE public.university_compliance_status AS ENUM ('pending', 'in_progress', 'under_review', 'submitted', 'closed', 'overdue');
CREATE TYPE public.university_filing_priority AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TABLE public.university_compliance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  authority TEXT NOT NULL,
  regulation TEXT,
  due_date DATE,
  priority university_filing_priority NOT NULL DEFAULT 'medium',
  status university_compliance_status NOT NULL DEFAULT 'pending',
  owner_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.university_compliance_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  filing_name TEXT NOT NULL,
  authority TEXT NOT NULL,
  period_label TEXT,
  status university_compliance_status NOT NULL DEFAULT 'pending',
  submitted_on DATE,
  reference_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.university_compliance_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  linked_task_id UUID REFERENCES public.university_compliance_tasks(id) ON DELETE SET NULL,
  linked_filing_id UUID REFERENCES public.university_compliance_filings(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  storage_path TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.university_compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_compliance_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_compliance_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view university compliance tasks"
  ON public.university_compliance_tasks FOR SELECT
  USING (public.is_university_member(auth.uid(), university_id));

CREATE POLICY "Managers can manage university compliance tasks"
  ON public.university_compliance_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.university_members m
      WHERE m.user_id = auth.uid()
        AND m.university_id = university_id
        AND m.role IN ('admin', 'registrar')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.university_members m
      WHERE m.user_id = auth.uid()
        AND m.university_id = university_id
        AND m.role IN ('admin', 'registrar')
    )
  );

CREATE POLICY "Members can view university compliance filings"
  ON public.university_compliance_filings FOR SELECT
  USING (public.is_university_member(auth.uid(), university_id));

CREATE POLICY "Managers can manage university compliance filings"
  ON public.university_compliance_filings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.university_members m
      WHERE m.user_id = auth.uid()
        AND m.university_id = university_id
        AND m.role IN ('admin', 'registrar')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.university_members m
      WHERE m.user_id = auth.uid()
        AND m.university_id = university_id
        AND m.role IN ('admin', 'registrar')
    )
  );

CREATE POLICY "Members can view university compliance evidence"
  ON public.university_compliance_evidence FOR SELECT
  USING (public.is_university_member(auth.uid(), university_id));

CREATE POLICY "Managers can manage university compliance evidence"
  ON public.university_compliance_evidence FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.university_members m
      WHERE m.user_id = auth.uid()
        AND m.university_id = university_id
        AND m.role IN ('admin', 'registrar')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.university_members m
      WHERE m.user_id = auth.uid()
        AND m.university_id = university_id
        AND m.role IN ('admin', 'registrar')
    )
  );

CREATE TRIGGER update_university_compliance_tasks_updated_at
  BEFORE UPDATE ON public.university_compliance_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_university_compliance_filings_updated_at
  BEFORE UPDATE ON public.university_compliance_filings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
