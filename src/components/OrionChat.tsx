import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Mic, Send, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TypingEffect from "./TypingEffect";

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
      text: "Olá! Sou o O.R.I.Ö.N — pronto para ajudar.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTypingComplete = (messageId: string) => {
    if (typingMessageId === messageId) setTypingMessageId(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const conversation = [...messages, userMessage].map((m) => ({
        role: m.isUser ? "user" : "assistant",
        content: m.text,
      }));

      // PoC: call intent extraction function first
      const { data: intentData, error: intentError } =
        await supabase.functions.invoke("chat-intent", {
          body: { messages: conversation },
        });
      if (intentError) throw intentError;
      if (intentData?.error) throw new Error(intentData.error);

      const replyText = intentData?.reply_text || intentData?.reply || "";
      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          text: replyText,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setTypingMessageId(assistantId);

      const actions = Array.isArray(intentData.actions)
        ? intentData.actions
        : [];
      for (const action of actions) {
        if (action.requires_confirmation) {
          if (
            !window.confirm(
              `Confirmar ação: ${action.command} em ${action.target}?`
            )
          ) {
            setMessages((prev) => [
              ...prev,
              {
                id: `not-confirmed-${action.id}`,
                text: `Ação ${action.command} em ${action.target} não confirmada.`,
                isUser: false,
                timestamp: new Date(),
              },
            ]);
            continue;
          }
        }

        const { data: execData, error: execError } =
          await supabase.functions.invoke("execute-action", {
            body: { action },
          });
        if (execError) throw execError;
        setMessages((prev) => [
          ...prev,
          {
            id: `action-result-${action.id}`,
            text:
              execData?.output?.message || `Ação ${action.command} executada.`,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }

      setTypingMessageId(null);
      setIsTyping(false);
    } catch (error: unknown) {
      console.error("Erro ao enviar mensagem:", error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Falha na comunicação com O.R.I.Ö.N.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      const errMsg =
        error instanceof Error
          ? error.message
          : String(error ?? "Erro desconhecido");
      toast({ title: "Erro", description: errMsg, variant: "destructive" });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen relative">
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
                <div
                  className="w-3 h-3 bg-background rounded-full"
                  style={{ boxShadow: "var(--glow-gold)" }}
                />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
            </div>
            <div>
              <h1
                className="text-lg font-bold text-foreground tracking-wide"
                style={{ fontFamily: "'Orbitron', monospace" }}
              >
                O.R.I.Ö.N
              </h1>
              <span className="text-xs text-muted-foreground">
                Sistema Inteligente
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.isUser ? "justify-end" : "justify-start"
            )}
          >
            {!message.isUser && (
              <div className="flex-shrink-0 mt-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <div
                    className="w-3 h-3 bg-background rounded-full"
                    style={{ boxShadow: "var(--glow-gold)" }}
                  />
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
                    speed={15}
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
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 mt-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
                <div className="w-3 h-3 bg-background rounded-full" />
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
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
              style={{ boxShadow: "var(--glow-gold)" }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <motion.div
            className="text-center mt-4 text-xs text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <p>
              Desenvolvido por{" "}
              <span className="text-accent font-medium">
                Gabriel Mendes Lorenz Schjneider Sanhes
              </span>
              , 18 anos
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OrionChat;
