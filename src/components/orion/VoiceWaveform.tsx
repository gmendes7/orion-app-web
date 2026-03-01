/**
 * 🎵 VoiceWaveform - Visualização Orgânica de Áudio
 * 
 * Anéis circulares dinâmicos, partículas e pulso de energia.
 * Parece consciência, não equalizador.
 */

import { forwardRef, useEffect, useRef } from "react";

interface VoiceWaveformProps {
  isActive: boolean;
  audioLevel?: number;
  isSpeaking?: boolean;
  isListening?: boolean;
  className?: string;
}

export const VoiceWaveform = forwardRef<HTMLDivElement, VoiceWaveformProps>(({
  isActive = false,
  audioLevel = 0,
  isSpeaking = false,
  isListening = false,
  className = "",
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Array<{ angle: number; radius: number; speed: number; size: number; alpha: number }>>([]);
  // Store mutable props in refs to avoid recreating the animation loop
  const propsRef = useRef({ isActive, audioLevel, isSpeaking, isListening });
  propsRef.current = { isActive, audioLevel, isSpeaking, isListening };

  useEffect(() => {
    // Initialize particles once
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 30 }, () => ({
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const { isActive: active, audioLevel: level, isSpeaking: speaking, isListening: listening } = propsRef.current;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const cx = w / 2;
      const cy = h / 2;
      const time = Date.now() / 1000;
      const baseRadius = Math.min(cx, cy) * 0.35;
      const effectLevel = active ? level : 0.05;

      const color = speaking
        ? { r: 255, g: 200, b: 50 }
        : listening
        ? { r: 255, g: 215, b: 0 }
        : { r: 180, g: 140, b: 50 };

      // Clear with fade
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(0, 0, w, h);

      // Outer glow
      if (active) {
        const glowGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.5, cx, cy, baseRadius * 2.5);
        glowGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.08 * effectLevel})`);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // Dynamic rings (3 concentric)
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = baseRadius * (0.6 + ring * 0.5) + Math.sin(time * (2 - ring * 0.3)) * effectLevel * 15;
        const segments = 64; // Reduced from 128
        const ringAlpha = (0.6 - ring * 0.15) * (0.4 + effectLevel);

        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const wobble =
            Math.sin(angle * 3 + time * (3 + ring)) * effectLevel * 12 +
            Math.sin(angle * 5 + time * 4) * effectLevel * 4;
          const r = ringRadius + wobble;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${ringAlpha})`;
        ctx.lineWidth = 1.5 - ring * 0.3;
        ctx.stroke();
      }

      // Orbiting particles
      particlesRef.current.forEach((p) => {
        p.angle += p.speed * (1 + effectLevel * 2);
        const pRadius = p.radius * (1 + effectLevel * 0.4 + Math.sin(time * 2 + p.angle * 3) * 0.1);
        const px = cx + Math.cos(p.angle) * pRadius;
        const py = cy + Math.sin(p.angle) * pRadius;
        const pAlpha = p.alpha * (0.3 + effectLevel * 0.7);

        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 + effectLevel * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${pAlpha})`;
        ctx.fill();
      });

      // Core glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.4);
      coreGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 + effectLevel * 0.25})`);
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
  }, []); // Empty deps — props read from ref

  return (
    <div ref={ref} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
    </div>
  );
});

VoiceWaveform.displayName = "VoiceWaveform";

export default VoiceWaveform;
