"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line } from "@react-three/drei";

export interface SatelliteData {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | "ANOMALOUS" | "DECOMMISSIONED";
  orbit: "LEO" | "MEO" | "GEO";
  altitude: number; // km
  velocity: number; // km/s
  inclination: number; // degrees
  phase?: number; // Starting offset angle
}

export interface GroundStationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
}

interface OrbitsProps {
  satellites: SatelliteData[];
  groundStations: GroundStationData[];
  selectedSatId: string | null;
  onSelectSatellite: (id: string) => void;
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

export function Orbits({
  satellites,
  groundStations,
  selectedSatId,
  onSelectSatellite,
}: OrbitsProps) {
  const satRefs = useRef<{ [key: string]: THREE.Group | null }>({});

  // Compile pre-calculated orbit paths
  const orbitPaths = useMemo(() => {
    return satellites.map((sat) => {
      const points: [number, number, number][] = [];
      const steps = 120;
      // Visual scale mapping: LEO (~2.3), MEO (~3.0), GEO (~4.0)
      const scaleRadius =
        sat.orbit === "LEO" ? 2.4 : sat.orbit === "MEO" ? 3.2 : 4.0;
      
      const inclination = sat.inclination ?? (sat.orbit === "LEO" ? 45 : sat.orbit === "MEO" ? 55 : 0);
      const inclRad = (inclination * Math.PI) / 180;

      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        // Keplerian orbital mapping around rotating sphere
        const x = scaleRadius * Math.cos(theta);
        const y = scaleRadius * Math.sin(theta) * Math.cos(inclRad);
        const z = scaleRadius * Math.sin(theta) * Math.sin(inclRad);
        points.push([x, y, z]);
      }

      return {
        id: sat.id,
        points,
      };
    });
  }, [satellites]);

  // Compute Ground Station sphere coordinates
  const stationCoords = useMemo(() => {
    return groundStations.map((station) => ({
      ...station,
      coords: getSphereCoords(station.lat, station.lng, 2.02),
    }));
  }, [groundStations]);

  // Dynamic frame loop animating satellite nodes along orbit lines
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    satellites.forEach((sat) => {
      const ref = satRefs.current[sat.id];
      if (!ref) return;

      const inclination = sat.inclination ?? (sat.orbit === "LEO" ? 45 : sat.orbit === "MEO" ? 55 : 0);
      const inclRad = (inclination * Math.PI) / 180;
      const scaleRadius =
        sat.orbit === "LEO" ? 2.4 : sat.orbit === "MEO" ? 3.2 : 4.0;

      // Orbit speed varies: LEO faster, GEO static/slow
      const speedScale =
        sat.orbit === "LEO" ? 0.3 : sat.orbit === "MEO" ? 0.12 : 0.04;
      const theta = elapsed * speedScale + (sat.phase || 0);

      // Orbital Position Coordinates
      const x = scaleRadius * Math.cos(theta);
      const y = scaleRadius * Math.sin(theta) * Math.cos(inclRad);
      const z = scaleRadius * Math.sin(theta) * Math.sin(inclRad);

      ref.position.set(x, y, z);
    });
  });

  return (
    <group>
      {/* 1. Orbit Path Rings */}
      {orbitPaths.map((orbit) => {
        const isSelected = selectedSatId === orbit.id;
        return (
          <Line
            key={`path-${orbit.id}`}
            points={orbit.points}
            color={isSelected ? "#3B82F6" : "#1E293B"}
            lineWidth={isSelected ? 1.5 : 0.8}
            transparent
            opacity={isSelected ? 0.8 : 0.25}
          />
        );
      })}

      {/* 2. Ground Station Anchors */}
      {stationCoords.map((station) => (
        <group key={`station-${station.id}`} position={station.coords}>
          {/* Signal Pulse Rings */}
          <mesh>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial
              color={station.status === "ONLINE" ? "#22C55E" : "#F59E0B"}
            />
          </mesh>
          <mesh scale={[1.8, 1.8, 1.8]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial
              color={station.status === "ONLINE" ? "#22C55E" : "#F59E0B"}
              transparent
              opacity={0.15}
            />
          </mesh>
        </group>
      ))}

      {/* 3. Interactive Satellite Nodes */}
      {satellites.map((sat) => {
        const isSelected = selectedSatId === sat.id;

        return (
          <group
            key={`sat-${sat.id}`}
            ref={(el) => {
              satRefs.current[sat.id] = el;
            }}
          >
            {/* Glowing click boundary */}
            <mesh onClick={(e) => {
              e.stopPropagation();
              onSelectSatellite(sat.id);
            }}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Visual core marker */}
            <mesh>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial
                color={
                  isSelected
                    ? "#3B82F6"
                    : sat.status === "ANOMALOUS"
                    ? "#EF4444"
                    : sat.status === "INACTIVE"
                    ? "#F59E0B"
                    : "#3B82F6"
                }
              />
            </mesh>

            {/* Glowing Ring overlay for selected satellite */}
            {isSelected && (
              <mesh scale={[2.2, 2.2, 2.2]}>
                <ringGeometry args={[0.03, 0.04, 16]} />
                <meshBasicMaterial color="#3B82F6" side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* 4. Active Ground Downlink Beams for Selected Satellite */}
      {selectedSatId && (
        <DownlinkBeams
          satRef={satRefs.current[selectedSatId]}
          stationCoords={stationCoords}
        />
      )}
    </group>
  );
}

// Inner helper component to draw dynamic beam lines connecting to closest ground stations
function DownlinkBeams({
  satRef,
  stationCoords,
}: {
  satRef: THREE.Group | null;
  stationCoords: Array<GroundStationData & { coords: [number, number, number] }>;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);

  useFrame(() => {
    if (!satRef || !lineRef.current) return;

    const satPos = new THREE.Vector3();
    satRef.getWorldPosition(satPos);

    const positions: number[] = [];

    // Draw beams to ground stations within line-of-sight/range
    stationCoords.forEach((station) => {
      const stationPos = new THREE.Vector3(...station.coords);
      const distance = satPos.distanceTo(stationPos);

      // Downlink window threshold
      if (distance < 2.8 && station.status === "ONLINE") {
        positions.push(satPos.x, satPos.y, satPos.z);
        positions.push(stationPos.x, stationPos.y, stationPos.z);
      }
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
        opacity={0.45}
        linewidth={1.2}
      />
    </lineSegments>
  );
}
