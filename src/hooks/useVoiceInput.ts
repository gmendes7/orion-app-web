import { useState, useCallback, useRef } from "react";

export type VoiceState = "idle" | "listening" | "processing" | "error";

interface UseVoiceInputProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

export const useVoiceInput = ({
  onResult,
  onError,
  language = "pt-BR",
}: UseVoiceInputProps) => {
  const [state, setState] = useState<VoiceState>("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  const startListening = useCallback(async () => {
    if (!isSupported) {
      onError?.("Reconhecimento de voz não é suportado neste navegador");
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setState("listening");
      };

      recognition.onresult = (event) => {
        setState("processing");
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setState("idle");
      };

      recognition.onerror = (event) => {
        setState("error");
        const errorMessage = event.error === "no-speech" 
          ? "Nenhuma fala detectada. Tente novamente."
          : `Erro no reconhecimento de voz: ${event.error}`;
        onError?.(errorMessage);
        setTimeout(() => setState("idle"), 2000);
      };

      recognition.onend = () => {
        if (state === "listening") {
          setState("idle");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      setState("error");
      onError?.("Erro ao acessar o microfone. Verifique as permissões.");
      setTimeout(() => setState("idle"), 2000);
    }
  }, [isSupported, language, onResult, onError, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setState("idle");
    }
  }, []);

  return {
    state,
    isSupported,
    startListening,
    stopListening,
    isListening: state === "listening",
    isProcessing: state === "processing",
  };
};