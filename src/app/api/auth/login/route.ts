import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth-utils";
import { writeAuditLog } from "@/lib/audit-logger";
import { findMockUserByEmail } from "@/lib/mock-users";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    let user: any = null;
    let authSuccess = false;
    let source = "database";

    // 1. Attempt DB verification
    try {
      await prisma.$connect();
      const dbUser = await prisma.user.findUnique({
        where: { email },
      });

      if (dbUser && verifyPassword(password, dbUser.passwordHash)) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        };
        authSuccess = true;
      }
    } catch (e) {
      console.warn("⚠️ Authentication DB lookup failed. Relying on offline mock credentials registry.");
      source = "mock_fallback";
    }

    // 2. Mock fallback verification if database was offline or user not found there
    if (!authSuccess) {
      // If db search returned nothing or threw error, check mock registry
      const mockUser = findMockUserByEmail(email);
      if (mockUser && verifyPassword(password, mockUser.passwordHash)) {
        user = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        };
        authSuccess = true;
        source = "mock_fallback";
      }
    }

    if (!authSuccess || !user) {
      return NextResponse.json(
        { error: "Invalid operational credentials." },
        { status: 401 }
      );
    }

    // 3. Sign secure token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // 4. Log audit log
    await writeAuditLog(
      user.id,
      "USER_LOGIN",
      `Console authentication success. Operator role: ${user.role} (${source})`
    );

    const response = NextResponse.json({
      success: true,
      user,
      source,
    });

    // 5. Set HTTP-only auth token cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
