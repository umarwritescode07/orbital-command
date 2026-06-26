import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { satellites as fallbackSatellites } from "@/lib/mock-data";
import { SatelliteStatus, OrbitType } from "@/lib/prisma-enums";
import { redis } from "@/lib/redis";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const orbit = searchParams.get("orbit") || "ALL";
    const constellation = searchParams.get("constellation") || "ALL";

    let payloadSatellites: any[] = [];
    let source = "database";

    // 1. Attempt to read from PostgreSQL database
    try {
      await prisma.$connect();

      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { id: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ];
      }

      if (status !== "ALL") {
        whereClause.status = status as SatelliteStatus;
      }

      if (orbit !== "ALL") {
        whereClause.orbit = orbit as OrbitType;
      }

      if (constellation !== "ALL") {
        whereClause.constellationId = constellation;
      }

      payloadSatellites = await prisma.satellite.findMany({
        where: whereClause,
        orderBy: { id: "asc" },
      });
    } catch (dbError) {
      console.warn("⚠️ PostgreSQL database unreachable. Falling back to local mock data registry.");
      source = "mock_fallback";
      
      // Fallback local memory search & filter logic
      let filtered = [...fallbackSatellites];

      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (sat) =>
            sat.id.toLowerCase().includes(query) ||
            sat.name.toLowerCase().includes(query)
        );
      }

      if (status !== "ALL") {
        filtered = filtered.filter((sat) => sat.status === status);
      }

      if (orbit !== "ALL") {
        filtered = filtered.filter((sat) => sat.orbit === orbit);
      }

      if (constellation !== "ALL") {
        filtered = filtered.filter((sat) => sat.constellationId === constellation);
      }

      payloadSatellites = filtered.map((s) => ({ ...s }));
    }

    // 2. Fetch live telemetry metrics from Redis Cache and merge on-the-fly
    try {
      const liveData = await redis.hgetall("telemetry:latest");
      
      if (liveData && Object.keys(liveData).length > 0) {
        payloadSatellites = payloadSatellites.map((sat) => {
          const cachedFrameStr = liveData[sat.id];
          if (cachedFrameStr) {
            try {
              const frame = JSON.parse(cachedFrameStr);
              return {
                ...sat,
                battery: frame.battery ?? sat.battery,
                fuel: frame.fuel ?? sat.fuel,
                temperature: frame.temperature ?? sat.temperature,
                cpuUsage: frame.cpuUsage ?? sat.cpuUsage,
                signalStrength: frame.signalStrength ?? sat.signalStrength,
                solarOutput: frame.solarOutput ?? sat.solarOutput,
                // Make sure state is updated if battery is drained
                status: frame.battery <= 0 ? "DECOMMISSIONED" : sat.status,
              };
            } catch (jsonErr) {
              // ignore formatting error and use original
            }
          }
          return sat;
        });
      }
    } catch (redisErr) {
      console.warn("⚠️ Live telemetry Redis merge bypassed:", redisErr);
    }

    // 3. Ensure inclination plane is defined for WebGL coordinate systems mapping
    payloadSatellites = payloadSatellites.map((sat) => ({
      ...sat,
      inclination: (sat as any).inclination ?? (sat.orbit === "LEO" ? 45 : sat.orbit === "MEO" ? 55 : 0),
    }));

    return NextResponse.json({
      source,
      data: payloadSatellites,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
