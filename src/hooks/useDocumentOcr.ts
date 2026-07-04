/**
 * useDocumentOcr — React Hooks for Gap 8: Document Management & OCR
 *
 * Real Supabase data hooks. No mock data.
 *
 * Exports:
 *  - useDocumentVault     — CRUD for documents + upload + download + verify
 *  - useDocumentVersions  — Version history for a selected document
 *  - useOcrJobs           — OCR job list + trigger + cancel
 *  - useOcrResults        — Per-job or per-document extracted data
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  fetchDocuments,
  fetchDocumentDashboard,
  uploadDocument,
  updateDocument,
  deleteDocument,
  archiveDocument,
  verifyDocument,
  getDocumentUrl,
  fetchDocumentVersions,
  fetchOcrJobs,
  triggerOcrJob,
  cancelOcrJob,
  fetchOcrResults,
  fetchDocumentOcrResults,
  logDocumentAccess,
} from '@/services/document-ocr-service';
import type {
  DocumentVault,
  DocumentDashboard,
  DocumentCategory,
  ComplianceDomain,
  DocumentStatus,
  DocumentVersion,
  OcrJob,
  OcrResult,
  OcrEngine,
} from '@/services/document-ocr-service';

// ─── useDocumentVault ────────────────────────────────────────────────────────

export function useDocumentVault(caUserId: string) {
  const [documents, setDocuments] = useState<DocumentVault[]>([]);
  const [dashboard, setDashboard] = useState<DocumentDashboard[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async (opts?: {
    category?: DocumentCategory;
    status?: DocumentStatus;
    domain?: ComplianceDomain;
    fy?: string;
    search?: string;
  }) => {
    if (!caUserId) return;
    setLoading(true);
    try {
      const [docs, dash] = await Promise.all([
        fetchDocuments(caUserId, opts),
        fetchDocumentDashboard(caUserId),
      ]);
      setDocuments(docs);
      setDashboard(dash);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      toast.error('Failed to load documents', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [caUserId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upload = useCallback(
    async (file: File, params: Parameters<typeof uploadDocument>[2]) => {
      try {
        const result = await uploadDocument(caUserId, file, params);
        toast.success('Document uploaded', { description: file.name });
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Upload failed', { description: err.message });
        throw err;
      }
    },
    [caUserId, refetch]
  );

  const edit = useCallback(
    async (id: string, updates: Partial<DocumentVault>) => {
      try {
        const result = await updateDocument(id, updates);
        toast.success('Document updated');
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to update document', { description: err.message });
        throw err;
      }
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteDocument(id);
        toast.success('Document deleted');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to delete document', { description: err.message });
      }
    },
    [refetch]
  );

  const archive = useCallback(
    async (id: string) => {
      try {
        await archiveDocument(id);
        toast.success('Document archived');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to archive document', { description: err.message });
      }
    },
    [refetch]
  );

  const verify = useCallback(
    async (id: string) => {
      try {
        await verifyDocument(id, caUserId);
        toast.success('Document verified');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to verify document', { description: err.message });
      }
    },
    [caUserId, refetch]
  );

  const download = useCallback(
    async (doc: DocumentVault) => {
      try {
        const url = await getDocumentUrl(doc.storage_path, doc.storage_bucket);
        await logDocumentAccess(doc.id, caUserId, 'download');
        window.open(url, '_blank');
      } catch (err: any) {
        toast.error('Download failed', { description: err.message });
      }
    },
    [caUserId]
  );

  return { documents, dashboard, loading, refetch, upload, edit, remove, archive, verify, download };
}

// ─── useDocumentVersions ─────────────────────────────────────────────────────

export function useDocumentVersions(documentId: string | null) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!documentId) {
      setVersions([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchDocumentVersions(documentId);
      setVersions(data);
    } catch (err: any) {
      console.error('Failed to fetch versions:', err);
      toast.error('Failed to load versions', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { versions, loading, refetch };
}

// ─── useOcrJobs ──────────────────────────────────────────────────────────────

export function useOcrJobs(caUserId: string, documentId?: string | null) {
  const [jobs, setJobs] = useState<OcrJob[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!caUserId) return;
    setLoading(true);
    try {
      const data = await fetchOcrJobs(caUserId, {
        documentId: documentId ?? undefined,
      });
      setJobs(data);
    } catch (err: any) {
      console.error('Failed to fetch OCR jobs:', err);
      toast.error('Failed to load OCR jobs', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [caUserId, documentId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const trigger = useCallback(
    async (docId: string, params?: { ocr_engine?: OcrEngine; language_hints?: string[] }) => {
      try {
        const result = await triggerOcrJob(caUserId, docId, params);
        toast.success('OCR job triggered', { description: `Job ${result.id.slice(0, 8)}… queued` });
        await refetch();
        return result;
      } catch (err: any) {
        toast.error('Failed to trigger OCR', { description: err.message });
        throw err;
      }
    },
    [caUserId, refetch]
  );

  const cancel = useCallback(
    async (jobId: string) => {
      try {
        await cancelOcrJob(jobId);
        toast.success('OCR job cancelled');
        await refetch();
      } catch (err: any) {
        toast.error('Failed to cancel OCR job', { description: err.message });
      }
    },
    [refetch]
  );

  return { jobs, loading, refetch, trigger, cancel };
}

// ─── useOcrResults ───────────────────────────────────────────────────────────

export function useOcrResults(ocrJobId: string | null, documentId?: string | null) {
  const [results, setResults] = useState<OcrResult[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!ocrJobId && !documentId) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      let data: OcrResult[];
      if (ocrJobId) {
        data = await fetchOcrResults(ocrJobId);
      } else if (documentId) {
        data = await fetchDocumentOcrResults(documentId);
      } else {
        data = [];
      }
      setResults(data);
    } catch (err: any) {
      console.error('Failed to fetch OCR results:', err);
      toast.error('Failed to load OCR results', { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [ocrJobId, documentId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { results, loading, refetch };
}

// Re-export types
export type {
  DocumentVault,
  DocumentDashboard,
  DocumentCategory,
  ComplianceDomain,
  DocumentStatus,
  DocumentVersion,
  OcrJob,
  OcrResult,
  OcrEngine,
};
