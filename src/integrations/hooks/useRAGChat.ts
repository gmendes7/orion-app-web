import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RAGMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RAGSource {
  document_id: string;
  document_title: string;
  similarity_score: number;
}

export interface RAGChatResponse {
  success: boolean;
  response: string;
  context_chunks_used: number;
  sources: RAGSource[];
  error?: string;
}

export const useRAGChat = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = async (
    query: string,
    conversationContext: RAGMessage[] = []
  ): Promise<RAGChatResponse> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('rag-chat', {
        body: {
          query,
          conversation_context: conversationContext,
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao gerar resposta RAG');
      }

      return data as RAGChatResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar resposta RAG';
      setError(errorMessage);
      console.error('RAG chat error:', err);
      return {
        success: false,
        response: 'Desculpe, não foi possível gerar uma resposta baseada nos seus documentos.',
        context_chunks_used: 0,
        sources: [],
        error: errorMessage,
      };
    } finally {
      setIsGenerating(false);
    }
  };

  const clearError = () => setError(null);

  return {
    generateResponse,
    isGenerating,
    error,
    clearError,
  };
};