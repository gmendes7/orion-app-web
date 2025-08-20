import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UploadState = "idle" | "uploading" | "analyzing" | "complete" | "error";

interface UploadedImage {
  file: File;
  preview: string;
  analysis?: string;
}

interface UseImageUploadProps {
  maxSize?: number; // in MB
  allowedTypes?: string[];
  onAnalysisComplete?: (analysis: string) => void;
}

export const useImageUpload = ({
  maxSize = 10,
  allowedTypes = ["image/jpeg", "image/png", "image/webp"],
  onAnalysisComplete,
}: UseImageUploadProps = {}) => {
  const [state, setState] = useState<UploadState>("idle");
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado. Use: ${allowedTypes.join(", ")}`;
    }

    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxSize}MB`;
    }

    return null;
  };

  const uploadImage = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setState("error");
      return;
    }

    setState("uploading");
    setError(null);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      
      setUploadedImage({
        file,
        preview,
      });

      setState("analyzing");

      // Convert to base64 for analysis
      const base64 = await fileToBase64(file);
      
      // Call analysis function
      const { data, error: analysisError } = await supabase.functions.invoke(
        "analyze-image",
        {
          body: { 
            image: base64,
            filename: file.name 
          },
        }
      );

      if (analysisError) {
        throw new Error(analysisError.message);
      }

      const analysis = data?.analysis || "Imagem analisada com sucesso";
      
      setUploadedImage(prev => prev ? { ...prev, analysis } : null);
      onAnalysisComplete?.(analysis);
      setState("complete");

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao processar imagem";
      setError(errorMessage);
      setState("error");
    }
  }, [maxSize, allowedTypes, onAnalysisComplete]);

  const clearImage = useCallback(() => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
    setError(null);
    setState("idle");
  }, [uploadedImage]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  return {
    state,
    uploadedImage,
    error,
    uploadImage,
    clearImage,
    isUploading: state === "uploading",
    isAnalyzing: state === "analyzing",
    isComplete: state === "complete",
  };
};