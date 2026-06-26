"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSocket } from "@/hooks/use-socket";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Activity,
  Compass,
  Radio,
  Cpu,
  Thermometer,
  Sun,
  Battery,
  Flame,
  Play,
  Pause,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TelemetryFrame {
  satelliteId: string;
  battery: number;
  temperature: number;
  fuel: number;
  cpuUsage: number;
  signalStrength: number;
  solarOutput: number;
  timestamp: string;
}

export default function TelemetryCenterPage() {
  const { socket, connected } = useSocket();
  const [selectedSatId, setSelectedSatId] = useState("SAT-001");
  const [isLive, setIsLive] = useState(true);
  const [range, setRange] = useState("1h"); // 1h, 24h, 7d, 30d
  const [historicalData, setHistoricalData] = useState<TelemetryFrame[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  // Live charting rolling data window
  const [liveBuffer, setLiveBuffer] = useState<TelemetryFrame[]>([]);
  const [latestFrame, setLatestFrame] = useState<TelemetryFrame | null>(null);

  // 1. Fetch initial history / Playback data
  const loadHistoricalData = async () => {
    try {
      const res = await fetch(`/api/telemetry?satelliteId=${selectedSatId}&range=${range}`);
      const payload = await res.json();
      const telemetryList = payload.data || [];
      setHistoricalData(telemetryList);
      setPlaybackIndex(telemetryList.length > 0 ? telemetryList.length - 1 : 0);
      
      // Load historical data as initial live buffer to prevent empty charts when switching to live
      if (isLive && telemetryList.length > 0) {
        setLiveBuffer(telemetryList.slice(-20)); // Last 20 data points
        setLatestFrame(telemetryList[telemetryList.length - 1]);
      }
    } catch (e) {
      console.error("Failed to load historical telemetry", e);
    }
  };

  useEffect(() => {
    loadHistoricalData();
  }, [selectedSatId, range, isLive]);

  // 2. Join/Leave WebSocket telemetry channels depending on active satellite selection
  useEffect(() => {
    if (!socket || !isLive) return;

    // Join room for target satellite
    socket.emit("join:satellite", selectedSatId);

    // Listen for incoming telemetry frames
    const onTelemetryFrame = (frame: TelemetryFrame) => {
      setLatestFrame(frame);
      setLiveBuffer((prev) => {
        const updated = [...prev, frame];
        if (updated.length > 30) {
          return updated.slice(1); // Maintain a sliding window of 30 seconds
        }
        return updated;
      });
    };

    socket.on("telemetry:frame", onTelemetryFrame);

    return () => {
      socket.emit("leave:satellite", selectedSatId);
      socket.off("telemetry:frame", onTelemetryFrame);
    };
  }, [socket, selectedSatId, isLive]);

  // 3. Playback timeline automation loop
  useEffect(() => {
    if (isPlaying) {
      playbackTimer.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= historicalData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000); // 1-second ticks
    } else {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    }

    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, [isPlaying, historicalData]);

  // Readouts mapping to the current visual snapshot (live frame vs. playback scrub frame)
  const currentSnapshot = useMemo(() => {
    if (isLive) {
      return latestFrame;
    }
    return historicalData[playbackIndex] || null;
  }, [isLive, latestFrame, historicalData, playbackIndex]);

  // Dataset rendering inside charts
  const activeChartData = useMemo(() => {
    if (isLive) {
      return liveBuffer.map((frame) => ({
        ...frame,
        time: new Date(frame.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }));
    }
    // Highlight playback indexing marker in the chart context
    return historicalData.map((frame, index) => ({
      ...frame,
      time: new Date(frame.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));
  }, [isLive, liveBuffer, historicalData]);

  return (
    <div className="space-y-6">
      {/* Operations Deck Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <div className="text-xs font-mono uppercase text-accent tracking-widest flex items-center gap-1.5">
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", connected && isLive ? "bg-accent" : "bg-slate-500")}></span>
            Uplink Frequency: 12.45 GHz // Ka-Band
          </div>
          <h1 className="text-2xl font-black font-mono tracking-wider text-slate-100 uppercase mt-0.5">
            Telemetry Analysis Center
          </h1>
        </div>

        {/* Live / Playback toggles & selector */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          {/* Satellite select */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded">
            <span className="text-slate-500">TARGET:</span>
            <select
              value={selectedSatId}
              onChange={(e) => setSelectedSatId(e.target.value)}
              className="bg-transparent text-slate-200 outline-none font-bold cursor-pointer"
            >
              {Array.from({ length: 15 }).map((_, i) => {
                const id = `SAT-${String(i + 1).padStart(3, "0")}`;
                return (
                  <option key={id} value={id}>
                    {id}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-950/80 border border-slate-800 p-1 rounded">
            <button
              onClick={() => setIsLive(true)}
              className={cn(
                "px-3 py-1 rounded transition-all",
                isLive
                  ? "bg-accent/15 border border-accent/20 text-accent font-bold"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              LIVE UPLINK
            </button>
            <button
              onClick={() => setIsLive(false)}
              className={cn(
                "px-3 py-1 rounded transition-all",
                !isLive
                  ? "bg-accent/15 border border-accent/20 text-accent font-bold"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              PLAYBACK
            </button>
          </div>

          {/* Range Selector (Playback only) */}
          {!isLive && (
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded py-1.5 px-3 text-slate-350 outline-none cursor-pointer"
            >
              <option value="1h">1 HOUR HISTORY</option>
              <option value="24h">24 HOURS HISTORY</option>
              <option value="7d">7 DAYS HISTORY</option>
              <option value="30d">30 DAYS HISTORY</option>
            </select>
          )}
        </div>
      </div>

      {/* Playback timeline slider */}
      {!isLive && historicalData.length > 0 && (
        <Card className="border-accent/20 shadow-[0_0_10px_#3B82F605]">
          <CardContent className="py-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <span>Historical Playback Deck</span>
              </div>
              <span className="text-slate-300">
                FRAME: {playbackIndex + 1} / {historicalData.length} (
                {new Date(historicalData[playbackIndex]?.timestamp || "").toLocaleDateString()}{" "}
                {new Date(historicalData[playbackIndex]?.timestamp || "").toLocaleTimeString()})
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded text-accent flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>

              <input
                type="range"
                min={0}
                max={historicalData.length - 1}
                value={playbackIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setPlaybackIndex(parseInt(e.target.value, 10));
                }}
                className="flex-1 accent-accent bg-slate-950 h-1.5 rounded cursor-pointer outline-none border border-slate-800"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Snapshot HUD Gauges */}
      {currentSnapshot ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card variant="accent">
            <CardContent className="pt-4 font-mono text-xs space-y-1.5">
              <div className="text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Battery className="h-3.5 w-3.5 text-accent" /> Battery
              </div>
              <div className="text-xl font-bold text-slate-100">{currentSnapshot.battery.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card variant="accent">
            <CardContent className="pt-4 font-mono text-xs space-y-1.5">
              <div className="text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Thermometer className="h-3.5 w-3.5 text-warning" /> Thermal Core
              </div>
              <div className="text-xl font-bold text-slate-100">{currentSnapshot.temperature.toFixed(1)}°C</div>
            </CardContent>
          </Card>

          <Card variant="accent">
            <CardContent className="pt-4 font-mono text-xs space-y-1.5">
              <div className="text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-warning" /> Propellant
              </div>
              <div className="text-xl font-bold text-slate-100">{currentSnapshot.fuel.toFixed(3)}%</div>
            </CardContent>
          </Card>

          <Card variant="accent">
            <CardContent className="pt-4 font-mono text-xs space-y-1.5">
              <div className="text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-accent" /> Processor
              </div>
              <div className="text-xl font-bold text-slate-100">{currentSnapshot.cpuUsage.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card variant="accent">
            <CardContent className="pt-4 font-mono text-xs space-y-1.5">
              <div className="text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sun className="h-3.5 w-3.5 text-accent" /> Solar Array
              </div>
              <div className="text-xl font-bold text-slate-100">{currentSnapshot.solarOutput.toFixed(0)} W</div>
            </CardContent>
          </Card>

          <Card variant="accent">
            <CardContent className="pt-4 font-mono text-xs space-y-1.5">
              <div className="text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-accent" /> Signal
              </div>
              <div className="text-xl font-bold text-slate-100">{currentSnapshot.signalStrength} dBm</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-8 text-center border border-slate-800 bg-slate-900/10 font-mono text-xs text-slate-500 rounded">
          Establishing uplink session, waiting for telemetry payload handshake...
        </div>
      )}

      {/* Dynamic Telemetry Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Chart 1: Battery Capacity */}
        <TelemetryCard title="Battery Capacity Charge" dataKey="battery" stroke="#3B82F6" glowId="battGlow" />

        {/* Chart 2: Thermal Core */}
        <TelemetryCard title="Thermal Core Temp (°C)" dataKey="temperature" stroke="#EF4444" glowId="tempGlow" />

        {/* Chart 3: Propellant Level */}
        <TelemetryCard title="Fuel Reserve Level (%)" dataKey="fuel" stroke="#F59E0B" glowId="fuelGlow" />

        {/* Chart 4: CPU Processor Load */}
        <TelemetryCard title="On-board CPU Overhead (%)" dataKey="cpuUsage" stroke="#A855F7" glowId="cpuGlow" />

        {/* Chart 5: Solar Panel Output */}
        <TelemetryCard title="Solar Bus Output (Watts)" dataKey="solarOutput" stroke="#EAB308" glowId="solarGlow" />

        {/* Chart 6: Communication Signal */}
        <TelemetryCard title="Uplink Signal Strength (dBm)" dataKey="signalStrength" stroke="#22C55E" glowId="sigGlow" />
      </div>
    </div>
  );

  // Inner reusable sub-component mapping standard chart layouts
  function TelemetryCard({
    title,
    dataKey,
    stroke,
    glowId,
  }: {
    title: string;
    dataKey: string;
    stroke: string;
    glowId: string;
  }) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-44 pt-1 font-mono text-[9px]">
          {activeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id={glowId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stroke} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={stroke} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#334155" tickLine={false} />
                <YAxis stroke="#334155" tickLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#050B14",
                    border: "1px solid #1E293B",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "9px",
                    color: "#E2E8F0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={stroke}
                  fillOpacity={1}
                  fill={`url(#${glowId})`}
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-650 uppercase tracking-widest text-[9px]">
              Buffering stream...
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
}
