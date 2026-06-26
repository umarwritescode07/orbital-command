import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { satellites, alerts } from "@/lib/mock-data";
import { SatelliteStatus, OrbitType, AlertSeverity } from "@/lib/prisma-enums";

export async function GET() {
  try {
    let source = "database";
    let data: any = null;

    // Try compiling stats from database
    try {
      await prisma.$connect();

      // 1. Fleet Health breakdown
      const statusCounts = await prisma.satellite.groupBy({
        by: ["status"],
        _count: { _all: true },
      });

      const avgMetrics = await prisma.satellite.aggregate({
        _avg: {
          fuel: true,
          battery: true,
          cpuUsage: true,
          temperature: true,
          signalStrength: true,
          solarOutput: true,
        },
        _count: {
          _all: true,
        },
      });

      // 2. Mission Analytics
      const dbMissions = await prisma.mission.findMany({
        include: {
          satellites: true,
        },
      });

      const missionsList = dbMissions.map((m) => {
        const totalSats = m.satellites.length;
        const activeSats = m.satellites.filter((s) => s.status === "ACTIVE").length;
        const coverage = totalSats > 0 ? (activeSats / totalSats) * 100 : 0;
        return {
          name: m.name,
          status: m.status,
          satelliteCount: totalSats,
          coverage: parseFloat(coverage.toFixed(1)),
        };
      });

      // 3. Orbit Distribution
      const orbitGroups = await prisma.satellite.groupBy({
        by: ["orbit"],
        _count: { _all: true },
        _avg: {
          altitude: true,
        },
      });

      // 4. Alert stats
      const severityCounts = await prisma.alert.groupBy({
        by: ["severity"],
        _count: { _all: true },
      });

      // Assemble db-driven payload
      data = {
        fleetHealth: {
          total: avgMetrics._count._all,
          active: statusCounts.find((s) => s.status === "ACTIVE")?._count._all || 0,
          anomalous: statusCounts.find((s) => s.status === "ANOMALOUS")?._count._all || 0,
          inactive: statusCounts.find((s) => s.status === "INACTIVE")?._count._all || 0,
          decommissioned: statusCounts.find((s) => s.status === "DECOMMISSIONED")?._count._all || 0,
          avgBattery: parseFloat((avgMetrics._avg.battery || 0).toFixed(1)),
          avgFuel: parseFloat((avgMetrics._avg.fuel || 0).toFixed(1)),
          avgCpu: parseFloat((avgMetrics._avg.cpuUsage || 0).toFixed(1)),
          avgTemp: parseFloat((avgMetrics._avg.temperature || 0).toFixed(1)),
          avgSignal: parseFloat((avgMetrics._avg.signalStrength || 0).toFixed(1)),
          avgSolar: Math.floor(avgMetrics._avg.solarOutput || 0),
        },
        missions: missionsList,
        orbitDistribution: orbitGroups.map((o) => ({
          name: o.orbit === "LEO" ? "LEO (Low)" : o.orbit === "MEO" ? "MEO (Mid)" : "GEO (Geosync)",
          value: o._count._all,
          avgAltitude: Math.floor(o._avg.altitude || 0),
        })),
        alertSeverity: severityCounts.map((s) => ({
          name: s.severity,
          value: s._count._all,
        })),
      };
    } catch (e) {
      console.warn("⚠️ Analytics Database lookup failed. Serving mock aggregates.");
      source = "mock_fallback";
    }

    // Fallback Mock Compilation
    if (source === "mock_fallback" || !data) {
      const total = satellites.length;
      const active = satellites.filter((s) => s.status === "ACTIVE").length;
      const anomalous = satellites.filter((s) => s.status === "ANOMALOUS").length;
      const inactive = satellites.filter((s) => s.status === "INACTIVE").length;
      const decommissioned = satellites.filter((s) => s.status === "DECOMMISSIONED").length;

      const totalFuel = satellites.reduce((acc, s) => acc + s.fuel, 0);
      const totalBattery = satellites.reduce((acc, s) => acc + s.battery, 0);
      const totalCpu = satellites.reduce((acc, s) => acc + s.cpuUsage, 0);
      const totalTemp = satellites.reduce((acc, s) => acc + s.temperature, 0);
      const totalSignal = satellites.reduce((acc, s) => acc + s.signalStrength, 0);
      const totalSolar = satellites.reduce((acc, s) => acc + s.solarOutput, 0);

      // Distribute fuel ranges for O(1) grid display
      const fuelCritical = satellites.filter((s) => s.fuel < 20).length;
      const fuelLow = satellites.filter((s) => s.fuel >= 20 && s.fuel < 50).length;
      const fuelNominal = satellites.filter((s) => s.fuel >= 50 && s.fuel < 80).length;
      const fuelFull = satellites.filter((s) => s.fuel >= 80).length;

      // Mock missions list
      const mockMissions = [
        { name: "Project Artemis Echo", status: "ACTIVE", satelliteCount: 420, coverage: 99.4 },
        { name: "Sentinel-9 Climate Array", status: "ACTIVE", satelliteCount: 280, coverage: 98.1 },
        { name: "GPS Epoch III Operational", status: "ACTIVE", satelliteCount: 220, coverage: 99.9 },
        { name: "Galileo Expansion Orbit", status: "PLANNING", satelliteCount: 80, coverage: 45.0 },
      ];

      // Orbit counts
      const LEO = satellites.filter((s) => s.orbit === "LEO").length;
      const MEO = satellites.filter((s) => s.orbit === "MEO").length;
      const GEO = satellites.filter((s) => s.orbit === "GEO").length;

      // Alert severity counts
      const CRITICAL = alerts.filter((a) => a.severity === "CRITICAL").length;
      const HIGH = alerts.filter((a) => a.severity === "HIGH").length;
      const MEDIUM = alerts.filter((a) => a.severity === "MEDIUM").length;
      const LOW = alerts.filter((a) => a.severity === "LOW").length;

      data = {
        fleetHealth: {
          total,
          active,
          anomalous,
          inactive,
          decommissioned,
          avgBattery: parseFloat((totalBattery / total).toFixed(1)),
          avgFuel: parseFloat((totalFuel / total).toFixed(1)),
          avgCpu: parseFloat((totalCpu / total).toFixed(1)),
          avgTemp: parseFloat((totalTemp / total).toFixed(1)),
          avgSignal: parseFloat((totalSignal / total).toFixed(1)),
          avgSolar: Math.floor(totalSolar / total),
        },
        missions: mockMissions,
        orbitDistribution: [
          { name: "LEO (Low)", value: LEO, avgAltitude: 520 },
          { name: "MEO (Mid)", value: MEO, avgAltitude: 20200 },
          { name: "GEO (Geosync)", value: GEO, avgAltitude: 35786 },
        ],
        alertSeverity: [
          { name: "CRITICAL", value: CRITICAL },
          { name: "HIGH", value: HIGH },
          { name: "MEDIUM", value: MEDIUM },
          { name: "LOW", value: LOW },
        ],
        fuelRanges: [
          { name: "Critical (<20%)", count: fuelCritical },
          { name: "Low (20-50%)", count: fuelLow },
          { name: "Nominal (50-80%)", count: fuelNominal },
          { name: "Full (>80%)", count: fuelFull },
        ],
      };
    }

    // 4. Generate 14-day alert trend metrics programmatically
    const alertTrends = [];
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now - i * 24 * 3600 * 1000);
      alertTrends.push({
        day: date.toLocaleDateString([], { month: "short", day: "numeric" }),
        CRITICAL: Math.max(0, Math.floor(Math.random() * 4 - 1)), // small values
        HIGH: Math.floor(Math.random() * 6 + 1),
        MEDIUM: Math.floor(Math.random() * 12 + 3),
        LOW: Math.floor(Math.random() * 20 + 5),
      });
    }

    return NextResponse.json({
      source,
      data: {
        ...data,
        alertTrends,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
