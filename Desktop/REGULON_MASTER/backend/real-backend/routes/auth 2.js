/**
 * Authentication Routes
 * Handles user registration, login, and JWT token management
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { supabase } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().min(2).max(100).required(),
  registration_role: Joi.string().valid(
    'company_owner', 
    'external_ca', 
    'in_house_ca', 
    'admin', 
    'in_house_lawyer', 
    'ca_firm'
  ).required(),
  verification_entity_name: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password, full_name, registration_role, verification_entity_name } = value;

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
    if (existingUser.user) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: {
        full_name,
        registration_role,
        verification_entity_name,
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return res.status(500).json({
        error: 'Failed to create user account',
        message: authError.message
      });
    }

    // Create user profile in public.users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        registration_role,
        verification_entity_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_verified: true,
        profile_completed: false,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        error: 'Failed to create user profile',
        message: profileError.message
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: authData.user.id, 
        email, 
        role: registration_role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email,
        full_name,
        registration_role,
        verification_entity_name,
        email_verified: true,
      },
      token,
      expires_in: '7d'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create account'
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password } = value;

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({
        error: 'Failed to load user profile',
        message: profileError.message
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: authData.user.id, 
        email, 
        role: userProfile.registration_role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        registration_role: userProfile.registration_role,
        verification_entity_name: userProfile.verification_entity_name,
        email_verified: userProfile.email_verified,
        profile_completed: userProfile.profile_completed,
      },
      token,
      expires_in: '7d'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to log in'
    });
  }
});

// GET /api/v1/auth/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'User not found',
        message: error.message
      });
    }

    res.json({
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        registration_role: userProfile.registration_role,
        verification_entity_name: userProfile.verification_entity_name,
        email_verified: userProfile.email_verified,
        profile_completed: userProfile.profile_completed,
        created_at: userProfile.created_at,
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch profile'
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Sign out from Supabase (invalidates refresh token)
    const { error } = await supabase.auth.admin.signOut(req.user.userId);
    
    if (error) {
      console.error('Logout error:', error);
    }

    res.json({
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to log out'
    });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        error: 'Missing refresh token'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    
    if (error) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: error.message
      });
    }

    // Generate new JWT token
    const token = jwt.sign(
      { 
        userId: data.user.id, 
        email: data.user.email, 
        role: data.user.user_metadata.registration_role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token,
      expires_in: '7d'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to refresh token'
    });
  }
});

export default router;