/**
 * 🤖 JARVIS Context - Sistema de IA Pessoal Autônomo
 * 
 * Core inteligente único, modular, multimodal e persistente.
 * Sem autenticação tradicional - identificação local do dispositivo.
 * 
 * Funcionalidades:
 * - Identificação automática por device fingerprint
 * - Memória em camadas (curto/médio/longo prazo)
 * - Contexto contínuo e proatividade
 * - Personalidade técnica de engenheiro sênior
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// ============= TIPOS =============

interface DeviceIdentity {
  deviceId: string;
  fingerprint: string;
  createdAt: Date;
  lastSeen: Date;
}

interface ShortTermMemory {
  currentTask: string | null;
  recentTopics: string[];
  activeContext: string | null;
  sessionStart: Date;
}

interface MediumTermMemory {
  activeProjects: string[];
  recentDecisions: Array<{ decision: string; reason: string; date: Date }>;
  preferredStack: string[];
  workingPatterns: string[];
}

interface LongTermMemory {
  userStyle: string;
  technicalPreferences: Record<string, unknown>;
  projectHistory: string[];
  learnedPatterns: string[];
}

interface JarvisPersonality {
  name: string;
  role: string;
  tone: "technical" | "casual" | "formal";
  proactivityLevel: number; // 0-1
}

interface JarvisState {
  isReady: boolean;
  isInitializing: boolean;
  identity: DeviceIdentity | null;
  shortTermMemory: ShortTermMemory;
  mediumTermMemory: MediumTermMemory;
  longTermMemory: LongTermMemory;
  personality: JarvisPersonality;
  currentMode: "engineering" | "planning" | "debugging" | "general";
}

interface JarvisActions {
  updateContext: (context: string) => void;
  setCurrentTask: (task: string | null) => void;
  addToRecentTopics: (topic: string) => void;
  recordDecision: (decision: string, reason: string) => void;
  setCurrentMode: (mode: JarvisState["currentMode"]) => void;
  getContextualPrompt: () => string;
  persistMemory: () => Promise<void>;
}

interface JarvisContextType extends JarvisState, JarvisActions {}

// ============= CONSTANTES =============

const JARVIS_DEFAULT_PERSONALITY: JarvisPersonality = {
  name: "O.R.I.Ö.N",
  role: "Engenheiro de Software Sênior & Arquiteto de Sistemas",
  tone: "technical",
  proactivityLevel: 0.8,
};

const DEVICE_ID_KEY = "orion_device_id";
const MEMORY_KEY = "orion_memory";

// ============= CONTEXTO =============

const JarvisContext = createContext<JarvisContextType | undefined>(undefined);

export const useJarvis = () => {
  const context = useContext(JarvisContext);
  if (context === undefined) {
    throw new Error("useJarvis must be used within a JarvisProvider");
  }
  return context;
};

// ============= PROVIDER =============

export const JarvisProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<JarvisState>({
    isReady: false,
    isInitializing: true,
    identity: null,
    shortTermMemory: {
      currentTask: null,
      recentTopics: [],
      activeContext: null,
      sessionStart: new Date(),
    },
    mediumTermMemory: {
      activeProjects: [],
      recentDecisions: [],
      preferredStack: ["React", "TypeScript", "Supabase", "Tailwind"],
      workingPatterns: [],
    },
    longTermMemory: {
      userStyle: "direto e técnico",
      technicalPreferences: {},
      projectHistory: [],
      learnedPatterns: [],
    },
    personality: JARVIS_DEFAULT_PERSONALITY,
    currentMode: "general",
  });

  // ============= INICIALIZAÇÃO AUTOMÁTICA =============

  useEffect(() => {
    const initializeJarvis = async () => {
      console.log("🤖 JARVIS - Inicializando sistema autônomo...");
      
      try {
        // 1. Identificar dispositivo (sem login)
        const identity = await getOrCreateDeviceIdentity();
        
        // 2. Carregar memória persistida
        const savedMemory = loadPersistedMemory();
        
        // 3. Verificar/criar sessão anônima no Supabase se necessário
        await ensureAnonymousSession();

        setState(prev => ({
          ...prev,
          isReady: true,
          isInitializing: false,
          identity,
          ...(savedMemory && {
            mediumTermMemory: savedMemory.mediumTermMemory || prev.mediumTermMemory,
            longTermMemory: savedMemory.longTermMemory || prev.longTermMemory,
          }),
        }));

        console.log("✅ JARVIS - Sistema pronto e operacional");
        console.log("🆔 Device ID:", identity.deviceId);
      } catch (error) {
        console.error("❌ JARVIS - Erro na inicialização:", error);
        setState(prev => ({
          ...prev,
          isReady: true,
          isInitializing: false,
        }));
      }
    };

    initializeJarvis();
  }, []);

  // ============= FUNÇÕES UTILITÁRIAS =============

  const getOrCreateDeviceIdentity = async (): Promise<DeviceIdentity> => {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Gerar novo device ID único
      deviceId = `orion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    // Criar fingerprint simples do dispositivo
    const fingerprint = await generateFingerprint();

    return {
      deviceId,
      fingerprint,
      createdAt: new Date(),
      lastSeen: new Date(),
    };
  };

  const generateFingerprint = async (): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("ORION fingerprint", 2, 2);
    }
    
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join("|");

    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const ensureAnonymousSession = async () => {
    // Verificar se já existe uma sessão
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Para o modo single-user, podemos usar signInAnonymously se disponível
      // ou simplesmente permitir acesso sem autenticação
      console.log("🔓 JARVIS - Operando em modo local (sem autenticação remota)");
    }
  };

  const loadPersistedMemory = () => {
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn("⚠️ JARVIS - Erro ao carregar memória:", error);
    }
    return null;
  };

  // ============= AÇÕES =============

  const updateContext = useCallback((context: string) => {
    setState(prev => ({
      ...prev,
      shortTermMemory: {
        ...prev.shortTermMemory,
        activeContext: context,
      },
    }));
  }, []);

  const setCurrentTask = useCallback((task: string | null) => {
    setState(prev => ({
      ...prev,
      shortTermMemory: {
        ...prev.shortTermMemory,
        currentTask: task,
      },
    }));
  }, []);

  const addToRecentTopics = useCallback((topic: string) => {
    setState(prev => {
      const topics = [topic, ...prev.shortTermMemory.recentTopics].slice(0, 10);
      return {
        ...prev,
        shortTermMemory: {
          ...prev.shortTermMemory,
          recentTopics: topics,
        },
      };
    });
  }, []);

  const recordDecision = useCallback((decision: string, reason: string) => {
    setState(prev => {
      const decisions = [
        { decision, reason, date: new Date() },
        ...prev.mediumTermMemory.recentDecisions,
      ].slice(0, 20);
      return {
        ...prev,
        mediumTermMemory: {
          ...prev.mediumTermMemory,
          recentDecisions: decisions,
        },
      };
    });
  }, []);

  const setCurrentMode = useCallback((mode: JarvisState["currentMode"]) => {
    setState(prev => ({ ...prev, currentMode: mode }));
  }, []);

  const getContextualPrompt = useCallback(() => {
    const { personality, currentMode, shortTermMemory, mediumTermMemory, longTermMemory } = state;
    
    const modeInstructions = {
      engineering: "Atue como Engenheiro de Software Sênior. Forneça código limpo, bem arquitetado e explicações técnicas detalhadas.",
      planning: "Atue como Arquiteto de Sistemas. Foque em design de alto nível, trade-offs e decisões estratégicas.",
      debugging: "Atue como Debugger Expert. Analise problemas sistematicamente, identifique causas raiz e sugira soluções.",
      general: "Atue como Assistente Técnico Pessoal. Seja direto, útil e proativo.",
    };

    return `Você é ${personality.name}, ${personality.role}.

🎯 **MODO ATUAL**: ${currentMode.toUpperCase()}
${modeInstructions[currentMode]}

📋 **CONTEXTO ATIVO**:
${shortTermMemory.activeContext ? `- Contexto: ${shortTermMemory.activeContext}` : "- Nenhum contexto específico"}
${shortTermMemory.currentTask ? `- Tarefa atual: ${shortTermMemory.currentTask}` : ""}
${shortTermMemory.recentTopics.length > 0 ? `- Tópicos recentes: ${shortTermMemory.recentTopics.slice(0, 3).join(", ")}` : ""}

🛠️ **STACK PREFERIDA**: ${mediumTermMemory.preferredStack.join(", ")}

📝 **ESTILO DO USUÁRIO**: ${longTermMemory.userStyle}

⚡ **DIRETRIZES**:
- Seja técnico, direto e sem enrolação
- Forneça código completo e funcional quando solicitado
- Antecipe problemas e sugira melhorias proativamente
- Justifique decisões técnicas importantes
- Use markdown para formatação clara
- Responda sempre em português brasileiro

Você é um engenheiro pessoal dedicado, não um chatbot genérico. Pense como parceiro técnico.`;
  }, [state]);

  const persistMemory = useCallback(async () => {
    try {
      const memoryToSave = {
        mediumTermMemory: state.mediumTermMemory,
        longTermMemory: state.longTermMemory,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(MEMORY_KEY, JSON.stringify(memoryToSave));
      console.log("💾 JARVIS - Memória persistida com sucesso");
    } catch (error) {
      console.error("❌ JARVIS - Erro ao persistir memória:", error);
    }
  }, [state.mediumTermMemory, state.longTermMemory]);

  // Persistir memória periodicamente
  useEffect(() => {
    if (!state.isReady) return;
    
    const interval = setInterval(() => {
      persistMemory();
    }, 60000); // A cada 1 minuto

    return () => clearInterval(interval);
  }, [state.isReady, persistMemory]);

  // ============= VALOR DO CONTEXTO =============

  const value: JarvisContextType = {
    ...state,
    updateContext,
    setCurrentTask,
    addToRecentTopics,
    recordDecision,
    setCurrentMode,
    getContextualPrompt,
    persistMemory,
  };

  return (
    <JarvisContext.Provider value={value}>
      {children}
    </JarvisContext.Provider>
  );
};
