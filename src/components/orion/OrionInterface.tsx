/**
 * 🌟 OrionInterface - Interface Principal ORION
 * 
 * Interface imersiva, cinematográfica e futurista.
 * Totalmente responsiva: desktop, tablet, mobile.
 * Mobile-first: voz ativa, texto oculto, interface limpa.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { useJarvis } from "@/contexts/JarvisContext";
import { useLocalChatStore } from "@/hooks/useLocalChatStore";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useCamera } from "@/hooks/useCamera";
import { useToast } from "@/integrations/hooks/use-toast";
import { useDeviceAdaptation } from "@/hooks/useDeviceAdaptation";
import { useProactiveOrion } from "@/hooks/useProactiveOrion";

import { OrionEye, OrionState } from "./OrionEye";
import { VoiceWaveform } from "./VoiceWaveform";
import { ParticleField } from "./ParticleField";
import { StatusIndicator } from "./StatusIndicator";
import { CommandInput } from "./CommandInput";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { CameraOverlay } from "./CameraOverlay";
import SpaceBackground from "@/components/SpaceBackground";

export const OrionInterface = () => {
  const { toast } = useToast();
  const jarvis = useJarvis();
  const prevMessagesLenRef = useRef(0);
  const device = useDeviceAdaptation();
  
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

  const [orionState, setOrionState] = useState<OrionState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  // Mobile: texto oculto por padrão
  const [showTranscript, setShowTranscript] = useState(!device.isMobile);

  // ElevenLabs TTS
  const tts = useElevenLabsTTS({
    onStart: () => setOrionState("speaking"),
    onEnd: () => {
      if (!voiceAssistant.isListening) setOrionState("idle");
    },
    onError: (error) => console.warn("⚠️ TTS Error:", error),
  });

  // Voice assistant
  const voiceAssistant = useVoiceAssistant({
    onTranscript: (text) => handleSendMessage(text),
    onCommand: (command) => handleVoiceCommand(command),
    onError: (errorMsg) => {
      toast({ title: "Erro de Voz", description: errorMsg, variant: "destructive" });
    },
    config: { wakeWord: "orion", language: "pt-BR" },
  });

  // Camera
  const camera = useCamera({
    onAnalysisComplete: (analysis) => {
      toast({ title: "📷 Análise Concluída", description: analysis.description.substring(0, 100) + "..." });
      handleSendMessage(`[Análise Visual]\n${analysis.description}`);
    },
    onError: (errorMsg) => {
      toast({ title: "Erro de Câmera", description: errorMsg, variant: "destructive" });
    },
  });

  useEffect(() => { initialize(); }, [initialize]);

  // Proactive system — spontaneous conversations
  const handleProactive = useCallback((event: { type: string; message: string }) => {
    // Add as AI message and speak it
    const proactiveMsg = event.message;
    sendMessage(`[ORION_PROACTIVE] ${proactiveMsg}`, jarvis.getSystemPrompt());
    if (audioEnabled) {
      tts.speak(proactiveMsg);
    }
  }, [sendMessage, jarvis, audioEnabled, tts]);

  const proactive = useProactiveOrion(handleProactive, {
    silenceThresholdSeconds: 180,
    cooldownSeconds: 300,
    enabled: true,
  });

  // Update visual state
  useEffect(() => {
    if (isTyping || isStreaming) setOrionState("thinking");
    else if (tts.isSpeaking || tts.isLoading) setOrionState("speaking");
    else if (voiceAssistant.isListening) setOrionState("listening");
    else if (camera.isAnalyzing) setOrionState("analyzing");
    else setOrionState("idle");
  }, [isTyping, isStreaming, voiceAssistant.isListening, tts.isSpeaking, tts.isLoading, camera.isAnalyzing]);

  // Simulate audio level
  useEffect(() => {
    if (voiceAssistant.isListening || tts.isSpeaking) {
      const interval = setInterval(() => setAudioLevel(Math.random() * 0.5 + 0.3), 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0.1);
    }
  }, [voiceAssistant.isListening, tts.isSpeaking]);

  // Auto-speak AI responses
  useEffect(() => {
    if (!audioEnabled) return;
    if (messages.length <= prevMessagesLenRef.current) {
      prevMessagesLenRef.current = messages.length;
      return;
    }
    prevMessagesLenRef.current = messages.length;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.isUser) return;
    if (lastMsg.id === "welcome" || lastMsg.text.startsWith("⚠️")) return;
    tts.speak(lastMsg.text);
  }, [messages, audioEnabled, tts]);

  const handleSendMessage = useCallback((msg: string) => {
    tts.stop();
    proactive.registerActivity();
    jarvis.addToRecentTopics(msg.split(" ")[0]);
    sendMessage(msg, jarvis.getSystemPrompt());
    setShowTranscript(true);
  }, [jarvis, sendMessage, tts, proactive]);

  const handleVoiceCommand = useCallback((command: string) => {
    if (command === "stop") { stopStreaming(); tts.stop(); }
    else if (command === "analyze_screen") { camera.requestCamera(); }
  }, [stopStreaming, tts, camera]);

  const handleEyeClick = useCallback(() => {
    voiceAssistant.isListening ? voiceAssistant.stopListening() : voiceAssistant.startListening();
  }, [voiceAssistant]);

  const handleVoiceToggle = useCallback(() => {
    voiceAssistant.isListening ? voiceAssistant.stopListening() : voiceAssistant.startListening();
  }, [voiceAssistant]);

  const displayMessages = messages.map((msg) => ({
    id: msg.id, text: msg.text, isUser: msg.isUser, timestamp: new Date(msg.timestamp),
  }));

  return (
    <div
      className={`relative w-full h-[100dvh] bg-orion-void overflow-hidden transition-all duration-500 ease-out ${
        device.isOrientationChanging ? "opacity-90 scale-[0.98]" : "opacity-100 scale-100"
      }`}
    >
      {/* Star field - Three.js background */}
      {device.showParticles && <SpaceBackground orionState={orionState} />}

      {/* Particles overlay */}
      {device.showParticles && (
        <ParticleField
          intensity={orionState === "idle" ? 0.3 : 0.7}
          color="255, 200, 50"
          particleCount={device.particleCount}
        />
      )}

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-orion-void via-orion-void to-black opacity-70" />

      {/* Main container */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full safe-top safe-bottom">
        
        {/* Header - compact on mobile */}
        <motion.header
          className="w-full px-3 pt-2 pb-1 md:px-4 md:pt-4 md:pb-2 flex items-center justify-between shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.02 }}>
            <span className="text-lg md:text-2xl font-light tracking-[0.3em] text-orion-stellar-gold">
              O.R.I.Ö.N
            </span>
            <span className="text-[10px] font-mono text-orion-stellar-gold/50 tracking-wider hidden sm:inline">
              v2.0
            </span>
          </motion.div>

          <StatusIndicator
            state={orionState}
            isListening={voiceAssistant.isListening}
            isCameraActive={camera.isActive}
            isAudioEnabled={audioEnabled}
            isConnected={true}
            memoryCount={messages.length}
            compact={device.isMobile}
          />
        </motion.header>

        {/* Central area - Eye + content */}
        <div className="flex flex-col items-center justify-center flex-1 gap-4 md:gap-8 w-full max-w-2xl px-4 min-h-0 overflow-hidden">
          
          {/* The Eye */}
          <motion.div
            className="shrink-0"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
          >
            <OrionEye
              state={orionState}
              audioLevel={audioLevel}
              onClick={handleEyeClick}
              size={device.eyeSize}
            />
          </motion.div>

          {/* Voice waveform - shorter on mobile */}
          <AnimatePresence>
            {(voiceAssistant.isListening || tts.isSpeaking || isStreaming) && (
              <motion.div
                className="w-full h-16 md:h-24 shrink-0"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.3 }}
              >
                <VoiceWaveform
                  isActive={voiceAssistant.isListening || tts.isSpeaking || isStreaming}
                  audioLevel={audioLevel}
                  isSpeaking={tts.isSpeaking || isStreaming}
                  isListening={voiceAssistant.isListening}
                  className="w-full h-full rounded-xl md:rounded-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript - toggleable, scrollable */}
          <AnimatePresence>
            {showTranscript && displayMessages.length > 0 && (
              <motion.div
                className="w-full min-h-0 overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <TranscriptDisplay
                  messages={displayMessages}
                  isTyping={isTyping}
                  className="w-full max-h-32 md:max-h-48"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Welcome message */}
          <AnimatePresence>
            {orionState === "idle" && messages.length === 0 && (
              <motion.div
                className="text-center shrink-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-base md:text-lg font-light text-orion-stellar-gold/80 mb-1 md:mb-2">
                  Olá. Eu sou ORION.
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {device.isMobile
                    ? "Toque no olho para falar."
                    : "Clique no olho ou use sua voz para começar."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom section - input + toggle */}
        <div className="w-full shrink-0 px-3 pb-2 md:px-4 md:pb-4 max-w-xl mx-auto space-y-2">
          {/* Toggle transcript button */}
          <div className="flex justify-end">
            <motion.button
              className="px-3 py-1.5 rounded-full bg-orion-stellar-gold/10 text-orion-stellar-gold/60 hover:bg-orion-stellar-gold/20 hover:text-orion-stellar-gold transition-all touch-target text-xs font-mono"
              onClick={() => setShowTranscript(!showTranscript)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showTranscript ? "OCULTAR" : "MOSTRAR"} TEXTO
            </motion.button>
          </div>

          {/* Command input */}
          <CommandInput
            onSend={handleSendMessage}
            onVoiceToggle={handleVoiceToggle}
            isListening={voiceAssistant.isListening}
            isProcessing={isTyping || isStreaming}
            placeholder={device.isMobile ? "Fale ou digite..." : "Digite ou fale..."}
          />

          {/* Footer */}
          <p className="text-[9px] md:text-[10px] font-mono text-muted-foreground/40 tracking-widest text-center">
            DESENVOLVIDO POR GABRIEL MENDES
          </p>
        </div>
      </div>

      {/* Camera overlay */}
      <CameraOverlay camera={camera} />
    </div>
  );
};

export default OrionInterface;
