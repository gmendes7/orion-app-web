import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Settings, Satellite, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import TypingEffect from "./TypingEffect";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const OrionChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Conexão estabelecida com O.R.I.Ö.N. Sistema orbital online e operacional. Como posso auxiliar em sua missão, comandante?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Preparar conversa para contexto
      const conversation = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

      console.log('Enviando mensagem para O.R.I.Ö.N AI...');
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: currentInput,
          conversation: conversation
        }
      });

      if (error) {
        console.error('Erro ao chamar função:', error);
        throw new Error(error.message || 'Erro ao comunicar com O.R.I.Ö.N');
      }

      if (data.error) {
        console.error('Erro retornado pela função:', data.error);
        throw new Error(data.error);
      }

      // Criar mensagem do O.R.I.Ö.N com efeito de digitação
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

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsTyping(false);
      
      // Mostrar mensagem de erro amigável
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Falha na comunicação orbital. Executando protocolos de reconexão... Por favor, tente novamente, comandante.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: "Falha na Comunicação Orbital",
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

  return (
    <div className="flex flex-col h-screen relative">
      {/* Minimalist Header - ChatGPT Style */}
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
                <div className="w-3 h-3 bg-background rounded-full" 
                     style={{ boxShadow: 'var(--glow-gold)' }} />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-wide" 
                  style={{ fontFamily: "'Orbitron', monospace" }}>
                O.R.I.Ö.N
              </h1>
              <span className="text-xs text-muted-foreground">Sistema Inteligente</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </motion.header>

      {/* Messages Area - ChatGPT Style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
              "flex gap-3",
              message.isUser ? "justify-end" : "justify-start"
            )}
          >
            {!message.isUser && (
              <div className="flex-shrink-0 mt-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <div className="w-3 h-3 bg-background rounded-full" 
                       style={{ boxShadow: 'var(--glow-gold)' }} />
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
                    speed={15}
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

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-3 justify-start"
          >
            <div className="flex-shrink-0 mt-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
                <div className="w-3 h-3 bg-background rounded-full" />
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

      {/* Input Area - Fixed Bottom */}
      <div className="border-t border-border/10 p-4 backdrop-blur-xl bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Converse com O.R.I.Ö.N..."
                className="bg-background/80 border-border/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-12 rounded-2xl h-12 backdrop-blur-sm shadow-sm"
                disabled={isTyping}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent hover:bg-accent/10 h-8 w-8 transition-colors"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200"
              style={{ boxShadow: 'var(--glow-gold)' }}
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
              <span className="text-accent font-medium">Gabriel Mendes Lorenz Schjneider Sanches</span>, 18 anos
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OrionChat;