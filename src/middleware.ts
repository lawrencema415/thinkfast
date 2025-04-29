import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = 
    path === "/" || 
    path === "/login" || 
    path.startsWith("/api/auth/login") || 
    path.startsWith("/_next") || 
    path.startsWith("/static") ||
    path.includes(".");

  // Get the session token from the cookies
  const sessionId = request.cookies.get("sessionId")?.value;

  // Redirect logic
  if (isPublicPath) {
    // If the user is logged in and trying to access a public path, redirect to home
    if (sessionId && path === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // If the user is not logged in and trying to access a protected path, redirect to login
  if (!sessionId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}; 