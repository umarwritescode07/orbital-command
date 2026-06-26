"use client";

import React, { useState, useMemo, useEffect } from "react";
import { DebrisGlobe } from "@/components/globe/debris-globe";
import { calculateConjunctions, ConjunctionEvent, debrisCatalog } from "@/lib/debris-math";
import { satellites } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertTriangle,
  Activity,
  ShieldCheck,
  Search,
  Bell,
  Crosshair,
  Gauge,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SpaceDebrisPage() {
  const [selectedConjId, setSelectedConjId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  // Calculate all active conjunction events in real-time
  const conjunctions = useMemo(() => {
    return calculateConjunctions(satellites);
  }, []);

  // Filtered conjunction events list
  const filteredConjunctions = useMemo(() => {
    return conjunctions.filter((c) => {
      const matchesSearch =
        c.satelliteId.toLowerCase().includes(search.toLowerCase()) ||
        c.debrisId.toLowerCase().includes(search.toLowerCase()) ||
        c.debrisName.toLowerCase().includes(search.toLowerCase());
      
      const matchesSeverity = severityFilter === "ALL" || c.riskLevel === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [search, severityFilter, conjunctions]);

  // Selected conjunction warning details
  const selectedConjunction = useMemo(() => {
    return conjunctions.find((c) => c.id === selectedConjId) || null;
  }, [selectedConjId, conjunctions]);

  // Generate 3D vectors for visual warning beam overlays
  const [warningCoords, setWarningCoords] = useState<{
    sat: [number, number, number];
    deb: [number, number, number];
  } | null>(null);

  // Re-calculate visual line positions when selection changes
  useEffect(() => {
    if (selectedConjunction) {
      // Find satellite metadata
      const sat = satellites.find((s) => s.id === selectedConjunction.satelliteId);
      const deb = debrisCatalog.find((d) => d.id === selectedConjunction.debrisId);

      if (sat && deb) {
        // Pseudo Keplerian ECI coordinates scale mapping
        const scale = 2.0 / 6371;
        const satRadius = 2.0 * (1 + sat.altitude / 6371);
        const debRadius = 2.0 * (1 + deb.altitude / 6371);

        const satIncl = (((sat as any).inclination ?? (sat.orbit === "LEO" ? 45 : sat.orbit === "MEO" ? 55 : 0)) * Math.PI) / 180;
        const debIncl = (deb.inclination * Math.PI) / 180;

        // Use a static phase offset for rendering approach
        const thetaSat = 1.0;
        const thetaDeb = 1.05; // Slightly offset approach

        const satX = satRadius * Math.cos(thetaSat);
        const satY = satRadius * Math.sin(thetaSat) * Math.cos(satIncl);
        const satZ = satRadius * Math.sin(thetaSat) * Math.sin(satIncl);

        const debX = debRadius * Math.cos(thetaDeb);
        const debY = debRadius * Math.sin(thetaDeb) * Math.cos(debIncl);
        const debZ = debRadius * Math.sin(thetaDeb) * Math.sin(debIncl);

        setWarningCoords({
          sat: [satX, satY, satZ],
          deb: [debX, debY, debZ],
        });
      }
    } else {
      setWarningCoords(null);
    }
  }, [selectedConjunction]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 flex-shrink-0">
        <div>
          <div className="text-xs font-mono uppercase text-accent tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-critical animate-ping"></span>
            ACOC Orbital Conjunction Desk
          </div>
          <h1 className="text-2xl font-black font-mono tracking-wider text-slate-100 uppercase mt-0.5">
            NORAD Space Debris Tracking & Collision Safeguards
          </h1>
        </div>
      </div>

      {/* Main split workdeck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Side: 3D Visualization Map */}
        <div className="lg:col-span-2 h-[500px] lg:h-full min-h-[400px]">
          <DebrisGlobe
            debrisList={debrisCatalog}
            selectedSatId={selectedConjunction?.satelliteId || null}
            selectedDebId={selectedConjunction?.debrisId || null}
            warningSatCoords={warningCoords?.sat}
            warningDebCoords={warningCoords?.deb}
            onSelectDebris={(id) => {
              const conj = conjunctions.find((c) => c.debrisId === id);
              if (conj) setSelectedConjId(conj.id);
            }}
          />
        </div>

        {/* Right Side: Alarms List & Warnings details */}
        <div className="flex flex-col gap-6 h-full min-h-0 overflow-y-auto lg:overflow-visible">
          {/* Conjunction Filters Card */}
          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Crosshair className="h-4.5 w-4.5 text-accent" /> Hazard Screening Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by SAT-ID or Debris ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 rounded py-1 pl-8 pr-3 font-mono text-xs text-slate-300 placeholder-slate-650 outline-none"
                />
              </div>

              <div className="space-y-1.5 font-mono text-[10px] text-slate-500">
                <span className="uppercase">Risk Severity threshold:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded py-1 px-2 text-slate-300 outline-none cursor-pointer"
                >
                  <option value="ALL">ALL WARNINGS</option>
                  <option value="CRITICAL">CRITICAL RISK ONLY</option>
                  <option value="HIGH">HIGH RISK</option>
                  <option value="MEDIUM">MEDIUM RISK</option>
                  <option value="LOW">LOW RISK</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Details / Conjunction List selection */}
          {selectedConjunction ? (
            /* Collision Warning Details Card */
            <Card className="flex-1 min-h-0 flex flex-col border-critical/35 shadow-[0_0_15px_#EF444415]">
              <CardHeader className="pb-3 flex flex-row justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Warning Deck</span>
                  <CardTitle className="text-slate-100 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-critical animate-pulse" /> {selectedConjunction.id}
                  </CardTitle>
                  <CardDescription className="normal-case font-normal text-xs text-slate-450 leading-relaxed">
                    Uplink targets: {selectedConjunction.satelliteId} vs {selectedConjunction.debrisId}
                  </CardDescription>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider border animate-pulse",
                    selectedConjunction.riskLevel === "CRITICAL" && "bg-critical/15 border-critical text-critical",
                    selectedConjunction.riskLevel === "HIGH" && "bg-critical-muted border-critical/30 text-critical",
                    selectedConjunction.riskLevel === "MEDIUM" && "bg-warning/15 border-warning text-warning",
                    selectedConjunction.riskLevel === "LOW" && "bg-slate-900 border-slate-800 text-slate-400"
                  )}
                >
                  {selectedConjunction.riskLevel}
                </span>
              </CardHeader>

              <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-4 pt-1 pb-4">
                {/* 1. Hazard Origin specifications */}
                <div className="p-3 bg-slate-950/40 rounded border border-slate-800/80 space-y-2 font-mono text-xs text-slate-400">
                  <div className="text-[10px] text-accent font-bold uppercase tracking-widest mb-1.5">
                    Hazard Classification
                  </div>
                  <div className="flex justify-between">
                    <span>Debris Name:</span>
                    <span className="text-slate-200">{selectedConjunction.debrisName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Origin Source:</span>
                    <span className="text-slate-350">{selectedConjunction.debrisId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Vessel:</span>
                    <span className="text-slate-200">{selectedConjunction.satelliteName}</span>
                  </div>
                </div>

                {/* 2. Proximity Calculations */}
                <div className="space-y-3">
                  <div className="text-[10px] text-accent font-bold font-mono uppercase tracking-widest">
                    Proximity Computations
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 bg-slate-950/40 rounded border border-slate-850 space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                        <Bell className="h-3 w-3" /> Time to approach
                      </span>
                      <span className="text-slate-200 font-bold">
                        {Math.floor(selectedConjunction.timeToImpactSeconds / 60)}m {selectedConjunction.timeToImpactSeconds % 60}s
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-950/40 rounded border border-slate-850 space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                        <Gauge className="h-3 w-3" /> Relative Velocity
                      </span>
                      <span className="text-slate-200 font-bold">{selectedConjunction.relativeVelocity} km/s</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/40 rounded border border-slate-850 space-y-2 font-mono text-xs text-slate-450">
                    <div className="flex justify-between">
                      <span>Closest Approach:</span>
                      <span className="text-critical font-bold">{selectedConjunction.closestApproach} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collision Probability:</span>
                      <span className="text-critical font-bold">{selectedConjunction.collisionProbability}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <div className="p-3 border-t border-slate-800 bg-slate-950/30 flex justify-between gap-3 flex-shrink-0">
                <button
                  onClick={() => setSelectedConjId(null)}
                  className="flex-1 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800/40 rounded text-center text-xs font-bold text-slate-400 hover:text-slate-200 transition-all font-mono uppercase"
                >
                  Clear focus overlay
                </button>
              </div>
            </Card>
          ) : (
            /* Standard warnings list */
            <Card className="flex-1 min-h-0 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle>Screening Alerts</CardTitle>
                <CardDescription>Matching filter parameters: {filteredConjunctions.length}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 min-h-0 overflow-y-auto p-0 border-t border-slate-800">
                <div className="divide-y divide-slate-800/60 font-mono text-xs">
                  {filteredConjunctions.length > 0 ? (
                    filteredConjunctions.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedConjId(c.id)}
                        className="p-3.5 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/30 transition-colors group"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-200 group-hover:text-accent transition-colors flex items-center gap-2">
                            {c.id}
                            <span
                              className={cn(
                                "px-1.5 py-0.2 rounded text-[7.5px] font-extrabold border uppercase",
                                c.riskLevel === "CRITICAL" && "bg-critical/15 border-critical/30 text-critical animate-pulse",
                                c.riskLevel === "HIGH" && "bg-critical-muted border-critical/10 text-critical",
                                c.riskLevel === "MEDIUM" && "bg-warning/15 border-warning/30 text-warning",
                                c.riskLevel === "LOW" && "bg-slate-950 border-slate-800 text-slate-500"
                              )}
                            >
                              {c.riskLevel}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 max-w-[200px] truncate">
                            {c.satelliteId} vs {c.debrisName}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-slate-350 font-bold">{c.closestApproach} km</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{c.collisionProbability}% prob.</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500 font-mono text-xs">
                      No conjunction alerts match search.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
