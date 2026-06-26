"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { SatelliteData, GroundStationData } from "@/components/globe/orbits";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Search,
  Compass,
  Battery,
  Flame,
  Thermometer,
  Cpu,
  Radio,
  Sun,
  LayoutGrid,
  TableProperties,
  Map,
  RefreshCw,
  Signal,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load the 3D Earth Globe component to split code and reduce initial bundle load times
const CanvasGlobe = dynamic(
  () => import("@/components/globe/canvas-globe").then((m) => m.CanvasGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex flex-col items-center justify-center border border-slate-800 bg-slate-900/25 rounded-lg relative scanlines overflow-hidden min-h-[400px]">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-slate-500 mt-4 uppercase tracking-widest">
          Booting 3D Orbital Visualization Engine...
        </span>
      </div>
    ),
  }
);

// Mock Ground Stations for the 3D globe component
const mockGroundStations: GroundStationData[] = [
  { id: "MCC-HOU", name: "Houston Control", lat: 29.76, lng: -95.36, status: "ONLINE" },
  { id: "MCC-CAN", name: "Canberra Station", lat: -35.28, lng: 149.13, status: "ONLINE" },
  { id: "MCC-MAD", name: "Madrid Deep Space", lat: 40.41, lng: -3.7, status: "MAINTENANCE" },
  { id: "MCC-ANC", name: "Alaska Uplink Node", lat: 61.21, lng: -149.9, status: "ONLINE" },
];

export default function SatelliteTrackerPage() {
  const [satellites, setSatellites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSatId, setSelectedSatId] = useState<string | null>(null);
  
  // Search & Filter controls
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [orbitFilter, setOrbitFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"map" | "grid" | "table">("map");
  const [dataSource, setDataSource] = useState("fetching...");

  // Scroll offsets for virtualization
  const [tableScrollTop, setTableScrollTop] = useState(0);
  const [gridScrollTop, setGridScrollTop] = useState(0);

  // Virtualization configurations
  const viewportHeight = 520;
  const tableRowHeight = 37; // Height of each table <tr>
  const gridCardHeight = 150; // Height of each grid card including gap
  const gridCols = 2; // Number of columns in sm:grid-cols-2

  // Fetch satellites from Next.js REST API
  const fetchSatellites = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (orbitFilter !== "ALL") params.append("orbit", orbitFilter);

      const res = await fetch(`/api/satellites?${params.toString()}`);
      const payload = await res.json();
      
      setSatellites(payload.data || []);
      setDataSource(payload.source === "database" ? "PostgreSQL Database" : "Mock Cache (Offline)");
    } catch (e) {
      console.error("Failed to fetch satellites", e);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data on search / filter updates
  useEffect(() => {
    fetchSatellites();
    // Reset scroll positions when filters change to avoid empty virtual viewports
    setTableScrollTop(0);
    setGridScrollTop(0);
  }, [search, statusFilter, orbitFilter]);

  // Selected satellite details
  const selectedSatellite = useMemo(() => {
    return satellites.find((sat) => sat.id === selectedSatId) || null;
  }, [selectedSatId, satellites]);

  // Derived telemetry metrics for the top dashboard overview ribbon
  const statsOverview = useMemo(() => {
    const total = satellites.length;
    const active = satellites.filter((s) => s.status === "ACTIVE").length;
    const anomalous = satellites.filter((s) => s.status === "ANOMALOUS").length;
    const decommissioned = satellites.filter((s) => s.status === "DECOMMISSIONED").length;
    return { total, active, anomalous, decommissioned };
  }, [satellites]);

  // Table row slicing virtualization calculations
  const virtualTable = useMemo(() => {
    const total = satellites.length;
    const visibleCount = Math.ceil(viewportHeight / tableRowHeight) + 8;
    const startIndex = Math.max(0, Math.floor(tableScrollTop / tableRowHeight) - 4);
    const endIndex = Math.min(total, startIndex + visibleCount);
    
    return {
      items: satellites.slice(startIndex, endIndex),
      paddingTop: startIndex * tableRowHeight,
      paddingBottom: (total - endIndex) * tableRowHeight,
    };
  }, [satellites, tableScrollTop]);

  // Grid card slicing virtualization calculations
  const virtualGrid = useMemo(() => {
    const total = satellites.length;
    const visibleCount = (Math.ceil(viewportHeight / gridCardHeight) + 4) * gridCols;
    const startIndex = Math.max(0, Math.floor(gridScrollTop / gridCardHeight) - 2) * gridCols;
    const endIndex = Math.min(total, startIndex + visibleCount);

    return {
      items: satellites.slice(startIndex, endIndex),
      paddingTop: Math.floor(startIndex / gridCols) * gridCardHeight,
      paddingBottom: Math.ceil((total - endIndex) / gridCols) * gridCardHeight,
    };
  }, [satellites, gridScrollTop]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* 1. Page Header & Control Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 flex-shrink-0">
        <div>
          <div className="text-xs font-mono uppercase text-accent tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            ACOC Orbital Grid Uplink
          </div>
          <h1 className="text-2xl font-black font-mono tracking-wider text-slate-100 uppercase mt-0.5">
            Constellation Tracker & Visualization
          </h1>
        </div>

        {/* View toggles & refresh button */}
        <div className="flex items-center gap-3 font-mono">
          <div className="flex bg-slate-950/80 border border-slate-800 p-1 rounded">
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "p-1.5 rounded text-xs transition-all flex items-center gap-1.5 px-2.5",
                viewMode === "map" ? "bg-accent/10 border border-accent/25 text-accent" : "text-slate-400 hover:text-slate-200"
              )}
              title="3D Globe Tracker Map"
            >
              <Map className="h-3.5 w-3.5" /> <span className="hidden sm:inline">3D Globe</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded text-xs transition-all flex items-center gap-1.5 px-2.5",
                viewMode === "grid" ? "bg-accent/10 border border-accent/25 text-accent" : "text-slate-400 hover:text-slate-200"
              )}
              title="Grid Card View"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Grid View</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded text-xs transition-all flex items-center gap-1.5 px-2.5",
                viewMode === "table" ? "bg-accent/10 border border-accent/25 text-accent" : "text-slate-400 hover:text-slate-200"
              )}
              title="Condensed Table View"
            >
              <TableProperties className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Table View</span>
            </button>
          </div>

          <button
            onClick={fetchSatellites}
            className="p-2 bg-slate-900 border border-slate-800 rounded hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
            title="Refresh Uplink"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-accent")} />
          </button>
        </div>
      </div>

      {/* 2. Operational Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0 font-mono text-xs">
        <div className="bg-slate-900/40 border border-slate-800/80 p-2.5 rounded flex items-center justify-between">
          <span className="text-slate-500 uppercase">Tracked Fleet</span>
          <span className="text-slate-200 font-bold">{statsOverview.total} Units</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 p-2.5 rounded flex items-center justify-between">
          <span className="text-slate-500 uppercase">Operational</span>
          <span className="text-success font-bold">{statsOverview.active} Active</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 p-2.5 rounded flex items-center justify-between">
          <span className="text-slate-500 uppercase">Alerting</span>
          <span className={cn("font-bold", statsOverview.anomalous > 0 ? "text-critical animate-pulse" : "text-slate-400")}>
            {statsOverview.anomalous} Anomalous
          </span>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 p-2.5 rounded flex items-center justify-between">
          <span className="text-slate-500 uppercase">Source</span>
          <span className="text-accent uppercase tracking-wider">{dataSource}</span>
        </div>
      </div>

      {/* 3. Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Side: Dynamic Display Map / Grid / Table */}
        <div className="lg:col-span-2 flex flex-col h-[550px] lg:h-full min-h-[400px]">
          {loading && viewMode === "grid" ? (
            /* Skeleton Loading indicator */
            <div className="flex-1 flex flex-col items-center justify-center border border-slate-800 bg-slate-900/25 rounded-lg relative scanlines overflow-hidden">
              <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-mono text-slate-500 mt-4 uppercase tracking-widest">
                Rebuilding Telemetry Stream...
              </span>
            </div>
          ) : viewMode === "map" ? (
            /* 3D Earth Globe Visualizer */
            <CanvasGlobe
              satellites={satellites}
              groundStations={mockGroundStations}
              selectedSatId={selectedSatId}
              onSelectSatellite={setSelectedSatId}
            />
          ) : viewMode === "grid" ? (
            /* Grid Card Layout with Custom Virtualization */
            <div 
              onScroll={(e) => setGridScrollTop(e.currentTarget.scrollTop)}
              className="flex-1 overflow-y-auto pr-1 pb-4"
              style={{ height: `${viewportHeight}px` }}
            >
              {/* Virtualized padding-top spacer */}
              <div style={{ height: `${virtualGrid.paddingTop}px` }}></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {virtualGrid.items.map((sat) => (
                  <Card
                    key={sat.id}
                    variant={selectedSatId === sat.id ? "accent" : "default"}
                    hover
                    onClick={() => setSelectedSatId(sat.id)}
                    className="h-fit flex flex-col"
                  >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 border-0">
                      <div className="font-bold font-mono text-slate-100">{sat.id}</div>
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          sat.status === "ACTIVE" && "bg-success shadow-[0_0_8px_#22C55E]",
                          sat.status === "ANOMALOUS" && "bg-critical animate-pulse shadow-[0_0_8px_#EF4444]",
                          sat.status === "INACTIVE" && "bg-warning",
                          sat.status === "DECOMMISSIONED" && "bg-slate-650"
                        )}
                      ></span>
                    </CardHeader>
                    <CardContent className="space-y-3 font-mono text-xs text-slate-400">
                      <div className="text-[11px] font-sans font-bold text-slate-350 line-clamp-1">
                        {sat.name}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                        <div>Alt: <span className="text-slate-200">{sat.altitude} km</span></div>
                        <div>Vel: <span className="text-slate-200">{sat.velocity} km/s</span></div>
                        <div>Batt: <span className={cn(sat.battery < 25 ? "text-critical font-bold" : "text-slate-200")}>{sat.battery}%</span></div>
                        <div>Signal: <span className="text-slate-200">{sat.signalStrength} dBm</span></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Virtualized padding-bottom spacer */}
              <div style={{ height: `${virtualGrid.paddingBottom}px` }}></div>
            </div>
          ) : (
            /* Dense Operations Table View with Custom Virtualization */
            <div 
              onScroll={(e) => setTableScrollTop(e.currentTarget.scrollTop)}
              className="flex-1 overflow-x-auto border border-slate-800 bg-slate-900/30 rounded-lg overflow-y-auto"
              style={{ height: `${viewportHeight}px` }}
            >
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-500 uppercase tracking-wider text-[10px] sticky top-0 z-10">
                    <th className="py-3 px-4">Satellite ID</th>
                    <th className="py-3 px-4">Orbit</th>
                    <th className="py-3 px-4">Velocity</th>
                    <th className="py-3 px-4">Altitude</th>
                    <th className="py-3 px-4">Propellant</th>
                    <th className="py-3 px-4">Charge</th>
                    <th className="py-3 px-4">Signal</th>
                    <th className="py-3 px-4">Core Temp</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {/* Virtualized spacer row (Top) */}
                  {virtualTable.paddingTop > 0 && (
                    <tr>
                      <td style={{ height: `${virtualTable.paddingTop}px` }} colSpan={9}></td>
                    </tr>
                  )}
                  
                  {virtualTable.items.map((sat) => (
                    <tr
                      key={sat.id}
                      onClick={() => setSelectedSatId(sat.id)}
                      className={cn(
                        "cursor-pointer hover:bg-slate-850/30 transition-colors h-[37px]",
                        selectedSatId === sat.id && "bg-accent-muted/10 border-l-2 border-accent"
                      )}
                    >
                      <td className="py-2 px-4 font-bold text-slate-200">{sat.id}</td>
                      <td className="py-2 px-4">{sat.orbit}</td>
                      <td className="py-2 px-4 text-slate-350">{sat.velocity} km/s</td>
                      <td className="py-2 px-4 text-slate-350">{sat.altitude} km</td>
                      <td className="py-2 px-4 text-slate-350">{sat.fuel}%</td>
                      <td className="py-2 px-4 text-slate-350">{sat.battery}%</td>
                      <td className="py-2 px-4 text-slate-350">{sat.signalStrength} dBm</td>
                      <td className="py-2 px-4 text-slate-350">{sat.temperature}°C</td>
                      <td className="py-2 px-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold",
                            sat.status === "ACTIVE" && "bg-success-muted text-success border border-success/20",
                            sat.status === "ANOMALOUS" && "bg-critical-muted text-critical border border-critical/20 animate-pulse",
                            sat.status === "INACTIVE" && "bg-warning-muted text-warning border border-warning/20",
                            sat.status === "DECOMMISSIONED" && "bg-slate-850 text-slate-500 border border-slate-800"
                          )}
                        >
                          {sat.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Virtualized spacer row (Bottom) */}
                  {virtualTable.paddingBottom > 0 && (
                    <tr>
                      <td style={{ height: `${virtualTable.paddingBottom}px` }} colSpan={9}></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: List Filters & Telemetry Details */}
        <div className="flex flex-col gap-6 h-full min-h-0 overflow-y-auto lg:overflow-visible">
          {/* Controls & Filter Panel */}
          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-4.5 w-4.5 text-accent" /> Uplink Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search SAT-ID or Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 rounded py-1 pl-8 pr-3 font-mono text-xs text-slate-300 placeholder-slate-650 outline-none"
                />
              </div>

              {/* Status & Orbit Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 font-mono text-[10px] text-slate-500">
                  <span className="uppercase">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded py-1 px-2 text-slate-300 outline-none"
                  >
                    <option value="ALL">ALL STATUS</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ANOMALOUS">ANOMALOUS</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="DECOMMISSIONED">DECOMMISSIONED</option>
                  </select>
                </div>

                <div className="space-y-1.5 font-mono text-[10px] text-slate-500">
                  <span className="uppercase">Orbit:</span>
                  <select
                    value={orbitFilter}
                    onChange={(e) => setOrbitFilter(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded py-1 px-2 text-slate-300 outline-none"
                  >
                    <option value="ALL">ALL ORBITS</option>
                    <option value="LEO">LEO (Low)</option>
                    <option value="MEO">MEO (Mid)</option>
                    <option value="GEO">GEO (Geo)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details / Empty Switch Stack */}
          {selectedSatellite ? (
            /* Selected Satellite Details Card */
            <Card className="flex-1 min-h-0 flex flex-col border-accent/30 shadow-[0_0_15px_#3B82F611]">
              <CardHeader className="pb-3 flex flex-row justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Telemetry Desk</span>
                  <CardTitle className="text-slate-100">{selectedSatellite.id}</CardTitle>
                  <CardDescription className="normal-case font-normal text-xs text-slate-400">
                    {selectedSatellite.name}
                  </CardDescription>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider border",
                    selectedSatellite.status === "ACTIVE" && "bg-success/15 border-success text-success",
                    selectedSatellite.status === "ANOMALOUS" && "bg-critical/15 border-critical text-critical animate-pulse",
                    selectedSatellite.status === "INACTIVE" && "bg-warning/15 border-warning text-warning",
                    selectedSatellite.status === "DECOMMISSIONED" && "bg-slate-850 border-slate-800 text-slate-500"
                  )}
                >
                  {selectedSatellite.status}
                </span>
              </CardHeader>

              <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-4 pt-1 pb-4">
                {/* 1. Orbit Parameters */}
                <div className="p-3 bg-slate-950/40 rounded border border-slate-800/80 space-y-2 font-mono text-xs text-slate-400">
                  <div className="text-[10px] text-accent font-bold uppercase tracking-widest mb-1.5">
                    Orbit Specifications
                  </div>
                  <div className="flex justify-between">
                    <span>Classification:</span>
                    <span className="text-slate-200">{selectedSatellite.orbit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Altitude:</span>
                    <span className="text-slate-200">{selectedSatellite.altitude} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Orbital Speed:</span>
                    <span className="text-slate-200">{selectedSatellite.velocity} km/s</span>
                  </div>
                </div>

                {/* 2. Live Telemetry Metrics */}
                <div className="space-y-3">
                  <div className="text-[10px] text-accent font-bold font-mono uppercase tracking-widest">
                    Telemetry Stream
                  </div>

                  {/* Battery */}
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Battery className="h-3.5 w-3.5 text-accent" /> Battery Capacity
                      </span>
                      <span className="text-slate-200 font-bold">{selectedSatellite.battery}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded border border-slate-850">
                      <div
                        className={cn(
                          "h-full rounded transition-all duration-500",
                          selectedSatellite.battery < 25 ? "bg-critical" : "bg-accent"
                        )}
                        style={{ width: `${selectedSatellite.battery}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Fuel */}
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-warning" /> Propellant Level
                      </span>
                      <span className="text-slate-200 font-bold">{selectedSatellite.fuel}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded border border-slate-850">
                      <div
                        className="bg-warning h-full rounded transition-all duration-500"
                        style={{ width: `${selectedSatellite.fuel}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Signal Strength */}
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Radio className="h-3.5 w-3.5 text-accent" /> Signal Strength
                      </span>
                      <span className="text-slate-200 font-bold">{selectedSatellite.signalStrength} dBm</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded border border-slate-850">
                      {/* Convert dBm into percentage indicator (mapping -120dBm to -40dBm) */}
                      <div
                        className="bg-success h-full rounded transition-all duration-500"
                        style={{ width: `${Math.max(10, Math.min(100, ((selectedSatellite.signalStrength + 120) / 80) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* CPU / Temp split grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 bg-slate-950/40 rounded border border-slate-850 space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                        <Cpu className="h-3 w-3" /> Core Load
                      </span>
                      <span className="text-slate-200 font-bold">{selectedSatellite.cpuUsage}%</span>
                    </div>

                    <div className="p-2.5 bg-slate-950/40 rounded border border-slate-850 space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                        <Thermometer className="h-3 w-3" /> Thermal Core
                      </span>
                      <span className="text-slate-200 font-bold">{selectedSatellite.temperature}°C</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <div className="p-3 border-t border-slate-800 bg-slate-950/30 flex justify-between gap-3 flex-shrink-0">
                <button
                  onClick={() => setSelectedSatId(null)}
                  className="flex-1 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800/40 rounded text-center text-xs font-bold text-slate-400 hover:text-slate-200 transition-all font-mono uppercase"
                >
                  Clear Selection
                </button>
              </div>
            </Card>
          ) : (
            /* Blank state instruction card */
            <Card className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono text-xs border-dashed">
              <Compass className="h-8 w-8 text-slate-700 animate-pulse mb-3" />
              <span>Select a satellite from the map, grid, or table to view dedicated real-time telemetry.</span>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
