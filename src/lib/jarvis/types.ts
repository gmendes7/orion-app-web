/**
 * 🤖 JARVIS Type Definitions
 * 
 * Central type definitions for the JARVIS AI system.
 * Clean, modular, and scalable architecture.
 */

// ============= IDENTITY =============

export interface DeviceIdentity {
  deviceId: string;
  fingerprint: string;
  createdAt: Date;
  lastSeen: Date;
  platform: 'web' | 'mobile' | 'desktop';
  capabilities: DeviceCapabilities;
}

export interface DeviceCapabilities {
  camera: boolean;
  microphone: boolean;
  speechSynthesis: boolean;
  speechRecognition: boolean;
  notifications: boolean;
  localStorage: boolean;
}

// ============= PERSONALITY =============

export interface JarvisPersonality {
  name: string;
  role: string;
  tone: 'technical' | 'casual' | 'formal' | 'friendly';
  proactivityLevel: number; // 0-1
  verbosity: 'concise' | 'balanced' | 'detailed';
  language: string;
}

export const DEFAULT_PERSONALITY: JarvisPersonality = {
  name: "O.R.I.Ö.N",
  role: "Engenheiro de Software Sênior & Arquiteto de Sistemas",
  tone: "technical",
  proactivityLevel: 0.8,
  verbosity: "balanced",
  language: "pt-BR",
};

// ============= MODES =============

export type JarvisMode = 
  | 'general' 
  | 'engineering' 
  | 'planning' 
  | 'debugging' 
  | 'analysis'
  | 'learning';

export interface ModeConfig {
  id: JarvisMode;
  name: string;
  icon: string;
  description: string;
  systemPromptModifier: string;
  color: string;
}

export const MODE_CONFIGS: Record<JarvisMode, ModeConfig> = {
  general: {
    id: 'general',
    name: 'Geral',
    icon: '⚡',
    description: 'Assistente técnico versátil',
    systemPromptModifier: 'Atue como Assistente Técnico Pessoal. Seja direto, útil e proativo.',
    color: 'orion-stellar-gold',
  },
  engineering: {
    id: 'engineering',
    name: 'Engenharia',
    icon: '💻',
    description: 'Foco em código e implementação',
    systemPromptModifier: 'Atue como Engenheiro de Software Sênior. Forneça código limpo, bem arquitetado e explicações técnicas detalhadas. Prefira soluções pragmáticas e escaláveis.',
    color: 'orion-cosmic-blue',
  },
  planning: {
    id: 'planning',
    name: 'Arquitetura',
    icon: '🏗️',
    description: 'Design de sistemas e decisões estratégicas',
    systemPromptModifier: 'Atue como Arquiteto de Sistemas. Foque em design de alto nível, trade-offs e decisões estratégicas. Considere escalabilidade, manutenibilidade e performance.',
    color: 'orion-nebula-purple',
  },
  debugging: {
    id: 'debugging',
    name: 'Debug',
    icon: '🔧',
    description: 'Análise e resolução de problemas',
    systemPromptModifier: 'Atue como Debugger Expert. Analise problemas sistematicamente, identifique causas raiz e sugira soluções. Use pensamento investigativo e metódico.',
    color: 'orion-accretion-disk',
  },
  analysis: {
    id: 'analysis',
    name: 'Análise',
    icon: '📊',
    description: 'Análise de dados e padrões',
    systemPromptModifier: 'Atue como Analista Técnico. Avalie código, arquitetura e padrões. Identifique débitos técnicos, oportunidades de melhoria e riscos.',
    color: 'green-500',
  },
  learning: {
    id: 'learning',
    name: 'Aprendizado',
    icon: '📚',
    description: 'Explicações detalhadas e didáticas',
    systemPromptModifier: 'Atue como Mentor Técnico. Explique conceitos com profundidade, use analogias e exemplos práticos. Adapte a explicação ao nível do usuário.',
    color: 'blue-400',
  },
};

// ============= MEMORY =============

export interface MemoryEntry {
  id: string;
  content: string;
  type: 'interaction' | 'decision' | 'pattern' | 'preference' | 'project' | 'insight';
  timestamp: Date;
  importance: number; // 0-1
  tags: string[];
  metadata?: Record<string, unknown>;
  embedding?: number[]; // For semantic search
}

export interface ShortTermMemory {
  currentTask: string | null;
  recentTopics: string[];
  activeContext: string | null;
  sessionStart: Date;
  conversationSummary: string | null;
  pendingActions: string[];
}

export interface MediumTermMemory {
  activeProjects: ProjectInfo[];
  recentDecisions: Decision[];
  preferredStack: string[];
  workingPatterns: string[];
  codePreferences: CodePreferences;
}

export interface LongTermMemory {
  userStyle: string;
  technicalPreferences: Record<string, unknown>;
  projectHistory: ProjectInfo[];
  learnedPatterns: string[];
  skillProfile: string[];
  behaviorInsights: string[];
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  stack: string[];
  lastAccessed: Date;
  status: 'active' | 'paused' | 'completed';
}

export interface Decision {
  id: string;
  decision: string;
  reason: string;
  context: string;
  date: Date;
  impact: 'low' | 'medium' | 'high';
}

export interface CodePreferences {
  namingConvention: 'camelCase' | 'snake_case' | 'kebab-case';
  commentStyle: 'minimal' | 'documented' | 'verbose';
  testingApproach: 'tdd' | 'bdd' | 'minimal';
  preferredPatterns: string[];
}

// ============= CONTEXT =============

export interface ConversationContext {
  currentIntent: string | null;
  entities: Record<string, string>;
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated';
  urgency: 'low' | 'medium' | 'high';
  topicHistory: string[];
}

export interface EnvironmentContext {
  platform: string;
  screenSize: 'mobile' | 'tablet' | 'desktop';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  sessionDuration: number;
  interactionCount: number;
}

// ============= MULTIMODAL =============

export interface VoiceConfig {
  enabled: boolean;
  language: string;
  voiceName?: string;
  rate: number;
  pitch: number;
  wakeWord: string;
  continuousListening: boolean;
}

export interface CameraConfig {
  enabled: boolean;
  facingMode: 'user' | 'environment';
  resolution: 'low' | 'medium' | 'high';
  autoAnalysis: boolean;
}

export interface MultimodalState {
  voice: {
    isListening: boolean;
    isSpeaking: boolean;
    lastTranscript: string;
  };
  camera: {
    isActive: boolean;
    isAnalyzing: boolean;
    lastCapture: string | null;
  };
}

// ============= STATE =============

export interface JarvisState {
  isReady: boolean;
  isInitializing: boolean;
  identity: DeviceIdentity | null;
  personality: JarvisPersonality;
  currentMode: JarvisMode;
  shortTermMemory: ShortTermMemory;
  mediumTermMemory: MediumTermMemory;
  longTermMemory: LongTermMemory;
  conversationContext: ConversationContext;
  environmentContext: EnvironmentContext;
  multimodal: MultimodalState;
  error: string | null;
}

// ============= ACTIONS =============

export interface JarvisActions {
  // Mode management
  setMode: (mode: JarvisMode) => void;
  
  // Context management
  updateContext: (context: string) => void;
  setCurrentTask: (task: string | null) => void;
  addToRecentTopics: (topic: string) => void;
  
  // Memory management
  recordDecision: (decision: string, reason: string, impact?: 'low' | 'medium' | 'high') => void;
  addProject: (project: Omit<ProjectInfo, 'id' | 'lastAccessed'>) => void;
  learnPattern: (pattern: string) => void;
  
  // Prompt generation
  getContextualPrompt: () => string;
  getSystemPrompt: () => string;
  
  // Persistence
  persistMemory: () => Promise<void>;
  clearMemory: (type: 'short' | 'medium' | 'long' | 'all') => void;
  
  // Proactive features
  suggestNextActions: () => string[];
  detectIntent: (message: string) => ConversationContext;
}

export type JarvisContextType = JarvisState & JarvisActions;
