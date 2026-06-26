import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  
  // Protect all core dashboard/operational views
  const isProtectedRoute =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tracker") ||
    pathname.startsWith("/telemetry") ||
    pathname.startsWith("/simulator") ||
    pathname.startsWith("/debris") ||
    pathname.startsWith("/constellations") ||
    pathname.startsWith("/flight-director") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings");

  if (isProtectedRoute) {
    if (!token) {
      // Unauthenticated, redirect to login page
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    
    if (pathname === "/") {
      // Authenticated but on root index page, route directly to main dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (isAuthPage && token) {
    // Already authenticated, redirect away from signin/register to dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes, except auth status endpoints if needed, but we bypass api/* generally)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/tracker/:path*",
    "/telemetry/:path*",
    "/simulator/:path*",
    "/debris/:path*",
    "/constellations/:path*",
    "/flight-director/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
