import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/db"
import { protect } from "@/lib/security"
import { z } from "zod"
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt"

// Arcjet protection via shared helper

const schema = z.object({ refreshToken: z.string().min(10) })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 422 })
    }

    const sec = await protect(req as any)
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Verify refresh token
    let payload: any
    try {
      payload = await verifyRefreshToken(parsed.data.refreshToken)
    } catch (e) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const jti = payload.jti as string | undefined
    const userId = payload.sub as string | undefined
    if (!jti || !userId) {
      return NextResponse.json({ error: "Malformed token" }, { status: 400 })
    }

    // Check token record
    const record = await prisma.refreshToken.findUnique({ where: { tokenId: jti } })
    if (!record || record.userId !== userId) {
      return NextResponse.json({ error: "Token not recognized" }, { status: 401 })
    }
    if (record.revokedAt) {
      return NextResponse.json({ error: "Token revoked" }, { status: 401 })
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 })
    }

    // Rotate: revoke old and issue new refresh + access
    const newJti = crypto.randomUUID()
    const accessToken = await signAccessToken({ sub: userId, email: payload.email, role: payload.role })
    const refreshToken = await signRefreshToken({ sub: userId, email: payload.email, role: payload.role, jti: newJti })

    const refreshTTLDays = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "7", 10)
    const newExpiresAt = new Date(Date.now() + refreshTTLDays * 24 * 60 * 60 * 1000)

    // Persist rotation in a transaction
    try {
      await prisma.$transaction([
        prisma.refreshToken.update({ where: { tokenId: jti }, data: { revokedAt: new Date() } }),
        prisma.refreshToken.create({
          data: {
            userId,
            tokenId: newJti,
            expiresAt: newExpiresAt,
            ip: (req as any).ip || undefined,
            userAgent: (req as any).headers?.get?.("user-agent") || undefined,
          },
        }),
      ])
    } catch {}

    return NextResponse.json({
      tokens: { accessToken, refreshToken },
      expiresIn: { accessSeconds: 15 * 60, refreshDays: refreshTTLDays },
    })
  } catch (err) {
    return NextResponse.json({ error: "Refresh failed", detail: String(err) }, { status: 500 })
  }
}