import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Detailed debug logs to help diagnose intermittent failures
    console.log("[middleware] path=", req.nextUrl.pathname)
    console.log("[middleware] method=", req.method)
    console.log("[middleware] sessionExists=", session ? "yes" : "no")
    if (session) console.log("[middleware] user_id=", session.user?.id ?? null)

    // Define protected route prefixes here.
    const protectedPrefixes = ["/dashboard", "/dormers", "/evaluation", "/results", "/settings"]

    const isProtected = protectedPrefixes.some((p) => req.nextUrl.pathname.startsWith(p))

    if (!session && isProtected) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
      console.log("[middleware] redirecting to login from", req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    return res
  } catch (error) {
    console.error("Error checking session in middleware:", error)
    // Fallback: redirect to login if anything goes wrong while checking session
    return NextResponse.redirect(new URL("/login", req.url))
  }
}

export const config = {
  // Limit middleware to only the explicit protected routes. This reduces noise
  // and avoids running the middleware for static assets or unrelated pages.
  matcher: [
    "/dashboard/:path*",
    "/dormers/:path*",
    "/evaluation/:path*",
    "/results/:path*",
    "/settings/:path*",
  ],
}
