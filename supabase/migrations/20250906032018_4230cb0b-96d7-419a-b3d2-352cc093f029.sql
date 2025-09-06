-- Create documents table for storing uploaded documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_chunks table for storing text chunks with embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DO $$ 
BEGIN
    -- Drop existing policies for documents
    DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
    DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
    DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
    DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
    
    -- Drop existing policies for document_chunks
    DROP POLICY IF EXISTS "Users can view chunks of their own documents" ON public.document_chunks;
    DROP POLICY IF EXISTS "Users can create chunks for their own documents" ON public.document_chunks;
END $$;

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for document chunks
CREATE POLICY "Users can view chunks of their own documents" 
ON public.document_chunks 
FOR SELECT 
USING (document_id IN (
  SELECT id FROM public.documents 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create chunks for their own documents" 
ON public.document_chunks 
FOR INSERT 
WITH CHECK (document_id IN (
  SELECT id FROM public.documents 
  WHERE user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);

-- Create function for semantic search
CREATE OR REPLACE FUNCTION public.search_documents(
  query_embedding vector(1536),
  user_id_param uuid,
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  document_id uuid,
  document_title text,
  chunk_content text,
  similarity_score float,
  chunk_index int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as document_id,
    d.title as document_title,
    dc.content as chunk_content,
    (1 - (dc.embedding <=> query_embedding)) as similarity_score,
    dc.chunk_index
  FROM public.document_chunks dc
  JOIN public.documents d ON dc.document_id = d.id
  WHERE d.user_id = user_id_param
    AND (1 - (dc.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;