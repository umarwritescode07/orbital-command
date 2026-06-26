import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import next from "next";

import { satellites } from "./src/lib/mock-data";
import { redis } from "./src/lib/redis";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = http.createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Background Telemetry Simulation State Buffer
  const activeStates = satellites.map((sat) => ({
    id: sat.id,
    battery: sat.battery,
    temperature: sat.temperature,
    fuel: sat.fuel,
    cpuUsage: sat.cpuUsage,
    signalStrength: sat.signalStrength,
    solarOutput: sat.solarOutput,
  }));

  // Background loop ticking every 1 second
  setInterval(async () => {
    const pipeline = redis.pipeline();
    const latestTelemetry: Record<string, string> = {};
    const timestamp = new Date().toISOString();

    activeStates.forEach((sat) => {
      if (sat.battery <= 0) return; // Decommissioned/Dead satellite

      // Telemetry Random Walk Simulation
      sat.battery = Math.max(0, Math.min(100, sat.battery + (Math.random() * 0.4 - 0.2)));
      sat.temperature = Math.max(-50, Math.min(125, sat.temperature + (Math.random() * 2.0 - 1.0)));
      sat.cpuUsage = Math.max(5, Math.min(95, sat.cpuUsage + (Math.random() * 10 - 5)));
      sat.signalStrength = Math.max(-120, Math.min(-40, sat.signalStrength + Math.floor(Math.random() * 4 - 2)));
      sat.solarOutput = Math.max(0, Math.min(2200, sat.solarOutput + Math.floor(Math.random() * 50 - 25)));
      sat.fuel = Math.max(0, sat.fuel - 0.0003);

      const frame = {
        satelliteId: sat.id,
        battery: parseFloat(sat.battery.toFixed(1)),
        temperature: parseFloat(sat.temperature.toFixed(1)),
        fuel: parseFloat(sat.fuel.toFixed(3)),
        cpuUsage: parseFloat(sat.cpuUsage.toFixed(1)),
        signalStrength: sat.signalStrength,
        solarOutput: sat.solarOutput,
        timestamp,
      };

      // Cache raw frame in our latest stringified updates map
      latestTelemetry[sat.id] = JSON.stringify(frame);

      // WebSocket Optimization: ONLY broadcast individual telemetry frames to clients
      // that are actively listening in the satellite's room, and only write history for those.
      const roomName = `satellite:${sat.id}`;
      const listenerCount = io.sockets.adapter.rooms.get(roomName)?.size ?? 0;
      
      if (listenerCount > 0) {
        io.to(roomName).emit("telemetry:frame", frame);
        
        // Pipelined Redis log write for operators currently viewing/recording this stream
        const historyKey = `satellite:${sat.id}:history`;
        pipeline.lpush(historyKey, JSON.stringify(frame));
        pipeline.ltrim(historyKey, 0, 49); // Keep rolling sliding window of 50 logs
      }
    });

    // Pipelined Redis hash write to sync all 1,000 live states in O(1)
    if (Object.keys(latestTelemetry).length > 0) {
      pipeline.hset("telemetry:latest", latestTelemetry);
    }

    try {
      await pipeline.exec();
    } catch (redisErr) {
      console.warn("⚠️ Telemetry cache pipeline sync failed:", redisErr);
    }
  }, 1000);

  // Throttled Global Overview loop: emit status updates every 2.5 seconds to reduce bandwidth
  setInterval(() => {
    // Pack summary compactly containing essential fields only
    const summary = activeStates.map(sat => ({
      id: sat.id,
      battery: parseFloat(sat.battery.toFixed(1)),
      fuel: parseFloat(sat.fuel.toFixed(3)),
      status: sat.battery < 15 ? "ANOMALOUS" : sat.battery === 0 ? "DECOMMISSIONED" : "ACTIVE",
    }));

    io.emit("telemetry:summary", summary);
  }, 2500);

  // Basic WebSocket operations room configuration
  io.on("connection", (socket) => {
    console.log(`🔌 Operator Connected: ${socket.id}`);

    // Join operator to particular streams
    socket.on("join:satellite", (satelliteId: string) => {
      console.log(`📡 Operator ${socket.id} monitoring satellite: ${satelliteId}`);
      socket.join(`satellite:${satelliteId}`);
    });

    socket.on("leave:satellite", (satelliteId: string) => {
      console.log(`📡 Operator ${socket.id} stopped monitoring satellite: ${satelliteId}`);
      socket.leave(`satellite:${satelliteId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Operator Disconnected: ${socket.id}`);
    });
  });

  // Expose socket instance on req object if needed in API endpoints
  expressApp.use((req: any, res, nextStep) => {
    req.io = io;
    nextStep();
  });

  // Handle all requests via Next.js
  expressApp.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> 🚀 Mission Control ready on http://localhost:${port}`);
  });
});
