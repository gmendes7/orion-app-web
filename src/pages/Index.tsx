import { useState } from "react";
import JarvisEyeAnimation from "@/components/JarvisEyeAnimation";
import JarvisChat from "@/components/JarvisChat";

const Index = () => {
  const [showAnimation, setShowAnimation] = useState(true);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

  return (
    <div className="min-h-screen bg-jarvis-deep-black">
      {showAnimation ? (
        <JarvisEyeAnimation onAnimationComplete={handleAnimationComplete} />
      ) : (
        <JarvisChat />
      )}
    </div>
  );
};

export default Index;
