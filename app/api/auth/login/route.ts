import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { protect } from "@/lib/security"
import { z } from "zod"
import { sanitizer } from "@/lib/validation"
import { signAccessToken, signRefreshToken } from "@/lib/jwt"

// Arcjet protection via shared helper (with email context)

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
  twoFactorProof: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const raw = await req.json()
    const parsed = loginSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 422 })
    }

    const email = sanitizer.parse(parsed.data.email)
    const password = parsed.data.password

    // Arcjet protections via shared helper
    const sec = await protect(req as any, { email })
    if (!sec.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (user.status === "suspended") {
      return NextResponse.json({ error: "Your account has been suspended. Please contact support." }, { status: 403 })
    }

    // ENFORCE 2FA: If enabled, require proof.
    if (user.totpEnabled) {
      if (!parsed.data.twoFactorProof) {
        return NextResponse.json({
          ok: true,
          requires2FA: true,
          email: user.email,
          message: "2FA verification required"
        })
      }

      // Verify the proof
      try {
        const { verify2FAProof } = await import("@/lib/jwt")
        const proofPayload = await verify2FAProof(parsed.data.twoFactorProof)
        if (proofPayload.sub !== user.id) {
          return NextResponse.json({ error: "Invalid 2FA proof" }, { status: 401 })
        }
      } catch (e) {
        return NextResponse.json({ error: "Expired or invalid 2FA proof" }, { status: 401 })
      }
    }

    // Create tokens
    const jti = crypto.randomUUID()
    const access = await signAccessToken({ sub: user.id, email: user.email, role: user.role })
    const refresh = await signRefreshToken({ sub: user.id, email: user.email, role: user.role, jti })

    // Persist refresh token metadata for revocation tracking
    const refreshTTLDays = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "7", 10)
    const expiresAt = new Date(Date.now() + refreshTTLDays * 24 * 60 * 60 * 1000)
    try {
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenId: jti,
          expiresAt,
          ip: (req as any).ip || undefined,
          userAgent: (req as any).headers?.get?.("user-agent") || undefined,
        },
      })
    } catch { }

    return NextResponse.json({
      user: { id: user.id, email: user.email, role: user.role },
      tokens: { accessToken: access, refreshToken: refresh },
      expiresIn: { accessSeconds: 15 * 60, refreshDays: refreshTTLDays },
    })
  } catch (err) {
    return NextResponse.json({ error: "Login failed", detail: String(err) }, { status: 500 })
  }
}