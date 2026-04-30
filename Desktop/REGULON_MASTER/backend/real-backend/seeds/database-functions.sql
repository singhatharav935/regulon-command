-- SANNIDH Database Functions for Performance
-- These functions provide optimized queries for dashboard statistics and reporting

-- Function to get compliance statistics for a user
CREATE OR REPLACE FUNCTION get_compliance_stats(
    p_user_id UUID,
    p_user_role TEXT,
    p_company_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_companies BIGINT,
    compliant_count BIGINT,
    attention_count BIGINT,
    non_compliant_count BIGINT,
    unknown_count BIGINT,
    average_health NUMERIC
) AS $$
BEGIN
    IF p_user_role = 'admin' THEN
        -- Admin can see all companies
        RETURN QUERY
        SELECT 
            COUNT(DISTINCT c.id),
            COUNT(CASE WHEN ce.status = 'compliant' THEN 1 END),
            COUNT(CASE WHEN ce.status = 'attention' THEN 1 END),
            COUNT(CASE WHEN ce.status = 'non_compliant' THEN 1 END),
            COUNT(CASE WHEN ce.status = 'unknown' THEN 1 END),
            ROUND(AVG(c.compliance_health), 2)
        FROM public.companies c
        LEFT JOIN public.compliance_exposures ce ON c.id = ce.company_id
        WHERE (p_company_id IS NULL OR c.id = p_company_id);
        
    ELSIF p_user_role = 'company_owner' THEN
        -- Company owner sees their companies
        RETURN QUERY
        SELECT 
            COUNT(DISTINCT c.id),
            COUNT(CASE WHEN ce.status = 'compliant' THEN 1 END),
            COUNT(CASE WHEN ce.status = 'attention' THEN 1 END),
            COUNT(CASE WHEN ce.status = 'non_compliant' THEN 1 END),
            COUNT(CASE WHEN ce.status = 'unknown' THEN 1 END),
            ROUND(AVG(c.compliance_health), 2)
        FROM public.companies c
        LEFT JOIN public.compliance_exposures ce ON c.id = ce.company_id
        WHERE c.owner_id = p_user_id 
        AND (p_company_id IS NULL OR c.id = p_company_id);
        
    ELSIF p_user_role IN ('external_ca', 'in_house_ca') THEN
        -- CA sees assigned companies
        RETURN QUERY
        SELECT 
            COUNT(DISTINCT c.id),
            COUNT(CASE WHEN ce.status = 'compliant' THEN 1 END),
            COUNT(CASE WHEN ce.status = 'attention' THEN 1 END),
            COUNT(CASE WHEN ce.status = 'non_compliant' THEN 1 END),
            COUNT(CASE WHEN ce.status = 'unknown' THEN 1 END),
            ROUND(AVG(c.compliance_health), 2)
        FROM public.companies c
        LEFT JOIN public.compliance_exposures ce ON c.id = ce.company_id
        WHERE c.assigned_ca_id = p_user_id 
        AND (p_company_id IS NULL OR c.id = p_company_id);
    ELSE
        -- Default empty result
        RETURN QUERY
        SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get task statistics for a user
CREATE OR REPLACE FUNCTION get_task_stats(
    p_user_id UUID,
    p_user_role TEXT,
    p_company_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_tasks BIGINT,
    pending_tasks BIGINT,
    in_progress_tasks BIGINT,
    under_review_tasks BIGINT,
    completed_tasks BIGINT,
    overdue_tasks BIGINT,
    high_priority_tasks BIGINT,
    critical_priority_tasks BIGINT
) AS $$
BEGIN
    IF p_user_role = 'admin' THEN
        RETURN QUERY
        SELECT 
            COUNT(*),
            COUNT(CASE WHEN t.status = 'pending' THEN 1 END),
            COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END),
            COUNT(CASE WHEN t.status = 'under_review' THEN 1 END),
            COUNT(CASE WHEN t.status = 'completed' THEN 1 END),
            COUNT(CASE WHEN t.status = 'overdue' THEN 1 END),
            COUNT(CASE WHEN t.priority = 'high' THEN 1 END),
            COUNT(CASE WHEN t.priority = 'critical' THEN 1 END)
        FROM public.tasks t
        JOIN public.companies c ON t.company_id = c.id
        WHERE (p_company_id IS NULL OR c.id = p_company_id);
        
    ELSIF p_user_role = 'company_owner' THEN
        RETURN QUERY
        SELECT 
            COUNT(*),
            COUNT(CASE WHEN t.status = 'pending' THEN 1 END),
            COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END),
            COUNT(CASE WHEN t.status = 'under_review' THEN 1 END),
            COUNT(CASE WHEN t.status = 'completed' THEN 1 END),
            COUNT(CASE WHEN t.status = 'overdue' THEN 1 END),
            COUNT(CASE WHEN t.priority = 'high' THEN 1 END),
            COUNT(CASE WHEN t.priority = 'critical' THEN 1 END)
        FROM public.tasks t
        JOIN public.companies c ON t.company_id = c.id
        WHERE c.owner_id = p_user_id 
        AND (p_company_id IS NULL OR c.id = p_company_id);
        
    ELSIF p_user_role IN ('external_ca', 'in_house_ca') THEN
        RETURN QUERY
        SELECT 
            COUNT(*),
            COUNT(CASE WHEN t.status = 'pending' THEN 1 END),
            COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END),
            COUNT(CASE WHEN t.status = 'under_review' THEN 1 END),
            COUNT(CASE WHEN t.status = 'completed' THEN 1 END),
            COUNT(CASE WHEN t.status = 'overdue' THEN 1 END),
            COUNT(CASE WHEN t.priority = 'high' THEN 1 END),
            COUNT(CASE WHEN t.priority = 'critical' THEN 1 END)
        FROM public.tasks t
        JOIN public.companies c ON t.company_id = c.id
        WHERE c.assigned_ca_id = p_user_id 
        AND (p_company_id IS NULL OR c.id = p_company_id);
    ELSE
        RETURN QUERY
        SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get document statistics for a user
CREATE OR REPLACE FUNCTION get_document_stats(
    p_user_id UUID,
    p_user_role TEXT,
    p_company_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_documents BIGINT,
    pending_documents BIGINT,
    under_review_documents BIGINT,
    approved_documents BIGINT,
    rejected_documents BIGINT,
    total_file_size BIGINT
) AS $$
BEGIN
    IF p_user_role = 'admin' THEN
        RETURN QUERY
        SELECT 
            COUNT(*),
            COUNT(CASE WHEN d.status = 'pending' THEN 1 END),
            COUNT(CASE WHEN d.status = 'under_review' THEN 1 END),
            COUNT(CASE WHEN d.status = 'approved' THEN 1 END),
            COUNT(CASE WHEN d.status = 'rejected' THEN 1 END),
            COALESCE(SUM(d.file_size), 0)
        FROM public.documents d
        JOIN public.companies c ON d.company_id = c.id
        WHERE (p_company_id IS NULL OR c.id = p_company_id);
        
    ELSIF p_user_role = 'company_owner' THEN
        RETURN QUERY
        SELECT 
            COUNT(*),
            COUNT(CASE WHEN d.status = 'pending' THEN 1 END),
            COUNT(CASE WHEN d.status = 'under_review' THEN 1 END),
            COUNT(CASE WHEN d.status = 'approved' THEN 1 END),
            COUNT(CASE WHEN d.status = 'rejected' THEN 1 END),
            COALESCE(SUM(d.file_size), 0)
        FROM public.documents d
        JOIN public.companies c ON d.company_id = c.id
        WHERE c.owner_id = p_user_id 
        AND (p_company_id IS NULL OR c.id = p_company_id);
        
    ELSIF p_user_role IN ('external_ca', 'in_house_ca') THEN
        RETURN QUERY
        SELECT 
            COUNT(*),
            COUNT(CASE WHEN d.status = 'pending' THEN 1 END),
            COUNT(CASE WHEN d.status = 'under_review' THEN 1 END),
            COUNT(CASE WHEN d.status = 'approved' THEN 1 END),
            COUNT(CASE WHEN d.status = 'rejected' THEN 1 END),
            COALESCE(SUM(d.file_size), 0)
        FROM public.documents d
        JOIN public.companies c ON d.company_id = c.id
        WHERE c.assigned_ca_id = p_user_id 
        AND (p_company_id IS NULL OR c.id = p_company_id);
    ELSE
        RETURN QUERY
        SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired tokens and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired blacklisted tokens
    DELETE FROM public.blacklisted_tokens 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete expired user sessions
    DELETE FROM public.user_sessions 
    WHERE expires_at < NOW();
    
    -- Return count of deleted tokens
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update compliance health based on exposures
CREATE OR REPLACE FUNCTION update_company_compliance_health(company_id_param UUID)
RETURNS VOID AS $$
DECLARE
    health_score INTEGER;
BEGIN
    SELECT ROUND(AVG(
        CASE 
            WHEN ce.status = 'compliant' THEN 100
            WHEN ce.status = 'attention' THEN 60
            WHEN ce.status = 'non_compliant' THEN 20
            ELSE 50
        END
    )) INTO health_score
    FROM public.compliance_exposures ce 
    WHERE ce.company_id = company_id_param;
    
    UPDATE public.companies 
    SET compliance_health = COALESCE(health_score, 0),
        updated_at = NOW()
    WHERE id = company_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for compliance health updates
CREATE OR REPLACE FUNCTION trigger_update_compliance_health()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_company_compliance_health(COALESCE(NEW.company_id, OLD.company_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic compliance health updates
DROP TRIGGER IF EXISTS compliance_exposures_health_trigger ON public.compliance_exposures;
CREATE TRIGGER compliance_exposures_health_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.compliance_exposures
    FOR EACH ROW EXECUTE FUNCTION trigger_update_compliance_health();

-- Function to get upcoming deadlines for dashboard
CREATE OR REPLACE FUNCTION get_upcoming_deadlines(
    p_user_id UUID,
    p_user_role TEXT,
    p_days_ahead INTEGER DEFAULT 30,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    description TEXT,
    regulator VARCHAR,
    due_date TIMESTAMP WITH TIME ZONE,
    company_id UUID,
    company_name VARCHAR,
    days_until_due INTEGER
) AS $$
BEGIN
    IF p_user_role = 'admin' THEN
        RETURN QUERY
        SELECT 
            cd.id, cd.title, cd.description, cd.regulator, cd.due_date,
            c.id, c.name,
            EXTRACT(DAY FROM cd.due_date - NOW())::INTEGER
        FROM public.compliance_deadlines cd
        JOIN public.companies c ON cd.company_id = c.id
        WHERE cd.due_date >= NOW() 
        AND cd.due_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
        ORDER BY cd.due_date ASC
        LIMIT p_limit;
        
    ELSIF p_user_role = 'company_owner' THEN
        RETURN QUERY
        SELECT 
            cd.id, cd.title, cd.description, cd.regulator, cd.due_date,
            c.id, c.name,
            EXTRACT(DAY FROM cd.due_date - NOW())::INTEGER
        FROM public.compliance_deadlines cd
        JOIN public.companies c ON cd.company_id = c.id
        WHERE c.owner_id = p_user_id
        AND cd.due_date >= NOW() 
        AND cd.due_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
        ORDER BY cd.due_date ASC
        LIMIT p_limit;
        
    ELSIF p_user_role IN ('external_ca', 'in_house_ca') THEN
        RETURN QUERY
        SELECT 
            cd.id, cd.title, cd.description, cd.regulator, cd.due_date,
            c.id, c.name,
            EXTRACT(DAY FROM cd.due_date - NOW())::INTEGER
        FROM public.compliance_deadlines cd
        JOIN public.companies c ON cd.company_id = c.id
        WHERE c.assigned_ca_id = p_user_id
        AND cd.due_date >= NOW() 
        AND cd.due_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
        ORDER BY cd.due_date ASC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql;