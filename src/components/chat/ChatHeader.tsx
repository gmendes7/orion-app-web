/**
 * 📱 Header do Chat - O.R.I.O.N
 * 
 * Header responsivo com logo, seletor de agente e controles.
 * Otimizado para todos os tamanhos de tela.
 */

import { Button } from "@/components/ui/button";
import { ORION_LOGO_URL } from "@/lib/constants";

import { motion } from "framer-motion";
import { Menu, Square, Volume2, VolumeX } from "lucide-react";
import { memo } from "react";
import { AgentSelector } from "../AgentSelector";
import { RAGMemoryIndicator } from "../RAGMemoryIndicator";
import { AIAgent } from "@/hooks/useAIAgents";

interface ChatHeaderProps {
  onMenuClick: () => void;
  audioEnabled: boolean;
  onAudioToggle: () => void;
  isStreaming: boolean;
  isSpeaking: boolean;
  onStopStreaming: () => void;
  onStopSpeaking: () => void;
  selectedAgent: AIAgent | null;
  onSelectAgent: (agent: AIAgent | null) => void;
}

export const ChatHeader = memo(({
  onMenuClick,
  audioEnabled,
  onAudioToggle,
  isStreaming,
  isSpeaking,
  onStopStreaming,
  onStopSpeaking,
  selectedAgent,
  onSelectAgent,
}: ChatHeaderProps) => {
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="border-b border-primary/20 backdrop-blur-xl bg-card/50 shadow-lg flex-shrink-0 safe-top"
    >
      <div className="flex items-center justify-between px-2 py-2 xs:px-3 xs:py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 gap-2">
        {/* Left Section */}
        <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 min-w-0 flex-1">
          {/* Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-primary hover:text-primary/80 flex-shrink-0 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 touch-target"
            aria-label="Abrir menu"
          >
            <Menu className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
          </Button>

          {/* Logo */}
          <div className="relative group flex-shrink-0">
            <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl shadow-lg shadow-primary/20 overflow-hidden">
              <img
                src={ORION_LOGO_URL}
                alt="O.R.I.O.N Logo"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-accent rounded-full animate-pulse shadow-lg shadow-accent/50" />
          </div>

          {/* Title */}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-primary stellar-text truncate">
              O.R.I.O.N
            </h1>
            <span className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground truncate block">
              {selectedAgent?.name || "Assistente de IA"}
            </span>
          </div>

          {/* Agent Selector - Hidden on small screens */}
          <div className="hidden sm:block flex-shrink-0">
            <AgentSelector
              selectedAgent={selectedAgent}
              onSelectAgent={onSelectAgent}
            />
          </div>

          {/* RAG Indicator - Hidden on small screens */}
          <div className="hidden md:block flex-shrink-0">
            <RAGMemoryIndicator isActive={isStreaming} />
          </div>
        </div>

        {/* Right Section - Controls */}
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Audio Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onAudioToggle}
            className="text-primary/70 hover:text-primary hover:bg-primary/10 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 touch-target"
            aria-label={audioEnabled ? "Desativar áudio" : "Ativar áudio"}
          >
            {audioEnabled ? (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>

          {/* Stop Speaking */}
          {isSpeaking && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onStopSpeaking}
              className="text-accent hover:text-accent/80 h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 touch-target"
              aria-label="Parar fala"
            >
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </Button>
          )}

          {/* Stop Streaming */}
          {isStreaming && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStopStreaming}
              className="flex items-center gap-1 sm:gap-2 border-destructive text-destructive hover:bg-destructive/10 h-7 px-2 xs:h-8 xs:px-2.5 sm:h-9 sm:px-3"
            >
              <Square className="w-3 h-3" />
              <span className="hidden xs:inline text-xs sm:text-sm">Parar</span>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
});

ChatHeader.displayName = "ChatHeader";
