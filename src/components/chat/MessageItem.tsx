/**
 * 💬 Item de Mensagem - O.R.I.O.N
 * 
 * Componente otimizado para renderização de mensagens.
 * Usa memo para evitar re-renders desnecessários.
 */

import { ORION_LOGO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlockRenderer from "../CodeBlockRenderer";

interface MessageItemProps {
  id: string;
  text: string;
  isUser: boolean;
  index: number;
}

export const MessageItem = memo(({ id, text, isUser, index }: MessageItemProps) => {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.15) }}
      className={cn(
        "flex gap-2 xs:gap-2.5 sm:gap-3 md:gap-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for AI */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl shadow-lg shadow-primary/30 overflow-hidden">
            <img
              src={ORION_LOGO_URL}
              alt="O.R.I.O.N"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          "max-w-[88%] xs:max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%]",
          "rounded-xl xs:rounded-2xl px-3 xs:px-3.5 sm:px-4 md:px-5 py-2 xs:py-2.5 sm:py-3 md:py-4",
          "backdrop-blur-sm transition-all duration-300",
          isUser
            ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-primary/20 ml-auto"
            : "chat-message-orion text-foreground shadow-primary/10"
        )}
      >
        <div className="prose prose-sm prose-invert max-w-none text-xs xs:text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const codeText = String(children).replace(/\n$/, "");
                
                if (!inline && match) {
                  return (
                    <CodeBlockRenderer
                      language={match[1]}
                      codeText={codeText}
                      {...props}
                    />
                  );
                }
                
                return (
                  <code
                    className={cn(
                      className,
                      "bg-muted/50 text-accent px-1 py-0.5 rounded-sm text-[11px] xs:text-xs"
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {text || "▍"}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
});

MessageItem.displayName = "MessageItem";
