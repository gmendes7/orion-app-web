import EyeAnimation from "@/components/EyeAnimation";
import OrionChatOptimized from "@/components/OrionChatOptimized";
import performanceOptimizations from "@/utils/performance";
import { useEffect, useState } from "react";

const Index = () => {
  const [showIntro, setShowIntro] = useState(false); // Mudei para false para pular a animação inicial
  
  console.log('🏠 Index component renderizando, showIntro:', showIntro);

  // Inicializar otimizações de performance
  useEffect(() => {
    console.log('🏠 Inicializando otimizações de performance...');
    try {
      performanceOptimizations.initialize();
      console.log('✅ Otimizações inicializadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar otimizações:', error);
    }
  }, []);

  const handleIntroComplete = () => {
    console.log('🏠 Animação de introdução completada');
    setShowIntro(false);
  };

  if (showIntro) {
    console.log('🏠 Renderizando animação de introdução...');
    return (
      <EyeAnimation
        onAnimationComplete={handleIntroComplete}
        variant="ironman"
        intensity={1}
      />
    );
  }

  console.log('🏠 Renderizando chat principal...');
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 relative orion-bg-fallback">
      <OrionChatOptimized />
    </div>
  );
};

export default Index;