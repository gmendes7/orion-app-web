import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface HexagonProps {
  x: number;
  y: number;
  delay: number;
  isActive: boolean;
}

const Hexagon = ({ x, y, delay, isActive }: HexagonProps) => (
  <motion.div
    className={`absolute w-16 h-16 ${isActive ? 'opacity-100' : 'opacity-20'}`}
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: isActive ? [0.2, 1, 0.2] : 0.1, 
      scale: isActive ? [0.8, 1.2, 0.8] : 1,
      rotate: isActive ? [0, 360] : 0
    }}
    transition={{
      duration: isActive ? 3 : 0.5,
      delay,
      repeat: isActive ? Infinity : 0,
      ease: "easeInOut"
    }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <polygon
        points="50,5 85,25 85,75 50,95 15,75 15,25"
        fill="none"
        stroke={isActive ? "hsl(var(--orion-stellar-gold))" : "hsl(var(--orion-cosmic-blue))"}
        strokeWidth="2"
        className={isActive ? "drop-shadow-[0_0_10px_hsl(var(--orion-stellar-gold))]" : ""}
      />
      {isActive && (
        <polygon
          points="50,5 85,25 85,75 50,95 15,75 15,25"
          fill="hsl(var(--orion-stellar-gold) / 0.1)"
          className="animate-pulse"
        />
      )}
    </svg>
  </motion.div>
);

export const HexagonBackground = () => {
  const [activeHexagons, setActiveHexagons] = useState<Set<number>>(new Set());
  const hexagonCount = 20;

  useEffect(() => {
    const interval = setInterval(() => {
      const newActive = new Set<number>();
      // Ativar 2-4 hexágonos aleatórios
      const count = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < count; i++) {
        newActive.add(Math.floor(Math.random() * hexagonCount));
      }
      setActiveHexagons(newActive);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const hexagons = Array.from({ length: hexagonCount }, (_, i) => ({
    id: i,
    x: Math.random() * (window.innerWidth - 64),
    y: Math.random() * (window.innerHeight - 64),
    delay: Math.random() * 2
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {hexagons.map((hex) => (
        <Hexagon
          key={hex.id}
          x={hex.x}
          y={hex.y}
          delay={hex.delay}
          isActive={activeHexagons.has(hex.id)}
        />
      ))}
    </div>
  );
};