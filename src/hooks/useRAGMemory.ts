import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SimilarMessage {
  message_id: string;
  conversation_id: string;
  content: string;
  is_user: boolean;
  similarity_score: number;
  created_at: string;
}

export interface RAGMemoryStats {
  totalEmbeddings: number;
  lastUpdated: string | null;
}

export const useRAGMemory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RAGMemoryStats>({
    totalEmbeddings: 0,
    lastUpdated: null,
  });

  /**
   * Busca mensagens similares baseado em um texto
   */
  const searchSimilarMessages = useCallback(
    async (
      queryText: string,
      options: {
        matchThreshold?: number;
        matchCount?: number;
        excludeConversationId?: string;
      } = {}
    ): Promise<SimilarMessage[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error('Usuário não autenticado');
        }

        // Generate embedding for the query
        const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
          'generate-embedding',
          {
            body: {
              text: queryText,
              generate_only: true, // Flag to just generate, not store
            },
          }
        );

        if (embeddingError) throw embeddingError;

        // Search for similar messages using the embedding
        const { data: similarMessages, error: searchError } = await supabase.rpc(
          'search_similar_messages',
          {
            query_embedding: embeddingData.embedding,
            user_id_param: userData.user.id,
            match_threshold: options.matchThreshold || 0.7,
            match_count: options.matchCount || 5,
            exclude_conversation_id: options.excludeConversationId || null,
          }
        );

        if (searchError) throw searchError;

        return similarMessages || [];
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar memória';
        setError(errorMessage);
        console.error('RAG Memory error:', err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Busca estatísticas da memória RAG do usuário
   */
  const fetchMemoryStats = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { count, error: countError } = await supabase
        .from('message_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.user.id);

      if (countError) throw countError;

      const { data: lastEmbedding, error: lastError } = await supabase
        .from('message_embeddings')
        .select('created_at')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastError && lastEmbedding) {
        setStats({
          totalEmbeddings: count || 0,
          lastUpdated: lastEmbedding.created_at,
        });
      } else {
        setStats({
          totalEmbeddings: count || 0,
          lastUpdated: null,
        });
      }
    } catch (err) {
      console.error('Error fetching memory stats:', err);
    }
  }, []);

  const clearError = () => setError(null);

  return {
    searchSimilarMessages,
    fetchMemoryStats,
    isLoading,
    error,
    clearError,
    stats,
  };
};
