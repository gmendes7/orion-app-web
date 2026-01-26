import JarvisChat from "@/components/JarvisChat";
import performanceOptimizations from "@/utils/performance";
import { useEffect } from "react";

/**
 * 🏠 Index - Página principal do O.R.I.Ö.N JARVIS
 * 
 * Sistema de IA pessoal sem autenticação.
 * Acesso direto e imediato ao assistente.
 */
const Index = () => {
  console.log('🏠 Index - Carregando sistema JARVIS...');

  useEffect(() => {
    console.log('🏠 Inicializando otimizações de performance...');
    try {
      performanceOptimizations.initialize();
      console.log('✅ Otimizações inicializadas');
    } catch (error) {
      console.error('❌ Erro ao inicializar otimizações:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 relative orion-bg-fallback">
      <JarvisChat />
    </div>
  );
};

export default Index;
