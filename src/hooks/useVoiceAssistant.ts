/**
 * 🎙️ useVoiceAssistant - Hook completo para assistente por voz
 * 
 * Combina:
 * - Reconhecimento de voz (STT)
 * - Síntese de voz (TTS) 
 * - Detecção de comandos
 * - Modo contínuo de escuta
 */

import { useState, useCallback, useRef, useEffect } from "react";

export type VoiceMode = "idle" | "listening" | "processing" | "speaking" | "error";

interface VoiceCommand {
  trigger: string[];
  action: string;
  handler?: () => void;
}

interface UseVoiceAssistantProps {
  onTranscript?: (text: string) => void;
  onCommand?: (command: string, transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
  voiceName?: string;
  voiceRate?: number;
  voicePitch?: number;
  continuousMode?: boolean;
  wakeWord?: string;
}

const DEFAULT_COMMANDS: VoiceCommand[] = [
  { trigger: ["parar", "pare", "stop"], action: "stop" },
  { trigger: ["cancelar", "cancel"], action: "cancel" },
  { trigger: ["enviar", "send", "mandar"], action: "send" },
  { trigger: ["limpar", "clear", "apagar"], action: "clear" },
  { trigger: ["analisar tela", "analise isso", "o que você vê"], action: "analyze_screen" },
  { trigger: ["modo engenharia", "modo código"], action: "mode_engineering" },
  { trigger: ["modo planejamento", "modo arquitetura"], action: "mode_planning" },
  { trigger: ["modo debug", "modo depuração"], action: "mode_debugging" },
];

export const useVoiceAssistant = ({
  onTranscript,
  onCommand,
  onError,
  language = "pt-BR",
  voiceName,
  voiceRate = 1.0,
  voicePitch = 1.0,
  continuousMode = false,
  wakeWord = "orion",
}: UseVoiceAssistantProps = {}) => {
  const [mode, setMode] = useState<VoiceMode>("idle");
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isListeningRef = useRef(false);

  const isSpeechSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const isTTSSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // ============= SPEECH TO TEXT =============

  const createRecognition = useCallback(() => {
    if (!isSpeechSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuousMode;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    return recognition;
  }, [isSpeechSupported, continuousMode, language]);

  const detectCommand = useCallback((text: string): VoiceCommand | null => {
    const lowerText = text.toLowerCase().trim();
    
    for (const cmd of DEFAULT_COMMANDS) {
      for (const trigger of cmd.trigger) {
        if (lowerText.includes(trigger)) {
          return cmd;
        }
      }
    }
    return null;
  }, []);

  const startListening = useCallback(async () => {
    if (!isSpeechSupported) {
      const errMsg = "Reconhecimento de voz não suportado";
      onError?.(errMsg);
      return false;
    }

    // Parar TTS se estiver falando
    if (isTTSSupported) {
      window.speechSynthesis.cancel();
    }

    try {
      // Solicitar permissão do microfone
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const recognition = createRecognition();
      if (!recognition) return false;

      recognition.onstart = () => {
        setMode("listening");
        isListeningRef.current = true;
        console.log("🎙️ Escutando...");
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        const results = event.results;
        // resultIndex may not be in TypeScript's type definition
        const resultIndex = (event as { resultIndex?: number }).resultIndex ?? 0;

        for (let i = resultIndex; i < results.length; i++) {
          const transcript = results[i][0].transcript;
          if (results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Atualizar transcript em tempo real
        const currentTranscript = finalTranscript || interimTranscript;
        setLastTranscript(currentTranscript);

        // Se temos resultado final
        if (finalTranscript) {
          setMode("processing");
          
          // Verificar wake word se necessário
          if (wakeWord && !isWakeWordActive) {
            if (finalTranscript.toLowerCase().includes(wakeWord.toLowerCase())) {
              setIsWakeWordActive(true);
              console.log("🔔 Wake word detectado!");
              speak("Sim, estou ouvindo.");
              return;
            }
          }

          // Detectar comandos
          const command = detectCommand(finalTranscript);
          if (command) {
            console.log("📢 Comando detectado:", command.action);
            onCommand?.(command.action, finalTranscript);
            command.handler?.();
          } else {
            onTranscript?.(finalTranscript);
          }

          // Reset wake word após processar
          if (!continuousMode) {
            setIsWakeWordActive(false);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("❌ Erro no reconhecimento:", event.error);
        
        if (event.error !== "no-speech" && event.error !== "aborted") {
          setMode("error");
          onError?.(`Erro: ${event.error}`);
          setTimeout(() => setMode("idle"), 2000);
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        
        // Reiniciar se em modo contínuo
        if (continuousMode && mode !== "error") {
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch {
                console.log("Reconhecimento já em execução");
              }
            }
          }, 100);
        } else {
          setMode("idle");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (error) {
      const errMsg = "Erro ao acessar microfone";
      onError?.(errMsg);
      setMode("error");
      console.error("❌", error);
      return false;
    }
  }, [isSpeechSupported, isTTSSupported, createRecognition, wakeWord, isWakeWordActive, continuousMode, mode, detectCommand, onCommand, onTranscript, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setMode("idle");
    setIsWakeWordActive(false);
    console.log("🔇 Parou de escutar");
  }, []);

  // ============= TEXT TO SPEECH =============

  const getPreferredVoice = useCallback(() => {
    if (!isTTSSupported) return null;

    const voices = window.speechSynthesis.getVoices();
    
    // Tentar encontrar voz específica
    if (voiceName) {
      const specific = voices.find(v => v.name === voiceName);
      if (specific) return specific;
    }

    // Preferir vozes em português
    const ptVoices = voices.filter(v => v.lang.startsWith("pt"));
    if (ptVoices.length > 0) {
      // Preferir vozes brasileiras
      const brVoice = ptVoices.find(v => v.lang === "pt-BR");
      if (brVoice) return brVoice;
      return ptVoices[0];
    }

    return voices[0] || null;
  }, [isTTSSupported, voiceName]);

  const speak = useCallback((text: string, options?: { rate?: number; pitch?: number }) => {
    if (!isTTSSupported || isMuted) return;

    // Cancelar fala anterior
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = options?.rate ?? voiceRate;
    utterance.pitch = options?.pitch ?? voicePitch;
    utterance.volume = 1;

    const voice = getPreferredVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setMode("speaking");
    };

    utterance.onend = () => {
      setMode("idle");
    };

    utterance.onerror = (event) => {
      console.error("❌ Erro TTS:", event);
      setMode("idle");
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    console.log("🔊 Falando:", text.substring(0, 50) + "...");
  }, [isTTSSupported, isMuted, language, voiceRate, voicePitch, getPreferredVoice]);

  const stopSpeaking = useCallback(() => {
    if (isTTSSupported) {
      window.speechSynthesis.cancel();
    }
    setMode("idle");
  }, [isTTSSupported]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (!isMuted) {
      stopSpeaking();
    }
  }, [isMuted, stopSpeaking]);

  // ============= EFEITOS =============

  // Carregar vozes quando disponíveis
  useEffect(() => {
    if (isTTSSupported) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isTTSSupported]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  return {
    // Estado
    mode,
    lastTranscript,
    isWakeWordActive,
    isMuted,
    
    // Suporte
    isSpeechSupported,
    isTTSSupported,
    
    // Estados derivados
    isListening: mode === "listening",
    isSpeaking: mode === "speaking",
    isProcessing: mode === "processing",
    
    // Ações STT
    startListening,
    stopListening,
    
    // Ações TTS
    speak,
    stopSpeaking,
    toggleMute,
    
    // Utilitários
    detectCommand,
  };
};
