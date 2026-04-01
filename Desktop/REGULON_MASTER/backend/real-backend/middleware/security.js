/**
 * Enhanced Authentication Middleware
 * JWT refresh tokens, API key auth, and improved security
 */

import jwt from 'jsonwebtoken';
import { supabase } from '../server.js';

// Enhanced JWT token authentication with refresh support
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is blacklisted (for logout functionality)
    const { data: blacklistedToken } = await supabase
      .from('blacklisted_tokens')
      .select('id')
      .eq('token_hash', hashToken(token))
      .single();

    if (blacklistedToken) {
      return res.status(401).json({
        error: 'Token invalidated',
        message: 'Please log in again'
      });
    }

    // Verify user still exists and is active
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, registration_role, email_verified, account_status')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    if (user.account_status === 'suspended' || user.account_status === 'deactivated') {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      emailVerified: user.email_verified,
      tokenIssued: decoded.iat
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your token or log in again',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token malformed'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// API Key authentication for admin operations
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'X-API-Key header is required for this endpoint'
      });
    }

    // Check against system admin API key
    if (apiKey === process.env.ADMIN_API_KEY) {
      req.apiAuth = {
        type: 'system_admin',
        permissions: ['read', 'write', 'delete', 'admin']
      };
      return next();
    }

    // Check against database stored API keys
    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hashApiKey(apiKey))
      .eq('is_active', true)
      .single();

    if (error || !apiKeyRecord) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid or has been revoked'
      });
    }

    // Check expiration
    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      return res.status(401).json({
        error: 'API key expired',
        message: 'The API key has expired'
      });
    }

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id);

    req.apiAuth = {
      type: 'user_api_key',
      keyId: apiKeyRecord.id,
      userId: apiKeyRecord.user_id,
      permissions: apiKeyRecord.permissions || ['read'],
      rateLimit: apiKeyRecord.rate_limit
    };

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'API key authentication failed'
    });
  }
};

// Role-based access control with enhanced permissions
export const requireRole = (allowedRoles, permissions = []) => {
  return (req, res, next) => {
    // Check if using API key auth
    if (req.apiAuth) {
      // Check API key permissions
      const hasRequiredPermissions = permissions.every(perm => 
        req.apiAuth.permissions.includes(perm)
      );
      
      if (!hasRequiredPermissions) {
        return res.status(403).json({
          error: 'Insufficient API key permissions',
          message: `API key requires permissions: ${permissions.join(', ')}`
        });
      }
      
      return next();
    }

    // Standard JWT role check
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This endpoint requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }
    
    next();
  };
};

// Email verification requirement
export const requireEmailVerified = async (req, res, next) => {
  try {
    if (req.apiAuth) {
      // API key access bypasses email verification
      return next();
    }

    if (!req.user.emailVerified) {
      return res.status(403).json({
        error: 'Email verification required',
        message: 'Please verify your email before accessing this resource',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    console.error('Email verification check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify email status'
    });
  }
};

// Rate limiting per user/API key
export const createUserRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const userRequestCounts = new Map();

  return (req, res, next) => {
    const identifier = req.user?.userId || req.apiAuth?.keyId || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, data] of userRequestCounts.entries()) {
      if (data.windowStart < windowStart) {
        userRequestCounts.delete(key);
      }
    }

    // Check current user's request count
    const userRequests = userRequestCounts.get(identifier) || { count: 0, windowStart: now };
    
    if (userRequests.windowStart < windowStart) {
      userRequests.count = 1;
      userRequests.windowStart = now;
    } else {
      userRequests.count++;
    }

    userRequestCounts.set(identifier, userRequests);

    // Apply API key specific rate limits
    let effectiveMax = max;
    if (req.apiAuth && req.apiAuth.rateLimit) {
      effectiveMax = Math.min(max, req.apiAuth.rateLimit);
    }

    if (userRequests.count > effectiveMax) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    res.setHeader('X-RateLimit-Limit', effectiveMax);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, effectiveMax - userRequests.count));
    res.setHeader('X-RateLimit-Reset', new Date(userRequests.windowStart + windowMs).toISOString());

    next();
  };
};

// Request validation and sanitization
export const validateAndSanitizeInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      stripUnknown: true,
      abortEarly: false
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      });
    }

    // Replace request body with sanitized version
    req.body = value;
    next();
  };
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent content type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

// Helper functions
import crypto from 'crypto';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey + process.env.API_KEY_SALT).digest('hex');
}

export { hashToken, hashApiKey };