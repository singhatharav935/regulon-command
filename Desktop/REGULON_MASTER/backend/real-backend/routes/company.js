/**
 * Company Dashboard Routes
 * Company owner specific endpoints
 */

import { Router } from 'express';
import { supabase } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all company routes
router.use(authenticateToken);
router.use(requireRole(['company_owner']));

// GET /api/v1/company/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get company owned by this user
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, industry, compliance_health, created_at')
      .eq('owner_id', userId)
      .single();

    if (companyError) {
      console.error('Company fetch error:', companyError);
      return res.status(404).json({
        error: 'Company not found',
        message: 'Please complete your company setup first'
      });
    }

    // Get compliance exposures for the company
    const { data: exposures, error: exposuresError } = await supabase
      .from('compliance_exposures')
      .select('regulator, status, notes, updated_at')
      .eq('company_id', company.id);

    if (exposuresError) {
      console.error('Exposures fetch error:', exposuresError);
    }

    // Get tasks for the company
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, regulator, priority, status, due_date, created_at')
      .eq('company_id', company.id)
      .order('due_date', { ascending: true });

    if (tasksError) {
      console.error('Tasks fetch error:', tasksError);
    }

    // Get documents for the company
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, name, file_type, regulator, status, created_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (documentsError) {
      console.error('Documents fetch error:', documentsError);
    }

    // Get compliance deadlines
    const { data: deadlines, error: deadlinesError } = await supabase
      .from('compliance_deadlines')
      .select('id, title, regulator, due_date, is_recurring, created_at')
      .eq('company_id', company.id)
      .order('due_date', { ascending: true });

    if (deadlinesError) {
      console.error('Deadlines fetch error:', deadlinesError);
    }

    // Get AI draft runs
    const { data: draftRuns, error: draftRunsError } = await supabase
      .from('ai_drafts')
      .select('id, document_type, draft_mode, status, created_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (draftRunsError) {
      console.error('Draft runs fetch error:', draftRunsError);
    }

    // Get audit events for drafts
    const draftIds = draftRuns?.map(d => d.id) || [];
    let draftAuditEvents = [];
    if (draftIds.length > 0) {
      const { data: auditData, error: auditError } = await supabase
        .from('audit_events')
        .select('id, draft_run_id, event_type, created_at')
        .in('draft_run_id', draftIds)
        .order('created_at', { ascending: false });

      if (auditError) {
        console.error('Audit events fetch error:', auditError);
      } else {
        draftAuditEvents = auditData || [];
      }
    }

    res.json({
      company: company || null,
      exposures: exposures || [],
      tasks: tasks || [],
      documents: documents || [],
      deadlines: deadlines || [],
      draftRuns: draftRuns || [],
      draftAuditEvents: draftAuditEvents || [],
      summary: {
        compliance_health: company?.compliance_health || 0,
        active_tasks: tasks?.filter(t => t.status !== 'completed').length || 0,
        overdue_tasks: tasks?.filter(t => {
          if (!t.due_date) return false;
          return new Date(t.due_date) < new Date() && t.status !== 'completed';
        }).length || 0,
        pending_documents: documents?.filter(d => d.status === 'pending').length || 0,
        upcoming_deadlines: deadlines?.filter(d => {
          if (!d.due_date) return false;
          const dueDate = new Date(d.due_date);
          const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          return dueDate <= thirtyDaysFromNow && dueDate >= new Date();
        }).length || 0,
      }
    });

  } catch (error) {
    console.error('Company dashboard error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load company dashboard'
    });
  }
});

// POST /api/v1/company/create
router.post('/create', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, industry, description, address, phone, website } = req.body;

    if (!name || !industry) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Company name and industry are required'
      });
    }

    // Check if user already has a company
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (existingCompany) {
      return res.status(409).json({
        error: 'Company already exists',
        message: 'You already have a company registered'
      });
    }

    // Create company
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        owner_id: userId,
        name,
        industry,
        description,
        address,
        phone,
        website,
        compliance_health: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Company creation error:', error);
      return res.status(500).json({
        error: 'Failed to create company',
        message: error.message
      });
    }

    // Initialize basic compliance exposures
    const basicExposures = [
      { regulator: 'Income Tax Department', status: 'unknown' },
      { regulator: 'GST Department', status: 'unknown' },
      { regulator: 'ROC (Registrar of Companies)', status: 'unknown' },
      { regulator: 'Labor Department', status: 'unknown' },
    ];

    const exposureInserts = basicExposures.map(exp => ({
      company_id: company.id,
      regulator: exp.regulator,
      status: exp.status,
      notes: 'Initial setup required',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: exposuresError } = await supabase
      .from('compliance_exposures')
      .insert(exposureInserts);

    if (exposuresError) {
      console.error('Exposures creation error:', exposuresError);
    }

    // Update user profile to mark as profile completed
    await supabase
      .from('users')
      .update({ 
        profile_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    res.status(201).json({
      message: 'Company created successfully',
      company
    });

  } catch (error) {
    console.error('Company creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create company'
    });
  }
});

// GET /api/v1/company/onboarding
router.get('/onboarding', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get onboarding status
    const { data: onboarding, error } = await supabase
      .from('company_onboarding')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Onboarding fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch onboarding status',
        message: error.message
      });
    }

    // If no onboarding record exists, create default one
    if (!onboarding) {
      const { data: newOnboarding, error: createError } = await supabase
        .from('company_onboarding')
        .insert({
          user_id: userId,
          company_details_completed: false,
          documents_uploaded: false,
          compliance_setup_completed: false,
          ca_assignment_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Onboarding creation error:', createError);
        return res.status(500).json({
          error: 'Failed to create onboarding status',
          message: createError.message
        });
      }

      return res.json({ onboarding: newOnboarding });
    }

    res.json({ onboarding });

  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load onboarding status'
    });
  }
});

// PUT /api/v1/company/profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, industry, description, address, phone, website } = req.body;

    // Update company
    const { data: company, error } = await supabase
      .from('companies')
      .update({
        name,
        industry,
        description,
        address,
        phone,
        website,
        updated_at: new Date().toISOString(),
      })
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Company update error:', error);
      return res.status(500).json({
        error: 'Failed to update company',
        message: error.message
      });
    }

    res.json({
      message: 'Company profile updated successfully',
      company
    });

  } catch (error) {
    console.error('Company profile update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update company profile'
    });
  }
});

// GET /api/v1/company/tasks
router.get('/tasks', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get company ID
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (companyError) {
      return res.status(404).json({
        error: 'Company not found',
        message: 'Please complete your company setup first'
      });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('company_id', company.id)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Tasks fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch tasks',
        message: error.message
      });
    }

    res.json({ tasks: tasks || [] });

  } catch (error) {
    console.error('Company tasks error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load tasks'
    });
  }
});

export default router;