/**
 * 👁️ OrionEye - O Olho Central da ORION
 * 
 * Componente visual principal que representa a consciência da IA.
 * Reage a: voz, estado da IA, som ambiente, interações.
 * 
 * Estados visuais:
 * - idle: Pulsação suave, aguardando
 * - listening: Amarelo intenso, escuta ativa
 * - thinking: Laranja, processamento
 * - speaking: Amarelo dourado, comunicando
 * - analyzing: Vermelho/laranja, análise profunda
 * - alert: Pulso de alerta, sugestão importante
 */

import { motion, useAnimation, Variants } from "framer-motion";
import { useEffect, useMemo } from "react";

export type OrionState = 
  | "idle" 
  | "listening" 
  | "thinking" 
  | "speaking" 
  | "analyzing" 
  | "alert";

interface OrionEyeProps {
  state: OrionState;
  audioLevel?: number; // 0-1, nível de áudio para reatividade
  onClick?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-32 h-32",
  md: "w-48 h-48",
  lg: "w-64 h-64",
  xl: "w-80 h-80",
};

// Cores por estado (HSL para consistência com tema)
const stateColors = {
  idle: {
    primary: "hsl(45, 100%, 50%)",      // Dourado
    glow: "hsl(45, 100%, 60%)",
    ring: "hsl(45, 80%, 40%)",
  },
  listening: {
    primary: "hsl(50, 100%, 55%)",      // Amarelo intenso
    glow: "hsl(50, 100%, 70%)",
    ring: "hsl(50, 90%, 45%)",
  },
  thinking: {
    primary: "hsl(30, 100%, 50%)",      // Laranja
    glow: "hsl(30, 100%, 60%)",
    ring: "hsl(30, 80%, 40%)",
  },
  speaking: {
    primary: "hsl(45, 100%, 55%)",      // Dourado brilhante
    glow: "hsl(45, 100%, 70%)",
    ring: "hsl(45, 90%, 50%)",
  },
  analyzing: {
    primary: "hsl(15, 100%, 50%)",      // Laranja-vermelho
    glow: "hsl(15, 100%, 60%)",
    ring: "hsl(15, 80%, 40%)",
  },
  alert: {
    primary: "hsl(0, 100%, 50%)",       // Vermelho alerta
    glow: "hsl(0, 100%, 60%)",
    ring: "hsl(0, 80%, 40%)",
  },
};

// Animações do núcleo
const coreVariants: Variants = {
  idle: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  listening: {
    scale: [1, 1.15, 1],
    opacity: 1,
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  thinking: {
    scale: [1, 1.08, 1],
    rotate: [0, 5, -5, 0],
    opacity: [0.9, 1, 0.9],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  speaking: {
    scale: [1, 1.12, 1.05, 1.12, 1],
    opacity: 1,
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  analyzing: {
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  alert: {
    scale: [1, 1.3, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 0.3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Animações do anel externo
const ringVariants: Variants = {
  idle: {
    rotate: 360,
    opacity: 0.4,
    transition: {
      rotate: {
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      },
    },
  },
  listening: {
    rotate: 360,
    opacity: 0.8,
    scale: [1, 1.05, 1],
    transition: {
      rotate: {
        duration: 8,
        repeat: Infinity,
        ease: "linear",
      },
      scale: {
        duration: 0.5,
        repeat: Infinity,
      },
    },
  },
  thinking: {
    rotate: 360,
    opacity: 0.6,
    transition: {
      rotate: {
        duration: 4,
        repeat: Infinity,
        ease: "linear",
      },
    },
  },
  speaking: {
    rotate: 360,
    opacity: 0.9,
    scale: [1, 1.08, 1],
    transition: {
      rotate: {
        duration: 6,
        repeat: Infinity,
        ease: "linear",
      },
      scale: {
        duration: 0.4,
        repeat: Infinity,
      },
    },
  },
  analyzing: {
    rotate: [0, 360],
    opacity: [0.5, 1, 0.5],
    transition: {
      rotate: {
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      },
      opacity: {
        duration: 0.5,
        repeat: Infinity,
      },
    },
  },
  alert: {
    rotate: 360,
    opacity: [0.3, 1, 0.3],
    scale: [1, 1.15, 1],
    transition: {
      rotate: {
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      },
      opacity: {
        duration: 0.2,
        repeat: Infinity,
      },
      scale: {
        duration: 0.3,
        repeat: Infinity,
      },
    },
  },
};

export const OrionEye = ({ 
  state = "idle", 
  audioLevel = 0, 
  onClick,
  size = "lg" 
}: OrionEyeProps) => {
  const controls = useAnimation();
  const colors = stateColors[state];

  // Atualiza animação quando estado muda
  useEffect(() => {
    controls.start(state);
  }, [state, controls]);

  // Escala adicional baseada no nível de áudio
  const audioScale = useMemo(() => {
    return 1 + (audioLevel * 0.2);
  }, [audioLevel]);

  return (
    <div 
      className={`relative ${sizeClasses[size]} cursor-pointer select-none`}
      onClick={onClick}
    >
      {/* Glow de fundo */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ backgroundColor: colors.glow }}
        animate={{
          opacity: state === "idle" ? [0.1, 0.3, 0.1] : [0.2, 0.5, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: state === "alert" ? 0.5 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Partículas orbitando */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: colors.primary,
              top: "50%",
              left: "50%",
            }}
            animate={{
              rotate: 360,
              x: [0, Math.cos((i * Math.PI) / 4) * 60, 0],
              y: [0, Math.sin((i * Math.PI) / 4) * 60, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Anel externo segmentado */}
      <motion.div
        className="absolute inset-2"
        variants={ringVariants}
        animate={state}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id={`ring-gradient-${state}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.ring} stopOpacity="0.8" />
              <stop offset="50%" stopColor={colors.primary} stopOpacity="1" />
              <stop offset="100%" stopColor={colors.ring} stopOpacity="0.8" />
            </linearGradient>
          </defs>
          {/* Arcos segmentados */}
          {[0, 90, 180, 270].map((rotation, i) => (
            <motion.path
              key={i}
              d="M 50 5 A 45 45 0 0 1 95 50"
              fill="none"
              stroke={`url(#ring-gradient-${state})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                transformOrigin: "center",
                transform: `rotate(${rotation}deg)`,
              }}
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </svg>
      </motion.div>

      {/* Anel interno pulsante */}
      <motion.div
        className="absolute inset-6 rounded-full border-2"
        style={{ 
          borderColor: colors.primary,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
        animate={{
          scale: [1, 1.05 * audioScale, 1],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: state === "speaking" ? 0.3 : 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Núcleo central - O "Olho" */}
      <motion.div
        className="absolute inset-10 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${colors.glow}, ${colors.primary}, ${colors.ring})`,
          boxShadow: `
            0 0 30px ${colors.primary},
            0 0 60px ${colors.glow},
            inset 0 0 30px rgba(0,0,0,0.5)
          `,
        }}
        variants={coreVariants}
        animate={state}
      >
        {/* Reflexo */}
        <motion.div
          className="absolute top-3 left-3 w-4 h-4 rounded-full bg-white/40 blur-sm"
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />

        {/* Pupila central */}
        <motion.div
          className="absolute inset-0 m-auto w-1/3 h-1/3 rounded-full bg-black/80"
          animate={{
            scale: state === "analyzing" ? [1, 0.5, 1] : [1, 0.8, 1],
          }}
          transition={{
            duration: state === "analyzing" ? 0.5 : 2,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* Linhas de energia */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.line
            key={i}
            x1="50%"
            y1="50%"
            x2={`${50 + Math.cos((i * Math.PI) / 3) * 50}%`}
            y2={`${50 + Math.sin((i * Math.PI) / 3) * 50}%`}
            stroke={colors.primary}
            strokeWidth="0.5"
            animate={{
              opacity: [0, 0.5, 0],
              pathLength: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      {/* Indicador de estado (texto) */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-mono uppercase tracking-widest"
        style={{ color: colors.primary }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {state === "idle" && "ONLINE"}
        {state === "listening" && "OUVINDO"}
        {state === "thinking" && "PROCESSANDO"}
        {state === "speaking" && "FALANDO"}
        {state === "analyzing" && "ANALISANDO"}
        {state === "alert" && "ALERTA"}
      </motion.div>
    </div>
  );
};

export default OrionEye;
