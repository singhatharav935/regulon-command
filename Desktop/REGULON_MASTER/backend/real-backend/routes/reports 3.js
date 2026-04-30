/**
 * Reporting and Analytics API Routes
 * Handles compliance reporting, analytics, and dashboard statistics
 */

import { Router } from 'express';
import Joi from 'joi';
import { supabase } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const reportQuerySchema = Joi.object({
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  company_id: Joi.string().uuid().optional(),
  regulator: Joi.string().optional(),
  status: Joi.string().valid('compliant', 'attention', 'non_compliant', 'unknown').optional(),
  report_type: Joi.string().valid('compliance', 'tasks', 'documents', 'deadlines').required()
});

// GET /api/v1/reports/dashboard-stats - Get dashboard statistics
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const { company_id } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Build base query for user's accessible companies
    let companyFilter = '';
    if (userRole === 'company_owner') {
      companyFilter = company_id ? `AND c.id = '${company_id}'` : `AND c.owner_id = '${userId}'`;
    } else if (userRole === 'external_ca' || userRole === 'in_house_ca') {
      companyFilter = company_id ? `AND c.id = '${company_id}'` : `AND c.assigned_ca_id = '${userId}'`;
    } else if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get compliance overview
    const { data: complianceStats } = await supabase.rpc('get_compliance_stats', {
      p_user_id: userId,
      p_user_role: userRole,
      p_company_id: company_id || null
    });

    // Get task statistics
    const { data: taskStats } = await supabase.rpc('get_task_stats', {
      p_user_id: userId,
      p_user_role: userRole,
      p_company_id: company_id || null
    });

    // Get document statistics
    const { data: documentStats } = await supabase.rpc('get_document_stats', {
      p_user_id: userId,
      p_user_role: userRole,
      p_company_id: company_id || null
    });

    // Get upcoming deadlines
    const { data: upcomingDeadlines } = await supabase
      .from('compliance_deadlines')
      .select(`
        *,
        company:company_id(name, compliance_health)
      `)
      .gte('due_date', new Date().toISOString())
      .lte('due_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('due_date', { ascending: true })
      .limit(10);

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('audit_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      compliance_stats: complianceStats?.[0] || {
        total_companies: 0,
        compliant_count: 0,
        attention_count: 0,
        non_compliant_count: 0,
        average_health: 0
      },
      task_stats: taskStats?.[0] || {
        total_tasks: 0,
        pending_tasks: 0,
        overdue_tasks: 0,
        completed_tasks: 0
      },
      document_stats: documentStats?.[0] || {
        total_documents: 0,
        pending_review: 0,
        approved_documents: 0,
        rejected_documents: 0
      },
      upcoming_deadlines: upcomingDeadlines || [],
      recent_activity: recentActivity || []
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// GET /api/v1/reports/compliance-summary - Get compliance summary report
router.get('/compliance-summary', authenticateToken, async (req, res) => {
  try {
    const { company_id, regulator, date_range = '30' } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const startDate = new Date(Date.now() - parseInt(date_range) * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('compliance_exposures')
      .select(`
        *,
        company:company_id(id, name, industry, compliance_health, owner_id, assigned_ca_id)
      `)
      .gte('created_at', startDate);

    // Apply role-based filtering
    if (userRole === 'company_owner') {
      query = query.eq('company.owner_id', userId);
    } else if (userRole === 'external_ca' || userRole === 'in_house_ca') {
      query = query.eq('company.assigned_ca_id', userId);
    }

    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    if (regulator) {
      query = query.eq('regulator', regulator);
    }

    const { data: exposures, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch compliance summary',
        message: error.message
      });
    }

    // Group by company and status
    const summary = exposures.reduce((acc, exposure) => {
      const companyId = exposure.company_id;
      if (!acc[companyId]) {
        acc[companyId] = {
          company: exposure.company,
          exposures: [],
          status_counts: { compliant: 0, attention: 0, non_compliant: 0, unknown: 0 }
        };
      }
      acc[companyId].exposures.push(exposure);
      acc[companyId].status_counts[exposure.status]++;
      return acc;
    }, {});

    res.json({
      summary: Object.values(summary),
      total_exposures: exposures.length,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Compliance summary error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate compliance summary'
    });
  }
});

// GET /api/v1/reports/task-performance - Get task performance metrics
router.get('/task-performance', authenticateToken, async (req, res) => {
  try {
    const { company_id, assignee_id, date_range = '30' } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const startDate = new Date(Date.now() - parseInt(date_range) * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('tasks')
      .select(`
        *,
        company:company_id(name, owner_id, assigned_ca_id),
        creator:created_by(full_name),
        assignee:assigned_to(full_name)
      `)
      .gte('created_at', startDate);

    // Apply role-based filtering
    if (userRole === 'company_owner') {
      query = query.eq('company.owner_id', userId);
    } else if (userRole === 'external_ca' || userRole === 'in_house_ca') {
      query = query.eq('company.assigned_ca_id', userId);
    }

    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    if (assignee_id) {
      query = query.eq('assigned_to', assignee_id);
    }

    const { data: tasks, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch task performance data',
        message: error.message
      });
    }

    // Calculate performance metrics
    const metrics = {
      total_tasks: tasks.length,
      completed_tasks: tasks.filter(t => t.status === 'completed').length,
      overdue_tasks: tasks.filter(t => t.status === 'overdue').length,
      avg_completion_time: 0,
      tasks_by_priority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        critical: tasks.filter(t => t.priority === 'critical').length
      },
      tasks_by_status: {
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        under_review: tasks.filter(t => t.status === 'under_review').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => t.status === 'overdue').length
      }
    };

    // Calculate average completion time for completed tasks
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_at);
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        const created = new Date(task.created_at);
        const completed = new Date(task.completed_at);
        return sum + (completed - created);
      }, 0);
      metrics.avg_completion_time = Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24)); // Days
    }

    res.json({
      metrics,
      tasks: tasks.slice(0, 50), // Limit to recent 50 tasks
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Task performance error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate task performance report'
    });
  }
});

// POST /api/v1/reports/generate - Generate custom report (admin/CA only)
router.post('/generate', authenticateToken, requireRole(['admin', 'external_ca']), async (req, res) => {
  try {
    const { error, value } = reportQuerySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { report_type, start_date, end_date, company_id, regulator, status } = value;

    // Generate report based on type
    let reportData = {};

    switch (report_type) {
      case 'compliance':
        reportData = await generateComplianceReport({ start_date, end_date, company_id, regulator, status });
        break;
      case 'tasks':
        reportData = await generateTaskReport({ start_date, end_date, company_id, status });
        break;
      case 'documents':
        reportData = await generateDocumentReport({ start_date, end_date, company_id, status });
        break;
      case 'deadlines':
        reportData = await generateDeadlineReport({ start_date, end_date, company_id, regulator });
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // Create audit trail
    await supabase.from('audit_events').insert({
      user_id: req.user.userId,
      event_type: 'report_generated',
      event_data: {
        report_type,
        filters: { start_date, end_date, company_id, regulator, status },
        generated_at: new Date().toISOString()
      }
    });

    res.json({
      report_type,
      filters: { start_date, end_date, company_id, regulator, status },
      data: reportData,
      generated_at: new Date().toISOString(),
      generated_by: req.user.userId
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate report'
    });
  }
});

// Helper functions for report generation
async function generateComplianceReport(filters) {
  // Implementation for compliance report
  return { message: 'Compliance report data would be generated here' };
}

async function generateTaskReport(filters) {
  // Implementation for task report
  return { message: 'Task report data would be generated here' };
}

async function generateDocumentReport(filters) {
  // Implementation for document report
  return { message: 'Document report data would be generated here' };
}

async function generateDeadlineReport(filters) {
  // Implementation for deadline report
  return { message: 'Deadline report data would be generated here' };
}

export default router;