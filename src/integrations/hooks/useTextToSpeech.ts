import { useState, useCallback, useRef } from "react";

export type TTSState = "idle" | "speaking" | "paused" | "error";

interface UseTextToSpeechProps {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

export const useTextToSpeech = ({
  voice,
  rate = 1,
  pitch = 1,
  volume = 1,
  language = "pt-BR",
}: UseTextToSpeechProps = {}) => {
  const [state, setState] = useState<TTSState>("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = "speechSynthesis" in window;

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      setState("error");
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Set voice if specified
    if (voice) {
      const voices = speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === voice || v.lang === voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      setState("speaking");
    };

    utterance.onend = () => {
      setState("idle");
    };

    utterance.onerror = () => {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    };

    utterance.onpause = () => {
      setState("paused");
    };

    utterance.onresume = () => {
      setState("speaking");
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, language, rate, pitch, volume, voice]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setState("idle");
  }, []);

  const pause = useCallback(() => {
    speechSynthesis.pause();
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    speechSynthesis.resume();
    setState("speaking");
  }, []);

  const getVoices = useCallback(() => {
    return speechSynthesis.getVoices();
  }, []);

  return {
    state,
    isSupported,
    speak,
    stop,
    pause,
    resume,
    getVoices,
    isSpeaking: state === "speaking",
    isPaused: state === "paused",
  };
};