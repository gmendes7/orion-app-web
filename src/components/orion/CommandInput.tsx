/**
 * 💬 CommandInput - Input de Comando Minimalista
 * 
 * Input de texto secundário, foco em voz.
 * Design futurista e discreto.
 */

import { motion } from "framer-motion";
import { Send, Mic, Loader2 } from "lucide-react";
import { useState, useRef, KeyboardEvent } from "react";

interface CommandInputProps {
  onSend: (message: string) => void;
  onVoiceToggle: () => void;
  isListening: boolean;
  isProcessing: boolean;
  placeholder?: string;
  className?: string;
}

export const CommandInput = ({
  onSend,
  onVoiceToggle,
  isListening,
  isProcessing,
  placeholder = "Digite ou use voz...",
  className = "",
}: CommandInputProps) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {/* Container principal */}
      <div className="relative flex items-center gap-2 px-4 py-3 rounded-2xl bg-card/30 backdrop-blur-xl border border-orion-stellar-gold/20">
        {/* Botão de voz */}
        <motion.button
          onClick={onVoiceToggle}
          className={`p-2 rounded-xl transition-all ${
            isListening
              ? "bg-orion-stellar-gold text-orion-void"
              : "bg-orion-stellar-gold/10 text-orion-stellar-gold hover:bg-orion-stellar-gold/20"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={isListening ? {
            boxShadow: ["0 0 10px rgba(255,200,50,0.5)", "0 0 20px rgba(255,200,50,0.8)", "0 0 10px rgba(255,200,50,0.5)"],
          } : {}}
          transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
        >
          <Mic className="w-5 h-5" />
        </motion.button>

        {/* Input de texto */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Ouvindo..." : placeholder}
          disabled={isProcessing}
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm font-light"
        />

        {/* Botão de enviar */}
        <motion.button
          onClick={handleSend}
          disabled={!input.trim() || isProcessing}
          className={`p-2 rounded-xl transition-all ${
            input.trim() && !isProcessing
              ? "bg-orion-stellar-gold text-orion-void"
              : "bg-muted/20 text-muted-foreground"
          }`}
          whileHover={input.trim() ? { scale: 1.05 } : {}}
          whileTap={input.trim() ? { scale: 0.95 } : {}}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {/* Indicador de escuta */}
      {isListening && (
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orion-stellar-gold/20 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-xs font-mono text-orion-stellar-gold animate-pulse">
            ● ESCUTANDO
          </span>
        </motion.div>
      )}

      {/* Linha decorativa inferior */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-orion-stellar-gold/50 to-transparent"
        style={{ width: "80%" }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
};

export default CommandInput;
