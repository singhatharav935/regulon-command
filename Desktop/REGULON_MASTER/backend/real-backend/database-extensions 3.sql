-- Database Extensions for Production Launch
-- Additional tables and security enhancements

-- User Personas table (for multi-role registration)
CREATE TABLE IF NOT EXISTS public.user_personas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    persona_role VARCHAR(50) NOT NULL CHECK (persona_role IN ('company_owner', 'external_ca', 'in_house_ca', 'admin', 'in_house_lawyer', 'ca_firm')),
    entity_name VARCHAR(200),
    is_primary BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, persona_role)
);

-- User Verifications table
CREATE TABLE IF NOT EXISTS public.user_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    persona_id UUID REFERENCES public.user_personas(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL,
    verification_data JSONB,
    documents_uploaded TEXT[],
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password Security table
CREATE TABLE IF NOT EXISTS public.password_security (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_password_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_history_hashes TEXT[], -- Store last 5 password hashes
    requires_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Events table (for audit logging)
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Rate Limiting table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP or user ID
    identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('ip', 'user', 'api_key')),
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_duration_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- Performance Metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_unit VARCHAR(20),
    tags JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error Logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    request_data JSONB,
    user_agent TEXT,
    ip_address INET,
    severity VARCHAR(20) DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_personas_user_id ON public.user_personas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personas_role ON public.user_personas(persona_role);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications(status);
CREATE INDEX IF NOT EXISTS idx_password_security_user_id ON public.password_security(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_identifier ON public.api_rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);

-- Add triggers for updated_at
CREATE TRIGGER update_user_personas_updated_at BEFORE UPDATE ON public.user_personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON public.user_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_password_security_updated_at BEFORE UPDATE ON public.password_security
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enhanced Row Level Security Policies

-- User Personas RLS
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personas" ON public.user_personas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personas" ON public.user_personas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personas" ON public.user_personas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all personas" ON public.user_personas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND registration_role = 'admin'
        )
    );

-- User Verifications RLS
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications" ON public.user_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verifications" ON public.user_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all verifications" ON public.user_verifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND registration_role = 'admin'
        )
    );

-- Password Security RLS
ALTER TABLE public.password_security ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own password security" ON public.password_security
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own password security" ON public.password_security
    FOR UPDATE USING (auth.uid() = user_id);

-- Security Events RLS (admin only)
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all security events" ON public.security_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND registration_role = 'admin'
        )
    );

-- Error Logs RLS (admin only)
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all error logs" ON public.error_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND registration_role = 'admin'
        )
    );

-- Performance Metrics RLS (admin only)
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage performance metrics" ON public.performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND registration_role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert sample data for testing
INSERT INTO public.user_personas (user_id, persona_role, entity_name, is_primary, verification_status)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'external_ca', 'Demo CA Firm', true, 'verified'),
    ('00000000-0000-0000-0000-000000000003', 'company_owner', 'Demo Company', true, 'verified')
ON CONFLICT (user_id, persona_role) DO NOTHING;

-- Add password security for sample users
INSERT INTO public.password_security (user_id, password_hash, password_salt)
VALUES 
    ('00000000-0000-0000-0000-000000000001', '$2b$12$sample_hash_admin', 'sample_salt_admin'),
    ('00000000-0000-0000-0000-000000000002', '$2b$12$sample_hash_ca', 'sample_salt_ca'),
    ('00000000-0000-0000-0000-000000000003', '$2b$12$sample_hash_company', 'sample_salt_company')
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE public.user_personas IS 'Allows users to have multiple roles/personas';
COMMENT ON TABLE public.user_verifications IS 'Tracks verification process for each persona';
COMMENT ON TABLE public.password_security IS 'Enhanced password security and policy enforcement';
COMMENT ON TABLE public.security_events IS 'Audit log for security-related events';
COMMENT ON TABLE public.api_rate_limits IS 'Rate limiting tracking for API endpoints';
COMMENT ON TABLE public.performance_metrics IS 'Application performance monitoring data';
COMMENT ON TABLE public.error_logs IS 'Centralized error logging and tracking';