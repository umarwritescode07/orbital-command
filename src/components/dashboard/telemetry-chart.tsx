"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface TelemetryData {
  time: string;
  signal: number;
  cpu: number;
}

export function TelemetryChart() {
  const [data, setData] = useState<TelemetryData[]>([]);

  // Generate rolling mock data for chart
  useEffect(() => {
    // Generate initial history
    const initialData: TelemetryData[] = [];
    const now = new Date();
    for (let i = 19; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 1000);
      initialData.push({
        time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        signal: 85 + Math.random() * 10,
        cpu: 25 + Math.random() * 15,
      });
    }
    setData(initialData);

    const interval = setInterval(() => {
      setData((prev) => {
        const nextTime = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const newPoint = {
          time: nextTime,
          signal: Math.max(60, Math.min(100, (prev[prev.length - 1]?.signal || 90) + (Math.random() * 6 - 3))),
          cpu: Math.max(10, Math.min(95, (prev[prev.length - 1]?.cpu || 35) + (Math.random() * 10 - 5))),
        };
        return [...prev.slice(1), newPoint];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-48 w-full font-mono text-[10px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="signalGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="cpuGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#475569" tickLine={false} />
          <YAxis stroke="#475569" tickLine={false} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#050B14",
              border: "1px solid #1E293B",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "10px",
              color: "#E2E8F0",
            }}
          />
          <Area
            name="Signal Uplink (%)"
            type="monotone"
            dataKey="signal"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#signalGlow)"
            strokeWidth={1.5}
          />
          <Area
            name="CPU Load (%)"
            type="monotone"
            dataKey="cpu"
            stroke="#F59E0B"
            fillOpacity={1}
            fill="url(#cpuGlow)"
            strokeWidth={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
