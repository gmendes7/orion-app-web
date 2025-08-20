import { useEffect, useState } from 'react';

const LanternEffect = () => {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
      setIsActive(true);
    };

    const handleMouseLeave = () => {
      setIsActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Enhanced Lantern Effect */}
      <div 
        className={`orion-lantern transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}
        style={{
          '--mouse-x': `${mousePosition.x}%`,
          '--mouse-y': `${mousePosition.y}%`,
          background: `radial-gradient(circle 400px at ${mousePosition.x}% ${mousePosition.y}%, 
            hsla(45, 100%, 50%, 0.15) 0%, 
            hsla(25, 95%, 53%, 0.1) 20%, 
            hsla(20, 85%, 45%, 0.05) 40%, 
            transparent 70%)`,
        } as React.CSSProperties}
      />
      
      {/* Secondary glow effect */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle 800px at ${mousePosition.x}% ${mousePosition.y}%, 
            hsla(45, 100%, 50%, 0.03) 0%, 
            transparent 50%)`,
          opacity: isActive ? 1 : 0.3,
        }}
      />
    </>
  );
};

export default LanternEffect;