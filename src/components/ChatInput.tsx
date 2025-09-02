import { useDraft } from "@/hooks/useDraft";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Cloud, Mic, Newspaper, Search, Send } from "lucide-react";
import { Button } from "./ui/button";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  isListening: boolean;
  startListening: () => void;
}
conversationId: string | null;

const quickActions = [
  {
    icon: Search,
    label: "Pesquisar",
    action: (setInput: (text: string) => void) => setInput("Pesquisar sobre "),
    color: "from-orion-cosmic-blue to-orion-stellar-gold",
  },
  {
    icon: Cloud,
    label: "Clima",
    action: (setInput: (text: string) => void) => setInput("Clima em "),
    color: "from-orion-energy-burst to-orion-accretion-disk",
  },
  {
    icon: Newspaper,
    label: "Notícias",
    action: (setInput: (text: string) => void) => setInput("Notícias sobre "),
    color: "from-orion-plasma-glow to-orion-stellar-gold",
  },
];

export const ChatInput = ({
  onSendMessage,
  isTyping,
  isListening,
  startListening,
  conversationId,
}: ChatInputProps) => {
  const { draft, setDraft } = useDraft(conversationId);

  const handleSend = () => {
    if (!draft.trim()) return;
    onSendMessage(draft);
    setDraft("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Adiciona indentação com Tab, como solicitado
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const value = el.value;

      el.value = value.substring(0, start) + "  " + value.substring(end);
      el.selectionStart = el.selectionEnd = start + 2;

      // Atualiza o estado do rascunho
      setDraft(el.value);
    }
  };

  return (
    <>
      {/* Quick Actions */}
      <div className="px-2 sm:px-4 py-2">
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center max-w-4xl mx-auto">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => action.action(setDraft)}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300",
                "bg-gradient-to-r",
                action.color,
                "text-orion-void hover:scale-105 hover:shadow-lg active:scale-95",
                "border border-white/20 backdrop-blur-sm"
              )}
            >
              <action.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline text-xs sm:text-sm">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="border-t border-orion-cosmic-blue/20 backdrop-blur-xl bg-card/50 p-2 sm:p-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
                disabled={isTyping}
                rows={Math.min(Math.max(draft.split("\n").length, 1), 4)}
                className={cn(
                  "w-full resize-none rounded-xl px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-sm",
                  "bg-orion-event-horizon/50 border-2 border-orion-cosmic-blue/30",
                  "text-foreground placeholder-orion-space-dust",
                  "focus:border-orion-stellar-gold/60 focus:ring-2 focus:ring-orion-stellar-gold/20",
                  "transition-all duration-300 backdrop-blur-sm",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={startListening}
                  disabled={isListening || isTyping}
                  className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 text-orion-cosmic-blue hover:text-orion-stellar-gold transition-all duration-300",
                    isListening &&
                      "text-orion-accretion-disk animate-pulse scale-110"
                  )}
                >
                  <Mic className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!draft.trim() || isTyping}
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold",
                "text-orion-void font-medium shadow-lg transition-all duration-300",
                "hover:scale-105 hover:shadow-xl active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                "border border-white/20"
              )}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
