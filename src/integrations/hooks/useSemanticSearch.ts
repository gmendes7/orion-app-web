import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  document_id: string;
  document_title: string;
  chunk_content: string;
  similarity_score: number;
  chunk_index: number;
}

export interface SemanticSearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  count: number;
  error?: string;
}

export const useSemanticSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (
    query: string,
    limit: number = 5,
    similarityThreshold: number = 0.7
  ): Promise<SemanticSearchResponse> => {
    setIsSearching(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('semantic-search', {
        body: {
          query,
          limit,
          similarity_threshold: similarityThreshold,
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro na pesquisa semântica');
      }

      return data as SemanticSearchResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na pesquisa semântica';
      setError(errorMessage);
      console.error('Semantic search error:', err);
      return {
        success: false,
        query,
        results: [],
        count: 0,
        error: errorMessage,
      };
    } finally {
      setIsSearching(false);
    }
  };

  const clearError = () => setError(null);

  return {
    search,
    isSearching,
    error,
    clearError,
  };
};