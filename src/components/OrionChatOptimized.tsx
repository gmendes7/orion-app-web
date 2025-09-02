import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/integrations/hooks/use-toast";
import { useTextToSpeech } from "@/integrations/hooks/useTextToSpeech";
import { useVoiceInput } from "@/integrations/hooks/useVoiceInput";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { safeCommandExecution, formatNeonResponse } from "@/utils/safeCommandExecution";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, type Message as DBMessage } from "@/hooks/useConversations";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cloud,
  MessageSquare,
  Mic,
  Newspaper,
  Search,
  Send,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Menu,
  X,
  LogOut,
  User
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TypingEffect from "./TypingEffect";
import { HexagonBackground } from "./HexagonBackground";

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
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens quando a conversa muda
  useEffect(() => {
    const loadConversationMessages = async () => {
      if (currentConversationId) {
        const dbMessages = await loadMessages(currentConversationId);
        const displayMessages: DisplayMessage[] = dbMessages.map((msg: DBMessage) => ({
          id: msg.id,
          text: msg.content,
          isUser: msg.is_user,
          timestamp: new Date(msg.created_at),
        }));
        
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
    onResult: (text) => setInput(text),
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

        return `🔍 **Resultados da Pesquisa: "${query}"** ✨\n\n${data.answer}\n\n${
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

  const sendMessage = async () => {
    if (!input.trim() || isTyping || !currentConversationId) return;

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    const currentInput = input;
    
    // Atualizar UI imediatamente
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Salvar mensagem do usuário no banco
      await saveMessage(currentConversationId, currentInput, true);

      // Detectar e executar comandos especiais primeiro
      const commandResult = await detectAndExecuteCommands(currentInput);

      if (commandResult) {
        const commandResponse: DisplayMessage = {
          id: (Date.now() + 1).toString(),
          text: commandResult,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, commandResponse]);
        setTypingMessageId(commandResponse.id);
        setIsTyping(false);

        // Salvar resposta no banco
        await saveMessage(currentConversationId, commandResult, false);

        // Auto-falar resposta se áudio estiver habilitado
        if (audioEnabled) {
          speak(commandResult.replace(/\*\*/g, "").replace(/\[.*?\]/g, ""));
        }

        return;
      }

      // Preparar contexto da conversa para o chat AI
      const conversation = messages.map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text,
      }));

      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: {
          message: currentInput,
          conversation: conversation,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro de comunicação");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const orionMessageId = (Date.now() + 1).toString();
      const orionResponse: DisplayMessage = {
        id: orionMessageId,
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, orionResponse]);
      setTypingMessageId(orionMessageId);
      setIsTyping(false);

      // Salvar resposta no banco
      await saveMessage(currentConversationId, data.response, false);

      // Auto-falar resposta se áudio estiver habilitado
      if (audioEnabled) {
        speak(data.response);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setIsTyping(false);

      const errorMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        text: formatNeonResponse("Desculpe, ocorreu um erro na comunicação. Tente novamente.", true),
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);

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
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (e.shiftKey) {
        // Remover indentação
        const value = textarea.value;
        const beforeTab = value.substring(0, start);
        const afterTab = value.substring(end);
        if (beforeTab.endsWith("  ")) {
          setInput(beforeTab.slice(0, -2) + afterTab);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 2;
          }, 0);
        }
      } else {
        // Adicionar indentação
        setInput(input.substring(0, start) + "  " + input.substring(end));
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  const handleTypingComplete = (messageId: string) => {
    if (typingMessageId === messageId) {
      setTypingMessageId(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Botões de ação rápida
  const quickActions = [
    {
      icon: Search,
      label: "Pesquisar",
      action: () => setInput("Pesquisar sobre "),
      color: "from-orion-cosmic-blue to-orion-stellar-gold"
    },
    {
      icon: Cloud,
      label: "Clima",
      action: () => setInput("Clima em "),
      color: "from-orion-energy-burst to-orion-accretion-disk"
    },
    {
      icon: Newspaper,
      label: "Notícias",
      action: () => setInput("Notícias sobre "),
      color: "from-orion-plasma-glow to-orion-stellar-gold"
    }
  ];

  return (
    <div className="flex h-screen bg-background text-foreground relative overflow-hidden">
      <HexagonBackground />
      
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-y-0 left-0 z-50 w-80 bg-card/95 backdrop-blur-xl border-r border-orion-cosmic-blue/30 shadow-2xl md:relative md:translate-x-0 md:w-64 lg:w-80"
          >
            <div className="flex flex-col h-full">
              {/* Header do Sidebar */}
              <div className="p-4 border-b border-orion-cosmic-blue/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-orion-stellar-gold">Conversas</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden text-orion-cosmic-blue hover:text-orion-stellar-gold"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <Button
                  onClick={createNewConversation}
                  className="w-full mt-3 bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold hover:opacity-90 text-orion-void font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Conversa
                </Button>
              </div>

              {/* Lista de Conversas */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-orion-stellar-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer group transition-all duration-200",
                        currentConversationId === conv.id
                          ? "bg-orion-stellar-gold/20 border border-orion-stellar-gold/50 shadow-lg"
                          : "bg-orion-event-horizon hover:bg-orion-cosmic-blue/10 border border-orion-cosmic-blue/20"
                      )}
                      onClick={() => {
                        setCurrentConversationId(conv.id);
                        setSidebarOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-orion-stellar-gold truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-orion-space-dust mt-1">
                            {new Date(conv.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        
                        {conversations.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 text-orion-space-dust hover:text-orion-accretion-disk transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* User Info and Logout */}
              <div className="p-4 border-t border-orion-cosmic-blue/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orion-stellar-gold to-orion-accretion-disk flex items-center justify-center">
                      <User className="w-4 h-4 text-orion-void" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-orion-stellar-gold truncate">
                        {user?.email?.split('@')[0] || 'Usuário'}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-orion-space-dust hover:text-orion-accretion-disk transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orion-stellar-gold to-orion-accretion-disk flex items-center justify-center shadow-lg shadow-orion-stellar-gold/20">
                  <MessageSquare className="w-5 h-5 text-orion-void" />
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
            </div>
          </div>
        </motion.header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full">
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
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orion-stellar-gold to-orion-accretion-disk flex items-center justify-center shadow-lg shadow-orion-stellar-gold/30">
                      <MessageSquare className="w-4 h-4 text-orion-void" />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg",
                    message.isUser
                      ? "bg-gradient-to-br from-orion-cosmic-blue to-orion-stellar-gold text-orion-void shadow-orion-cosmic-blue/20 ml-auto"
                      : "chat-message-orion text-foreground shadow-orion-stellar-gold/10"
                  )}
                >
                  <div className="text-sm leading-relaxed">
                    {!message.isUser && typingMessageId === message.id ? (
                      <TypingEffect
                        text={message.text}
                        speed={25}
                        onComplete={() => handleTypingComplete(message.id)}
                      />
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none">
                        {message.text.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 last:mb-0">
                            {line.includes('**') ? (
                              <span dangerouslySetInnerHTML={{
                                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-orion-stellar-gold">$1</strong>')
                              }} />
                            ) : (
                              line
                            )}
                          </p>
                        ))}
                      </div>
                    )}
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orion-stellar-gold to-orion-accretion-disk flex items-center justify-center shadow-lg shadow-orion-stellar-gold/30">
                  <MessageSquare className="w-4 h-4 text-orion-void" />
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

        {/* Quick Actions */}
        <div className="px-4 py-2">
          <div className="flex gap-2 justify-center max-w-4xl mx-auto">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={action.action}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  "bg-gradient-to-r", action.color,
                  "text-orion-void hover:scale-105 hover:shadow-lg active:scale-95",
                  "border border-white/20 backdrop-blur-sm"
                )}
              >
                <action.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="border-t border-orion-cosmic-blue/20 backdrop-blur-xl bg-card/50 p-4"
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Digite sua mensagem... (Shift+Enter para nova linha, Tab para indentar)"
                  disabled={isTyping}
                  rows={Math.min(Math.max(input.split('\n').length, 1), 4)}
                  className={cn(
                    "w-full resize-none rounded-xl px-4 py-3 pr-12 text-sm",
                    "bg-orion-event-horizon/50 border-2 border-orion-cosmic-blue/30",
                    "text-foreground placeholder-orion-space-dust",
                    "focus:border-orion-stellar-gold/60 focus:ring-2 focus:ring-orion-stellar-gold/20",
                    "transition-all duration-300 backdrop-blur-sm",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  style={{
                    minHeight: '48px',
                    maxHeight: '120px'
                  }}
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={startListening}
                    disabled={isListening || isTyping}
                    className={cn(
                      "w-8 h-8 text-orion-cosmic-blue hover:text-orion-stellar-gold transition-all duration-300",
                      isListening && "text-orion-accretion-disk animate-pulse scale-110"
                    )}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold",
                  "text-orion-void font-medium shadow-lg transition-all duration-300",
                  "hover:scale-105 hover:shadow-xl active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                  "border border-white/20"
                )}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrionChat;