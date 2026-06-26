import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { satellites } from "@/lib/mock-data";
import { redis } from "@/lib/redis";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const satelliteId = searchParams.get("satelliteId") || "SAT-001";
    const range = searchParams.get("range") || "1h"; // 1h, 24h, 7d, 30d

    // Parse time range parameters into intervals
    let pointsCount = 30;
    let timeScaleMinutes = 2; // intervals between points

    switch (range) {
      case "24h":
        pointsCount = 48;
        timeScaleMinutes = 30;
        break;
      case "7d":
        pointsCount = 50;
        timeScaleMinutes = 200;
        break;
      case "30d":
        pointsCount = 60;
        timeScaleMinutes = 720;
        break;
      case "1h":
      default:
        pointsCount = 30;
        timeScaleMinutes = 2;
        break;
    }

    // 1. WebSocket optimized history lookup from Redis first ( O(N) where N <= 50 )
    try {
      const historyKey = `satellite:${satelliteId}:history`;
      const cachedLogs = await redis.lrange(historyKey, 0, pointsCount - 1);
      
      if (cachedLogs && cachedLogs.length > 0) {
        const data = cachedLogs.map((logStr) => JSON.parse(logStr)).reverse();
        return NextResponse.json({
          source: "redis_cache",
          data,
        });
      }
    } catch (redisErr) {
      console.warn("⚠️ Telemetry cache read bypassed:", redisErr);
    }

    // 2. Try reading from PostgreSQL Database
    try {
      await prisma.$connect();
      
      const dbTelemetry = await prisma.telemetry.findMany({
        where: { satelliteId },
        orderBy: { timestamp: "desc" },
        take: pointsCount,
      });

      if (dbTelemetry.length > 0) {
        return NextResponse.json({
          source: "database",
          data: dbTelemetry.reverse(),
        });
      }
    } catch (e) {
      console.warn("⚠️ Telemetry Database lookup failed, generating dynamic historical playback stream.");
    }

    // 3. Fallback: Generate high-fidelity historical data on-the-fly
    const targetSat = satellites.find((s) => s.id === satelliteId) || satellites[0];
    const data = [];
    const now = Date.now();

    for (let i = pointsCount - 1; i >= 0; i--) {
      const timestamp = new Date(now - i * timeScaleMinutes * 60 * 1000);
      
      data.push({
        id: `TEL-${satelliteId}-${i}`,
        satelliteId: targetSat.id,
        battery: Math.max(10, Math.min(100, targetSat.battery + (Math.random() * 8 - 4))),
        temperature: Math.max(-50, Math.min(120, targetSat.temperature + (Math.random() * 6 - 3))),
        fuel: Math.max(0, Math.min(100, targetSat.fuel - (i * 0.01))),
        cpuUsage: Math.max(5, Math.min(95, targetSat.cpuUsage + (Math.random() * 20 - 10))),
        signalStrength: Math.max(-120, Math.min(-40, targetSat.signalStrength + Math.floor(Math.random() * 10 - 5))),
        solarOutput: Math.max(0, Math.min(2000, targetSat.solarOutput + Math.floor(Math.random() * 100 - 50))),
        velocity: targetSat.velocity,
        altitude: targetSat.altitude,
        timestamp: timestamp.toISOString(),
      });
    }

    return NextResponse.json({
      source: "mock_fallback",
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
