import { NextResponse } from "next/server"
import { protect } from "@/lib/security"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { verifyRefreshToken } from "@/lib/jwt"

// Arcjet protection via shared helper

const schema = z.object({ refreshToken: z.string().min(10) }).partial()

export async function POST(req: Request) {
  // Apply Arcjet Shield via shared helper to mitigate automated logout abuse
  const sec = await protect(req as any)
  if (!sec.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Attempt to revoke provided refresh token (optional)
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (parsed.success && parsed.data.refreshToken) {
      try {
        const payload: any = await verifyRefreshToken(parsed.data.refreshToken)
        const jti = payload.jti as string | undefined
        const userId = payload.sub as string | undefined
        if (jti && userId) {
          const record = await prisma.refreshToken.findUnique({ where: { tokenId: jti } })
          if (record && record.userId === userId && !record.revokedAt) {
            await prisma.refreshToken.update({ where: { tokenId: jti }, data: { revokedAt: new Date() } })
          }
        }
      } catch {}
    }
  } catch {}

  const res = NextResponse.json({ ok: true })
  // Clear NextAuth cookies to effectively log out
  res.cookies.set("next-auth.session-token", "", { path: "/", maxAge: 0 })
  res.cookies.set("__Secure-next-auth.session-token", "", { path: "/", maxAge: 0, secure: true })
  res.cookies.set("next-auth.csrf-token", "", { path: "/", maxAge: 0 })
  res.cookies.set("__Secure-next-auth.csrf-token", "", { path: "/", maxAge: 0, secure: true })

  return res
}