"use client";

import React, { useState, useMemo } from "react";
import { calculateOrbitalParameters } from "@/lib/orbit-math";
import { SimulatorGlobe } from "@/components/globe/simulator-globe";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Activity,
  Sliders,
  AlertTriangle,
  RotateCw,
  Compass,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrbitalSimulatorPage() {
  // Input parameters state
  const [altitude, setAltitude] = useState(400); // km
  const [velocity, setVelocity] = useState(7.67); // km/s
  const [inclination, setInclination] = useState(51.6); // degrees
  const [mass, setMass] = useState(1200); // kg

  // Helper presets
  const applyPreset = (preset: "LEO" | "MEO" | "GEO") => {
    switch (preset) {
      case "LEO":
        setAltitude(400);
        setVelocity(7.67);
        setInclination(51.6);
        setMass(1200);
        break;
      case "MEO":
        setAltitude(20200);
        setVelocity(3.87);
        setInclination(55.0);
        setMass(1600);
        break;
      case "GEO":
        setAltitude(35786);
        setVelocity(3.07);
        setInclination(0.0);
        setMass(2200);
        break;
    }
  };

  // Perform active calculations
  const simResults = useMemo(() => {
    return calculateOrbitalParameters({
      altitude,
      velocity,
      inclination,
      mass,
    });
  }, [altitude, velocity, inclination, mass]);

  // Convert orbital period seconds to descriptive string
  const formatPeriod = (seconds: number) => {
    if (seconds === Infinity) return "N/A (Escape)";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 flex-shrink-0">
        <div>
          <div className="text-xs font-mono uppercase text-accent tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            ACOC Flight Dynamics Desk
          </div>
          <h1 className="text-2xl font-black font-mono tracking-wider text-slate-100 uppercase mt-0.5">
            Orbital Simulation Sandbox
          </h1>
        </div>

        {/* Orbit Category Presets */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded font-mono text-xs">
          <span className="text-slate-500 uppercase px-1">Orbit Presets:</span>
          <button
            onClick={() => applyPreset("LEO")}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded font-bold transition-all text-[11px]"
          >
            LEO (400km)
          </button>
          <button
            onClick={() => applyPreset("MEO")}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded font-bold transition-all text-[11px]"
          >
            MEO (20200km)
          </button>
          <button
            onClick={() => applyPreset("GEO")}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded font-bold transition-all text-[11px]"
          >
            GEO (35786km)
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left column: Parameters Input Sliders */}
        <Card className="flex flex-col h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-accent" /> Physics Parameters
            </CardTitle>
            <CardDescription>Adjust variables to calculate Keplerian projections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 font-mono text-xs">
            {/* Altitude slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>INSERTION ALTITUDE:</span>
                <span className="text-accent font-bold">{altitude.toLocaleString()} km</span>
              </div>
              <input
                type="range"
                min={150}
                max={40000}
                step={50}
                value={altitude}
                onChange={(e) => setAltitude(parseInt(e.target.value, 10))}
                className="w-full accent-accent bg-slate-950 h-1 rounded outline-none"
              />
              <div className="flex justify-between text-[9px] text-slate-650">
                <span>MIN: 150 km</span>
                <span>MAX: 40,000 km</span>
              </div>
            </div>

            {/* Velocity slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>INSERTION VELOCITY:</span>
                <span className="text-accent font-bold">{velocity.toFixed(2)} km/s</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={12.0}
                step={0.05}
                value={velocity}
                onChange={(e) => setVelocity(parseFloat(e.target.value))}
                className="w-full accent-accent bg-slate-950 h-1 rounded outline-none"
              />
              <div className="flex justify-between text-[9px] text-slate-650">
                <span>Circular: {simResults.circularVelocity} km/s</span>
                <span>Escape: {simResults.escapeVelocity} km/s</span>
              </div>
            </div>

            {/* Inclination slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>INCLINATION ANGLE:</span>
                <span className="text-accent font-bold">{inclination.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min={0.0}
                max={180.0}
                step={0.5}
                value={inclination}
                onChange={(e) => setInclination(parseFloat(e.target.value))}
                className="w-full accent-accent bg-slate-950 h-1 rounded outline-none"
              />
              <div className="flex justify-between text-[9px] text-slate-650">
                <span>Equatorial: 0°</span>
                <span>Polar: 90°</span>
              </div>
            </div>

            {/* Mass slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>SPACECRAFT MASS:</span>
                <span className="text-accent font-bold">{mass.toLocaleString()} kg</span>
              </div>
              <input
                type="range"
                min={10}
                max={5000}
                step={10}
                value={mass}
                onChange={(e) => setMass(parseInt(e.target.value, 10))}
                className="w-full accent-accent bg-slate-950 h-1 rounded outline-none"
              />
              <div className="flex justify-between text-[9px] text-slate-650">
                <span>CubeSat: ~10 kg</span>
                <span>GEO Comms: ~5,000 kg</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-950/20 text-slate-500 justify-center">
            Integrator: vis-viva equation solver
          </CardFooter>
        </Card>

        {/* Center column: 3D Simulator WebGL canvas */}
        <div className="h-[450px] lg:h-full min-h-[350px]">
          <SimulatorGlobe
            altitude={altitude}
            velocity={velocity}
            inclination={inclination}
            eccentricity={simResults.eccentricity}
            semiMajorAxis={simResults.semiMajorAxis}
            status={simResults.status}
          />
        </div>

        {/* Right column: Calculations Desk Outputs */}
        <div className="flex flex-col gap-6">
          {/* Orbital Stability Monitor */}
          <Card
            variant={
              simResults.status === "STABLE"
                ? "success"
                : simResults.status === "ELLIPTICAL"
                ? "accent"
                : simResults.status === "DECAY"
                ? "critical"
                : "warning"
            }
            className="flex-shrink-0"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Uplink Stability Lock</CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-xs flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500 uppercase">Orbit Classification:</span>
                <span
                  className={cn(
                    "text-base font-black tracking-wider uppercase",
                    simResults.status === "STABLE" && "text-success",
                    simResults.status === "ELLIPTICAL" && "text-accent",
                    simResults.status === "DECAY" && "text-critical animate-pulse",
                    simResults.status === "ESCAPE" && "text-warning animate-pulse"
                  )}
                >
                  {simResults.status === "STABLE"
                    ? "STABLE CIRCULAR"
                    : simResults.status === "ELLIPTICAL"
                    ? "ELLIPTICAL ORBIT"
                    : simResults.status === "DECAY"
                    ? "CRITICAL DECAY RISK"
                    : "ESCAPE TRAJECTORY"}
                </span>
              </div>
              <div>
                {simResults.status === "DECAY" || simResults.status === "ESCAPE" ? (
                  <AlertTriangle className="h-8 w-8 text-critical" />
                ) : (
                  <ShieldAlert className="h-8 w-8 text-success" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mathematical Outputs Table */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-accent" /> Calculation Core
              </CardTitle>
              <CardDescription>Keplerian parameters calculated in ECI frame</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 font-mono text-xs text-slate-400">
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span>Semi-Major Axis:</span>
                <span className="text-slate-200 font-bold">
                  {simResults.semiMajorAxis === Infinity
                    ? "Infinity"
                    : `${simResults.semiMajorAxis.toLocaleString()} km`}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span>Eccentricity (e):</span>
                <span className="text-slate-200 font-bold">{simResults.eccentricity}</span>
              </div>

              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span>Orbital Period:</span>
                <span className="text-slate-200 font-bold">
                  {formatPeriod(simResults.orbitalPeriod)}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span>Perigee Altitude:</span>
                <span className="text-slate-200 font-bold">
                  {simResults.perigeeAltitude.toLocaleString()} km
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span>Apogee Altitude:</span>
                <span className="text-slate-200 font-bold">
                  {simResults.apogeeAltitude === Infinity
                    ? "Infinity"
                    : `${simResults.apogeeAltitude.toLocaleString()} km`}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span>Orbit Velocity Gap:</span>
                <span
                  className={cn(
                    "font-bold",
                    Math.abs(velocity - simResults.circularVelocity) < 0.05
                      ? "text-success"
                      : "text-slate-200"
                  )}
                >
                  {(velocity - simResults.circularVelocity).toFixed(2)} km/s
                </span>
              </div>

              <div className="flex justify-between">
                <span>Ballistic Lifetime:</span>
                <span className="text-slate-200 font-bold">
                  {simResults.lifetimeYears === Infinity
                    ? "Infinite (>100 Years)"
                    : simResults.lifetimeYears === 0
                    ? "Immediate Re-entry (< 1 day)"
                    : `${simResults.lifetimeYears.toLocaleString()} Years`}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
