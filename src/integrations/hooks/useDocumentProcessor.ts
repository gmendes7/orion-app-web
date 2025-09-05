import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessDocumentRequest {
  content: string;
  title: string;
  document_type: string;
}

export interface ProcessDocumentResponse {
  success: boolean;
  document_id?: string;
  chunks_created?: number;
  error?: string;
}

export const useDocumentProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processDocument = async (
    content: string,
    title: string,
    documentType: string = 'text'
  ): Promise<ProcessDocumentResponse> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('process-document', {
        body: {
          content,
          title,
          document_type: documentType,
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao processar documento');
      }

      return data as ProcessDocumentResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar documento';
      setError(errorMessage);
      console.error('Document processing error:', err);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const clearError = () => setError(null);

  return {
    processDocument,
    isProcessing,
    error,
    clearError,
  };
};