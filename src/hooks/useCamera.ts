/**
 * 📷 useCamera - Hook para captura e análise de imagens
 * 
 * Funcionalidades:
 * - Acesso à câmera do dispositivo
 * - Captura de foto
 * - Upload de imagem existente
 * - Integração com análise de IA
 */

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CameraState = "idle" | "requesting" | "active" | "capturing" | "analyzing" | "error";

interface CameraAnalysis {
  description: string;
  elements: string[];
  suggestions: string[];
  rawResponse: string;
}

interface UseCameraProps {
  onAnalysisComplete?: (analysis: CameraAnalysis) => void;
  onError?: (error: string) => void;
}

export const useCamera = ({ onAnalysisComplete, onError }: UseCameraProps = {}) => {
  const [state, setState] = useState<CameraState>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [lastCapture, setLastCapture] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<CameraAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  /**
   * Solicita acesso à câmera
   */
  const requestCamera = useCallback(async (facingMode: "user" | "environment" = "environment") => {
    if (!isSupported) {
      const errMsg = "Câmera não suportada neste dispositivo";
      setError(errMsg);
      onError?.(errMsg);
      setState("error");
      return false;
    }

    setState("requesting");
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setState("active");

      // Conectar ao elemento de vídeo se existir
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      console.log("📷 Câmera ativada com sucesso");
      return true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erro ao acessar câmera";
      setError(errMsg);
      onError?.(errMsg);
      setState("error");
      console.error("❌ Erro ao acessar câmera:", err);
      return false;
    }
  }, [isSupported, onError]);

  /**
   * Para a câmera
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState("idle");
    console.log("📷 Câmera desativada");
  }, [stream]);

  /**
   * Captura uma foto da câmera ativa
   */
  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || state !== "active") {
      return null;
    }

    setState("capturing");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Definir dimensões do canvas baseado no vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame atual
    ctx.drawImage(video, 0, 0);

    // Converter para base64
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setLastCapture(imageData);
    setState("active");

    console.log("📸 Foto capturada");
    return imageData;
  }, [state]);

  /**
   * Analisa uma imagem usando IA
   */
  const analyzeImage = useCallback(async (imageBase64: string, prompt?: string): Promise<CameraAnalysis | null> => {
    setState("analyzing");
    setError(null);

    try {
      // Remover prefixo data:image se existir
      const base64Data = imageBase64.includes(",") 
        ? imageBase64.split(",")[1] 
        : imageBase64;

      const { data, error: apiError } = await supabase.functions.invoke("analyze-image", {
        body: {
          image: base64Data,
          prompt: prompt || "Analise esta imagem detalhadamente. Identifique elementos, texto, código, erros visuais ou qualquer informação relevante.",
        },
      });

      if (apiError) throw apiError;

      const analysis: CameraAnalysis = {
        description: data?.analysis || "Análise não disponível",
        elements: data?.elements || [],
        suggestions: data?.suggestions || [],
        rawResponse: JSON.stringify(data),
      };

      setLastAnalysis(analysis);
      onAnalysisComplete?.(analysis);
      setState("active");

      console.log("🔍 Análise concluída:", analysis.description.substring(0, 100));
      return analysis;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erro ao analisar imagem";
      setError(errMsg);
      onError?.(errMsg);
      setState("error");
      console.error("❌ Erro na análise:", err);
      return null;
    }
  }, [onAnalysisComplete, onError]);

  /**
   * Captura e analisa em uma única operação
   */
  const captureAndAnalyze = useCallback(async (prompt?: string): Promise<CameraAnalysis | null> => {
    const photo = capturePhoto();
    if (!photo) {
      const errMsg = "Falha ao capturar foto";
      setError(errMsg);
      onError?.(errMsg);
      return null;
    }
    return analyzeImage(photo, prompt);
  }, [capturePhoto, analyzeImage, onError]);

  /**
   * Processa um arquivo de imagem (upload)
   */
  const processImageFile = useCallback(async (file: File, prompt?: string): Promise<CameraAnalysis | null> => {
    setState("analyzing");

    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setLastCapture(base64);
        const analysis = await analyzeImage(base64, prompt);
        resolve(analysis);
      };

      reader.onerror = () => {
        const errMsg = "Erro ao ler arquivo de imagem";
        setError(errMsg);
        onError?.(errMsg);
        setState("error");
        resolve(null);
      };

      reader.readAsDataURL(file);
    });
  }, [analyzeImage, onError]);

  /**
   * Define referências dos elementos de vídeo e canvas
   */
  const setVideoRef = useCallback((ref: HTMLVideoElement | null) => {
    videoRef.current = ref;
    if (ref && stream) {
      ref.srcObject = stream;
    }
  }, [stream]);

  const setCanvasRef = useCallback((ref: HTMLCanvasElement | null) => {
    canvasRef.current = ref;
  }, []);

  return {
    // Estado
    state,
    stream,
    lastCapture,
    lastAnalysis,
    error,
    isSupported,
    
    // Estados derivados
    isActive: state === "active",
    isAnalyzing: state === "analyzing",
    isCapturing: state === "capturing",
    
    // Ações
    requestCamera,
    stopCamera,
    capturePhoto,
    analyzeImage,
    captureAndAnalyze,
    processImageFile,
    
    // Refs
    setVideoRef,
    setCanvasRef,
  };
};
