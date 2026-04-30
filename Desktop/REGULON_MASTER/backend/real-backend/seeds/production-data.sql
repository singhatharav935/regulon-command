-- SANNIDH Production Sample Data
-- This file contains realistic sample data for production testing

-- Create realistic sample users
INSERT INTO public.users (id, email, full_name, registration_role, verification_entity_name, email_verified, profile_completed) VALUES 
-- System Admin
('11111111-1111-1111-1111-111111111111', 'admin@sannidh.com', 'Sarah Mitchell', 'admin', 'SANNIDH System', true, true),
-- External CAs
('22222222-2222-2222-2222-222222222222', 'rajesh.sharma@compliancetech.com', 'Rajesh Sharma', 'external_ca', 'ComplianceTech Partners', true, true),
('22222222-2222-2222-2222-222222222223', 'priya.patel@legaladvisors.in', 'Priya Patel', 'external_ca', 'Legal Advisors India', true, true),
('22222222-2222-2222-2222-222222222224', 'amit.gupta@auditpro.co.in', 'Amit Gupta', 'external_ca', 'AuditPro Solutions', true, true),
-- Company Owners
('33333333-3333-3333-3333-333333333333', 'ceo@techcorp.com', 'Ankit Verma', 'company_owner', null, true, true),
('33333333-3333-3333-3333-333333333334', 'director@greentech.in', 'Meera Krishnan', 'company_owner', null, true, true),
('33333333-3333-3333-3333-333333333335', 'owner@financeplus.co.in', 'Vikram Singh', 'company_owner', null, true, true),
('33333333-3333-3333-3333-333333333336', 'cfo@manufacturing.in', 'Sunita Rao', 'company_owner', null, true, true),
-- In-house CAs and Lawyers
('44444444-4444-4444-4444-444444444444', 'compliance@techcorp.com', 'Neha Agarwal', 'in_house_ca', 'TechCorp Industries', true, true),
('44444444-4444-4444-4444-444444444445', 'legal@greentech.in', 'Rohit Mehta', 'in_house_lawyer', 'GreenTech Solutions', true, true),
('44444444-4444-4444-4444-444444444446', 'ca@financeplus.co.in', 'Kavya Nair', 'in_house_ca', 'FinancePlus Ltd', true, true)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    registration_role = EXCLUDED.registration_role,
    verification_entity_name = EXCLUDED.verification_entity_name,
    updated_at = NOW();

-- Create realistic sample companies
INSERT INTO public.companies (id, owner_id, assigned_ca_id, name, industry, description, address, phone, website, compliance_health) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 
 'TechCorp Industries Pvt Ltd', 'Information Technology', 
 'Leading software development and IT services company specializing in enterprise solutions', 
 '3rd Floor, Tech Park, Cyber City, Gurgaon, Haryana - 122002', '+91-124-456-7890', 'https://techcorp.com', 85),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222223', 
 'GreenTech Solutions Ltd', 'Renewable Energy', 
 'Innovative renewable energy solutions and sustainable technology development', 
 'Green Building, Eco Park, Pune, Maharashtra - 411057', '+91-20-345-6789', 'https://greentech.in', 72),

('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333335', '22222222-2222-2222-2222-222222222224', 
 'FinancePlus Ltd', 'Financial Services', 
 'Comprehensive financial services including investment advisory and wealth management', 
 'Tower A, Financial District, Mumbai, Maharashtra - 400051', '+91-22-987-6543', 'https://financeplus.co.in', 91),

('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333336', '22222222-2222-2222-2222-222222222222', 
 'Precision Manufacturing Co', 'Manufacturing', 
 'High-precision manufacturing and industrial automation solutions', 
 'Industrial Area Phase-II, Chandigarh - 160002', '+91-172-234-5678', 'https://manufacturing.in', 68);