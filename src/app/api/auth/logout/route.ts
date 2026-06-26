import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-utils";
import { writeAuditLog } from "@/lib/audit-logger";

export async function POST(request: Request) {
  try {
    // Attempt audit logging on logout
    const token = request.headers.get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("auth_token="))
      ?.split("=")[1];

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        await writeAuditLog(
          decoded.userId,
          "USER_LOGOUT",
          "Operator manually terminated operational command deck session."
        );
      }
    }

    const response = NextResponse.json({ success: true, message: "Logged out" });
    
    // Clear cookie
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
