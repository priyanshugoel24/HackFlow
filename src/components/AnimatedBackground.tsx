"use client";

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import FallbackBackground from './FallbackBackground';

function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  
  // Generate random positions for particles with improved distribution
  const positions = useMemo(() => {
    const positions = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      // Create a more natural distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = Math.random() * 8 + 2;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.05;
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <Points ref={ref} positions={positions}>
      <PointMaterial 
        size={0.008} 
        color="#3b82f6" 
        transparent 
        opacity={0.4}
        sizeAttenuation={true}
      />
    </Points>
  );
}

function FloatingOrbs() {
  const orbsRef = useRef<THREE.Group>(null);
  const orbPositions = useMemo(() => {
    return [...Array(8)].map(() => ({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8,
      z: (Math.random() - 0.5) * 8,
      speed: Math.random() * 0.5 + 0.2,
      size: Math.random() * 0.08 + 0.05,
      color: Math.random() > 0.5 ? "#6366f1" : "#8b5cf6"
    }));
  }, []);

  useFrame((state) => {
    if (orbsRef.current) {
      orbsRef.current.children.forEach((child, index) => {
        const orb = orbPositions[index];
        child.position.y = orb.y + Math.sin(state.clock.elapsedTime * orb.speed + index) * 0.8;
        child.position.x = orb.x + Math.cos(state.clock.elapsedTime * orb.speed * 0.7 + index) * 0.5;
        child.rotation.x = state.clock.elapsedTime * 0.1;
        child.rotation.z = state.clock.elapsedTime * 0.05;
      });
    }
  });

  return (
    <group ref={orbsRef}>
      {orbPositions.map((orb, i) => (
        <mesh key={i} position={[orb.x, orb.y, orb.z]}>
          <sphereGeometry args={[orb.size, 16, 16]} />
          <meshStandardMaterial 
            color={orb.color} 
            transparent 
            opacity={0.25}
            emissive={orb.color}
            emissiveIntensity={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

function WaveField() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.02;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -2, -3]}>
      <planeGeometry args={[15, 15, 64, 64]} />
      <meshStandardMaterial 
        color="#3b82f6" 
        transparent 
        opacity={0.05}
        wireframe
      />
    </mesh>
  );
}

function ThreeJSScene() {
  return (
    <Canvas 
      camera={{ position: [0, 0, 8], fov: 60 }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, 10]} intensity={0.3} color="#8b5cf6" />
      <ParticleField />
      <FloatingOrbs />
      <WaveField />
    </Canvas>
  );
}

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Suspense fallback={<FallbackBackground />}>
        <ThreeJSScene />
      </Suspense>
      
      {/* Enhanced gradient overlay with more depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-indigo-50/80 to-purple-50/90 dark:from-blue-950/30 dark:via-indigo-950/25 dark:to-purple-950/30" />
      
      {/* Additional subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.1)_100%)]" />
    </div>
  );
}
