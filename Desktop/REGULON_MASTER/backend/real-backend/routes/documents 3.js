/**
 * Documents Routes
 * Document management endpoints
 */

import { Router } from 'express';
import { supabase } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all document routes
router.use(authenticateToken);

// GET /api/v1/documents
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { company_id } = req.query;

    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by company if specified and user has access
    if (company_id) {
      // Check if user has access to this company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, owner_id, assigned_ca_id')
        .eq('id', company_id)
        .single();

      if (companyError || !company) {
        return res.status(404).json({
          error: 'Company not found'
        });
      }

      // Check access rights
      const hasAccess = company.owner_id === userId || 
                       company.assigned_ca_id === userId ||
                       req.user.role === 'admin';

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this company\'s documents'
        });
      }

      query = query.eq('company_id', company_id);
    } else {
      // Filter documents based on user role
      if (req.user.role === 'company_owner') {
        // Get user's company documents
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', userId)
          .single();

        if (company) {
          query = query.eq('company_id', company.id);
        } else {
          // No company, return empty
          return res.json({ documents: [] });
        }
      } else if (['external_ca', 'in_house_ca', 'ca_firm'].includes(req.user.role)) {
        // Get documents for companies assigned to this CA
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('assigned_ca_id', userId);

        const companyIds = companies?.map(c => c.id) || [];
        if (companyIds.length > 0) {
          query = query.in('company_id', companyIds);
        } else {
          return res.json({ documents: [] });
        }
      }
      // Admin can see all documents (no additional filter)
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('Documents fetch error:', error);
      return res.status(500).json({
        error: 'Failed to fetch documents',
        message: error.message
      });
    }

    res.json({ documents: documents || [] });

  } catch (error) {
    console.error('Documents error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load documents'
    });
  }
});

// POST /api/v1/documents/upload
router.post('/upload', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      company_id, 
      name, 
      file_type, 
      regulator, 
      description,
      file_url // In real implementation, this would come from file upload service
    } = req.body;

    if (!company_id || !name || !file_url) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'company_id, name, and file_url are required'
      });
    }

    // Verify user has access to this company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, owner_id, assigned_ca_id')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return res.status(404).json({
        error: 'Company not found'
      });
    }

    const hasAccess = company.owner_id === userId || 
                     company.assigned_ca_id === userId ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to upload documents for this company'
      });
    }

    // Create document record
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        company_id,
        name,
        file_type,
        regulator,
        description,
        file_url,
        status: 'pending',
        uploaded_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Document creation error:', error);
      return res.status(500).json({
        error: 'Failed to upload document',
        message: error.message
      });
    }

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to upload document'
    });
  }
});

// PUT /api/v1/documents/:documentId/status
router.put('/:documentId/status', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: pending, under_review, approved, rejected'
      });
    }

    // Get document and verify access
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        id,
        company_id,
        companies!documents_company_id_fkey (
          owner_id,
          assigned_ca_id
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    const hasAccess = document.companies.owner_id === userId || 
                     document.companies.assigned_ca_id === userId ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to modify this document'
      });
    }

    // Update document status
    const { data: updatedDocument, error } = await supabase
      .from('documents')
      .update({
        status,
        notes,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('Document update error:', error);
      return res.status(500).json({
        error: 'Failed to update document',
        message: error.message
      });
    }

    res.json({
      message: 'Document status updated successfully',
      document: updatedDocument
    });

  } catch (error) {
    console.error('Document status update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update document status'
    });
  }
});

export default router;