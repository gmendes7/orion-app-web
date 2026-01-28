/**
 * 🎙️ Enhanced Voice Assistant Hook
 * 
 * Features:
 * - Speech Recognition (STT) with Web Speech API
 * - Text-to-Speech (TTS) with natural voices
 * - Command detection with customizable triggers
 * - Continuous listening mode with wake word
 * - Audio level monitoring
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";

// ============= TYPES =============

export type VoiceMode = "idle" | "listening" | "processing" | "speaking" | "error";

export interface VoiceCommand {
  trigger: string[];
  action: string;
  handler?: () => void;
  response?: string;
}

export interface VoiceConfig {
  language: string;
  voiceName?: string;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
  continuousMode: boolean;
  wakeWord: string;
  silenceTimeout: number;
}

interface UseVoiceAssistantProps {
  onTranscript?: (text: string) => void;
  onCommand?: (command: string, transcript: string) => void;
  onError?: (error: string) => void;
  onModeChange?: (mode: VoiceMode) => void;
  config?: Partial<VoiceConfig>;
}

// ============= DEFAULT CONFIG =============

const DEFAULT_CONFIG: VoiceConfig = {
  language: "pt-BR",
  voiceRate: 1.0,
  voicePitch: 1.0,
  voiceVolume: 1.0,
  continuousMode: false,
  wakeWord: "orion",
  silenceTimeout: 3000,
};

// ============= DEFAULT COMMANDS =============

const DEFAULT_COMMANDS: VoiceCommand[] = [
  { 
    trigger: ["parar", "pare", "stop", "cancelar"], 
    action: "stop",
    response: "Entendido."
  },
  { 
    trigger: ["enviar", "send", "mandar"], 
    action: "send" 
  },
  { 
    trigger: ["limpar", "clear", "apagar"], 
    action: "clear",
    response: "Limpo."
  },
  { 
    trigger: ["analisar tela", "analise isso", "o que você vê", "veja isso"], 
    action: "analyze_screen",
    response: "Analisando..."
  },
  { 
    trigger: ["modo engenharia", "modo código", "modo dev"], 
    action: "mode_engineering",
    response: "Modo engenharia ativado."
  },
  { 
    trigger: ["modo planejamento", "modo arquitetura", "modo design"], 
    action: "mode_planning",
    response: "Modo planejamento ativado."
  },
  { 
    trigger: ["modo debug", "modo depuração", "encontrar erro"], 
    action: "mode_debugging",
    response: "Modo debug ativado."
  },
  { 
    trigger: ["modo análise", "analisar código"], 
    action: "mode_analysis",
    response: "Modo análise ativado."
  },
  { 
    trigger: ["quem é você", "quem te criou", "qual seu nome"], 
    action: "identity" 
  },
];

// ============= HOOK =============

export const useVoiceAssistant = (props: UseVoiceAssistantProps = {}) => {
  const {
    onTranscript,
    onCommand,
    onError,
    onModeChange,
  } = props;

  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...props.config,
  }), [props.config]);

  // State
  const [mode, setModeState] = useState<VoiceMode>("idle");
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Capabilities check
  const isSpeechSupported = useMemo(() => 
    typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
    []
  );
  
  const isTTSSupported = useMemo(() => 
    typeof window !== "undefined" && "speechSynthesis" in window,
    []
  );

  // ============= MODE MANAGEMENT =============

  const setMode = useCallback((newMode: VoiceMode) => {
    setModeState(newMode);
    onModeChange?.(newMode);
  }, [onModeChange]);

  // ============= COMMAND DETECTION =============

  const detectCommand = useCallback((text: string): VoiceCommand | null => {
    const lowerText = text.toLowerCase().trim();
    
    for (const cmd of DEFAULT_COMMANDS) {
      for (const trigger of cmd.trigger) {
        if (lowerText.includes(trigger.toLowerCase())) {
          return cmd;
        }
      }
    }
    return null;
  }, []);

  // ============= SPEECH RECOGNITION =============

  const createRecognition = useCallback(() => {
    if (!isSpeechSupported) return null;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = config.continuousMode;
    recognition.interimResults = true;
    recognition.lang = config.language;
    recognition.maxAlternatives = 1;

    return recognition;
  }, [isSpeechSupported, config.continuousMode, config.language]);

  const startListening = useCallback(async () => {
    if (!isSpeechSupported) {
      const errMsg = "Reconhecimento de voz não suportado neste navegador";
      onError?.(errMsg);
      setMode("error");
      return false;
    }

    // Stop TTS if speaking
    if (isTTSSupported) {
      window.speechSynthesis.cancel();
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio level monitoring
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Start audio level animation
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const recognition = createRecognition();
      if (!recognition) return false;

      recognition.onstart = () => {
        setMode("listening");
        console.log("🎙️ Escutando...");
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        const resultIndex = (event as SpeechRecognitionEvent & { resultIndex?: number }).resultIndex ?? 0;

        for (let i = resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update transcript in real-time
        const currentTranscript = finalTranscript || interimTranscript;
        setLastTranscript(currentTranscript);

        // Reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (finalTranscript) {
          setMode("processing");
          
          // Check wake word if required
          if (config.wakeWord && !isWakeWordActive) {
            if (finalTranscript.toLowerCase().includes(config.wakeWord.toLowerCase())) {
              setIsWakeWordActive(true);
              console.log("🔔 Wake word detectado!");
              speak("Sim, estou ouvindo.");
              return;
            }
          }

          // Detect and handle commands
          const command = detectCommand(finalTranscript);
          if (command) {
            console.log("📢 Comando:", command.action);
            if (command.response) {
              speak(command.response);
            }
            onCommand?.(command.action, finalTranscript);
            command.handler?.();
          } else {
            onTranscript?.(finalTranscript);
          }

          // Reset wake word after processing (unless continuous)
          if (!config.continuousMode) {
            setIsWakeWordActive(false);
          }
        }

        // Set silence timer
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && !config.continuousMode) {
            recognitionRef.current.stop();
          }
        }, config.silenceTimeout);
      };

      recognition.onerror = (event) => {
        console.error("❌ Erro no reconhecimento:", event.error);
        
        if (event.error !== "no-speech" && event.error !== "aborted") {
          setMode("error");
          onError?.(`Erro de reconhecimento: ${event.error}`);
          setTimeout(() => setMode("idle"), 2000);
        }
      };

      recognition.onend = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
        
        // Restart if in continuous mode
        if (config.continuousMode && mode !== "error") {
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch {
                // Already running
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
      const errMsg = error instanceof Error ? error.message : "Erro ao acessar microfone";
      onError?.(errMsg);
      setMode("error");
      console.error("❌ Erro de microfone:", error);
      return false;
    }
  }, [
    isSpeechSupported, 
    isTTSSupported, 
    createRecognition, 
    config, 
    isWakeWordActive, 
    mode, 
    detectCommand, 
    onCommand, 
    onTranscript, 
    onError,
    setMode,
  ]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setAudioLevel(0);
    setMode("idle");
    setIsWakeWordActive(false);
    console.log("🔇 Parou de escutar");
  }, [setMode]);

  // ============= TEXT TO SPEECH =============

  const getPreferredVoice = useCallback(() => {
    if (!isTTSSupported) return null;

    const voices = window.speechSynthesis.getVoices();
    
    // Try specific voice name
    if (config.voiceName) {
      const specific = voices.find(v => v.name.includes(config.voiceName!));
      if (specific) return specific;
    }

    // Prefer Portuguese voices
    const ptVoices = voices.filter(v => v.lang.startsWith("pt"));
    if (ptVoices.length > 0) {
      // Prefer Brazilian Portuguese
      const brVoice = ptVoices.find(v => v.lang === "pt-BR");
      if (brVoice) return brVoice;
      return ptVoices[0];
    }

    // Fallback to default
    return voices[0] || null;
  }, [isTTSSupported, config.voiceName]);

  const speak = useCallback((text: string, options?: Partial<VoiceConfig>) => {
    if (!isTTSSupported || isMuted) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.language;
    utterance.rate = options?.voiceRate ?? config.voiceRate;
    utterance.pitch = options?.voicePitch ?? config.voicePitch;
    utterance.volume = options?.voiceVolume ?? config.voiceVolume;

    const voice = getPreferredVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setMode("speaking");
    utterance.onend = () => setMode("idle");
    utterance.onerror = (event) => {
      console.error("❌ Erro TTS:", event);
      setMode("idle");
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    console.log("🔊 Falando:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));
  }, [isTTSSupported, isMuted, config, getPreferredVoice, setMode]);

  const stopSpeaking = useCallback(() => {
    if (isTTSSupported) {
      window.speechSynthesis.cancel();
    }
    setMode("idle");
  }, [isTTSSupported, setMode]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) stopSpeaking();
      return !prev;
    });
  }, [stopSpeaking]);

  // ============= EFFECTS =============

  // Load voices when available
  useEffect(() => {
    if (isTTSSupported) {
      const loadVoices = () => window.speechSynthesis.getVoices();
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isTTSSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopListening, stopSpeaking]);

  // ============= RETURN =============

  return {
    // State
    mode,
    lastTranscript,
    isWakeWordActive,
    isMuted,
    audioLevel,
    
    // Capabilities
    isSpeechSupported,
    isTTSSupported,
    
    // Derived states
    isListening: mode === "listening",
    isSpeaking: mode === "speaking",
    isProcessing: mode === "processing",
    isError: mode === "error",
    isIdle: mode === "idle",
    
    // STT Actions
    startListening,
    stopListening,
    
    // TTS Actions
    speak,
    stopSpeaking,
    toggleMute,
    
    // Utils
    detectCommand,
  };
};

export default useVoiceAssistant;
