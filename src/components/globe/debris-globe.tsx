"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";
import * as THREE from "three";
import { Earth } from "./earth";
import { DebrisObject } from "@/lib/debris-math";

interface DebrisGlobeProps {
  debrisList: DebrisObject[];
  warningSatCoords?: [number, number, number] | null;
  warningDebCoords?: [number, number, number] | null;
  selectedSatId: string | null;
  selectedDebId: string | null;
  onSelectDebris: (id: string | null) => void;
}

// Sub-component that manages and renders the 3D Space Debris Cloud particles
function DebrisCloud({
  debrisList,
  selectedDebId,
  onSelectDebris,
}: {
  debrisList: DebrisObject[];
  selectedDebId: string | null;
  onSelectDebris: (id: string | null) => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate vertices, colors, and sizes for the 300+ debris points
  const { positions, colors, radii, inclinations, phases, orbitSpeeds } = useMemo(() => {
    const pos = new Float32Array(debrisList.length * 3);
    const cols = new Float32Array(debrisList.length * 3);
    const rad: number[] = [];
    const incl: number[] = [];
    const ph: number[] = [];
    const speeds: number[] = [];

    const scale = 2.0 / 6371; // Earth radius scale

    debrisList.forEach((deb, idx) => {
      const scaleRadius = 2.0 * (1 + deb.altitude / 6371);
      rad.push(scaleRadius);
      incl.push((deb.inclination * Math.PI) / 180);
      ph.push(deb.phase);
      
      // Speed decays as altitude increases
      speeds.push(deb.orbit === "LEO" ? 0.22 : deb.orbit === "MEO" ? 0.08 : 0.02);

      // Generate initial position
      const theta = deb.phase;
      const inclRad = (deb.inclination * Math.PI) / 180;
      pos[idx * 3] = scaleRadius * Math.cos(theta);
      pos[idx * 3 + 1] = scaleRadius * Math.sin(theta) * Math.cos(inclRad);
      pos[idx * 3 + 2] = scaleRadius * Math.sin(theta) * Math.sin(inclRad);

      // Colors: Large debris (red), Medium (orange), Small (grey)
      if (deb.id === selectedDebId) {
        cols[idx * 3] = 0.0;
        cols[idx * 3 + 1] = 0.9;
        cols[idx * 3 + 2] = 1.0; // Glowing Cyan highlight
      } else if (deb.size === "LARGE") {
        cols[idx * 3] = 0.93; // Red-orange
        cols[idx * 3 + 1] = 0.27;
        cols[idx * 3 + 2] = 0.27;
      } else if (deb.size === "MEDIUM") {
        cols[idx * 3] = 0.96; // Amber
        cols[idx * 3 + 1] = 0.62;
        cols[idx * 3 + 2] = 0.04;
      } else {
        cols[idx * 3] = 0.55; // Grey
        cols[idx * 3 + 1] = 0.55;
        cols[idx * 3 + 2] = 0.65;
      }
    });

    return { positions: pos, colors: cols, radii: rad, inclinations: incl, phases: ph, orbitSpeeds: speeds };
  }, [debrisList, selectedDebId]);

  // Update particle positions along their orbits over frames
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    const elapsed = clock.getElapsedTime();
    const posAttribute = pointsRef.current.geometry.attributes.position;
    const array = posAttribute.array as Float32Array;

    for (let i = 0; i < debrisList.length; i++) {
      const scaleRadius = radii[i];
      const inclRad = inclinations[i];
      const speed = orbitSpeeds[i];
      const theta = elapsed * speed + phases[i];

      array[i * 3] = scaleRadius * Math.cos(theta);
      array[i * 3 + 1] = scaleRadius * Math.sin(theta) * Math.cos(inclRad);
      array[i * 3 + 2] = scaleRadius * Math.sin(theta) * Math.sin(inclRad);
    }

    posAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

export function DebrisGlobe({
  debrisList,
  warningSatCoords,
  warningDebCoords,
  selectedSatId,
  selectedDebId,
  onSelectDebris,
}: DebrisGlobeProps) {
  return (
    <div className="relative w-full h-full bg-slate-950/20 border border-slate-800/80 rounded-lg overflow-hidden glass-card">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} style={{ background: "#020617" }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />
        <Stars radius={100} depth={50} count={1200} factor={3} saturation={0.5} fade speed={1} />

        {/* Rotating Earth */}
        <Earth />

        {/* Space Debris particles */}
        <DebrisCloud
          debrisList={debrisList}
          selectedDebId={selectedDebId}
          onSelectDebris={onSelectDebris}
        />

        {/* Collision Risk warning vector line */}
        {warningSatCoords && warningDebCoords && (
          <Line
            points={[warningSatCoords, warningDebCoords]}
            color="#EF4444"
            lineWidth={2.2}
            dashed
            dashScale={2.5}
            transparent
            opacity={0.9}
          />
        )}

        <OrbitControls enableDamping minDistance={2.5} maxDistance={15} />
      </Canvas>

      {/* Floating HUD Legends */}
      <div className="absolute bottom-4 left-4 font-mono text-[9px] pointer-events-none select-none space-y-2">
        <div className="bg-slate-900/90 border border-border p-2.5 rounded text-slate-350 backdrop-blur-md flex flex-col gap-1.5 shadow-lg">
          <div className="text-[10px] text-critical font-bold uppercase tracking-wider mb-1">
            Hazard Field Legends
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>Large Object (&gt;50cm)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Medium Fragment (10-50cm)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Small Particle (&lt;10cm)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
