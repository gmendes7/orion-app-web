/**
 * 🔐 Configuração Centralizada do Supabase
 * 
 * Este arquivo centraliza todas as constantes de configuração do Supabase.
 * IMPORTANTE: Estas são chaves públicas (anon key) e podem ser expostas no cliente.
 * A segurança real é garantida pelas Row Level Security (RLS) policies no banco.
 */

export const SUPABASE_CONFIG = {
  // URL base do projeto Supabase
  url: "https://wcwwqfiolxcluyuhmxxf.supabase.co",
  
  // Chave anônima pública (segura para uso no cliente)
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3dxZmlvbHhjbHV5dWhteHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTA4MDMsImV4cCI6MjA3MDY2NjgwM30.IZQUelbBZI492dffw3xd2eYtSn7lx7RcyuKYWtyaDDc",
  
  // ID do projeto
  projectId: "wcwwqfiolxcluyuhmxxf",
} as const;

/**
 * 🔗 URLs das Edge Functions
 * Construídas dinamicamente a partir da URL base
 */
export const EDGE_FUNCTIONS = {
  chatAI: `${SUPABASE_CONFIG.url}/functions/v1/chat-ai`,
  analyzeImage: `${SUPABASE_CONFIG.url}/functions/v1/analyze-image`,
  processDocument: `${SUPABASE_CONFIG.url}/functions/v1/process-document`,
  semanticSearch: `${SUPABASE_CONFIG.url}/functions/v1/semantic-search`,
  ragChat: `${SUPABASE_CONFIG.url}/functions/v1/rag-chat`,
  webSearch: `${SUPABASE_CONFIG.url}/functions/v1/web-search`,
  weatherAPI: `${SUPABASE_CONFIG.url}/functions/v1/weather-api`,
  newsAPI: `${SUPABASE_CONFIG.url}/functions/v1/news-api`,
} as const;

/**
 * 📊 Configurações de Timeout e Retry
 */
export const API_CONFIG = {
  // Timeout padrão para requisições (30 segundos)
  defaultTimeout: 30000,
  
  // Timeout para streaming (2 minutos)
  streamTimeout: 120000,
  
  // Número máximo de tentativas em caso de erro
  maxRetries: 3,
  
  // Delay entre tentativas (em ms)
  retryDelay: 1000,
} as const;
