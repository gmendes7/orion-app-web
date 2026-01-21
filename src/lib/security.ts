/**
 * 🛡️ Utilitários de Segurança - O.R.I.O.N
 * 
 * Funções de segurança para proteção contra ataques comuns.
 * Implementa rate limiting client-side, sanitização e logging seguro.
 */

// ============================================
// RATE LIMITING CLIENT-SIDE
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Verifica rate limit client-side (complementa server-side)
 * @param key Identificador único (ex: 'sendMessage', 'login')
 * @param limit Número máximo de requisições
 * @param windowMs Janela de tempo em ms
 */
export function checkRateLimit(
  key: string,
  limit: number = 30,
  windowMs: number = 60000
): { allowed: boolean; remainingRequests: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // Nova janela
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingRequests: limit - 1, resetIn: windowMs };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remainingRequests: limit - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Reset rate limit para uma chave específica
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

// ============================================
// LOGGING SEGURO
// ============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = import.meta.env.PROD;

/**
 * Logger seguro que não expõe dados sensíveis em produção
 */
export const secureLogger = {
  debug: (message: string, ...data: unknown[]) => {
    if (!isProduction) {
      console.log(`🔍 [DEBUG] ${message}`, ...sanitizeLogData(data));
    }
  },

  info: (message: string, ...data: unknown[]) => {
    console.log(`ℹ️ [INFO] ${message}`, ...sanitizeLogData(data));
  },

  warn: (message: string, ...data: unknown[]) => {
    console.warn(`⚠️ [WARN] ${message}`, ...sanitizeLogData(data));
  },

  error: (message: string, error?: unknown) => {
    const sanitizedError = sanitizeError(error);
    console.error(`❌ [ERROR] ${message}`, sanitizedError);
  },
};

/**
 * Sanitiza dados de log removendo informações sensíveis
 */
function sanitizeLogData(data: unknown[]): unknown[] {
  if (!isProduction) return data;

  return data.map((item) => {
    if (typeof item === 'object' && item !== null) {
      return sanitizeObject(item as Record<string, unknown>);
    }
    return item;
  });
}

/**
 * Sanitiza objeto removendo campos sensíveis
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'session',
    'email',
    'creditCard',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitiza erro para logging seguro
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Em produção, não expõe stack trace
    if (isProduction) {
      return error.message;
    }
    return `${error.message}\n${error.stack}`;
  }
  return String(error);
}

// ============================================
// PROTEÇÃO XSS
// ============================================

/**
 * Escapa HTML para prevenir XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Valida URL para prevenir XSS via javascript:
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitiza URL para uso seguro
 */
export function sanitizeUrl(url: string): string {
  if (!isValidUrl(url)) {
    return '';
  }
  return encodeURI(url);
}

// ============================================
// PROTEÇÃO CSRF
// ============================================

/**
 * Gera token CSRF (para uso com cookies httpOnly)
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// ============================================
// FINGERPRINT DE SESSÃO
// ============================================

/**
 * Gera fingerprint básico do navegador para detecção de sessão roubada
 */
export function generateSessionFingerprint(): string {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');

  return btoa(fingerprint);
}

/**
 * Valida fingerprint da sessão atual
 */
export function validateSessionFingerprint(storedFingerprint: string): boolean {
  const currentFingerprint = generateSessionFingerprint();
  return storedFingerprint === currentFingerprint;
}

// ============================================
// PROTEÇÃO DE DADOS SENSÍVEIS
// ============================================

/**
 * Mascara dados sensíveis para exibição
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}

/**
 * Mascara email para exibição segura
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return maskSensitiveData(email);
  
  const maskedLocal = local.slice(0, 2) + '*'.repeat(Math.max(local.length - 2, 3));
  return `${maskedLocal}@${domain}`;
}
