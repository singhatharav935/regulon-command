/**
 * Audit Trail API Routes
 * Handles audit events, activity logs, and system monitoring
 */

import { Router } from 'express';
import Joi from 'joi';
import { supabase } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const auditEventSchema = Joi.object({
  event_type: Joi.string().min(1).max(50).required(),
  event_data: Joi.object().optional(),
  company_id: Joi.string().uuid().optional(),
  related_entity_id: Joi.string().uuid().optional(),
  related_entity_type: Joi.string().valid('task', 'document', 'company', 'user', 'compliance').optional()
});

const auditQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  user_id: Joi.string().uuid().optional(),
  event_type: Joi.string().optional(),
  company_id: Joi.string().uuid().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional()
});

// GET /api/v1/audit/events - Get audit events
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const { error, value } = auditQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { page, limit, user_id, event_type, company_id, start_date, end_date } = value;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = supabase
      .from('audit_events')
      .select(`
        *,
        user:user_id(full_name, email, registration_role)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply role-based filtering
    if (userRole !== 'admin') {
      // Non-admin users can only see their own events or events for their companies
      if (userRole === 'company_owner') {
        // Company owners see events for their companies
        const { data: userCompanies } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', userId);
        
        const companyIds = userCompanies?.map(c => c.id) || [];
        query = query.or(`user_id.eq.${userId},event_data->>company_id.in.(${companyIds.join(',')})`);
      } else if (userRole === 'external_ca' || userRole === 'in_house_ca') {
        // CAs see events for assigned companies
        const { data: assignedCompanies } = await supabase
          .from('companies')
          .select('id')
          .eq('assigned_ca_id', userId);
        
        const companyIds = assignedCompanies?.map(c => c.id) || [];
        query = query.or(`user_id.eq.${userId},event_data->>company_id.in.(${companyIds.join(',')})`);
      } else {
        // Other roles see only their own events
        query = query.eq('user_id', userId);
      }
    }

    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    if (company_id) {
      query = query.eq('event_data->>company_id', company_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: events, error: queryError, count } = await query;

    if (queryError) {
      return res.status(500).json({
        error: 'Failed to fetch audit events',
        message: queryError.message
      });
    }

    res.json({
      events,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Audit events fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch audit events'
    });
  }
});

// POST /api/v1/audit/events - Create audit event (system use)
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const { error, value } = auditEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const eventData = {
      ...value,
      user_id: req.user.userId,
      created_at: new Date().toISOString()
    };

    const { data: event, error: insertError } = await supabase
      .from('audit_events')
      .insert(eventData)
      .select('*')
      .single();

    if (insertError) {
      return res.status(500).json({
        error: 'Failed to create audit event',
        message: insertError.message
      });
    }

    res.status(201).json({
      message: 'Audit event created successfully',
      event
    });

  } catch (error) {
    console.error('Audit event creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create audit event'
    });
  }
});

// GET /api/v1/audit/activity-summary - Get activity summary
router.get('/activity-summary', authenticateToken, async (req, res) => {
  try {
    const { date_range = '30', company_id } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const startDate = new Date(Date.now() - parseInt(date_range) * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('audit_events')
      .select('event_type, created_at, event_data')
      .gte('created_at', startDate);

    // Apply role-based filtering
    if (userRole !== 'admin') {
      if (userRole === 'company_owner') {
        const { data: userCompanies } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', userId);
        
        const companyIds = userCompanies?.map(c => c.id) || [];
        query = query.or(`user_id.eq.${userId},event_data->>company_id.in.(${companyIds.join(',')})`);
      } else if (userRole === 'external_ca' || userRole === 'in_house_ca') {
        const { data: assignedCompanies } = await supabase
          .from('companies')
          .select('id')
          .eq('assigned_ca_id', userId);
        
        const companyIds = assignedCompanies?.map(c => c.id) || [];
        query = query.or(`user_id.eq.${userId},event_data->>company_id.in.(${companyIds.join(',')})`);
      } else {
        query = query.eq('user_id', userId);
      }
    }

    if (company_id) {
      query = query.eq('event_data->>company_id', company_id);
    }

    const { data: events, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch activity summary',
        message: error.message
      });
    }

    // Aggregate activity by type and date
    const activitySummary = {
      total_events: events.length,
      events_by_type: {},
      daily_activity: {},
      recent_activity: events.slice(0, 10)
    };

    events.forEach(event => {
      // Count by type
      if (!activitySummary.events_by_type[event.event_type]) {
        activitySummary.events_by_type[event.event_type] = 0;
      }
      activitySummary.events_by_type[event.event_type]++;

      // Count by date
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!activitySummary.daily_activity[date]) {
        activitySummary.daily_activity[date] = 0;
      }
      activitySummary.daily_activity[date]++;
    });

    res.json({
      summary: activitySummary,
      date_range: parseInt(date_range),
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Activity summary error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch activity summary'
    });
  }
});

// GET /api/v1/audit/system-stats - Get system statistics (admin only)
router.get('/system-stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get various system statistics
    const [
      { data: userStats },
      { data: companyStats },
      { data: taskStats },
      { data: documentStats },
      { data: recentEvents }
    ] = await Promise.all([
      supabase
        .from('users')
        .select('registration_role, created_at')
        .order('created_at', { ascending: false }),
      
      supabase
        .from('companies')
        .select('industry, compliance_health, created_at')
        .order('created_at', { ascending: false }),
      
      supabase
        .from('tasks')
        .select('status, priority, created_at')
        .order('created_at', { ascending: false }),
      
      supabase
        .from('documents')
        .select('status, file_type, created_at')
        .order('created_at', { ascending: false }),
      
      supabase
        .from('audit_events')
        .select('event_type, created_at')
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    // Calculate statistics
    const stats = {
      users: {
        total: userStats?.length || 0,
        by_role: {},
        recent_registrations: userStats?.filter(u => 
          new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0
      },
      companies: {
        total: companyStats?.length || 0,
        by_industry: {},
        avg_compliance_health: 0,
        recent_additions: companyStats?.filter(c => 
          new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0
      },
      tasks: {
        total: taskStats?.length || 0,
        by_status: {},
        by_priority: {}
      },
      documents: {
        total: documentStats?.length || 0,
        by_status: {},
        by_type: {}
      },
      system_activity: {
        events_last_24h: recentEvents?.filter(e => 
          new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length || 0,
        events_by_type: {}
      }
    };

    // Aggregate user stats
    userStats?.forEach(user => {
      if (!stats.users.by_role[user.registration_role]) {
        stats.users.by_role[user.registration_role] = 0;
      }
      stats.users.by_role[user.registration_role]++;
    });

    // Aggregate company stats
    let healthSum = 0;
    companyStats?.forEach(company => {
      if (!stats.companies.by_industry[company.industry]) {
        stats.companies.by_industry[company.industry] = 0;
      }
      stats.companies.by_industry[company.industry]++;
      healthSum += company.compliance_health || 0;
    });
    stats.companies.avg_compliance_health = companyStats?.length ? 
      Math.round(healthSum / companyStats.length) : 0;

    // Aggregate task stats
    taskStats?.forEach(task => {
      if (!stats.tasks.by_status[task.status]) {
        stats.tasks.by_status[task.status] = 0;
      }
      stats.tasks.by_status[task.status]++;

      if (!stats.tasks.by_priority[task.priority]) {
        stats.tasks.by_priority[task.priority] = 0;
      }
      stats.tasks.by_priority[task.priority]++;
    });

    // Aggregate document stats
    documentStats?.forEach(doc => {
      if (!stats.documents.by_status[doc.status]) {
        stats.documents.by_status[doc.status] = 0;
      }
      stats.documents.by_status[doc.status]++;

      if (!stats.documents.by_type[doc.file_type]) {
        stats.documents.by_type[doc.file_type] = 0;
      }
      stats.documents.by_type[doc.file_type]++;
    });

    // Aggregate event stats
    recentEvents?.forEach(event => {
      if (!stats.system_activity.events_by_type[event.event_type]) {
        stats.system_activity.events_by_type[event.event_type] = 0;
      }
      stats.system_activity.events_by_type[event.event_type]++;
    });

    res.json({
      stats,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch system statistics'
    });
  }
});

// GET /api/v1/audit/event-types - Get available event types
router.get('/event-types', authenticateToken, async (req, res) => {
  try {
    const { data: eventTypes, error } = await supabase
      .from('audit_events')
      .select('event_type')
      .group('event_type')
      .order('event_type');

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch event types',
        message: error.message
      });
    }

    const types = eventTypes?.map(et => et.event_type) || [];
    
    res.json({
      event_types: types,
      count: types.length
    });

  } catch (error) {
    console.error('Event types fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch event types'
    });
  }
});

export default router;