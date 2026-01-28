/**
 * 💾 JARVIS Storage Engine
 * 
 * Persistent storage for JARVIS memory and state.
 * Uses localStorage with encryption-ready structure.
 */

import {
  DeviceIdentity,
  DeviceCapabilities,
  ShortTermMemory,
  MediumTermMemory,
  LongTermMemory,
  JarvisPersonality,
  JarvisMode,
  DEFAULT_PERSONALITY,
} from './types';

// ============= STORAGE KEYS =============

const STORAGE_PREFIX = 'jarvis_';

export const STORAGE_KEYS = {
  DEVICE_ID: `${STORAGE_PREFIX}device_id`,
  IDENTITY: `${STORAGE_PREFIX}identity`,
  PERSONALITY: `${STORAGE_PREFIX}personality`,
  MODE: `${STORAGE_PREFIX}mode`,
  SHORT_TERM: `${STORAGE_PREFIX}memory_short`,
  MEDIUM_TERM: `${STORAGE_PREFIX}memory_medium`,
  LONG_TERM: `${STORAGE_PREFIX}memory_long`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  LAST_SYNC: `${STORAGE_PREFIX}last_sync`,
} as const;

// ============= DEVICE IDENTITY =============

export async function getOrCreateDeviceIdentity(): Promise<DeviceIdentity> {
  try {
    const existingId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    const existingIdentity = localStorage.getItem(STORAGE_KEYS.IDENTITY);
    
    if (existingId && existingIdentity) {
      const identity = JSON.parse(existingIdentity) as DeviceIdentity;
      // Update last seen
      identity.lastSeen = new Date();
      saveDeviceIdentity(identity);
      return identity;
    }

    // Create new identity
    const deviceId = generateDeviceId();
    const fingerprint = await generateFingerprint();
    const capabilities = detectCapabilities();

    const identity: DeviceIdentity = {
      deviceId,
      fingerprint,
      createdAt: new Date(),
      lastSeen: new Date(),
      platform: detectPlatform(),
      capabilities,
    };

    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    saveDeviceIdentity(identity);

    console.log('🆔 Nova identidade JARVIS criada:', deviceId.substring(0, 12) + '...');
    return identity;
  } catch (error) {
    console.error('❌ Erro ao criar identidade:', error);
    // Fallback identity
    return {
      deviceId: `jarvis_fallback_${Date.now()}`,
      fingerprint: 'fallback',
      createdAt: new Date(),
      lastSeen: new Date(),
      platform: 'web',
      capabilities: detectCapabilities(),
    };
  }
}

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `jarvis_${timestamp}_${random}`;
}

async function generateFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('JARVIS fingerprint', 2, 15);
    }

    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      canvas.toDataURL(),
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  } catch {
    return 'fp_' + Math.random().toString(36).substring(2);
  }
}

function detectPlatform(): DeviceIdentity['platform'] {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }
  
  if (/electron/i.test(ua) || /tauri/i.test(ua)) {
    return 'desktop';
  }
  
  return 'web';
}

function detectCapabilities(): DeviceCapabilities {
  return {
    camera: !!navigator.mediaDevices?.getUserMedia,
    microphone: !!navigator.mediaDevices?.getUserMedia,
    speechSynthesis: 'speechSynthesis' in window,
    speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    notifications: 'Notification' in window,
    localStorage: !!window.localStorage,
  };
}

function saveDeviceIdentity(identity: DeviceIdentity): void {
  try {
    localStorage.setItem(STORAGE_KEYS.IDENTITY, JSON.stringify(identity));
  } catch (error) {
    console.error('Erro ao salvar identidade:', error);
  }
}

// ============= MEMORY STORAGE =============

export function loadShortTermMemory(): ShortTermMemory {
  return {
    currentTask: null,
    recentTopics: [],
    activeContext: null,
    sessionStart: new Date(),
    conversationSummary: null,
    pendingActions: [],
  };
}

export function loadMediumTermMemory(): MediumTermMemory {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MEDIUM_TERM);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reconstruct dates
      if (parsed.activeProjects) {
        parsed.activeProjects = parsed.activeProjects.map((p: Record<string, unknown>) => ({
          ...p,
          lastAccessed: new Date(p.lastAccessed as string),
        }));
      }
      if (parsed.recentDecisions) {
        parsed.recentDecisions = parsed.recentDecisions.map((d: Record<string, unknown>) => ({
          ...d,
          date: new Date(d.date as string),
        }));
      }
      return parsed;
    }
  } catch (error) {
    console.error('Erro ao carregar memória de médio prazo:', error);
  }

  return {
    activeProjects: [],
    recentDecisions: [],
    preferredStack: ['React', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Vite'],
    workingPatterns: [],
    codePreferences: {
      namingConvention: 'camelCase',
      commentStyle: 'documented',
      testingApproach: 'bdd',
      preferredPatterns: ['hooks', 'composition', 'functional'],
    },
  };
}

export function loadLongTermMemory(): LongTermMemory {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LONG_TERM);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Erro ao carregar memória de longo prazo:', error);
  }

  return {
    userStyle: 'direto e técnico',
    technicalPreferences: {},
    projectHistory: [],
    learnedPatterns: [],
    skillProfile: ['React', 'TypeScript', 'Supabase', 'Tailwind CSS'],
    behaviorInsights: [],
  };
}

export function saveMediumTermMemory(memory: MediumTermMemory): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEDIUM_TERM, JSON.stringify(memory));
  } catch (error) {
    console.error('Erro ao salvar memória de médio prazo:', error);
  }
}

export function saveLongTermMemory(memory: LongTermMemory): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LONG_TERM, JSON.stringify(memory));
  } catch (error) {
    console.error('Erro ao salvar memória de longo prazo:', error);
  }
}

// ============= PERSONALITY STORAGE =============

export function loadPersonality(): JarvisPersonality {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PERSONALITY);
    if (saved) {
      return { ...DEFAULT_PERSONALITY, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Erro ao carregar personalidade:', error);
  }
  return DEFAULT_PERSONALITY;
}

export function savePersonality(personality: JarvisPersonality): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PERSONALITY, JSON.stringify(personality));
  } catch (error) {
    console.error('Erro ao salvar personalidade:', error);
  }
}

// ============= MODE STORAGE =============

export function loadMode(): JarvisMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MODE);
    if (saved && ['general', 'engineering', 'planning', 'debugging', 'analysis', 'learning'].includes(saved)) {
      return saved as JarvisMode;
    }
  } catch {
    // Ignore
  }
  return 'general';
}

export function saveMode(mode: JarvisMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MODE, mode);
  } catch {
    // Ignore
  }
}

// ============= CLEAR STORAGE =============

export function clearStorage(type: 'short' | 'medium' | 'long' | 'all'): void {
  try {
    switch (type) {
      case 'short':
        // Short term is not persisted
        break;
      case 'medium':
        localStorage.removeItem(STORAGE_KEYS.MEDIUM_TERM);
        break;
      case 'long':
        localStorage.removeItem(STORAGE_KEYS.LONG_TERM);
        break;
      case 'all':
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
        break;
    }
    console.log(`🗑️ Memória ${type} limpa`);
  } catch (error) {
    console.error('Erro ao limpar storage:', error);
  }
}

// ============= SYNC STATUS =============

export function updateSyncTimestamp(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch {
    // Ignore
  }
}

export function getLastSyncTimestamp(): Date | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (saved) {
      return new Date(saved);
    }
  } catch {
    // Ignore
  }
  return null;
}
