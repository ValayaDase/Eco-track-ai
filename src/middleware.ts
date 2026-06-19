import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "ecotrack_session";

// Define paths that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/tracker",
  "/simulator",
  "/recommendations",
  "/challenges",
  "/reports",
  "/leaderboard",
  "/settings",
  "/profile",
];

// Define auth paths
const AUTH_ROUTES = ["/login", "/signup"];

// Helper to decode JWT payload in edge runtime (no jsonwebtoken package dependency)
function getJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as { userId: string; email: string; profileCompleted?: boolean };
  } catch (error) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? getJwtPayload(token) : null;

  // 1. User is NOT authenticated
  if (!payload) {
    // Check if the user is trying to access a protected route
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
    if (isProtectedRoute) {
      const loginUrl = new URL("/login", request.url);
      // Optional: keep redirect query
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. User IS authenticated
  // Prevent logged-in users from accessing login/signup
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Enforce profile setup completion
  const profileCompleted = payload.profileCompleted;

  if (!profileCompleted && pathname !== "/profile") {
    // If profile is not completed and user is not on /profile, redirect to /profile
    // Except let them access api routes or static assets (handled by matcher anyway)
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  if (profileCompleted && pathname === "/profile") {
    // If profile is completed and trying to access /profile setup wizard, redirect to /dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder assets like icons, images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)",
  ],
};
