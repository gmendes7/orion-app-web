/**
 * ✨ ParticleField - Campo de Partículas Dinâmico
 * 
 * Background animado com partículas que reagem ao estado da IA.
 * Efeito cinematográfico e imersivo.
 */

import { useCallback, useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface ParticleFieldProps {
  intensity?: number; // 0-1
  color?: string;
  particleCount?: number;
  className?: string;
}

export const ParticleField = ({
  intensity = 0.5,
  color = "255, 200, 50", // RGB dourado
  particleCount = 100,
  className = "",
}: ParticleFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  const createParticle = useCallback((width: number, height: number): Particle => {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      color: color,
    };
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Recriar partículas ao redimensionar
      particlesRef.current = Array.from(
        { length: particleCount },
        () => createParticle(canvas.width, canvas.height)
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Limpar com fade para trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);

      particlesRef.current.forEach((particle, i) => {
        // Atração suave ao mouse
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          particle.vx += (dx / dist) * 0.02 * intensity;
          particle.vy += (dy / dist) * 0.02 * intensity;
        }

        // Atualizar posição
        particle.x += particle.vx * (1 + intensity);
        particle.y += particle.vy * (1 + intensity);

        // Fricção
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Wrap around
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Desenhar partícula
        const alpha = particle.alpha * (0.5 + intensity * 0.5);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (1 + intensity * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particle.color}, ${alpha})`;
        ctx.fill();

        // Conectar partículas próximas
        particlesRef.current.slice(i + 1).forEach((other) => {
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100 * intensity) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(${particle.color}, ${0.1 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [intensity, color, particleCount, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ background: "transparent" }}
    />
  );
};

export default ParticleField;
