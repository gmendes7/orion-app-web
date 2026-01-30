/**
 * 🎵 VoiceWaveform - Onda Sonora Visual
 * 
 * Visualização de áudio estilo radar/osciloscópio.
 * Cor dourada, fundo escuro, animações suaves.
 * 
 * Reage em tempo real à voz do usuário e da IA.
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface VoiceWaveformProps {
  isActive: boolean;
  audioLevel?: number; // 0-1
  isSpeaking?: boolean; // IA está falando
  isListening?: boolean; // Usuário está falando
  className?: string;
}

export const VoiceWaveform = ({
  isActive = false,
  audioLevel = 0,
  isSpeaking = false,
  isListening = false,
  className = "",
}: VoiceWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [bars] = useState<number[]>(Array(64).fill(0));
  const barsRef = useRef(bars);

  // Cor baseada no estado
  const getColor = () => {
    if (isSpeaking) return { r: 255, g: 200, b: 50 };  // Dourado brilhante
    if (isListening) return { r: 255, g: 215, b: 0 };  // Amarelo
    return { r: 180, g: 140, b: 50 }; // Dourado escuro (idle)
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const centerY = height / 2;
      const barWidth = width / barsRef.current.length;
      const color = getColor();

      // Limpar canvas com fade
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, width, height);

      // Linha central
      ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Desenhar barras
      barsRef.current.forEach((value, i) => {
        // Atualizar valor com suavização
        const targetValue = isActive 
          ? Math.random() * audioLevel * 100 + (audioLevel * 20)
          : Math.random() * 5;
        
        barsRef.current[i] = barsRef.current[i] * 0.85 + targetValue * 0.15;

        const barHeight = barsRef.current[i];
        const x = i * barWidth;
        
        // Gradiente para cada barra
        const gradient = ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.8 + (audioLevel * 0.2)})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, centerY - barHeight, barWidth - 1, barHeight * 2);

        // Glow effect
        if (isActive && barHeight > 30) {
          ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
          ctx.shadowBlur = 10;
          ctx.fillRect(x, centerY - barHeight * 0.5, barWidth - 1, barHeight);
          ctx.shadowBlur = 0;
        }
      });

      // Linha de onda senoidal sobre as barras
      if (isActive) {
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const time = Date.now() / 1000;
        for (let x = 0; x < width; x++) {
          const y = centerY + 
            Math.sin(x * 0.02 + time * 3) * (audioLevel * 30) +
            Math.sin(x * 0.05 + time * 5) * (audioLevel * 15);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, audioLevel, isSpeaking, isListening]);

  return (
    <div className={`relative ${className}`}>
      {/* Background com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orion-stellar-gold/5 to-transparent" />
      
      {/* Canvas da waveform */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />

      {/* Bordas com glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: isActive 
            ? "inset 0 0 30px rgba(255, 200, 50, 0.2)" 
            : "none",
        }}
        animate={{
          opacity: isActive ? [0.5, 1, 0.5] : 0.2,
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      />

      {/* Indicadores laterais */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-orion-stellar-gold/50 to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-orion-stellar-gold/50 to-transparent" />
    </div>
  );
};

export default VoiceWaveform;
