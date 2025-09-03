import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useChatStore } from "@/hooks/useChatStore";
import { useToast } from "@/integrations/hooks/use-toast";
import { useTextToSpeech } from "@/integrations/hooks/useTextToSpeech";
import { useVoiceInput } from "@/integrations/hooks/useVoiceInput";
import { ORION_LOGO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Menu, Square, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatInput } from "./ChatInput";
import CodeBlockRenderer from "./CodeBlockRenderer";
import { HexagonBackground } from "./HexagonBackground";
import { OrionSidebar } from "./OrionSidebar";

const OrionChat = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const {
    initialize,
    messages,
    isTyping,
    isStreaming,
    conversationsLoading,
    stopStreaming,
  } = useChatStore();

  const audioEnabled = useChatStore((s) => s.audioEnabled);
  const setAudioEnabled = useChatStore((s) => s.setAudioEnabled);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Voice input hook
  const { startListening, isListening } = useVoiceInput({
    onResult: (text) => {
      // Quando o reconhecimento de voz termina, envia a mensagem diretamente
      sendMessage(text);
    },
    onError: (error) =>
      toast({
        title: "Erro no Reconhecimento de Voz",
        description: error,
        variant: "destructive",
      }),
    language: "pt-BR",
  });

  // Text to speech hook
  const {
    speak,
    isSpeaking,
    stop: stopSpeaking,
  } = useTextToSpeech({
    language: "pt-BR",
    rate: 1,
    pitch: 1,
    volume: audioEnabled ? 1 : 0,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-background text-foreground relative overflow-hidden">
      <HexagonBackground />

      {/* Sidebar */}
      <OrionSidebar handleLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <motion.header
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="border-b border-orion-cosmic-blue/20 backdrop-blur-xl bg-card/50 shadow-lg"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="text-orion-cosmic-blue hover:text-orion-stellar-gold"
              >
                <Menu className="w-5 h-5" />
              </Button>

              <div className="relative group">
                <div className="w-10 h-10 rounded-xl shadow-lg shadow-orion-stellar-gold/20 overflow-hidden">
                  <img
                    src={ORION_LOGO_URL}
                    alt="O.R.I.Ö.N Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orion-accretion-disk rounded-full animate-pulse shadow-lg shadow-orion-accretion-disk/50" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-orion-stellar-gold tracking-wide stellar-text">
                  O.R.I.Ö.N
                </h1>
                <span className="text-sm text-orion-space-dust">
                  Assistente Inteligente Futurista
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="text-orion-cosmic-blue hover:text-orion-stellar-gold hover:bg-orion-stellar-gold/10 transition-all duration-300"
              >
                {audioEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </Button>

              {isSpeaking && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stopSpeaking}
                  className="text-orion-accretion-disk hover:text-orion-stellar-gold hover:bg-orion-stellar-gold/10 transition-all duration-300"
                >
                  <VolumeX className="w-5 h-5 animate-pulse" />
                </Button>
              )}

              {isStreaming && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopStreaming}
                  className="flex items-center gap-2 border-orion-accretion-disk text-orion-accretion-disk hover:bg-orion-accretion-disk/10 hover:text-orion-accretion-disk"
                >
                  <Square className="w-3 h-3" />
                  <span className="hidden sm:inline">Parar Geração</span>
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
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
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={cn(
                    "flex gap-4",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!message.isUser && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-xl shadow-lg shadow-orion-stellar-gold/30 overflow-hidden">
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
                      "max-w-[95%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%] rounded-2xl px-4 sm:px-5 py-3 sm:py-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg",
                      message.isUser
                        ? "bg-gradient-to-br from-orion-cosmic-blue to-orion-stellar-gold text-orion-void shadow-orion-cosmic-blue/20 ml-auto"
                        : "chat-message-orion text-foreground shadow-orion-stellar-gold/10"
                    )}
                  >
                    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }: any) {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
                            const codeText = String(children).replace(
                              /\n$/,
                              ""
                            );
                            return !inline && match ? (
                              <CodeBlockRenderer
                                language={match[1]}
                                codeText={codeText}
                                {...props}
                              />
                            ) : (
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
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-xl shadow-lg shadow-orion-stellar-gold/30 overflow-hidden">
                  <img
                    src={ORION_LOGO_URL}
                    alt="O.R.I.Ö.N"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="chat-message-orion rounded-2xl px-5 py-4 backdrop-blur-sm">
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-orion-stellar-gold rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput isListening={isListening} startListening={startListening} />
      </div>
    </div>
  );
};

export default OrionChat;
