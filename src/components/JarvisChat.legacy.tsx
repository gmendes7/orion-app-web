import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Mic, Send, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TypingEffect from "./TypingEffect";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const JarvisChat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Boa noite, senhor. Eu sou JARVIS, seu assistente inteligente. Como posso ajudá-lo hoje?",
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
    const userMessage: Message = { id: Date.now().toString(), text: input, isUser: true, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Prepara conversa no formato esperado pela função de intenção
      const conversation = [...messages, userMessage].map((m) => ({ role: m.isUser ? "user" : "assistant", content: m.text }));

      const { data: intentData, error: intentError } = await supabase.functions.invoke("chat-intent", { body: { messages: conversation } });
      if (intentError) throw intentError;
      if (intentData?.error) throw new Error(intentData.error);

      const replyText: string = intentData?.reply_text || intentData?.reply || "";
      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantId, text: replyText, isUser: false, timestamp: new Date() }]);
      setTypingMessageId(assistantId);

      const actions = Array.isArray(intentData?.actions) ? intentData.actions : [];
      for (const action of actions) {
        try {
          if (action.requires_confirmation) {
            // PoC: window.confirm — trocar por modal customizado se desejar
            const confirmed = window.confirm(`Confirmar ação: ${action.command} em ${action.target}?`);
            if (!confirmed) {
              setMessages((prev) => [...prev, { id: `not-confirmed-${action.id}`, text: `Ação ${action.command} em ${action.target} não confirmada.`, isUser: false, timestamp: new Date() }]);
              continue;
            }
          }

          const { data: execData, error: execError } = await supabase.functions.invoke("execute-action", { body: { action } });
          if (execError) throw execError;

          setMessages((prev) => [...prev, { id: `action-result-${action.id}`, text: execData?.output?.message || `Ação ${action.command} executada.`, isUser: false, timestamp: new Date() }]);
        } catch (actErr: unknown) {
          const e = actErr instanceof Error ? actErr : new Error(String(actErr));
          console.error("Erro ao processar ação:", e);
          setMessages((prev) => [...prev, { id: `action-error-${action.id}`, text: `Falha ao executar ação ${action.command}: ${e.message}`, isUser: false, timestamp: new Date() }]);
        }
      }

      setTypingMessageId(null);
      setIsTyping(false);
    } catch (error: unknown) {
      const e = error instanceof Error ? error : new Error(String(error));
      console.error("Erro ao enviar mensagem:", e);
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), text: "Desculpe, senhor. Estou com dificuldades técnicas no momento.", isUser: false, timestamp: new Date() }]);
      toast({ title: "Erro de Comunicação", description: e.message, variant: "destructive" });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-jarvis-deep-black">
      <header className="border-b border-jarvis-gold/20 p-4 bg-jarvis-surface">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-jarvis-gold rounded-full jarvis-glow animate-jarvis-glow-pulse" />
            <h1 className="text-xl font-bold text-jarvis-gold tracking-wide">J.A.R.V.I.S</h1>
            <span className="text-xs text-jarvis-gold-light">Online</span>
          </div>
          <Button variant="ghost" size="icon" className="text-jarvis-gold hover:bg-jarvis-gold/10"><Settings className="w-5 h-5" /></Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.isUser ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-4 jarvis-chat-message", message.isUser ? "bg-jarvis-gold text-jarvis-deep-black ml-auto" : "bg-jarvis-surface-elevated text-jarvis-gold border border-jarvis-gold/30")}> 
              <p className="text-sm leading-relaxed">{!message.isUser && typingMessageId === message.id ? (<TypingEffect text={message.text} speed={25} onComplete={() => handleTypingComplete(message.id)} />) : (message.text)}</p>
              <span className="text-xs opacity-60 mt-2 block">{message.timestamp.toLocaleTimeString()}</span>
            </div>
          </div>
        ))}

        {isTyping && (<div className="flex justify-start"><div className="bg-jarvis-surface-elevated border border-jarvis-gold/30 rounded-lg p-4 jarvis-chat-message"><div className="flex space-x-1"><div className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce" /><div className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><div className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></div><span className="text-xs text-jarvis-gold-light mt-2 block">JARVIS está pensando...</span></div></div>)}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-jarvis-gold/20 p-4 bg-jarvis-surface">
        <div className="max-w-4xl mx-auto flex space-x-2">
          <div className="flex-1 relative">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Pergunte qualquer coisa ao JARVIS..." className="bg-jarvis-surface-elevated border-jarvis-gold/30 text-jarvis-gold placeholder:text-jarvis-gold/50 focus:border-jarvis-gold focus:ring-jarvis-gold/20 pr-10" disabled={isTyping} />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-jarvis-gold hover:bg-jarvis-gold/10 h-8 w-8"><Mic className="w-4 h-4" /></Button>
          </div>
          <Button onClick={sendMessage} disabled={!input.trim() || isTyping} className="bg-jarvis-gold text-jarvis-deep-black hover:bg-jarvis-gold-light disabled:opacity-50 disabled:cursor-not-allowed jarvis-glow"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default JarvisChat;
    try {
      // Preparar conversa para contexto — incluir a mensagem atual
      const conversation = [...messages, userMessage].map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text,
      }));

      console.log("Enviando mensagem para JARVIS - chat-intent...");

      const { data: intentData, error: intentError } =
        await supabase.functions.invoke("chat-intent", {
          body: { messages: conversation },
        });

      if (intentError) throw intentError;
      if (intentData?.error) throw new Error(intentData.error);

      const replyText = intentData?.reply_text || intentData?.reply || "";
      const actions = Array.isArray(intentData?.actions) ? intentData.actions : [];

      // Mostra a resposta inicial do Jarvis
      const jarvisMessageId = (Date.now() + 1).toString();
      const jarvisResponse: Message = {
        id: jarvisMessageId,
        text: replyText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, jarvisResponse]);
      setTypingMessageId(jarvisMessageId);

      // Processa ações sugeridas
      for (const action of actions) {
        try {
          if (action.requires_confirmation) {
            const confirmed = window.confirm(
              `Confirmar ação: ${action.command} em ${action.target}?`
            );
            if (!confirmed) {
              setMessages((prev) => [
                ...prev,
                {
                  id: `not-confirmed-${action.id}`,
                  text: `Ação ${action.command} em ${action.target} não confirmada pelo usuário.`,
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
              text: execData?.output?.message || `Ação ${action.command} executada.`,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
        } catch (actErr: any) {
          console.error("Erro ao processar ação:", actErr);
          setMessages((prev) => [
            ...prev,
            {
              id: `action-error-${action.id}`,
              text: `Falha ao executar ação ${action.command}: ${actErr?.message || actErr}`,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
        }
      }

      setTypingMessageId(null);
      setIsTyping(false);
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      setIsTyping(false);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, senhor. Estou enfrentando dificuldades técnicas no momento. Por favor, verifique sua conexão e tente novamente.",
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
              ]);
            }
          }

          setTypingMessageId(null);
          setIsTyping(false);
        } catch (error) {
          console.error("Erro ao enviar mensagem:", error);
          setIsTyping(false);

          // Mostrar mensagem de erro amig e1vel
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "Desculpe, senhor. Estou enfrentando dificuldades t e9cnicas no momento. Por favor, verifique sua conex e3o e tente novamente.",
            isUser: false,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, errorMessage]);

          toast({
            title: "Erro de Comunica e7 e3o",
            description:
              error instanceof Error ? error.message : "Erro desconhecido",
            variant: "destructive",
          });
        }
            variant="ghost"
            size="icon"
            className="text-jarvis-gold hover:bg-jarvis-gold/10"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.isUser ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-4 jarvis-chat-message",
                message.isUser
                  ? "bg-jarvis-gold text-jarvis-deep-black ml-auto"
                  : "bg-jarvis-surface-elevated text-jarvis-gold border border-jarvis-gold/30"
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
              <span className="text-xs opacity-60 mt-2 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-jarvis-surface-elevated border border-jarvis-gold/30 rounded-lg p-4 jarvis-chat-message">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
              <span className="text-xs text-jarvis-gold-light mt-2 block">
                JARVIS está pensando...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-jarvis-gold/20 p-4 bg-jarvis-surface">
        <div className="max-w-4xl mx-auto flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pergunte qualquer coisa ao JARVIS..."
              className="bg-jarvis-surface-elevated border-jarvis-gold/30 text-jarvis-gold placeholder:text-jarvis-gold/50 focus:border-jarvis-gold focus:ring-jarvis-gold/20 pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-jarvis-gold hover:bg-jarvis-gold/10 h-8 w-8"
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="bg-jarvis-gold text-jarvis-deep-black hover:bg-jarvis-gold-light disabled:opacity-50 disabled:cursor-not-allowed jarvis-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JarvisChat;
