import { useState, useEffect } from "react";
import RoboticEyeAnimation from "@/components/RoboticEyeAnimation";
import OrionChatOptimized from "@/components/OrionChatOptimized";
import SpaceBackground from "@/components/SpaceBackground";
import LanternEffect from "@/components/LanternEffect";
import performanceOptimizations from "@/utils/performance";

const Index = () => {
  const [showAnimation, setShowAnimation] = useState(true);

  // Inicializar otimizações de performance
  useEffect(() => {
    performanceOptimizations.initialize();
  }, []);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fundo espacial */}
      <SpaceBackground />
      
      {/* Efeito lanterna */}
      <LanternEffect />
      
      {showAnimation ? (
        <RoboticEyeAnimation onAnimationComplete={handleAnimationComplete} />
      ) : (
        <div className="relative z-10">
          <OrionChatOptimized />
        </div>
      )}
    </div>
  );
};

export default Index;
