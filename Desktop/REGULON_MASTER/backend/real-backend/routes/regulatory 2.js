/**
 * Regulatory Data API Routes
 * Endpoints for managing regulatory agents and fetching data
 */

import express from 'express';
import { supabase } from '../server.js';
import { 
  regulatoryAgentManager,
  startAgents,
  runAgentsNow,
  getAgentStatus,
  GOV_PORTALS,
  NEWS_SOURCES
} from '../services/regulatory-agents.js';

const router = express.Router();

// Get all regulatory alerts with filtering
router.get('/alerts', async (req, res) => {
  try {
    const { 
      source, 
      category, 
      exposure, 
      limit = 50, 
      offset = 0,
      since,
      search
    } = req.query;

    let query = supabase
      .from('regulatory_alerts')
      .select(`
        *,
        source_monitoring:source(source_name, source_type)
      `)
      .order('announced_on', { ascending: false });

    // Apply filters
    if (source) query = query.eq('source', source);
    if (category) query = query.eq('category', category);
    if (exposure) query = query.eq('company_exposure', exposure);
    if (since) query = query.gte('announced_on', since);
    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      alerts: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching regulatory alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent alerts summary for dashboard
router.get('/alerts/summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('regulatory_dashboard_summary')
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching alerts summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get regulatory news
router.get('/news', async (req, res) => {
  try {
    const { 
      category, 
      severity, 
      limit = 20, 
      offset = 0 
    } = req.query;

    let query = supabase
      .from('regulatory_news')
      .select('*')
      .order('date', { ascending: false });

    if (category) query = query.eq('category', category);
    if (severity) query = query.eq('severity', severity);

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching regulatory news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start regulatory agents
router.post('/agents/start', async (req, res) => {
  try {
    const result = startAgents();
    res.json(result);
  } catch (error) {
    console.error('Error starting agents:', error);
    res.status(500).json({ error: 'Failed to start agents' });
  }
});

// Run agents manually
router.post('/agents/run', async (req, res) => {
  try {
    const result = await runAgentsNow();
    res.json(result);
  } catch (error) {
    console.error('Error running agents:', error);
    res.status(500).json({ error: 'Failed to run agents' });
  }
});

// Get agent status
router.get('/agents/status', async (req, res) => {
  try {
    const status = await getAgentStatus();
    
    // Also get database status
    const { data: dbStatus } = await supabase
      .from('agent_performance')
      .select('*');

    const { data: systemStatus } = await supabase
      .from('system_status')
      .select('*')
      .eq('service', 'regulatory_agents')
      .single();

    res.json({
      runtime_status: status,
      database_status: dbStatus,
      system_status: systemStatus
    });
  } catch (error) {
    console.error('Error getting agent status:', error);
    res.status(500).json({ error: 'Failed to get agent status' });
  }
});

// Get available sources
router.get('/sources', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('source_monitoring')
      .select('*')
      .order('priority');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Also include runtime configuration
    const runtimeSources = {
      government: GOV_PORTALS,
      news: NEWS_SOURCES
    };

    res.json({
      database_sources: data,
      runtime_sources: runtimeSources
    });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update source configuration
router.put('/sources/:sourceId', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('source_monitoring')
      .update(updates)
      .eq('source_id', sourceId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating source:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alerts by source
router.get('/sources/:sourceId/alerts', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('regulatory_alerts')
      .select('*')
      .eq('source', sourceId)
      .order('announced_on', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching source alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search alerts
router.post('/alerts/search', async (req, res) => {
  try {
    const { 
      query: searchQuery, 
      sources, 
      categories, 
      exposureLevel,
      dateRange,
      limit = 50 
    } = req.body;

    let query = supabase
      .from('regulatory_alerts')
      .select(`
        *,
        source_monitoring:source(source_name, source_type)
      `)
      .order('announced_on', { ascending: false });

    // Text search
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,announced_by.ilike.%${searchQuery}%`);
    }

    // Filter by sources
    if (sources && sources.length > 0) {
      query = query.in('source', sources);
    }

    // Filter by categories
    if (categories && categories.length > 0) {
      query = query.in('category', categories);
    }

    // Filter by exposure level
    if (exposureLevel) {
      query = query.eq('company_exposure', exposureLevel);
    }

    // Date range filter
    if (dateRange) {
      if (dateRange.start) query = query.gte('announced_on', dateRange.start);
      if (dateRange.end) query = query.lte('announced_on', dateRange.end);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error searching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alert details
router.get('/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;

    const { data, error } = await supabase
      .from('regulatory_alerts')
      .select(`
        *,
        source_monitoring:source(*)
      `)
      .eq('id', alertId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching alert details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark alert as read/acknowledged
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { userId, method = 'dashboard' } = req.body;

    // Record the acknowledgment
    const { data, error } = await supabase
      .from('alert_delivery')
      .insert({
        alert_id: alertId,
        user_id: userId,
        delivery_method: method,
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const agentStatus = await getAgentStatus();
    
    const { data: systemStatus } = await supabase
      .from('system_status')
      .select('*')
      .eq('service', 'regulatory_agents')
      .single();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      agents: {
        total: agentStatus.total_agents,
        active: agentStatus.active_agents,
        running: agentStatus.system_running
      },
      system: systemStatus,
      database: 'connected'
    };

    // Determine overall health
    if (agentStatus.active_agents === 0) {
      health.status = 'warning';
    }
    
    if (!systemStatus || systemStatus.status === 'error') {
      health.status = 'critical';
    }

    res.json(health);
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({ 
      status: 'critical',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;