-- CA Dashboard Production Database Schema
-- No mock data - only structure for real user data

-- Users and CA Firms
CREATE TABLE IF NOT EXISTS ca_firms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_name VARCHAR(255) NOT NULL,
    ca_name VARCHAR(255) NOT NULL,
    ca_number VARCHAR(50) UNIQUE NOT NULL,
    icai_membership_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CA Dashboard Users (Associates/Staff)
CREATE TABLE IF NOT EXISTS ca_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_firm_id UUID REFERENCES ca_firms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'associate', -- 'ca_admin', 'senior_associate', 'associate', 'junior'
    permissions JSON DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Companies
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_firm_id UUID REFERENCES ca_firms(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    gstin VARCHAR(15),
    cin VARCHAR(21),
    pan VARCHAR(10),
    tan VARCHAR(10),
    industry_type VARCHAR(100),
    business_type VARCHAR(50), -- 'private_limited', 'llp', 'partnership', 'proprietorship'
    annual_turnover DECIMAL(15,2),
    employee_count INTEGER,
    registered_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(15),
    onboarding_date DATE,
    health_score INTEGER DEFAULT 100,
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Filing Requirements and Deadlines
CREATE TABLE IF NOT EXISTS filing_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    filing_type VARCHAR(100) NOT NULL, -- 'GST_RETURN', 'ITR', 'TDS_RETURN', 'ROC_FILING'
    frequency VARCHAR(20), -- 'monthly', 'quarterly', 'annual'
    due_date DATE NOT NULL,
    penalty_per_day DECIMAL(10,2) DEFAULT 0,
    is_mandatory BOOLEAN DEFAULT true,
    compliance_score_impact INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actual Filings and Status
CREATE TABLE IF NOT EXISTS filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    filing_requirement_id UUID REFERENCES filing_requirements(id),
    assigned_to UUID REFERENCES ca_users(id),
    filing_type VARCHAR(100) NOT NULL,
    period_month INTEGER,
    period_year INTEGER,
    due_date DATE NOT NULL,
    filed_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'filed', 'delayed', 'penalty_paid'
    acknowledgment_number VARCHAR(50),
    penalty_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    documents_required JSON DEFAULT '[]',
    documents_received JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task Management for CA Operations
CREATE TABLE IF NOT EXISTS ca_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_firm_id UUID REFERENCES ca_firms(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    assigned_to UUID REFERENCES ca_users(id),
    created_by UUID REFERENCES ca_users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50), -- 'filing', 'audit', 'consultation', 'documentation'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled'
    due_date DATE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    billable_amount DECIMAL(10,2),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Dependency Tracking
CREATE TABLE IF NOT EXISTS client_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    filing_id UUID REFERENCES filings(id),
    dependency_type VARCHAR(50), -- 'document', 'information', 'approval', 'payment'
    description TEXT NOT NULL,
    requested_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'received', 'overdue'
    urgency_level VARCHAR(20) DEFAULT 'normal', -- 'normal', 'urgent', 'critical'
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Health History
CREATE TABLE IF NOT EXISTS compliance_health_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    health_score INTEGER NOT NULL,
    previous_score INTEGER,
    change_reason VARCHAR(255),
    factors JSON DEFAULT '{}', -- detailed breakdown of score factors
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Tracking and Revenue
CREATE TABLE IF NOT EXISTS ca_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_firm_id UUID REFERENCES ca_firms(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    invoice_number VARCHAR(50),
    payment_type VARCHAR(50), -- 'retainer', 'filing_fee', 'consultation', 'penalty_handling'
    amount DECIMAL(12,2) NOT NULL,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30), -- 'razorpay', 'bank_transfer', 'cash', 'cheque'
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    due_date DATE,
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Government API Integration Logs
CREATE TABLE IF NOT EXISTS api_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    api_type VARCHAR(50), -- 'GSTN', 'MCA', 'INCOME_TAX', 'TDS'
    endpoint_url VARCHAR(255),
    request_data JSON,
    response_data JSON,
    status_code INTEGER,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Drafting History
CREATE TABLE IF NOT EXISTS ai_drafting_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID REFERENCES ca_users(id),
    client_id UUID REFERENCES clients(id),
    document_type VARCHAR(100), -- 'gst_notice_reply', 'audit_response', 'legal_opinion'
    input_document TEXT,
    generated_response TEXT,
    ai_model_used VARCHAR(50),
    tokens_used INTEGER,
    cost_incurred DECIMAL(8,4),
    user_feedback INTEGER, -- 1-5 rating
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences and Logs
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(20), -- 'ca_user', 'client'
    recipient_id UUID, -- ca_user_id or client contact
    notification_type VARCHAR(50), -- 'filing_due', 'document_pending', 'payment_due'
    title VARCHAR(255),
    message TEXT,
    channel VARCHAR(20), -- 'email', 'whatsapp', 'sms', 'in_app'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'read'
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit and Inspection Support
CREATE TABLE IF NOT EXISTS audit_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    audit_type VARCHAR(50), -- 'gst_audit', 'income_tax_scrutiny', 'roc_inspection'
    initiated_by VARCHAR(100), -- department name
    notice_date DATE,
    response_due_date DATE,
    status VARCHAR(30) DEFAULT 'notice_received', -- 'notice_received', 'response_prepared', 'submitted', 'closed'
    assigned_ca UUID REFERENCES ca_users(id),
    documents_required JSON DEFAULT '[]',
    responses_submitted JSON DEFAULT '[]',
    outcome VARCHAR(50),
    penalty_imposed DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CA Performance Analytics
CREATE TABLE IF NOT EXISTS ca_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_firm_id UUID REFERENCES ca_firms(id) ON DELETE CASCADE,
    metric_type VARCHAR(50), -- 'filing_efficiency', 'client_satisfaction', 'revenue_growth'
    metric_value DECIMAL(10,2),
    period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'quarterly'
    period_date DATE,
    additional_data JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_clients_ca_firm ON clients(ca_firm_id);
CREATE INDEX IF NOT EXISTS idx_filings_client ON filings(client_id);
CREATE INDEX IF NOT EXISTS idx_filings_due_date ON filings(due_date);
CREATE INDEX IF NOT EXISTS idx_filings_status ON filings(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON ca_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON ca_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_dependencies_client ON client_dependencies(client_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_status ON client_dependencies(status);
CREATE INDEX IF NOT EXISTS idx_payments_ca_firm ON ca_payments(ca_firm_id);
CREATE INDEX IF NOT EXISTS idx_health_log_client ON compliance_health_log(client_id);