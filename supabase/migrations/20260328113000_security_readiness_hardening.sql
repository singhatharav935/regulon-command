-- Security readiness hardening:
-- 1) verification upload bucket constraints
-- 2) storage object policies for strict ownership + extension checks
-- 3) RLS/RBAC snapshot function for runtime readiness audits

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false,
  5242880,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can upload own verification docs" ON storage.objects;
CREATE POLICY "Users can upload own verification docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('pdf', 'png', 'jpg', 'jpeg')
  );

DROP POLICY IF EXISTS "Users can update own verification docs" ON storage.objects;
CREATE POLICY "Users can update own verification docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('pdf', 'png', 'jpg', 'jpeg')
  );

DROP POLICY IF EXISTS "Users can delete own verification docs" ON storage.objects;
CREATE POLICY "Users can delete own verification docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins can delete all verification docs" ON storage.objects;
CREATE POLICY "Admins can delete all verification docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE FUNCTION public.security_readiness_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  targets JSONB := '[
    {"schema":"public","table":"profiles"},
    {"schema":"public","table":"user_roles"},
    {"schema":"public","table":"user_personas"},
    {"schema":"public","table":"user_verifications"},
    {"schema":"public","table":"companies"},
    {"schema":"public","table":"company_members"},
    {"schema":"public","table":"documents"},
    {"schema":"public","table":"draft_runs"},
    {"schema":"public","table":"draft_versions"},
    {"schema":"public","table":"draft_audit_events"},
    {"schema":"public","table":"ca_firms"},
    {"schema":"public","table":"ca_firm_members"},
    {"schema":"public","table":"ca_firm_ca_directory"},
    {"schema":"storage","table":"objects"},
    {"schema":"storage","table":"buckets"}
  ]'::jsonb;
  item JSONB;
  schema_name TEXT;
  table_name TEXT;
  rel_oid REGCLASS;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
  rows JSONB := '[]'::jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(targets)
  LOOP
    schema_name := item->>'schema';
    table_name := item->>'table';
    rel_oid := to_regclass(format('%I.%I', schema_name, table_name));

    IF rel_oid IS NULL THEN
      rows := rows || jsonb_build_object(
        'schema', schema_name,
        'table', table_name,
        'exists', false,
        'rls_enabled', false,
        'policy_count', 0
      );
      CONTINUE;
    END IF;

    SELECT c.relrowsecurity
      INTO rls_enabled
    FROM pg_class c
    WHERE c.oid = rel_oid;

    SELECT COUNT(*)
      INTO policy_count
    FROM pg_policies p
    WHERE p.schemaname = schema_name
      AND p.tablename = table_name;

    rows := rows || jsonb_build_object(
      'schema', schema_name,
      'table', table_name,
      'exists', true,
      'rls_enabled', coalesce(rls_enabled, false),
      'policy_count', coalesce(policy_count, 0)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'generated_at', now(),
    'tables', rows,
    'summary', jsonb_build_object(
      'total', jsonb_array_length(rows),
      'missing', (
        SELECT COUNT(*)
        FROM jsonb_array_elements(rows) AS x
        WHERE (x->>'exists')::boolean = false
      ),
      'rls_disabled', (
        SELECT COUNT(*)
        FROM jsonb_array_elements(rows) AS x
        WHERE (x->>'exists')::boolean = true
          AND (x->>'rls_enabled')::boolean = false
      ),
      'without_policies', (
        SELECT COUNT(*)
        FROM jsonb_array_elements(rows) AS x
        WHERE (x->>'exists')::boolean = true
          AND coalesce((x->>'policy_count')::integer, 0) = 0
      )
    )
  );
END;
$$;
