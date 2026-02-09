/**
 * 📊 StatusIndicator - Indicadores de Estado ORION
 * 
 * Exibe informações de status de forma minimalista e futurista.
 */

import { motion } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  Volume2, 
  VolumeX,
  Wifi,
  WifiOff,
  Brain,
  Zap
} from "lucide-react";
import { OrionState } from "./OrionEye";

interface StatusIndicatorProps {
  state: OrionState;
  isListening: boolean;
  isCameraActive: boolean;
  isAudioEnabled: boolean;
  isConnected: boolean;
  memoryCount?: number;
  compact?: boolean;
  className?: string;
}

export const StatusIndicator = ({
  state,
  isListening,
  isCameraActive,
  isAudioEnabled,
  isConnected,
  memoryCount = 0,
  compact = false,
  className = "",
}: StatusIndicatorProps) => {
  const indicators = [
    {
      icon: isListening ? Mic : MicOff,
      active: isListening,
      label: "MIC",
    },
    {
      icon: isCameraActive ? Camera : CameraOff,
      active: isCameraActive,
      label: "CAM",
    },
    {
      icon: isAudioEnabled ? Volume2 : VolumeX,
      active: isAudioEnabled,
      label: "VOZ",
    },
    {
      icon: isConnected ? Wifi : WifiOff,
      active: isConnected,
      label: "NET",
    },
  ];

  // In compact mode (mobile), only show active indicators + state
  const visibleIndicators = compact
    ? indicators.filter(({ active }) => active)
    : indicators;

  return (
    <div className={`flex items-center gap-2 md:gap-4 ${className}`}>
      {/* System indicators */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {visibleIndicators.map(({ icon: Icon, active, label }) => (
          <motion.div
            key={label}
            className="flex flex-col items-center gap-0.5 md:gap-1"
            animate={{ opacity: active ? 1 : 0.3 }}
          >
            <motion.div
              className={`p-1.5 md:p-2 rounded-lg backdrop-blur-sm ${
                active 
                  ? "bg-orion-stellar-gold/20 text-orion-stellar-gold" 
                  : "bg-muted/20 text-muted-foreground"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </motion.div>
            {!compact && (
              <span className="text-[10px] font-mono tracking-wider text-muted-foreground">
                {label}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Separator - hidden on mobile */}
      {!compact && (
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-orion-stellar-gold/30 to-transparent" />
      )}

      {/* Memory - simplified on mobile */}
      <motion.div
        className="flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-orion-stellar-gold/10 backdrop-blur-sm"
        animate={{
          boxShadow: state === "thinking" 
            ? ["0 0 10px rgba(255,200,50,0.2)", "0 0 20px rgba(255,200,50,0.4)", "0 0 10px rgba(255,200,50,0.2)"]
            : "none",
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Brain className="w-3.5 h-3.5 md:w-4 md:h-4 text-orion-stellar-gold" />
        <span className="text-[11px] md:text-xs font-mono text-orion-stellar-gold">
          {memoryCount}
        </span>
      </motion.div>

      {/* State - hidden on compact */}
      {!compact && (
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-4 h-4 text-orion-stellar-gold" />
          <span className="text-xs font-mono text-orion-stellar-gold uppercase">
            {state}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default StatusIndicator;
