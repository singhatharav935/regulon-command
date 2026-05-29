/**
 * Regulatory Version & Change-Log — Service Layer (Gap 5)
 * Real Supabase queries only. No mock data.
 */
import { supabase } from '@/integrations/supabase/client';
import { handleServiceError } from '@/lib/safe-query';

export interface RegulatoryNews {
  id: string;
  title: string;
  authority: string;
  authority_code: string;
  category: string;
  effective_date: string;
  published_date: string;
  summary: string;
  full_text: string | null;
  source_url: string | null;
  impact_level: 'critical' | 'high' | 'medium' | 'low';
  affected_sectors: string[];
  affected_companies: string[];
  required_actions: string[];
  penalty_max: string | null;
  penalty_late_fee: string | null;
  related_filings: string[];
  ai_summary: string | null;
  ai_impact_analysis: string | null;
  version: number;
  change_summary: string;
  updated_by: string | null;
  updated_at: string;
  created_at?: string;
}

export interface RegulatoryNewsVersion {
  id: string;
  news_id: string;
  version: number;
  title: string;
  authority: string;
  authority_code: string;
  category: string;
  effective_date: string;
  published_date: string;
  summary: string;
  full_text: string | null;
  source_url: string | null;
  impact_level: string;
  affected_sectors: string[];
  affected_companies: string[];
  required_actions: string[];
  penalty_max: string | null;
  penalty_late_fee: string | null;
  related_filings: string[];
  ai_summary: string | null;
  ai_impact_analysis: string | null;
  change_summary: string;
  created_by: string | null;
  created_at: string;
}

export interface CompanyEvaluation {
  id: string;
  news_id: string;
  company_id: string;
  matched_version: number;
  evaluation_status: 'pending_review' | 'compliant' | 'action_required' | 'non_compliant';
  matched_reason: string;
  notification_sent: boolean;
  notified_at: string | null;
  notes: string | null;
  evaluated_at: string;
  updated_at: string;
  // Joined fields
  company_name?: string;
  company_industry?: string;
}

// ─── Fetch Regulatory News with Active Version ──────────────────────────────

export async function fetchRegulatoryNewsList(): Promise<RegulatoryNews[]> {
  const { data, error } = await supabase
    .from('regulatory_news_feed')
    .select('*')
    .order('published_date', { ascending: false });

  if (error) return handleServiceError(error, []);
  return (data || []) as RegulatoryNews[];
}

export async function fetchRegulatoryNewsItem(id: string): Promise<RegulatoryNews> {
  const { data, error } = await supabase
    .from('regulatory_news_feed')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return handleServiceError(error, []);
  return data as RegulatoryNews;
}

// ─── Add or Update Regulatory News (Bumps Version) ──────────────────────────

export async function createRegulatoryNews(news: Partial<RegulatoryNews>): Promise<RegulatoryNews> {
  const { data: { user } } = await supabase.auth.getUser();
  const insertPayload = {
    ...news,
    version: 1,
    change_summary: news.change_summary || 'Initial publication',
    updated_by: user?.id || null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('regulatory_news_feed')
    .insert(insertPayload as any)
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data as RegulatoryNews;
}

export async function updateRegulatoryNews(
  id: string,
  updates: Partial<RegulatoryNews>,
  changeSummary: string
): Promise<RegulatoryNews> {
  const { data: { user } } = await supabase.auth.getUser();
  
  // First fetch old rule to get current version
  const oldItem = await fetchRegulatoryNewsItem(id);
  const nextVersion = oldItem.version + 1;

  const updatePayload = {
    ...updates,
    version: nextVersion,
    change_summary: changeSummary || `Update to version ${nextVersion}`,
    updated_by: user?.id || null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('regulatory_news_feed')
    .update(updatePayload as any)
    .eq('id', id)
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data as RegulatoryNews;
}

// ─── Fetch Historical Versions ──────────────────────────────────────────────

export async function fetchNewsVersions(newsId: string): Promise<RegulatoryNewsVersion[]> {
  const { data, error } = await supabase
    .from('regulatory_news_versions')
    .select('*')
    .eq('news_id', newsId)
    .order('version', { ascending: false });

  if (error) return handleServiceError(error, []);
  return (data || []) as RegulatoryNewsVersion[];
}

// ─── Fetch Company Evaluations (Affected Clients) ───────────────────────────

export async function fetchCompanyEvaluations(newsId: string): Promise<CompanyEvaluation[]> {
  const { data, error } = await supabase
    .from('company_regulatory_evaluations')
    .select(`
      *,
      companies:company_id (
        name,
        industry
      )
    `)
    .eq('news_id', newsId)
    .order('updated_at', { ascending: false });

  if (error) return handleServiceError(error, []);

  return (data || []).map((row: any) => ({
    ...row,
    company_name: row.companies?.name || 'Unknown Company',
    company_industry: row.companies?.industry || 'Unknown Sector'
  })) as CompanyEvaluation[];
}

export async function updateEvaluationStatus(
  evaluationId: string,
  status: CompanyEvaluation['evaluation_status'],
  notes?: string
): Promise<CompanyEvaluation> {
  const { data, error } = await supabase
    .from('company_regulatory_evaluations')
    .update({
      evaluation_status: status,
      notes: notes || null,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', evaluationId)
    .select()
    .single();

  if (error) return handleServiceError(error, []);
  return data as CompanyEvaluation;
}

export async function sendRegulatoryNotification(evaluationId: string): Promise<void> {
  // Simulates sending SMS/Email/WhatsApp notification to client and updates flag
  const { error } = await supabase
    .from('company_regulatory_evaluations')
    .update({
      notification_sent: true,
      notified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', evaluationId);

  if (error) return handleServiceError(error, []);
}
