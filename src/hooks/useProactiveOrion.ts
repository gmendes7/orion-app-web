/**
 * 🧠 useProactiveOrion — Sistema de Proatividade da ORION
 * 
 * Monitora silêncio prolongado, padrões de sessão e contexto temporal
 * para iniciar conversas espontaneamente.
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface ProactiveConfig {
  /** Segundos de silêncio antes de ativar (default: 180 = 3 min) */
  silenceThresholdSeconds?: number;
  /** Intervalo mínimo entre intervenções proativas em segundos (default: 300 = 5 min) */
  cooldownSeconds?: number;
  /** Se a proatividade está habilitada */
  enabled?: boolean;
}

interface ProactiveEvent {
  type: "silence" | "session_long" | "time_awareness" | "encouragement";
  message: string;
}

type ProactiveCallback = (event: ProactiveEvent) => void;

const SILENCE_MESSAGES = [
  "Ei, está tudo bem por aí? Faz um tempo que não nos falamos.",
  "Percebi que você está quieto. Precisa de algo?",
  "Estou aqui se precisar. Quer discutir alguma coisa?",
  "Notei um silêncio prolongado. Posso ajudar com algo?",
  "Tudo certo? Se quiser, posso sugerir algo para trabalharmos.",
];

const SESSION_LONG_MESSAGES = [
  "Você está trabalhando há bastante tempo. Que tal uma pausa rápida?",
  "Sessão longa detectada. Lembre-se de descansar os olhos.",
  "Já faz um bom tempo que estamos aqui. Uma pausa curta pode ajudar na produtividade.",
];

const MORNING_MESSAGES = [
  "Bom dia! Pronta para começar. O que vamos fazer hoje?",
  "Bom dia. Estou aqui e pronta para o que precisar.",
];

const NIGHT_MESSAGES = [
  "Já está tarde. Quer encerrar por hoje ou continuar mais um pouco?",
  "Percebo que já é noite. Cuide do descanso — amanhã continuamos.",
];

const ENCOURAGEMENT_MESSAGES = [
  "Você está indo bem. Continue assim.",
  "Bom progresso até agora.",
  "Gosto do ritmo. Estamos evoluindo.",
];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getHour(): number {
  return new Date().getHours();
}

export function useProactiveOrion(
  onProactive: ProactiveCallback,
  config: ProactiveConfig = {}
) {
  const {
    silenceThresholdSeconds = 180,
    cooldownSeconds = 300,
    enabled = true,
  } = config;

  const lastActivityRef = useRef(Date.now());
  const lastProactiveRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const hasGreetedRef = useRef(false);
  const messageCountRef = useRef(0);
  const [isProactiveActive, setIsProactiveActive] = useState(false);

  // Register user activity
  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    messageCountRef.current += 1;
  }, []);

  // Check if cooldown has passed
  const canTrigger = useCallback(() => {
    return Date.now() - lastProactiveRef.current > cooldownSeconds * 1000;
  }, [cooldownSeconds]);

  // Fire a proactive event
  const trigger = useCallback(
    (event: ProactiveEvent) => {
      if (!canTrigger()) return;
      lastProactiveRef.current = Date.now();
      setIsProactiveActive(true);
      onProactive(event);
      setTimeout(() => setIsProactiveActive(false), 3000);
    },
    [canTrigger, onProactive]
  );

  // Morning/night greeting — once per session
  useEffect(() => {
    if (!enabled || hasGreetedRef.current) return;

    const timer = setTimeout(() => {
      const hour = getHour();
      if (hour >= 6 && hour < 12) {
        trigger({ type: "time_awareness", message: pickRandom(MORNING_MESSAGES) });
      } else if (hour >= 23 || hour < 5) {
        trigger({ type: "time_awareness", message: pickRandom(NIGHT_MESSAGES) });
      }
      hasGreetedRef.current = true;
    }, 5000); // 5s after mount

    return () => clearTimeout(timer);
  }, [enabled, trigger]);

  // Silence monitor
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const silenceMs = Date.now() - lastActivityRef.current;
      const silenceS = silenceMs / 1000;

      if (silenceS >= silenceThresholdSeconds && canTrigger()) {
        trigger({ type: "silence", message: pickRandom(SILENCE_MESSAGES) });
      }
    }, 30_000); // Check every 30s

    return () => clearInterval(interval);
  }, [enabled, silenceThresholdSeconds, canTrigger, trigger]);

  // Long session monitor (every 45 min)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const sessionMinutes = (Date.now() - sessionStartRef.current) / 60_000;
      if (sessionMinutes >= 45 && canTrigger()) {
        trigger({ type: "session_long", message: pickRandom(SESSION_LONG_MESSAGES) });
        sessionStartRef.current = Date.now(); // Reset for next check
      }
    }, 60_000 * 10); // Check every 10 min

    return () => clearInterval(interval);
  }, [enabled, canTrigger, trigger]);

  // Encouragement after sustained activity (every ~15 messages)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (messageCountRef.current >= 15 && canTrigger()) {
        trigger({ type: "encouragement", message: pickRandom(ENCOURAGEMENT_MESSAGES) });
        messageCountRef.current = 0;
      }
    }, 60_000); // Check every minute

    return () => clearInterval(interval);
  }, [enabled, canTrigger, trigger]);

  // Track mouse/keyboard as activity signals
  useEffect(() => {
    if (!enabled) return;

    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
    };
  }, [enabled]);

  return {
    registerActivity,
    isProactiveActive,
  };
}
