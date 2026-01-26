/**
 * 🤖 JarvisChat - Interface principal do assistente JARVIS
 * 
 * Características:
 * - Sem autenticação
 * - Multimodal (voz, câmera, texto)
 * - Memória inteligente
 * - Personalidade de engenheiro sênior
 */

import { Button } from "@/components/ui/button";
import { useJarvis } from "@/contexts/JarvisContext";
import { useChatStore } from "@/hooks/useChatStore";
import { useAIAgents, AIAgent } from "@/hooks/useAIAgents";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useCamera } from "@/hooks/useCamera";
import { useMemorySystem } from "@/hooks/useMemorySystem";
import { useToast } from "@/integrations/hooks/use-toast";
import { ORION_LOGO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Camera, 
  Loader2, 
  Menu, 
  Mic, 
  MicOff, 
  Square, 
  Volume2, 
  VolumeX,
  Brain,
  Code,
  Lightbulb,
  Bug,
  Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatInput } from "./ChatInput";
import CodeBlockRenderer from "./CodeBlockRenderer";
import { OrionSidebar } from "./OrionSidebar";
import { ConsentBanner } from "./ConsentBanner";
import { RAGMemoryIndicator } from "./RAGMemoryIndicator";

// ============= COMPONENTE DE MODO =============

interface ModeButtonProps {
  mode: string;
  currentMode: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ModeButton = ({ mode, currentMode, icon, label, onClick }: ModeButtonProps) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 text-xs transition-all",
      currentMode === mode 
        ? "bg-orion-stellar-gold/20 text-orion-stellar-gold" 
        : "text-orion-space-dust hover:text-orion-stellar-gold"
    )}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </Button>
);

// ============= COMPONENTE PRINCIPAL =============

const JarvisChat = () => {
  console.log("🤖 JarvisChat - Carregando interface JARVIS...");

  const { toast } = useToast();
  const jarvis = useJarvis();
  const memory = useMemorySystem();

  const {
    initialize,
    messages,
    isTyping,
    isStreaming,
    conversationsLoading,
    stopStreaming,
    error,
    selectedAgentId,
    setSelectedAgentId,
  } = useChatStore();

  // Hooks de IA
  const { agents } = useAIAgents();
  const selectedAgent = agents.find(a => a.id === selectedAgentId) || null;

  // Voice assistant
  const voiceAssistant = useVoiceAssistant({
    onTranscript: (text) => {
      memory.addMessage("user", text);
      sendMessage(text);
    },
    onCommand: (command, transcript) => {
      handleVoiceCommand(command, transcript);
    },
    onError: (error) => {
      toast({
        title: "Erro de Voz",
        description: error,
        variant: "destructive",
      });
    },
    wakeWord: "orion",
  });

  // Camera hook
  const camera = useCamera({
    onAnalysisComplete: (analysis) => {
      toast({
        title: "📷 Análise Concluída",
        description: analysis.description.substring(0, 100) + "...",
      });
      // Enviar análise como contexto
      sendMessage(`[Análise de Imagem]\n${analysis.description}`);
    },
    onError: (error) => {
      toast({
        title: "Erro de Câmera",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Estado local
  const [showCamera, setShowCamera] = useState(false);
  const audioEnabled = useChatStore((s) => s.audioEnabled);
  const setAudioEnabled = useChatStore((s) => s.setAudioEnabled);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ============= EFEITOS =============

  useEffect(() => {
    console.log("🤖 JarvisChat - Inicializando...");
    initialize();
  }, []);

  useEffect(() => {
    if (error) {
      const errorMessage = error.message || "Erro desconhecido";
      
      if (errorMessage.includes("rate limit")) {
        toast({
          title: "⚠️ Limite Atingido",
          description: "Aguarde um momento antes de enviar outra mensagem.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("402")) {
        toast({
          title: "⚠️ Créditos Esgotados",
          description: "Adicione créditos em Settings → Workspace → Usage.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  }, [error, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Atualizar memória com mensagens
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      memory.addMessage(lastMsg.isUser ? "user" : "assistant", lastMsg.text);
    }
  }, [messages]);

  // ============= HANDLERS =============

  const handleSelectAgent = (agent: AIAgent | null) => {
    setSelectedAgentId(agent?.id || null);
  };

  const handleVoiceCommand = (command: string, transcript: string) => {
    console.log("🎤 Comando de voz:", command);
    
    switch (command) {
      case "stop":
        stopStreaming();
        voiceAssistant.stopSpeaking();
        break;
      case "analyze_screen":
        handleCaptureAndAnalyze();
        break;
      case "mode_engineering":
        jarvis.setCurrentMode("engineering");
        voiceAssistant.speak("Modo engenharia ativado.");
        break;
      case "mode_planning":
        jarvis.setCurrentMode("planning");
        voiceAssistant.speak("Modo planejamento ativado.");
        break;
      case "mode_debugging":
        jarvis.setCurrentMode("debugging");
        voiceAssistant.speak("Modo debug ativado.");
        break;
      default:
        break;
    }
  };

  const handleCaptureAndAnalyze = async () => {
    if (!camera.isActive) {
      await camera.requestCamera();
      setShowCamera(true);
    } else {
      const analysis = await camera.captureAndAnalyze(
        "Analise esta tela. Identifique código, erros, UI ou qualquer elemento técnico relevante."
      );
      if (analysis) {
        jarvis.updateContext(`Análise visual: ${analysis.description}`);
      }
    }
  };

  const handleModeChange = (mode: "engineering" | "planning" | "debugging" | "general") => {
    jarvis.setCurrentMode(mode);
    memory.addSessionNote(`Modo alterado para: ${mode}`);
  };

  // ============= RENDER =============

  return (
    <>
      <div className="flex h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 text-foreground relative overflow-hidden">
        {/* Sidebar */}
        <OrionSidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          conversations={useChatStore((s) => s.conversations)}
          currentConversationId={useChatStore((s) => s.currentConversationId)}
          loading={conversationsLoading}
          setCurrentConversationId={useChatStore((s) => s.setCurrentConversationId)}
          createNewConversation={() => useChatStore.getState().createConversation("Nova Conversa")}
          deleteConversation={useChatStore((s) => s.deleteConversation)}
          renameConversation={useChatStore((s) => s.renameConversation)}
          handleLogout={() => {
            toast({ title: "ℹ️ Modo JARVIS", description: "Sistema single-user, logout desabilitado." });
          }}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative z-10">
          {/* Header */}
          <motion.header
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="border-b border-orion-cosmic-blue/20 backdrop-blur-xl bg-card/50 shadow-lg"
          >
            <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 gap-2">
              {/* Left section */}
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="text-orion-cosmic-blue hover:text-orion-stellar-gold flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>

                <div className="relative group flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl shadow-lg shadow-orion-stellar-gold/20 overflow-hidden">
                    <img
                      src={ORION_LOGO_URL}
                      alt="O.R.I.Ö.N"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-xl font-bold text-orion-stellar-gold tracking-wide stellar-text truncate">
                    O.R.I.Ö.N
                  </h1>
                  <span className="text-xs sm:text-sm text-orion-space-dust truncate block">
                    {jarvis.personality.role}
                  </span>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="hidden md:flex items-center gap-1 bg-card/50 rounded-lg p-1">
                <ModeButton
                  mode="general"
                  currentMode={jarvis.currentMode}
                  icon={<Zap className="w-3.5 h-3.5" />}
                  label="Geral"
                  onClick={() => handleModeChange("general")}
                />
                <ModeButton
                  mode="engineering"
                  currentMode={jarvis.currentMode}
                  icon={<Code className="w-3.5 h-3.5" />}
                  label="Código"
                  onClick={() => handleModeChange("engineering")}
                />
                <ModeButton
                  mode="planning"
                  currentMode={jarvis.currentMode}
                  icon={<Lightbulb className="w-3.5 h-3.5" />}
                  label="Arquitetura"
                  onClick={() => handleModeChange("planning")}
                />
                <ModeButton
                  mode="debugging"
                  currentMode={jarvis.currentMode}
                  icon={<Bug className="w-3.5 h-3.5" />}
                  label="Debug"
                  onClick={() => handleModeChange("debugging")}
                />
              </div>

              {/* Right section */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Memory indicator */}
                <div className="hidden sm:flex items-center gap-1 text-xs text-orion-space-dust">
                  <Brain className="w-3.5 h-3.5" />
                  <span>{memory.stats.totalEntries}</span>
                </div>

                {/* Camera button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCaptureAndAnalyze}
                  className={cn(
                    "h-8 w-8 sm:h-10 sm:w-10 transition-all",
                    camera.isActive 
                      ? "text-green-500 hover:text-green-400" 
                      : "text-orion-cosmic-blue hover:text-orion-stellar-gold"
                  )}
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>

                {/* Voice button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => voiceAssistant.isListening ? voiceAssistant.stopListening() : voiceAssistant.startListening()}
                  className={cn(
                    "h-8 w-8 sm:h-10 sm:w-10 transition-all",
                    voiceAssistant.isListening 
                      ? "text-red-500 animate-pulse hover:text-red-400" 
                      : "text-orion-cosmic-blue hover:text-orion-stellar-gold"
                  )}
                >
                  {voiceAssistant.isListening ? (
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </Button>

                {/* Audio toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="text-orion-cosmic-blue hover:text-orion-stellar-gold h-8 w-8 sm:h-10 sm:w-10"
                >
                  {audioEnabled ? (
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </Button>

                {/* Stop streaming */}
                {isStreaming && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopStreaming}
                    className="flex items-center gap-1 border-orion-accretion-disk text-orion-accretion-disk hover:bg-orion-accretion-disk/10 h-8 px-2"
                  >
                    <Square className="w-3 h-3" />
                    <span className="hidden sm:inline text-xs">Parar</span>
                  </Button>
                )}

                {/* RAG indicator */}
                <div className="hidden sm:block">
                  <RAGMemoryIndicator isActive={isStreaming} />
                </div>
              </div>
            </div>

            {/* Voice transcript bar */}
            {voiceAssistant.isListening && voiceAssistant.lastTranscript && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="px-4 py-2 bg-orion-stellar-gold/10 border-t border-orion-stellar-gold/20"
              >
                <p className="text-sm text-orion-stellar-gold truncate">
                  🎤 {voiceAssistant.lastTranscript}
                </p>
              </motion.div>
            )}
          </motion.header>

          {/* Camera preview */}
          {showCamera && camera.isActive && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 200 }}
              exit={{ height: 0 }}
              className="relative bg-black"
            >
              <video
                ref={(ref) => camera.setVideoRef(ref)}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={(ref) => camera.setCanvasRef(ref)} className="hidden" />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => camera.captureAndAnalyze()}
                  disabled={camera.isAnalyzing}
                >
                  {camera.isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "📸 Capturar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    camera.stopCamera();
                    setShowCamera(false);
                  }}
                >
                  ✕ Fechar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 max-w-4xl mx-auto w-full">
            {conversationsLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 text-orion-stellar-gold animate-spin" />
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.02 }}
                    className={cn(
                      "flex gap-3 sm:gap-4",
                      message.isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!message.isUser && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shadow-lg shadow-orion-stellar-gold/30 overflow-hidden">
                          <img
                            src={ORION_LOGO_URL}
                            alt="O.R.I.Ö.N"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg",
                        message.isUser
                          ? "bg-gradient-to-br from-orion-cosmic-blue to-orion-stellar-gold text-orion-void shadow-orion-cosmic-blue/20 ml-auto"
                          : "chat-message-orion text-foreground shadow-orion-stellar-gold/10"
                      )}
                    >
                      <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
                              const match = /language-(\w+)/.exec(className || "");
                              const codeText = String(children).replace(/\n$/, "");
                              if (!inline && match) {
                                return (
                                  <CodeBlockRenderer
                                    language={match[1]}
                                    codeText={codeText}
                                    {...props}
                                  />
                                );
                              }
                              return (
                                <code
                                  className={cn(
                                    className,
                                    "bg-orion-event-horizon/50 text-orion-accretion-disk px-1 py-0.5 rounded-sm"
                                  )}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.text || "▍"}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shadow-lg shadow-orion-stellar-gold/30 overflow-hidden">
                    <img src={ORION_LOGO_URL} alt="O.R.I.Ö.N" className="w-full h-full object-cover" />
                  </div>
                  <div className="chat-message-orion rounded-2xl px-4 py-3 backdrop-blur-sm">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-orion-stellar-gold rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <ChatInput
            onSendMessage={(msg) => {
              memory.addMessage("user", msg);
              jarvis.addToRecentTopics(msg.split(" ")[0]);
              sendMessage(msg);
            }}
            isTyping={isTyping}
            isListening={voiceAssistant.isListening}
            startListening={voiceAssistant.startListening}
            conversationId={useChatStore((s) => s.currentConversationId)}
          />

          {/* Footer */}
          <footer className="border-t border-orion-cosmic-blue/20 backdrop-blur-xl bg-card/30 py-2 px-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <p className="text-[10px] sm:text-xs text-orion-space-dust">
                Desenvolvido por{" "}
                <span className="text-orion-stellar-gold font-medium stellar-text">
                  Gabriel Mendes
                </span>
              </p>
              <div className="flex items-center gap-2 text-[10px] text-orion-space-dust">
                <span>Modo: {jarvis.currentMode}</span>
                <span>•</span>
                <span>Memória: {memory.stats.totalEntries}</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <ConsentBanner />
    </>
  );
};

export default JarvisChat;
