import { useEffect, useState } from "react";

interface OrionEyeAnimationProps {
  onAnimationComplete: () => void;
}

const OrionEyeAnimation = ({ onAnimationComplete }: OrionEyeAnimationProps) => {
  const [showConstellation, setShowConstellation] = useState(false);

  useEffect(() => {
    // Start constellation animation after component mounts
    const timer = setTimeout(() => {
      setShowConstellation(true);
    }, 500);

    // Complete animation after 4 seconds
    const completeTimer = setTimeout(() => {
      onAnimationComplete();
    }, 4500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-orion-void">
      <div className="relative flex flex-col items-center">
        {/* Constellation Pattern */}
        <div className="relative mb-8">
          <div
            className={`flex flex-col items-center space-y-4 ${
              showConstellation ? "animate-orion-constellation" : "opacity-0"
            }`}
          >
            {/* Orion's Belt - 3 stars */}
            <div className="flex space-x-6">
              <div className="w-4 h-4 bg-orion-cosmic-blue rounded-full cosmic-glow" />
              <div className="w-3 h-3 bg-orion-accretion-disk rounded-full cosmic-glow" />
              <div className="w-4 h-4 bg-orion-energy-burst rounded-full cosmic-glow" />
            </div>
            
            {/* Upper stars */}
            <div className="flex space-x-12">
              <div className="w-3 h-3 bg-orion-stellar-gold rounded-full cosmic-glow" />
              <div className="w-2 h-2 bg-orion-cosmic-blue rounded-full cosmic-glow" />
            </div>
            
            {/* Lower stars */}
            <div className="flex space-x-8">
              <div className="w-2 h-2 bg-orion-accretion-disk rounded-full cosmic-glow" />
              <div className="w-3 h-3 bg-orion-energy-burst rounded-full cosmic-glow" />
              <div className="w-2 h-2 bg-orion-stellar-gold rounded-full cosmic-glow" />
            </div>
          </div>
        </div>

        {/* O.R.I.Ö.N Text */}
        <div className="text-center">
          <h1
            className={`text-6xl font-bold text-orion-stellar-gold tracking-widest ${
              showConstellation ? "stellar-text" : "opacity-0"
            }`}
            style={{
              fontFamily: 'Orbitron, monospace',
              animationDelay: "2s",
            }}
          >
            O.R.I.Ö.N
          </h1>
          <p
            className={`text-foreground mt-4 text-lg tracking-wide ${
              showConstellation ? "opacity-100 transition-opacity duration-1000" : "opacity-0"
            }`}
            style={{
              animationDelay: "2.5s",
            }}
          >
            Orbital Reconnaissance Intelligence Ödyssey Network
          </p>
          <div
            className={`mt-6 flex justify-center space-x-2 ${
              showConstellation ? "opacity-100 transition-opacity duration-1000" : "opacity-0"
            }`}
            style={{
              animationDelay: "3s",
            }}
          >
            <div className="w-2 h-2 bg-orion-accretion-disk rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-orion-cosmic-blue rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 bg-orion-energy-burst rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrionEyeAnimation;