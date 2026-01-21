/**
 * 🚨 Sistema de Tratamento de Erros - O.R.I.O.N
 * 
 * Classes e utilitários para tratamento centralizado de erros.
 * Fornece mensagens amigáveis e logging estruturado.
 */

import { secureLogger } from './security';

// ============================================
// CLASSES DE ERRO CUSTOMIZADAS
// ============================================

/**
 * Erro base para toda a aplicação
 */
export class OrionError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'ORION_ERROR',
    userMessage?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'OrionError';
    this.code = code;
    this.userMessage = userMessage || 'Ocorreu um erro inesperado. Tente novamente.';
    this.isOperational = isOperational;
    
    // Captura stack trace corretamente
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Erro de autenticação
 */
export class AuthError extends OrionError {
  constructor(message: string, userMessage?: string) {
    super(message, 'AUTH_ERROR', userMessage || 'Erro de autenticação. Verifique suas credenciais.');
  }
}

/**
 * Erro de validação
 */
export class ValidationError extends OrionError {
  public readonly fields: string[];

  constructor(message: string, fields: string[] = [], userMessage?: string) {
    super(message, 'VALIDATION_ERROR', userMessage || 'Dados inválidos. Verifique os campos.');
    this.fields = fields;
  }
}

/**
 * Erro de rate limit
 */
export class RateLimitError extends OrionError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(
      'Rate limit exceeded',
      'RATE_LIMIT_ERROR',
      `Limite de requisições atingido. Tente novamente em ${retryAfter} segundos.`
    );
    this.retryAfter = retryAfter;
  }
}

/**
 * Erro de rede/API
 */
export class NetworkError extends OrionError {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number, userMessage?: string) {
    super(
      message,
      'NETWORK_ERROR',
      userMessage || 'Erro de conexão. Verifique sua internet.'
    );
    this.statusCode = statusCode;
  }
}

/**
 * Erro de permissão
 */
export class PermissionError extends OrionError {
  constructor(message: string = 'Permission denied') {
    super(message, 'PERMISSION_ERROR', 'Você não tem permissão para realizar esta ação.');
  }
}

/**
 * Erro de recurso não encontrado
 */
export class NotFoundError extends OrionError {
  constructor(resource: string = 'Recurso') {
    super(
      `${resource} not found`,
      'NOT_FOUND_ERROR',
      `${resource} não encontrado.`
    );
  }
}

// ============================================
// HANDLER GLOBAL DE ERROS
// ============================================

/**
 * Processa erro e retorna mensagem amigável para o usuário
 */
export function handleError(error: unknown): {
  message: string;
  code: string;
  isOperational: boolean;
} {
  // Erro customizado do O.R.I.O.N
  if (error instanceof OrionError) {
    secureLogger.warn(`[${error.code}] ${error.message}`);
    return {
      message: error.userMessage,
      code: error.code,
      isOperational: error.isOperational,
    };
  }

  // Erro do Supabase
  if (isSupabaseError(error)) {
    return handleSupabaseError(error);
  }

  // Erro de rede (fetch)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    secureLogger.error('Network error', error);
    return {
      message: 'Erro de conexão. Verifique sua internet.',
      code: 'NETWORK_ERROR',
      isOperational: true,
    };
  }

  // Erro genérico
  if (error instanceof Error) {
    secureLogger.error('Unhandled error', error);
    return {
      message: 'Ocorreu um erro inesperado. Tente novamente.',
      code: 'UNKNOWN_ERROR',
      isOperational: false,
    };
  }

  // Erro desconhecido
  secureLogger.error('Unknown error type', error);
  return {
    message: 'Ocorreu um erro inesperado.',
    code: 'UNKNOWN_ERROR',
    isOperational: false,
  };
}

// ============================================
// HANDLERS ESPECÍFICOS
// ============================================

interface SupabaseErrorLike {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
}

function isSupabaseError(error: unknown): error is SupabaseErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'code' in error)
  );
}

function handleSupabaseError(error: SupabaseErrorLike): {
  message: string;
  code: string;
  isOperational: boolean;
} {
  const errorMessage = error.message || 'Erro desconhecido';
  
  // Mapeamento de erros comuns do Supabase
  const errorMappings: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos.',
    'User already registered': 'Este email já está cadastrado.',
    'Email not confirmed': 'Confirme seu email antes de fazer login.',
    'Password should be at least': 'A senha deve ter pelo menos 6 caracteres.',
    'Rate limit exceeded': 'Muitas tentativas. Aguarde um momento.',
    'JWT expired': 'Sessão expirada. Faça login novamente.',
    'new row violates row-level security': 'Você não tem permissão para esta ação.',
  };

  for (const [pattern, userMessage] of Object.entries(errorMappings)) {
    if (errorMessage.includes(pattern)) {
      secureLogger.warn(`Supabase error: ${pattern}`);
      return {
        message: userMessage,
        code: error.code || 'SUPABASE_ERROR',
        isOperational: true,
      };
    }
  }

  secureLogger.error('Supabase error', error);
  return {
    message: 'Erro no servidor. Tente novamente.',
    code: error.code || 'SUPABASE_ERROR',
    isOperational: true,
  };
}

// ============================================
// RETRY LOGIC
// ============================================

/**
 * Executa função com retry exponencial
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => error instanceof NetworkError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      secureLogger.debug(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
