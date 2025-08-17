import { useEffect, useState, lazy, Suspense } from "react";
import OrionChatOptimized from "@/components/OrionChatOptimized";
import EyeAnimation from "@/components/EyeAnimation";
import performanceOptimizations from "@/utils/performance";

// Lazy load heavy components
const SpaceBackground = lazy(() => import("@/components/SpaceBackground"));
const LanternEffect = lazy(() => import("@/components/LanternEffect"));

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Suspense fallback={<div className="bg-orion-void min-h-screen" />}>
        {/* Fundo espacial */}
        <SpaceBackground />
        
        {/* Efeito lanterna */}
        <LanternEffect />
      </Suspense>
      
      <div className="relative z-10">
        <OrionChatOptimized />
      </div>
    </div>
  );
};

export default Index;
