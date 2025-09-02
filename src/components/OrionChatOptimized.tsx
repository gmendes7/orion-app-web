import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  useConversations,
  type Message as DBMessage,
} from "@/hooks/useConversations";
import { useToast } from "@/integrations/hooks/use-toast";
import { useTextToSpeech } from "@/integrations/hooks/useTextToSpeech";
import { useVoiceInput } from "@/integrations/hooks/useVoiceInput";
import { supabase } from "@/integrations/supabase/client";
import { ORION_LOGO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  formatNeonResponse,
  safeCommandExecution,
} from "@/utils/safeCommandExecution";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Menu, Square, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { ChatInput } from "./ChatInput";
import { HexagonBackground } from "./HexagonBackground";
import { OrionSidebar } from "./OrionSidebar";

interface DisplayMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const OrionChat = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    loading: conversationsLoading,
    loadMessages,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    saveMessage,
  } = useConversations();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens quando a conversa muda
  useEffect(() => {
    const loadConversationMessages = async () => {
      if (currentConversationId) {
        const dbMessages = await loadMessages(currentConversationId);
        const displayMessages: DisplayMessage[] = dbMessages.map(
          (msg: DBMessage) => ({
            id: msg.id,
            text: msg.content,
            isUser: msg.is_user,
            timestamp: new Date(msg.created_at),
          })
        );

        // Se não há mensagens, adicionar mensagem de boas-vindas
        if (displayMessages.length === 0) {
          displayMessages.push({
            id: "welcome",
            text: "Olá! Sou o **O.R.I.Ö.N**, seu assistente de IA futurista. Como posso ajudar você hoje? ✨",
            isUser: false,
            timestamp: new Date(),
          });
        }

        setMessages(displayMessages);
      }
    };

    loadConversationMessages();
  }, [currentConversationId, loadMessages]);

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

  // Criar nova conversa
  const createNewConversation = async () => {
    const newConv = await createConversation("Nova Conversa");
    if (newConv) {
      setSidebarOpen(false);
    }
  };

  // Comandos com sistema de fallback
  const handleWebSearch = async (query: string) => {
    const result = await safeCommandExecution(
      async () => {
        const { data, error } = await supabase.functions.invoke("web-search", {
          body: { query, type: "search", count: 5 },
        });

        if (error) throw error;

        return `🔍 **Resultados da Pesquisa: "${query}"** ✨\n\n${
          data.answer
        }\n\n${
          data.relatedQuestions?.length > 0
            ? `**Perguntas relacionadas:**\n${data.relatedQuestions
                .map((q: string) => `• ${q}`)
                .join("\n")}`
            : ""
        }`;
      },
      "🔍 Não consegui encontrar resultados agora. Tente reformular sua pergunta ou aguarde um momento. ✨",
      "search"
    );

    return formatNeonResponse(result.message, !result.success);
  };

  const handleWeatherQuery = async (city: string) => {
    const result = await safeCommandExecution(
      async () => {
        const { data, error } = await supabase.functions.invoke("weather-api", {
          body: { city, type: "current" },
        });

        if (error) throw error;

        const weather = data.current;
        return (
          `🌤️ **Clima em ${data.location.name}, ${data.location.country}** ✨\n\n` +
          `**Temperatura:** ${weather.temperature}°C (sensação: ${weather.feels_like}°C)\n` +
          `**Condição:** ${weather.description}\n` +
          `**Umidade:** ${weather.humidity}%\n` +
          `**Vento:** ${weather.wind.speed} m/s\n` +
          `**Pressão:** ${weather.pressure} hPa\n\n` +
          `🌅 **Nascer do sol:** ${data.sunrise}\n` +
          `🌇 **Pôr do sol:** ${data.sunset}`
        );
      },
      "🌤️ Desculpe, não consegui acessar a previsão do tempo agora. Mas posso tentar de novo mais tarde! ☀️",
      "weather"
    );

    return formatNeonResponse(result.message, !result.success);
  };

  const handleNewsQuery = async (query?: string) => {
    const result = await safeCommandExecution(
      async () => {
        const { data, error } = await supabase.functions.invoke("news-api", {
          body: {
            query,
            category: query ? undefined : "general",
            pageSize: 5,
          },
        });

        if (error) throw error;

        const articles = data.articles.slice(0, 5);
        return (
          `📰 **${
            query ? `Notícias sobre "${query}"` : "Principais Notícias"
          }** ✨\n\n` +
          articles
            .map(
              (article: any, index: number) =>
                `**${index + 1}. ${article.title}**\n` +
                `${article.description}\n` +
                `*Fonte: ${article.source.name} • ${article.publishedAt}*\n` +
                `[Ler mais](${article.url})`
            )
            .join("\n\n")
        );
      },
      "📰 No momento não consegui buscar as notícias. Tente novamente em alguns minutos. 📺",
      "news"
    );

    return formatNeonResponse(result.message, !result.success);
  };

  const detectAndExecuteCommands = async (text: string) => {
    const lowerText = text.toLowerCase();

    // Comando de pesquisa web
    if (
      lowerText.includes("pesquisar") ||
      lowerText.includes("buscar na internet") ||
      lowerText.includes("google")
    ) {
      const query = text
        .replace(/(pesquisar|buscar na internet|google)/i, "")
        .trim();
      if (query) {
        return await handleWebSearch(query);
      }
    }

    // Comando de clima
    if (lowerText.includes("clima") || lowerText.includes("tempo")) {
      const city = text.replace(/(clima|tempo)\s*(de|em|da)?\s*/i, "").trim();
      return await handleWeatherQuery(city || "São Paulo");
    }

    // Comando de notícias
    if (lowerText.includes("notícias") || lowerText.includes("news")) {
      const query = text
        .replace(/(notícias|news)\s*(sobre|de)?\s*/i, "")
        .trim();
      return await handleNewsQuery(query);
    }

    return null;
  };

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      toast({ title: "Geração de resposta interrompida." });
    }
  };

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isTyping || !currentConversationId) return;

    // refactor: Use a more robust ID generation like uuid
    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      text: messageContent,
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];

    // Atualizar UI imediatamente
    setMessages(updatedMessages);
    setIsStreaming(true);
    setIsTyping(true);

    try {
      // Salvar mensagem do usuário no banco
      await saveMessage(currentConversationId, messageContent, true);

      // Detectar e executar comandos especiais primeiro
      const commandResult = await detectAndExecuteCommands(messageContent);

      if (commandResult) {
        const commandResponse: DisplayMessage = {
          // refactor: Use a more robust ID generation like uuid
          id: (Date.now() + 1).toString(),
          text: commandResult,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, commandResponse]); // This will be rendered with markdown
        setTypingMessageId(commandResponse.id);
        setIsTyping(false);

        // Salvar resposta no banco
        await saveMessage(currentConversationId, commandResult, false);

        // Auto-falar resposta se áudio estiver habilitado
        if (audioEnabled) {
          speak(commandResult.replace(/\*\*/g, "").replace(/\[.*?\]/g, ""));
        }
        setIsStreaming(false);

        return;
      }

      // Preparar contexto da conversa para o chat AI
      const conversation = updatedMessages.map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text,
      }));

      // **NOVA LÓGICA DE STREAMING**
      setIsTyping(false); // A API de streaming assume o controle
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(response.statusText || "Falha ao conectar com a API.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponseText = "";
      const assistantMessageId = (Date.now() + 1).toString();

      // Adiciona um placeholder para a mensagem da IA
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          text: "",
          isUser: false,
          timestamp: new Date(),
        },
      ]);

      // Lê o stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantResponseText += decoder.decode(value);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, text: assistantResponseText }
              : msg
          )
        );
      }

      // Finaliza o streaming
      setIsStreaming(false);
      abortControllerRef.current = null;
      await saveMessage(currentConversationId, assistantResponseText, false);
      if (audioEnabled) {
        speak(assistantResponseText);
      }
    } catch (error: any) {
      if (error.name === "AbortError") return; // Ignora erro de abortar

      console.error("Erro ao enviar mensagem:", error);
      setIsTyping(false);
      setIsStreaming(false);

      const errorMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        text: formatNeonResponse(
          "Desculpe, ocorreu um erro na comunicação. Tente novamente.",
          true
        ),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      // Tentar salvar mensagem de erro
      try {
        if (currentConversationId) {
          await saveMessage(currentConversationId, errorMessage.text, false);
        }
      } catch (saveError) {
        console.error("Erro ao salvar mensagem de erro:", saveError);
      }

      toast({
        title: "Erro de Comunicação",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleRenameConversation = async (id: string, title: string) => {
    await updateConversationTitle(id, title);
    toast({ title: "Conversa renomeada com sucesso!" });
  };

  return (
    <div className="flex h-screen bg-background text-foreground relative overflow-hidden">
      <HexagonBackground />

      {/* Sidebar */}
      <OrionSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        conversations={conversations}
        currentConversationId={currentConversationId}
        setCurrentConversationId={setCurrentConversationId}
        loading={conversationsLoading}
        createNewConversation={createNewConversation}
        deleteConversation={deleteConversation}
        renameConversation={handleRenameConversation}
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
                  onClick={handleStopGeneration}
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
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          const codeText = String(children).replace(/\n$/, "");
                          const handleCopy = () => {
                            navigator.clipboard.writeText(codeText);
                            toast({
                              title: "Copiado!",
                              description:
                                "Código copiado para a área de transferência.",
                            });
                          };
                          return !inline && match ? (
                            <div className="relative my-2 bg-[#0d1117] rounded-lg">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-white"
                                onClick={handleCopy}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {codeText}
                              </SyntaxHighlighter>
                            </div>
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
          isTyping={isTyping || isStreaming}
          isListening={isListening}
          startListening={startListening}
          conversationId={currentConversationId}
        />
      </div>
    </div>
  );
};

export default OrionChat;
