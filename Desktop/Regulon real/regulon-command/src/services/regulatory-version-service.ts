/**
 * Regulatory Version & Change-Log — Service Layer (Gap 5)
 * Maps to actual deployed schema in regulatory_news_feed:
 *   id, title, source, url, summary, regulator, category,
 *   published_at, scraped_at, is_breaking, created_at
 *
 * company_regulatory_evaluations actual columns:
 *   id, company_id, regulator, evaluation_date, result, score, notes, created_at
 */
import { supabase } from '@/integrations/supabase/client';
import { handleServiceError } from '@/lib/safe-query';

export interface RegulatoryNews {
  id: string;
  title: string;
  source: string;
  url: string | null;
  summary: string | null;
  regulator: string | null;
  category: string | null;
  published_at: string | null;
  scraped_at: string | null;
  is_breaking: boolean;
  created_at: string;
  // computed/ui helpers
  authority?: string;
  authority_code?: string;
  effective_date?: string;
  impact_level?: 'critical' | 'high' | 'medium' | 'low';
  affected_sectors?: string[];
  version?: number;
}

export interface RegulatoryNewsVersion {
  id: string;
  news_id: string;
  version: number;
  content: any;
  diff_summary: string | null;
  created_at: string;
}

export interface CompanyEvaluation {
  id: string;
  company_id: string;
  regulator: string | null;
  evaluation_date: string | null;
  result: string | null;
  score: number | null;
  notes: string | null;
  created_at: string;
  // Joined fields
  company_name?: string;
  company_industry?: string;
}

// ─── Fetch Regulatory News ──────────────────────────────────────────────────

export async function fetchRegulatoryNewsList(): Promise<RegulatoryNews[]> {
  try {
    const { data, error } = await supabase
      .from('regulatory_news_feed')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) return handleServiceError(error, []);
    return (data || []) as RegulatoryNews[];
  } catch {
    return [];
  }
}

export async function fetchRegulatoryNewsItem(id: string): Promise<RegulatoryNews | null> {
  try {
    const { data, error } = await supabase
      .from('regulatory_news_feed')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as RegulatoryNews;
  } catch {
    return null;
  }
}

// ─── Add or Update Regulatory News ─────────────────────────────────────────

export async function createRegulatoryNews(news: Partial<RegulatoryNews>): Promise<RegulatoryNews | null> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const insertPayload = {
      title: news.title || '',
      source: news.source || '',
      url: news.url || null,
      summary: news.summary || null,
      regulator: news.regulator || news.authority || null,
      category: news.category || null,
      published_at: (news as any).published_at || new Date().toISOString(),
      is_breaking: news.is_breaking || false,
    };

    const { data, error } = await supabase
      .from('regulatory_news_feed')
      .insert(insertPayload as any)
      .select()
      .single();

    if (error) return handleServiceError(error, null);
    return data as RegulatoryNews;
  } catch {
    return null;
  }
}

export async function updateRegulatoryNews(
  id: string,
  updates: Partial<RegulatoryNews>,
  _changeSummary?: string
): Promise<RegulatoryNews | null> {
  try {
    const updatePayload: any = {};
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.source !== undefined) updatePayload.source = updates.source;
    if (updates.url !== undefined) updatePayload.url = updates.url;
    if (updates.summary !== undefined) updatePayload.summary = updates.summary;
    if (updates.regulator !== undefined) updatePayload.regulator = updates.regulator;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.is_breaking !== undefined) updatePayload.is_breaking = updates.is_breaking;

    const { data, error } = await supabase
      .from('regulatory_news_feed')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return handleServiceError(error, null);
    return data as RegulatoryNews;
  } catch {
    return null;
  }
}

// ─── Fetch Historical Versions ──────────────────────────────────────────────

export async function fetchNewsVersions(newsId: string): Promise<RegulatoryNewsVersion[]> {
  try {
    const { data, error } = await supabase
      .from('regulatory_news_versions')
      .select('*')
      .eq('news_id', newsId)
      .order('version', { ascending: false });

    if (error) return handleServiceError(error, []);
    return (data || []) as RegulatoryNewsVersion[];
  } catch {
    return [];
  }
}

// ─── Fetch Company Evaluations ───────────────────────────────────────────────

export async function fetchCompanyEvaluations(regulatorOrNewsId?: string): Promise<CompanyEvaluation[]> {
  try {
    let query = supabase
      .from('company_regulatory_evaluations')
      .select(`
        *,
        companies:company_id (
          name,
          industry
        )
      `)
      .order('created_at', { ascending: false });

    if (regulatorOrNewsId) {
      query = query.eq('regulator', regulatorOrNewsId);
    }

    const { data, error } = await query;
    if (error) return handleServiceError(error, []);

    return (data || []).map((row: any) => ({
      ...row,
      company_name: row.companies?.name || 'Unknown Company',
      company_industry: row.companies?.industry || 'Unknown Sector',
    })) as CompanyEvaluation[];
  } catch {
    return [];
  }
}

export async function updateEvaluationStatus(
  evaluationId: string,
  result: string,
  notes?: string
): Promise<CompanyEvaluation | null> {
  try {
    const { data, error } = await supabase
      .from('company_regulatory_evaluations')
      .update({
        result,
        notes: notes || null,
      } as any)
      .eq('id', evaluationId)
      .select()
      .single();

    if (error) return handleServiceError(error, null);
    return data as CompanyEvaluation;
  } catch {
    return null;
  }
}

export async function sendRegulatoryNotification(_evaluationId: string): Promise<void> {
  // Notification sending is handled server-side via edge functions
  // No client-side DB update needed
}
