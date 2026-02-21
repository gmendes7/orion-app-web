/**
 * 🧠 useBehavioralDetection — Detecção de Estado Comportamental
 * 
 * Analisa padrões de interação do usuário (mouse, teclado, scroll, cliques)
 * para inferir estados comportamentais: foco, cansaço, frustração, dispersão.
 * 
 * Também suporta análise via câmera quando ativa, enviando frames periódicos
 * para a IA analisar expressões faciais.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BehavioralState = 
  | "focused"      // Atividade consistente e regular
  | "fatigued"     // Atividade decrescente, longos intervalos
  | "frustrated"   // Cliques rápidos, correções frequentes, backspaces
  | "distracted"   // Mouse errático, sem foco
  | "idle"         // Sem atividade
  | "unknown";

interface BehavioralMetrics {
  /** Teclas por minuto (últimos 60s) */
  typingSpeed: number;
  /** Razão backspace/teclas normais */
  correctionRate: number;
  /** Cliques por minuto */
  clickRate: number;
  /** Distância total do mouse em px (últimos 30s) */
  mouseTravel: number;
  /** Segundos desde última interação */
  idleSeconds: number;
  /** Minutos totais de sessão */
  sessionMinutes: number;
}

interface BehavioralDetectionConfig {
  /** Intervalo de análise em ms (default: 15000 = 15s) */
  analysisInterval?: number;
  /** Se análise por câmera está habilitada */
  cameraAnalysisEnabled?: boolean;
  /** Intervalo de análise por câmera em ms (default: 60000 = 1 min) */
  cameraInterval?: number;
  enabled?: boolean;
}

interface UseBehavioralDetectionReturn {
  state: BehavioralState;
  metrics: BehavioralMetrics;
  confidence: number;
  /** Mensagem contextual baseada no estado detectado */
  suggestion: string | null;
  /** Força uma análise imediata */
  analyzeNow: () => void;
  /** Análise via câmera (requer videoRef) */
  analyzeFace: (videoElement: HTMLVideoElement) => Promise<string | null>;
}

// Buffers circulares para métricas
const BUFFER_WINDOW = 60_000; // 60 segundos

const STATE_SUGGESTIONS: Record<BehavioralState, string[]> = {
  focused: [],
  fatigued: [
    "Você parece cansado. Que tal uma pausa de 5 minutos?",
    "Detectei sinais de fadiga. Descansar um pouco pode ajudar.",
    "Sua atividade está diminuindo. Talvez seja hora de uma pausa.",
  ],
  frustrated: [
    "Parece que algo está difícil. Posso ajudar a resolver?",
    "Detectei muitas correções. Quer que eu analise o que está travando?",
    "Você parece frustrado. Vamos resolver isso juntos?",
  ],
  distracted: [
    "Percebo que você está disperso. Quer focar em algo específico?",
    "Quer que eu sugira uma tarefa para focar?",
  ],
  idle: [],
  unknown: [],
};

function pickRandom(arr: string[]): string | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useBehavioralDetection(
  config: BehavioralDetectionConfig = {}
): UseBehavioralDetectionReturn {
  const {
    analysisInterval = 15_000,
    cameraAnalysisEnabled = false,
    cameraInterval = 60_000,
    enabled = true,
  } = config;

  const [state, setState] = useState<BehavioralState>("unknown");
  const [confidence, setConfidence] = useState(0);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<BehavioralMetrics>({
    typingSpeed: 0,
    correctionRate: 0,
    clickRate: 0,
    mouseTravel: 0,
    idleSeconds: 0,
    sessionMinutes: 0,
  });

  // Event buffers
  const keystrokesRef = useRef<number[]>([]);
  const backspacesRef = useRef<number[]>([]);
  const clicksRef = useRef<number[]>([]);
  const mousePositionsRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const lastActivityRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());
  const lastSuggestionRef = useRef(0);
  const lastCameraAnalysisRef = useRef(0);

  // Prune old events from buffer
  const pruneBuffer = useCallback((buffer: number[], now: number) => {
    const cutoff = now - BUFFER_WINDOW;
    while (buffer.length > 0 && buffer[0] < cutoff) buffer.shift();
  }, []);

  // Collect input events
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (e.key === "Backspace" || e.key === "Delete") {
        backspacesRef.current.push(now);
      } else if (e.key.length === 1) {
        keystrokesRef.current.push(now);
      }
    };

    const onClick = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      clicksRef.current.push(now);
    };

    const onMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      lastActivityRef.current = now;
      const positions = mousePositionsRef.current;
      // Sample every 200ms max
      if (positions.length === 0 || now - positions[positions.length - 1].t > 200) {
        positions.push({ x: e.clientX, y: e.clientY, t: now });
        // Keep only last 30s
        const cutoff = now - 30_000;
        while (positions.length > 0 && positions[0].t < cutoff) positions.shift();
      }
    };

    const onTouch = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("keydown", onKeyDown, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClick);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [enabled]);

  // Calculate metrics and determine state
  const analyze = useCallback(() => {
    const now = Date.now();

    // Prune buffers
    pruneBuffer(keystrokesRef.current, now);
    pruneBuffer(backspacesRef.current, now);
    pruneBuffer(clicksRef.current, now);

    const keyCount = keystrokesRef.current.length;
    const backspaceCount = backspacesRef.current.length;
    const clickCount = clicksRef.current.length;
    const idleSeconds = (now - lastActivityRef.current) / 1000;
    const sessionMinutes = (now - sessionStartRef.current) / 60_000;

    // Typing speed (keys per minute)
    const typingSpeed = keyCount; // already in 60s window

    // Correction rate
    const totalKeys = keyCount + backspaceCount;
    const correctionRate = totalKeys > 0 ? backspaceCount / totalKeys : 0;

    // Click rate per minute
    const clickRate = clickCount;

    // Mouse travel distance
    const positions = mousePositionsRef.current;
    let mouseTravel = 0;
    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i].x - positions[i - 1].x;
      const dy = positions[i].y - positions[i - 1].y;
      mouseTravel += Math.sqrt(dx * dx + dy * dy);
    }

    const newMetrics: BehavioralMetrics = {
      typingSpeed,
      correctionRate,
      clickRate,
      mouseTravel,
      idleSeconds,
      sessionMinutes,
    };
    setMetrics(newMetrics);

    // --- State inference ---
    let detectedState: BehavioralState = "unknown";
    let detectedConfidence = 0.5;

    if (idleSeconds > 120) {
      detectedState = "idle";
      detectedConfidence = 0.9;
    } else if (correctionRate > 0.35 && clickRate > 10) {
      // High corrections + rapid clicks = frustration
      detectedState = "frustrated";
      detectedConfidence = 0.7 + Math.min(correctionRate, 0.2);
    } else if (sessionMinutes > 60 && typingSpeed < 10 && mouseTravel < 500) {
      // Long session, low activity = fatigue
      detectedState = "fatigued";
      detectedConfidence = 0.6 + Math.min(sessionMinutes / 200, 0.3);
    } else if (mouseTravel > 5000 && typingSpeed < 5 && clickRate < 3) {
      // Lots of mouse movement, no typing = distraction
      detectedState = "distracted";
      detectedConfidence = 0.6;
    } else if (typingSpeed > 15 && correctionRate < 0.15) {
      // Steady typing, few corrections = focus
      detectedState = "focused";
      detectedConfidence = 0.8;
    } else if (typingSpeed > 0 || clickRate > 0) {
      detectedState = "focused";
      detectedConfidence = 0.5;
    }

    setState(detectedState);
    setConfidence(detectedConfidence);

    // Generate suggestion if actionable state (with cooldown)
    const cooldownMs = 300_000; // 5 min
    if (
      ["frustrated", "fatigued", "distracted"].includes(detectedState) &&
      now - lastSuggestionRef.current > cooldownMs
    ) {
      const msg = pickRandom(STATE_SUGGESTIONS[detectedState]);
      if (msg) {
        setSuggestion(msg);
        lastSuggestionRef.current = now;
      }
    } else if (detectedState === "focused" || detectedState === "idle") {
      setSuggestion(null);
    }
  }, [pruneBuffer]);

  // Periodic analysis
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(analyze, analysisInterval);
    return () => clearInterval(interval);
  }, [enabled, analysisInterval, analyze]);

  // Camera-based face analysis
  const analyzeFace = useCallback(async (videoElement: HTMLVideoElement): Promise<string | null> => {
    if (!cameraAnalysisEnabled) return null;
    
    const now = Date.now();
    if (now - lastCameraAnalysisRef.current < cameraInterval) return null;
    lastCameraAnalysisRef.current = now;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 320; // Low res for speed
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(videoElement, 0, 0, 320, 240);
      const base64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];

      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: {
          image: base64,
          prompt: 
            "Analyze this person's facial expression briefly. " +
            "Respond ONLY with one JSON object: " +
            '{"state": "focused"|"fatigued"|"frustrated"|"neutral", "confidence": 0.0-1.0, "note": "brief observation"}',
        },
      });

      if (error || !data?.analysis) return null;

      try {
        const parsed = JSON.parse(data.analysis);
        if (parsed.state && parsed.confidence > 0.6) {
          const mappedState = parsed.state === "neutral" ? "focused" : parsed.state;
          setState(mappedState as BehavioralState);
          setConfidence(parsed.confidence);
          
          if (["fatigued", "frustrated"].includes(parsed.state)) {
            const msg = pickRandom(STATE_SUGGESTIONS[parsed.state as BehavioralState]);
            if (msg) {
              setSuggestion(msg);
              lastSuggestionRef.current = Date.now();
            }
          }
          return parsed.note || null;
        }
      } catch {
        // Response wasn't valid JSON, ignore
      }

      return null;
    } catch (err) {
      console.warn("🧠 Behavioral camera analysis failed:", err);
      return null;
    }
  }, [cameraAnalysisEnabled, cameraInterval]);

  return {
    state,
    metrics,
    confidence,
    suggestion,
    analyzeNow: analyze,
    analyzeFace,
  };
}
