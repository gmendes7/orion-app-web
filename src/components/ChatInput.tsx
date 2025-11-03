import { useDraft } from "@/hooks/useDraft";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Mic, Send, Image } from "lucide-react";
import { Button } from "./ui/button";
import { ImageAnalysisInChat } from "./ImageAnalysisInChat";
import { useState } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  isListening: boolean;
  startListening: () => void;
  conversationId: string | null;
}

export const ChatInput = ({
  onSendMessage,
  isTyping,
  isListening,
  startListening,
  conversationId,
}: ChatInputProps) => {
  const { draft, setDraft } = useDraft(conversationId);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleImageAnalysis = (analysis: string) => {
    // Adiciona a análise como mensagem automaticamente
    onSendMessage(`🖼️ Análise de Imagem:\n\n${analysis}`);
    setShowImageUpload(false);
  };

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
      {/* Image Upload Section */}
      {showImageUpload && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-2 sm:px-4 lg:px-6 py-3 border-t border-primary/20 bg-card/50"
        >
          <div className="max-w-4xl mx-auto">
            <ImageAnalysisInChat onAnalysisComplete={handleImageAnalysis} />
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="border-t border-primary/30 backdrop-blur-xl bg-card/60 p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={isTyping}
                rows={Math.min(Math.max(draft.split("\n").length, 1), 4)}
                className={cn(
                  "w-full resize-none rounded-2xl px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-4",
                  "pr-10 xs:pr-12 sm:pr-14 text-xs xs:text-sm sm:text-base",
                  "bg-orion-event-horizon/70 border-2 border-primary/30",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:border-primary focus:ring-4 focus:ring-primary/20",
                  "transition-all duration-300 backdrop-blur-sm",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg shadow-primary/5"
                )}
                style={{ minHeight: "48px", maxHeight: "140px" }}
                aria-label="Campo de mensagem"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5">
                {/* Image Upload Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  disabled={isTyping}
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 transition-all duration-300 rounded-xl",
                    showImageUpload 
                      ? "text-primary bg-primary/10 scale-110 shadow-lg shadow-primary/30" 
                      : "text-primary/70 hover:text-primary hover:bg-primary/10"
                  )}
                  title="Analisar imagem"
                >
                  <Image className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>

                {/* Voice Input */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={startListening}
                  disabled={isListening || isTyping}
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 transition-all duration-300 rounded-xl",
                    isListening
                      ? "text-accent bg-accent/10 animate-pulse scale-110 shadow-lg shadow-accent/30"
                      : "text-primary/70 hover:text-primary hover:bg-primary/10"
                  )}
                  title="Entrada de voz"
                >
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!draft.trim() || isTyping}
              className={cn(
                "w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl flex-shrink-0",
                "bg-gradient-to-br from-primary via-accent to-primary",
                "text-primary-foreground font-semibold",
                "shadow-2xl shadow-primary/40",
                "transition-all duration-300",
                "hover:scale-110 hover:shadow-primary/60 hover:rotate-12",
                "active:scale-95 active:rotate-0",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0",
                "border border-primary/50"
              )}
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
