/**
 * 📜 Lista de Mensagens - O.R.I.O.N
 * 
 * Container scrollável para mensagens com loading states.
 * Otimizado para performance com virtualização básica.
 */

import { ORION_LOGO_URL } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useRef } from "react";
import { MessageItem } from "./MessageItem";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
}

export const MessageList = memo(({
  messages,
  isLoading,
  isTyping,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-muted-foreground">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 xs:p-3 sm:p-4 md:p-6 space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-5 scroll-touch scrollbar-hide">
      <div className="max-w-4xl mx-auto w-full">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              id={message.id}
              text={message.text}
              isUser={message.isUser}
              index={index}
            />
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex justify-start"
          >
            <div className="flex gap-2 xs:gap-2.5 sm:gap-3">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl shadow-lg shadow-primary/30 overflow-hidden flex-shrink-0">
                <img
                  src={ORION_LOGO_URL}
                  alt="O.R.I.O.N"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="chat-message-orion rounded-xl xs:rounded-2xl px-3 xs:px-4 sm:px-5 py-2.5 xs:py-3 sm:py-4 backdrop-blur-sm">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-primary rounded-full"
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
});

MessageList.displayName = "MessageList";
