import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    const pathname = req.nextUrl.pathname;
    console.log("[middleware] path:", pathname);

    if (pathname.startsWith("/evaluator")) {
      const pathSegments = pathname.split("/").filter(Boolean);
      const evaluatorId = pathSegments[1];

      console.log("[middleware] extracted evaluatorId:", evaluatorId);

      if (!evaluatorId) {
        console.warn("[middleware] Missing evaluatorId in dynamic route");
        return NextResponse.redirect(new URL("/", req.url));
      }

      const { data: evaluator, error } = await supabase
        .from("period_evaluators")
        .select("id, evaluator_status")
        .eq("id", evaluatorId)
        .maybeSingle();

      console.log("[middleware] evaluator lookup:", evaluator, error);

      if (error || !evaluator) {
        return NextResponse.redirect(new URL("/", req.url));
      }

      if (evaluator.evaluator_status === "completed") {
        return NextResponse.redirect(new URL("/", req.url));
      }

      return res; 
    }

    const protectedPrefixes = [
      "/dashboard",
      "/dormers",
      "/evaluation",
      "/results",
      "/settings",
    ];

    const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

    if (!session && isProtected) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      console.log("[middleware] redirect → login");
      return NextResponse.redirect(loginUrl);
    }

    return res;
  } catch (err) {
    console.error("[middleware] unexpected error", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dormers/:path*",
    "/evaluation/:path*",
    "/results/:path*",
    "/settings/:path*",
    "/evaluator/:path*"
  ],
};
