/**
 * 📝 TranscriptDisplay - Exibição de Transcrição
 * 
 * Mostra texto de forma secundária e elegante.
 * Foco em voz, texto como suporte.
 */

import { motion, AnimatePresence } from "framer-motion";
import { forwardRef, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface TranscriptDisplayProps {
  messages: Message[];
  isTyping?: boolean;
  className?: string;
}

export const TranscriptDisplay = forwardRef<HTMLDivElement, TranscriptDisplayProps>(({
  messages,
  isTyping = false,
  className = "",
}, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  if (messages.length === 0 && !isTyping) {
    return null;
  }

  // Filter out proactive/behavioral system messages
  const visibleMessages = messages.filter(
    (m) => !m.text.startsWith("[ORION_PROACTIVE]") && !m.text.startsWith("[ORION_BEHAVIORAL]")
  );

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div
        ref={scrollRef}
        className="max-h-32 md:max-h-48 overflow-y-auto scroll-touch scrollbar-thin scrollbar-thumb-orion-stellar-gold/20 scrollbar-track-transparent"
      >
        <AnimatePresence mode="popLayout">
          {visibleMessages.slice(-5).map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-2 ${message.isUser ? "text-right" : "text-left"}`}
            >
              <span
                className={`inline-block px-3 py-1.5 rounded-lg text-sm ${
                  message.isUser
                    ? "bg-orion-stellar-gold/20 text-orion-stellar-gold"
                    : "bg-muted/30 text-foreground"
                }`}
              >
                {message.isUser ? (
                  message.text
                ) : (
                  <span className="prose prose-sm prose-invert max-w-none [&>p]:m-0">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </span>
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 text-left"
          >
            <span className="inline-block px-3 py-1.5 rounded-lg bg-muted/30">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-orion-stellar-gold"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </span>
            </span>
          </motion.div>
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none" />
    </motion.div>
  );
});

TranscriptDisplay.displayName = "TranscriptDisplay";

export default TranscriptDisplay;
