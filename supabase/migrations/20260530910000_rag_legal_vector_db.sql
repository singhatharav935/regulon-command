-- Migration: RAG Vector Database for Indian Tax Law
-- Created: 2026-05-30
-- Description: Enables pgvector, creates the legal corpus table for semantic search,
--              and provides the similarity search RPC for the AI Drafting Engine.

-- 1. Enable the pgvector extension (Required for RAG)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- 2. Create the Legal Corpus Table
CREATE TABLE IF NOT EXISTS public.legal_corpus_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    act_name TEXT NOT NULL, -- e.g., 'CGST Act 2017', 'Income Tax Act 1961'
    section_reference TEXT NOT NULL, -- e.g., 'Section 16(2)', 'Section 143(1)'
    content TEXT NOT NULL, -- The actual legal text or simplified explanation
    category TEXT NOT NULL, -- e.g., 'GST', 'Direct Tax', 'Corporate Law', 'Labour Law'
    embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.legal_corpus_vectors ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- CAs can read the legal corpus
CREATE POLICY "Authenticated users can read legal corpus"
ON public.legal_corpus_vectors FOR SELECT TO authenticated
USING (true);

-- Only service role (Edge Functions) can insert/update the corpus
CREATE POLICY "Service role manages legal corpus"
ON public.legal_corpus_vectors FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 5. Create HNSW Index for ultra-fast semantic search
CREATE INDEX IF NOT EXISTS idx_legal_corpus_embedding ON public.legal_corpus_vectors 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 6. Create the Semantic Search RPC (Remote Procedure Call)
-- This function will be called by the ai-drafting-engine to find relevant laws
CREATE OR REPLACE FUNCTION public.match_legal_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  act_name text,
  section_reference text,
  content text,
  category text,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.act_name,
    l.section_reference,
    l.content,
    l.category,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM public.legal_corpus_vectors l
  WHERE 1 - (l.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR l.category = filter_category)
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
