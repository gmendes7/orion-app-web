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
    <div className="flex flex-col h-screen bg-orion-deep-space relative">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-orion-neon-blue/20 p-4 bg-orion-surface/80 backdrop-blur-md"
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Satellite className="w-8 h-8 text-orion-neon-blue cosmic-glow" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orion-cosmic-orange rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-orion-neon-blue tracking-wide stellar-text" style={{ fontFamily: 'Orbitron, monospace' }}>
                O.R.I.Ö.N
              </h1>
              <span className="text-xs text-orion-ice-white/80 flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                Sistema Orbital Online
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-orion-neon-blue hover:bg-orion-neon-blue/10 cosmic-glow">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-6xl mx-auto w-full">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={cn(
              "flex",
              message.isUser ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-xs md:max-w-md lg:max-w-2xl xl:max-w-3xl rounded-xl p-4 chat-message-orion",
                message.isUser
                  ? "bg-gradient-to-r from-orion-neon-blue/80 to-orion-galactic-purple/60 text-orion-ice-white ml-auto border-orion-neon-blue/40"
                  : "bg-orion-surface-elevated/90 text-orion-ice-white border border-orion-cosmic-orange/30"
              )}
            >
              <div className="flex items-start space-x-3">
                {!message.isUser && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orion-cosmic-orange to-orion-neon-blue flex items-center justify-center">
                      <Satellite className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">
                    {!message.isUser && typingMessageId === message.id ? (
                      <TypingEffect 
                        text={message.text}
                        speed={20}
                        onComplete={() => handleTypingComplete(message.id)}
                      />
                    ) : (
                      message.text
                    )}
                  </p>
                  <span className="text-xs opacity-60 mt-2 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-start"
          >
            <div className="bg-orion-surface-elevated/90 border border-orion-cosmic-orange/30 rounded-xl p-4 chat-message-orion max-w-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orion-cosmic-orange to-orion-neon-blue flex items-center justify-center">
                  <Satellite className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex space-x-1 mb-2">
                    <div className="w-2 h-2 bg-orion-cosmic-orange rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-orion-neon-blue rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-orion-galactic-purple rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                  <span className="text-xs text-orion-ice-white/70">
                    O.R.I.Ö.N processando dados...
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="border-t border-orion-neon-blue/20 p-4 bg-orion-surface/80 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto flex space-x-3">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Transmitir mensagem para O.R.I.Ö.N..."
              className="bg-orion-surface-elevated/90 border-orion-neon-blue/30 text-orion-ice-white placeholder:text-orion-ice-white/50 focus:border-orion-neon-blue focus:ring-orion-neon-blue/20 pr-12 rounded-xl backdrop-blur-sm"
              disabled={isTyping}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-orion-cosmic-orange hover:bg-orion-cosmic-orange/10 h-8 w-8 cosmic-glow"
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="orion-button disabled:opacity-50 disabled:cursor-not-allowed h-10 px-6 rounded-xl"
          >
            <Send className="w-4 h-4 mr-2" />
            Transmitir
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default OrionChat;