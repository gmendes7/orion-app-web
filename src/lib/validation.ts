/**
 * 🔐 Validação Centralizada - O.R.I.O.N
 * 
 * Sistema de validação robusto e reutilizável para toda a aplicação.
 * Usa Zod para validação type-safe com mensagens em português.
 */

import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDAÇÃO BASE
// ============================================

/**
 * Schema para email com validação rigorosa
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email é obrigatório')
  .email('Formato de email inválido')
  .max(255, 'Email muito longo (máx. 255 caracteres)')
  .transform((email) => email.toLowerCase());

/**
 * Schema para senha com requisitos de segurança
 */
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(128, 'Senha muito longa (máx. 128 caracteres)')
  .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter ao menos um número');

/**
 * Schema para senha simples (login apenas)
 */
export const passwordLoginSchema = z
  .string()
  .min(6, 'Senha deve ter no mínimo 6 caracteres')
  .max(128, 'Senha muito longa');

/**
 * Schema para nome completo
 */
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Nome deve ter no mínimo 2 caracteres')
  .max(100, 'Nome muito longo (máx. 100 caracteres)')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome deve conter apenas letras');

/**
 * Schema para username
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username deve ter no mínimo 3 caracteres')
  .max(30, 'Username muito longo (máx. 30 caracteres)')
  .regex(
    /^[a-z0-9_]+$/,
    'Username deve conter apenas letras minúsculas, números e underscore'
  )
  .transform((username) => username.toLowerCase());

/**
 * Schema para mensagem de chat
 */
export const messageSchema = z
  .string()
  .trim()
  .min(1, 'Mensagem não pode estar vazia')
  .max(10000, 'Mensagem muito longa (máx. 10.000 caracteres)');

/**
 * Schema para título de conversa
 */
export const conversationTitleSchema = z
  .string()
  .trim()
  .min(1, 'Título é obrigatório')
  .max(100, 'Título muito longo (máx. 100 caracteres)');

/**
 * Schema para nome de agente
 */
export const agentNameSchema = z
  .string()
  .trim()
  .min(2, 'Nome do agente deve ter no mínimo 2 caracteres')
  .max(50, 'Nome muito longo (máx. 50 caracteres)');

/**
 * Schema para system prompt
 */
export const systemPromptSchema = z
  .string()
  .trim()
  .min(10, 'Prompt deve ter no mínimo 10 caracteres')
  .max(10000, 'Prompt muito longo (máx. 10.000 caracteres)');

/**
 * Schema para UUID
 */
export const uuidSchema = z.string().uuid('ID inválido');

// ============================================
// SCHEMAS COMPOSTOS
// ============================================

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordLoginSchema,
});

/**
 * Schema para cadastro
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  username: usernameSchema,
});

/**
 * Schema para criação de agente
 */
export const createAgentSchema = z.object({
  name: agentNameSchema,
  description: z.string().max(500, 'Descrição muito longa').optional(),
  type: z.enum(['support', 'automation', 'task', 'analysis', 'custom']),
  system_prompt: systemPromptSchema,
  model: z.string().min(1),
  temperature: z.number().min(0).max(1),
  max_tokens: z.number().min(256).max(8192),
  is_public: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

// ============================================
// FUNÇÕES DE VALIDAÇÃO UTILITÁRIAS
// ============================================

/**
 * Valida dados e retorna resultado tipado
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.issues.map((issue) => issue.message),
  };
}

/**
 * Valida e lança erro se inválido
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Sanitiza string removendo caracteres perigosos
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitiza mensagem de chat
 */
export function sanitizeMessage(message: string): string {
  const sanitized = sanitizeString(message);
  const result = messageSchema.safeParse(sanitized);
  
  if (!result.success) {
    throw new Error(result.error.issues[0].message);
  }
  
  return result.data;
}

/**
 * Verifica se é um UUID válido
 */
export function isValidUUID(id: string): boolean {
  return uuidSchema.safeParse(id).success;
}

/**
 * Valida email e retorna email normalizado ou null
 */
export function validateEmail(email: string): string | null {
  const result = emailSchema.safeParse(email);
  return result.success ? result.data : null;
}

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type CreateAgentInput = z.infer<typeof createAgentSchema>;
