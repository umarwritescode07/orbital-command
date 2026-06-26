"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Earth } from "./earth";
import { Orbits, SatelliteData, GroundStationData } from "./orbits";

interface CanvasGlobeProps {
  satellites: SatelliteData[];
  groundStations: GroundStationData[];
  selectedSatId: string | null;
  onSelectSatellite: (id: string | null) => void;
}

// Camera control helper to interpolate target positions towards focused satellite
function CameraController({
  selectedSatId,
  satRefs,
  focusLock,
}: {
  selectedSatId: string | null;
  satRefs: React.MutableRefObject<{ [key: string]: THREE.Group | null }>;
  focusLock: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (!controlsRef.current) return;

    if (selectedSatId && focusLock) {
      const satGroup = satRefs.current[selectedSatId];
      if (satGroup) {
        const targetPos = new THREE.Vector3();
        satGroup.getWorldPosition(targetPos);

        // Smoothly interpolate orbit controls target onto the moving satellite
        controlsRef.current.target.lerp(targetPos, 0.08);
        controlsRef.current.update();
      }
    } else if (!selectedSatId && controlsRef.current.target.lengthSq() > 0.01) {
      // Smoothly return target coordinates back to Earth center [0, 0, 0]
      controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.08);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={2.5}
      maxDistance={12}
      makeDefault
    />
  );
}

export function CanvasGlobe({
  satellites,
  groundStations,
  selectedSatId,
  onSelectSatellite,
}: CanvasGlobeProps) {
  const [focusLock, setFocusLock] = useState(true);
  const satRefs = useRef<{ [key: string]: THREE.Group | null }>({});

  // Reset focus lock when selected satellite changes
  useEffect(() => {
    if (selectedSatId) {
      setFocusLock(true);
    }
  }, [selectedSatId]);

  return (
    <div className="relative w-full h-full bg-slate-950/20 border border-slate-800/80 rounded-lg overflow-hidden glass-card">
      {/* 3D R3F Canvas */}
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        gl={{ antialias: true }}
        style={{ background: "#020617" }}
      >
        {/* Sky Ambient Light */}
        <ambientLight intensity={0.35} />

        {/* Directional Light (Sun vector simulating Day/Night shadowing) */}
        <directionalLight position={[5, 3, 5]} intensity={1.2} />

        {/* Space Starfield */}
        <Stars radius={100} depth={50} count={2500} factor={4} saturation={0.5} fade speed={1} />

        {/* Earth Mesh */}
        <Earth />

        {/* Satellites & Orbits */}
        <Orbits
          satellites={satellites}
          groundStations={groundStations}
          selectedSatId={selectedSatId}
          onSelectSatellite={(id) => {
            onSelectSatellite(id);
          }}
        />

        {/* Custom controller */}
        <CameraController
          selectedSatId={selectedSatId}
          satRefs={satRefs}
          focusLock={focusLock}
        />

        {/* Bind actual references of satellites from sub-component to parent canvas */}
        <SatelliteRefBridge satellites={satellites} satRefs={satRefs} />
      </Canvas>

      {/* Floating HUD controls */}
      <div className="absolute bottom-4 left-4 font-mono text-[10px] space-y-2 pointer-events-none select-none">
        <div className="bg-slate-900/90 border border-border p-2.5 rounded text-slate-300 backdrop-blur-md flex flex-col gap-1 shadow-lg pointer-events-auto">
          <div className="text-accent font-bold uppercase tracking-widest text-[9px] mb-1">
            Tracking HUD Controls
          </div>
          <div>L-Click + Drag: Rotate Camera</div>
          <div>R-Click + Drag: Pan Horizon</div>
          <div>Scroll: Zoom telemetry field</div>
        </div>

        {selectedSatId && (
          <div className="bg-slate-900/90 border border-accent/30 p-2.5 rounded text-slate-300 backdrop-blur-md flex items-center gap-3 shadow-lg pointer-events-auto">
            <span className="text-accent font-bold">FOCUS LOCK</span>
            <button
              onClick={() => setFocusLock(!focusLock)}
              className={`px-2 py-0.5 rounded border text-[9px] font-bold transition-all ${
                focusLock
                  ? "bg-accent/15 border-accent text-accent shadow-[0_0_8px_#3B82F633]"
                  : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              {focusLock ? "ENGAGED" : "RELEASED"}
            </button>
            <button
              onClick={() => onSelectSatellite(null)}
              className="px-2 py-0.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded text-[9px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
            >
              CLEAR FOCUS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Technical bridge component mapping dynamic coordinates from frame updates to canvas scope
function SatelliteRefBridge({
  satellites,
  satRefs,
}: {
  satellites: SatelliteData[];
  satRefs: React.MutableRefObject<{ [key: string]: THREE.Group | null }>;
}) {
  const { scene } = useThree();

  // Scrapes scene objects for satellite meshes and maps refs for focus lerping
  useFrame(() => {
    satellites.forEach((sat) => {
      const sceneObj = scene.getObjectByName(`sat-${sat.id}`);
      if (sceneObj) {
        satRefs.current[sat.id] = sceneObj as THREE.Group;
      }
    });
  });

  // Assign names in ThreeJS node list during render passes
  return (
    <>
      {satellites.map((sat) => (
        <object3D key={`bridge-${sat.id}`} name={`sat-${sat.id}`}>
          {/* Virtual node positioning bridge */}
        </object3D>
      ))}
    </>
  );
}
