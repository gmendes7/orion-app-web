/**
 * 🤖 JARVIS Context - Sistema de IA Pessoal Autônomo (Refatorado)
 * 
 * Core inteligente único, modular, multimodal e persistente.
 * Arquitetura limpa com separação de responsabilidades.
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  JarvisState,
  JarvisContextType,
  JarvisMode,
  ShortTermMemory,
  ConversationContext,
  EnvironmentContext,
  ProjectInfo,
  DEFAULT_PERSONALITY,
  MODE_CONFIGS,
} from "@/lib/jarvis/types";
import {
  buildSystemPrompt,
  detectIntent,
  suggestNextActions,
} from "@/lib/jarvis/prompts";
import {
  getOrCreateDeviceIdentity,
  loadMediumTermMemory,
  loadLongTermMemory,
  saveMediumTermMemory,
  saveLongTermMemory,
  loadPersonality,
  savePersonality,
  loadMode,
  saveMode,
  clearStorage,
  updateSyncTimestamp,
} from "@/lib/jarvis/storage";
// ============= INITIAL STATE =============

const initialShortTermMemory: ShortTermMemory = {
  currentTask: null,
  recentTopics: [],
  activeContext: null,
  sessionStart: new Date(),
  conversationSummary: null,
  pendingActions: [],
};

const initialConversationContext: ConversationContext = {
  currentIntent: null,
  entities: {},
  sentiment: 'neutral',
  urgency: 'medium',
  topicHistory: [],
};

const initialEnvironmentContext: EnvironmentContext = {
  platform: 'web',
  screenSize: 'desktop',
  timeOfDay: 'morning',
  sessionDuration: 0,
  interactionCount: 0,
};

const initialState: JarvisState = {
  isReady: false,
  isInitializing: true,
  identity: null,
  personality: DEFAULT_PERSONALITY,
  currentMode: 'general',
  shortTermMemory: initialShortTermMemory,
  mediumTermMemory: loadMediumTermMemory(),
  longTermMemory: loadLongTermMemory(),
  conversationContext: initialConversationContext,
  environmentContext: initialEnvironmentContext,
  multimodal: {
    voice: { isListening: false, isSpeaking: false, lastTranscript: '' },
    camera: { isActive: false, isAnalyzing: false, lastCapture: null },
  },
  error: null,
};

// ============= CONTEXT =============

const JarvisContext = createContext<JarvisContextType | undefined>(undefined);

export const useJarvis = () => {
  const context = useContext(JarvisContext);
  if (context === undefined) {
    throw new Error("useJarvis must be used within a JarvisProvider");
  }
  return context;
};

// ============= UTILITY FUNCTIONS =============

function getTimeOfDay(): EnvironmentContext['timeOfDay'] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function getScreenSize(): EnvironmentContext['screenSize'] {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// ============= PROVIDER =============

export const JarvisProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<JarvisState>(initialState);

  // ============= INITIALIZATION =============

  useEffect(() => {
    const initializeJarvis = async () => {
      console.log("🤖 JARVIS - Inicializando sistema autônomo...");
      
      try {
        // 1. Get or create device identity
        const identity = await getOrCreateDeviceIdentity();
        
        // 2. Load persisted data
        const personality = loadPersonality();
        const mode = loadMode();
        const mediumTermMemory = loadMediumTermMemory();
        const longTermMemory = loadLongTermMemory();

        // 3. Try anonymous session (optional)
        await ensureAnonymousSession();

        // 4. Set up environment context
        const environmentContext: EnvironmentContext = {
          platform: identity.platform,
          screenSize: getScreenSize(),
          timeOfDay: getTimeOfDay(),
          sessionDuration: 0,
          interactionCount: 0,
        };

        setState(prev => ({
          ...prev,
          isReady: true,
          isInitializing: false,
          identity,
          personality,
          currentMode: mode,
          mediumTermMemory,
          longTermMemory,
          environmentContext,
          shortTermMemory: {
            ...initialShortTermMemory,
            sessionStart: new Date(),
          },
        }));

        console.log("✅ JARVIS - Sistema pronto e operacional");
        console.log("🆔 Device:", identity.deviceId.substring(0, 16) + '...');
        console.log("🎯 Modo:", MODE_CONFIGS[mode].name);
      } catch (error) {
        console.error("❌ JARVIS - Erro na inicialização:", error);
        setState(prev => ({
          ...prev,
          isReady: true,
          isInitializing: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        }));
      }
    };

    initializeJarvis();
  }, []);

  const ensureAnonymousSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("🔓 JARVIS - Modo local (sem autenticação remota)");
      }
    } catch {
      console.log("🔓 JARVIS - Operando offline");
    }
  };

  // ============= MODE MANAGEMENT =============

  const setMode = useCallback((mode: JarvisMode) => {
    setState(prev => ({ ...prev, currentMode: mode }));
    saveMode(mode);
    console.log(`🎯 JARVIS - Modo alterado para: ${MODE_CONFIGS[mode].name}`);
  }, []);

  // ============= CONTEXT MANAGEMENT =============

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
      const topics = [topic, ...prev.shortTermMemory.recentTopics]
        .filter((t, i, arr) => arr.indexOf(t) === i) // Remove duplicates
        .slice(0, 15);
      
      return {
        ...prev,
        shortTermMemory: {
          ...prev.shortTermMemory,
          recentTopics: topics,
        },
        conversationContext: {
          ...prev.conversationContext,
          topicHistory: [...prev.conversationContext.topicHistory, topic].slice(-20),
        },
      };
    });
  }, []);

  // ============= MEMORY MANAGEMENT =============

  const recordDecision = useCallback((
    decision: string, 
    reason: string, 
    impact: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    setState(prev => {
      const newDecisions = [
        {
          id: `dec_${Date.now()}`,
          decision,
          reason,
          context: prev.shortTermMemory.activeContext || '',
          date: new Date(),
          impact,
        },
        ...prev.mediumTermMemory.recentDecisions,
      ].slice(0, 50);

      const newMediumTerm = {
        ...prev.mediumTermMemory,
        recentDecisions: newDecisions,
      };

      // Auto-persist important decisions
      if (impact === 'high') {
        saveMediumTermMemory(newMediumTerm);
      }

      return {
        ...prev,
        mediumTermMemory: newMediumTerm,
      };
    });
  }, []);

  const addProject = useCallback((project: Omit<ProjectInfo, 'id' | 'lastAccessed'>) => {
    setState(prev => {
      const existingIndex = prev.mediumTermMemory.activeProjects
        .findIndex(p => p.name.toLowerCase() === project.name.toLowerCase());

      let newProjects: ProjectInfo[];
      
      if (existingIndex >= 0) {
        newProjects = [...prev.mediumTermMemory.activeProjects];
        newProjects[existingIndex] = {
          ...newProjects[existingIndex],
          ...project,
          lastAccessed: new Date(),
        };
      } else {
        newProjects = [
          {
            id: `proj_${Date.now()}`,
            ...project,
            lastAccessed: new Date(),
          },
          ...prev.mediumTermMemory.activeProjects,
        ].slice(0, 20);
      }

      const newMediumTerm = {
        ...prev.mediumTermMemory,
        activeProjects: newProjects,
      };

      saveMediumTermMemory(newMediumTerm);

      return {
        ...prev,
        mediumTermMemory: newMediumTerm,
      };
    });
  }, []);

  const learnPattern = useCallback((pattern: string) => {
    setState(prev => {
      if (prev.longTermMemory.learnedPatterns.includes(pattern)) {
        return prev;
      }

      const newLongTerm = {
        ...prev.longTermMemory,
        learnedPatterns: [...prev.longTermMemory.learnedPatterns, pattern].slice(-100),
      };

      saveLongTermMemory(newLongTerm);

      return {
        ...prev,
        longTermMemory: newLongTerm,
      };
    });
  }, []);

  // ============= PROMPT GENERATION =============

  const getContextualPrompt = useCallback(() => {
    return buildSystemPrompt({
      personality: state.personality,
      mode: state.currentMode,
      shortTermMemory: state.shortTermMemory,
      mediumTermMemory: state.mediumTermMemory,
      longTermMemory: state.longTermMemory,
      conversationContext: state.conversationContext,
    });
  }, [state]);

  const getSystemPrompt = useCallback(() => {
    return getContextualPrompt();
  }, [getContextualPrompt]);

  // ============= PROACTIVE FEATURES =============

  const getSuggestedActions = useCallback((): string[] => {
    return suggestNextActions(
      state.currentMode,
      state.conversationContext,
      state.mediumTermMemory
    );
  }, [state.currentMode, state.conversationContext, state.mediumTermMemory]);

  const analyzeIntent = useCallback((message: string): ConversationContext => {
    const detected = detectIntent(message);
    
    setState(prev => ({
      ...prev,
      conversationContext: {
        ...prev.conversationContext,
        ...detected,
      },
      environmentContext: {
        ...prev.environmentContext,
        interactionCount: prev.environmentContext.interactionCount + 1,
      },
    }));

    return {
      ...state.conversationContext,
      ...detected,
    };
  }, [state.conversationContext]);

  // ============= PERSISTENCE =============

  const persistMemory = useCallback(async () => {
    try {
      saveMediumTermMemory(state.mediumTermMemory);
      saveLongTermMemory(state.longTermMemory);
      savePersonality(state.personality);
      updateSyncTimestamp();
      console.log("💾 JARVIS - Memória persistida");
    } catch (error) {
      console.error("❌ JARVIS - Erro ao persistir memória:", error);
    }
  }, [state.mediumTermMemory, state.longTermMemory, state.personality]);

  const clearMemory = useCallback((type: 'short' | 'medium' | 'long' | 'all') => {
    clearStorage(type);
    
    setState(prev => {
      switch (type) {
        case 'short':
          return { ...prev, shortTermMemory: initialShortTermMemory };
        case 'medium':
          return { ...prev, mediumTermMemory: loadMediumTermMemory() };
        case 'long':
          return { ...prev, longTermMemory: loadLongTermMemory() };
        case 'all':
          return {
            ...prev,
            shortTermMemory: initialShortTermMemory,
            mediumTermMemory: loadMediumTermMemory(),
            longTermMemory: loadLongTermMemory(),
          };
      }
    });
  }, []);

  // ============= AUTO-PERSIST =============

  useEffect(() => {
    if (!state.isReady) return;

    const interval = setInterval(() => {
      persistMemory();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [state.isReady, persistMemory]);

  // ============= TRACK SESSION DURATION =============

  useEffect(() => {
    if (!state.isReady) return;

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        environmentContext: {
          ...prev.environmentContext,
          sessionDuration: Math.floor(
            (Date.now() - new Date(prev.shortTermMemory.sessionStart).getTime()) / 1000
          ),
        },
      }));
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [state.isReady]);

  // ============= CONTEXT VALUE =============

  const value: JarvisContextType = {
    ...state,
    setMode,
    updateContext,
    setCurrentTask,
    addToRecentTopics,
    recordDecision,
    addProject,
    learnPattern,
    getContextualPrompt,
    getSystemPrompt,
    suggestNextActions: getSuggestedActions,
    detectIntent: analyzeIntent,
    persistMemory,
    clearMemory,
  };

  return (
    <JarvisContext.Provider value={value}>
      {children}
    </JarvisContext.Provider>
  );
};

export default JarvisContext;
