import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface RoboticEyeAnimationProps {
  onAnimationComplete: () => void;
}

const RoboticEyeAnimation = ({ onAnimationComplete }: RoboticEyeAnimationProps) => {
  const [showEyes, setShowEyes] = useState(false);
  const [showHUD, setShowHUD] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Sequence the animation
    const timer1 = setTimeout(() => setShowEyes(true), 500);
    const timer2 = setTimeout(() => setShowHUD(true), 1500);
    const timer3 = setTimeout(() => setShowText(true), 2500);
    const timer4 = setTimeout(() => onAnimationComplete(), 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onAnimationComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center black-hole-bg"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Background Black Hole Effect */}
      <div className="absolute inset-0 black-hole-bg opacity-90" />
      
      {/* Robotic Eyes */}
      <div className="relative z-10 flex items-center justify-center gap-16">
        {/* Left Eye */}
        <div 
          className={`w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent border-2 border-primary/50 
            ${showEyes ? 'robotic-eye' : 'opacity-0'}`}
          style={{
            boxShadow: showEyes ? 'var(--glow-gold), inset 0 0 20px hsl(var(--orion-stellar-gold) / 0.3)' : 'none',
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-radial from-primary/30 to-transparent" />
        </div>

        {/* Right Eye */}
        <div 
          className={`w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent border-2 border-primary/50 
            ${showEyes ? 'robotic-eye' : 'opacity-0'}`}
          style={{
            boxShadow: showEyes ? 'var(--glow-gold), inset 0 0 20px hsl(var(--orion-stellar-gold) / 0.3)' : 'none',
            animationDelay: '0.3s'
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-radial from-primary/30 to-transparent" />
        </div>
      </div>

      {/* HUD Elements */}
      {showHUD && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Top HUD */}
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 hud-element">
            <div className="flex items-center gap-4 text-primary font-mono text-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>SISTEMA ORBITAL INICIANDO...</span>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
          </div>

          {/* Left HUD */}
          <div className="absolute left-10 top-1/2 transform -translate-y-1/2 hud-element" style={{ animationDelay: '0.5s' }}>
            <div className="space-y-2 text-primary/70 font-mono text-xs">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-accent rounded-full" />
                <span>RECONHECIMENTO ORBITAL: ATIVO</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-accent rounded-full" />
                <span>INTELIGÊNCIA ADAPTIVA: ONLINE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-accent rounded-full" />
                <span>REDE NEURAL: CARREGANDO</span>
              </div>
            </div>
          </div>

          {/* Right HUD */}
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2 hud-element" style={{ animationDelay: '0.7s' }}>
            <div className="space-y-2 text-primary/70 font-mono text-xs text-right">
              <div className="flex items-center gap-2 justify-end">
                <span>STATUS: INICIALIZANDO</span>
                <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span>PROTOCOLOS: CARREGADOS</span>
                <div className="w-1 h-1 bg-accent rounded-full" />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span>CONEXÃO: ESTABELECIDA</span>
                <div className="w-1 h-1 bg-accent rounded-full" />
              </div>
            </div>
          </div>

          {/* Bottom Progress */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 hud-element" style={{ animationDelay: '1s' }}>
            <div className="w-80 h-1 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, delay: 1 }}
              />
            </div>
            <p className="text-center text-primary/70 font-mono text-xs mt-2">
              INICIANDO SISTEMAS ORBITAIS...
            </p>
          </div>
        </div>
      )}

      {/* Main Text */}
      {showText && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-4 stellar-text"
            style={{
              fontFamily: "'Orbitron', monospace",
              textShadow: 'var(--glow-gold)',
              background: 'linear-gradient(135deg, hsl(var(--orion-stellar-gold)), hsl(var(--orion-accretion-disk)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            O.R.I.Ö.N
          </motion.h1>
          
          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Orbital Reconnaissance Intelligence Network
          </motion.p>

          {/* Pulse dots */}
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-primary rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                style={{ boxShadow: 'var(--glow-gold)' }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RoboticEyeAnimation;