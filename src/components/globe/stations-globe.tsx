"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Earth } from "./earth";
import { GroundStation, Satellite } from "@/lib/mock-data";

interface StationsGlobeProps {
  stations: GroundStation[];
  satellites: Satellite[];
  selectedStationId: string | null;
  onSelectStation: (id: string | null) => void;
}

// Convert Lat/Lng to 3D Sphere coordinates
function getSphereCoords(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;

  const x = -radius * Math.cos(phi) * Math.sin(theta);
  const y = radius * Math.sin(phi);
  const z = radius * Math.cos(phi) * Math.cos(theta);

  return [x, y, z];
}

// Sub-component mapping active communication beams
function CommLinks({
  stations,
  satellites,
  selectedStationId,
}: {
  stations: GroundStation[];
  satellites: Satellite[];
  selectedStationId: string | null;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);

  // Filter a subset of key satellites for visualization to keep it performant
  const activeSats = useMemo(() => satellites.slice(0, 12), [satellites]);

  // Convert station locations to 3D vectors
  const stationCoords = useMemo(() => {
    return stations.map((st) => ({
      id: st.id,
      status: st.status,
      pos: new THREE.Vector3(...getSphereCoords(st.latitude, st.longitude, 2.02)),
    }));
  }, [stations]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;

    const elapsed = clock.getElapsedTime();
    const positions: number[] = [];

    // Simulate satellite orbital positions over time
    activeSats.forEach((sat, satIdx) => {
      // Basic ECI orbit position
      const radius = 2.5; // Visual altitude radius
      const incl = (45 + satIdx * 10) * (Math.PI / 180); // Inclination variation
      const theta = elapsed * 0.12 + (satIdx * Math.PI) / 6;

      const satPos = new THREE.Vector3(
        radius * Math.cos(theta),
        radius * Math.sin(theta) * Math.cos(incl),
        radius * Math.sin(theta) * Math.sin(incl)
      );

      // Check distance to all ground stations
      stationCoords.forEach((station) => {
        if (station.status !== "ONLINE") return;

        const distance = satPos.distanceTo(station.pos);

        // Transmission Cone threshold (e.g. line-of-sight range)
        // If within range, or if the station is specifically selected by the operator!
        const isRange = distance < 2.0;
        const isSelected = selectedStationId === station.id;

        if (isRange || isSelected) {
          positions.push(station.pos.x, station.pos.y, station.pos.z);
          positions.push(satPos.x, satPos.y, satPos.z);
        }
      });
    });

    const geometry = lineRef.current.geometry;
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial
        color="#3B82F6"
        transparent
        opacity={0.35}
        linewidth={1.2}
      />
    </lineSegments>
  );
}

export function StationsGlobe({
  stations,
  satellites,
  selectedStationId,
  onSelectStation,
}: StationsGlobeProps) {
  // Pre-calculate 3D vectors for ground station meshes
  const stationPins = useMemo(() => {
    return stations.map((st) => ({
      ...st,
      coords: getSphereCoords(st.latitude, st.longitude, 2.02),
    }));
  }, [stations]);

  return (
    <div className="relative w-full h-full bg-slate-950/20 border border-slate-800/80 rounded-lg overflow-hidden glass-card">
      <Canvas camera={{ position: [0, 0, 6.5], fov: 45 }} style={{ background: "#020617" }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />
        <Stars radius={100} depth={50} count={1200} factor={3} saturation={0.5} fade speed={1} />

        {/* Rotating Earth */}
        <Earth />

        {/* Ground Station Pins */}
        {stationPins.map((st) => {
          const isSelected = selectedStationId === st.id;
          return (
            <group
              key={st.id}
              position={st.coords}
              onClick={(e) => {
                e.stopPropagation();
                onSelectStation(st.id);
              }}
            >
              {/* Click boundary */}
              <mesh>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>

              {/* Station core */}
              <mesh>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshBasicMaterial
                  color={
                    isSelected
                      ? "#3B82F6"
                      : st.status === "ONLINE"
                      ? "#22C55E"
                      : st.status === "MAINTENANCE"
                      ? "#F59E0B"
                      : "#EF4444"
                  }
                />
              </mesh>

              {/* High-tech pulsing beacon shell */}
              {st.status === "ONLINE" && (
                <mesh scale={[1.8, 1.8, 1.8]}>
                  <sphereGeometry args={[0.035, 8, 8]} />
                  <meshBasicMaterial
                    color="#22C55E"
                    transparent
                    opacity={0.15}
                  />
                </mesh>
              )}
            </group>
          );
        })}

        {/* Uplink signal lines */}
        <CommLinks
          stations={stations}
          satellites={satellites}
          selectedStationId={selectedStationId}
        />

        <OrbitControls enableDamping minDistance={2.5} maxDistance={15} />
      </Canvas>
    </div>
  );
}
