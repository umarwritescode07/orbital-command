import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const tokenCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("auth_token="));

    if (!tokenCookie) {
      return NextResponse.json({ user: null });
    }

    const token = tokenCookie.split("=")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      // Token exists but is invalid or expired, clear it
      const response = NextResponse.json({ user: null });
      response.cookies.set("auth_token", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
      });
      return response;
    }

    return NextResponse.json({
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
