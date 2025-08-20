<<<<<<< Updated upstream
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
import { useEffect, useRef, useState } from "react";
import TypingEffect from "./TypingEffect";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  const playTypingSound = () => {
    if (audioEnabled && "speechSynthesis" in window) {
      // Create a subtle typing sound using Web Speech API
      const utterance = new SpeechSynthesisUtterance(".");
      utterance.volume = 0.1;
      utterance.rate = 10;
      utterance.pitch = 2;
      speechSynthesis.speak(utterance);
    }
  };

  const handleImageAnalysis = async (imageUrl: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imageUrl },
      });

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

  const handleWebSearch = async (query: string) => {
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
  };

  const handleWeatherQuery = async (city: string) => {
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
  };

  const handleNewsQuery = async (query?: string) => {
    try {
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
        }**\n\n` +
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
    } catch (error) {
      console.error("Erro ao buscar notícias:", error);
      return "❌ Não foi possível obter as notícias.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    const currentInput = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Detectar e executar comandos especiais primeiro
      const commandResult = await detectAndExecuteCommands(currentInput);

      if (commandResult) {
        const commandResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: commandResult,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, commandResponse]);
        setTypingMessageId(commandResponse.id);
        setIsTyping(false);

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
      const orionResponse: Message = {
        id: orionMessageId,
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, orionResponse]);
      setTypingMessageId(orionMessageId);
      setIsTyping(false);

      // Auto-falar resposta se áudio estiver habilitado
      if (audioEnabled) {
        speak(data.response);
      }

      // Play typing sound when AI starts responding
      playTypingSound();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setIsTyping(false);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, ocorreu um erro na comunicação. Tente novamente.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Erro de Comunicação",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
                    message.text
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
                onKeyPress={handleKeyPress}
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
    </div>
  );
};

export default OrionChat;
=======
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  Mic,
  Send,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TypingEffect from "./TypingEffect";

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
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Synthetic speech for typing sound effect
  const playTypingSound = () => {
    if (audioEnabled && "speechSynthesis" in window) {
      // Create a subtle typing sound using Web Speech API
      const utterance = new SpeechSynthesisUtterance(".");
      utterance.volume = 0.1;
      utterance.rate = 10;
      utterance.pitch = 2;
      speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    const currentInput = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
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
      const orionResponse: Message = {
        id: orionMessageId,
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, orionResponse]);
      setTypingMessageId(orionMessageId);
      setIsTyping(false);

      // Play typing sound when AI starts responding
      playTypingSound();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setIsTyping(false);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, ocorreu um erro na comunicação. Tente novamente.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Erro de Comunicação",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTypingComplete = (messageId: string) => {
    if (typingMessageId === messageId) {
      setTypingMessageId(null);
    }
  };
  
  
      console.error("SpeechRecognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log("🎤 Ouvindo...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Você disse:", transcript);
    };

    recognition.onerror = (event) => {
      console.error("Erro no reconhecimento:", event.error);
    };

    recognition.onend = () => {
      console.log("Reconhecimento encerrado.");
    };

    recognition.start();
  };

  async function handleVoiceInput(): Promise<void> {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      async function handleVoiceInput() {
        // Verifica suporte à API
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
          console.error("SpeechRecognition API not supported in this browser.");
          return;
        }

        // Cria instância do reconhecimento
        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR"; // idioma do reconhecimento
        recognition.continuous = false; // para ouvir apenas uma frase
        recognition.interimResults = false; // retorna só resultados finais

        // Eventos
        recognition.onstart = () => {
          console.log("🎤 Listening...");
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          console.log("Você disse:", transcript);
        };

        recognition.onerror = (event) => {
          console.error("Erro no reconhecimento:", event.error);
        };

        recognition.onend = () => {
          console.log("Reconhecimento encerrado.");
        };

        recognition.start();
      }
      async function handleVoiceInput(): Promise<void> {
        // Descobre qual implementação usar
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
          console.error("SpeechRecognition API not supported in this browser.");
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          console.log("🎤 Ouvindo...");
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log("Você disse:", transcript);
        };

        recognition.onerror = (event: any) => {
          console.error("Erro no reconhecimento:", event.error);
        };

        recognition.onend = () => {
          console.log("Reconhecimento encerrado.");
        };

        recognition.start();
      }

      const recognition = new SpeechRecognition();

      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Erro no Reconhecimento de Voz",
          description: "Não foi possível capturar o áudio. Tente novamente.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Desculpa no momento esse Recurso Não esta Disponível",
        description: "Seu navegador não suporta reconhecimento de voz.",
        variant: "destructive",
      });
    }
  }

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
                    message.text
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
          <div className="relative flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="bg-background/80 border-border/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-12 rounded-2xl h-12 backdrop-blur-sm shadow-sm"
                disabled={isTyping}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVoiceInput}
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
    </div>
  );
};

export default OrionChat;
>>>>>>> Stashed changes
