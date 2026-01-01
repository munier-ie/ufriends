import { NextResponse, NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { verifyAccessToken } from "@/lib/jwt"
// Arcjet protection removed from middleware to save size.
// APIs should use lib/security.ts for protection.

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // NextAuth token (for page guards and accepted for APIs)
  const secret = process.env.NEXTAUTH_SECRET
  const sessionToken = await getToken({ req, secret }).catch(() => null)

  // Page guards: admin and dashboard require NextAuth session
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    if (sessionToken) return NextResponse.next()
    const loginUrl = new URL("/login", req.url)
    // Preserve destination
    loginUrl.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  // API guards: require NextAuth session OR Bearer access token
  // EXCEPT for webhooks which handle their own security
  if (pathname.startsWith("/api/wallet/webhook")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/wallet")) {
    if (sessionToken) return NextResponse.next()
    const authHeader = req.headers.get("authorization") || ""
    const [, bearer] = authHeader.split(" ")
    if (authHeader.toLowerCase().startsWith("bearer ") && bearer) {
      try {
        await verifyAccessToken(bearer)
        return NextResponse.next()
      } catch { }
    }
    return NextResponse.json({ error: "Authentication required", code: "UNAUTHORIZED" }, { status: 401 })
  }

  // Otherwise pass through
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/:path*",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
}