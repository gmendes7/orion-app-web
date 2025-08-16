import { useEffect, useState } from "react";

interface JarvisEyeAnimationProps {
  onAnimationComplete: () => void;
}

const JarvisEyeAnimation = ({
  onAnimationComplete,
}: JarvisEyeAnimationProps) => {
  const [showEyes, setShowEyes] = useState(false);

  useEffect(() => {
    // Start eye animation after component mounts
    const timer = setTimeout(() => {
      setShowEyes(true);
    }, 500);

    // Complete animation after 3 seconds
    const completeTimer = setTimeout(() => {
      onAnimationComplete();
    }, 3500);

    return () => {
      clearTimeout(timer);

      clearTimeout(completeTimer);
    };
  }, [onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-jarvis-deep-black">
      <div className="relative">
        {/* Left Eye */}
        <div className="flex space-x-8">
          <div
            className={`w-24 h-12 bg-jarvis-gold rounded-full ${
              showEyes ? "animate-jarvis-eye-open" : "opacity-0"
            } jarvis-glow`}
            style={{
              clipPath: showEyes
                ? "ellipse(100% 100% at center)"
                : "ellipse(100% 0% at center)",
              transition: "clip-path 2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          {/* Right Eye */}
          <div
            className={`w-24 h-12 bg-jarvis-gold rounded-full ${
              showEyes ? "animate-jarvis-eye-open" : "opacity-0"
            } jarvis-glow`}
            style={{
              clipPath: showEyes
                ? "ellipse(100% 100% at center)"
                : "ellipse(100% 0% at center)",
              transition: "clip-path 2s cubic-bezier(0.4, 0, 0.2, 1)",
              animationDelay: "0.1s",
            }}
          />
        </div>

        {/* JARVIS Text */}
        <div className="mt-8 text-center">
          <h1
            className={`text-4xl font-bold text-jarvis-gold tracking-widest ${
              showEyes
                ? "animate-jarvis-text-appear jarvis-text-glow"
                : "opacity-0"
            }`}
            style={{
              animationDelay: "0.5s",
            }}
          >
            J.A.R.V.I.S
          </h1>
          <p
            className={`text-jarvis-gold-light mt-2 text-sm tracking-wide ${
              showEyes ? "animate-jarvis-text-appear" : "opacity-0"
            }`}
            style={{
              animationDelay: "2s",
            }}
          >
            Sistema Inteligente de Assistência Virtual
          </p>
        </div>
      </div>
    </div>
  );
};

export default JarvisEyeAnimation;
