import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth-utils";
import { writeAuditLog } from "@/lib/audit-logger";
import { addMockUser, findMockUserByEmail } from "@/lib/mock-users";

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required." },
        { status: 400 }
      );
    }

    if (!["ADMIN", "OPERATOR", "VIEWER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role specified." },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    let user: any = null;
    let source = "database";
    let isDuplicate = false;

    // 1. Attempt to write to PostgreSQL Database
    try {
      await prisma.$connect();
      
      // Check duplicate
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        isDuplicate = true;
      } else {
        const dbUser = await prisma.user.create({
          data: {
            email,
            name,
            role,
            passwordHash,
          },
        });
        
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        };
      }
    } catch (e) {
      console.warn("⚠️ Registration DB write failed. Relying on offline mock credentials registry.");
      source = "mock_fallback";
    }

    // 2. Handle DB duplicate response
    if (isDuplicate) {
      return NextResponse.json(
        { error: "An operator with this email is already registered." },
        { status: 400 }
      );
    }

    // 3. Mock fallback registration
    if (source === "mock_fallback") {
      const existingMock = findMockUserByEmail(email);
      if (existingMock) {
        return NextResponse.json(
          { error: "An operator with this email is already registered in fallback memory." },
          { status: 400 }
        );
      }

      const mockId = `usr-mock-${Math.floor(1000 + Math.random() * 9000)}`;
      addMockUser({
        id: mockId,
        email,
        name,
        role,
        passwordHash,
      });

      user = {
        id: mockId,
        email,
        name,
        role,
      };
    }

    // 4. Log audit event
    await writeAuditLog(
      user.id,
      "USER_REGISTERED",
      `New console operator profile registered. Name: ${user.name}, Role: ${user.role} (${source})`
    );

    // 5. Generate secure token for automatic session login after registration
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user,
      source,
    });

    // 6. Set auth token cookie
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
