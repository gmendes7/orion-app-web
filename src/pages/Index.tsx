import EyeAnimation from "@/components/EyeAnimation";
import OrionChatOptimized from "@/components/OrionChatOptimized";
import performanceOptimizations from "@/utils/performance";
import { useEffect, useState } from "react";

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);

  // Inicializar otimizações de performance
  useEffect(() => {
    performanceOptimizations.initialize();
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <EyeAnimation
        onAnimationComplete={handleIntroComplete}
        variant="ironman"
        intensity={1}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 relative">
      <OrionChatOptimized />
    </div>
  );
};

export default Index;