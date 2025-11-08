-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for message embeddings
CREATE TABLE IF NOT EXISTS public.message_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id)
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS message_embeddings_embedding_idx 
ON public.message_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS message_embeddings_user_id_idx 
ON public.message_embeddings(user_id);

-- Create index for conversation queries
CREATE INDEX IF NOT EXISTS message_embeddings_conversation_id_idx 
ON public.message_embeddings(conversation_id);

-- Enable RLS
ALTER TABLE public.message_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own message embeddings"
ON public.message_embeddings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own message embeddings"
ON public.message_embeddings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to search similar messages
CREATE OR REPLACE FUNCTION public.search_similar_messages(
  query_embedding vector(1536),
  user_id_param UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  exclude_conversation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  message_id UUID,
  conversation_id UUID,
  content TEXT,
  is_user BOOLEAN,
  similarity_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS message_id,
    m.conversation_id,
    m.content,
    m.is_user,
    1 - (me.embedding <=> query_embedding) AS similarity_score,
    m.created_at
  FROM message_embeddings me
  JOIN messages m ON me.message_id = m.id
  WHERE me.user_id = user_id_param
    AND (exclude_conversation_id IS NULL OR me.conversation_id != exclude_conversation_id)
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;