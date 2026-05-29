/**
 * Document Management & OCR — Service Layer (Gap 8)
 *
 * Real Supabase queries for document vault CRUD, version management,
 * OCR job processing via Edge Functions, result querying, and access logging.
 * No mock data.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/lib/uuid-guard';
import { handleServiceError } from '@/lib/safe-query';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentCategory =
  | 'general' | 'invoice' | 'receipt' | 'challan' | 'notice' | 'return'
  | 'certificate' | 'agreement' | 'boa_resolution' | 'kyc' | 'pan_card'
  | 'aadhaar' | 'gst_certificate' | 'incorporation' | 'audit_report'
  | 'balance_sheet' | 'profit_loss' | 'bank_statement' | 'tds_certificate'
  | 'form_16' | 'itr' | 'annual_return' | 'moa_aoa' | 'other';

export type ComplianceDomain = 'gst' | 'income_tax' | 'mca' | 'rbi' | 'sebi' | 'customs' | 'labour' | 'other';
export type DocumentStatus = 'active' | 'archived' | 'processing' | 'deleted';
export type DocumentSource = 'upload' | 'scan' | 'email' | 'portal_download' | 'erp_sync' | 'api';
export type OcrEngine = 'google_vision' | 'aws_textract' | 'azure_form' | 'tesseract' | 'regulon_ai';
export type OcrJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type AccessAction = 'view' | 'download' | 'print' | 'share' | 'edit' | 'delete' | 'ocr_trigger' | 'verify' | 'archive';

export interface DocumentVault {
  id: string;
  ca_user_id: string;
  entity_id?: string;
  company_id?: string;
  title: string;
  description: string;
  file_name: string;
  file_extension: string;
  mime_type: string;
  file_size_bytes: number;
  storage_bucket: string;
  storage_path: string;
  thumbnail_path?: string;
  category: DocumentCategory;
  sub_category?: string;
  compliance_domain?: ComplianceDomain;
  financial_year?: string;
  assessment_year?: string;
  period_from?: string;
  period_to?: string;
  amount?: number;
  status: DocumentStatus;
  is_ocr_processed: boolean;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  tags: string[];
  source: DocumentSource;
  metadata: Record<string, unknown>;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_name: string;
  file_size_bytes: number;
  storage_path: string;
  mime_type: string;
  change_summary?: string;
  changed_by?: string;
  created_at: string;
}

export interface OcrJob {
  id: string;
  document_id: string;
  ca_user_id: string;
  ocr_engine: OcrEngine;
  language_hints: string[];
  processing_options: Record<string, unknown>;
  status: OcrJobStatus;
  progress_pct: number;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  pages_processed: number;
  total_pages: number;
  confidence_score?: number;
  word_count: number;
  error_message?: string;
  error_details?: Record<string, unknown>;
  retry_count: number;
  max_retries: number;
  created_at: string;
}

export interface OcrResult {
  id: string;
  ocr_job_id: string;
  document_id: string;
  page_number: number;
  raw_text?: string;
  raw_text_confidence?: number;
  extracted_fields: Record<string, string>;
  extracted_tables: Array<{ headers: string[]; rows: string[][] }>;
  detected_entities: Record<string, string[]>;
  bounding_boxes: unknown[];
  created_at: string;
}

export interface DocumentAccessLog {
  id: string;
  document_id: string;
  user_id: string;
  action: AccessAction;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DocumentDashboard {
  document_id: string;
  ca_user_id: string;
  title: string;
  file_name: string;
  file_extension: string;
  mime_type: string;
  file_size_bytes: number;
  category: DocumentCategory;
  sub_category?: string;
  compliance_domain?: ComplianceDomain;
  financial_year?: string;
  status: DocumentStatus;
  is_ocr_processed: boolean;
  is_verified: boolean;
  tags: string[];
  source: DocumentSource;
  current_version: number;
  created_at: string;
  updated_at: string;
  total_versions: number;
  ocr_job_count: number;
  last_ocr_status?: string;
  last_ocr_confidence?: number;
  total_accesses: number;
}

// ─── Category Metadata ────────────────────────────────────────────────────────

export const DOCUMENT_CATEGORIES: { id: DocumentCategory; label: string; icon: string; domain?: ComplianceDomain }[] = [
  { id: 'invoice', label: 'Invoice', icon: '🧾', domain: 'gst' },
  { id: 'receipt', label: 'Receipt', icon: '🧾' },
  { id: 'challan', label: 'Challan', icon: '📑', domain: 'gst' },
  { id: 'notice', label: 'Notice', icon: '📋' },
  { id: 'return', label: 'Return', icon: '📄' },
  { id: 'certificate', label: 'Certificate', icon: '📜' },
  { id: 'agreement', label: 'Agreement', icon: '📝' },
  { id: 'boa_resolution', label: 'Board Resolution', icon: '🏛️', domain: 'mca' },
  { id: 'kyc', label: 'KYC Document', icon: '🪪' },
  { id: 'pan_card', label: 'PAN Card', icon: '💳', domain: 'income_tax' },
  { id: 'aadhaar', label: 'Aadhaar', icon: '🆔' },
  { id: 'gst_certificate', label: 'GST Certificate', icon: '📋', domain: 'gst' },
  { id: 'incorporation', label: 'Incorporation', icon: '🏢', domain: 'mca' },
  { id: 'audit_report', label: 'Audit Report', icon: '📊' },
  { id: 'balance_sheet', label: 'Balance Sheet', icon: '📊' },
  { id: 'profit_loss', label: 'Profit & Loss', icon: '📈' },
  { id: 'bank_statement', label: 'Bank Statement', icon: '🏦' },
  { id: 'tds_certificate', label: 'TDS Certificate', icon: '📋', domain: 'income_tax' },
  { id: 'form_16', label: 'Form 16', icon: '📄', domain: 'income_tax' },
  { id: 'itr', label: 'ITR', icon: '📄', domain: 'income_tax' },
  { id: 'annual_return', label: 'Annual Return', icon: '📑', domain: 'mca' },
  { id: 'moa_aoa', label: 'MOA / AOA', icon: '📜', domain: 'mca' },
  { id: 'other', label: 'Other', icon: '📁' },
  { id: 'general', label: 'General', icon: '📁' },
];

export const OCR_ENGINES: { id: OcrEngine; name: string; description: string }[] = [
  { id: 'google_vision', name: 'Google Cloud Vision', description: 'High-accuracy OCR with multi-language support including Hindi, Tamil, Bengali' },
  { id: 'aws_textract', name: 'AWS Textract', description: 'Form and table extraction optimized for invoices and receipts' },
  { id: 'azure_form', name: 'Azure Form Recognizer', description: 'Pre-built models for Indian PAN, Aadhaar, GST certificates' },
  { id: 'tesseract', name: 'Tesseract OCR', description: 'Open-source OCR engine — runs locally, no cloud dependency' },
  { id: 'regulon_ai', name: 'Regulon AI OCR', description: 'Custom-trained model for Indian statutory documents' },
];

// ─── Documents ────────────────────────────────────────────────────────────────

export async function fetchDocuments(
  caUserId: string,
  opts?: { category?: DocumentCategory; status?: DocumentStatus; domain?: ComplianceDomain; fy?: string; search?: string; limit?: number }
): Promise<DocumentVault[]> {
  if (!isValidUUID(caUserId)) return [];
  let q = (supabase as any)
    .from('document_vault')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  if (opts?.category) q = q.eq('category', opts.category);
  if (opts?.status) q = q.eq('status', opts.status);
  if (opts?.domain) q = q.eq('compliance_domain', opts.domain);
  if (opts?.fy) q = q.eq('financial_year', opts.fy);
  if (opts?.search) q = q.or(`title.ilike.%${opts.search}%,file_name.ilike.%${opts.search}%`);
  if (opts?.limit) q = q.limit(opts.limit);
  else q = q.limit(100);

  const { data, error } = await q;
  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function fetchDocumentDashboard(caUserId: string): Promise<DocumentDashboard[]> {
  if (!isValidUUID(caUserId)) return [];
  const { data, error } = await (supabase as any)
    .from('document_vault_dashboard')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    // Fallback if view doesn't exist
    const docs = await fetchDocuments(caUserId);
    return docs.map((d) => ({
      document_id: d.id,
      ca_user_id: d.ca_user_id,
      title: d.title,
      file_name: d.file_name,
      file_extension: d.file_extension,
      mime_type: d.mime_type,
      file_size_bytes: d.file_size_bytes,
      category: d.category,
      sub_category: d.sub_category,
      compliance_domain: d.compliance_domain,
      financial_year: d.financial_year,
      status: d.status,
      is_ocr_processed: d.is_ocr_processed,
      is_verified: d.is_verified,
      tags: d.tags,
      source: d.source,
      current_version: d.current_version,
      created_at: d.created_at,
      updated_at: d.updated_at,
      total_versions: 1,
      ocr_job_count: 0,
      last_ocr_status: undefined,
      last_ocr_confidence: undefined,
      total_accesses: 0,
    }));
  }
  return data ?? [];
}

/**
 * Upload a document file to Supabase Storage and create the vault record.
 */
export async function uploadDocument(
  caUserId: string,
  file: File,
  params: {
    title: string;
    category: DocumentCategory;
    compliance_domain?: ComplianceDomain;
    financial_year?: string;
    tags?: string[];
    description?: string;
    entity_id?: string;
    company_id?: string;
  }
): Promise<DocumentVault> {
  if (!isValidUUID(caUserId)) throw new Error('Not authenticated');
  const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const storagePath = `${caUserId}/${Date.now()}_${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadErr } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  // Create vault record
  const { data, error: insertErr } = await (supabase as any)
    .from('document_vault')
    .insert([{
      ca_user_id: caUserId,
      title: params.title,
      description: params.description ?? '',
      file_name: file.name,
      file_extension: fileExt,
      mime_type: file.type || 'application/octet-stream',
      file_size_bytes: file.size,
      storage_bucket: 'documents',
      storage_path: storagePath,
      category: params.category,
      compliance_domain: params.compliance_domain ?? null,
      financial_year: params.financial_year ?? null,
      tags: params.tags ?? [],
      source: 'upload',
      entity_id: params.entity_id ?? null,
      company_id: params.company_id ?? null,
      status: 'active',
    }])
    .select()
    .single();

  if (insertErr) throw new Error(insertErr.message);

  // Create initial version record
  await (supabase as any)
    .from('document_versions')
    .insert([{
      document_id: data.id,
      version_number: 1,
      file_name: file.name,
      file_size_bytes: file.size,
      storage_path: storagePath,
      mime_type: file.type || 'application/octet-stream',
      change_summary: 'Initial upload',
      changed_by: caUserId,
    }]);

  return data;
}

export async function updateDocument(
  id: string,
  updates: Partial<DocumentVault>
): Promise<DocumentVault> {
  const { id: _id, ca_user_id: _ca, created_at: _cr, ...safeUpdates } = updates as any;

  const { data, error } = await (supabase as any)
    .from('document_vault')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  // Get storage path before deleting
  const { data: doc } = await (supabase as any)
    .from('document_vault')
    .select('storage_path, storage_bucket')
    .eq('id', id)
    .single();

  // Delete from storage
  if (doc?.storage_path) {
    await supabase.storage.from(doc.storage_bucket || 'documents').remove([doc.storage_path]);
  }

  // Delete vault record (cascades to versions, etc.)
  const { error } = await (supabase as any)
    .from('document_vault')
    .delete()
    .eq('id', id);

  if (error) return handleServiceError(error, []);
}

export async function archiveDocument(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('document_vault')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return handleServiceError(error, []);
}

export async function verifyDocument(id: string, userId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('document_vault')
    .update({
      is_verified: true,
      verified_by: userId,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return handleServiceError(error, []);
}

/**
 * Get a signed download URL for a document.
 */
export async function getDocumentUrl(storagePath: string, bucket = 'documents'): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) return handleServiceError(error, []);
  return data.signedUrl;
}

// ─── Versions ─────────────────────────────────────────────────────────────────

export async function fetchDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const { data, error } = await (supabase as any)
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

// ─── OCR Jobs ─────────────────────────────────────────────────────────────────

export async function fetchOcrJobs(
  caUserId: string,
  opts?: { documentId?: string; status?: OcrJobStatus; limit?: number }
): Promise<OcrJob[]> {
  if (!isValidUUID(caUserId)) return [];
  let q = (supabase as any)
    .from('ocr_jobs')
    .select('*')
    .eq('ca_user_id', caUserId)
    .order('created_at', { ascending: false });

  if (opts?.documentId) q = q.eq('document_id', opts.documentId);
  if (opts?.status) q = q.eq('status', opts.status);
  if (opts?.limit) q = q.limit(opts.limit);
  else q = q.limit(50);

  const { data, error } = await q;
  if (error) return handleServiceError(error, []);
  return data ?? [];
}

/**
 * Trigger OCR processing for a document.
 * Creates a job record and invokes the Edge Function.
 */
export async function triggerOcrJob(
  caUserId: string,
  documentId: string,
  params?: {
    ocr_engine?: OcrEngine;
    language_hints?: string[];
  }
): Promise<OcrJob> {
  if (!isValidUUID(caUserId)) throw new Error('Not authenticated');
  const engine = params?.ocr_engine ?? 'google_vision';
  const langs = params?.language_hints ?? ['eng', 'hin'];

  // Create job record
  const { data: job, error: insertErr } = await (supabase as any)
    .from('ocr_jobs')
    .insert([{
      document_id: documentId,
      ca_user_id: caUserId,
      ocr_engine: engine,
      language_hints: langs,
      processing_options: {},
      status: 'queued',
      progress_pct: 0,
      pages_processed: 0,
      total_pages: 0,
      word_count: 0,
      retry_count: 0,
      max_retries: 3,
    }])
    .select()
    .single();

  if (insertErr) throw new Error(insertErr.message);

  // Invoke Edge Function for OCR processing
  try {
    await supabase.functions.invoke('process-ocr', {
      body: {
        job_id: job.id,
        document_id: documentId,
        ocr_engine: engine,
        language_hints: langs,
      },
    });
  } catch {
    // Edge function not deployed — update job note
    await (supabase as any)
      .from('ocr_jobs')
      .update({
        error_message: 'Edge function process-ocr not deployed. Job queued for manual processing.',
      })
      .eq('id', job.id);
  }

  // Refetch
  const { data: updated } = await (supabase as any)
    .from('ocr_jobs')
    .select('*')
    .eq('id', job.id)
    .single();

  return updated ?? job;
}

export async function cancelOcrJob(jobId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('ocr_jobs')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) return handleServiceError(error, []);
}

// ─── OCR Results ──────────────────────────────────────────────────────────────

export async function fetchOcrResults(ocrJobId: string): Promise<OcrResult[]> {
  const { data, error } = await (supabase as any)
    .from('ocr_results')
    .select('*')
    .eq('ocr_job_id', ocrJobId)
    .order('page_number', { ascending: true });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

export async function fetchDocumentOcrResults(documentId: string): Promise<OcrResult[]> {
  const { data, error } = await (supabase as any)
    .from('ocr_results')
    .select('*')
    .eq('document_id', documentId)
    .order('page_number', { ascending: true });

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

// ─── Access Logs ──────────────────────────────────────────────────────────────

export async function logDocumentAccess(
  documentId: string,
  userId: string,
  action: AccessAction,
  metadata?: Record<string, unknown>
): Promise<void> {
  await (supabase as any)
    .from('document_access_logs')
    .insert([{
      document_id: documentId,
      user_id: userId,
      action: action,
      metadata: metadata ?? {},
    }]);
}

export async function fetchDocumentAccessLogs(documentId: string): Promise<DocumentAccessLog[]> {
  const { data, error } = await (supabase as any)
    .from('document_access_logs')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return handleServiceError(error, []);
  return data ?? [];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
