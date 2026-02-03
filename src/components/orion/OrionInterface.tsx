/**
 * 🌟 OrionInterface - Interface Principal ORION
 * 
 * Interface imersiva, cinematográfica e futurista.
 * Foco em: Olho central, voz, sensorial.
 * 
 * SEM elementos tradicionais de dashboard.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useJarvis } from "@/contexts/JarvisContext";
import { useLocalChatStore } from "@/hooks/useLocalChatStore";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useCamera } from "@/hooks/useCamera";
import { useToast } from "@/integrations/hooks/use-toast";

import { OrionEye, OrionState } from "./OrionEye";
import { VoiceWaveform } from "./orion/VoiceWaveform";
import { ParticleField } from "./orion/ParticleField";
import { StatusIndicator } from "./orion/StatusIndicator";
import { CommandInput } from "./orion/CommandInput";
import { TranscriptDisplay } from "./orion/TranscriptDisplay";

export const OrionInterface = () => {
  const { toast } = useToast();
  const jarvis = useJarvis();
  
  const {
    initialize,
    messages,
    isTyping,
    isStreaming,
    sendMessage,
    stopStreaming,
    audioEnabled,
    setAudioEnabled,
  } = useLocalChatStore();

  // Estado visual da ORION
  const [orionState, setOrionState] = useState<OrionState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  // Voice assistant
  const voiceAssistant = useVoiceAssistant({
    onTranscript: (text) => {
      handleSendMessage(text);
    },
    onCommand: (command) => {
      handleVoiceCommand(command);
    },
    onError: (errorMsg) => {
      toast({
        title: "Erro de Voz",
        description: errorMsg,
        variant: "destructive",
      });
    },
    config: {
      wakeWord: "orion",
      language: "pt-BR",
    },
  });

  // Camera hook
  const camera = useCamera({
    onAnalysisComplete: (analysis) => {
      toast({
        title: "📷 Análise Concluída",
        description: analysis.description.substring(0, 100) + "...",
      });
      handleSendMessage(`[Análise Visual]\n${analysis.description}`);
    },
    onError: (errorMsg) => {
      toast({
        title: "Erro de Câmera",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  // Inicializar store
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Atualizar estado visual baseado no estado da IA
  useEffect(() => {
    if (isTyping || isStreaming) {
      setOrionState("thinking");
    } else if (voiceAssistant.isListening) {
      setOrionState("listening");
    } else if (voiceAssistant.isSpeaking) {
      setOrionState("speaking");
    } else if (camera.isAnalyzing) {
      setOrionState("analyzing");
    } else {
      setOrionState("idle");
    }
  }, [isTyping, isStreaming, voiceAssistant.isListening, voiceAssistant.isSpeaking, camera.isAnalyzing]);

  // Simular nível de áudio (em produção, usar Web Audio API real)
  useEffect(() => {
    if (voiceAssistant.isListening || voiceAssistant.isSpeaking) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.5 + 0.3);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0.1);
    }
  }, [voiceAssistant.isListening, voiceAssistant.isSpeaking]);

  // Handlers
  const handleSendMessage = useCallback((msg: string) => {
    jarvis.addToRecentTopics(msg.split(" ")[0]);
    const systemPrompt = jarvis.getSystemPrompt();
    sendMessage(msg, systemPrompt);
    setShowTranscript(true);
  }, [jarvis, sendMessage]);

  const handleVoiceCommand = useCallback((command: string) => {
    switch (command) {
      case "stop":
        stopStreaming();
        voiceAssistant.stopSpeaking();
        break;
      case "analyze_screen":
        camera.requestCamera();
        break;
      default:
        break;
    }
  }, [stopStreaming, voiceAssistant, camera]);

  const handleEyeClick = useCallback(() => {
    if (voiceAssistant.isListening) {
      voiceAssistant.stopListening();
    } else {
      voiceAssistant.startListening();
    }
  }, [voiceAssistant]);

  const handleVoiceToggle = useCallback(() => {
    if (voiceAssistant.isListening) {
      voiceAssistant.stopListening();
    } else {
      voiceAssistant.startListening();
    }
  }, [voiceAssistant]);

  // Transformar mensagens para o TranscriptDisplay
  const displayMessages = messages.map((msg) => ({
    id: msg.id,
    text: msg.text,
    isUser: msg.isUser,
    timestamp: new Date(msg.timestamp),
  }));

  return (
    <div className="relative w-full h-screen bg-orion-void overflow-hidden">
      {/* Partículas de fundo */}
      <ParticleField
        intensity={orionState === "idle" ? 0.3 : 0.7}
        color="255, 200, 50"
        particleCount={80}
      />

      {/* Gradiente de fundo */}
      <div className="absolute inset-0 bg-gradient-radial from-orion-void via-orion-void to-black opacity-90" />

      {/* Container principal */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        
        {/* Header minimalista */}
        <motion.header
          className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Logo/Nome */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-2xl font-light tracking-[0.3em] text-orion-stellar-gold">
              O.R.I.Ö.N
            </span>
            <span className="text-xs font-mono text-orion-stellar-gold/50 tracking-wider">
              v2.0
            </span>
          </motion.div>

          {/* Status indicators */}
          <StatusIndicator
            state={orionState}
            isListening={voiceAssistant.isListening}
            isCameraActive={camera.isActive}
            isAudioEnabled={audioEnabled}
            isConnected={true}
            memoryCount={messages.length}
          />
        </motion.header>

        {/* Área central - O Olho */}
        <div className="flex flex-col items-center justify-center flex-1 gap-8 max-w-2xl w-full">
          
          {/* O Olho da ORION */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 100,
              damping: 15,
              delay: 0.3 
            }}
          >
            <OrionEye
              state={orionState}
              audioLevel={audioLevel}
              onClick={handleEyeClick}
              size="xl"
            />
          </motion.div>

          {/* Waveform de voz */}
          <AnimatePresence>
            {(voiceAssistant.isListening || voiceAssistant.isSpeaking || isStreaming) && (
              <motion.div
                className="w-full h-24"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.3 }}
              >
                <VoiceWaveform
                  isActive={voiceAssistant.isListening || voiceAssistant.isSpeaking || isStreaming}
                  audioLevel={audioLevel}
                  isSpeaking={voiceAssistant.isSpeaking || isStreaming}
                  isListening={voiceAssistant.isListening}
                  className="w-full h-full rounded-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript (toggle) */}
          <AnimatePresence>
            {showTranscript && displayMessages.length > 0 && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <TranscriptDisplay
                  messages={displayMessages}
                  isTyping={isTyping}
                  className="w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mensagem de boas-vindas (só quando idle e sem mensagens) */}
          <AnimatePresence>
            {orionState === "idle" && messages.length === 0 && (
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-lg font-light text-orion-stellar-gold/80 mb-2">
                  Olá. Eu sou ORION.
                </p>
                <p className="text-sm text-muted-foreground">
                  Clique no olho ou use sua voz para começar.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input de comando (parte inferior) */}
        <motion.div
          className="absolute bottom-8 left-4 right-4 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <CommandInput
            onSend={handleSendMessage}
            onVoiceToggle={handleVoiceToggle}
            isListening={voiceAssistant.isListening}
            isProcessing={isTyping || isStreaming}
            placeholder="Digite ou fale..."
          />
        </motion.div>

        {/* Toggle transcript */}
        <motion.button
          className="absolute bottom-24 right-4 p-2 rounded-full bg-orion-stellar-gold/10 text-orion-stellar-gold/60 hover:bg-orion-stellar-gold/20 hover:text-orion-stellar-gold transition-all"
          onClick={() => setShowTranscript(!showTranscript)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xs font-mono">
            {showTranscript ? "OCULTAR" : "MOSTRAR"} TEXTO
          </span>
        </motion.button>

        {/* Footer minimalista */}
        <motion.footer
          className="absolute bottom-2 left-0 right-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
        >
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest">
            DESENVOLVIDO POR GABRIEL MENDES
          </p>
        </motion.footer>
      </div>

      {/* Overlay de câmera (quando ativa) */}
      <AnimatePresence>
        {camera.isActive && (
          <motion.div
            className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-orion-stellar-gold/30">
              <video
                ref={(ref) => camera.setVideoRef(ref)}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={(ref) => camera.setCanvasRef(ref)} className="hidden" />
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <motion.button
                  className="px-6 py-2 rounded-full bg-orion-stellar-gold text-orion-void font-medium"
                  onClick={() => camera.captureAndAnalyze()}
                  disabled={camera.isAnalyzing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {camera.isAnalyzing ? "Analisando..." : "📷 Capturar"}
                </motion.button>
                <motion.button
                  className="px-6 py-2 rounded-full border border-orion-stellar-gold/50 text-orion-stellar-gold"
                  onClick={() => camera.stopCamera()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✕ Fechar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrionInterface;
