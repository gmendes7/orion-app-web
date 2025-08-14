import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';

// Mini Saturno component
const MiniSaturn = ({ position }: { position: [number, number, number] }) => {
  const saturnRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (saturnRef.current) {
      saturnRef.current.rotation.y += 0.005;
      saturnRef.current.rotation.z += 0.002;
    }
  });

  return (
    <group ref={saturnRef} position={position}>
      {/* Planeta */}
      <Sphere args={[0.3, 16, 16]}>
        <meshStandardMaterial 
          color="#FF8C42" 
          emissive="#FF6B1A" 
          emissiveIntensity={0.2}
        />
      </Sphere>
      
      {/* Anéis */}
      <Torus args={[0.5, 0.05, 8, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial 
          color="#FFB366" 
          transparent 
          opacity={0.7}
          emissive="#FF8C42"
          emissiveIntensity={0.1}
        />
      </Torus>
      <Torus args={[0.7, 0.03, 8, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial 
          color="#FF9F59" 
          transparent 
          opacity={0.5}
          emissive="#FF8C42"
          emissiveIntensity={0.1}
        />
      </Torus>
    </group>
  );
};

// Partículas estelares
const StarField = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  useEffect(() => {
    if (pointsRef.current) {
      const positions = new Float32Array(200 * 3);
      for (let i = 0; i < 200; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
      pointsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial 
        color="#00B4FF" 
        size={0.02} 
        transparent 
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
};

const SpaceBackground = () => {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} color="#00B4FF" />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#FF8C42" />
        <pointLight position={[-10, -10, 5]} intensity={0.3} color="#6A00FF" />
        
        {/* Componentes espaciais */}
        <StarField />
        <MiniSaturn position={[-4, 2, -3]} />
        <MiniSaturn position={[3, -1, -4]} />
        <MiniSaturn position={[-2, -3, -2]} />
        <MiniSaturn position={[4, 2, -5]} />
      </Canvas>
    </div>
  );
};

export default SpaceBackground;