/**
 * Notifications API Routes
 * Handles notification system for compliance alerts and updates
 */

import { Router } from 'express';
import Joi from 'joi';
import { supabase } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const createNotificationSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(1000).required(),
  type: Joi.string().valid('info', 'warning', 'error', 'success').required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  recipient_id: Joi.string().uuid().required(),
  company_id: Joi.string().uuid().optional(),
  related_entity_type: Joi.string().valid('task', 'document', 'compliance', 'deadline').optional(),
  related_entity_id: Joi.string().uuid().optional(),
  action_url: Joi.string().uri().optional(),
  scheduled_for: Joi.date().iso().optional()
});

const markReadSchema = Joi.object({
  notification_ids: Joi.array().items(Joi.string().uuid()).required()
});

// GET /api/v1/notifications - Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false, type } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:sender_id(full_name, email),
        company:company_id(name)
      `)
      .eq('recipient_id', req.user.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unread_only === 'true') {
      query = query.eq('read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch notifications',
        message: error.message
      });
    }

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch notifications'
    });
  }
});

// POST /api/v1/notifications - Create notification (admin/CA only)
router.post('/', authenticateToken, requireRole(['admin', 'external_ca', 'in_house_ca']), async (req, res) => {
  try {
    const { error, value } = createNotificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const notificationData = {
      ...value,
      sender_id: req.user.userId,
      created_at: new Date().toISOString(),
      read: false,
      read_at: null
    };

    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select('*')
      .single();

    if (insertError) {
      return res.status(500).json({
        error: 'Failed to create notification',
        message: insertError.message
      });
    }

    // Create audit event
    await supabase.from('audit_events').insert({
      user_id: req.user.userId,
      event_type: 'notification_sent',
      event_data: {
        notification_id: notification.id,
        recipient: value.recipient_id,
        type: value.type,
        title: value.title
      }
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('Notification creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create notification'
    });
  }
});

// POST /api/v1/notifications/mark-read - Mark notifications as read
router.post('/mark-read', authenticateToken, async (req, res) => {
  try {
    const { error, value } = markReadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { data, error: updateError } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .in('id', value.notification_ids)
      .eq('recipient_id', req.user.userId)
      .select('id');

    if (updateError) {
      return res.status(500).json({
        error: 'Failed to mark notifications as read',
        message: updateError.message
      });
    }

    res.json({
      message: `${data.length} notifications marked as read`,
      updated_ids: data.map(n => n.id)
    });

  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to mark notifications as read'
    });
  }
});

// GET /api/v1/notifications/unread-count - Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('recipient_id', req.user.userId)
      .eq('read', false);

    if (error) {
      return res.status(500).json({
        error: 'Failed to get unread count',
        message: error.message
      });
    }

    res.json({
      unread_count: data.length
    });

  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get unread count'
    });
  }
});

// DELETE /api/v1/notifications/:id - Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('recipient_id', req.user.userId);

    if (error) {
      return res.status(500).json({
        error: 'Failed to delete notification',
        message: error.message
      });
    }

    res.json({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Notification deletion error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete notification'
    });
  }
});

export default router;