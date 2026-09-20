/**
 * form-pdf-utils.ts
 * Shared utility for compliance form PDF generation and
 * saving to the client's Supabase Storage data room.
 *
 * Used ONLY by the real CA dashboard (ca-dashboard/).
 * Demo dashboard never calls this file.
 */
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

export interface FormData {
  formId: string;
  formCode: string;        // e.g. "GSTR-1", "Form 3CD"
  formLabel: string;       // e.g. "GSTR-1 (Outward Sales Return)"
  clientId: string;
  clientName?: string;
  financialYear: string;   // e.g. "2024-25"
  data: Record<string, unknown>; // form-specific calculated data
}

export interface SaveResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

/**
 * Generates a standardised government-style PDF for a compliance form.
 * Returns the PDF as a Blob.
 */
export function buildFormPDF(form: FormData): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Header bar ──────────────────────────────────────────
  doc.setFillColor(15, 23, 42);     // slate-900
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SANNIDH COMPLIANCE PLATFORM', 14, 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Powered by AI · Human-Verified · Government Filing Ready', 14, 17);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 23);

  // ── Form title ──────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(form.formLabel, 14, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Form Code: ${form.formCode}`, 14, 50);
  doc.text(`Client ID: ${form.clientId}`, 14, 57);
  if (form.clientName) doc.text(`Client Name: ${form.clientName}`, 14, 64);
  doc.text(`Financial Year: ${form.financialYear}`, 14, 71);

  // ── Divider ─────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 76, 196, 76);

  // ── Data section ────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CALCULATED FORM DATA', 14, 85);

  let y = 95;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const entries = Object.entries(form.data);
  for (const [key, value] of entries) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    const label = key.replace(/_/g, ' ').toUpperCase();
    const val   = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(val, 140);
    doc.text(lines, 80, y);
    y += Math.max(6, lines.length * 5);
  }

  // ── Footer ──────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${form.formCode} · ${form.clientId} · FY ${form.financialYear} · Page ${i} of ${pageCount}`,
      14, 290
    );
    doc.text('Sannidh Compliance Platform · Confidential', 120, 290);
  }

  return doc.output('blob');
}

/**
 * Saves a generated PDF blob to Supabase Storage inside the client's data room folder.
 * Path: client-forms/{clientId}/{formId}_{FY}.pdf
 *
 * Also upserts a row in client_form_completions to record completion.
 */
export async function saveFormToDataRoom(form: FormData, pdfBlob: Blob): Promise<SaveResult> {
  const fileName = `${form.formId}_${form.financialYear.replace('-', '_')}.pdf`;
  const storagePath = `${form.clientId}/${fileName}`;

  try {
    // 1. Upload PDF to Supabase Storage bucket "client-forms"
    const { error: uploadError } = await supabase.storage
      .from('client-forms')
      .upload(storagePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('client-forms')
      .getPublicUrl(storagePath);

    const pdfUrl = urlData?.publicUrl ?? '';

    // 3. Upsert completion record in client_form_completions
    await supabase.from('client_form_completions').upsert({
      client_id: form.clientId,
      form_id: form.formId,
      form_code: form.formCode,
      form_label: form.formLabel,
      financial_year: form.financialYear,
      pdf_url: pdfUrl,
      calculated_at: new Date().toISOString(),
      data_snapshot: form.data,
    }, {
      onConflict: 'client_id,form_id,financial_year',
    });

    // 4. Update data room readiness score
    const { data: existing } = await supabase
      .from('client_notice_data_room')
      .select('total_modules_completed, compiled_modules')
      .eq('company_id', form.clientId)
      .maybeSingle();

    const currentCompleted = existing?.total_modules_completed ?? 0;
    const compiledModules  = (existing?.compiled_modules as Record<string, unknown>) ?? {};
    compiledModules[form.formId] = {
      form_code: form.formCode,
      pdf_url: pdfUrl,
      calculated_at: new Date().toISOString(),
    };

    await supabase.from('client_notice_data_room').upsert({
      company_id: form.clientId,
      financial_year: form.financialYear,
      total_modules_completed: currentCompleted + 1,
      compiled_modules: compiledModules,
      readiness_score: Math.min(100, Math.round(((currentCompleted + 1) / 75) * 100)),
    }, {
      onConflict: 'company_id,financial_year',
    });

    return { success: true, pdfUrl };
  } catch (err: unknown) {
    console.error(`[DataRoom] Failed to save ${form.formCode}:`, err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Fetches all completed forms for a client from Supabase.
 * Returns a map of formId → {pdf_url, calculated_at}
 */
export async function getClientFormCompletions(
  clientId: string,
  financialYear: string
): Promise<Record<string, { pdf_url: string; calculated_at: string }>> {
  try {
    const { data } = await supabase
      .from('client_form_completions')
      .select('form_id, pdf_url, calculated_at')
      .eq('client_id', clientId)
      .eq('financial_year', financialYear);

    const map: Record<string, { pdf_url: string; calculated_at: string }> = {};
    for (const row of data ?? []) {
      map[row.form_id] = { pdf_url: row.pdf_url, calculated_at: row.calculated_at };
    }
    return map;
  } catch {
    return {};
  }
}
