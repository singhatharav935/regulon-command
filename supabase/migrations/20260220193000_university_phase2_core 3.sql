-- Phase 2 core data model for university operations

CREATE TYPE public.university_admission_status AS ENUM ('submitted', 'under_review', 'accepted', 'rejected');
CREATE TYPE public.university_person_status AS ENUM ('active', 'inactive', 'on_leave');
CREATE TYPE public.university_invoice_status AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'overdue');

CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  state TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.university_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'registrar', 'finance', 'faculty', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, university_id)
);

CREATE TABLE public.university_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  roll_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  program TEXT NOT NULL,
  semester INTEGER,
  status university_person_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (university_id, roll_number)
);

CREATE TABLE public.university_faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  employee_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  designation TEXT,
  email TEXT,
  status university_person_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (university_id, employee_code)
);

CREATE TABLE public.university_admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  application_number TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT,
  program_applied TEXT NOT NULL,
  status university_admission_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (university_id, application_number)
);

CREATE TABLE public.university_fee_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.university_students(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  due_date DATE NOT NULL,
  status university_invoice_status NOT NULL DEFAULT 'issued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (university_id, invoice_number)
);

CREATE TABLE public.university_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.university_fee_invoices(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  paid_on DATE NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_fee_payments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_university_member(_user_id UUID, _university_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.university_members
    WHERE user_id = _user_id
      AND university_id = _university_id
  )
$$;

CREATE POLICY "Members can view universities"
  ON public.universities FOR SELECT
  USING (public.is_university_member(auth.uid(), id));

CREATE POLICY "Members can view university members"
  ON public.university_members FOR SELECT
  USING (public.is_university_member(auth.uid(), university_id));

CREATE POLICY "Members can view students"
  ON public.university_students FOR SELECT
  USING (public.is_university_member(auth.uid(), university_id));

CREATE POLICY "Managers can manage students"
  ON public.university_students FOR ALL
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

CREATE POLICY "Members can view faculty"
  ON public.university_faculty FOR SELECT
  USING (public.is_university_member(auth.uid(), university_id));

CREATE POLICY "Managers can manage faculty"
  ON public.university_faculty FOR ALL
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

CREATE POLICY "Members can view admissions"
  ON public.university_admissions FOR SELECT
  USING (public.is_university_member(auth.uid(), university_id));

CREATE POLICY "Managers can manage admissions"
  ON public.university_admissions FOR ALL
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

CREATE POLICY "Members can view fee invoices"
  ON public.university_fee_invoices FOR SELECT
  USING (public.is_university_member(auth.uid(), university_id));

CREATE POLICY "Finance can manage fee invoices"
  ON public.university_fee_invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.university_members m
      WHERE m.user_id = auth.uid()
        AND m.university_id = university_id
        AND m.role IN ('admin', 'finance', 'registrar')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.university_members m
      WHERE m.user_id = auth.uid()
        AND m.university_id = university_id
        AND m.role IN ('admin', 'finance', 'registrar')
    )
  );

CREATE POLICY "Members can view fee payments"
  ON public.university_fee_payments FOR SELECT
  USING (public.is_university_member(auth.uid(), university_id));

CREATE POLICY "Finance can manage fee payments"
  ON public.university_fee_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.university_members m
      WHERE m.user_id = auth.uid()
        AND m.university_id = university_id
        AND m.role IN ('admin', 'finance', 'registrar')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.university_members m
      WHERE m.user_id = auth.uid()
        AND m.university_id = university_id
        AND m.role IN ('admin', 'finance', 'registrar')
    )
  );

CREATE TRIGGER update_universities_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_university_students_updated_at
  BEFORE UPDATE ON public.university_students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_university_faculty_updated_at
  BEFORE UPDATE ON public.university_faculty
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_university_admissions_updated_at
  BEFORE UPDATE ON public.university_admissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_university_fee_invoices_updated_at
  BEFORE UPDATE ON public.university_fee_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
