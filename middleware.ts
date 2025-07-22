import { verifyToken } from "@/lib/auth"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const publicPaths = ["/login", "/register", "/api/auth/login", "/api/auth/register"]
const authPaths = ["/login", "/register"]

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow public paths
    if (publicPaths.includes(pathname)) {
        return NextResponse.next()
    }

    // Allow static files
    if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth") || pathname.includes(".")) {
        return NextResponse.next()
    }

    const token = request.cookies.get("auth-token")?.value
    const user = token ? verifyToken(token) : null

    // If user is not authenticated, redirect to login
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    // If user is authenticated and trying to access auth pages, redirect to trackers
    if (authPaths.includes(pathname)) {
        return NextResponse.redirect(new URL("/trackers", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}
