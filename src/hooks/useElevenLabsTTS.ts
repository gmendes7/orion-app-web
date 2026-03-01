/**
 * 🔊 useElevenLabsTTS - Text-to-Speech com ElevenLabs
 * 
 * Voz natural e humana para a ORION usando ElevenLabs API.
 * Faz fallback para Web Speech API se ElevenLabs falhar.
 */

import { useState, useCallback, useRef } from "react";

const SUPABASE_URL = "https://wcwwqfiolxcluyuhmxxf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3dxZmlvbHhjbHV5dWhteHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTA4MDMsImV4cCI6MjA3MDY2NjgwM30.IZQUelbBZI492dffw3xd2eYtSn7lx7RcyuKYWtyaDDc";

export type TTSProvider = "elevenlabs" | "browser";

interface UseElevenLabsTTSOptions {
  voiceId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export const useElevenLabsTTS = (options: UseElevenLabsTTSOptions = {}) => {
  const { voiceId, onStart, onEnd, onError } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<TTSProvider>("elevenlabs");
  const [elevenLabsAvailable, setElevenLabsAvailable] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Stop browser TTS
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Abort pending request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speakWithBrowser = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a Portuguese voice
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang === "pt-BR") || voices.find(v => v.lang.startsWith("pt"));
    if (ptVoice) utterance.voice = ptVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      onStart?.();
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [onStart, onEnd]);

  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return;

    // Stop any current speech
    stop();

    // Clean text for TTS
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/[#*_~>[\]()]/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!cleanText) return;

    const ttsText = cleanText.length > 800 ? cleanText.substring(0, 800) + "..." : cleanText;

    // If ElevenLabs is known to be down, go straight to browser TTS
    if (!elevenLabsAvailable) {
      console.log("🔊 ElevenLabs indisponível, usando browser TTS");
      setProvider("browser");
      speakWithBrowser(ttsText);
      return;
    }

    setIsLoading(true);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text: ttsText, voiceId }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        // If server says fallback, disable ElevenLabs for this session
        if (data.fallback) {
          console.warn("⚠️ ElevenLabs indisponível nesta sessão, usando browser TTS");
          setElevenLabsAvailable(false);
        }
        throw new Error(data.error || `TTS request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error || !data.audioContent) {
        throw new Error(data.error || "No audio content received");
      }

      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsLoading(false);
        setIsSpeaking(true);
        setProvider("elevenlabs");
        onStart?.();
      };

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        onEnd?.();
      };

      audio.onerror = () => {
        setIsLoading(false);
        setProvider("browser");
        speakWithBrowser(ttsText);
      };

      await audio.play();
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setIsLoading(false);
        return;
      }

      console.warn("⚠️ ElevenLabs TTS failed, usando browser TTS:", (error as Error).message);
      setIsLoading(false);
      setProvider("browser");
      onError?.((error as Error).message);

      // Fallback to browser TTS
      speakWithBrowser(ttsText);
    }
  }, [voiceId, stop, speakWithBrowser, onStart, onEnd, onError, elevenLabsAvailable]);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    provider,
  };
};
