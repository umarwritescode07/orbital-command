import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groundStations as fallbackStations } from "@/lib/mock-data";

export async function GET() {
  try {
    try {
      await prisma.$connect();
      const dbStations = await prisma.groundStation.findMany({
        orderBy: { id: "asc" },
      });
      
      if (dbStations.length > 0) {
        return NextResponse.json({
          source: "database",
          data: dbStations,
        });
      }
    } catch (e) {
      console.warn("⚠️ Ground Station Database unreachable. Serving mock ground networks.");
    }

    return NextResponse.json({
      source: "mock_fallback",
      data: fallbackStations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
