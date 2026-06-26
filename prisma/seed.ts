import { PrismaClient } from "@prisma/client";
import { constellations, groundStations, satellites, alerts } from "../src/lib/mock-data";
import { hashPassword } from "../src/lib/auth-utils";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Database seeding initialized...");

  // 1. Clean existing records in dependent order
  console.log("🧹 Clearing old database records...");
  await prisma.auditLog.deleteMany({});
  await prisma.anomaly.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.telemetry.deleteMany({});
  await prisma.satellite.deleteMany({});
  await prisma.mission.deleteMany({});
  await prisma.constellation.deleteMany({});
  await prisma.groundStation.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Seed Default Users
  console.log("👤 Seeding default users (Admin, Operator, Viewer)...");
  await prisma.user.create({
    data: {
      email: "admin@orbital.command",
      name: "Flight Director (Admin)",
      role: "ADMIN",
      passwordHash: hashPassword("adminpassword123"),
    },
  });

  await prisma.user.create({
    data: {
      email: "operator@orbital.command",
      name: "Flight Controller (Operator)",
      role: "OPERATOR",
      passwordHash: hashPassword("operatorpassword123"),
    },
  });

  await prisma.user.create({
    data: {
      email: "viewer@orbital.command",
      name: "Mission Observer (Viewer)",
      role: "VIEWER",
      passwordHash: hashPassword("viewerpassword123"),
    },
  });

  // 3. Seed Constellations
  console.log("🌌 Seeding constellations...");
  for (const c of constellations) {
    await prisma.constellation.create({
      data: {
        id: c.id,
        name: c.name,
        healthScore: c.healthScore,
      },
    });
  }

  // 4. Seed Ground Stations
  console.log("🗼 Seeding ground stations...");
  for (const gs of groundStations) {
    await prisma.groundStation.create({
      data: {
        id: gs.id,
        name: gs.name,
        latitude: gs.latitude,
        longitude: gs.longitude,
        status: gs.status,
        latency: gs.latency,
        throughput: gs.throughput,
      },
    });
  }

  // 5. Seed Satellites
  console.log("🛰️ Seeding satellites...");
  for (const sat of satellites) {
    await prisma.satellite.create({
      data: {
        id: sat.id,
        name: sat.name,
        status: sat.status,
        orbit: sat.orbit,
        velocity: sat.velocity,
        altitude: sat.altitude,
        fuel: sat.fuel,
        battery: sat.battery,
        temperature: sat.temperature,
        signalStrength: sat.signalStrength,
        cpuUsage: sat.cpuUsage,
        solarOutput: sat.solarOutput,
        constellationId: sat.constellationId,
      },
    });
  }

  // 6. Seed Alerts
  console.log("🚨 Seeding initial alerts...");
  for (const alert of alerts) {
    await prisma.alert.create({
      data: {
        id: alert.id,
        satelliteId: alert.satelliteId,
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        message: alert.message,
        createdAt: alert.createdAt,
      },
    });
  }

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
