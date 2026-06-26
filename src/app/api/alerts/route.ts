import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { alerts as fallbackAlerts } from "@/lib/mock-data";
import { AlertStatus, AlertSeverity } from "@/lib/prisma-enums";
import { verifyToken } from "@/lib/auth-utils";
import { writeAuditLog } from "@/lib/audit-logger";

// Retrieve alert list
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity") || "ALL";
    const status = searchParams.get("status") || "ALL";

    try {
      await prisma.$connect();

      const whereClause: any = {};
      if (severity !== "ALL") {
        whereClause.severity = severity as AlertSeverity;
      }
      if (status !== "ALL") {
        whereClause.status = status as AlertStatus;
      }

      const dbAlerts = await prisma.alert.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        source: "database",
        data: dbAlerts,
      });
    } catch (e) {
      console.warn("⚠️ Alerts Database lookup failed. Serving mock operations alerts.");
    }

    // Fallback filter
    let filtered = [...fallbackAlerts];
    if (severity !== "ALL") {
      filtered = filtered.filter((a) => a.severity === severity);
    }
    if (status !== "ALL") {
      filtered = filtered.filter((a) => a.status === status);
    }

    return NextResponse.json({
      source: "mock_fallback",
      data: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// Acknowledge / Update alert status
export async function POST(request: Request) {
  try {
    // 1. Authenticate & authorize operator session
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("auth_token="))
      ?.split("=")[1];

    const user = token ? verifyToken(token) : null;
    
    if (!user || (user.role !== "ADMIN" && user.role !== "OPERATOR")) {
      return NextResponse.json(
        { error: "Access Denied: Unprivileged console access." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { alertId, action } = body; // action: "ACKNOWLEDGE" | "RESOLVE"

    if (!alertId) {
      return NextResponse.json({ error: "Missing alertId parameter" }, { status: 400 });
    }

    const targetStatus = action === "RESOLVE" ? AlertStatus.RESOLVED : AlertStatus.ACKNOWLEDGED;
    let updatedData: any = null;
    let source = "database";

    // 2. Try writing to database
    try {
      await prisma.$connect();

      updatedData = await prisma.alert.update({
        where: { id: alertId },
        data: {
          status: targetStatus,
          acknowledgedAt: targetStatus === AlertStatus.ACKNOWLEDGED ? new Date() : undefined,
        },
      });
    } catch (e) {
      console.warn("⚠️ Alerts Database write failed. Falling back to local memory simulation.");
      source = "mock_fallback";
    }

    // 3. Fallback: update in mock collection
    if (source === "mock_fallback") {
      const mockAlert = fallbackAlerts.find((a) => a.id === alertId);
      if (mockAlert) {
        mockAlert.status = action === "RESOLVE" ? "RESOLVED" : "ACKNOWLEDGED";
        updatedData = mockAlert;
      } else {
        return NextResponse.json({ error: "Alert not found in mock cache" }, { status: 404 });
      }
    }

    // 4. Record operations audit log
    await writeAuditLog(
      user.userId,
      "ALERT_ACKNOWLEDGE",
      `Alert ID ${alertId} set to status: ${targetStatus} (${source})`
    );

    return NextResponse.json({
      source,
      success: true,
      data: updatedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
