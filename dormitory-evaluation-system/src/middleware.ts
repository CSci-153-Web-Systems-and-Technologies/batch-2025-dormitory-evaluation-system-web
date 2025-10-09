import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("🔐 Session:", session ? "Exists ✅" : "Does not exist ❌")

    if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    return res
  } catch (error) {
    console.error("Error checking session in middleware:", error)
    return NextResponse.redirect(new URL("/login", req.url))
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
