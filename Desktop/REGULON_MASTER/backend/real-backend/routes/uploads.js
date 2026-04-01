/**
 * File Upload API Routes
 * Handles document uploads with validation and storage
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { supabase } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.UPLOAD_ALLOWED_TYPES?.split(',') || 
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
  
  const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExt} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files at once
  }
});

// Validation schemas
const documentMetadataSchema = Joi.object({
  company_id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(200).optional(),
  regulator: Joi.string().max(100).optional(),
  description: Joi.string().max(1000).optional(),
  document_type: Joi.string().valid(
    'compliance_certificate', 
    'financial_statement', 
    'audit_report', 
    'license', 
    'registration', 
    'other'
  ).default('other')
});

// POST /api/v1/uploads/documents - Upload documents
router.post('/documents', authenticateToken, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one file to upload'
      });
    }

    // Validate metadata
    const { error, value } = documentMetadataSchema.validate(req.body);
    if (error) {
      // Clean up uploaded files on validation error
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    // Verify user has access to company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, owner_id, assigned_ca_id')
      .eq('id', value.company_id)
      .single();

    if (companyError || !company) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      return res.status(404).json({
        error: 'Company not found'
      });
    }

    // Check if user has permission to upload to this company
    const userRole = req.user.role;
    const userId = req.user.userId;
    
    if (userRole === 'company_owner' && company.owner_id !== userId) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only upload documents for your own company'
      });
    }

    if ((userRole === 'external_ca' || userRole === 'in_house_ca') && 
        company.assigned_ca_id !== userId && userRole !== 'admin') {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only upload documents for companies assigned to you'
      });
    }

    // Process each uploaded file
    const documents = [];
    
    for (const file of req.files) {
      try {
        const documentData = {
          company_id: value.company_id,
          name: value.name || file.originalname,
          file_type: path.extname(file.originalname).toLowerCase().substring(1),
          file_url: `/uploads/${file.filename}`,
          regulator: value.regulator,
          description: value.description,
          status: 'pending',
          uploaded_by: userId,
          file_size: file.size,
          original_name: file.originalname,
          mime_type: file.mimetype,
          created_at: new Date().toISOString()
        };

        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert(documentData)
          .select('*')
          .single();

        if (docError) {
          console.error('Document creation error:', docError);
          // Clean up file on database error
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          continue;
        }

        documents.push(document);

        // Create audit event
        await supabase.from('audit_events').insert({
          user_id: userId,
          event_type: 'document_uploaded',
          event_data: {
            document_id: document.id,
            company_id: value.company_id,
            file_name: file.originalname,
            file_size: file.size,
            uploaded_at: new Date().toISOString()
          }
        });

      } catch (fileError) {
        console.error('File processing error:', fileError);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    if (documents.length === 0) {
      return res.status(500).json({
        error: 'Failed to process any files',
        message: 'All file uploads failed'
      });
    }

    res.status(201).json({
      message: `${documents.length} document(s) uploaded successfully`,
      documents,
      uploaded_count: documents.length,
      total_files: req.files.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to upload documents'
    });
  }
});

// GET /api/v1/uploads/documents/:id/download - Download document
router.get('/documents/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get document info
    const { data: document, error } = await supabase
      .from('documents')
      .select(`
        *,
        company:company_id(id, owner_id, assigned_ca_id)
      `)
      .eq('id', id)
      .single();

    if (error || !document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Check access permissions
    const userRole = req.user.role;
    const userId = req.user.userId;
    const company = document.company;

    if (userRole === 'company_owner' && company.owner_id !== userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    if ((userRole === 'external_ca' || userRole === 'in_house_ca') && 
        company.assigned_ca_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Build file path
    const filePath = path.join(process.cwd(), 'uploads', path.basename(document.file_url));
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file could not be found on the server'
      });
    }

    // Create audit event
    await supabase.from('audit_events').insert({
      user_id: userId,
      event_type: 'document_downloaded',
      event_data: {
        document_id: id,
        company_id: document.company_id,
        file_name: document.name,
        downloaded_at: new Date().toISOString()
      }
    });

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_name || document.name}"`);
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to download document'
    });
  }
});

// DELETE /api/v1/uploads/documents/:id - Delete document
router.delete('/documents/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get document info
    const { data: document, error } = await supabase
      .from('documents')
      .select(`
        *,
        company:company_id(id, owner_id, assigned_ca_id)
      `)
      .eq('id', id)
      .single();

    if (error || !document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Check permissions (only owner, assigned CA, or admin can delete)
    const userRole = req.user.role;
    const userId = req.user.userId;
    const company = document.company;

    if (userRole !== 'admin' && 
        !(userRole === 'company_owner' && company.owner_id === userId) &&
        !(userRole === 'external_ca' && company.assigned_ca_id === userId)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to delete this document'
      });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        error: 'Failed to delete document',
        message: deleteError.message
      });
    }

    // Delete physical file
    const filePath = path.join(process.cwd(), 'uploads', path.basename(document.file_url));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (fileError) {
        console.error('File deletion error:', fileError);
        // Continue even if file deletion fails
      }
    }

    // Create audit event
    await supabase.from('audit_events').insert({
      user_id: userId,
      event_type: 'document_deleted',
      event_data: {
        document_id: id,
        company_id: document.company_id,
        file_name: document.name,
        deleted_at: new Date().toISOString()
      }
    });

    res.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete document'
    });
  }
});

export default router;