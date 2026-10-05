-- =============================================================================
-- Gap 8: Document Management & OCR for Legacy Docs
--
-- Production-ready tables for document vault, version history,
-- OCR processing jobs, extracted data, tagging, and access audit.
-- =============================================================================


-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1a. document_vault — master document registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  company_id UUID,

  -- Document identity
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_name TEXT NOT NULL,
  file_extension TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,

  -- Storage
  storage_bucket TEXT NOT NULL DEFAULT 'documents',
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,

  -- Classification
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN (
      'general', 'invoice', 'receipt', 'challan', 'notice', 'return',
      'certificate', 'agreement', 'boa_resolution', 'kyc', 'pan_card',
      'aadhaar', 'gst_certificate', 'incorporation', 'audit_report',
      'balance_sheet', 'profit_loss', 'bank_statement', 'tds_certificate',
      'form_16', 'itr', 'annual_return', 'moa_aoa', 'other'
    )),
  sub_category TEXT,
  compliance_domain TEXT
    CHECK (compliance_domain IS NULL OR compliance_domain IN (
      'gst', 'income_tax', 'mca', 'rbi', 'sebi', 'customs', 'labour', 'other'
    )),

  -- Financial context
  financial_year TEXT,            -- e.g. '2025-26'
  assessment_year TEXT,           -- e.g. 'AY 2026-27'
  period_from DATE,
  period_to DATE,
  amount NUMERIC(15,2),

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'processing', 'deleted')),
  is_ocr_processed BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,

  -- Tags (stored as array for fast filtering)
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  source TEXT DEFAULT 'upload'
    CHECK (source IN ('upload', 'scan', 'email', 'portal_download', 'erp_sync', 'api')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_version INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 1b. document_versions — immutable version history per document
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.document_vault(id) ON DELETE CASCADE,

  version_number INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,

  change_summary TEXT,
  changed_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (document_id, version_number)
);

-- ---------------------------------------------------------------------------
-- 1c. ocr_jobs — OCR processing job tracker
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ocr_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.document_vault(id) ON DELETE CASCADE,
  ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Engine config
  ocr_engine TEXT NOT NULL DEFAULT 'google_vision'
    CHECK (ocr_engine IN ('google_vision', 'aws_textract', 'azure_form', 'tesseract', 'regulon_ai')),
  language_hints TEXT[] DEFAULT '{eng,hin}',
  processing_options JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Status
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Results summary
  pages_processed INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  confidence_score NUMERIC(5,4),    -- 0.0000 to 1.0000
  word_count INTEGER DEFAULT 0,

  -- Error handling
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 1d. ocr_results — extracted text and structured data from OCR
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocr_job_id UUID NOT NULL REFERENCES public.ocr_jobs(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.document_vault(id) ON DELETE CASCADE,

  -- Page-level extraction
  page_number INTEGER NOT NULL DEFAULT 1,

  -- Raw extracted text
  raw_text TEXT,
  raw_text_confidence NUMERIC(5,4),

  -- Structured data extraction (key-value pairs found)
  extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: {"invoice_number": "INV-2026-001", "date": "2026-05-29", "total": "15000.00", "gstin": "27AABCU9603R1ZM"}

  -- Table extraction
  extracted_tables JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{"headers": ["Item", "Qty", "Rate", "Amount"], "rows": [["Widget A", "10", "500", "5000"]]}]

  -- Entity recognition
  detected_entities JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: {"pan": ["AABCU9603R"], "gstin": ["27AABCU9603R1ZM"], "dates": ["2026-05-29"], "amounts": ["15000.00"]}

  -- Bounding boxes for detected regions (for UI overlay)
  bounding_boxes JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 1e. document_access_logs — audit trail for document access
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.document_vault(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  action TEXT NOT NULL
    CHECK (action IN ('view', 'download', 'print', 'share', 'edit', 'delete', 'ocr_trigger', 'verify', 'archive')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- 2. INDEXES
-- =============================================================================

-- document_vault
CREATE INDEX IF NOT EXISTS idx_doc_vault_ca_user
  ON public.document_vault(ca_user_id);

CREATE INDEX IF NOT EXISTS idx_doc_vault_category
  ON public.document_vault(category);

CREATE INDEX IF NOT EXISTS idx_doc_vault_domain
  ON public.document_vault(compliance_domain);

CREATE INDEX IF NOT EXISTS idx_doc_vault_status
  ON public.document_vault(status);

CREATE INDEX IF NOT EXISTS idx_doc_vault_company
  ON public.document_vault(company_id);

CREATE INDEX IF NOT EXISTS idx_doc_vault_entity
  ON public.document_vault(entity_id);

CREATE INDEX IF NOT EXISTS idx_doc_vault_tags
  ON public.document_vault USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_doc_vault_fy
  ON public.document_vault(financial_year);

CREATE INDEX IF NOT EXISTS idx_doc_vault_created
  ON public.document_vault(created_at DESC);

-- document_versions
CREATE INDEX IF NOT EXISTS idx_doc_versions_doc
  ON public.document_versions(document_id);

-- ocr_jobs
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_document
  ON public.ocr_jobs(document_id);

CREATE INDEX IF NOT EXISTS idx_ocr_jobs_ca_user
  ON public.ocr_jobs(ca_user_id);

CREATE INDEX IF NOT EXISTS idx_ocr_jobs_status
  ON public.ocr_jobs(status);

-- ocr_results
CREATE INDEX IF NOT EXISTS idx_ocr_results_job
  ON public.ocr_results(ocr_job_id);

CREATE INDEX IF NOT EXISTS idx_ocr_results_document
  ON public.ocr_results(document_id);

-- document_access_logs
CREATE INDEX IF NOT EXISTS idx_doc_access_document
  ON public.document_access_logs(document_id);

CREATE INDEX IF NOT EXISTS idx_doc_access_user
  ON public.document_access_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_doc_access_created
  ON public.document_access_logs(created_at DESC);


-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.document_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;

-- 3a. document_vault
CREATE POLICY "Users can view own documents"
  ON public.document_vault FOR SELECT TO authenticated
  USING (ca_user_id = auth.uid());

CREATE POLICY "Users can create own documents"
  ON public.document_vault FOR INSERT TO authenticated
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON public.document_vault FOR UPDATE TO authenticated
  USING (ca_user_id = auth.uid())
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON public.document_vault FOR DELETE TO authenticated
  USING (ca_user_id = auth.uid());

-- 3b. document_versions (scoped through parent document)
CREATE POLICY "Users can view own document versions"
  ON public.document_versions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_vault d
    WHERE d.id = document_versions.document_id AND d.ca_user_id = auth.uid()
  ));

CREATE POLICY "Users can create own document versions"
  ON public.document_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.document_vault d
    WHERE d.id = document_versions.document_id AND d.ca_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own document versions"
  ON public.document_versions FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_vault d
    WHERE d.id = document_versions.document_id AND d.ca_user_id = auth.uid()
  ));

-- 3c. ocr_jobs
CREATE POLICY "Users can view own OCR jobs"
  ON public.ocr_jobs FOR SELECT TO authenticated
  USING (ca_user_id = auth.uid());

CREATE POLICY "Users can create own OCR jobs"
  ON public.ocr_jobs FOR INSERT TO authenticated
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can update own OCR jobs"
  ON public.ocr_jobs FOR UPDATE TO authenticated
  USING (ca_user_id = auth.uid())
  WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Users can delete own OCR jobs"
  ON public.ocr_jobs FOR DELETE TO authenticated
  USING (ca_user_id = auth.uid());

-- 3d. ocr_results (scoped through parent job)
CREATE POLICY "Users can view own OCR results"
  ON public.ocr_results FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ocr_jobs j
    WHERE j.id = ocr_results.ocr_job_id AND j.ca_user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own OCR results"
  ON public.ocr_results FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ocr_jobs j
    WHERE j.id = ocr_results.ocr_job_id AND j.ca_user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own OCR results"
  ON public.ocr_results FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ocr_jobs j
    WHERE j.id = ocr_results.ocr_job_id AND j.ca_user_id = auth.uid()
  ));

-- 3e. document_access_logs
CREATE POLICY "Users can view own document access logs"
  ON public.document_access_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own document access logs"
  ON public.document_access_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());


-- =============================================================================
-- 4. VIEWS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 4a. document_vault_dashboard — overview with OCR status and version count
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.document_vault_dashboard AS
SELECT
  d.id AS document_id,
  d.ca_user_id,
  d.title,
  d.file_name,
  d.file_extension,
  d.mime_type,
  d.file_size_bytes,
  d.category,
  d.sub_category,
  d.compliance_domain,
  d.financial_year,
  d.status,
  d.is_ocr_processed,
  d.is_verified,
  d.tags,
  d.source,
  d.current_version,
  d.created_at,
  d.updated_at,
  COALESCE(vc.version_count, 0) AS total_versions,
  COALESCE(oc.ocr_job_count, 0) AS ocr_job_count,
  oc.last_ocr_status,
  oc.last_ocr_confidence,
  COALESCE(ac.access_count, 0) AS total_accesses
FROM public.document_vault d
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS version_count
  FROM public.document_versions v
  WHERE v.document_id = d.id
) vc ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::INTEGER AS ocr_job_count,
    (SELECT j2.status FROM public.ocr_jobs j2
     WHERE j2.document_id = d.id ORDER BY j2.created_at DESC LIMIT 1) AS last_ocr_status,
    (SELECT j3.confidence_score FROM public.ocr_jobs j3
     WHERE j3.document_id = d.id AND j3.status = 'completed'
     ORDER BY j3.created_at DESC LIMIT 1) AS last_ocr_confidence
  FROM public.ocr_jobs oj
  WHERE oj.document_id = d.id
) oc ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS access_count
  FROM public.document_access_logs al
  WHERE al.document_id = d.id
) ac ON true;

-- ---------------------------------------------------------------------------
-- 4b. ocr_job_dashboard — OCR jobs with document context
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.ocr_job_dashboard AS
SELECT
  j.id AS job_id,
  j.document_id,
  j.ca_user_id,
  d.title AS document_title,
  d.file_name,
  d.category,
  j.ocr_engine,
  j.status,
  j.progress_pct,
  j.pages_processed,
  j.total_pages,
  j.confidence_score,
  j.word_count,
  j.started_at,
  j.completed_at,
  j.duration_ms,
  j.error_message,
  j.retry_count,
  j.created_at,
  COALESCE(rc.result_count, 0) AS total_result_pages
FROM public.ocr_jobs j
JOIN public.document_vault d ON d.id = j.document_id
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS result_count
  FROM public.ocr_results r
  WHERE r.ocr_job_id = j.id
) rc ON true;


-- =============================================================================
-- 5. TRIGGER FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 5a. Auto-snapshot version when document is updated
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_document_auto_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only version on actual file changes (storage_path changed)
  IF OLD.storage_path IS DISTINCT FROM NEW.storage_path THEN
    NEW.current_version := OLD.current_version + 1;

    INSERT INTO public.document_versions (
      document_id, version_number, file_name, file_size_bytes,
      storage_path, mime_type, change_summary, changed_by
    ) VALUES (
      NEW.id, NEW.current_version, NEW.file_name, NEW.file_size_bytes,
      NEW.storage_path, NEW.mime_type, 'File updated', NEW.ca_user_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5b. Update document OCR status when OCR job completes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_ocr_job_update_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'processing' THEN
    UPDATE public.document_vault
    SET status = 'processing', updated_at = now()
    WHERE id = NEW.document_id;

  ELSIF NEW.status = 'completed' THEN
    UPDATE public.document_vault
    SET is_ocr_processed = true,
        status = 'active',
        updated_at = now()
    WHERE id = NEW.document_id;

  ELSIF NEW.status = 'failed' THEN
    UPDATE public.document_vault
    SET status = 'active',
        updated_at = now()
    WHERE id = NEW.document_id;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5c. Auto-calculate OCR job duration
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_ocr_job_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed', 'cancelled')
     AND NEW.started_at IS NOT NULL
     AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;

  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER * 1000;
  END IF;

  RETURN NEW;
END;
$$;


-- =============================================================================
-- 6. TRIGGERS
-- =============================================================================

-- updated_at
DROP TRIGGER IF EXISTS trg_doc_vault_updated_at ON public.document_vault;
CREATE TRIGGER trg_doc_vault_updated_at
  BEFORE UPDATE ON public.document_vault
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-version on file change
DROP TRIGGER IF EXISTS trg_document_auto_version ON public.document_vault;
CREATE TRIGGER trg_document_auto_version
  BEFORE UPDATE OF storage_path ON public.document_vault
  FOR EACH ROW
  WHEN (OLD.storage_path IS DISTINCT FROM NEW.storage_path)
  EXECUTE FUNCTION public.fn_document_auto_version();

-- OCR job → document status
DROP TRIGGER IF EXISTS trg_ocr_job_update_document ON public.ocr_jobs;
CREATE TRIGGER trg_ocr_job_update_document
  AFTER INSERT OR UPDATE OF status ON public.ocr_jobs
  FOR EACH ROW
  WHEN (NEW.status IN ('processing', 'completed', 'failed'))
  EXECUTE FUNCTION public.fn_ocr_job_update_document();

-- OCR job auto-duration
DROP TRIGGER IF EXISTS trg_ocr_job_duration ON public.ocr_jobs;
CREATE TRIGGER trg_ocr_job_duration
  BEFORE UPDATE OF status ON public.ocr_jobs
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed', 'cancelled'))
  EXECUTE FUNCTION public.fn_ocr_job_duration();
