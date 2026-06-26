"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Activity,
  BarChart3,
  TrendingUp,
  Battery,
  Flame,
  AlertTriangle,
  Compass,
  RefreshCw,
  Target,
  Signal,
  Sun,
  Shield,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalyticsCenterPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch compiled analytics from backend API
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      const payload = await res.json();
      setData(payload.data);
    } catch (e) {
      console.error("Failed to load analytics summaries", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Generate 30-day simulated historical trend for battery, fuel and solar averages
  const trendsData = useMemo(() => {
    const points = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 24 * 3600 * 1000);
      const randomSeed = Math.random();
      points.push({
        day: date.toLocaleDateString([], { month: "short", day: "numeric" }),
        battery: parseFloat((90.5 - (29 - i) * 0.04 + randomSeed * 2.5).toFixed(1)),
        fuel: parseFloat((78.2 - (29 - i) * 0.08 + randomSeed * 1.5).toFixed(1)),
        solarOutput: Math.floor(820 + (29 - i) * 1.5 + Math.sin(i / 2) * 50 + randomSeed * 40),
      });
    }
    return points;
  }, []);

  // Theme palettes matching cockpit style
  const SEVERITY_COLORS = ["#EF4444", "#F97316", "#F59E0B", "#3B82F6"]; // Critical, High, Medium, Low
  const ORBIT_COLORS = ["#3B82F6", "#A855F7", "#EC4899"]; // LEO, MEO, GEO
  const FUEL_COLORS = ["#EF4444", "#F59E0B", "#3B82F6", "#22C55E"]; // Critical, Low, Nominal, Full

  return (
    <div className="space-y-6">
      {/* Header operations bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <div className="text-xs font-mono uppercase text-accent tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            ACOC Fleet Diagnostics Deck
          </div>
          <h1 className="text-2xl font-black font-mono tracking-wider text-slate-100 uppercase mt-0.5">
            Operational Analytics Center
          </h1>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded text-slate-400 hover:text-slate-200 transition-all font-mono text-xs flex items-center gap-2"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-accent")} />
          Reload Analytics
        </button>
      </div>

      {loading ? (
        /* Processing load screen */
        <div className="h-[450px] flex flex-col items-center justify-center border border-slate-800 bg-slate-900/10 rounded-lg relative scanlines overflow-hidden">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-500 mt-4 uppercase tracking-widest">
            Compiling Fleet-Wide Aggregate Telemetry Matrices...
          </span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* Dashboard 1: Fleet Health Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <Card variant="accent">
              <CardContent className="pt-4 space-y-1">
                <span className="text-slate-500 uppercase flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-accent" /> Fleet Registry
                </span>
                <div className="text-2xl font-bold text-slate-100">
                  {data.fleetHealth.total}{" "}
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({data.fleetHealth.active} Active)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card variant="accent">
              <CardContent className="pt-4 space-y-1">
                <span className="text-slate-500 uppercase flex items-center gap-1.5">
                  <Battery className="h-3.5 w-3.5 text-accent" /> Battery Capacity
                </span>
                <div className="text-2xl font-bold text-slate-100">{data.fleetHealth.avgBattery}%</div>
              </CardContent>
            </Card>

            <Card variant="accent">
              <CardContent className="pt-4 space-y-1">
                <span className="text-slate-500 uppercase flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-warning" /> Propellant Level
                </span>
                <div className="text-2xl font-bold text-slate-100">{data.fleetHealth.avgFuel}%</div>
              </CardContent>
            </Card>

            <Card variant={data.fleetHealth.anomalous > 0 ? "critical" : "success"}>
              <CardContent className="pt-4 space-y-1">
                <span className="text-slate-500 uppercase flex items-center gap-1.5">
                  <AlertTriangle className={cn("h-3.5 w-3.5", data.fleetHealth.anomalous > 0 && "animate-pulse text-critical")} /> Anomaly Rate
                </span>
                <div className="text-2xl font-bold text-slate-100">
                  {((data.fleetHealth.anomalous / data.fleetHealth.total) * 100).toFixed(1)}%
                  <span className="text-[10px] text-slate-500 font-normal ml-2">
                    ({data.fleetHealth.anomalous} units)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <Card>
              <CardContent className="p-3.5 flex justify-between items-center">
                <span className="text-slate-500 uppercase">Avg Temperature</span>
                <span className="text-slate-200 font-bold">{data.fleetHealth.avgTemp}°C</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3.5 flex justify-between items-center">
                <span className="text-slate-500 uppercase">Avg Core CPU</span>
                <span className="text-slate-200 font-bold">{data.fleetHealth.avgCpu}%</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3.5 flex justify-between items-center">
                <span className="text-slate-500 uppercase">Signal Strength</span>
                <span className="text-slate-200 font-bold">{data.fleetHealth.avgSignal} dBm</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3.5 flex justify-between items-center">
                <span className="text-slate-500 uppercase">Avg Solar Output</span>
                <span className="text-slate-200 font-bold">{data.fleetHealth.avgSolar} W</span>
              </CardContent>
            </Card>
          </div>

          {/* Primary dashboards splits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Dashboard 2: Mission Analytics */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xs flex items-center gap-2">
                  <Target className="h-4.5 w-4.5 text-accent" /> Active Space Missions
                </CardTitle>
                <CardDescription>Target coverage margins vs payload allocation metrics</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="h-48 pt-2 font-mono text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.missions} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                      <YAxis stroke="#475569" tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#050B14",
                          border: "1px solid #1E293B",
                          borderRadius: "4px",
                          fontFamily: "monospace",
                          fontSize: "9px",
                        }}
                      />
                      <Bar dataKey="satelliteCount" name="Satellites Assigned" fill="#A855F7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="coverage" name="Coverage Score (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Data Grid table */}
                <div className="overflow-x-auto border border-slate-800 bg-slate-900/10 rounded">
                  <table className="w-full text-left font-mono text-[10px]">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                        <th className="py-2 px-3">Mission</th>
                        <th className="py-2 px-3 text-center">Payloads</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-right">Coverage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {data.missions.map((m: any) => (
                        <tr key={m.name} className="hover:bg-slate-900/10">
                          <td className="py-1.5 px-3 text-slate-350">{m.name}</td>
                          <td className="py-1.5 px-3 text-center text-slate-350">{m.satelliteCount}</td>
                          <td className="py-1.5 px-3 text-center">
                            <span className={cn(
                              "px-1 py-0.2 rounded text-[8px] font-bold border",
                              m.status === "ACTIVE" && "bg-success-muted text-success border-success/20",
                              m.status === "PLANNING" && "bg-slate-900 text-slate-400 border-slate-800"
                            )}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right text-accent font-bold">{m.coverage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard 3: Orbit Distribution */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xs flex items-center gap-2">
                  <Layers className="h-4.5 w-4.5 text-accent" /> Orbit Plane Distribution
                </CardTitle>
                <CardDescription>Units counts mapped with average operational altitudes</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="h-48 pt-2 font-mono text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.orbitDistribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                      <YAxis stroke="#475569" tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#050B14",
                          border: "1px solid #1E293B",
                          borderRadius: "4px",
                          fontFamily: "monospace",
                          fontSize: "9px",
                        }}
                      />
                      <Bar dataKey="value" name="Payloads Count" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                        {data.orbitDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={ORBIT_COLORS[index % ORBIT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Orbit Metadata Grid */}
                <div className="grid grid-cols-3 gap-3 font-mono text-[10px]">
                  {data.orbitDistribution.map((o: any, idx: number) => (
                    <div key={o.name} className="p-2.5 border border-slate-800 bg-slate-900/10 rounded space-y-1">
                      <div className="flex items-center gap-1.5 font-bold uppercase text-[9px]" style={{ color: ORBIT_COLORS[idx % ORBIT_COLORS.length] }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ORBIT_COLORS[idx % ORBIT_COLORS.length] }}></span>
                        {o.name.split(" ")[0]}
                      </div>
                      <div className="text-slate-350">Units: <span className="text-slate-100 font-bold">{o.value}</span></div>
                      <div className="text-slate-350">Avg Alt: <span className="text-slate-100 font-bold">{o.avgAltitude} km</span></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dashboard 4: Alert Trends (14-Day Timeline) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-critical animate-pulse" /> 14-Day Chronological Alert Trends
                </CardTitle>
                <CardDescription>Fluctuations of active warnings categorized by severity levels</CardDescription>
              </CardHeader>
              <CardContent className="h-64 pt-2 font-mono text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.alertTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="critTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="highTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="medTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" stroke="#475569" tickLine={false} />
                    <YAxis stroke="#475569" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#050B14",
                        border: "1px solid #1E293B",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        fontSize: "9px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "9px", marginTop: "10px" }} />
                    <Area type="monotone" name="CRITICAL" dataKey="CRITICAL" stroke="#EF4444" fill="url(#critTrend)" strokeWidth={1.5} stackId="1" />
                    <Area type="monotone" name="HIGH" dataKey="HIGH" stroke="#F97316" fill="url(#highTrend)" strokeWidth={1.5} stackId="1" />
                    <Area type="monotone" name="MEDIUM" dataKey="MEDIUM" stroke="#F59E0B" fill="url(#medTrend)" strokeWidth={1.5} stackId="1" />
                    <Area type="monotone" name="LOW" dataKey="LOW" stroke="#3B82F6" fill="transparent" strokeWidth={1} stackId="1" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Dashboard 5: Fuel Trends */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xs flex items-center gap-2">
                  <Flame className="h-4.5 w-4.5 text-warning" /> Propellant Level Distribution
                </CardTitle>
                <CardDescription>Satellites counts matching critical/low/nominal fuel brackets</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {data.fuelRanges ? (
                  <div className="h-48 pt-2 font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={data.fuelRanges} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" stroke="#475569" tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#475569" tickLine={false} width={85} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#050B14",
                            border: "1px solid #1E293B",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            fontSize: "9px",
                          }}
                        />
                        <Bar dataKey="count" name="Satellites" radius={[0, 4, 4, 0]}>
                          {data.fuelRanges.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={FUEL_COLORS[index % FUEL_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-500 font-mono text-xs">
                    Generating Propellant Range Statistics...
                  </div>
                )}
                
                {/* 30-Day Fuel Consumption line */}
                <div className="p-3 border border-slate-800 bg-slate-900/10 rounded space-y-2">
                  <div className="text-[9px] uppercase text-slate-500 tracking-wider font-bold">
                    30-Day Propellant Consumption Path
                  </div>
                  <div className="h-20 font-mono text-[8px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendsData}>
                        <XAxis dataKey="day" hide />
                        <YAxis domain={[70, 80]} hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#050B14",
                            border: "1px solid #1E293B",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            fontSize: "8px",
                          }}
                        />
                        <Line type="monotone" name="Propellant Avg (%)" dataKey="fuel" stroke="#F59E0B" dot={false} strokeWidth={1.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard 6: Battery Trends */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xs flex items-center gap-2">
                  <Battery className="h-4.5 w-4.5 text-accent animate-pulse" /> Battery & Solar Dynamics (30-Day)
                </CardTitle>
                <CardDescription>Correlation between average cell charge ratios and solar output watts</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="h-48 pt-2 font-mono text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendsData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke="#475569" tickLine={false} />
                      <YAxis stroke="#475569" tickLine={false} domain={[80, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#050B14",
                          border: "1px solid #1E293B",
                          borderRadius: "4px",
                          fontFamily: "monospace",
                          fontSize: "9px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "9px" }} />
                      <Line type="monotone" name="Battery Average (%)" dataKey="battery" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Solar output correlation line */}
                <div className="p-3 border border-slate-800 bg-slate-900/10 rounded space-y-2">
                  <div className="text-[9px] uppercase text-slate-500 tracking-wider font-bold">
                    Solar Panel Output Wattage Trend
                  </div>
                  <div className="h-20 font-mono text-[8px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendsData}>
                        <XAxis dataKey="day" hide />
                        <YAxis domain={[750, 950]} hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#050B14",
                            border: "1px solid #1E293B",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            fontSize: "8px",
                          }}
                        />
                        <Line type="monotone" name="Solar Output Avg (W)" dataKey="solarOutput" stroke="#3B82F6" dot={false} strokeWidth={1.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-550 border border-slate-800 bg-slate-900/10 font-mono text-xs rounded">
          Failed to load compiled diagnostic sheets.
        </div>
      )}
    </div>
  );
}
