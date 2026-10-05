-- Create secure table for client portal credentials
CREATE TABLE IF NOT EXISTS public.client_portal_credentials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    portal_type text NOT NULL, -- e.g., 'GSTN', 'INCOME_TAX', 'MCA'
    username text NOT NULL,
    encrypted_password text NOT NULL,
    last_verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, portal_type)
);

-- Enable RLS
ALTER TABLE public.client_portal_credentials ENABLE ROW LEVEL SECURITY;

-- CA can read their clients' credentials (for the bot to use)
CREATE POLICY "CAs can access their client credentials"
    ON public.client_portal_credentials FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.companies
            WHERE companies.id = client_portal_credentials.company_id
            AND companies.ca_user_id = auth.uid()
        )
    );
