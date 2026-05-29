-- Migration: RBAC & Team Management
-- Created: 2026-05-29
-- Description: Complete role-based access control and team workspace management for CAs.

-- 1. Create rbac_teams table
CREATE TABLE IF NOT EXISTS rbac_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create rbac_roles table
CREATE TABLE IF NOT EXISTS rbac_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ca_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    role_code TEXT NOT NULL CHECK (role_code IN ('partner', 'manager', 'senior_ca', 'articled_clerk', 'data_entry', 'viewer', 'custom')),
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(ca_user_id, role_name),
    UNIQUE(ca_user_id, role_code)
);

-- 3. Create rbac_team_members table
CREATE TABLE IF NOT EXISTS rbac_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES rbac_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role_id UUID REFERENCES rbac_roles(id) ON DELETE RESTRICT,
    role_name TEXT NOT NULL CHECK (role_name IN ('Partner', 'Manager', 'Senior CA', 'Articled Clerk', 'Data Entry', 'Viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(team_id, email)
);

-- 4. Create rbac_role_permissions table
CREATE TABLE IF NOT EXISTS rbac_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL, -- e.g., 'e-filing', 'payment', 'calendar', 'multi-entity', 'erp-integration', 'doc-ocr', 'team-rbac', 'clients', 'billing'
    can_read BOOLEAN NOT NULL DEFAULT false,
    can_write BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    can_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(role_id, module_name)
);

-- 5. Create rbac_team_invitations table
CREATE TABLE IF NOT EXISTS rbac_team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES rbac_teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role_name TEXT NOT NULL CHECK (role_name IN ('Partner', 'Manager', 'Senior CA', 'Articled Clerk', 'Data Entry', 'Viewer')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create rbac_member_activity_logs table
CREATE TABLE IF NOT EXISTS rbac_member_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES rbac_teams(id) ON DELETE CASCADE,
    performed_by TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Add Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rbac_teams_updated_at BEFORE UPDATE ON rbac_teams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rbac_roles_updated_at BEFORE UPDATE ON rbac_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rbac_team_members_updated_at BEFORE UPDATE ON rbac_team_members FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rbac_role_permissions_updated_at BEFORE UPDATE ON rbac_role_permissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rbac_team_invitations_updated_at BEFORE UPDATE ON rbac_team_invitations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Add Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_rbac_teams_ca ON rbac_teams(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_roles_ca ON rbac_roles(ca_user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_team_members_team ON rbac_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_rbac_team_members_email ON rbac_team_members(email);
CREATE INDEX IF NOT EXISTS idx_rbac_role_permissions_role ON rbac_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rbac_team_invitations_team ON rbac_team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_rbac_team_invitations_email ON rbac_team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_rbac_activity_logs_team ON rbac_member_activity_logs(team_id);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE rbac_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_member_activity_logs ENABLE ROW LEVEL SECURITY;

-- 10. Define RLS Policies

-- rbac_teams Policies
CREATE POLICY "CAs can manage their own teams"
ON rbac_teams FOR ALL
TO authenticated
USING (ca_user_id = auth.uid())
WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Team members can view their teams"
ON rbac_teams FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rbac_team_members
        WHERE rbac_team_members.team_id = rbac_teams.id
        AND rbac_team_members.email = auth.jwt()->>'email'
    )
);

-- rbac_roles Policies
CREATE POLICY "CAs can manage their own custom roles"
ON rbac_roles FOR ALL
TO authenticated
USING (ca_user_id = auth.uid())
WITH CHECK (ca_user_id = auth.uid());

CREATE POLICY "Team members can view firm roles"
ON rbac_roles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rbac_teams
        JOIN rbac_team_members ON rbac_team_members.team_id = rbac_teams.id
        WHERE rbac_teams.ca_user_id = rbac_roles.ca_user_id
        AND rbac_team_members.email = auth.jwt()->>'email'
    )
);

-- rbac_team_members Policies
CREATE POLICY "CAs can manage team members"
ON rbac_team_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rbac_teams
        WHERE rbac_teams.id = rbac_team_members.team_id
        AND rbac_teams.ca_user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rbac_teams
        WHERE rbac_teams.id = rbac_team_members.team_id
        AND rbac_teams.ca_user_id = auth.uid()
    )
);

CREATE POLICY "Team members can read other members in their team"
ON rbac_team_members FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rbac_team_members m
        WHERE m.team_id = rbac_team_members.team_id
        AND m.email = auth.jwt()->>'email'
    )
);

-- rbac_role_permissions Policies
CREATE POLICY "CAs can manage role permissions"
ON rbac_role_permissions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rbac_roles
        WHERE rbac_roles.id = rbac_role_permissions.role_id
        AND rbac_roles.ca_user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rbac_roles
        WHERE rbac_roles.id = rbac_role_permissions.role_id
        AND rbac_roles.ca_user_id = auth.uid()
    )
);

CREATE POLICY "Team members can read role permissions"
ON rbac_role_permissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rbac_roles
        JOIN rbac_teams ON rbac_teams.ca_user_id = rbac_roles.ca_user_id
        JOIN rbac_team_members ON rbac_team_members.team_id = rbac_teams.id
        WHERE rbac_roles.id = rbac_role_permissions.role_id
        AND rbac_team_members.email = auth.jwt()->>'email'
    )
);

-- rbac_team_invitations Policies
CREATE POLICY "CAs can manage invitations"
ON rbac_team_invitations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rbac_teams
        WHERE rbac_teams.id = rbac_team_invitations.team_id
        AND rbac_teams.ca_user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rbac_teams
        WHERE rbac_teams.id = rbac_team_invitations.team_id
        AND rbac_teams.ca_user_id = auth.uid()
    )
);

CREATE POLICY "Invited members can view their own invitations"
ON rbac_team_invitations FOR SELECT
TO authenticated
USING (email = auth.jwt()->>'email');

-- rbac_member_activity_logs Policies
CREATE POLICY "CAs can view activity logs for their teams"
ON rbac_member_activity_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM rbac_teams
        WHERE rbac_teams.id = rbac_member_activity_logs.team_id
        AND rbac_teams.ca_user_id = auth.uid()
    )
);

CREATE POLICY "CAs can write activity logs for their teams"
ON rbac_member_activity_logs FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rbac_teams
        WHERE rbac_teams.id = rbac_member_activity_logs.team_id
        AND rbac_teams.ca_user_id = auth.uid()
    )
);

-- 11. Initial seeding function to quickly bootstrap system roles when a team or CA is accessed
CREATE OR REPLACE FUNCTION bootstrap_ca_rbac_system(ca_id UUID)
RETURNS VOID AS $$
DECLARE
    role_partner_id UUID;
    role_manager_id UUID;
    role_senior_id UUID;
    role_clerk_id UUID;
    role_data_id UUID;
    role_viewer_id UUID;
    modules TEXT[] := ARRAY['e-filing', 'payment', 'calendar', 'multi-entity', 'erp-integration', 'doc-ocr', 'team-rbac', 'clients', 'billing'];
    m TEXT;
BEGIN
    -- 1. Insert System Roles for this CA if they don't already exist
    INSERT INTO rbac_roles (ca_user_id, role_name, role_code, description, is_system)
    VALUES 
        (ca_id, 'Partner', 'partner', 'Full administrative authority and sign-off capabilities.', true),
        (ca_id, 'Manager', 'manager', 'Oversees client files, assigns tasks, and reviews drafts.', true),
        (ca_id, 'Senior CA', 'senior_ca', 'Handles core filings, drafts replies, and reviews data entry.', true),
        (ca_id, 'Articled Clerk', 'articled_clerk', 'Assists in preparation, data compilation, and basic drafting.', true),
        (ca_id, 'Data Entry', 'data_entry', 'Uploads invoices, enters financial records, and processes legacy docs.', true),
        (ca_id, 'Viewer', 'viewer', 'Read-only access to client files and deadline calendars.', true)
    ON CONFLICT (ca_user_id, role_code) DO NOTHING;

    -- Retrieve role IDs
    SELECT id INTO role_partner_id FROM rbac_roles WHERE ca_user_id = ca_id AND role_code = 'partner';
    SELECT id INTO role_manager_id FROM rbac_roles WHERE ca_user_id = ca_id AND role_code = 'manager';
    SELECT id INTO role_senior_id FROM rbac_roles WHERE ca_user_id = ca_id AND role_code = 'senior_ca';
    SELECT id INTO role_clerk_id FROM rbac_roles WHERE ca_user_id = ca_id AND role_code = 'articled_clerk';
    SELECT id INTO role_data_id FROM rbac_roles WHERE ca_user_id = ca_id AND role_code = 'data_entry';
    SELECT id INTO role_viewer_id FROM rbac_roles WHERE ca_user_id = ca_id AND role_code = 'viewer';

    -- 2. Populate permissions for each module
    FOREACH m IN ARRAY modules LOOP
        -- Partner: Full admin
        INSERT INTO rbac_role_permissions (role_id, module_name, can_read, can_write, can_delete, can_admin)
        VALUES (role_partner_id, m, true, true, true, true)
        ON CONFLICT (role_id, module_name) DO NOTHING;

        -- Manager: Read/Write/Delete/No Admin
        INSERT INTO rbac_role_permissions (role_id, module_name, can_read, can_write, can_delete, can_admin)
        VALUES (role_manager_id, m, true, true, true, false)
        ON CONFLICT (role_id, module_name) DO NOTHING;

        -- Senior CA: Read/Write/Limited Delete (False for system settings, but for general modules true)
        INSERT INTO rbac_role_permissions (role_id, module_name, can_read, can_write, can_delete, can_admin)
        VALUES (role_senior_id, m, true, true, m != 'team-rbac', false)
        ON CONFLICT (role_id, module_name) DO NOTHING;

        -- Articled Clerk: Read/Write/No Delete/No Admin
        INSERT INTO rbac_role_permissions (role_id, module_name, can_read, can_write, can_delete, can_admin)
        VALUES (role_clerk_id, m, true, true, false, false)
        ON CONFLICT (role_id, module_name) DO NOTHING;

        -- Data Entry: Limited modules (e.g. read/write only for doc-ocr, erp-integration, payment; read-only for others)
        IF m IN ('doc-ocr', 'erp-integration', 'payment') THEN
            INSERT INTO rbac_role_permissions (role_id, module_name, can_read, can_write, can_delete, can_admin)
            VALUES (role_data_id, m, true, true, false, false)
            ON CONFLICT (role_id, module_name) DO NOTHING;
        ELSE
            INSERT INTO rbac_role_permissions (role_id, module_name, can_read, can_write, can_delete, can_admin)
            VALUES (role_data_id, m, true, false, false, false)
            ON CONFLICT (role_id, module_name) DO NOTHING;
        END IF;

        -- Viewer: Read-only for all modules
        INSERT INTO rbac_role_permissions (role_id, module_name, can_read, can_write, can_delete, can_admin)
        VALUES (role_viewer_id, m, true, false, false, false)
        ON CONFLICT (role_id, module_name) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
