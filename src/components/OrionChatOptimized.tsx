import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/integrations/hooks/use-toast";
import { useTextToSpeech } from "@/integrations/hooks/useTextToSpeech";
import { useVoiceInput } from "@/integrations/hooks/useVoiceInput";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cloud,
  MessageSquare,
  Mic,
  Newspaper,
  Paperclip,
  Search,
  Send,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface FeedbackData {
  rating: number;
  comment: string;
}

interface NewsArticle {
  title: string;
  description: string;
  source: { name: string };
  publishedAt: string;
  url: string;
}

// TypingEffect component: reveals text progressively and calls onComplete when finished.
const TypingEffect: React.FC<{
  text: string;
  speed?: number;
  onComplete?: () => void;
}> = ({ text, speed = 25, onComplete }) => {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset state when text changes
    setDisplayed("");
    indexRef.current = 0;

    if (!text) {
      onComplete?.();
      return;
    }

    // Use window.setInterval to get a number id compatible with browsers
    intervalRef.current = window.setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
        }
        onComplete?.();
      }
    }, speed);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, onComplete]);

  return (
    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{displayed}</ReactMarkdown>
  );
};

const OrionChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! Sou o Orion, seu assistente de IA. Como posso ajudar você hoje?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  // Simple image upload handler
  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Para agora, apenas mostrar uma mensagem
        toast({
          title: "Upload de Imagem",
          description:
            "Funcionalidade em desenvolvimento. Em breve você poderá enviar imagens!",
        });
      }
    };
    input.click();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Synthetic speech for typing sound effect
  const playTypingSound = useCallback(() => {
    if (
      audioEnabled &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      // Create a subtle typing sound using Web Speech API
      const utterance = new SpeechSynthesisUtterance(".");
      utterance.volume = 0.1;
      utterance.rate = 10;
      utterance.pitch = 2;
      window.speechSynthesis.speak(utterance);
    }
  }, [audioEnabled]);

  const handleImageAnalysis = useCallback(
    async (imageUrl: string) => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "analyze-image",
          {
            body: { imageUrl },
          }
        );

        if (error) throw error;

        const analysisMessage: Message = {
          id: Date.now().toString(),
          text: `🖼️ **Análise da Imagem:**\n\n${data.description}`,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, analysisMessage]);
      } catch (error) {
        console.error("Erro na análise de imagem:", error);
        toast({
          title: "Erro na Análise",
          description: "Não foi possível analisar a imagem.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleWebSearch = useCallback(async (query: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("web-search", {
        body: { query, type: "search", count: 5 },
      });

      if (error) throw error;

      return `🔍 **Resultados da Pesquisa: "${query}"**\n\n${data.answer}\n\n${
        data.relatedQuestions?.length > 0
          ? `**Perguntas relacionadas:**\n${data.relatedQuestions
              .map((q: string) => `• ${q}`)
              .join("\n")}`
          : ""
      }`;
    } catch (error) {
      console.error("Erro na pesquisa:", error);
      return "❌ Não foi possível realizar a pesquisa no momento.";
    }
  }, []);

  const handleWeatherQuery = useCallback(async (city: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("weather-api", {
        body: { city, type: "current" },
      });

      if (error) throw error;

      const weather = data.current;
      return (
        `🌤️ **Clima em ${data.location.name}, ${data.location.country}**\n\n` +
        `**Temperatura:** ${weather.temperature}°C (sensação: ${weather.feels_like}°C)\n` +
        `**Condição:** ${weather.description}\n` +
        `**Umidade:** ${weather.humidity}%\n` +
        `**Vento:** ${weather.wind.speed} m/s\n` +
        `**Pressão:** ${weather.pressure} hPa\n\n` +
        `🌅 **Nascer do sol:** ${data.sunrise}\n` +
        `🌇 **Pôr do sol:** ${data.sunset}`
      );
    } catch (error) {
      console.error("Erro ao buscar clima:", error);
      return "❌ Não foi possível obter informações do clima.";
    }
  }, []);

  const handleNewsQuery = useCallback(async (query?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("news-api", {
        body: { query },
      });

      if (error) throw error;
      if (!data || !data.articles) {
        return "❌ Não foi possível obter as notícias.";
      }

      const articles: NewsArticle[] = data.articles.slice(0, 5);

      if (articles.length === 0) {
        return "ℹ️ Nenhuma notícia encontrada.";
      }

      return (
        `📰 **${
          query ? `Notícias sobre "${query}"` : "Principais Notícias"
        }**\n\n` +
        articles
          .map(
            (article: NewsArticle, index: number) =>
              `**${index + 1}. ${article.title}**\n` +
              `${article.description}\n` +
              `*Fonte: ${article.source.name} • ${article.publishedAt}*\n` +
              `[Ler mais](${article.url})`
          )
          .join("\n\n")
      );
    } catch (error) {
      console.error("Erro ao buscar notícias:", error);
      return "❌ Não foi possível obter as notícias.";
    }
  }, []);

  // useCallback para evitar recriação

  // Função para detectar e executar comandos especiais (pesquisar, clima, notícias, análise de imagem, etc.)
  const detectAndExecuteCommands = useCallback(
    async (text: string): Promise<string | null> => {
      const trimmed = text.trim();

      // Detectar URL de imagem direta e disparar análise (a própria função adiciona mensagem)
      const imgMatch = trimmed.match(
        /https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(\?\S*)?/i
      );
      if (imgMatch) {
        try {
          await handleImageAnalysis(imgMatch[0]);
        } catch (err) {
          console.error("Erro ao analisar imagem via comando:", err);
          toast({
            title: "Erro na Análise",
            description: "Não foi possível analisar a imagem fornecida.",
            variant: "destructive",
          });
        }
        // handleImageAnalysis já adiciona uma mensagem, então não precisamos retornar texto adicional
        return null;
      }

      // Comando de pesquisa
      if (
        /^\s*(pesquisar|buscar)\b/i.test(trimmed) ||
        /^\s*pesquisar sobre\b/i.test(trimmed)
      ) {
        const query = trimmed.replace(/^\s*(pesquisar|buscar)\b\s*/i, "");
        const result = await handleWebSearch(query || trimmed);
        return result;
      }

      // Comando de clima
      if (
        /^\s*(clima|clima em)\b/i.test(trimmed) ||
        /^\s*clima\b/i.test(trimmed)
      ) {
        const city = trimmed.replace(/^\s*(clima|clima em)\b\s*/i, "");
        const result = await handleWeatherQuery(city || trimmed);
        return result;
      }

      // Comando de notícias
      if (
        /^\s*(not[ií]cias|noticias)\b/i.test(trimmed) ||
        /^\s*not[ií]cias sobre\b/i.test(trimmed)
      ) {
        const q = trimmed.replace(/^\s*(not[ií]cias|noticias)\b\s*/i, "");
        const result = await handleNewsQuery(q || undefined);
        return result;
      }

      // Nenhum comando detectado
      return null;
    },
    [
      handleWebSearch,
      handleWeatherQuery,
      handleNewsQuery,
      handleImageAnalysis,
      toast,
    ]
  );

  // Substitua a lógica de envio/call antigo por esta versão que usa fetch+stream
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    // adiciona mensagem do usuário
    setMessages((m) => [...m, userMessage]);
    setInput("");

    // prepara mensagem assistente vazia que será atualizada com a stream
    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantId,
      text: "",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, assistantMessage]);
    setTypingMessageId(assistantId);
    setIsTyping(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    // cleanup se componente desmontar será feito via useEffect externo (opcional)
    const onFinish = (finalText: string) => {
      setIsTyping(false);
      setTypingMessageId(null);
      if (audioEnabled && finalText.trim()) {
        try {
          const result = speak?.(finalText);
          const hasCatch = (v: unknown): v is { catch: (onRejected?: (reason?: unknown) => unknown) => unknown } =>
            typeof v === "object" && v !== null && typeof (v as { catch?: unknown }).catch === "function";

          if (hasCatch(result)) {
            result.catch(() => {});
          }
        } catch {
          // Ignore synchronous errors from speak
        }
      }
    };

    const buildConversation = (messagesSnapshot: Message[]) =>
      messagesSnapshot.slice(-6).map((m) => ({
        role: m.isUser ? "user" : "assistant",
        content: m.text,
      }));

    const conversation = buildConversation(messagesRef.current ?? messages);

    try {
      const res = await fetch("/functions/v1/chat-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          conversation,
          format: "markdown",
        }),
        signal,
      });


      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const chunk = await reader.read();
        const value = chunk.value;
        const dDone = chunk.done;
        done = dDone === true;
        if (value !== undefined && value !== null) {
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed === "data: [DONE]" || trimmed === "[DONE]") {
              done = true;
              break;
            }
            const data = trimmed.startsWith("data:") ? trimmed.replace(/^data:\s*/, "") : trimmed;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + delta } : m))
                );
                if (typeof playTypingSound === "function") {
                  playTypingSound();
                }
              }
            } catch {
              // ignora linhas não-JSON
            }
          }
        }
      }

      // finalize: call onFinish with final text
      const finalText = (messagesRef.current ?? messages).find((m) => m.id === assistantId)?.text ?? "";
      onFinish(finalText);
    } catch (err) {
      const errName =
        typeof err === "object" && err !== null && "name" in err
          ? (err as { name?: unknown }).name
          : undefined;

      if (errName === "AbortError") {
        toast({ title: "Cancelado", description: "Petição cancelada." });
      } else {
        toast({
          title: "Erro",
          description: String(err),
          variant: "destructive",
        });
      }
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsSending(false);
      setIsTyping(false);
      setTypingMessageId(null);
      abortRef.current = null;
    }

    // retorno opcional de cleanup (não obrigatório no callback)
    return;
  }, [input, isSending, audioEnabled, speak, toast, playTypingSound, messages]);

  // referência reativa para pegar mensagens dentro do stream loop (se já não existir)
  const messagesRef = useRef<Message[] | null>(null);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleTypingComplete = (messageId: string) => {
    if (typingMessageId === messageId) {
      setTypingMessageId(null);
    }
  };

  const submitFeedback = () => {
    if (feedbackRating === 0) return;

    // Store feedback (could be sent to analytics or database)
    console.log("Feedback recebido:", {
      rating: feedbackRating,
      comment: feedbackComment,
    });

    toast({
      title: "Obrigado pelo Feedback!",
      description: "Suas sugestões nos ajudam a melhorar sempre.",
    });

    setShowFeedback(false);
    setFeedbackRating(0);
    setFeedbackComment("");
  };

  const buildConversation = (messages: Message[]) => {
    const last = messages.slice(-6).map((m) => ({
      role: m.isUser ? "user" : "assistant",
      content: m.text,
    }));
    return last;
  };

  return (
    <div className="flex flex-col h-screen relative">
      {/* Header */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="border-b border-border/10 p-3 md:p-4 backdrop-blur-xl bg-card/50"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <MessageSquare className="w-4 h-4 text-background" />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>
            <div>
              <h1
                className="text-lg font-bold text-foreground tracking-wide"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                O.R.I.Ö.N
              </h1>
              <span className="text-xs text-muted-foreground">
                Assistente Inteligente
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
            >
              {audioEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>

            {/* Controles TTS */}
            {isSpeaking && (
              <Button
                variant="ghost"
                size="icon"
                onClick={stopSpeaking}
                className="hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
              >
                <VolumeX className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFeedback(true)}
              className="hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                "flex gap-3",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              {!message.isUser && (
                <div className="flex-shrink-0 mt-1">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <MessageSquare className="w-3 h-3 text-background" />
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "max-w-[70%] md:max-w-[60%] rounded-2xl px-4 py-3 backdrop-blur-sm",
                  message.isUser
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-card/80 text-card-foreground border border-border/20"
                )}
              >
                <p className="text-sm leading-relaxed">
                  {!message.isUser && typingMessageId === message.id ? (
                    <TypingEffect
                      text={message.text}
                      speed={25}
                      onComplete={() => handleTypingComplete(message.id)}
                    />
                  ) : (
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                      {message.text}
                    </ReactMarkdown>
                  )}
                </p>
                <span className="text-xs opacity-50 mt-1 block">
                  {message.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-3 justify-start"
          >
            <div className="flex-shrink-0 mt-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
                <MessageSquare className="w-3 h-3 text-background" />
              </div>
            </div>
            <div className="bg-card/80 border border-border/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border/10 p-4 backdrop-blur-xl bg-card/50">
        <div className="max-w-4xl mx-auto">
          {/* Quick Action Buttons */}
          <div className="flex gap-2 mb-3 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput("Pesquisar sobre ")}
              className="whitespace-nowrap"
            >
              <Search className="w-3 h-3 mr-1" />
              Pesquisar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput("Clima em ")}
              className="whitespace-nowrap"
            >
              <Cloud className="w-3 h-3 mr-1" />
              Clima
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput("Notícias sobre ")}
              className="whitespace-nowrap"
            >
              <Newspaper className="w-3 h-3 mr-1" />
              Notícias
            </Button>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Digite sua mensagem ou use comandos: 'pesquisar', 'clima', 'notícias'..."
                className="bg-background/80 border-border/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-24 rounded-2xl h-12 backdrop-blur-sm shadow-sm"
                disabled={isTyping}
              />

              {/* Upload de Imagem */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleImageUpload}
                disabled={isTyping}
                className="absolute right-14 top-1/2 -translate-y-1/2 h-8 w-8 transition-colors hover:bg-accent/10"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              {/* Botão de Voz */}
              <Button
                variant="ghost"
                size="icon"
                onClick={startListening}
                disabled={isListening || isTyping}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 transition-colors",
                  isListening
                    ? "text-accent bg-accent/10"
                    : "text-muted-foreground hover:text-accent hover:bg-accent/10"
                )}
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFeedback(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">
                Como está sua experiência?
              </h3>

              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={cn(
                      "text-2xl transition-colors",
                      star <= feedbackRating
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    ⭐
                  </button>
                ))}
              </div>

              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Deixe suas sugestões (opcional)"
                className="w-full p-3 bg-background border border-border rounded-lg resize-none h-20 text-sm"
              />

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFeedback(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={submitFeedback}
                  disabled={feedbackRating === 0}
                  className="flex-1"
                >
                  Enviar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão de Cancelar Resposta */}
      <div className="chat-controls">
        {/* ...botão enviar existente... */}
        <button
          type="button"
          onClick={() => {
            abortRef.current?.abort();
            abortRef.current = null;
            setIsSending(false);
            setIsTyping(false);
            setTypingMessageId(null);
            toast({ title: "Cancelado", description: "Resposta cancelada." });
          }}
          disabled={!isSending}
          aria-label="Cancelar resposta"
          className="btn btn-ghost"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default OrionChat;

// Para melhorar a velocidade e a organização das respostas da IA, considere as seguintes abordagens:

// 1. **Estrutura de Resposta**: Organize as respostas em tópicos usando listas ou seções.
//    - Utilize Markdown para formatar as respostas.
//    - Exemplo:
//      ```markdown
//      ## Tópico 1
//      - Ponto 1
//      - Ponto 2
//
//      ## Tópico 2
//      - Ponto 1
//      - Ponto 2
//      ```
// 2. **Aprimoramento de Performance**:
//    - Utilize técnicas de caching para armazenar respostas frequentes.
//    - Implemente chamadas assíncronas eficientes para evitar bloqueios.
// 3. **Feedback do Usuário**:
//    - Permita que os usuários forneçam feedback sobre a qualidade das respostas.
//    - Use esse feedback para treinar e melhorar o modelo.
// 4. **Aprimoramento do Modelo**:
//    - Considere ajustar o modelo de IA para priorizar respostas mais curtas e diretas.
//    - Treine o modelo com exemplos de respostas organizadas em tópicos.
// 5. **Limitação de Tamanho de Resposta**:
//    - Defina um limite de caracteres para as respostas, incentivando a concisão.
// 6. **Uso de Contexto**:
//    - Mantenha o contexto da conversa para que a IA possa responder de forma mais relevante e rápida.
// 7. **Testes e Iterações**:
//    - Realize testes A/B para diferentes formatos de resposta e colete dados sobre a eficácia.
//    - Ajuste com base nos resultados obtidos.
