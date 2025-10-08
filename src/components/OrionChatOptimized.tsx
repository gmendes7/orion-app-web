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

import { OrionSidebar } from "./OrionSidebar";
import { ConsentBanner } from "./ConsentBanner";

const OrionChat = () => {
  console.log("💬 OrionChat component carregando...");

  const { toast } = useToast();
  const { user, signOut } = useAuth();

  console.log("💬 OrionChat - Usuário:", user?.email || "Não identificado");

  const {
    initialize,
    messages,
    isTyping,
    isStreaming,
    conversationsLoading,
    stopStreaming,
  } = useChatStore();

  console.log("💬 OrionChat - Estado do chat:", {
    messagesCount: messages.length,
    isTyping,
    isStreaming,
    conversationsLoading,
  });

  const audioEnabled = useChatStore((s) => s.audioEnabled);
  const setAudioEnabled = useChatStore((s) => s.setAudioEnabled);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("💬 OrionChat - Inicializando chat store...");
    try {
      initialize();
      console.log("✅ Chat store inicializado");
    } catch (error) {
      console.error("❌ Erro ao inicializar chat store:", error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Voice input hook
  const { startListening, isListening } = useVoiceInput({
    onResult: (text) => {
      // Quando o reconhecimento de voz termina, envia a mensagem diretamente
      sendMessage(text);
    },
    onError: (error) =>
      toast({
        title: "Erro no Reconhecimento de Voz do usuario",
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
    <>
      <div className="flex h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 text-foreground relative overflow-hidden">
        {/* Sidebar */}
      <OrionSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        conversations={useChatStore((s) => s.conversations)}
        currentConversationId={useChatStore((s) => s.currentConversationId)}
        loading={conversationsLoading}
        setCurrentConversationId={useChatStore(
          (s) => s.setCurrentConversationId
        )}
        createNewConversation={() =>
          useChatStore.getState().createConversation("Nova Conversa")
        }
        deleteConversation={useChatStore((s) => s.deleteConversation)}
        renameConversation={useChatStore((s) => s.renameConversation)}
        handleLogout={handleLogout}
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
          <div className="flex items-center justify-between p-2 sm:p-4 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="text-orion-cosmic-blue hover:text-orion-stellar-gold flex-shrink-0"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>

              <div className="relative group flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-orion-stellar-gold/20 overflow-hidden">
                  <img
                    src={ORION_LOGO_URL}
                    alt="O.R.I.O.N Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-orion-accretion-disk rounded-full animate-pulse shadow-lg shadow-orion-accretion-disk/50" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-orion-stellar-gold tracking-wide stellar-text truncate">
                  O.R.I.O.N
                </h1>
                <span className="text-xs sm:text-sm text-orion-space-dust truncate block">
                  Assistente de IA
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="text-orion-cosmic-blue hover:text-orion-stellar-gold hover:bg-orion-stellar-gold/10 transition-all duration-300 h-8 w-8 sm:h-10 sm:w-10"
              >
                {audioEnabled ? (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>

              {isSpeaking && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stopSpeaking}
                  className="text-orion-accretion-disk hover:text-orion-stellar-gold hover:bg-orion-stellar-gold/10 transition-all duration-300 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                </Button>
              )}

              {isStreaming && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopStreaming}
                  className="flex items-center gap-1 sm:gap-2 border-orion-accretion-disk text-orion-accretion-disk hover:bg-orion-accretion-disk/10 hover:text-orion-accretion-disk h-8 px-2 sm:h-9 sm:px-3"
                >
                  <Square className="w-3 h-3" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Parar</span>
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl mx-auto w-full">
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
                      "max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%] rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg",
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

        <ChatInput
          onSendMessage={sendMessage}
          isTyping={isTyping}
          isListening={isListening}
          startListening={startListening}
          conversationId={useChatStore((s) => s.currentConversationId)}
        />

        {/* Footer */}
        <footer className="border-t border-orion-cosmic-blue/20 backdrop-blur-xl bg-card/30 py-2 sm:py-3 px-3 sm:px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] sm:text-xs text-orion-space-dust">
              Desenvolvido por{" "}
              <span className="text-orion-stellar-gold font-medium stellar-text">
                Gabriel Mendes
              </span>
            </p>
          </div>
        </footer>
      </div>
      </div>

      {/* LGPD Consent Banner */}
      <ConsentBanner />
    </>
  );
};

export default OrionChat;
