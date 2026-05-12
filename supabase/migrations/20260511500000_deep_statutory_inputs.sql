-- Add comprehensive statutory fields to calculate the 22 modules
ALTER TABLE public.client_statutory_inputs 
ADD COLUMN IF NOT EXISTS outward_invoices_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_receivables numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS receivables_over_90_days numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS gross_block numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS accumulated_depreciation numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_employees integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pan_verified_employees integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS gratuity_provision numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS agm_date date,
ADD COLUMN IF NOT EXISTS board_meetings_held integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS resolutions_passed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS iec_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fcgpr_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tally_sync_status text DEFAULT 'Not Connected';
