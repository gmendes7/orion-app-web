/**
 * ✨ ParticleField - Campo de Partículas Dinâmico
 * 
 * Background animado com partículas que reagem ao estado da IA.
 * Otimizado: sem O(n²) connections, throttled mouse, DPR-aware.
 */

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface ParticleFieldProps {
  intensity?: number;
  color?: string;
  particleCount?: number;
  className?: string;
}

export const ParticleField = ({
  intensity = 0.5,
  color = "255, 200, 50",
  particleCount = 80,
  className = "",
}: ParticleFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const propsRef = useRef({ intensity, color });
  propsRef.current = { intensity, color };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Recreate particles
      const w = window.innerWidth;
      const h = window.innerHeight;
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      }));
    };

    let lastMouse = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMouse < 50) return; // Throttle to 20fps
      lastMouse = now;
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const draw = () => {
      const { intensity: int, color: col } = propsRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particlesRef.current) {
        // Mouse attraction
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          p.vx += (dx / dist) * 0.02 * int;
          p.vy += (dy / dist) * 0.02 * int;
        }

        p.x += p.vx * (1 + int);
        p.y += p.vy * (1 + int);
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap
        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        const alpha = p.alpha * (0.5 + int * 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + int * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col}, ${alpha})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particleCount]); // Only recreate on count change

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ background: "transparent" }}
    />
  );
};

export default ParticleField;
