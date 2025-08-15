import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Settings, MessageSquare, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import TypingEffect from "./TypingEffect";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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
    if (audioEnabled && 'speechSynthesis' in window) {
      // Create a subtle typing sound using Web Speech API
      const utterance = new SpeechSynthesisUtterance('.');
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
      const conversation = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: currentInput,
          conversation: conversation
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro de comunicação');
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
      console.error('Erro ao enviar mensagem:', error);
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
        description: error instanceof Error ? error.message : "Erro desconhecido",
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

  const handleVoiceInput = async () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'pt-BR';
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
        title: "Recurso Não Disponível",
        description: "Seu navegador não suporta reconhecimento de voz.",
        variant: "destructive",
      });
    }
  };

  const submitFeedback = () => {
    if (feedbackRating === 0) return;

    // Store feedback (could be sent to analytics or database)
    console.log('Feedback recebido:', { rating: feedbackRating, comment: feedbackComment });
    
    toast({
      title: "Obrigado pelo Feedback!",
      description: "Suas sugestões nos ajudam a melhorar continuamente.",
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
              <h1 className="text-lg font-bold text-foreground tracking-wide" 
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                O.R.I.Ö.N
              </h1>
              <span className="text-xs text-muted-foreground">Assistente Inteligente</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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
              
              <div className={cn(
                "max-w-[70%] md:max-w-[60%] rounded-2xl px-4 py-3 backdrop-blur-sm",
                message.isUser
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-card/80 text-card-foreground border border-border/20"
              )}>
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
                  {message.timestamp.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
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
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
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
          
          {/* Footer Credits */}
          <motion.div 
            className="text-center mt-4 text-xs text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <p>
              Desenvolvido por{" "}
              <span className="text-accent font-medium">Gabriel Mendes Lorenz Schjneider Sanhes</span>, 18 anos
            </p>
          </motion.div>
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
              <h3 className="text-lg font-semibold mb-4">Como está sua experiência?</h3>
              
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={cn(
                      "text-2xl transition-colors",
                      star <= feedbackRating ? "text-primary" : "text-muted-foreground"
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