import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
  const statusReport = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    services: {
      database: { status: "online", latencyMs: 0 },
      redis: { status: "online", latencyMs: 0 },
    },
  };

  let isDegraded = false;

  // 1. Check PostgreSQL Database Connection
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    statusReport.services.database.latencyMs = Date.now() - dbStart;
  } catch (err) {
    statusReport.services.database.status = "offline";
    statusReport.services.database.latencyMs = -1;
    isDegraded = true;
  }

  // 2. Check Redis Cache Connection
  const redisStart = Date.now();
  try {
    const pingRes = await redis.ping();
    if (pingRes !== "PONG") {
      throw new Error("Invalid Redis ping response");
    }
    statusReport.services.redis.latencyMs = Date.now() - redisStart;
  } catch (err) {
    statusReport.services.redis.status = "offline";
    statusReport.services.redis.latencyMs = -1;
    isDegraded = true;
  }

  // Determine overall status
  if (statusReport.services.database.status === "offline" && statusReport.services.redis.status === "offline") {
    statusReport.status = "unhealthy";
  } else if (isDegraded) {
    statusReport.status = "degraded";
  }

  const statusCode = statusReport.status === "unhealthy" ? 503 : 200;
  return NextResponse.json(statusReport, { status: statusCode });
}
