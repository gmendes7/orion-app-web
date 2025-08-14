import { useState } from "react";
import OrionEyeAnimation from "@/components/OrionEyeAnimation";
import OrionChat from "@/components/OrionChat";
import SpaceBackground from "@/components/SpaceBackground";
import LanternEffect from "@/components/LanternEffect";

const Index = () => {
  const [showAnimation, setShowAnimation] = useState(true);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

  return (
    <div className="min-h-screen bg-orion-deep-space relative overflow-hidden">
      {/* Fundo espacial */}
      <SpaceBackground />
      
      {/* Efeito lanterna */}
      <LanternEffect />
      
      {showAnimation ? (
        <OrionEyeAnimation onAnimationComplete={handleAnimationComplete} />
      ) : (
        <div className="relative z-10">
          <OrionChat />
        </div>
      )}
    </div>
  );
};

export default Index;
