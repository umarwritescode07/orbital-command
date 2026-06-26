"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/layout/auth-context";
import {
  Terminal,
  Compass,
  Activity,
  Network,
  ShieldAlert,
  Orbit,
  Bot,
  BarChart3,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Radio,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { name: "Mission Control", href: "/dashboard", icon: Terminal },
    { name: "Satellite Tracker", href: "/tracker", icon: Compass },
    { name: "Telemetry Center", href: "/telemetry", icon: Activity },
    { name: "Constellation Manager", href: "/constellations", icon: Network },
    { name: "Space Debris", href: "/debris", icon: ShieldAlert },
    { name: "Orbital Simulator", href: "/simulator", icon: Orbit },
    { name: "AI Flight Director", href: "/flight-director", icon: Bot },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings2 },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card/45 backdrop-blur-md transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-4 -right-3 bg-slate-900 border border-border text-slate-400 hover:text-accent rounded-full p-1 z-50 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
      </button>

      {/* Connection status header */}
      <div className="p-4 border-b border-border flex items-center justify-between overflow-hidden">
        {!collapsed && (
          <div className="flex flex-col font-mono text-[10px] uppercase tracking-wider text-slate-500">
            <span>Uplink Status</span>
            <span className="text-success flex items-center gap-1.5 font-bold mt-1">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
              Secure Link
            </span>
          </div>
        )}
        <div className={cn("flex items-center justify-center text-slate-400", collapsed && "mx-auto")}>
          <Radio className="h-4 w-4 animate-pulse text-accent" />
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded font-mono text-sm transition-all duration-200 group relative",
                isActive
                  ? "bg-accent/10 text-accent font-bold border-l-2 border-accent shadow-[0_0_15px_rgba(59, 130, 246,0.05)]"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isActive ? "text-accent" : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              {!collapsed && <span className="truncate">{item.name}</span>}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <span className="absolute left-16 bg-slate-900 border border-border text-slate-200 text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap font-mono shadow-xl">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Operator profile & logout footer */}
      <div className="p-3 border-t border-border font-mono text-[10px] space-y-2 bg-slate-950/20">
        {!collapsed && user && (
          <div className="space-y-1.5">
            <div className="text-[9px] uppercase text-slate-500">Active Operator</div>
            <div className="text-slate-200 font-bold truncate">{user.name}</div>
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider",
                user.role === "ADMIN" && "bg-critical/10 border-critical/30 text-critical shadow-[0_0_10px_rgba(239,68,68,0.1)]",
                user.role === "OPERATOR" && "bg-warning/10 border-warning/30 text-warning",
                user.role === "VIEWER" && "bg-slate-800 border-slate-700 text-slate-400"
              )}>
                {user.role}
              </span>
              <button
                onClick={logout}
                className="text-slate-500 hover:text-critical transition-all flex items-center gap-1 hover:underline"
                title="Disconnect terminal session"
              >
                <LogOut className="h-3 w-3" /> Sign Out
              </button>
            </div>
          </div>
        )}
        {collapsed && user && (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center p-2 rounded text-slate-500 hover:bg-slate-800 hover:text-critical transition-all"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
