"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSocket } from "@/hooks/use-socket";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/components/layout/auth-context";
import { TelemetryChart } from "@/components/dashboard/telemetry-chart";
import {
  Activity,
  Database,
  BatteryCharging,
  Flame,
  Radio,
  AlertTriangle,
  CheckCircle,
  Bell,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MissionControlDashboard() {
  const { socket, connected } = useSocket();
  const { hasPermission } = useAuth();

  // Core metrics state
  const [stats, setStats] = useState({
    activeSatellites: 84,
    totalMissions: 12,
    orbitHealth: 98.4,
    signalStrength: 94,
    batteryHealth: 91.2,
    fuelCapacity: 76.5,
  });

  const [missionStatus, setMissionStatus] = useState<"GREEN" | "YELLOW" | "RED">("GREEN");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [alertFilter, setAlertFilter] = useState<"ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "ALL">("ACTIVE");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  // Fetch alerts from REST API
  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const params = new URLSearchParams();
      if (alertFilter !== "ALL") params.append("status", alertFilter);
      if (severityFilter !== "ALL") params.append("severity", severityFilter);

      const res = await fetch(`/api/alerts?${params.toString()}`);
      const payload = await res.json();
      setAlerts(payload.data || []);
    } catch (e) {
      console.error("Failed to load operations alerts", e);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Re-fetch alerts when filters change
  useEffect(() => {
    fetchAlerts();
  }, [alertFilter, severityFilter]);

  // Acknowledge target alarm
  const handleAcknowledge = async (alertId: string, action: "ACKNOWLEDGE" | "RESOLVE") => {
    if (!hasPermission("OPERATOR")) {
      alert("Operational Security Override Blocked: Operator level authorization required.");
      return;
    }
    
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, action }),
      });
      const payload = await res.json();
      if (payload.success) {
        // Refresh alert listing
        fetchAlerts();
      }
    } catch (e) {
      console.error("Failed to process alarm acknowledgment", e);
    }
  };

  // Simulated live fluctuating telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        signalStrength: Math.max(88, Math.min(99, prev.signalStrength + (Math.random() * 2 - 1))),
        orbitHealth: Math.max(95, Math.min(100, prev.orbitHealth + (Math.random() * 0.2 - 0.1))),
        batteryHealth: Math.max(80, Math.min(98, prev.batteryHealth + (Math.random() * 0.4 - 0.2))),
        fuelCapacity: Math.max(20, Math.min(100, prev.fuelCapacity - 0.001)),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Alert analytics summary
  const alertSummary = useMemo(() => {
    const critical = alerts.filter((a) => a.severity === "CRITICAL").length;
    const high = alerts.filter((a) => a.severity === "HIGH").length;
    const medium = alerts.filter((a) => a.severity === "MEDIUM").length;
    return { critical, high, medium };
  }, [alerts]);

  return (
    <div className="space-y-6">
      {/* Dashboard Top Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <div className="text-xs font-mono uppercase text-accent tracking-widest">
            ACOC Operations Hub
          </div>
          <h1 className="text-2xl font-black font-mono tracking-wider text-slate-100 uppercase mt-0.5">
            Mission Control Center
          </h1>
        </div>

        {/* Global Mission Alarm System */}
        <div className="flex items-center gap-4 bg-slate-950/60 p-2.5 rounded border border-slate-800 font-mono">
          <span className="text-xs text-slate-500 uppercase font-semibold">Global Status:</span>
          <div className="flex gap-2">
            {(["GREEN", "YELLOW", "RED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  if (!hasPermission("OPERATOR")) {
                    alert("Operational Security Override Blocked: Operator level authorization required.");
                    return;
                  }
                  setMissionStatus(status);
                }}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded border transition-all",
                  status === "GREEN" &&
                    (missionStatus === "GREEN"
                      ? "bg-success/15 border-success text-success shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"),
                  status === "YELLOW" &&
                    (missionStatus === "YELLOW"
                      ? "bg-warning/15 border-warning text-warning shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"),
                  status === "RED" &&
                    (missionStatus === "RED"
                      ? "bg-critical/15 border-critical text-critical shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                      : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300")
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Row 1: Key Metadata counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <Card variant="accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-0">
            <CardTitle>Active Satellites</CardTitle>
            <Radio className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-100">
              {stats.activeSatellites} <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
              Uplink streams running
            </p>
          </CardContent>
        </Card>

        <Card variant="accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-0">
            <CardTitle>Total Missions</CardTitle>
            <Database className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-100">
              {stats.totalMissions}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
              2 launching next month
            </p>
          </CardContent>
        </Card>

        <Card
          variant={
            stats.orbitHealth > 98 ? "accent" : stats.orbitHealth > 95 ? "warning" : "critical"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-0">
            <CardTitle>Orbit Health</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-100">
              {stats.orbitHealth.toFixed(2)}%
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
              All trajectory planes nominal
            </p>
          </CardContent>
        </Card>

        <Card variant="critical">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-0">
            <CardTitle>Active Alarms</CardTitle>
            <AlertTriangle className="h-4 w-4 text-critical animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-100">
              {alertSummary.critical} <span className="text-xs text-slate-500">Critical</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
              {alertSummary.high + alertSummary.medium} pending warnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Row 2: Charts and Detailed Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry charts widget */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-100">Real-Time Telemetry Stream</CardTitle>
            <CardDescription>Live Uplink Signal VS. On-board Computer Load</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <TelemetryChart />
          </CardContent>
          <CardFooter className="justify-between">
            <span>Uplink Frequency: 12.45 GHz</span>
            <span>Refreshes: 1s interval</span>
          </CardFooter>
        </Card>

        {/* Fleet Allocation widget */}
        <Card>
          <CardHeader>
            <CardTitle>Subsystem Allocation</CardTitle>
            <CardDescription>Fleet capacity calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <BatteryCharging className="h-3.5 w-3.5 text-accent" /> Avg Battery Charge
                </span>
                <span className="text-slate-200 font-bold">
                  {stats.batteryHealth.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded overflow-hidden border border-slate-800">
                <div
                  className="bg-accent h-full transition-all duration-1000 shadow-[0_0_5px_#3B82F6]"
                  style={{ width: `${stats.batteryHealth}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Flame className="h-3.5 w-3.5 text-warning" /> Fleet Fuel Reserves
                </span>
                <span className="text-slate-200 font-bold">{stats.fuelCapacity.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded overflow-hidden border border-slate-800">
                <div
                  className="bg-warning h-full transition-all duration-1000 shadow-[0_0_5px_#F59E0B]"
                  style={{ width: `${stats.fuelCapacity}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
          <CardFooter>Average consumption: 0.001%/s</CardFooter>
        </Card>
      </div>

      {/* Grid Row 3: Alert Center Workspace */}
      <Card variant="critical">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-4">
          <div>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-critical animate-pulse" /> Mission Alert Center
            </CardTitle>
            <CardDescription>Uplink alarms registry and operational history logs</CardDescription>
          </div>

          {/* Filtering bar */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Status Select */}
            <div className="flex bg-slate-950 border border-slate-800 p-1 rounded">
              <button
                onClick={() => setAlertFilter("ACTIVE")}
                className={cn(
                  "px-2.5 py-0.5 rounded transition-all",
                  alertFilter === "ACTIVE" ? "bg-critical-muted text-critical font-bold" : "text-slate-500 hover:text-slate-300"
                )}
              >
                ACTIVE
              </button>
              <button
                onClick={() => setAlertFilter("ACKNOWLEDGED")}
                className={cn(
                  "px-2.5 py-0.5 rounded transition-all",
                  alertFilter === "ACKNOWLEDGED" ? "bg-warning-muted text-warning font-bold" : "text-slate-500 hover:text-slate-300"
                )}
              >
                ACKED
              </button>
              <button
                onClick={() => setAlertFilter("RESOLVED")}
                className={cn(
                  "px-2.5 py-0.5 rounded transition-all",
                  alertFilter === "RESOLVED" ? "bg-success-muted text-success font-bold" : "text-slate-500 hover:text-slate-300"
                )}
              >
                RESOLVED
              </button>
              <button
                onClick={() => setAlertFilter("ALL")}
                className={cn(
                  "px-2.5 py-0.5 rounded transition-all",
                  alertFilter === "ALL" ? "bg-slate-900 text-slate-200 font-bold" : "text-slate-500 hover:text-slate-300"
                )}
              >
                ALL
              </button>
            </div>

            {/* Severity Select */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded py-1 px-2.5 text-slate-350 outline-none cursor-pointer"
            >
              <option value="ALL">ALL SEVERITY</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 border-t border-slate-800 bg-slate-950/20">
          <div className="divide-y divide-slate-850 font-mono text-xs">
            {loadingAlerts ? (
              <div className="p-8 text-center text-slate-500">Querying alarm segments...</div>
            ) : alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/10"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.2 rounded text-[8px] font-extrabold border uppercase",
                          alert.severity === "CRITICAL" && "bg-critical/15 border-critical/30 text-critical animate-pulse",
                          alert.severity === "HIGH" && "bg-critical-muted border-critical/10 text-critical",
                          alert.severity === "MEDIUM" && "bg-warning/15 border-warning/30 text-warning",
                          alert.severity === "LOW" && "bg-slate-950 border-slate-800 text-slate-500"
                        )}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-accent font-bold">{alert.satelliteId}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(alert.createdAt).toLocaleTimeString()} ({alert.type})
                      </span>
                    </div>
                    <p className="text-slate-200 text-xs">{alert.message}</p>
                  </div>

                  {/* Actions buttons */}
                  {alert.status === "ACTIVE" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcknowledge(alert.id, "ACKNOWLEDGE")}
                        className="px-3 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-accent font-bold text-[10px] rounded transition-all"
                      >
                        ACKNOWLEDGE
                      </button>
                      <button
                        onClick={() => handleAcknowledge(alert.id, "RESOLVE")}
                        className="px-3 py-1 bg-success/15 border border-success/30 hover:bg-success/20 text-success font-bold text-[10px] rounded transition-all"
                      >
                        RESOLVE
                      </button>
                    </div>
                  )}
                  {alert.status === "ACKNOWLEDGED" && (
                    <div className="flex items-center gap-2">
                      <span className="text-warning text-[10px] font-semibold">ACKNOWLEDGED</span>
                      <button
                        onClick={() => handleAcknowledge(alert.id, "RESOLVE")}
                        className="px-3 py-1 bg-success/15 border border-success/30 hover:bg-success/20 text-success font-bold text-[10px] rounded transition-all"
                      >
                        RESOLVE
                      </button>
                    </div>
                  )}
                  {alert.status === "RESOLVED" && (
                    <span className="text-success text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> RESOLVED
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">No active alerts fit this query.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
