import { OrionInterface } from "@/components/orion";
import performanceOptimizations from "@/utils/performance";
import { useEffect } from "react";

/**
 * 🏠 Index - Interface Principal ORION
 * 
 * Sistema de IA pessoal imersivo.
 * Foco em: Olho central, voz, sensorial.
 */
const Index = () => {
  useEffect(() => {
    try {
      performanceOptimizations.initialize();
    } catch (error) {
      console.error('❌ Erro ao inicializar otimizações:', error);
    }
  }, []);

  return <OrionInterface />;
};

export default Index;
