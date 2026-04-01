/**
 * CA Dashboard Routes
 * Chartered Accountant specific endpoints
 */

import { Router } from 'express';
import { supabase } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import caDashboardRoutes from './ca-dashboard.js';

const router = Router();

// Apply authentication to all CA routes
router.use(authenticateToken);
router.use(requireRole(['external_ca', 'in_house_ca', 'ca_firm']));

// Mount CA dashboard routes with detailed real data endpoints
router.use('/', caDashboardRoutes);

// GET /api/v1/ca/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get companies assigned to this CA
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, industry, compliance_health, created_at')
      .eq('assigned_ca_id', userId);

    if (companiesError) {
      console.error('Companies fetch error:', companiesError);
      return res.status(500).json({
        error: 'Failed to fetch companies',
        message: companiesError.message
      });
    }

    // Get tasks for companies assigned to this CA
    const companyIds = companies.map(c => c.id);
    let tasks = [];
    if (companyIds.length > 0) {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, company_id, title, regulator, priority, status, due_date, created_at')
        .in('company_id', companyIds)
        .order('due_date', { ascending: true });

      if (tasksError) {
        console.error('Tasks fetch error:', tasksError);
      } else {
        tasks = tasksData || [];
      }
    }

    // Get deadlines for companies assigned to this CA
    let deadlines = [];
    if (companyIds.length > 0) {
      const { data: deadlinesData, error: deadlinesError } = await supabase
        .from('compliance_deadlines')
        .select('id, company_id, title, regulator, due_date, created_at')
        .in('company_id', companyIds)
        .order('due_date', { ascending: true });

      if (deadlinesError) {
        console.error('Deadlines fetch error:', deadlinesError);
      } else {
        deadlines = deadlinesData || [];
      }
    }

    // Get documents for companies assigned to this CA
    let documents = [];
    if (companyIds.length > 0) {
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, company_id, name, status, created_at')
        .in('company_id', companyIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (documentsError) {
        console.error('Documents fetch error:', documentsError);
      } else {
        documents = documentsData || [];
      }
    }

    // Get AI drafts for this CA
    const { data: drafts, error: draftsError } = await supabase
      .from('ai_drafts')
      .select('id, company_id, document_type, draft_mode, status, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (draftsError) {
      console.error('Drafts fetch error:', draftsError);
    }

    res.json({
      companies: companies || [],
      tasks: tasks || [],
      deadlines: deadlines || [],
      documents: documents || [],
      drafts: drafts || [],
      summary: {
        total_companies: companies?.length || 0,
        active_tasks: tasks?.filter(t => t.status !== 'completed').length || 0,
        overdue_tasks: tasks?.filter(t => {
          if (!t.due_date) return false;
          return new Date(t.due_date) < new Date() && t.status !== 'completed';
        }).length || 0,
        pending_documents: documents?.filter(d => d.status === 'pending').length || 0,
      }
    });

  } catch (error) {
    console.error('CA dashboard error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load CA dashboard'
    });
  }
});

// GET /api/v1/ca/companies
router.get('/companies', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        id, 
        name, 
        industry, 
        compliance_health, 
        created_at,
        users!companies_owner_id_fkey (
          full_name,
          email
        )
      `)
      .eq('assigned_ca_id', userId);

    if (error) {
      console.error('Companies fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch companies',
        message: error.message
      });
    }

    res.json({ companies: companies || [] });

  } catch (error) {
    console.error('CA companies error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load companies'
    });
  }
});

// GET /api/v1/ca/companies/:companyId/tasks
router.get('/companies/:companyId/tasks', async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.userId;

    // Verify CA has access to this company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .eq('assigned_ca_id', userId)
      .single();

    if (companyError || !company) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this company'
      });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('company_id', companyId)
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
    console.error('CA company tasks error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load company tasks'
    });
  }
});

// POST /api/v1/ca/companies/:companyId/tasks
router.post('/companies/:companyId/tasks', async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.userId;
    const { title, regulator, priority, due_date, description } = req.body;

    // Verify CA has access to this company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .eq('assigned_ca_id', userId)
      .single();

    if (companyError || !company) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this company'
      });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        company_id: companyId,
        title,
        regulator,
        priority: priority || 'medium',
        due_date,
        description,
        status: 'pending',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Task creation error:', error);
      return res.status(500).json({
        error: 'Failed to create task',
        message: error.message
      });
    }

    res.status(201).json({
      message: 'Task created successfully',
      task
    });

  } catch (error) {
    console.error('CA create task error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create task'
    });
  }
});

// PUT /api/v1/ca/tasks/:taskId/status
router.put('/tasks/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    if (!['pending', 'in_progress', 'under_review', 'completed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: pending, in_progress, under_review, completed'
      });
    }

    // Verify CA has access to this task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id, 
        companies!tasks_company_id_fkey (
          assigned_ca_id
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task || task.companies.assigned_ca_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this task'
      });
    }

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'completed' && { completed_at: new Date().toISOString() })
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Task update error:', error);
      return res.status(500).json({
        error: 'Failed to update task',
        message: error.message
      });
    }

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (error) {
    console.error('CA update task error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update task'
    });
  }
});

export default router;