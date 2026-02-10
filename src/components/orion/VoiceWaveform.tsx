/**
 * 🎵 VoiceWaveform - Visualização Orgânica de Áudio
 * 
 * Anéis circulares dinâmicos, partículas e pulso de energia.
 * Parece consciência, não equalizador.
 */

import { useEffect, useRef } from "react";

interface VoiceWaveformProps {
  isActive: boolean;
  audioLevel?: number;
  isSpeaking?: boolean;
  isListening?: boolean;
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
  const particlesRef = useRef<Array<{ angle: number; radius: number; speed: number; size: number; alpha: number }>>([]);

  useEffect(() => {
    // Initialize particles
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 40 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 30 + Math.random() * 60,
        speed: 0.005 + Math.random() * 0.015,
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
      }));
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const getColor = () => {
      if (isSpeaking) return { r: 255, g: 200, b: 50 };
      if (isListening) return { r: 255, g: 215, b: 0 };
      return { r: 180, g: 140, b: 50 };
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const cx = w / 2;
      const cy = h / 2;
      const color = getColor();
      const time = Date.now() / 1000;
      const baseRadius = Math.min(cx, cy) * 0.35;
      const level = isActive ? audioLevel : 0.05;

      // Clear with fade
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(0, 0, w, h);

      // Outer glow
      if (isActive) {
        const glowGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.5, cx, cy, baseRadius * 2.5);
        glowGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.08 * level})`);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // Dynamic rings (3 concentric)
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = baseRadius * (0.6 + ring * 0.5) + Math.sin(time * (2 - ring * 0.3)) * level * 15;
        const segments = 128;
        const ringAlpha = (0.6 - ring * 0.15) * (0.4 + level);

        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const wobble =
            Math.sin(angle * 3 + time * (3 + ring)) * level * 12 +
            Math.sin(angle * 7 - time * 2) * level * 6 +
            Math.sin(angle * 5 + time * 4) * level * 4;
          const r = ringRadius + wobble;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${ringAlpha})`;
        ctx.lineWidth = 1.5 - ring * 0.3;
        ctx.stroke();
      }

      // Energy pulse (expanding circle)
      if (isActive) {
        const pulsePhase = (time * 1.5) % 1;
        const pulseRadius = baseRadius * (0.8 + pulsePhase * 1.2);
        const pulseAlpha = (1 - pulsePhase) * 0.3 * level;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${pulseAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Orbiting particles
      particlesRef.current.forEach((p) => {
        p.angle += p.speed * (1 + level * 2);
        const pRadius = p.radius * (1 + level * 0.4 + Math.sin(time * 2 + p.angle * 3) * 0.1);
        const px = cx + Math.cos(p.angle) * pRadius;
        const py = cy + Math.sin(p.angle) * pRadius;
        const pAlpha = p.alpha * (0.3 + level * 0.7);

        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 + level * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${pAlpha})`;
        ctx.fill();
      });

      // Core glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.4);
      coreGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 + level * 0.25})`);
      coreGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, audioLevel, isSpeaking, isListening]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
    </div>
  );
};

export default VoiceWaveform;
