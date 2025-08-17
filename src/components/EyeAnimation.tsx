import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type EyeVariant = "ironman" | "orion" | "minimal";

interface EyeAnimationProps {
  onAnimationComplete: () => void;
  variant?: EyeVariant;
  intensity?: number; // 0-1, controls glow intensity
}

const EyeAnimation = ({
  onAnimationComplete,
  variant = "ironman",
  intensity = 1,
}: EyeAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 100);

    const completeTimer = setTimeout(() => {
      onAnimationComplete();
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onAnimationComplete]);

  const eyeVariants = {
    hidden: { scaleY: 0, opacity: 0 },
    visible: { scaleY: 1, opacity: 1 },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const renderIronManEyes = () => (
    <div className="flex space-x-8">
      <motion.div
        variants={eyeVariants}
        initial="hidden"
        animate={showAnimation ? "visible" : "hidden"}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="w-24 h-12 bg-orion-stellar-gold rounded-full"
        style={{
          boxShadow: `0 0 ${20 * intensity}px hsl(var(--orion-stellar-gold) / ${0.6 * intensity}), 
                      0 0 ${40 * intensity}px hsl(var(--orion-stellar-gold) / ${0.3 * intensity})`,
        }}
      />
      <motion.div
        variants={eyeVariants}
        initial="hidden"
        animate={showAnimation ? "visible" : "hidden"}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
        className="w-24 h-12 bg-orion-stellar-gold rounded-full"
        style={{
          boxShadow: `0 0 ${20 * intensity}px hsl(var(--orion-stellar-gold) / ${0.6 * intensity}), 
                      0 0 ${40 * intensity}px hsl(var(--orion-stellar-gold) / ${0.3 * intensity})`,
        }}
      />
    </div>
  );

  const renderOrionEyes = () => (
    <div className="flex space-x-6">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          variants={eyeVariants}
          initial="hidden"
          animate={showAnimation ? "visible" : "hidden"}
          transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
          className="w-3 h-3 bg-orion-cosmic-blue rounded-full"
          style={{
            boxShadow: `0 0 ${10 * intensity}px hsl(var(--orion-cosmic-blue) / ${0.8 * intensity})`,
          }}
        />
      ))}
    </div>
  );

  const renderMinimalEyes = () => (
    <div className="flex space-x-4">
      <motion.div
        variants={eyeVariants}
        initial="hidden"
        animate={showAnimation ? "visible" : "hidden"}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-8 h-8 border-2 border-orion-accretion-disk rounded-full"
      />
      <motion.div
        variants={eyeVariants}
        initial="hidden"
        animate={showAnimation ? "visible" : "hidden"}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
        className="w-8 h-8 border-2 border-orion-accretion-disk rounded-full"
      />
    </div>
  );

  const getTitle = () => {
    switch (variant) {
      case "ironman":
        return "O.R.I.Ö.N";
      case "orion":
        return "O.R.I.Ö.N";
      default:
        return "AI";
    }
  };

  const getSubtitle = () => {
    switch (variant) {
      case "ironman":
        return "Sistema Inteligente de Assistência Virtual";
      case "orion":
        return "Orbital Research Intelligence Network";
      default:
        return "Assistant";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-orion-void">
        <div className="relative text-center">
          {/* Eyes */}
          <div className="mb-8">
            {variant === "ironman" && renderIronManEyes()}
            {variant === "orion" && renderOrionEyes()}
            {variant === "minimal" && renderMinimalEyes()}
          </div>

          {/* Title */}
          <motion.h1
            variants={textVariants}
            initial="hidden"
            animate={showAnimation ? "visible" : "hidden"}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            className="text-4xl font-bold text-orion-stellar-gold tracking-widest stellar-text"
          >
            {getTitle()}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={textVariants}
            initial="hidden"
            animate={showAnimation ? "visible" : "hidden"}
            transition={{ duration: 1, ease: "easeOut", delay: 2 }}
            className="text-orion-accretion-disk mt-2 text-sm tracking-wide"
          >
            {getSubtitle()}
          </motion.p>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default EyeAnimation;