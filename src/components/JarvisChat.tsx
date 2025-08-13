import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const JarvisChat = () => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate JARVIS response
    setTimeout(() => {
      const jarvisResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Compreendo sua solicitação: "${input}". Estou processando esta informação com minhas capacidades avançadas de IA. Esta é uma demonstração da interface JARVIS.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, jarvisResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-jarvis-deep-black">
      {/* Header */}
      <header className="border-b border-jarvis-gold/20 p-4 bg-jarvis-surface">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-jarvis-gold rounded-full jarvis-glow animate-jarvis-glow-pulse" />
            <h1 className="text-xl font-bold text-jarvis-gold tracking-wide">
              J.A.R.V.I.S
            </h1>
            <span className="text-xs text-jarvis-gold-light">Online</span>
          </div>
          <Button variant="ghost" size="icon" className="text-jarvis-gold hover:bg-jarvis-gold/10">
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
              <p className="text-sm leading-relaxed">{message.text}</p>
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
                <div className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
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
            disabled={!input.trim()}
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