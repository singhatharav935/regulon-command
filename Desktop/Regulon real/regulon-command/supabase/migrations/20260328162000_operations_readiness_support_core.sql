-- Operations readiness backend:
-- support tickets, ticket messages, client assignment requests, and ops activity logs.

CREATE TABLE IF NOT EXISTS public.ops_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  ca_firm_id UUID REFERENCES public.ca_firms(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL,
  assigned_to UUID,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'billing', 'kyc', 'technical', 'workflow', 'dispute', 'security')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  subject TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (company_id IS NOT NULL AND ca_firm_id IS NULL)
    OR (company_id IS NULL AND ca_firm_id IS NOT NULL)
    OR (company_id IS NULL AND ca_firm_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.ops_support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.ops_support_tickets(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ops_client_assignment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  requested_ca_user_id UUID,
  requested_ca_firm_id UUID REFERENCES public.ca_firms(id) ON DELETE SET NULL,
  assignment_type TEXT NOT NULL
    CHECK (assignment_type IN ('external_ca', 'in_house_ca', 'in_house_lawyer', 'ca_firm')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  justification TEXT,
  admin_notes TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ops_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ca_firm_id UUID REFERENCES public.ca_firms(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (company_id IS NOT NULL AND ca_firm_id IS NULL)
    OR (company_id IS NULL AND ca_firm_id IS NOT NULL)
    OR (company_id IS NULL AND ca_firm_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_ops_support_tickets_scope_status_created
  ON public.ops_support_tickets(company_id, ca_firm_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_support_tickets_assigned_status
  ON public.ops_support_tickets(assigned_to, status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_support_messages_ticket_created
  ON public.ops_support_ticket_messages(ticket_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_assignment_requests_company_status
  ON public.ops_client_assignment_requests(company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_activity_logs_scope_created
  ON public.ops_activity_logs(company_id, ca_firm_id, created_at DESC);

ALTER TABLE public.ops_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_client_assignment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible support tickets"
  ON public.ops_support_tickets FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR raised_by = auth.uid()
    OR assigned_to = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

CREATE POLICY "Users can create accessible support tickets"
  ON public.ops_support_tickets FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR raised_by = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

CREATE POLICY "Users can update accessible support tickets"
  ON public.ops_support_tickets FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR raised_by = auth.uid()
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR raised_by = auth.uid()
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Users can view accessible support messages"
  ON public.ops_support_ticket_messages FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.ops_support_tickets t
      WHERE t.id = ops_support_ticket_messages.ticket_id
        AND (
          t.raised_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR (t.company_id IS NOT NULL AND public.is_company_member(auth.uid(), t.company_id))
          OR (t.ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), t.ca_firm_id))
        )
    )
  );

CREATE POLICY "Users can create accessible support messages"
  ON public.ops_support_ticket_messages FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can view accessible assignment requests"
  ON public.ops_client_assignment_requests FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR requested_by = auth.uid()
    OR public.is_company_member(auth.uid(), company_id)
  );

CREATE POLICY "Users can create accessible assignment requests"
  ON public.ops_client_assignment_requests FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND public.is_company_member(auth.uid(), company_id)
  );

CREATE POLICY "Admins can update assignment requests"
  ON public.ops_client_assignment_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view accessible ops activity logs"
  ON public.ops_activity_logs FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR actor_user_id = auth.uid()
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
    OR (ca_firm_id IS NOT NULL AND public.is_ca_firm_member(auth.uid(), ca_firm_id))
  );

CREATE POLICY "Users can insert own ops activity logs"
  ON public.ops_activity_logs FOR INSERT
  WITH CHECK (
    actor_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER update_ops_support_tickets_updated_at
  BEFORE UPDATE ON public.ops_support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ops_client_assignment_requests_updated_at
  BEFORE UPDATE ON public.ops_client_assignment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
