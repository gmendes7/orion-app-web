// Sistema de fallback inteligente para comandos da API
export interface SafeCommandResult {
  success: boolean;
  data?: any;
  message: string;
  error?: Error;
}

export const safeCommandExecution = async (
  commandFn: () => Promise<any>,
  fallbackMessage: string,
  commandType: 'search' | 'weather' | 'news' = 'search'
): Promise<SafeCommandResult> => {
  try {
    const result = await commandFn();
    return {
      success: true,
      data: result,
      message: result
    };
  } catch (error) {
    // Log detalhado para debug (não mostrado ao usuário)
    console.error(`[${commandType.toUpperCase()}] Erro na execução do comando:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      commandType
    });

    // Mensagens amigáveis específicas por tipo de comando
    const friendlyMessages = {
      search: "🔍 Não consegui encontrar resultados agora. Tente reformular sua pergunta ou aguarde um momento. ✨",
      weather: "🌤️ Desculpe, não consegui acessar a previsão do tempo agora. Mas posso tentar de novo mais tarde! ☀️",
      news: "📰 No momento não consegui buscar as notícias. Tente novamente em alguns minutos. 📺"
    };

    return {
      success: false,
      message: friendlyMessages[commandType] || fallbackMessage,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

// Padrão de resposta futurista com estilo neon
export const formatNeonResponse = (message: string, isError: boolean = false): string => {
  const prefix = isError ? "⚠️ " : "✨ ";
  const suffix = isError ? " ⚡" : " 🚀";
  
  return `${prefix}**${message}**${suffix}`;
};