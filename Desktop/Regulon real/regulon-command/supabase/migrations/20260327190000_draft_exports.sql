-- Filing-ready export registry for draft outputs (PDF/DOCX)

CREATE TYPE public.draft_export_format AS ENUM ('pdf', 'docx');
CREATE TYPE public.draft_export_status AS ENUM ('generated', 'failed');

CREATE TABLE public.draft_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_run_id UUID REFERENCES public.draft_runs(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  format public.draft_export_format NOT NULL,
  status public.draft_export_status NOT NULL DEFAULT 'generated',
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_draft_exports_draft_run_id ON public.draft_exports(draft_run_id, created_at DESC);
CREATE INDEX idx_draft_exports_requested_by ON public.draft_exports(requested_by, created_at DESC);

ALTER TABLE public.draft_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible draft exports"
  ON public.draft_exports FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR requested_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.draft_runs dr
      WHERE dr.id = draft_exports.draft_run_id
        AND (
          dr.user_id = auth.uid()
          OR (dr.company_id IS NOT NULL AND public.is_company_member(auth.uid(), dr.company_id))
          OR public.has_persona(auth.uid(), 'in_house_lawyer')
          OR (
            public.has_persona(auth.uid(), 'ca_firm')
            AND EXISTS (
              SELECT 1 FROM public.user_roles ur
              WHERE ur.user_id = dr.user_id
                AND ur.role = 'manager'
            )
          )
        )
    )
  );

CREATE POLICY "Managers can create draft exports"
  ON public.draft_exports FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'manager')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Admins can update draft exports"
  ON public.draft_exports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('draft-exports', 'draft-exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own draft export files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'draft-exports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Users can upload own draft export files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'draft-exports'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
