-- Add CA Verification and Statutory Inputs
ALTER TABLE public.client_bank_transactions 
ADD COLUMN IF NOT EXISTS ca_verified boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.client_statutory_inputs (
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  financial_year text NOT NULL,
  applicable_gst_rate numeric DEFAULT 18,
  verified_itc_gstr2b numeric DEFAULT 0,
  sec_80c_deductions numeric DEFAULT 0,
  sec_80d_deductions numeric DEFAULT 0,
  advance_tax_paid numeric DEFAULT 0,
  tds_receivable numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (company_id, financial_year)
);

ALTER TABLE public.client_statutory_inputs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ca_owns_inputs" ON public.client_statutory_inputs;
CREATE POLICY "ca_owns_inputs" ON public.client_statutory_inputs FOR ALL USING (true);
