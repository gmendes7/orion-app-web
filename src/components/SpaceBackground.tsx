import { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Torus } from '@react-three/drei';
import type { OrionState } from '@/components/orion/OrionEye';
import * as THREE from 'three';

// Uses OrionState from OrionEye

// Mouse tracker component
const MouseTracker = ({ mouseRef }: { mouseRef: React.MutableRefObject<THREE.Vector2> }) => {
  const { size } = useThree();
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / size.width) * 2 - 1;
      mouseRef.current.y = -(e.clientY / size.height) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [size, mouseRef]);

  return null;
};

// Mini Saturno component
const MiniSaturn = ({ position, orionState }: { position: [number, number, number]; orionState: OrionState }) => {
  const saturnRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (!saturnRef.current) return;
    const speed = orionState === "thinking" ? 0.02 : orionState === "speaking" ? 0.01 : 0.005;
    saturnRef.current.rotation.y += speed;
    saturnRef.current.rotation.z += speed * 0.4;
  });

  const emissiveIntensity = orionState === "listening" ? 0.8 : orionState === "thinking" ? 0.6 : 0.4;

  return (
    <group ref={saturnRef} position={position}>
      <Sphere args={[0.3, 16, 16]}>
        <meshStandardMaterial 
          color="hsl(54, 100%, 50%)" 
          emissive="hsl(54, 100%, 45%)" 
          emissiveIntensity={emissiveIntensity}
        />
      </Sphere>
      <Torus args={[0.5, 0.05, 8, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial 
          color="hsl(48, 100%, 55%)" 
          transparent 
          opacity={0.8}
          emissive="hsl(54, 100%, 50%)"
          emissiveIntensity={emissiveIntensity * 0.75}
        />
      </Torus>
      <Torus args={[0.7, 0.03, 8, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial 
          color="hsl(60, 100%, 60%)" 
          transparent 
          opacity={0.6}
          emissive="hsl(54, 100%, 50%)"
          emissiveIntensity={emissiveIntensity * 0.5}
        />
      </Torus>
    </group>
  );
};

// Interactive star field
const StarField = ({ mouseRef, orionState }: { mouseRef: React.MutableRefObject<THREE.Vector2>; orionState: OrionState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 300;

  const basePositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  const baseSizes = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      arr[i] = Math.random() * 0.03 + 0.01;
    }
    return arr;
  }, []);

  useEffect(() => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    geo.setAttribute('position', new THREE.BufferAttribute(basePositions.slice(), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(baseSizes.slice(), 1));
  }, [basePositions, baseSizes]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    if (!pos) return;

    const mx = mouseRef.current.x * 5;
    const my = mouseRef.current.y * 5;

    // State-based parameters
    const stateMultiplier = orionState === "thinking" ? 2.5 : orionState === "speaking" ? 1.8 : orionState === "listening" ? 1.5 : 1;
    const repelStrength = 0.3 * stateMultiplier;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;

      // Base slow rotation
      const bx = basePositions[ix];
      const by = basePositions[iy];
      const bz = basePositions[i * 3 + 2];

      // Mouse repulsion in XY
      const dx = pos.array[ix] - mx;
      const dy = pos.array[iy] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 3) {
        const force = (1 - dist / 3) * repelStrength * delta * 60;
        (pos.array as Float32Array)[ix] += (dx / dist) * force;
        (pos.array as Float32Array)[iy] += (dy / dist) * force;
      }

      // Spring back to base position
      const spring = 0.02 * delta * 60;
      (pos.array as Float32Array)[ix] += (bx - pos.array[ix]) * spring;
      (pos.array as Float32Array)[iy] += (by - pos.array[iy]) * spring;
      (pos.array as Float32Array)[i * 3 + 2] += (bz - pos.array[i * 3 + 2]) * spring;
    }

    pos.needsUpdate = true;

    // Slow global rotation
    pointsRef.current.rotation.y += 0.0005 * stateMultiplier;
  });

  const starColor = orionState === "thinking" ? "hsl(40, 100%, 60%)" : orionState === "listening" ? "hsl(54, 100%, 70%)" : "hsl(54, 100%, 50%)";
  const starSize = orionState === "thinking" ? 0.035 : orionState === "speaking" ? 0.03 : 0.02;

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial 
        color={starColor}
        size={starSize}
        transparent 
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
};

interface SpaceBackgroundProps {
  orionState?: OrionState;
}

const SpaceBackground = ({ orionState = "idle" }: SpaceBackgroundProps) => {
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <MouseTracker mouseRef={mouseRef} />

        <ambientLight intensity={0.3} color="hsl(54, 100%, 50%)" />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="hsl(54, 100%, 50%)" />
        <pointLight position={[-10, -10, 5]} intensity={0.5} color="hsl(48, 100%, 50%)" />
        <pointLight position={[0, 0, 0]} intensity={0.6} color="hsl(60, 100%, 55%)" />
        
        <StarField mouseRef={mouseRef} orionState={orionState} />
        <MiniSaturn position={[-4, 2, -3]} orionState={orionState} />
        <MiniSaturn position={[3, -1, -4]} orionState={orionState} />
        <MiniSaturn position={[-2, -3, -2]} orionState={orionState} />
        <MiniSaturn position={[4, 2, -5]} orionState={orionState} />
      </Canvas>
    </div>
  );
};

export default SpaceBackground;
