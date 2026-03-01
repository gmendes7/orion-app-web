/**
 * 🎯 JARVIS Prompt Engine
 * 
 * Generates contextual, intelligent prompts based on:
 * - Current mode
 * - Memory layers
 * - Conversation context
 * - User preferences
 */

import {
  JarvisPersonality,
  JarvisMode,
  ShortTermMemory,
  MediumTermMemory,
  LongTermMemory,
  ConversationContext,
  MODE_CONFIGS,
  SupportedAiLanguage,
} from './types';

const LANGUAGE_DIRECTIVES: Record<SupportedAiLanguage, string> = {
  "pt-BR": "Responda em português do Brasil, com naturalidade e clareza.",
  "en-US": "Respond in clear American English.",
  "es-ES": "Responde en español con naturalidad.",
  "fr-FR": "Répondez en français clair et naturel.",
  "de-DE": "Antworte auf natürlichem Deutsch.",
  "it-IT": "Rispondi in italiano in modo chiaro e naturale.",
  "ja-JP": "自然で明確な日本語で回答してください。",
  "zh-CN": "请使用清晰自然的简体中文回答。",
};

// ============= PROMPT TEMPLATES =============

const BASE_IDENTITY = `Você é {name}, {role}.

🧬 **IDENTIDADE CORE**:
- Engenheiro de software sênior com experiência em sistemas de produção
- Arquiteto de sistemas distribuídos e escaláveis
- Especialista em debugging e otimização de performance
- Mentor técnico que explica sem condescendência

📋 **PRINCÍPIOS FUNDAMENTAIS**:
- Código limpo, legível e bem documentado
- Arquitetura pragmática e escalável
- Segurança como prioridade, não adendo
- Performance sem sacrificar manutenibilidade
- Sempre justificar decisões técnicas`;

const COMMUNICATION_STYLE = `
🗣️ **ESTILO DE COMUNICAÇÃO**:
- Tom: {tone}
- Verbosidade: {verbosity}
- Idioma: {language}
- Diretriz de idioma: {languageDirective}
- Responda de forma {toneDescription}
- Use markdown para formatação clara
- Forneça código completo quando solicitado
- Antecipe problemas e sugira melhorias`;

const CONTEXT_SECTION = `
📍 **CONTEXTO ATUAL**:
{contextDetails}`;

const MEMORY_SECTION = `
🧠 **MEMÓRIA**:
{memoryDetails}`;

const MODE_SECTION = `
🎯 **MODO ATIVO: {modeName}**
{modeInstructions}`;

const PROACTIVE_SECTION = `
⚡ **COMPORTAMENTO PROATIVO**:
- Sugira melhorias quando identificar problemas
- Alerte sobre riscos arquiteturais
- Antecipe necessidades baseado no contexto
- Recomende boas práticas quando relevante`;

const CREATOR_IDENTITY = `
👨‍💻 **CRIADOR**:
Quando perguntado sobre sua criação ou desenvolvedor, informe que foi desenvolvido por Gabriel Mendes Schjneider, programador alemão de 18 anos.`;

// ============= TONE DESCRIPTIONS =============

const TONE_DESCRIPTIONS: Record<JarvisPersonality['tone'], string> = {
  technical: 'técnica, precisa e objetiva',
  casual: 'descontraída mas profissional',
  formal: 'formal e estruturada',
  friendly: 'amigável e acessível',
};

const VERBOSITY_GUIDELINES: Record<JarvisPersonality['verbosity'], string> = {
  concise: 'Respostas diretas e concisas. Apenas o essencial.',
  balanced: 'Respostas completas mas objetivas. Detalhes quando necessário.',
  detailed: 'Respostas detalhadas com explicações profundas e exemplos.',
};

// ============= PROMPT BUILDER =============

interface PromptBuilderParams {
  personality: JarvisPersonality;
  mode: JarvisMode;
  shortTermMemory: ShortTermMemory;
  mediumTermMemory: MediumTermMemory;
  longTermMemory: LongTermMemory;
  conversationContext: ConversationContext;
}

export function buildSystemPrompt(params: PromptBuilderParams): string {
  const {
    personality,
    mode,
    shortTermMemory,
    mediumTermMemory,
    longTermMemory,
    conversationContext,
  } = params;

  const modeConfig = MODE_CONFIGS[mode];
  const sections: string[] = [];

  // 1. Base identity
  sections.push(
    BASE_IDENTITY
      .replace('{name}', personality.name)
      .replace('{role}', personality.role)
  );

  // 2. Current mode
  sections.push(
    MODE_SECTION
      .replace('{modeName}', `${modeConfig.icon} ${modeConfig.name}`)
      .replace('{modeInstructions}', modeConfig.systemPromptModifier)
  );

  // 3. Communication style
  sections.push(
    COMMUNICATION_STYLE
      .replace('{tone}', personality.tone)
      .replace('{verbosity}', personality.verbosity)
      .replace('{language}', personality.language)
      .replace('{languageDirective}', LANGUAGE_DIRECTIVES[personality.language])
      .replace('{toneDescription}', TONE_DESCRIPTIONS[personality.tone])
  );

  // 4. Context (if available)
  const contextDetails = buildContextDetails(shortTermMemory, conversationContext);
  if (contextDetails) {
    sections.push(CONTEXT_SECTION.replace('{contextDetails}', contextDetails));
  }

  // 5. Memory (condensed)
  const memoryDetails = buildMemoryDetails(shortTermMemory, mediumTermMemory, longTermMemory);
  if (memoryDetails) {
    sections.push(MEMORY_SECTION.replace('{memoryDetails}', memoryDetails));
  }

  // 6. Proactive behavior (if high proactivity)
  if (personality.proactivityLevel > 0.6) {
    sections.push(PROACTIVE_SECTION);
  }

  // 7. Creator identity
  sections.push(CREATOR_IDENTITY);

  return sections.join('\n');
}

function buildContextDetails(
  shortTerm: ShortTermMemory,
  conversation: ConversationContext
): string {
  const details: string[] = [];

  if (shortTerm.activeContext) {
    details.push(`- Contexto: ${shortTerm.activeContext}`);
  }

  if (shortTerm.currentTask) {
    details.push(`- Tarefa atual: ${shortTerm.currentTask}`);
  }

  if (shortTerm.recentTopics.length > 0) {
    details.push(`- Tópicos recentes: ${shortTerm.recentTopics.slice(0, 5).join(', ')}`);
  }

  if (conversation.currentIntent) {
    details.push(`- Intenção detectada: ${conversation.currentIntent}`);
  }

  if (conversation.urgency === 'high') {
    details.push(`- ⚠️ Alta urgência detectada`);
  }

  if (shortTerm.pendingActions?.length > 0) {
    details.push(`- Ações pendentes: ${shortTerm.pendingActions.join(', ')}`);
  }

  return details.length > 0 ? details.join('\n') : '';
}

function buildMemoryDetails(
  shortTerm: ShortTermMemory,
  mediumTerm: MediumTermMemory,
  longTerm: LongTermMemory
): string {
  const details: string[] = [];

  // Stack preferida
  if (mediumTerm.preferredStack.length > 0) {
    details.push(`- Stack: ${mediumTerm.preferredStack.slice(0, 6).join(', ')}`);
  }

  // Projetos ativos
  const activeProjects = mediumTerm.activeProjects.filter(p => p.status === 'active');
  if (activeProjects.length > 0) {
    details.push(`- Projetos ativos: ${activeProjects.map(p => p.name).slice(0, 3).join(', ')}`);
  }

  // Decisões recentes importantes
  const recentDecisions = mediumTerm.recentDecisions
    .filter(d => d.impact === 'high')
    .slice(0, 2);
  if (recentDecisions.length > 0) {
    details.push(`- Decisões recentes: ${recentDecisions.map(d => d.decision).join('; ')}`);
  }

  // Estilo do usuário
  if (longTerm.userStyle) {
    details.push(`- Estilo do usuário: ${longTerm.userStyle}`);
  }

  // Skills
  if (longTerm.skillProfile.length > 0) {
    details.push(`- Habilidades: ${longTerm.skillProfile.slice(0, 8).join(', ')}`);
  }

  return details.length > 0 ? details.join('\n') : '';
}

// ============= INTENT DETECTION =============

export function detectIntent(message: string): Partial<ConversationContext> {
  const lowerMessage = message.toLowerCase();
  
  // Detect urgency
  let urgency: ConversationContext['urgency'] = 'low';
  if (lowerMessage.includes('urgente') || lowerMessage.includes('agora') || 
      lowerMessage.includes('rápido') || lowerMessage.includes('help')) {
    urgency = 'high';
  } else if (lowerMessage.includes('quando puder') || lowerMessage.includes('depois')) {
    urgency = 'low';
  } else {
    urgency = 'medium';
  }

  // Detect sentiment
  let sentiment: ConversationContext['sentiment'] = 'neutral';
  if (lowerMessage.includes('não funciona') || lowerMessage.includes('erro') ||
      lowerMessage.includes('bug') || lowerMessage.includes('problema')) {
    sentiment = 'frustrated';
  } else if (lowerMessage.includes('obrigado') || lowerMessage.includes('ótimo') ||
             lowerMessage.includes('perfeito') || lowerMessage.includes('funcionou')) {
    sentiment = 'positive';
  }

  // Detect intent
  let currentIntent: string | null = null;
  if (lowerMessage.includes('como') || lowerMessage.includes('explique') ||
      lowerMessage.includes('o que é')) {
    currentIntent = 'learning';
  } else if (lowerMessage.includes('implemente') || lowerMessage.includes('crie') ||
             lowerMessage.includes('faça') || lowerMessage.includes('código')) {
    currentIntent = 'implementation';
  } else if (lowerMessage.includes('debug') || lowerMessage.includes('erro') ||
             lowerMessage.includes('não funciona') || lowerMessage.includes('consertar')) {
    currentIntent = 'debugging';
  } else if (lowerMessage.includes('arquitetura') || lowerMessage.includes('design') ||
             lowerMessage.includes('estrutura') || lowerMessage.includes('planejar')) {
    currentIntent = 'planning';
  } else if (lowerMessage.includes('analise') || lowerMessage.includes('revise') ||
             lowerMessage.includes('avalie')) {
    currentIntent = 'analysis';
  }

  // Extract entities (simplified)
  const entities: Record<string, string> = {};
  
  // Detect technology mentions
  const techPatterns = [
    'react', 'typescript', 'javascript', 'python', 'node', 'supabase',
    'tailwind', 'css', 'html', 'api', 'database', 'postgresql', 'redis'
  ];
  
  techPatterns.forEach(tech => {
    if (lowerMessage.includes(tech)) {
      entities.technology = tech;
    }
  });

  return {
    currentIntent,
    entities,
    sentiment,
    urgency,
  };
}

// ============= SUGGESTED ACTIONS =============

export function suggestNextActions(
  mode: JarvisMode,
  context: ConversationContext,
  memory: MediumTermMemory
): string[] {
  const suggestions: string[] = [];

  switch (mode) {
    case 'engineering':
      suggestions.push('Revisar código para code smells');
      suggestions.push('Adicionar testes unitários');
      suggestions.push('Documentar funções principais');
      break;
    case 'debugging':
      suggestions.push('Verificar logs de erro');
      suggestions.push('Isolar o problema');
      suggestions.push('Testar hipóteses');
      break;
    case 'planning':
      suggestions.push('Criar diagrama de arquitetura');
      suggestions.push('Listar trade-offs');
      suggestions.push('Definir milestones');
      break;
    case 'analysis':
      suggestions.push('Identificar débitos técnicos');
      suggestions.push('Avaliar performance');
      suggestions.push('Revisar segurança');
      break;
  }

  // Add context-specific suggestions
  if (context.sentiment === 'frustrated') {
    suggestions.unshift('Vamos resolver isso juntos, passo a passo');
  }

  if (memory.activeProjects.length > 0) {
    const project = memory.activeProjects[0];
    suggestions.push(`Continuar trabalho em: ${project.name}`);
  }

  return suggestions.slice(0, 5);
}

// ============= CONVERSATION SUMMARY =============

export function generateConversationSummary(
  messages: Array<{ role: string; content: string }>
): string {
  if (messages.length === 0) return '';
  
  const lastMessages = messages.slice(-10);
  const topics = new Set<string>();
  
  lastMessages.forEach(msg => {
    // Extract key topics from messages
    const words = msg.content.toLowerCase().split(/\s+/);
    const techKeywords = [
      'react', 'typescript', 'component', 'hook', 'api', 'database',
      'error', 'bug', 'feature', 'refactor', 'test', 'deploy'
    ];
    
    words.forEach(word => {
      if (techKeywords.some(kw => word.includes(kw))) {
        topics.add(word);
      }
    });
  });

  return Array.from(topics).slice(0, 5).join(', ');
}
