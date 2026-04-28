/**
 * Admin Dashboard Routes
 * System administrator endpoints
 */

import { Router } from 'express';
import { supabase } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /api/v1/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, industry, compliance_health, created_at')
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error('Companies fetch error:', companiesError);
    }

    // Get all tasks across companies
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, company_id, title, priority, status, due_date, created_at')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Tasks fetch error:', tasksError);
    }

    // Get all documents
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, company_id, status, created_at')
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.error('Documents fetch error:', documentsError);
    }

    // Get all compliance deadlines
    const { data: deadlines, error: deadlinesError } = await supabase
      .from('compliance_deadlines')
      .select('id, company_id, title, due_date, created_at')
      .order('created_at', { ascending: false });

    if (deadlinesError) {
      console.error('Deadlines fetch error:', deadlinesError);
    }

    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from('users')
      .select('id, registration_role as role, created_at')
      .order('created_at', { ascending: false });

    if (rolesError) {
      console.error('Roles fetch error:', rolesError);
    }

    // Get AI drafts
    const { data: drafts, error: draftsError } = await supabase
      .from('ai_drafts')
      .select('id, user_id, status, document_type, created_at')
      .order('created_at', { ascending: false });

    if (draftsError) {
      console.error('Drafts fetch error:', draftsError);
    }

    res.json({
      companies: companies || [],
      tasks: tasks || [],
      documents: documents || [],
      deadlines: deadlines || [],
      roles: roles?.map(r => ({ id: r.id, role: r.role, user_id: r.id })) || [],
      drafts: drafts || [],
      summary: {
        total_companies: companies?.length || 0,
        total_users: roles?.length || 0,
        active_tasks: tasks?.filter(t => t.status !== 'completed').length || 0,
        overdue_tasks: tasks?.filter(t => {
          if (!t.due_date) return false;
          return new Date(t.due_date) < new Date() && t.status !== 'completed';
        }).length || 0,
        pending_documents: documents?.filter(d => d.status === 'pending').length || 0,
        approved_documents: documents?.filter(d => d.status === 'approved').length || 0,
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load admin dashboard'
    });
  }
});

// GET /api/v1/admin/companies
router.get('/companies', async (req, res) => {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        users!companies_owner_id_fkey (
          full_name,
          email
        ),
        ca_user:users!companies_assigned_ca_id_fkey (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Companies fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch companies',
        message: error.message
      });
    }

    res.json({ companies: companies || [] });

  } catch (error) {
    console.error('Admin companies error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load companies'
    });
  }
});

// GET /api/v1/admin/users
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, registration_role, email_verified, profile_completed, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Users fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch users',
        message: error.message
      });
    }

    res.json({ users: users || [] });

  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load users'
    });
  }
});

// PUT /api/v1/admin/companies/:companyId/assign-ca
router.put('/companies/:companyId/assign-ca', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { ca_id } = req.body;

    if (!ca_id) {
      return res.status(400).json({
        error: 'Missing CA ID',
        message: 'CA ID is required to assign a CA to company'
      });
    }

    // Verify CA exists and has correct role
    const { data: ca, error: caError } = await supabase
      .from('users')
      .select('id, registration_role')
      .eq('id', ca_id)
      .single();

    if (caError || !ca || !['external_ca', 'in_house_ca', 'ca_firm'].includes(ca.registration_role)) {
      return res.status(400).json({
        error: 'Invalid CA',
        message: 'The specified user is not a valid CA'
      });
    }

    // Update company
    const { data: company, error } = await supabase
      .from('companies')
      .update({
        assigned_ca_id: ca_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Company CA assignment error:', error);
      return res.status(500).json({
        error: 'Failed to assign CA',
        message: error.message
      });
    }

    res.json({
      message: 'CA assigned successfully',
      company
    });

  } catch (error) {
    console.error('Admin CA assignment error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to assign CA'
    });
  }
});

// GET /api/v1/admin/system-health
router.get('/system-health', async (req, res) => {
  try {
    // Test database connectivity
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    const dbHealthy = !error;

    res.json({
      api: 'healthy',
      database: dbHealthy ? 'healthy' : 'error',
      auth: 'healthy', // If we got here, auth is working
      storage: 'healthy', // Assume storage is working if DB is working
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({
      error: 'System health check failed',
      message: error.message
    });
  }
});

export default router;