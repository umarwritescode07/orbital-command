import { prisma } from "./prisma";

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

// In-memory fallback database for audit logs when PostgreSQL is offline
export const memoryAuditLogs: AuditLogEntry[] = [];

/**
 * Writes a security/operations event to the audit logs.
 * Falls back to in-memory store if DB is unreachable.
 */
export async function writeAuditLog(
  userId: string,
  action: string,
  details: string,
  ipAddress: string = "127.0.0.1"
): Promise<any> {
  const timestamp = new Date().toISOString();
  
  // Format entry for fallback console and memory
  const entry: AuditLogEntry = {
    id: `AUD-${Math.floor(100000 + Math.random() * 900000)}`,
    userId,
    action,
    details,
    ipAddress,
    timestamp,
  };

  console.log(`📡 [AUDIT LOG] [${timestamp}] [USER: ${userId}] [ACTION: ${action}] - ${details}`);

  try {
    // Attempt database write
    await prisma.$connect();
    const dbLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
        timestamp: new Date(timestamp),
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
    
    // Add additional names if retrieved
    if (dbLog.user) {
      entry.userEmail = dbLog.user.email;
      entry.userName = dbLog.user.name || undefined;
    }
    return dbLog;
  } catch (e) {
    // If DB is unreachable, record in memory and mock user metadata
    const mockEmails: Record<string, string> = {
      "usr-mock-admin": "admin@orbital.command",
      "usr-mock-operator": "operator@orbital.command",
      "usr-mock-viewer": "viewer@orbital.command",
    };
    
    const mockNames: Record<string, string> = {
      "usr-mock-admin": "Flight Director (Admin)",
      "usr-mock-operator": "Flight Controller (Operator)",
      "usr-mock-viewer": "Mission Observer (Viewer)",
    };

    entry.userEmail = mockEmails[userId] || "unknown@orbital.command";
    entry.userName = mockNames[userId] || "Unknown Operator";

    memoryAuditLogs.unshift(entry); // Prepend to show latest first
    
    // Keep sliding log window in memory
    if (memoryAuditLogs.length > 500) {
      memoryAuditLogs.pop();
    }
    
    return entry;
  }
}

/**
 * Retrieves audit logs from PostgreSQL or memory fallbacks.
 */
export async function getAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
  try {
    await prisma.$connect();
    const dbLogs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    return dbLogs.map((l) => ({
      id: l.id,
      userId: l.userId,
      userEmail: l.user.email,
      userName: l.user.name || undefined,
      action: l.action,
      details: l.details,
      ipAddress: l.ipAddress || undefined,
      timestamp: l.timestamp.toISOString(),
    }));
  } catch (e) {
    // Return memory fallback
    return memoryAuditLogs.slice(0, limit);
  }
}
