import express from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { supabase } from '../utils/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rate limiting for security endpoints
const securityLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: 'Too many security attempts, please try again later.' }
});

/**
 * Password Security Routes
 */

// Change Password
router.post('/password/change', authenticateToken, securityLimiter, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ 
                error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
            });
        }

        // Get current password security
        const { data: currentSecurity, error: fetchError } = await supabase
            .from('password_security')
            .select('password_hash, password_history_hashes, failed_attempts, locked_until')
            .eq('user_id', userId)
            .single();

        if (fetchError) {
            console.error('Password fetch error:', fetchError);
            return res.status(500).json({ error: 'Failed to verify current password' });
        }

        // Check if account is locked
        if (currentSecurity.locked_until && new Date(currentSecurity.locked_until) > new Date()) {
            return res.status(423).json({ error: 'Account is temporarily locked due to too many failed attempts' });
        }

        // Verify current password
        const isCurrentValid = await bcrypt.compare(currentPassword, currentSecurity.password_hash);
        if (!isCurrentValid) {
            // Increment failed attempts
            const newFailedAttempts = (currentSecurity.failed_attempts || 0) + 1;
            const lockUntil = newFailedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 min lock

            await supabase
                .from('password_security')
                .update({ 
                    failed_attempts: newFailedAttempts,
                    locked_until: lockUntil
                })
                .eq('user_id', userId);

            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Check if new password was used recently
        const historyHashes = currentSecurity.password_history_hashes || [];
        for (const oldHash of historyHashes) {
            if (await bcrypt.compare(newPassword, oldHash)) {
                return res.status(400).json({ error: 'Cannot reuse recent passwords' });
            }
        }

        // Generate new password hash
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        const newSalt = await bcrypt.genSalt(saltRounds);

        // Update password history (keep last 5)
        const updatedHistory = [currentSecurity.password_hash, ...historyHashes].slice(0, 5);

        // Update password security
        const { error: updateError } = await supabase
            .from('password_security')
            .update({
                password_hash: newPasswordHash,
                password_salt: newSalt,
                password_history_hashes: updatedHistory,
                last_password_change: new Date().toISOString(),
                failed_attempts: 0,
                locked_until: null,
                requires_change: false
            })
            .eq('user_id', userId);

        if (updateError) {
            console.error('Password update error:', updateError);
            return res.status(500).json({ error: 'Failed to update password' });
        }

        // Log security event
        await supabase.from('security_events').insert({
            user_id: userId,
            event_type: 'password_changed',
            event_description: 'User changed password',
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Password strength check
router.post('/password/strength', (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[@$!%*?&]/.test(password),
            common: !['password', '123456', 'qwerty', 'admin', 'welcome'].includes(password.toLowerCase())
        };

        const score = Object.values(checks).filter(Boolean).length;
        let strength = 'weak';
        if (score >= 5) strength = 'strong';
        else if (score >= 3) strength = 'medium';

        res.json({
            strength,
            score,
            checks,
            requirements: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumber: true,
                requireSpecial: true,
                noCommonPasswords: true
            }
        });

    } catch (error) {
        console.error('Password strength check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * User Personas Routes
 */

// Get user personas
router.get('/personas', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: personas, error } = await supabase
            .from('user_personas')
            .select('*')
            .eq('user_id', userId)
            .order('is_primary', { ascending: false });

        if (error) {
            console.error('Personas fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch personas' });
        }

        res.json({ personas: personas || [] });

    } catch (error) {
        console.error('Get personas error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add new persona
router.post('/personas', authenticateToken, async (req, res) => {
    try {
        const { persona_role, entity_name } = req.body;
        const userId = req.user.id;

        if (!persona_role) {
            return res.status(400).json({ error: 'Persona role is required' });
        }

        // Check if persona already exists
        const { data: existing } = await supabase
            .from('user_personas')
            .select('id')
            .eq('user_id', userId)
            .eq('persona_role', persona_role)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Persona role already exists for this user' });
        }

        // Check if this is first persona (make it primary)
        const { count } = await supabase
            .from('user_personas')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

        const isPrimary = count === 0;

        const { data: persona, error } = await supabase
            .from('user_personas')
            .insert({
                user_id: userId,
                persona_role,
                entity_name,
                is_primary: isPrimary,
                verification_status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Persona creation error:', error);
            return res.status(500).json({ error: 'Failed to create persona' });
        }

        // Log security event
        await supabase.from('security_events').insert({
            user_id: userId,
            event_type: 'persona_added',
            event_description: `Added new persona: ${persona_role}`,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        res.status(201).json({ persona });

    } catch (error) {
        console.error('Add persona error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Set primary persona
router.put('/personas/:id/primary', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify persona belongs to user
        const { data: persona, error: fetchError } = await supabase
            .from('user_personas')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !persona) {
            return res.status(404).json({ error: 'Persona not found' });
        }

        // Remove primary status from all user personas
        await supabase
            .from('user_personas')
            .update({ is_primary: false })
            .eq('user_id', userId);

        // Set this persona as primary
        const { error: updateError } = await supabase
            .from('user_personas')
            .update({ is_primary: true })
            .eq('id', id);

        if (updateError) {
            console.error('Primary persona update error:', updateError);
            return res.status(500).json({ error: 'Failed to set primary persona' });
        }

        res.json({ message: 'Primary persona updated successfully' });

    } catch (error) {
        console.error('Set primary persona error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Security Events Routes
 */

// Get security events (admin only)
router.get('/events', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, severity, event_type } = req.query;
        
        // Check if user is admin
        if (req.user.registration_role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        let query = supabase
            .from('security_events')
            .select('*, users!inner(email, full_name)', { count: 'exact' });

        if (severity) query = query.eq('severity', severity);
        if (event_type) query = query.eq('event_type', event_type);

        const { data: events, error, count } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) {
            console.error('Security events fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch security events' });
        }

        res.json({
            events: events || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('Get security events error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Error Logging Routes
 */

// Log frontend error
router.post('/errors', async (req, res) => {
    try {
        const { error_type, error_message, stack_trace, user_agent, severity = 'error' } = req.body;
        const userId = req.user?.id || null;

        if (!error_type || !error_message) {
            return res.status(400).json({ error: 'Error type and message are required' });
        }

        const { error } = await supabase
            .from('error_logs')
            .insert({
                user_id: userId,
                error_type,
                error_message,
                stack_trace,
                user_agent: user_agent || req.headers['user-agent'],
                ip_address: req.ip,
                severity
            });

        if (error) {
            console.error('Error log insert failed:', error);
            return res.status(500).json({ error: 'Failed to log error' });
        }

        res.status(201).json({ message: 'Error logged successfully' });

    } catch (error) {
        console.error('Error logging failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;