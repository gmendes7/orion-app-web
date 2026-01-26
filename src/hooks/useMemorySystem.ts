/**
 * 🧠 useMemorySystem - Sistema de Memória Inteligente
 * 
 * Implementa memória em três camadas:
 * - Curto prazo: Sessão atual, contexto imediato
 * - Médio prazo: Projetos ativos, decisões recentes
 * - Longo prazo: Padrões aprendidos, histórico geral
 */

import { useState, useCallback, useEffect, useRef } from "react";
// Supabase import reserved for future cloud sync
// import { supabase } from "@/integrations/supabase/client";

// ============= TIPOS =============

interface MemoryEntry {
  id: string;
  content: string;
  type: "interaction" | "decision" | "pattern" | "preference" | "project";
  timestamp: Date;
  importance: number; // 0-1
  tags: string[];
  metadata?: Record<string, unknown>;
}

interface ShortTermData {
  currentContext: string | null;
  recentMessages: Array<{ role: string; content: string }>;
  activeTopics: string[];
  sessionNotes: string[];
}

interface MediumTermData {
  projects: Array<{ name: string; description: string; lastAccessed: Date }>;
  decisions: Array<{ decision: string; reason: string; date: Date }>;
  preferences: Record<string, unknown>;
  frequentPatterns: string[];
}

interface LongTermData {
  learnedBehaviors: string[];
  skillProfile: string[];
  historicalPatterns: string[];
  permanentNotes: string[];
}

interface MemoryStats {
  totalEntries: number;
  shortTermSize: number;
  mediumTermSize: number;
  longTermSize: number;
  lastConsolidation: Date | null;
}

const STORAGE_KEYS = {
  SHORT_TERM: "orion_memory_short",
  MEDIUM_TERM: "orion_memory_medium",
  LONG_TERM: "orion_memory_long",
  STATS: "orion_memory_stats",
};

const MAX_SHORT_TERM_MESSAGES = 50;
const MAX_MEDIUM_TERM_DECISIONS = 100;
const CONSOLIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutos

// ============= HOOK =============

export const useMemorySystem = () => {
  const [shortTerm, setShortTerm] = useState<ShortTermData>({
    currentContext: null,
    recentMessages: [],
    activeTopics: [],
    sessionNotes: [],
  });

  const [mediumTerm, setMediumTerm] = useState<MediumTermData>({
    projects: [],
    decisions: [],
    preferences: {},
    frequentPatterns: [],
  });

  const [longTerm, setLongTerm] = useState<LongTermData>({
    learnedBehaviors: [],
    skillProfile: ["React", "TypeScript", "Supabase", "Tailwind CSS"],
    historicalPatterns: [],
    permanentNotes: [],
  });

  const [stats, setStats] = useState<MemoryStats>({
    totalEntries: 0,
    shortTermSize: 0,
    mediumTermSize: 0,
    longTermSize: 0,
    lastConsolidation: null,
  });

  const consolidationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============= CARREGAMENTO =============

  useEffect(() => {
    loadMemory();
    startConsolidationCycle();

    return () => {
      if (consolidationTimerRef.current) {
        clearInterval(consolidationTimerRef.current);
      }
    };
  }, []);

  const loadMemory = useCallback(() => {
    try {
      // Carregar memória de médio prazo (persiste entre sessões)
      const savedMedium = localStorage.getItem(STORAGE_KEYS.MEDIUM_TERM);
      if (savedMedium) {
        const parsed = JSON.parse(savedMedium);
        setMediumTerm(prev => ({ ...prev, ...parsed }));
      }

      // Carregar memória de longo prazo
      const savedLong = localStorage.getItem(STORAGE_KEYS.LONG_TERM);
      if (savedLong) {
        const parsed = JSON.parse(savedLong);
        setLongTerm(prev => ({ ...prev, ...parsed }));
      }

      // Carregar estatísticas
      const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

      console.log("🧠 Memória carregada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao carregar memória:", error);
    }
  }, []);

  // ============= PERSISTÊNCIA =============

  const saveMemory = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEDIUM_TERM, JSON.stringify(mediumTerm));
      localStorage.setItem(STORAGE_KEYS.LONG_TERM, JSON.stringify(longTerm));
      
      const newStats: MemoryStats = {
        totalEntries: shortTerm.recentMessages.length + mediumTerm.decisions.length,
        shortTermSize: shortTerm.recentMessages.length,
        mediumTermSize: mediumTerm.decisions.length + mediumTerm.projects.length,
        longTermSize: longTerm.learnedBehaviors.length + longTerm.historicalPatterns.length,
        lastConsolidation: new Date(),
      };
      setStats(newStats);
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));

      console.log("💾 Memória salva");
    } catch (error) {
      console.error("❌ Erro ao salvar memória:", error);
    }
  }, [shortTerm, mediumTerm, longTerm]);

  // ============= CURTO PRAZO =============

  const setContext = useCallback((context: string | null) => {
    setShortTerm(prev => ({
      ...prev,
      currentContext: context,
    }));
  }, []);

  const addMessage = useCallback((role: "user" | "assistant", content: string) => {
    setShortTerm(prev => {
      const newMessages = [
        ...prev.recentMessages,
        { role, content },
      ].slice(-MAX_SHORT_TERM_MESSAGES);

      // Extrair tópicos automaticamente
      const topics = extractTopics(content);
      const newTopics = [...new Set([...topics, ...prev.activeTopics])].slice(0, 10);

      return {
        ...prev,
        recentMessages: newMessages,
        activeTopics: newTopics,
      };
    });
  }, []);

  const addSessionNote = useCallback((note: string) => {
    setShortTerm(prev => ({
      ...prev,
      sessionNotes: [...prev.sessionNotes, note].slice(-20),
    }));
  }, []);

  const clearShortTerm = useCallback(() => {
    setShortTerm({
      currentContext: null,
      recentMessages: [],
      activeTopics: [],
      sessionNotes: [],
    });
  }, []);

  // ============= MÉDIO PRAZO =============

  const addProject = useCallback((name: string, description: string) => {
    setMediumTerm(prev => {
      const existing = prev.projects.findIndex(p => p.name === name);
      let newProjects = [...prev.projects];

      if (existing >= 0) {
        newProjects[existing] = { name, description, lastAccessed: new Date() };
      } else {
        newProjects = [{ name, description, lastAccessed: new Date() }, ...newProjects].slice(0, 20);
      }

      return { ...prev, projects: newProjects };
    });
  }, []);

  const recordDecision = useCallback((decision: string, reason: string) => {
    setMediumTerm(prev => ({
      ...prev,
      decisions: [
        { decision, reason, date: new Date() },
        ...prev.decisions,
      ].slice(0, MAX_MEDIUM_TERM_DECISIONS),
    }));
  }, []);

  const setPreference = useCallback((key: string, value: unknown) => {
    setMediumTerm(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  }, []);

  const addPattern = useCallback((pattern: string) => {
    setMediumTerm(prev => {
      if (prev.frequentPatterns.includes(pattern)) return prev;
      return {
        ...prev,
        frequentPatterns: [pattern, ...prev.frequentPatterns].slice(0, 30),
      };
    });
  }, []);

  // ============= LONGO PRAZO =============

  const learnBehavior = useCallback((behavior: string) => {
    setLongTerm(prev => {
      if (prev.learnedBehaviors.includes(behavior)) return prev;
      return {
        ...prev,
        learnedBehaviors: [...prev.learnedBehaviors, behavior],
      };
    });
  }, []);

  const addSkill = useCallback((skill: string) => {
    setLongTerm(prev => {
      if (prev.skillProfile.includes(skill)) return prev;
      return {
        ...prev,
        skillProfile: [...prev.skillProfile, skill],
      };
    });
  }, []);

  const addPermanentNote = useCallback((note: string) => {
    setLongTerm(prev => ({
      ...prev,
      permanentNotes: [...prev.permanentNotes, note],
    }));
  }, []);

  // ============= CONSOLIDAÇÃO =============

  const startConsolidationCycle = useCallback(() => {
    consolidationTimerRef.current = setInterval(() => {
      consolidateMemory();
    }, CONSOLIDATION_INTERVAL);
  }, []);

  const consolidateMemory = useCallback(() => {
    console.log("🔄 Consolidando memória...");

    // Mover padrões frequentes de curto para médio prazo
    if (shortTerm.activeTopics.length > 5) {
      const frequentTopics = shortTerm.activeTopics.slice(0, 3);
      frequentTopics.forEach(topic => addPattern(`Interesse em: ${topic}`));
    }

    // Promover decisões importantes de médio para longo prazo
    const importantDecisions = mediumTerm.decisions.filter(d => 
      d.reason.length > 100 || 
      d.decision.toLowerCase().includes("arquitetura") ||
      d.decision.toLowerCase().includes("refatorar")
    );
    
    importantDecisions.forEach(d => {
      const pattern = `Decisão: ${d.decision.substring(0, 100)}`;
      if (!longTerm.historicalPatterns.includes(pattern)) {
        setLongTerm(prev => ({
          ...prev,
          historicalPatterns: [...prev.historicalPatterns, pattern].slice(-50),
        }));
      }
    });

    // Salvar tudo
    saveMemory();

    console.log("✅ Memória consolidada");
  }, [shortTerm, mediumTerm, longTerm, addPattern, saveMemory]);

  // ============= BUSCA E RECUPERAÇÃO =============

  const searchMemory = useCallback((query: string): MemoryEntry[] => {
    const results: MemoryEntry[] = [];
    const lowerQuery = query.toLowerCase();

    // Buscar em mensagens recentes
    shortTerm.recentMessages.forEach((msg, idx) => {
      if (msg.content.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `short-${idx}`,
          content: msg.content,
          type: "interaction",
          timestamp: new Date(),
          importance: 0.7,
          tags: ["recente"],
        });
      }
    });

    // Buscar em decisões
    mediumTerm.decisions.forEach((dec, idx) => {
      if (dec.decision.toLowerCase().includes(lowerQuery) || 
          dec.reason.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `decision-${idx}`,
          content: `${dec.decision}: ${dec.reason}`,
          type: "decision",
          timestamp: dec.date,
          importance: 0.8,
          tags: ["decisão"],
        });
      }
    });

    // Buscar em padrões aprendidos
    longTerm.learnedBehaviors.forEach((behavior, idx) => {
      if (behavior.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `behavior-${idx}`,
          content: behavior,
          type: "pattern",
          timestamp: new Date(),
          importance: 0.9,
          tags: ["comportamento"],
        });
      }
    });

    return results.sort((a, b) => b.importance - a.importance).slice(0, 10);
  }, [shortTerm, mediumTerm, longTerm]);

  const getRelevantContext = useCallback((currentMessage: string): string => {
    const relevant: string[] = [];

    // Adicionar contexto atual
    if (shortTerm.currentContext) {
      relevant.push(`📍 Contexto: ${shortTerm.currentContext}`);
    }

    // Adicionar tópicos ativos
    if (shortTerm.activeTopics.length > 0) {
      relevant.push(`🏷️ Tópicos: ${shortTerm.activeTopics.slice(0, 5).join(", ")}`);
    }

    // Adicionar projetos ativos
    const recentProjects = mediumTerm.projects.slice(0, 3);
    if (recentProjects.length > 0) {
      relevant.push(`📁 Projetos: ${recentProjects.map(p => p.name).join(", ")}`);
    }

    // Adicionar skills
    if (longTerm.skillProfile.length > 0) {
      relevant.push(`🛠️ Stack: ${longTerm.skillProfile.slice(0, 6).join(", ")}`);
    }

    // Buscar memórias relacionadas
    const memories = searchMemory(currentMessage);
    if (memories.length > 0) {
      relevant.push(`📚 Memória: ${memories[0].content.substring(0, 200)}`);
    }

    return relevant.join("\n");
  }, [shortTerm, mediumTerm, longTerm, searchMemory]);

  // ============= UTILITÁRIOS =============

  const extractTopics = (text: string): string[] => {
    // Extração simples de tópicos baseada em palavras-chave
    const techKeywords = [
      "react", "typescript", "javascript", "css", "html", "api", "database",
      "supabase", "node", "python", "backend", "frontend", "deploy", "git",
      "component", "hook", "function", "class", "interface", "type",
    ];

    const words = text.toLowerCase().split(/\s+/);
    return techKeywords.filter(keyword => words.some(word => word.includes(keyword)));
  };

  const getStats = useCallback((): MemoryStats => stats, [stats]);

  const clearAllMemory = useCallback(() => {
    clearShortTerm();
    setMediumTerm({
      projects: [],
      decisions: [],
      preferences: {},
      frequentPatterns: [],
    });
    setLongTerm({
      learnedBehaviors: [],
      skillProfile: [],
      historicalPatterns: [],
      permanentNotes: [],
    });
    
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    console.log("🗑️ Toda a memória foi limpa");
  }, [clearShortTerm]);

  return {
    // Estado
    shortTerm,
    mediumTerm,
    longTerm,
    stats,

    // Curto prazo
    setContext,
    addMessage,
    addSessionNote,
    clearShortTerm,

    // Médio prazo
    addProject,
    recordDecision,
    setPreference,
    addPattern,

    // Longo prazo
    learnBehavior,
    addSkill,
    addPermanentNote,

    // Busca
    searchMemory,
    getRelevantContext,

    // Gestão
    consolidateMemory,
    saveMemory,
    getStats,
    clearAllMemory,
  };
};
