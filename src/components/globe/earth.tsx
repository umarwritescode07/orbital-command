"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Earth() {
  const earthRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Mesh>(null);

  // Rotate Earth and grids over time to simulate Earth rotation
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05; // Earth rotation speed
    }
    if (gridRef.current) {
      gridRef.current.rotation.y -= delta * 0.015; // Slow counter-rotating hud grid
    }
  });

  return (
    <group ref={earthRef}>
      {/* 1. Base Earth Sphere (Deep dark navy/black representing ocean) */}
      <mesh>
        <sphereGeometry args={[2.0, 64, 64]} />
        <meshPhongMaterial
          color="#050C16"
          emissive="#02050A"
          specular="#1E293B"
          shininess={5}
        />
      </mesh>

      {/* 2. Visual Latitude/Longitude Grid Lines (Aerospace tracking grid) */}
      <mesh ref={gridRef}>
        <sphereGeometry args={[2.01, 36, 18]} />
        <meshBasicMaterial
          color="#3B82F6"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* 3. Outer Aura / Atmospheric Glow */}
      <mesh>
        <sphereGeometry args={[2.08, 32, 32]} />
        <meshBasicMaterial
          color="#3B82F6"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 4. Glowing Equator Tracker */}
      <gridHelper 
        args={[4.4, 44, "rgba(59, 130, 246, 0.05)", "rgba(30, 41, 59, 0.05)"]} 
        position={[0, 0, 0]} 
        rotation={[Math.PI / 2, 0, 0]} 
      />
    </group>
  );
}
