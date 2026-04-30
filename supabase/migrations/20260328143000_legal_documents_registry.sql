-- Legal document registry + acceptance tracking (production compliance controls)

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key TEXT NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'IN',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  summary TEXT,
  content_markdown TEXT NOT NULL,
  requires_acceptance BOOLEAN NOT NULL DEFAULT true,
  effective_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_by UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doc_key, version)
);

CREATE TABLE IF NOT EXISTS public.legal_document_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  doc_key TEXT NOT NULL,
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'app',
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, doc_key, version)
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_key_status_effective
  ON public.legal_documents(doc_key, status, effective_at DESC, published_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_documents_status_updated
  ON public.legal_documents(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_document_acceptances_user_doc
  ON public.legal_document_acceptances(user_id, doc_key, accepted_at DESC);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_document_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published legal documents"
  ON public.legal_documents FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage legal documents"
  ON public.legal_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own legal document acceptances"
  ON public.legal_document_acceptances FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own legal document acceptances"
  ON public.legal_document_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own legal document acceptances"
  ON public.legal_document_acceptances FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_document_acceptances_updated_at
  BEFORE UPDATE ON public.legal_document_acceptances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.legal_documents (
  doc_key, version, title, jurisdiction, status, summary, content_markdown, requires_acceptance, effective_at, published_at, metadata
)
VALUES
  (
    'privacy_policy',
    '2026-03-28',
    'Privacy Policy',
    'IN',
    'published',
    'Privacy practices, processing purposes, retention windows, and data subject rights under Indian law.',
    '# Privacy Policy

Last Updated: 2026-03-28

This policy explains what personal data we collect, why we process it, legal basis, retention periods, and user rights.

## Data Collected
- Account identity information
- Compliance workflow data
- Audit and security logs

## Purpose of Processing
- Provide compliance and drafting services
- Secure platform operations
- Meet statutory and regulatory obligations

## Retention
- Operational records: retained per legal/compliance obligations
- Deletion requests: processed through governed workflow with audit trail

## User Rights
- Access/export
- Rectification
- Restriction/objection where applicable
- Deletion request (subject to legal holds)

## Contact
Official grievance and privacy contact details must be maintained by admin/legal team before market launch.',
    true,
    now(),
    now(),
    '{"requires_legal_signoff":true}'::jsonb
  ),
  (
    'terms_of_service',
    '2026-03-28',
    'Terms of Service',
    'IN',
    'published',
    'Service terms, acceptable use, responsibilities, liability boundaries, and dispute jurisdiction.',
    '# Terms of Service

Last Updated: 2026-03-28

These terms govern access and use of the SANNIDH platform.

## Service Scope
- AI-assisted compliance drafting with human-in-the-loop controls
- Workflow, review, and audit tooling

## Customer Responsibilities
- Provide accurate data
- Use qualified professionals for final filings where mandated
- Follow applicable law and regulator instructions

## Liability and Jurisdiction
- Final legal text must be validated by authorized professionals as required.
- Jurisdiction, dispute, and liability clauses must be finalized by legal counsel before production launch.',
    true,
    now(),
    now(),
    '{"requires_legal_signoff":true}'::jsonb
  ),
  (
    'refund_policy',
    '2026-03-28',
    'Refund Policy',
    'IN',
    'published',
    'Subscription and service refund handling, eligibility windows, and billing dispute process.',
    '# Refund Policy

Last Updated: 2026-03-28

This policy defines eligibility, timelines, and process for refund requests.

## Billing Model
- Subscription and metered usage charges as per plan terms.

## Refund Eligibility
- Platform/service exceptions and SLA-based credits.
- Refund decision follows documented support workflow and audit history.

## Processing Timeline
- Standard resolution target: 7-14 business days after validation.

## Exclusions
- Completed professional services and third-party pass-through fees, unless legally required.',
    true,
    now(),
    now(),
    '{"requires_legal_signoff":true}'::jsonb
  ),
  (
    'dpa_terms',
    '2026-03-28',
    'Data Processing Addendum (Template)',
    'IN',
    'published',
    'Controller-processor terms, security obligations, subprocessors, and breach notification baseline.',
    '# Data Processing Addendum (Template)

Last Updated: 2026-03-28

This template establishes baseline controller/processor responsibilities for enterprise customers.

## Scope
- Processing instructions and purpose limitations
- Security controls and confidentiality obligations
- Subprocessor governance and notice obligations
- Incident and breach notification process

Legal counsel must approve customer-specific DPA execution text.',
    false,
    now(),
    now(),
    '{"requires_legal_signoff":true}'::jsonb
  ),
  (
    'data_retention_policy',
    '2026-03-28',
    'Data Retention & Deletion Policy',
    'IN',
    'published',
    'Record retention categories, legal holds, and deletion workflow controls.',
    '# Data Retention & Deletion Policy

Last Updated: 2026-03-28

This policy defines retention periods and deletion controls across platform datasets.

## Baseline Retention
- Security/audit logs: retained to satisfy compliance and incident response requirements.
- Draft/workflow records: retained for traceability and legal defensibility.

## Deletion Workflow
- Requests are tracked as compliance data requests with SLA and approvals.
- Legal/regulatory hold prevents destructive deletion until released.

## Evidence
- Every deletion decision is logged in immutable audit records.',
    false,
    now(),
    now(),
    '{"requires_legal_signoff":true}'::jsonb
  )
ON CONFLICT (doc_key, version) DO NOTHING;
