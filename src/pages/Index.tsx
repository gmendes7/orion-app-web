import { useEffect } from "react";
import OrionChatOptimized from "@/components/OrionChatOptimized";
import SpaceBackground from "@/components/SpaceBackground";
import LanternEffect from "@/components/LanternEffect";
import performanceOptimizations from "@/utils/performance";

const Index = () => {
  // Inicializar otimizações de performance
  useEffect(() => {
    performanceOptimizations.initialize();
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fundo espacial */}
      <SpaceBackground />
      
      {/* Efeito lanterna */}
      <LanternEffect />
      
      <div className="relative z-10">
        <OrionChatOptimized />
      </div>
    </div>
  );
};

export default Index;
