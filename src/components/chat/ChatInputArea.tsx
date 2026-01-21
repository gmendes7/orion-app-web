/**
 * ⌨️ Input de Chat Otimizado - O.R.I.O.N
 * 
 * Área de input responsiva com suporte a voz e imagem.
 * Mobile-first com touch optimizations.
 */

import { useDraft } from "@/hooks/useDraft";
import { cn } from "@/lib/utils";
import { sanitizeMessage } from "@/lib/validation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Image, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { ImageAnalysisInChat } from "../ImageAnalysisInChat";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/integrations/hooks/use-toast";

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  isListening: boolean;
  startListening: () => void;
  conversationId: string | null;
  disabled?: boolean;
}

export const ChatInputArea = ({
  onSendMessage,
  isTyping,
  isListening,
  startListening,
  conversationId,
  disabled = false,
}: ChatInputAreaProps) => {
  const { draft, setDraft } = useDraft(conversationId);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    }
  }, [draft]);

  const handleImageAnalysis = useCallback((analysis: string) => {
    onSendMessage(`🖼️ Análise de Imagem:\n\n${analysis}`);
    setShowImageUpload(false);
  }, [onSendMessage]);

  const handleSend = useCallback(() => {
    if (!draft.trim() || disabled) return;

    try {
      const sanitized = sanitizeMessage(draft);
      onSendMessage(sanitized);
      setDraft("");
      setValidationError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro de validação';
      setValidationError(message);
      toast({
        title: "Mensagem inválida",
        description: message,
        variant: "destructive",
      });
    }
  }, [draft, disabled, onSendMessage, setDraft, toast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter para enviar (sem Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    // Tab para indentação
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      setDraft(value.substring(0, start) + "  " + value.substring(end));
      
      // Reposiciona cursor
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  }, [handleSend, setDraft]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    setValidationError(null);
  }, [setDraft]);

  const isDisabled = disabled || isTyping;
  const canSend = draft.trim().length > 0 && !isDisabled;

  return (
    <>
      {/* Image Upload Section */}
      <AnimatePresence>
        {showImageUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2 xs:px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border-t border-primary/20 bg-card/50"
          >
            <div className="max-w-4xl mx-auto">
              <ImageAnalysisInChat onAnalysisComplete={handleImageAnalysis} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="border-t border-primary/30 backdrop-blur-xl bg-card/60 p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-5 safe-bottom"
      >
        <div className="max-w-4xl mx-auto">
          {/* Validation Error */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-destructive text-xs mb-2 px-1"
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{validationError}</span>
            </motion.div>
          )}

          <div className="relative flex items-end gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3">
            {/* Textarea Container */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                disabled={isDisabled}
                rows={1}
                className={cn(
                  "w-full resize-none rounded-xl xs:rounded-2xl",
                  "px-3 xs:px-3.5 sm:px-4 py-2.5 xs:py-3 sm:py-3.5",
                  "pr-[72px] xs:pr-[80px] sm:pr-[88px]",
                  "text-sm",
                  "bg-muted/70 border-2 border-primary/30",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                  "transition-all duration-200 backdrop-blur-sm",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg shadow-primary/5",
                  validationError && "border-destructive focus:border-destructive"
                )}
                style={{ minHeight: "44px", maxHeight: "140px" }}
                aria-label="Campo de mensagem"
                aria-invalid={!!validationError}
              />
              
              {/* Inline Buttons */}
              <div className="absolute right-2 xs:right-2.5 sm:right-3 bottom-1.5 xs:bottom-2 sm:bottom-2.5 flex gap-1 xs:gap-1.5">
                {/* Image Upload Toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  disabled={isDisabled}
                  className={cn(
                    "w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl touch-target",
                    showImageUpload
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                  aria-label="Analisar imagem"
                >
                  <Image className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5" />
                </Button>

                {/* Voice Input */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={startListening}
                  disabled={isListening || isDisabled}
                  className={cn(
                    "w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl touch-target",
                    isListening
                      ? "text-accent bg-accent/10 animate-pulse"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                  aria-label={isListening ? "Ouvindo..." : "Entrada de voz"}
                >
                  <Mic className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5" />
                </Button>
              </div>
            </div>

            {/* Send Button */}
            <Button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-xl xs:rounded-2xl flex-shrink-0 touch-target",
                "bg-gradient-to-br from-primary via-accent to-primary",
                "text-primary-foreground font-semibold",
                "shadow-xl shadow-primary/30",
                "transition-all duration-200",
                "hover:scale-105 hover:shadow-primary/50",
                "active:scale-95",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
                "border border-primary/50"
              )}
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Character Counter */}
          <div className="flex justify-end mt-1 px-1">
            <span className={cn(
              "text-[10px] xs:text-xs text-muted-foreground/60",
              draft.length > 9000 && "text-yellow-500",
              draft.length > 9500 && "text-destructive"
            )}>
              {draft.length > 0 && `${draft.length.toLocaleString()} / 10.000`}
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
};
