import express from 'express';
import { supabase } from '../utils/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Performance Monitoring Routes
 */

// Log performance metric
router.post('/metrics', async (req, res) => {
    try {
        const { metric_name, metric_value, metric_unit, tags } = req.body;

        if (!metric_name || metric_value === undefined) {
            return res.status(400).json({ error: 'Metric name and value are required' });
        }

        const { error } = await supabase
            .from('performance_metrics')
            .insert({
                metric_name,
                metric_value: parseFloat(metric_value),
                metric_unit: metric_unit || 'count',
                tags: tags || {}
            });

        if (error) {
            console.error('Performance metric insert error:', error);
            return res.status(500).json({ error: 'Failed to log performance metric' });
        }

        res.status(201).json({ message: 'Performance metric logged' });

    } catch (error) {
        console.error('Performance metric error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get performance metrics (admin only)
router.get('/metrics', authenticateToken, async (req, res) => {
    try {
        if (req.user.registration_role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { metric_name, hours = 24 } = req.query;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        let query = supabase
            .from('performance_metrics')
            .select('*')
            .gte('recorded_at', since)
            .order('recorded_at', { ascending: false });

        if (metric_name) {
            query = query.eq('metric_name', metric_name);
        }

        const { data: metrics, error } = await query.limit(1000);

        if (error) {
            console.error('Performance metrics fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch performance metrics' });
        }

        res.json({ metrics: metrics || [] });

    } catch (error) {
        console.error('Get performance metrics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Health Check Routes
 */

// Comprehensive health check
router.get('/health', async (req, res) => {
    try {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks: {}
        };

        // Database connectivity check
        try {
            const { data, error } = await supabase
                .from('users')
                .select('count', { count: 'exact' })
                .limit(1);
            
            healthData.checks.database = {
                status: error ? 'unhealthy' : 'healthy',
                responseTime: Date.now(),
                error: error?.message
            };
        } catch (dbError) {
            healthData.checks.database = {
                status: 'unhealthy',
                error: dbError.message
            };
        }

        // Memory usage check
        const memUsage = process.memoryUsage();
        healthData.checks.memory = {
            status: memUsage.heapUsed < 512 * 1024 * 1024 ? 'healthy' : 'warning', // 512MB threshold
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        };

        // CPU usage approximation
        healthData.checks.uptime = {
            status: 'healthy',
            uptime: process.uptime(),
            uptimeHuman: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`
        };

        // Overall status
        const allHealthy = Object.values(healthData.checks).every(check => check.status === 'healthy');
        const hasWarnings = Object.values(healthData.checks).some(check => check.status === 'warning');
        
        if (!allHealthy) {
            healthData.status = 'unhealthy';
            res.status(503);
        } else if (hasWarnings) {
            healthData.status = 'degraded';
        }

        res.json(healthData);

    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Detailed system info (admin only)
router.get('/system', authenticateToken, async (req, res) => {
    try {
        if (req.user.registration_role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const systemInfo = {
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            pid: process.pid,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        };

        // Database statistics
        try {
            const { data: userCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            const { data: companyCount } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true });

            const { data: taskCount } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true });

            systemInfo.database_stats = {
                users: userCount?.count || 0,
                companies: companyCount?.count || 0,
                tasks: taskCount?.count || 0
            };
        } catch (dbError) {
            systemInfo.database_stats = { error: dbError.message };
        }

        res.json(systemInfo);

    } catch (error) {
        console.error('System info error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * API Usage Statistics
 */

// Get API usage stats (admin only)
router.get('/usage', authenticateToken, async (req, res) => {
    try {
        if (req.user.registration_role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { hours = 24 } = req.query;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        // Get rate limit data as proxy for API usage
        const { data: rateLimits, error } = await supabase
            .from('api_rate_limits')
            .select('endpoint, request_count, window_start')
            .gte('window_start', since);

        if (error) {
            console.error('Usage stats fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch usage statistics' });
        }

        // Aggregate by endpoint
        const endpointStats = {};
        (rateLimits || []).forEach(limit => {
            if (!endpointStats[limit.endpoint]) {
                endpointStats[limit.endpoint] = 0;
            }
            endpointStats[limit.endpoint] += limit.request_count;
        });

        res.json({
            timeframe: `${hours} hours`,
            endpoints: endpointStats,
            total_requests: Object.values(endpointStats).reduce((sum, count) => sum + count, 0)
        });

    } catch (error) {
        console.error('Get usage stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Error Analytics
 */

// Get error analytics (admin only)
router.get('/errors/analytics', authenticateToken, async (req, res) => {
    try {
        if (req.user.registration_role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { hours = 24 } = req.query;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const { data: errors, error } = await supabase
            .from('error_logs')
            .select('error_type, severity, created_at')
            .gte('created_at', since);

        if (error) {
            console.error('Error analytics fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch error analytics' });
        }

        // Aggregate by type and severity
        const errorsByType = {};
        const errorsBySeverity = {};
        const errorTimeline = {};

        (errors || []).forEach(err => {
            // By type
            errorsByType[err.error_type] = (errorsByType[err.error_type] || 0) + 1;
            
            // By severity
            errorsBySeverity[err.severity] = (errorsBySeverity[err.severity] || 0) + 1;
            
            // Timeline (by hour)
            const hour = new Date(err.created_at).getHours();
            errorTimeline[hour] = (errorTimeline[hour] || 0) + 1;
        });

        res.json({
            timeframe: `${hours} hours`,
            total_errors: errors?.length || 0,
            by_type: errorsByType,
            by_severity: errorsBySeverity,
            timeline: errorTimeline
        });

    } catch (error) {
        console.error('Get error analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;