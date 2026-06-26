"use client";

import React, { useState, useEffect, useMemo } from "react";
import { StationsGlobe } from "@/components/globe/stations-globe";
import { GroundStation, Satellite, constellations as mockConstellations } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Network,
  Activity,
  Globe,
  Radio,
  Wifi,
  Gauge,
  Search,
  CheckCircle2,
  AlertCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConstellationPage() {
  const [activeTab, setActiveTab] = useState<"space" | "ground">("space");
  const [stations, setStations] = useState<GroundStation[]>([]);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected entities state
  const [selectedStationId, setSelectedStationId] = useState<string | null>("MCC-HOU");
  const [selectedConstId, setSelectedConstId] = useState<string | null>("starlink-g3");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch ground network and satellites
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch ground stations
      const resSt = await fetch("/api/ground-stations");
      const dataSt = await resSt.json();
      setStations(dataSt.data || []);

      // Fetch satellites
      const resSat = await fetch("/api/satellites");
      const dataSat = await resSat.json();
      setSatellites(dataSat.data || []);
    } catch (e) {
      console.error("Failed to load network segment telemetry", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Calculations: Constellations coverage analysis
  const constellationsData = useMemo(() => {
    return mockConstellations.map((constellation) => {
      const groupSats = satellites.filter((s) => s.constellationId === constellation.id);
      const activeSats = groupSats.filter((s) => s.status === "ACTIVE").length;
      const totalSats = groupSats.length;
      
      // Calculate coverage percentage (active/total)
      const coverage = totalSats > 0 ? (activeSats / totalSats) * 100 : 0;
      
      // Average resource usage
      const avgBattery = totalSats > 0 
        ? groupSats.reduce((acc, s) => acc + s.battery, 0) / totalSats 
        : 0;
      const avgCpu = totalSats > 0 
        ? groupSats.reduce((acc, s) => acc + s.cpuUsage, 0) / totalSats 
        : 0;

      return {
        ...constellation,
        totalSats,
        activeSats,
        coverage: parseFloat(coverage.toFixed(1)),
        avgBattery: parseFloat(avgBattery.toFixed(1)),
        avgCpu: parseFloat(avgCpu.toFixed(1)),
      };
    });
  }, [satellites]);

  // Selected constellation object helper
  const selectedConstellation = useMemo(() => {
    return constellationsData.find((c) => c.id === selectedConstId) || null;
  }, [selectedConstId, constellationsData]);

  // Selected ground station object helper
  const selectedStation = useMemo(() => {
    return stations.find((st) => st.id === selectedStationId) || null;
  }, [selectedStationId, stations]);

  // Filtered lists
  const filteredConstellations = useMemo(() => {
    return constellationsData.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [constellationsData, searchQuery]);

  const filteredStations = useMemo(() => {
    return stations.filter((st) =>
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stations, searchQuery]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Page Header & Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 flex-shrink-0">
        <div>
          <div className="text-xs font-mono uppercase text-accent tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            ACOC Telemetry & Communications Deck
          </div>
          <h1 className="text-2xl font-black font-mono tracking-wider text-slate-100 uppercase mt-0.5">
            Global Network Segments
          </h1>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-950/80 border border-slate-800 p-1.5 rounded font-mono text-xs">
          <button
            onClick={() => {
              setActiveTab("space");
              setSearchQuery("");
            }}
            className={cn(
              "px-4 py-1.5 rounded transition-all font-bold flex items-center gap-2",
              activeTab === "space" ? "bg-accent/15 border border-accent/20 text-accent" : "text-slate-500 hover:text-slate-350"
            )}
          >
            <Network className="h-4 w-4" /> SPACE SEGMENT (CONSTELLATIONS)
          </button>
          <button
            onClick={() => {
              setActiveTab("ground");
              setSearchQuery("");
            }}
            className={cn(
              "px-4 py-1.5 rounded transition-all font-bold flex items-center gap-2",
              activeTab === "ground" ? "bg-accent/15 border border-accent/20 text-accent" : "text-slate-500 hover:text-slate-350"
            )}
          >
            <Globe className="h-4 w-4" /> GROUND SEGMENT (ANTENNAS)
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Side: Display globe or statistics */}
        <div className="lg:col-span-2 flex flex-col h-[500px] lg:h-full min-h-[400px]">
          {activeTab === "ground" ? (
            /* 3D Global Ground Stations network map */
            <StationsGlobe
              stations={stations}
              satellites={satellites}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
            />
          ) : (
            /* Space Segment Overview grids */
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
              {filteredConstellations.map((c) => (
                <Card
                  key={c.id}
                  variant={selectedConstId === c.id ? "accent" : "default"}
                  hover
                  onClick={() => setSelectedConstId(c.id)}
                  className="h-fit"
                >
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 border-0">
                    <div className="font-mono text-slate-100 font-extrabold text-sm">{c.name}</div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[8.5px] font-bold font-mono border",
                        c.healthScore > 95 ? "bg-success-muted text-success border-success/20" : "bg-warning-muted text-warning border-warning/20"
                      )}
                    >
                      HLT: {c.healthScore}%
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-4 font-mono text-xs text-slate-400">
                    {/* Coverage calculation */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span>Coverage Score:</span>
                        <span className="text-slate-200 font-bold">{c.coverage}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded border border-slate-850">
                        <div
                          className="bg-accent h-full rounded transition-all duration-500"
                          style={{ width: `${c.coverage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div className="p-2 bg-slate-950/40 rounded border border-slate-850">
                        <span className="text-slate-500 uppercase block">Active / Total</span>
                        <span className="text-slate-200 font-bold text-xs">{c.activeSats} / {c.totalSats} Units</span>
                      </div>
                      <div className="p-2 bg-slate-950/40 rounded border border-slate-850">
                        <span className="text-slate-500 uppercase block">Avg Battery</span>
                        <span className="text-slate-200 font-bold text-xs">{c.avgBattery}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: List filtering and detail controls */}
        <div className="flex flex-col gap-6 h-full min-h-0 overflow-y-auto lg:overflow-visible">
          {/* Controls & Search bar */}
          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4.5 w-4.5 text-accent" /> Network Query Deck
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder={activeTab === "space" ? "Search Constellations..." : "Search Stations..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 rounded py-1.5 pl-8 pr-3 font-mono text-xs text-slate-300 placeholder-slate-650 outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tab specific details panels */}
          {activeTab === "space" ? (
            /* 1. Space Segment: Constellation Details */
            selectedConstellation ? (
              <Card className="flex-1 min-h-0 flex flex-col border-accent/20 shadow-[0_0_15px_#3B82F608]">
                <CardHeader className="pb-3">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Space Segment</span>
                  <CardTitle className="text-slate-100">{selectedConstellation.name}</CardTitle>
                  <CardDescription className="normal-case text-slate-450 leading-relaxed font-mono">
                    ID Ref: {selectedConstellation.id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-4 pt-1 pb-4 font-mono text-xs text-slate-400">
                  <div className="p-3 bg-slate-950/40 rounded border border-slate-800/80 space-y-2">
                    <div className="text-[10px] text-accent font-bold uppercase tracking-widest mb-1.5">
                      Resource Summary
                    </div>
                    <div className="flex justify-between">
                      <span>Operational Health:</span>
                      <span className="text-success font-bold">{selectedConstellation.healthScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average CPU Overhead:</span>
                      <span className="text-slate-200">{selectedConstellation.avgCpu}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Hardware Nodes:</span>
                      <span className="text-slate-200">{selectedConstellation.totalSats}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[10px] text-accent font-bold uppercase tracking-widest">
                      Operational Nodes
                    </div>
                    <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto border border-slate-850 rounded bg-slate-950/30">
                      {satellites
                        .filter((s) => s.constellationId === selectedConstellation.id)
                        .map((sat) => (
                          <div key={sat.id} className="p-2.5 px-3 flex justify-between items-center text-xs">
                            <span className="text-slate-250 font-bold">{sat.id}</span>
                            <span className="text-slate-450">{sat.orbit}</span>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              sat.status === "ACTIVE" ? "bg-success" : sat.status === "ANOMALOUS" ? "bg-critical animate-pulse" : "bg-warning"
                            )}></span>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-center border-t border-slate-800 bg-slate-950/20 py-2.5">
                  <button
                    onClick={() => setSelectedConstId(null)}
                    className="text-[10px] text-slate-450 hover:text-slate-200 uppercase font-bold"
                  >
                    Clear Focus
                  </button>
                </CardFooter>
              </Card>
            ) : (
              <Card className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono text-xs border-dashed">
                <Network className="h-8 w-8 text-slate-700 animate-pulse mb-3" />
                <span>Select a constellation to view member nodes and health scores.</span>
              </Card>
            )
          ) : (
            /* 2. Ground Segment: Ground Station Details */
            selectedStation ? (
              <Card className="flex-1 min-h-0 flex flex-col border-accent/20 shadow-[0_0_15px_#3B82F608]">
                <CardHeader className="pb-3 flex flex-row justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Ground Station</span>
                    <CardTitle className="text-slate-100">{selectedStation.id}</CardTitle>
                    <CardDescription className="normal-case text-slate-450 leading-relaxed">
                      {selectedStation.name}
                    </CardDescription>
                  </div>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider border",
                      selectedStation.status === "ONLINE" && "bg-success/15 border-success text-success",
                      selectedStation.status === "MAINTENANCE" && "bg-warning/15 border-warning text-warning",
                      selectedStation.status === "OFFLINE" && "bg-critical/15 border-critical text-critical"
                    )}
                  >
                    {selectedStation.status}
                  </span>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-4 pt-1 pb-4 font-mono text-xs text-slate-400">
                  <div className="p-3 bg-slate-950/40 rounded border border-slate-800/80 space-y-2">
                    <div className="text-[10px] text-accent font-bold uppercase tracking-widest mb-1.5">
                      Coordinates & Antennas
                    </div>
                    <div className="flex justify-between">
                      <span>Latitude:</span>
                      <span className="text-slate-200">{selectedStation.latitude}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Longitude:</span>
                      <span className="text-slate-200">{selectedStation.longitude}°</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[10px] text-accent font-bold uppercase tracking-widest">
                      Live Signal Telemetry
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Wifi className="h-3.5 w-3.5" /> Signal Latency
                        </span>
                        <span className="text-slate-200 font-bold">
                          {selectedStation.status === "ONLINE" ? `${selectedStation.latency} ms` : "N/A"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-850">
                        {/* Shorter bar = better latency */}
                        <div
                          className="bg-accent h-full transition-all duration-500"
                          style={{ width: `${selectedStation.status === "ONLINE" ? Math.max(10, 100 - selectedStation.latency / 3) : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Gauge className="h-3.5 w-3.5" /> Data Throughput
                        </span>
                        <span className="text-slate-200 font-bold">
                          {selectedStation.status === "ONLINE" ? `${selectedStation.throughput} Mbps` : "0 Mbps"}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-850">
                        <div
                          className="bg-success h-full transition-all duration-500"
                          style={{ width: `${selectedStation.status === "ONLINE" ? (selectedStation.throughput / 1500) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-center border-t border-slate-800 bg-slate-950/20 py-2.5">
                  <button
                    onClick={() => setSelectedStationId(null)}
                    className="text-[10px] text-slate-450 hover:text-slate-200 uppercase font-bold"
                  >
                    Clear Station selection
                  </button>
                </CardFooter>
              </Card>
            ) : (
              <Card className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono text-xs border-dashed">
                <Globe className="h-8 w-8 text-slate-700 animate-pulse mb-3" />
                <span>Select a ground station from the 3D globe to inspect network logs.</span>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
}
