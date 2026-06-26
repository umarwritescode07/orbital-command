"use client";

import { useState, useEffect } from "react";
import { Bell, Search, User, ShieldAlert, Cpu, Power } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [currentTime, setCurrentTime] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Live time ticker in UTC (aerospace standard)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcString = now.toISOString().replace("T", " ").substring(0, 19) + " UTC";
      setCurrentTime(utcString);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mock initial alerts
  const notifications = [
    {
      id: "1",
      type: "FUEL_LEAK",
      satellite: "ORBIT-X12",
      severity: "CRITICAL",
      time: "2m ago",
      msg: "Pressure drop detected in Fuel Tank Alpha.",
    },
    {
      id: "2",
      type: "THERMAL_ANOMALY",
      satellite: "HELIOS-4",
      severity: "HIGH",
      time: "15m ago",
      msg: "Core sensor reading 98°C (threshold 85°C).",
    },
    {
      id: "3",
      type: "COMM_FAILURE",
      satellite: "STAR-C02",
      severity: "MEDIUM",
      time: "32m ago",
      msg: "Telemetry drop on Band-Ku frequency.",
    },
  ];

  return (
    <header className="h-16 border-b border-border bg-card/45 backdrop-blur-md flex items-center justify-between px-6 z-40 relative">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded border border-accent/40 bg-accent-muted/10 flex items-center justify-center relative shadow-[0_0_10px_rgba(59, 130, 246,0.2)]">
          <Cpu className="h-4.5 w-4.5 text-accent" />
          <div className="absolute inset-0 bg-accent/10 opacity-30 animate-pulse rounded"></div>
        </div>
        <Link href="/dashboard" className="flex flex-col">
          <span className="font-mono text-base font-bold tracking-wider text-slate-100 uppercase">
            Orbital Command
          </span>
          <span className="text-[9px] font-mono tracking-widest text-accent uppercase -mt-0.5">
            Mission Operations Center
          </span>
        </Link>
      </div>

      {/* Center metadata & search bar */}
      <div className="flex-1 max-w-xl mx-8 hidden md:flex items-center gap-4">
        {/* Mock Global Command Input */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Execute operational command or search satellite payload..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 rounded py-1.5 pl-9 pr-4 font-mono text-xs text-slate-300 placeholder-slate-600 transition-all outline-none"
          />
        </div>
      </div>

      {/* Right control utilities */}
      <div className="flex items-center gap-6">
        {/* Aerospace standard clock */}
        <div className="hidden lg:flex flex-col items-end font-mono text-xs">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Mission Time</span>
          <span className="text-accent font-bold tracking-wide mt-0.5">{currentTime}</span>
        </div>

        {/* System Status Light */}
        <div className="flex items-center gap-2 border-l border-slate-850 pl-6">
          <span className="text-[10px] font-mono text-slate-500 uppercase hidden sm:inline">
            ACOC Sys:
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xs bg-success-muted/5 border border-success/15 px-2.5 py-1 rounded text-success">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
            NOMINAL
          </span>
        </div>

        {/* Notifications alarm trigger */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className={cn(
              "p-2 text-slate-400 hover:text-accent rounded border border-transparent hover:border-slate-850 hover:bg-slate-900/40 transition-all relative",
              notificationsOpen && "text-accent border-slate-850 bg-slate-900/40"
            )}
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-critical rounded-full animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-critical rounded-full"></span>
          </button>

          {/* Alarm Notifications Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 glass-card border-border rounded-lg shadow-2xl z-50 p-4 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                <span className="text-xs uppercase text-slate-400 font-bold">Active Alarms</span>
                <span className="text-[10px] bg-critical/10 text-critical border border-critical/20 px-1.5 py-0.5 rounded">
                  3 Alerting
                </span>
              </div>
              <div className="space-y-3.5 max-h-64 overflow-y-auto">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 border border-slate-800/80 rounded bg-slate-950/40 hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-accent font-bold">{item.satellite}</span>
                      <span
                        className={cn(
                          "px-1 py-0.2 rounded font-extrabold text-[8px]",
                          item.severity === "CRITICAL"
                            ? "bg-critical-muted text-critical"
                            : "bg-warning-muted text-warning"
                        )}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-normal">{item.msg}</p>
                    <div className="text-[9px] text-slate-500 text-right mt-1.5">{item.time}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-3.5 pt-2 text-center">
                <Link
                  href="/dashboard"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[10px] text-accent hover:underline block uppercase tracking-wider font-bold"
                >
                  View Operational Logs
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Operator profile info */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 p-1.5 text-slate-400 hover:text-accent rounded border border-slate-800 bg-slate-950/60 transition-all",
              profileOpen && "text-accent border-accent/30"
            )}
          >
            <div className="w-5.5 h-5.5 rounded-full bg-accent/20 flex items-center justify-center">
              <User className="h-3 w-3 text-accent" />
            </div>
            <span className="text-xs font-mono hidden sm:inline text-slate-300">OP-ALPHA</span>
          </button>

          {/* Profile detailed card */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-card border-border rounded-lg shadow-2xl z-50 p-4 font-mono">
              <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
                <div className="w-10 h-10 rounded-full bg-accent-muted/20 border border-accent/30 flex items-center justify-center">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-200 font-bold">Commander Alpha</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                    Chief Flight Director
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400 pb-3 border-b border-border">
                <div className="flex justify-between">
                  <span>Clearance:</span>
                  <span className="text-accent font-bold">SEC-LVL-4</span>
                </div>
                <div className="flex justify-between">
                  <span>Console ID:</span>
                  <span className="text-slate-300">MCC-HOU-4A</span>
                </div>
                <div className="flex justify-between">
                  <span>Session Length:</span>
                  <span className="text-slate-300">04:12:44</span>
                </div>
              </div>

              <button
                onClick={() => alert("Closing secure session uplink...")}
                className="w-full mt-3.5 py-1.5 bg-critical/15 hover:bg-critical/20 border border-critical/30 rounded flex items-center justify-center gap-2 text-critical text-xs transition-colors font-bold uppercase tracking-wider"
              >
                <Power className="h-3.5 w-3.5" />
                Terminate Link
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
