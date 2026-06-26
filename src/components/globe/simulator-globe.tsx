"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";
import * as THREE from "three";
import { Earth } from "./earth";

interface SimulatorGlobeProps {
  altitude: number; // km
  velocity: number; // km/s
  inclination: number; // degrees
  eccentricity: number;
  semiMajorAxis: number;
  status: "STABLE" | "ELLIPTICAL" | "DECAY" | "ESCAPE";
}

function SimulatedOrbit({
  altitude,
  velocity,
  inclination,
  eccentricity,
  semiMajorAxis,
  status,
}: SimulatorGlobeProps) {
  const satRef = useRef<THREE.Mesh>(null);

  // Generate points along the Keplerian path
  const orbitPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    const inclRad = (inclination * Math.PI) / 180;
    
    // Scale Earth radius 6371km to 2.0 units
    const scale = 2.0 / 6371;

    if (status === "ESCAPE") {
      // Draw a parabolic/hyperbolic escaping arc
      // Generate points for anomaly from -pi/2 to pi/2
      const steps = 60;
      const r_p = 6371 + altitude; // perigee radius
      const p = r_p * (1 + eccentricity); // semi-latus rectum
      
      for (let i = -steps; i <= steps; i++) {
        const theta = (i / steps) * (Math.PI / 2.2);
        const r_val = p / (1 + eccentricity * Math.cos(theta));
        const visDist = r_val * scale;
        
        // Prevent drawing too far out
        if (visDist > 15) continue;

        const x = visDist * Math.cos(theta);
        const y = visDist * Math.sin(theta) * Math.cos(inclRad);
        const z = visDist * Math.sin(theta) * Math.sin(inclRad);
        points.push([x, y, z]);
      }
      return points;
    }

    // Elliptical or Circular Orbit path
    const steps = 120;
    // Semimajor axis in ThreeJS units
    const a_scaled = semiMajorAxis * scale;
    const b_scaled = a_scaled * Math.sqrt(1 - Math.pow(eccentricity, 2));
    
    // Position of Earth relative to orbital center (focus of the ellipse)
    // The focus lies at distance c = a * e from center
    const focusOffset = a_scaled * eccentricity;

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      
      // Calculate coordinates relative to center of ellipse, then offset focus to Earth center
      // Insertion point at perigee/apogee alignment
      const x_ell = a_scaled * Math.cos(theta) - focusOffset;
      const y_ell = b_scaled * Math.sin(theta);
      
      // Project into 3D using inclination plane
      const x = x_ell;
      const y = y_ell * Math.cos(inclRad);
      const z = y_ell * Math.sin(inclRad);

      // If decay, stop path once it breaches the Earth radius threshold (2.0)
      const distanceToCenter = Math.sqrt(x*x + y*y + z*z);
      if (status === "DECAY" && distanceToCenter < 1.98) {
        // Stop rendering inside Earth core
        continue;
      }

      points.push([x, y, z]);
    }

    return points;
  }, [altitude, inclination, eccentricity, semiMajorAxis, status]);

  // Animate simulated satellite coordinate along the path
  useFrame(({ clock }) => {
    if (!satRef.current || orbitPoints.length === 0) return;
    
    // Animate along points list index
    const elapsed = clock.getElapsedTime();
    const speed = status === "ESCAPE" ? 5 : 15;
    const index = Math.floor(elapsed * speed) % orbitPoints.length;
    
    const pt = orbitPoints[index];
    if (pt) {
      satRef.current.position.set(pt[0], pt[1], pt[2]);
    }
  });

  return (
    <group>
      {/* Dynamic Path line */}
      {orbitPoints.length > 1 && (
        <Line
          points={orbitPoints}
          color={
            status === "DECAY"
              ? "#EF4444"
              : status === "ESCAPE"
              ? "#F59E0B"
              : "#3B82F6"
          }
          lineWidth={1.5}
          dashed={status === "DECAY"}
          dashScale={1.5}
        />
      )}

      {/* Simulated Satellite node */}
      {orbitPoints.length > 0 && (
        <mesh ref={satRef}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial
            color={
              status === "DECAY"
                ? "#EF4444"
                : status === "ESCAPE"
                ? "#F59E0B"
                : "#3B82F6"
            }
          />
        </mesh>
      )}
    </group>
  );
}

export function SimulatorGlobe(props: SimulatorGlobeProps) {
  return (
    <div className="relative w-full h-full bg-slate-950/20 border border-slate-800/80 rounded-lg overflow-hidden glass-card">
      <Canvas camera={{ position: [0, 0, 6.5], fov: 45 }} style={{ background: "#020617" }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />
        <Stars radius={100} depth={50} count={1500} factor={3} saturation={0.5} fade speed={1} />
        
        {/* Rotating Earth */}
        <Earth />

        {/* Dynamic Trajectory overlay */}
        <SimulatedOrbit {...props} />

        <OrbitControls enableDamping minDistance={2.5} maxDistance={15} />
      </Canvas>
    </div>
  );
}
