import { Brain, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRAGMemory } from "@/hooks/useRAGMemory";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RAGMemoryIndicatorProps {
  isActive?: boolean;
  contextCount?: number;
}

export const RAGMemoryIndicator = ({ isActive = false, contextCount = 0 }: RAGMemoryIndicatorProps) => {
  const { stats, fetchMemoryStats } = useRAGMemory();
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    fetchMemoryStats();
  }, [fetchMemoryStats]);

  useEffect(() => {
    if (isActive) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
            animate={showPulse ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Brain className="w-4 h-4 text-primary" />
            <Database className="w-3 h-3 text-primary/70" />
            
            <AnimatePresence>
              {isActive && contextCount > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                >
                  {contextCount}
                </motion.div>
              )}
            </AnimatePresence>

            {showPulse && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/30"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1 }}
              />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="bg-background border-primary/20">
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-primary">🧠 Memória RAG Ativa</p>
            <p className="text-muted-foreground">
              {stats.totalEmbeddings} memórias armazenadas
            </p>
            {isActive && contextCount > 0 && (
              <p className="text-primary font-medium">
                {contextCount} memórias relevantes em uso
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
